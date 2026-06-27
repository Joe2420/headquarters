declare global {
  interface Window {
    headquarters?: {
      version?: string;
    };
  }
}

export function App() {
  const version = globalThis.window?.headquarters?.version ?? '0.1.0';

  return (
    <div className="hq-shell">
      <header className="shell-header">
        <div>
          <p className="classification">HEADQUARTERS // DESKTOP SHELL</p>
          <h1>Headquarters</h1>
        </div>
        <dl className="app-meta" aria-label="Application status">
          <div>
            <dt>Version</dt>
            <dd>{version}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>Foundation</dd>
          </div>
        </dl>
      </header>

      <div className="shell-body">
        <nav className="shell-nav" aria-label="Primary">
          <span className="nav-item active">Command</span>
          <span className="nav-item">Missions</span>
          <span className="nav-item">Archive</span>
          <span className="nav-item">Settings</span>
        </nav>

        <main className="shell-main">
          <section className="workspace-panel" aria-label="Main content">
            <p className="section-label">Main Content</p>
            <h2>Command Center</h2>
            <p className="muted">Desktop shell online.</p>
          </section>

          <aside className="status-panel" aria-label="Status area">
            <p className="section-label">Status</p>
            <dl className="status-list">
              <div>
                <dt>HQOS</dt>
                <dd>Ready</dd>
              </div>
              <div>
                <dt>Database</dt>
                <dd>Not connected</dd>
              </div>
              <div>
                <dt>Mode</dt>
                <dd>Local</dd>
              </div>
            </dl>
          </aside>
        </main>
      </div>
    </div>
  );
}
