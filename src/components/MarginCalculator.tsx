"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Calculator,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  COMMISSION_PRESETS,
  DEFAULT_INPUTS,
  calculateFinancials,
  formatCurrency,
  formatInteger,
  formatMarginPct,
  formatWholeCurrency,
  type CalculatorInputs,
  type HealthStatus,
} from "@/lib/calculations";
import { CTA_CONFIG, sanitizeWhatsappNumber } from "@/config/cta";
import { SyncedSliderInput } from "@/components/SyncedSliderInput";
import { MarginBreakdownBar } from "@/components/MarginBreakdownBar";
import { ConversionSection } from "@/components/ConversionSection";

const HEALTH_STYLES: Record<
  HealthStatus,
  {
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    diagnosisBg: string;
    diagnosisBorder: string;
    diagnosisText: string;
    kpiAccent: string;
    lampLabel: string;
  }
> = {
  red: {
    badgeBg: "bg-red-50",
    badgeBorder: "border-red-300",
    badgeText: "text-red-900",
    diagnosisBg: "bg-red-50/90",
    diagnosisBorder: "border-red-200",
    diagnosisText: "text-red-950",
    kpiAccent: "text-red-800",
    lampLabel: "Semáforo rojo",
  },
  yellow: {
    badgeBg: "bg-amber-50",
    badgeBorder: "border-amber-300",
    badgeText: "text-amber-950",
    diagnosisBg: "bg-amber-50/90",
    diagnosisBorder: "border-amber-200",
    diagnosisText: "text-amber-950",
    kpiAccent: "text-amber-800",
    lampLabel: "Semáforo amarillo",
  },
  green: {
    badgeBg: "bg-emerald-50",
    badgeBorder: "border-emerald-300",
    badgeText: "text-emerald-950",
    diagnosisBg: "bg-emerald-50/90",
    diagnosisBorder: "border-emerald-200",
    diagnosisText: "text-emerald-950",
    kpiAccent: "text-emerald-800",
    lampLabel: "Semáforo verde",
  },
};

function HealthStatusIcon({ status }: { status: HealthStatus }) {
  if (status === "green") {
    return (
      <CheckCircle2
        aria-hidden="true"
        className="size-4 shrink-0 text-emerald-700"
      />
    );
  }
  if (status === "yellow") {
    return (
      <AlertTriangle
        aria-hidden="true"
        className="size-4 shrink-0 text-amber-700"
      />
    );
  }
  return (
    <AlertCircle aria-hidden="true" className="size-4 shrink-0 text-red-700" />
  );
}

