import React, { type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Errore inatteso durante il rendering.'
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Casadibari] Errore durante il rendering React:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '32px 20px', background: '#f5f9f5', color: '#18251c', fontFamily: 'Roboto, Arial, sans-serif' }}>
          <section style={{ width: 'min(100%, 640px)', padding: '36px', border: '1px solid #dfe9df', borderRadius: '18px', background: '#fff', boxShadow: '0 12px 38px rgba(20, 42, 24, .08)' }}>
            <img src="/casadibari-logo.svg" alt="Casadibari Immobiliare" style={{ width: '190px', maxWidth: '100%', marginBottom: '24px' }} />
            <p style={{ margin: '0 0 8px', color: '#218337', fontSize: '12px', letterSpacing: '2px', fontWeight: 800, textTransform: 'uppercase' }}>Casadibari · diagnostica</p>
            <h1 style={{ margin: '0 0 12px', fontSize: '28px', lineHeight: 1.2 }}>La pagina ha incontrato un errore.</h1>
            <p style={{ margin: '0 0 18px', color: '#566359', lineHeight: 1.65 }}>L’applicazione non è riuscita a visualizzare un componente. Il messaggio seguente aiuta a individuare il problema; non indica necessariamente un errore nelle chiavi Supabase.</p>
            <pre style={{ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap', padding: '14px', borderRadius: '9px', color: '#872c2c', background: '#fff1f1', border: '1px solid #f1d5d5', fontSize: '13px', lineHeight: 1.5 }}>{this.state.message}</pre>
            <button type="button" onClick={() => window.location.reload()} style={{ marginTop: '10px', minHeight: '46px', border: 0, borderRadius: '9px', padding: '0 20px', color: '#fff', background: '#35a94a', fontWeight: 700, cursor: 'pointer' }}>Ricarica la piattaforma</button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}