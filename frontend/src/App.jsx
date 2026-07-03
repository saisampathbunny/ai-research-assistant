import { useState } from "react";
import ModeSelect from "./components/ModeSelect.jsx";
import SourceLoader from "./components/SourceLoader.jsx";
import ChatWindow from "./components/ChatWindow.jsx";
import { createSession, uploadPdf, loadWikipedia, sendChatMessage } from "./api.js";

// App has 3 screens: "select" mode -> "load" a source -> "chat".
// `messages` lives here (not in ChatWindow) so history isn't lost between
// re-renders, and so the backend session_id stays tied to one conversation.

export default function App() {
  const [screen, setScreen] = useState("select");
  const [mode, setMode] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [sourceLabel, setSourceLabel] = useState("");
  const [messages, setMessages] = useState([]);

  function handleSelectMode(selectedMode) {
    setMode(selectedMode);
    setScreen("load");
  }

  async function handleLoaded(payload) {
    const { session_id } = await createSession();

    if (payload.type === "pdf") {
      const result = await uploadPdf(session_id, payload.file);
      setSourceLabel(`📄 ${payload.file.name} (${result.num_chunks} chunks)`);
    } else {
      const result = await loadWikipedia(session_id, payload.topic);
      setSourceLabel(`🌐 ${result.message.replace("Loaded ", "")} (${result.num_chunks} chunks)`);
    }

    setSessionId(session_id);
    setMessages([]);
    setScreen("chat");
  }

  async function handleSend(text) {
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    try {
      const result = await sendChatMessage(sessionId, text);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.answer, sources: result.sources },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ ${err.message}`, sources: [] },
      ]);
    }
  }

  function handleReset() {
    setScreen("select");
    setMode(null);
    setSessionId(null);
    setSourceLabel("");
    setMessages([]);
  }

  return (
    <div className="app-shell">
      {screen === "select" && <ModeSelect onSelect={handleSelectMode} />}

      {screen === "load" && (
        <SourceLoader mode={mode} onLoaded={handleLoaded} onBack={() => setScreen("select")} />
      )}

      {screen === "chat" && (
        <ChatWindow
          sourceLabel={sourceLabel}
          messages={messages}
          onSend={handleSend}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
