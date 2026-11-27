"use client";

import { AlertTriangle } from "lucide-react";
import {
  formatCurrency,
  type BreakdownSegment,
} from "@/lib/calculations";

interface MarginBreakdownBarProps {
  price: number;
  segments: BreakdownSegment[];
  isOverBudget: boolean;
  netProfitPerUnit: number;
}

const SEGMENT_STYLES: Record<
  BreakdownSegment["key"],
  {
    barBg: string;
    swatchBg: string;
    textAccent: string;
    ringColor: string;
  }
> = {
  cogs: {
    barBg: "bg-slate-800",
    swatchBg: "bg-slate-800",
    textAccent: "text-slate-900",
    ringColor: "border-slate-200",
  },
  platformAndShipping: {
    barBg: "bg-blue-700",
    swatchBg: "bg-blue-700",
    textAccent: "text-blue-800",
    ringColor: "border-blue-200/80",
  },
  ads: {
    barBg: "bg-amber-700",
    swatchBg: "bg-amber-700",
    textAccent: "text-amber-800",
    ringColor: "border-amber-200/90",
  },
  profit: {
    barBg: "bg-emerald-700",
    swatchBg: "bg-emerald-700",
    textAccent: "text-emerald-800",
    ringColor: "border-emerald-200/90",
  },
};

export function MarginBreakdownBar({
  price,
  segments,
  isOverBudget,
  netProfitPerUnit,
}: MarginBreakdownBarProps) {
  return (
    <section
      aria-labelledby="breakdown-heading"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2
            id="breakdown-heading"
            className="text-base font-bold tracking-tight text-slate-900"
          >
            ¿A dónde se va cada peso que vendes?
          </h2>
          <p className="mt-0.5 text-sm text-slate-600">
            Desglose porcentual sobre un precio de venta de{" "}
            <span className="font-semibold text-slate-900 tabular-nums">
              {formatCurrency(price)} MXN
            </span>
          </p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 tabular-nums">
          Base 100%
        </span>
      </div>

      <figure className="mt-4">
        {price <= 0 ? (
          <div className="flex h-11 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-sm font-medium text-slate-600">
            Ingresa un precio de venta mayor a $0 MXN para visualizar el desglose.
          </div>
        ) : (
          <div
            role="img"
            aria-label={`Distribución del precio de venta: ${segments
              .map(
                (s) =>
                  `${s.label} ${s.shareOfPricePct.toFixed(1)}% (${formatCurrency(s.amount)})`
              )
              .join(", ")}`}
            className="flex h-11 w-full overflow-hidden rounded-xl border border-slate-300 bg-slate-100"
          >
            {segments.map((segment) => {
              if (segment.barWidthPct <= 0.05) return null;
              const style = SEGMENT_STYLES[segment.key];
              const showInlineLabel = segment.barWidthPct >= 11;

              return (
                <div
                  key={segment.key}
                  style={{ width: `${segment.barWidthPct}%` }}
                  title={`${segment.label}: ${segment.shareOfPricePct.toFixed(1)}% (${formatCurrency(segment.amount)})`}
                  className={`stacked-bar-segment flex h-full items-center justify-center overflow-hidden px-1.5 text-xs font-bold text-white tabular-nums transition-[width] duration-200 ease-out not-last:border-r not-last:border-white/40 ${style.barBg}`}
                >
                  {showInlineLabel ? (
                    <span className="truncate">
                      {segment.shareOfPricePct.toFixed(1)}%
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {isOverBudget ? (
          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-red-300 bg-red-50 px-3.5 py-2.5 text-sm text-red-900">
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-red-700"
            />
            <p>
              <strong>Tus costos superan el 100% del precio de venta.</strong>{" "}
              Tienes un déficit de{" "}
              <span className="font-bold tabular-nums">
                {formatCurrency(Math.abs(netProfitPerUnit))} MXN
              </span>{" "}
              por cada unidad vendida; la barra muestra la proporción de tus costos totales.
            </p>
          </div>
        ) : null}

        <figcaption className="sr-only">
          Desglose detallado del precio unitario en costo del producto, comisiones y envío, publicidad y utilidad libre.
        </figcaption>
      </figure>

      <ul
        role="list"
        className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2"
      >
        {segments.map((segment) => {
          const style = SEGMENT_STYLES[segment.key];
          const isNegativeProfit =
            segment.key === "profit" && segment.amount < 0;

          return (
            <li
              key={segment.key}
              className={`flex items-start justify-between gap-3 rounded-xl border bg-slate-50/70 px-3.5 py-3 ${
                isNegativeProfit ? "border-red-300 bg-red-50/60" : style.ringColor
              }`}
            >
              <div className="flex min-w-0 items-start gap-2.5">
                <span
                  aria-hidden="true"
                  className={`mt-1 size-3 shrink-0 rounded-sm ${
                    isNegativeProfit ? "bg-red-700" : style.swatchBg
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {segment.label}
                  </p>
                  {segment.sublabel ? (
                    <p className="mt-0.5 text-xs text-slate-600 tabular-nums">
                      {segment.sublabel}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="shrink-0 text-end tabular-nums">
                <p
                  className={`text-sm font-bold ${
                    isNegativeProfit ? "text-red-800" : style.textAccent
                  }`}
                >
                  {segment.shareOfPricePct.toFixed(1)}%
                </p>
                <p className="text-xs font-medium text-slate-700">
                  {formatCurrency(segment.amount)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

