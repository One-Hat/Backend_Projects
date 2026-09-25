import { useState } from "react";

const BACKEND_URL = "http://localhost:3000";

export default function App() {
  const [urlInput, setUrlInput] = useState("");
  const [shortResult, setShortResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Stats lookup states
  const [statsCode, setStatsCode] = useState("");
  const [statsResult, setStatsResult] = useState(null);
  const [statsError, setStatsError] = useState("");

  // 1. Handle Link Shortening (POST /api/shorten)
  const handleShorten = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setShortResult(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/shorten`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalUrl: urlInput }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Displays Zod validation errors
        setErrorMsg(data.errors?.originalUrl?.[0] || "Failed to shorten URL");
        return;
      }

      setShortResult(data.data);
      setUrlInput("");
    } catch (err) {
      setErrorMsg("Cannot connect to backend server.");
    }
  };

  // 2. Handle Fetching Analytics (GET /api/stats/:code)
  const handleGetStats = async (e) => {
    e.preventDefault();
    setStatsError("");
    setStatsResult(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/stats/${statsCode.trim()}`);
      const data = await res.json();

      if (!res.ok) {
        setStatsError(data.error || "Code not found");
        return;
      }

      setStatsResult(data.data);
    } catch (err) {
      setStatsError("Cannot connect to backend server.");
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", fontFamily: "sans-serif", padding: "0 20px" }}>
      <h1>🔗 Link Shortener</h1>

      {/* --- Section A: Create Short Link --- */}
      <section style={{ border: "1px solid #ddd", padding: "20px", borderRadius: "8px", marginBottom: "30px" }}>
        <h2>Shorten a URL</h2>
        <form onSubmit={handleShorten} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input
            type="text"
            placeholder="https://example.com/very/long/url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            style={{ padding: "10px", fontSize: "16px" }}
          />
          <button type="submit" style={{ padding: "10px", cursor: "pointer", fontWeight: "bold" }}>
            Create Short Link
          </button>
        </form>

        {errorMsg && <p style={{ color: "red", marginTop: "10px" }}>⚠️ {errorMsg}</p>}

        {shortResult && (
          <div style={{ marginTop: "15px", background: "#eef9ff", padding: "12px", borderRadius: "6px" }}>
            <p><strong>Original:</strong> {shortResult.originalUrl}</p>
            <p>
              <strong>Short Link: </strong>
              <a href={shortResult.shortUrl} target="_blank" rel="noreferrer">
                {shortResult.shortUrl}
              </a>
            </p>
            <small>Click the link above to test the redirect!</small>
          </div>
        )}
      </section>

      {/* --- Section B: Track Analytics --- */}
      <section style={{ border: "1px solid #ddd", padding: "20px", borderRadius: "8px" }}>
        <h2>Check Click Stats</h2>
        <form onSubmit={handleGetStats} style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            placeholder="Enter short code (e.g. 7eR_9A)"
            value={statsCode}
            onChange={(e) => setStatsCode(e.target.value)}
            style={{ padding: "10px", flex: 1, fontSize: "16px" }}
          />
          <button type="submit" style={{ padding: "10px 16px", cursor: "pointer" }}>
            Lookup
          </button>
        </form>

        {statsError && <p style={{ color: "red", marginTop: "10px" }}>⚠️ {statsError}</p>}

        {statsResult && (
          <div style={{ marginTop: "15px", background: "#f6f6f6", padding: "12px", borderRadius: "6px" }}>
            <p><strong>Code:</strong> {statsResult.id}</p>
            <p><strong>Total Clicks:</strong> <span style={{ fontSize: "20px", color: "#0066cc", fontWeight: "bold" }}>{statsResult.clicks}</span></p>
            <p><strong>Destination:</strong> {statsResult.originalUrl}</p>
            <p><small>Created: {new Date(statsResult.createdAt).toLocaleString()}</small></p>
          </div>
        )}
      </section>
    </div>
  );
}