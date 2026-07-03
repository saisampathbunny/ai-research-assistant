// Small wrapper around fetch() so components don't repeat URLs everywhere.

const BASE_URL = "http://localhost:8000";

export async function createSession() {
  const res = await fetch(`${BASE_URL}/api/session/new`, { method: "POST" });
  return res.json();
}

export async function uploadPdf(sessionId, file) {
  const formData = new FormData();
  formData.append("session_id", sessionId);
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/api/pdf/upload`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to upload PDF");
  return data;
}

export async function loadWikipedia(sessionId, topic) {
  const res = await fetch(`${BASE_URL}/api/wikipedia/load`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, topic }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to load Wikipedia article");
  return data;
}

export async function sendChatMessage(sessionId, message) {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, message }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to get an answer");
  return data;
}
