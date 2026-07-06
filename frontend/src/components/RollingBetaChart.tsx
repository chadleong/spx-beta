import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartData,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useMemo } from "react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface DataPoint {
  date: string;
  beta: number | null;
}

interface Props {
  data: DataPoint[];
  window: number;
}

const GREEN = "#22c55e";
const RED = "#ef4444";
const NEUTRAL = "#888";

export default function RollingBetaChart({ data, window }: Props) {
  const labels = useMemo(() => data.map((d) => d.date), [data]);
  const values = useMemo(() => data.map((d) => d.beta), [data]);

  // Current beta and 21-day trend (compare last valid point to 21 points ago)
  const { currentBeta, trendDir, trendDelta } = useMemo(() => {
    const valid = data.filter((d) => d.beta !== null);
    if (valid.length < 2) return { currentBeta: null, trendDir: 0, trendDelta: 0 };
    const current = valid[valid.length - 1].beta!;
    const lookback = Math.min(21, valid.length - 1);
    const past = valid[valid.length - 1 - lookback].beta!;
    const delta = current - past;
    return { currentBeta: current, trendDir: delta > 0 ? 1 : delta < 0 ? -1 : 0, trendDelta: delta };
  }, [data]);

  const chartData: ChartData<"line"> = {
    labels,
    datasets: [
      {
        label: "Beta",
        data: values as number[],
        borderColor: GREEN, // fallback; segment overrides per-segment
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        segment: { borderColor: (ctx: any) => ((ctx.p0.parsed.y + ctx.p1.parsed.y) / 2 >= 0 ? GREEN : RED) },
        backgroundColor: "transparent",
        borderWidth: 1.8,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: "#fff",
        tension: 0.15,
        spanGaps: true,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2.2,
    animation: { duration: 300 },
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: `${window}-Day Rolling Beta of SPX vs 10-Year Yield Changes`,
        color: "#ffffff",
        font: { size: 15, weight: "normal", family: "'Segoe UI', sans-serif" },
        padding: { top: 4, bottom: 24 },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(10,10,10,0.92)",
        titleColor: "#aaa",
        bodyColor: "#fff",
        borderColor: "#333",
        borderWidth: 1,
        padding: 10,
        callbacks: {
          title: (items) => items[0]?.label ?? "",
          label: (ctx) =>
            ctx.parsed.y != null ? `Beta: ${ctx.parsed.y.toFixed(3)}` : "Beta: N/A",
          labelColor: (ctx) => ({
            borderColor: "transparent",
            backgroundColor: ctx.parsed.y >= 0 ? GREEN : RED,
            borderRadius: 2,
          }),
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#888",
          maxRotation: 0,
          autoSkip: false,
          callback: function (_val, index) {
            const date = labels[index];
            if (!date) return "";
            const d = new Date(date);
            if (index === 0) return String(d.getFullYear());
            const prev = new Date(labels[index - 1]);
            if (d.getFullYear() !== prev.getFullYear()) return String(d.getFullYear());
            return "";
          },
        },
        grid: { color: "rgba(255,255,255,0.07)", lineWidth: 1 },
        border: { color: "#222", display: false },
      },
      y: {
        position: "left",
        title: {
          display: true,
          text: "Beta",
          color: "#888",
          font: { size: 12 },
          padding: { bottom: 8 },
        },
        ticks: { color: "#888", maxTicksLimit: 9 },
        grid: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          color: (ctx: any) =>
            ctx.tick.value === 0 ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.07)",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          lineWidth: (ctx: any) => (ctx.tick.value === 0 ? 2 : 1),
        },
        border: { color: "#222", display: false, dash: [4, 4] },
      },
    },
  };

  const trendColor = trendDir > 0 ? GREEN : trendDir < 0 ? RED : NEUTRAL;
  const trendArrow = trendDir > 0 ? "↑" : trendDir < 0 ? "↓" : "→";
  const trendLabel = trendDir > 0 ? "Trending Up" : trendDir < 0 ? "Trending Down" : "Flat";

  return (
    <div style={{ background: "#000", borderRadius: 6, padding: "20px 12px 12px" }}>
      {/* Stats bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        {currentBeta !== null && (
          <StatBox
            label="Current Beta"
            color={currentBeta >= 0 ? GREEN : RED}
            value={`${currentBeta >= 0 ? "+" : ""}${currentBeta.toFixed(3)}`}
          />
        )}
        <StatBox
          label="21-Day Trend"
          color={trendColor}
          value={`${trendArrow} ${trendLabel}`}
          sub={`(${trendDelta >= 0 ? "+" : ""}${trendDelta.toFixed(3)})`}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginLeft: "auto", paddingRight: 4 }}>
          <LegendItem color={GREEN} label="Positive beta" />
          <LegendItem color={RED} label="Negative beta" />
        </div>
      </div>

      <Line data={chartData} options={options} />
      <p style={{ color: "#333", fontSize: 11, textAlign: "right", marginTop: 6 }}>
        Source: Yahoo Finance — ^GSPC &amp; ^TNX
      </p>
    </div>
  );
}

function StatBox({ label, color, value, sub }: { label: string; color: string; value: string; sub?: string }) {
  return (
    <div style={{
      background: "#0d0d0d",
      border: `1px solid ${color}33`,
      borderRadius: 6,
      padding: "8px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 3,
    }}>
      <span style={{ color: "#555", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ color, fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em" }}>
        {value}
        {sub && <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 6, opacity: 0.6 }}>{sub}</span>}
      </span>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 22, height: 2, background: color, borderRadius: 1 }} />
      <span style={{ color: "#555", fontSize: 11 }}>{label}</span>
    </div>
  );
}
