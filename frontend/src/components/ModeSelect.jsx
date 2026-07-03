// The very first screen: let the user pick which RAG mode to use.

export default function ModeSelect({ onSelect }) {
  return (
    <div className="card centered">
      <h1>AI Research Assistant</h1>
      <p className="subtitle">Choose a mode to get started</p>

      <div className="mode-grid">
        <button className="mode-card" onClick={() => onSelect("pdf")}>
          <span className="mode-icon">📄</span>
          <span className="mode-title">PDF Bot</span>
          <span className="mode-desc">Upload a PDF and chat with its contents</span>
        </button>

        <button className="mode-card" onClick={() => onSelect("wikipedia")}>
          <span className="mode-icon">🌐</span>
          <span className="mode-title">Wikipedia Bot</span>
          <span className="mode-desc">Pick a topic and chat with its Wikipedia article</span>
        </button>
      </div>
    </div>
  );
}
