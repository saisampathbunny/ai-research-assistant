import { useState } from "react";

// Second screen: depending on the mode, either upload a PDF or type a topic.
// Once loading succeeds, the parent switches to the chat screen.

export default function SourceLoader({ mode, onLoaded, onBack }) {
  const [file, setFile] = useState(null);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (mode === "pdf" && !file) {
      setError("Please choose a PDF file first.");
      return;
    }
    if (mode === "wikipedia" && !topic.trim()) {
      setError("Please type a topic first.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "pdf") {
        await onLoaded({ type: "pdf", file });
      } else {
        await onLoaded({ type: "wikipedia", topic });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card centered">
      <button className="link-btn" onClick={onBack}>
        ← Back
      </button>

      <h2>{mode === "pdf" ? "Upload a PDF" : "Pick a Wikipedia topic"}</h2>

      <form onSubmit={handleSubmit} className="loader-form">
        {mode === "pdf" ? (
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
          />
        ) : (
          <input
            type="text"
            placeholder="e.g. Alan Turing"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        )}

        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? "Loading..." : "Start Chat"}
        </button>
      </form>

      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
