import { useEffect, useMemo, useState } from "react";
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from "chart.js";
import { Bar } from "react-chartjs-2";
import { formatCurrency, type Snapshot } from "./core";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

type RiskColors = { low: string; medium: string; high: string; liquid: string; muted: string };

function readRiskColors(): RiskColors {
  const style = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    low: token("--risk-low", "#34d399"),
    medium: token("--risk-medium", "#fbbf24"),
    high: token("--risk-high", "#fb7185"),
    liquid: token("--risk-liquid", "#60a5fa"),
    muted: token("--muted", "#a1a1ad"),
  };
}

export default function MonthlyRiskChart({ snapshots }: { snapshots: Snapshot[] }) {
  // Same pattern as the wellbeing chart: chart.js takes resolved colours, not
  // CSS variables, so they are re-read whenever the theme attribute changes.
  const [colors, setColors] = useState<RiskColors>(readRiskColors);
  useEffect(() => {
    const observer = new MutationObserver(() => setColors(readRiskColors()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-realm"] });
    return () => observer.disconnect();
  }, []);

  const data = useMemo(() => {
    // The API returns newest first; a time axis reads oldest first.
    const ascending = [...snapshots].reverse();
    return {
      labels: ascending.map((s) => s.snapshotDate),
      datasets: [
        { label: "Low", data: ascending.map((s) => s.lowRisk), backgroundColor: colors.low },
        { label: "Medium", data: ascending.map((s) => s.mediumRisk), backgroundColor: colors.medium },
        { label: "High", data: ascending.map((s) => s.highRisk), backgroundColor: colors.high },
        { label: "Liquid", data: ascending.map((s) => s.liquid), backgroundColor: colors.liquid },
      ],
    };
  }, [snapshots, colors]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" as const, labels: { color: colors.muted, boxWidth: 12 } },
      },
      scales: {
        x: {
          stacked: true,
          ticks: { color: colors.muted },
          // rgba(255,255,255,0.08) has no design token; matches the wellbeing chart.
          grid: { color: "rgba(255,255,255,0.08)" },
        },
        y: {
          stacked: true,
          ticks: { color: colors.muted, callback: (value: string | number) => formatCurrency(Number(value)) },
          grid: { color: "rgba(255,255,255,0.08)" },
        },
      },
    }),
    [colors.muted],
  );

  return (
    <div className="h-[260px] min-w-0">
      <Bar data={data} options={options} />
    </div>
  );
}
