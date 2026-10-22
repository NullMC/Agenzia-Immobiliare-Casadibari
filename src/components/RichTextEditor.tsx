import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { Node, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import {
  Bold,
  Heading2,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
} from 'lucide-react';

const InlineArticleImage = Node.create({
  name: 'articleImage',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: '' },
      title: { default: '' },
    };
  },
  parseHTML() {
    return [{ tag: 'img[src]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes({ loading: 'lazy' }, HTMLAttributes)];
  },
});

function safeLink(value: string) {
  const candidate = value.trim();
  if (candidate.startsWith('/') && !candidate.startsWith('//')) return candidate;
  try {
    const url = new URL(candidate);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export default function RichTextEditor({
  value,
  onChange,
  label = 'Descrizione formattata',
  onImageUpload,
}: {
  value: string;
  onChange: (html: string) => void;
  label?: string;
  onImageUpload?: (file: File) => Promise<string>;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true }),
      InlineArticleImage,
    ],
    content: value || '<p></p>',
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
    editorProps: {
      attributes: {
        class: 'rich-editor__canvas',
        'aria-label': label,
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value || '<p></p>', false);
  }, [editor, value]);

  async function addImage(file?: File) {
    if (!file || !onImageUpload || !editor) return;
    setUploadBusy(true);
    try {
      const url = await onImageUpload(file);
      const safe = safeLink(url);
      if (!safe) throw new Error('L’indirizzo dell’immagine non è valido.');
      editor.chain().focus().insertContent({
        type: 'articleImage',
        attrs: { src: safe, alt: file.name.replace(/\.[^.]+$/, '') },
      }).run();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Caricamento immagine non riuscito.');
    } finally {
      setUploadBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  if (!editor) return <div className="rich-editor__loading">Caricamento editor…</div>;

  return (
    <div className="rich-editor">
      <div className="rich-editor__toolbar" role="toolbar" aria-label="Formattazione testo">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'is-active' : ''}
          aria-label="Grassetto"
          title="Grassetto"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'is-active' : ''}
          aria-label="Corsivo"
          title="Corsivo"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
          aria-label="Titolo"
          title="Titolo di sezione"
        >
          <Heading2 size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'is-active' : ''}
          aria-label="Elenco puntato"
          title="Elenco puntato"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'is-active' : ''}
          aria-label="Elenco numerato"
          title="Elenco numerato"
        >
          <ListOrdered size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'is-active' : ''}
          aria-label="Citazione"
          title="Citazione"
        >
          <Quote size={16} />
        </button>
        <button
          type="button"
          onClick={() => {
            const url = window.prompt('Inserisci l’indirizzo del link (https://...)');
            if (url === null) return;
            if (!url.trim()) {
              editor.chain().focus().unsetLink().run();
              return;
            }
            const href = safeLink(url);
            if (!href) {
              window.alert('Inserisci un link HTTP, HTTPS o un percorso interno valido.');
              return;
            }
            editor.chain().focus().setLink({ href }).run();
          }}
          aria-label="Inserisci link"
          title="Inserisci o modifica link"
        >
          <LinkIcon size={16} />
        </button>
        {onImageUpload && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              hidden
              aria-label="Scegli immagine per il testo"
              onChange={(event) => void addImage(event.target.files?.[0])}
            />
            <button
              type="button"
              disabled={uploadBusy}
              onClick={() => inputRef.current?.click()}
              title="Carica e inserisci immagine"
              aria-label={uploadBusy ? 'Caricamento immagine…' : 'Inserisci immagine'}
            >
              <ImagePlus size={16} />
            </button>
          </>
        )}
        <span className="rich-editor__spacer" />
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          aria-label="Annulla"
        >
          <Undo size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          aria-label="Ripeti"
        >
          <Redo size={16} />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
