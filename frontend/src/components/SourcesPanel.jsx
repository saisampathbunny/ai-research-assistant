import { useState } from "react";

// Collapsible list of the source chunks that were retrieved from ChromaDB
// and used to answer a given message. Helps the user verify the answer.

export default function SourcesPanel({ sources }) {
  const [open, setOpen] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="sources-panel">
      <button className="link-btn small" onClick={() => setOpen(!open)}>
        {open ? "Hide sources" : `Show ${sources.length} source chunk(s)`}
      </button>

      {open && (
        <div className="sources-list">
          {sources.map((src, i) => (
            <div key={i} className="source-chunk">
              <div className="source-label">
                {src.metadata?.source || "source"}
                {typeof src.metadata?.chunk_index === "number" && ` · chunk ${src.metadata.chunk_index}`}
              </div>
              <div className="source-text">{src.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
