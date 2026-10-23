import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ImagePlus, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { Button } from '@mui/material';
import RichTextEditor from './RichTextEditor';
import { supabase } from '../lib/supabase';
import type { BlogArticle } from '../types';

type ArticleForm = Pick<
  BlogArticle,
  'title' | 'slug' | 'excerpt' | 'category' | 'body_html' | 'cover_image_url' | 'published'
> & {
  /** Zero means append at the end of the article list. */
  position: number;
};

const emptyForm: ArticleForm = {
  title: '',
  slug: '',
  excerpt: '',
  category: 'Consigli per vendere',
  body_html: '<p></p>',
  cover_image_url: '',
  published: false,
  position: 0,
};

function slugify(value: string) {
  return value.toLocaleLowerCase('it-IT')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function safeImageUrl(value: string) {
  if (!value.trim()) return true;
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export default function AdminArticles() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ArticleForm>({ ...emptyForm });
  const [message, setMessage] = useState('');
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('published_at', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) {
      setLoadError(
        'Impossibile caricare gli articoli. Applica prima le migrazioni Supabase del magazine e dell’ordinamento manuale (202610230001_article_manual_order.sql). Dettaglio: ' + error.message,
      );
    } else {
      setLoadError('');
      setArticles((data || []) as BlogArticle[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  function clearForm() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setMessage('');
  }

  function edit(article: BlogArticle) {
    setEditingId(article.id);
    setForm({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      category: article.category,
      body_html: article.body_html,
      cover_image_url: article.cover_image_url,
      published: article.published,
      position: articles.findIndex((item) => item.id === article.id) + 1,
    });
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function uploadImage(file: File) {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type))
      throw new Error('Usa soltanto immagini JPEG, PNG, WEBP o AVIF.');
    if (file.size > 12 * 1024 * 1024)
      throw new Error('La dimensione massima consentita è 12 MB.');
    const extension = file.name.split('.').pop()?.toLowerCase() || 'webp';
    const path = 'magazine/' + crypto.randomUUID() + '.' + extension;
    const { error } = await supabase.storage
      .from('article-images')
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error('Upload non riuscito: ' + error.message);
    return supabase.storage.from('article-images').getPublicUrl(path).data.publicUrl;
  }

  async function uploadCover(file?: File) {
    if (!file) return;
    setCoverUploading(true);
    setMessage('');
    try {
      const url = await uploadImage(file);
      setForm((current) => ({ ...current, cover_image_url: url }));
      setMessage('Copertina caricata. Salva l’articolo per confermare la modifica.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Upload copertina non riuscito.');
    } finally {
      setCoverUploading(false);
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    const slug = slugify(form.slug || form.title);
    if (!slug || !form.title.trim() || !form.excerpt.trim() || !form.body_html.replace(/<[^>]+>/g, '').trim()) {
      setMessage('Inserisci titolo, anteprima e testo dell’articolo.');
      return;
    }
    if (!safeImageUrl(form.cover_image_url.trim())) {
      setMessage('L’indirizzo della copertina deve essere un link HTTP/HTTPS o un percorso interno.');
      return;
    }

    // A moving article is temporarily removed from the choices before we
    // calculate its new insertion point. Drafts are included in this list.
    const othersCount = articles.filter((article) => article.id !== editingId).length;
    const requestedPosition =
      form.position === 0
        ? othersCount + 1
        : Math.max(1, Math.min(form.position, othersCount + 1));

    setSaving(true);
    const old = articles.find((article) => article.id === editingId);
    const payload = {
      slug,
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      category: form.category.trim() || 'Consigli e guide',
      body_html: form.body_html,
      cover_image_url: form.cover_image_url.trim(),
      published: form.published,
      published_at: form.published ? old?.published_at || new Date().toISOString() : null,
    };

    const result = editingId
      ? await supabase.from('articles').update(payload).eq('id', editingId).select('id').single()
      : await supabase.from('articles').insert(payload).select('id').single();

    if (result.error || !result.data?.id) {
      setSaving(false);
      setMessage('Salvataggio non riuscito: ' + (result.error?.message || 'ID articolo non disponibile.'));
      return;
    }

    const savedId = result.data.id as string;
    const { error: positionError } = await supabase.rpc('move_article_to_position', {
      p_article_id: savedId,
      p_position: requestedPosition,
    });
    setSaving(false);

    if (positionError) {
      // Article content has already been saved: keep the form in edit mode so
      // retrying the order won't accidentally create a duplicate article.
      setEditingId(savedId);
      setMessage(
        'Testo salvato, ma non è stato possibile applicare l’ordine: ' +
          positionError.message +
          '. Verifica la migrazione 202610230001_article_manual_order.sql e riprova.',
      );
      await load();
      return;
    }

    clearForm();
    setMessage(
      payload.published
        ? 'Articolo pubblicato e ordine aggiornato.'
        : 'Bozza salvata e ordine aggiornato.',
    );
    await load();
  }

  async function remove(article: BlogArticle) {
    if (!window.confirm('Eliminare definitivamente l’articolo “' + article.title + '”?')) return;
    const { error } = await supabase.from('articles').delete().eq('id', article.id);
    if (error) {
      setMessage('Eliminazione non riuscita: ' + error.message);
      return;
    }
    if (article.id === editingId) clearForm();
    setMessage('Articolo eliminato.');
    await load();
  }

  const otherArticles = articles.filter((article) => article.id !== editingId);
  const positionsCount = otherArticles.length + 1;
  const selectedPosition =
    form.position === 0 ? positionsCount : Math.max(1, Math.min(form.position, positionsCount));

  return (
    <section>
      <div className="admin-section-heading">
        <div>
          <h2>Articoli e guide</h2>
          <p>{articles.length} articoli · {articles.filter((item) => item.published).length} pubblicati. Scegli anche l’ordine delle card nel sito.</p>
        </div>
        <Button type="button" variant="contained" onClick={clearForm} startIcon={<Plus size={16} />}>
          Nuovo articolo
        </Button>
      </div>

      {loadError && <p className="form-feedback form-feedback--error" role="alert">{loadError}</p>}
      {message && <p className="form-feedback" role="status">{message}</p>}

      <form className="admin-editor magazine-admin-editor" onSubmit={(event) => void save(event)}>
        <div className="admin-editor__title">
          <div>
            <span className="eyebrow">{editingId ? 'Modifica articolo' : 'Nuova pubblicazione'}</span>
            <h3>{editingId ? 'Aggiorna il contenuto' : 'Scrivi una nuova guida'}</h3>
          </div>
          {editingId && (
            <button type="button" className="icon-button" onClick={clearForm} aria-label="Annulla modifica"><X size={17} /></button>
          )}
        </div>
        <div className="admin-form-grid">
          <label className="field field--wide">
            <span>Titolo *</span>
            <input
              required
              maxLength={180}
              value={form.title}
              onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
              placeholder="Es. Come preparare casa per la vendita"
            />
          </label>
          <label className="field">
            <span>Categoria</span>
            <input
              maxLength={80}
              value={form.category}
              onChange={(e) => setForm((current) => ({ ...current, category: e.target.value }))}
              placeholder="Consigli per vendere"
            />
          </label>
          <label className="field">
            <span>Ordine di visualizzazione</span>
            <select
              value={selectedPosition}
              onChange={(e) =>
                setForm((current) => ({ ...current, position: Number(e.target.value) }))
              }
              aria-describedby="magazine-position-help"
            >
              {Array.from({ length: positionsCount }, (_, index) => {
                const precedingArticle = otherArticles[index - 1];
                const position = index + 1;
                const description =
                  index === 0
                    ? 'In prima posizione'
                    : index === otherArticles.length
                      ? 'In ultima posizione'
                      : 'Dopo: ' + precedingArticle.title;
                return (
                  <option key={position} value={position}>
                    {position} — {description}
                  </option>
                );
              })}
            </select>
          </label>
          <label className="field field--wide">
            <span>Indirizzo articolo (slug)</span>
            <input
              value={form.slug}
              onChange={(e) => setForm((current) => ({ ...current, slug: slugify(e.target.value) }))}
              placeholder="Generato dal titolo se vuoto"
              aria-describedby="magazine-slug-note"
            />
          </label>
          <label className="field field--wide">
            <span>Anteprima nella card *</span>
            <textarea
              required
              rows={3}
              maxLength={420}
              value={form.excerpt}
              onChange={(e) => setForm((current) => ({ ...current, excerpt: e.target.value }))}
              placeholder="Due o tre frasi che invoglino il lettore ad aprire l’articolo."
            />
          </label>
        </div>
        <small id="magazine-position-help" className="small-note">
          La prima posizione compare per prima in «Guide e consigli» e nell’anteprima della homepage.
          Quando salvi, le altre card si riordinano automaticamente. Le bozze partecipano all’ordine,
          ma non sono visibili ai visitatori.
        </small>
        <small id="magazine-slug-note" className="small-note">
          Per mantenere i collegamenti esistenti, evita di modificare lo slug di un articolo già pubblicato.
        </small>
        <div className="admin-field-block">
          <span className="admin-field-label">Immagine di copertina</span>
          <label className="upload-drop">
            <ImagePlus size={24} />
            <span>
              <strong>{coverUploading ? 'Caricamento in corso…' : 'Carica la copertina'}</strong>
              <small>JPEG, PNG, WEBP o AVIF · massimo 12 MB</small>
            </span>
            <input
              type="file"
              disabled={coverUploading || saving}
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={(e) => void uploadCover(e.target.files?.[0])}
            />
          </label>
          <label className="field magazine-admin-cover-url">
            <span>Oppure URL immagine</span>
            <input
              value={form.cover_image_url}
              onChange={(e) => setForm((current) => ({ ...current, cover_image_url: e.target.value }))}
              placeholder="https://… oppure /immagine.webp"
            />
          </label>
          {form.cover_image_url && safeImageUrl(form.cover_image_url) && (
            <img className="magazine-admin-cover" src={form.cover_image_url} alt="Anteprima copertina" />
          )}
        </div>
        <div className="admin-field-block">
          <span className="admin-field-label">Testo completo dell’articolo *</span>
          <RichTextEditor
            label="Testo dell'articolo"
            value={form.body_html}
            onChange={(body_html) => setForm((current) => ({ ...current, body_html }))}
            onImageUpload={uploadImage}
          />
          <small>Usa titoli, elenchi, grassetto e link. Il pulsante immagine carica una foto su Supabase e la inserisce nel punto selezionato.</small>
        </div>
        <div className="admin-publish-options">
          <label className="check-field">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm((current) => ({ ...current, published: e.target.checked }))}
            />
            <span>
              <strong>Pubblica online</strong>
              <small>Se disattivato, l’articolo resta una bozza visibile solo nel backoffice.</small>
            </span>
          </label>
        </div>
        <div className="admin-form-footer">
          <p>Prima di pubblicare, controlla dati, immagini, diritti d’uso e collegamenti.</p>
          <Button type="submit" variant="contained" size="large" disabled={saving || coverUploading || Boolean(loadError)} startIcon={<Save size={17} />}>
            {saving ? 'Salvataggio…' : editingId ? 'Aggiorna articolo' : 'Salva articolo'}
          </Button>
        </div>
      </form>

      <div className="admin-table-card">
        <div className="admin-table-heading">
          <h3>Articoli nell’ordine del sito</h3><span>{articles.length} totali</span>
        </div>
        {loading ? (
          <p className="admin-loading-inline">Caricamento articoli…</p>
        ) : articles.length ? (
          <div className="magazine-admin-list">
            {articles.map((article, index) => (
              <div className="magazine-admin-item" key={article.id}>
                <img src={article.cover_image_url || '/VetrinaEsterna.webp'} alt="" loading="lazy" />
                <div>
                  <small>Posizione {index + 1} · {article.category}</small>
                  <strong>{article.title}</strong>
                  <span className={'admin-visibility ' + (article.published ? 'is-published' : '')}>
                    {article.published ? 'Pubblicato' : 'Bozza'}
                  </span>
                </div>
                <div className="admin-actions">
                  {article.published && (
                    <Link to={'/guide/' + article.slug} target="_blank" rel="noopener noreferrer" title="Apri articolo" aria-label={'Apri ' + article.title}>
                      <ArrowRight size={17} />
                    </Link>
                  )}
                  <button type="button" onClick={() => edit(article)} title="Modifica articolo" aria-label={'Modifica ' + article.title}><Pencil size={17} /></button>
                  <button type="button" onClick={() => void remove(article)} title="Elimina articolo" aria-label={'Elimina ' + article.title}><Trash2 size={17} /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-empty">Non ci sono ancora articoli. Crea la prima guida con il modulo qui sopra.</div>
        )}
      </div>
    </section>
  );
}
