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

export default function RollingBetaChart({ data, window }: Props) {
  const labels = useMemo(() => data.map((d) => d.date), [data]);
  const values = useMemo(() => data.map((d) => d.beta), [data]);

  const chartData: ChartData<"line"> = {
    labels,
    datasets: [
      {
        label: "Beta",
        data: values as number[],
        borderColor: "#bb44bb",
        backgroundColor: "transparent",
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 3,
        pointHoverBackgroundColor: "#dd66dd",
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
            // Show year label on the first trading day of each year
            if (index === 0) return String(d.getFullYear());
            const prev = new Date(labels[index - 1]);
            if (d.getFullYear() !== prev.getFullYear()) return String(d.getFullYear());
            return "";
          },
        },
        grid: {
          color: "rgba(255,255,255,0.07)",
          lineWidth: 1,
        },
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
        ticks: {
          color: "#888",
          maxTicksLimit: 9,
        },
        grid: {
          color: "rgba(255,255,255,0.07)",
          lineWidth: 1,
        },
        border: { color: "#222", display: false, dash: [4, 4] },
      },
    },
  };

  return (
    <div style={{ background: "#000", borderRadius: 6, padding: "20px 12px 12px" }}>
      <Line data={chartData} options={options} />
      <p style={{ color: "#333", fontSize: 11, textAlign: "right", marginTop: 6 }}>
        Source: Yahoo Finance — ^GSPC &amp; ^TNX
      </p>
    </div>
  );
}
