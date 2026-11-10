import { useEffect, useState, useCallback } from "react";
import RollingBetaChart from "./components/RollingBetaChart";

interface DataPoint {
  date: string;
  beta: number | null;
}

type Status = "idle" | "loading" | "success" | "error";

export default function App() {
  const [data, setData] = useState<DataPoint[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");
  const [source, setSource] = useState<string>("");
  const [window, setWindow] = useState<number>(21);
  const [inputWindow, setInputWindow] = useState<string>("21");

  const fetchData = useCallback(async (win: number) => {
    setStatus("loading");
    setError("");
    try {
      const res = await fetch(`/api/rolling-beta?window=${win}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.status !== "ok") throw new Error(json.message ?? "Unknown error");
      setData(json.data);
      setSource(json.source ?? "");
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    fetchData(window);
  }, [fetchData, window]);

  const handleWindowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(inputWindow, 10);
    if (!isNaN(parsed) && parsed >= 5 && parsed <= 252) {
      setWindow(parsed);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "1280px" }}>
        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <form onSubmit={handleWindowSubmit} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ color: "#aaa", fontSize: 13 }}>Rolling window (days):</label>
            <input
              type="number"
              min={5}
              max={252}
              value={inputWindow}
              onChange={(e) => setInputWindow(e.target.value)}
              style={{ width: 70, padding: "4px 8px", background: "#111", border: "1px solid #444", borderRadius: 4, color: "#fff", fontSize: 13 }}
            />
            <button type="submit" style={{ padding: "4px 14px", background: "#222", color: "#ccc", border: "1px solid #555", borderRadius: 4, cursor: "pointer", fontSize: 13 }}>
              Update
            </button>
          </form>
          {source && (
            <span style={{ fontSize: 12, color: source === "live" ? "#4a4" : "#a84", marginLeft: "auto" }}>
              {source === "live" ? "Live market data" : "Synthetic data (market data unavailable)"}
            </span>
          )}
        </div>

        {/* Chart area */}
        {status === "loading" && (
          <div style={{ color: "#aaa", textAlign: "center", fontSize: 18, marginTop: 80 }}>
            {data.length === 0 ? "Fetching market data…" : "Refreshing…"}
          </div>
        )}
        {status === "error" && (
          <div style={{ color: "#f66", textAlign: "center", marginTop: 60 }}>
            <p style={{ fontSize: 18, marginBottom: 12 }}>Failed to load data</p>
            <p style={{ fontSize: 14, marginBottom: 20, color: "#aaa" }}>{error}</p>
            <button onClick={() => fetchData(window)} style={{ padding: "8px 20px", background: "#222", color: "#fff", border: "1px solid #555", borderRadius: 4, cursor: "pointer" }}>
              Retry
            </button>
          </div>
        )}
        {status === "success" && <RollingBetaChart data={data} window={window} />}
      </div>
    </div>
  );
}
