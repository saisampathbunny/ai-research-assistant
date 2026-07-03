import { useEffect, useRef, useState } from "react";
import SourcesPanel from "./SourcesPanel.jsx";

// The main chat screen: shows message history (with memory) and lets the
// user ask follow-up questions about the loaded PDF or Wikipedia article.

export default function ChatWindow({ sourceLabel, messages, onSend, onReset }) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function handleSubmit(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setSending(true);
    try {
      await onSend(text);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="chat-card">
      <div className="chat-header">
        <div>
          <div className="chat-source-label">{sourceLabel}</div>
        </div>
        <button className="link-btn" onClick={onReset}>
          Start over
        </button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="empty-hint">Ask a question to get started. Follow-ups remember earlier context.</p>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="message-bubble">{msg.content}</div>
            {msg.role === "assistant" && <SourcesPanel sources={msg.sources} />}
          </div>
        ))}

        {sending && (
          <div className="message assistant">
            <div className="message-bubble typing">Thinking...</div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-input-row">
        <input
          type="text"
          placeholder="Ask a question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="primary-btn" disabled={sending}>
          Send
        </button>
      </form>
    </div>
  );
}
