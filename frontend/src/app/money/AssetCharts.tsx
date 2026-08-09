import { useEffect, useMemo, useState } from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import { formatCurrency, type AssetStats } from "./core";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

type ChartColors = { positive: string; negative: string; muted: string };

function readChartColors(): ChartColors {
  const style = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    positive: token("--risk-low", "#34d399"),
    negative: token("--risk-high", "#fb7185"),
    muted: token("--muted", "#a1a1ad"),
  };
}

// Both charts live in one lazily-loaded module: they always appear together,
// so splitting them would only cost a second request for the same chart.js.
export default function AssetCharts({ visibleAssets }: { visibleAssets: AssetStats[] }) {
  const [colors, setColors] = useState<ChartColors>(readChartColors);
  useEffect(() => {
    const observer = new MutationObserver(() => setColors(readChartColors()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-realm"] });
    return () => observer.disconnect();
  }, []);

  const allocation = useMemo(
    () => ({
      labels: visibleAssets.map((s) => s.asset),
      datasets: [
        {
          label: "Allocation",
          data: visibleAssets.map((s) => s.current),
          backgroundColor: visibleAssets.map((s) => s.color),
          borderWidth: 0,
        },
      ],
    }),
    [visibleAssets],
  );

  const allocationOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" as const, labels: { color: colors.muted, boxWidth: 12 } } },
    }),
    [colors.muted],
  );

  const pnl = useMemo(() => {
    const sorted = [...visibleAssets].sort((a, b) => b.pnl - a.pnl);
    return {
      labels: sorted.map((s) => s.asset),
      datasets: [
        {
          label: "PnL",
          data: sorted.map((s) => s.pnl),
          backgroundColor: sorted.map((s) => (s.pnl >= 0 ? colors.positive : colors.negative)),
        },
      ],
    };
  }, [visibleAssets, colors.positive, colors.negative]);

  const pnlOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: colors.muted }, grid: { color: "rgba(255,255,255,0.08)" } },
        y: {
          ticks: { color: colors.muted, callback: (value: string | number) => formatCurrency(Number(value)) },
          grid: { color: "rgba(255,255,255,0.08)" },
        },
      },
    }),
    [colors.muted],
  );

  return (
    <div className="grid gap-5 grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))]">
      <div className="grid gap-2">
        <span className="text-nano font-bold tracking-[0.16em] uppercase text-muted">Allocation</span>
        <div className="h-[260px]">
          <Pie data={allocation} options={allocationOptions} />
        </div>
      </div>
      <div className="grid gap-2">
        <span className="text-nano font-bold tracking-[0.16em] uppercase text-muted">PnL per asset</span>
        <div className="h-[260px]">
          <Bar data={pnl} options={pnlOptions} />
        </div>
      </div>
    </div>
  );
}