export function MarginCalculator() {
  const [inputs, setInputs] = useState<CalculatorInputs>(DEFAULT_INPUTS);
  const [whatsappNumber, setWhatsappNumber] = useState<string>(
    CTA_CONFIG.defaultWhatsappNumber
  );
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>("");
  const announceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync optional ?wa= query param or saved localStorage wa.me number once on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlWa = sanitizeWhatsappNumber(params.get("wa") ?? "");
      if (urlWa.length >= 10) {
        setWhatsappNumber(urlWa);
        return;
      }
      const saved = sanitizeWhatsappNumber(
        window.localStorage.getItem(CTA_CONFIG.whatsappStorageKey) ?? ""
      );
      if (saved.length >= 10) {
        setWhatsappNumber(saved);
      }
    } catch {
      // Ignore storage access errors in restricted private browsing modes
    }
  }, []);

  useEffect(() => {
    return () => {
      if (announceTimerRef.current) {
        clearTimeout(announceTimerRef.current);
      }
    };
  }, []);

  const announce = useCallback((message: string) => {
    if (announceTimerRef.current) {
      clearTimeout(announceTimerRef.current);
    }
    announceTimerRef.current = setTimeout(() => {
      setLiveAnnouncement(message);
    }, 150);
  }, []);

  const updateField = useCallback(
    <K extends keyof CalculatorInputs>(field: K, value: CalculatorInputs[K]) => {
      setInputs((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleApplyPreset = useCallback(
    (label: string, value: number) => {
      setInputs((prev) => ({ ...prev, commissionPct: value }));
      announce(`Comisión aplicada: ${label}`);
    },
    [announce]
  );

  const handleApplyPrice = useCallback(
    (targetPrice: number, description: string) => {
      const rounded = Math.ceil(targetPrice * 100) / 100;
      setInputs((prev) => ({ ...prev, price: rounded }));
      announce(`${description}: nuevo precio ${formatCurrency(rounded)} MXN.`);
    },
    [announce]
  );

  const handleReset = useCallback(() => {
    setInputs(DEFAULT_INPUTS);
    announce("Valores restablecidos a los parámetros iniciales.");
  }, [announce]);

  const handleUpdateWhatsappNumber = useCallback((digits: string) => {
    setWhatsappNumber(digits);
    try {
      window.localStorage.setItem(CTA_CONFIG.whatsappStorageKey, digits);
    } catch {
      // Ignore storage quota or privacy restrictions
    }
  }, []);

  // Derive all financial results directly during render (0ms, no redundant effects)
  const results = calculateFinancials(inputs);
  const healthStyle = HEALTH_STYLES[results.healthStatus];

  const isDefaultState =
    inputs.price === DEFAULT_INPUTS.price &&
    inputs.cogs === DEFAULT_INPUTS.cogs &&
    inputs.commissionPct === DEFAULT_INPUTS.commissionPct &&
    inputs.shipping === DEFAULT_INPUTS.shipping &&
    inputs.cpa === DEFAULT_INPUTS.cpa &&
    inputs.fixedCosts === DEFAULT_INPUTS.fixedCosts;

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#calculadora" className="skip-link visually-hidden">
        Saltar a la calculadora
      </a>

      {/* Centralized polite live region for discrete actions */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="visually-hidden"
      >
        {liveAnnouncement}
      </div>

      {/* Top Fintech Navigation / Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
              <Calculator aria-hidden="true" className="size-5" />
            </div>
            <div>
              <h1 className="fluid-page-title font-extrabold text-slate-900">
                Calculadora de Margen Real y Precio Óptimo
              </h1>
              <p className="mt-0.5 text-sm text-slate-600">
                Descubre tu ganancia neta verdadera después de comisiones, logística, anuncios y gastos fijos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
              <ShieldCheck
                aria-hidden="true"
                className="size-3.5 text-emerald-700"
              />
              <span>100% privado · MXN</span>
            </span>

            <button
              type="button"
              onClick={handleReset}
              disabled={isDefaultState}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw aria-hidden="true" className="size-3.5" />
              <span>Restablecer</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main
        id="calculadora"
        tabIndex={-1}
        className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 outline-none sm:px-6 sm:py-8 lg:px-8"
      >
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
          {/* LEFT PANEL: 6 Synchronized Inputs */}
          <section
            aria-labelledby="inputs-panel-heading"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6 lg:col-span-5"
          >
            <div className="mb-5 flex items-baseline justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h2
                  id="inputs-panel-heading"
                  className="text-base font-bold tracking-tight text-slate-900"
                >
                  Estructura de precios y costos
                </h2>
                <p className="mt-0.5 text-xs text-slate-600">
                  Desliza o escribe cualquier monto exacto en pesos mexicanos.
                </p>
              </div>
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-800">
                6 variables
              </span>
            </div>

            <form
              onSubmit={(e) => e.preventDefault()}
              aria-labelledby="inputs-panel-heading"
              className="space-y-4"
            >
              {/* 1. Precio de venta al público */}
              <SyncedSliderInput
                label="Precio de venta al público"
                helperText="Precio final cobrado al cliente (IVA incluido si aplica)."
                value={inputs.price}
                onChange={(v) => updateField("price", v)}
                min={0}
                sliderMax={2500}
                step={5}
                unitType="currency"
              />

              {/* 2. Costo del producto / COGS */}
              <SyncedSliderInput
                label="Costo del producto (COGS)"
                helperText="Fabricación o compra puesta en tu bodega por unidad."
                value={inputs.cogs}
                onChange={(v) => updateField("cogs", v)}
                min={0}
                sliderMax={1500}
                step={5}
                unitType="currency"
              />

              {/* 3. Comisión de plataforma/pasarela (%) + 3 presets */}
              <SyncedSliderInput
                label="Comisión de plataforma / pasarela"
                helperText={`Equivale a ${formatCurrency(results.commissionAmount)} MXN por venta.`}
                value={inputs.commissionPct}
                onChange={(v) => updateField("commissionPct", v)}
                min={0}
                sliderMax={35}
                maxInput={99}
                step={0.5}
                unitType="percent"
              >
                <div
                  role="group"
                  aria-label="Presets rápidos de comisión"
                  className="flex flex-wrap gap-2"
                >
                  {COMMISSION_PRESETS.map((preset) => {
                    const isActive =
                      Math.abs(inputs.commissionPct - preset.value) < 0.001;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() =>
                          handleApplyPreset(preset.label, preset.value)
                        }
                        className={`min-h-[38px] flex-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                          isActive
                            ? "border-blue-700 bg-blue-700 text-white shadow-xs"
                            : "border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-100"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </SyncedSliderInput>

              {/* 4. Costo de envío/empaque por orden */}
              <SyncedSliderInput
                label="Costo de envío y empaque por orden"
                helperText="Guía logística, caja, relleno, etiquetas y fulfillment."
                value={inputs.shipping}
                onChange={(v) => updateField("shipping", v)}
                min={0}
                sliderMax={400}
                step={1}
                unitType="currency"
              />

              {/* 5. Gasto en ads por venta / CPA */}
              <SyncedSliderInput
                label="Gasto en ads por venta (CPA)"
                helperText="Costo publicitario promedio (Meta, Google, TikTok, Ads ML)."
                value={inputs.cpa}
                onChange={(v) => updateField("cpa", v)}
                min={0}
                sliderMax={400}
                step={1}
                unitType="currency"
              />

              {/* 6. Gastos fijos mensuales */}
              <SyncedSliderInput
                label="Gastos fijos mensuales"
                helperText="Renta, software, sueldos, contador y servicios del negocio."
                value={inputs.fixedCosts}
                onChange={(v) => updateField("fixedCosts", v)}
                min={0}
                sliderMax={50000}
                step={500}
                unitType="currency"
              />
            </form>
          </section>

          {/* RIGHT PANEL: Real-Time Results Dashboard */}
          <div className="results-container space-y-5 lg:sticky lg:top-6 lg:col-span-7">
            {/* 1. Primary KPI Card + Traffic Light Financial Health */}
            <section
              aria-labelledby="kpi-panel-heading"
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <h2
                  id="kpi-panel-heading"
                  className="text-sm font-bold tracking-wide text-slate-700 uppercase"
                >
                  Resultado neto por unidad
                </h2>

                {/* Traffic light visual + accessible text pill (never color alone) */}
                <div className="flex items-center gap-2.5">
                  <div
                    aria-hidden="true"
                    className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-1"
                  >
                    <span
                      className={`size-2.5 rounded-full transition-opacity ${
                        results.healthStatus === "red"
                          ? "bg-red-600 ring-2 ring-red-200"
                          : "bg-slate-300 opacity-50"
                      }`}
                    />
                    <span
                      className={`size-2.5 rounded-full transition-opacity ${
                        results.healthStatus === "yellow"
                          ? "bg-amber-500 ring-2 ring-amber-200"
                          : "bg-slate-300 opacity-50"
                      }`}
                    />
                    <span
                      className={`size-2.5 rounded-full transition-opacity ${
                        results.healthStatus === "green"
                          ? "bg-emerald-600 ring-2 ring-emerald-200"
                          : "bg-slate-300 opacity-50"
                      }`}
                    />
                  </div>

                  <span
                    className={`health-badge inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${healthStyle.badgeBg} ${healthStyle.badgeBorder} ${healthStyle.badgeText}`}
                  >
                    <HealthStatusIcon status={results.healthStatus} />
                    <span>{results.healthTitle}</span>
                  </span>
                </div>
              </div>

              {/* Main KPI Figures */}
              <div className="kpi-split-grid mt-5">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
                    Utilidad neta real / unidad
                  </p>
                  <p
                    className={`fluid-kpi-figure mt-1 font-extrabold tabular-nums ${
                      results.netProfitPerUnit < 0
                        ? "text-red-700"
                        : "text-slate-900"
                    }`}
                  >
                    {formatCurrency(results.netProfitPerUnit)}
                    <span className="ms-1.5 text-base font-bold text-slate-500">
                      MXN
                    </span>
                  </p>
                  <p className="mt-1.5 text-xs font-medium text-slate-600 tabular-nums">
                    Venta {formatCurrency(results.sanitized.price)} − Costos totales{" "}
                    {formatCurrency(results.totalVariableCost)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:text-end">
                  <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
                    Margen neto libre
                  </p>
                  <p
                    className={`fluid-kpi-figure mt-1 font-extrabold tabular-nums ${healthStyle.kpiAccent}`}
                  >
                    {formatMarginPct(results.netMarginPct)}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-600">
                    Meta saludable: ≥ 20.0%
                  </p>
                </div>
              </div>

              {/* Direct Textual Diagnosis */}
              <div
                className={`mt-5 flex items-start gap-3 rounded-xl border px-4 py-3.5 ${healthStyle.diagnosisBg} ${healthStyle.diagnosisBorder} ${healthStyle.diagnosisText}`}
              >
                <div className="mt-0.5 shrink-0">
                  <HealthStatusIcon status={results.healthStatus} />
                </div>
                <div className="text-sm leading-relaxed">
                  <span className="font-bold">Diagnóstico: </span>
                  <span>{results.healthDiagnosis}</span>
                </div>
              </div>
            </section>

            {/* 2. Stacked Horizontal Breakdown Bar */}
            <MarginBreakdownBar
              price={results.sanitized.price}
              segments={results.breakdown}
              isOverBudget={results.isOverBudget}
              netProfitPerUnit={results.netProfitPerUnit}
            />

            {/* 3. Suggested Optimal Price (20%) & Monthly Break-Even */}
            <div className="results-two-col">
              {/* Precio Mínimo Sugerido */}
              <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wide text-slate-700 uppercase">
                      <Target
                        aria-hidden="true"
                        className="size-4 text-blue-700"
                      />
                      <span>Precio mínimo sugerido</span>
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-200">
                      Meta 20% libre
                    </span>
                  </div>

                  {results.suggestedPrice20 === null ? (
                    <div className="mt-3">
                      <p className="text-lg font-bold text-red-800">
                        Inviable con esta comisión
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        Con una comisión de plataforma ≥ 80% es matemáticamente imposible retener un 20% de margen neto.
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="fluid-metric-figure mt-3 font-extrabold text-slate-900 tabular-nums">
                        {formatCurrency(results.suggestedPrice20)}
                        <span className="ms-1 text-sm font-bold text-slate-500">
                          MXN
                        </span>
                      </p>

                      {results.meetsTargetMargin ? (
                        <p className="mt-2 text-xs font-semibold text-emerald-800 tabular-nums">
                          ¡Ya cumples la meta! Tienes{" "}
                          {formatCurrency(
                            Math.max(0, -(results.suggestedPriceDelta ?? 0))
                          )}{" "}
                          de colchón sobre el precio mínimo.
                        </p>
                      ) : (
                        <p className="mt-2 text-xs leading-relaxed text-slate-600 tabular-nums">
                          Ajuste necesario:{" "}
                          <strong className="text-slate-900">
                            +{formatCurrency(results.suggestedPriceDelta ?? 0)}
                          </strong>
                          {results.suggestedPriceDeltaPct !== null
                            ? ` (+${results.suggestedPriceDeltaPct.toFixed(1)}%)`
                            : ""}{" "}
                          para lograr 20% neto libre con tu comisión actual del{" "}
                          {results.sanitized.commissionPct}%.
                        </p>
                      )}
                    </>
                  )}
                </div>

                {results.suggestedPrice20 !== null &&
                !results.meetsTargetMargin ? (
                  <button
                    type="button"
                    onClick={() =>
                      handleApplyPrice(
                        results.suggestedPrice20!,
                        "Precio mínimo sugerido aplicado"
                      )
                    }
                    className="mt-4 inline-flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-800 transition-colors hover:border-blue-300 hover:bg-blue-100 tabular-nums"
                  >
                    <Sparkles aria-hidden="true" className="size-3.5" />
                    <span>
                      Aplicar {formatCurrency(results.suggestedPrice20)}
                    </span>
                  </button>
                ) : null}
              </article>

              {/* Punto de Equilibrio */}
              <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wide text-slate-700 uppercase">
                      <TrendingUp
                        aria-hidden="true"
                        className="size-4 text-slate-700"
                      />
                      <span>Punto de equilibrio</span>
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 tabular-nums">
                      Fijos: {formatWholeCurrency(results.sanitized.fixedCosts)}
                    </span>
                  </div>

                  {!results.breakEven.achievable ||
                  results.breakEven.units === null ? (
                    <div className="mt-3">
                      <p className="text-lg font-bold text-red-800">
                        Inalcanzable
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        Tu utilidad por unidad es ≤ $0 MXN. Necesitas generar ganancia positiva por pedido para cubrir tus gastos fijos.
                      </p>
                    </div>
                  ) : results.breakEven.units === 0 ? (
                    <div className="mt-3">
                      <p className="fluid-metric-figure font-extrabold text-emerald-800 tabular-nums">
                        0{" "}
                        <span className="text-sm font-bold text-slate-600">
                          uds / mes
                        </span>
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600">
                        Al no tener gastos fijos mensuales registrados, eres rentable desde la primera unidad vendida.
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="fluid-metric-figure mt-3 font-extrabold text-slate-900 tabular-nums">
                        {formatInteger(results.breakEven.units)}
                        <span className="ms-1.5 text-sm font-bold text-slate-500">
                          uds / mes
                        </span>
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600 tabular-nums">
                        Equivale a{" "}
                        <strong className="text-slate-900">
                          {formatWholeCurrency(
                            results.breakEven.monthlyRevenue ?? 0
                          )}{" "}
                          MXN
                        </strong>{" "}
                        en ventas mensuales (aprox.{" "}
                        <strong className="text-slate-900">
                          {(results.breakEven.unitsPerDay ?? 0).toFixed(1)}{" "}
                          ventas/día
                        </strong>
                        ) solo para salir tablas.
                      </p>
                    </>
                  )}
                </div>

                {results.breakEven.achievable &&
                results.breakEven.units !== null &&
                results.breakEven.units > 0 ? (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 tabular-nums">
                    A partir de la unidad{" "}
                    <strong className="text-slate-900">
                      #{formatInteger(results.breakEven.units + 1)}
                    </strong>{" "}
                    cada venta suma{" "}
                    <strong className="text-emerald-800">
                      {formatCurrency(results.netProfitPerUnit)}
                    </strong>{" "}
                    directo a tu caja.
                  </div>
                ) : null}
              </article>
            </div>

            {/* 4. Quick +10% Price Lift Comparator */}
            <section
              aria-labelledby="plus10-heading"
              className="rounded-2xl border border-blue-200/90 bg-gradient-to-br from-white via-white to-blue-50/70 p-5 shadow-xs sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-900">
                    <Sparkles aria-hidden="true" className="size-3.5" />
                    <span>Efecto palanca en precios</span>
                  </span>
                  <h2
                    id="plus10-heading"
                    className="mt-2 text-base font-bold tracking-tight text-slate-900"
                  >
                    ¿Qué pasa si subes tu precio solo +10%?
                  </h2>
                </div>

                {results.sanitized.price > 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      handleApplyPrice(
                        results.plus10.newPrice,
                        "Simulación +10% aplicada"
                      )
                    }
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-800 tabular-nums"
                  >
                    <span>Probar {formatCurrency(results.plus10.newPrice)}</span>
                    <ArrowRight aria-hidden="true" className="size-3.5" />
                  </button>
                ) : null}
              </div>

              {results.sanitized.price <= 0 ? (
                <p className="mt-3 text-sm text-slate-600">
                  Ingresa un precio mayor a $0 MXN para simular el impacto de un incremento del 10%.
                </p>
              ) : (
                <>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-3.5 tabular-nums">
                      <p className="text-xs font-semibold text-slate-600">
                        Nuevo precio (+10%)
                      </p>
                      <p className="mt-1 text-lg font-extrabold text-slate-900">
                        {formatCurrency(results.plus10.newPrice)}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-blue-800">
                        +{formatCurrency(results.plus10.priceDelta)} vs actual
                      </p>
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 tabular-nums">
                      <p className="text-xs font-semibold text-emerald-900">
                        Aumento en utilidad neta
                      </p>
                      <p className="mt-1 text-lg font-extrabold text-emerald-800">
                        +{formatCurrency(results.plus10.profitDeltaPerUnit)}
                        <span className="ms-1 text-xs font-bold">/ u</span>
                      </p>
                      <p className="mt-0.5 text-xs font-bold text-emerald-900">
                        {results.plus10.profitIncreasePct !== null
                          ? `+${results.plus10.profitIncreasePct.toFixed(1)}% más ganancia neta`
                          : results.plus10.turnsProfitable
                            ? "Pasa de pérdida a ganancia"
                            : "Reduce tu pérdida por venta"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3.5 tabular-nums">
                      <p className="text-xs font-semibold text-slate-600">
                        Nueva utilidad y margen
                      </p>
                      <p className="mt-1 text-lg font-extrabold text-slate-900">
                        {formatCurrency(results.plus10.newNetProfitPerUnit)}
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-700">
                        Margen:{" "}
                        <span
                          className={
                            results.plus10.newHealthStatus === "green"
                              ? "text-emerald-800"
                              : results.plus10.newHealthStatus === "yellow"
                                ? "text-amber-800"
                                : "text-red-800"
                          }
                        >
                          {formatMarginPct(results.plus10.newNetMarginPct)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <p className="mt-3.5 text-xs leading-relaxed text-slate-700 tabular-nums">
                    Incluso pagando{" "}
                    <strong className="text-slate-900">
                      {formatCurrency(results.plus10.newCommissionAmount)}
                    </strong>{" "}
                    de comisión ({results.sanitized.commissionPct}%), subir +10% el precio{" "}
                    {results.plus10.breakEvenUnitsSaved !== null &&
                    results.plus10.breakEvenUnitsSaved > 0 &&
                    results.plus10.newBreakEvenUnits !== null ? (
                      <>
                        reduce tu punto de equilibrio a{" "}
                        <strong className="text-emerald-800">
                          {formatInteger(results.plus10.newBreakEvenUnits)} uds/mes
                        </strong>{" "}
                        (<strong>{formatInteger(results.plus10.breakEvenUnitsSaved)} ventas menos</strong>{" "}
                        cada mes para cubrir tus gastos fijos).
                      </>
                    ) : (
                      <>
                        mejora tu utilidad unitaria de{" "}
                        <strong className="text-slate-900">
                          {formatCurrency(results.netProfitPerUnit)}
                        </strong>{" "}
                        a{" "}
                        <strong className="text-emerald-800">
                          {formatCurrency(results.plus10.newNetProfitPerUnit)}
                        </strong>
                        .
                      </>
                    )}
                  </p>
                </>
              )}
            </section>
          </div>
        </div>

        {/* Bottom Conversion Section (WhatsApp Audit + Multi-SKU Excel Template) */}
        <ConversionSection
          results={results}
          whatsappNumber={whatsappNumber}
          onUpdateWhatsappNumber={handleUpdateWhatsappNumber}
          onAnnounce={announce}
        />
      </main>

      {/* Clean Minimal Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-4 py-5 text-xs text-slate-600 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <p className="font-medium text-slate-700">
            Calculadora de Margen Real y Precio Óptimo
          </p>
          <p>
            Cálculo 100% client-side en tu navegador · Sin cuentas ni almacenamiento en servidores.
          </p>
        </div>
      </footer>
    </div>
  );
}

