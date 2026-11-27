"use client";

import { useRef, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  FileSpreadsheet,
  MessageCircle,
  Settings2,
  X,
} from "lucide-react";
import {
  CTA_CONFIG,
  buildWhatsappAuditUrl,
  buildWhatsappTemplateUrl,
  sanitizeWhatsappNumber,
} from "@/config/cta";
import { formatWholeCurrency, type FinancialResults } from "@/lib/calculations";

interface ConversionSectionProps {
  results: FinancialResults;
  whatsappNumber: string;
  onUpdateWhatsappNumber: (nextDigits: string) => void;
  onAnnounce: (message: string) => void;
}

const EXCEL_FEATURES = [
  "Control centralizado de hasta 200+ SKUs en un solo libro",
  "Tablas preconfiguradas para Mercado Libre, Amazon, Shopify y venta directa",
  "Semáforo automático de salud por producto (<10%, 10%–19.9%, ≥20%)",
  "Simulador masivo de incrementos de precio (+5%, +10%, +15%) y descuentos",
  "Tablero ejecutivo de punto de equilibrio consolidado mensual",
] as const;

export function ConversionSection({
  results,
  whatsappNumber,
  onUpdateWhatsappNumber,
  onAnnounce,
}: ConversionSectionProps) {
  const waDialogRef = useRef<HTMLDialogElement>(null);
  const excelDialogRef = useRef<HTMLDialogElement>(null);
  const [phoneDraft, setPhoneDraft] = useState(whatsappNumber);

  const auditHref = buildWhatsappAuditUrl(whatsappNumber, {
    price: results.sanitized.price,
    cogs: results.sanitized.cogs,
    commissionPct: results.sanitized.commissionPct,
    shipping: results.sanitized.shipping,
    cpa: results.sanitized.cpa,
    netProfitPerUnit: results.netProfitPerUnit,
    netMarginPct: results.netMarginPct,
    suggestedPrice: results.suggestedPrice20,
    breakEvenUnits: results.breakEven.units,
  });

  const hasExternalExcelCheckout = Boolean(CTA_CONFIG.excelTemplateUrl);
  const excelWhatsappHref = buildWhatsappTemplateUrl(whatsappNumber);

  const openWhatsappConfig = () => {
    setPhoneDraft(whatsappNumber);
    waDialogRef.current?.showModal();
  };

  const handleSaveWhatsapp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleaned = sanitizeWhatsappNumber(phoneDraft);
    const finalDigits = cleaned || CTA_CONFIG.defaultWhatsappNumber;
    onUpdateWhatsappNumber(finalDigits);
    waDialogRef.current?.close();
    onAnnounce(`Enlace de WhatsApp actualizado al número ${finalDigits}.`);
  };

  const handleResetWhatsapp = () => {
    setPhoneDraft(CTA_CONFIG.defaultWhatsappNumber);
    onUpdateWhatsappNumber(CTA_CONFIG.defaultWhatsappNumber);
    waDialogRef.current?.close();
    onAnnounce("Número de WhatsApp restablecido al valor predeterminado.");
  };

  return (
    <section
      aria-labelledby="cta-section-heading"
      className="mt-10 border-t border-slate-200 pt-10"
    >
      <div className="mb-6 flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-wider text-blue-700 uppercase">
            Escala tu rentabilidad
          </p>
          <h2
            id="cta-section-heading"
            className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl"
          >
            Lleva este análisis a todo tu catálogo
          </h2>
        </div>
        <p className="max-w-md text-sm text-slate-600">
          Optimiza precios SKU por SKU y detecta fugas de margen antes de invertir más en pauta.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Card 1: Auditoría rápida de catálogo por WhatsApp */}
        <article className="flex flex-col justify-between rounded-2xl border border-emerald-200 bg-white p-6 shadow-xs transition-shadow hover:shadow-md">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="inline-flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                <MessageCircle aria-hidden="true" className="size-5" />
              </div>
              <button
                type="button"
                onClick={openWhatsappConfig}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-100"
              >
                <Settings2 aria-hidden="true" className="size-3.5" />
                <span>Configurar wa.me</span>
              </button>
            </div>

            <h3 className="mt-4 text-lg font-bold tracking-tight text-slate-900">
              Solicitar Auditoría Rápida de Catálogo por WhatsApp
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Envíanos tus números actuales en un clic. Revisamos comisiones por canal, costos logísticos y arquitectura de precios de tus productos estrella para rescatar margen oculto.
            </p>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700">
              <span className="font-semibold text-slate-900">
                Mensaje inteligente prellenado:
              </span>{" "}
              incluye tu precio ({formatWholeCurrency(results.sanitized.price)}), margen actual ({results.netMarginPct.toFixed(1)}%) y punto de equilibrio.
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <a
              href={auditHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-xs transition-colors hover:bg-emerald-800"
            >
              <MessageCircle aria-hidden="true" className="size-4" />
              <span>Solicitar auditoría por WhatsApp</span>
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </a>
            <p className="text-center text-xs text-slate-600 tabular-nums">
              Destino activo:{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-800">
                wa.me/{whatsappNumber}
              </code>
            </p>
          </div>
        </article>

        {/* Card 2: Plantilla Avanzada en Excel para múltiples SKUs */}
        <article className="flex flex-col justify-between rounded-2xl border border-slate-900/15 bg-slate-900 p-6 text-white shadow-sm">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="inline-flex size-11 items-center justify-center rounded-xl bg-blue-500/20 text-blue-300 ring-1 ring-blue-400/30">
                <FileSpreadsheet aria-hidden="true" className="size-5" />
              </div>
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-blue-200 ring-1 ring-white/15 tabular-nums">
                Pago único · {formatWholeCurrency(CTA_CONFIG.excelTemplatePriceMxn)} MXN
              </span>
            </div>

            <h3 className="mt-4 text-lg font-bold tracking-tight text-white">
              Plantilla Avanzada en Excel para Múltiples SKUs
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              ¿Vendes más de un producto? Gestiona todo tu inventario en una matriz profesional con fórmulas listas, alertas por SKU y punto de equilibrio consolidado.
            </p>

            <ul role="list" className="mt-4 space-y-2 text-xs text-slate-200">
              <li className="flex items-start gap-2">
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-emerald-400"
                />
                <span>
                  Compara márgenes entre Mercado Libre, Shopify y Venta Directa por SKU
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-emerald-400"
                />
                <span>
                  Incluye pestaña de simulador de promociones, cupones y envío gratis
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            {hasExternalExcelCheckout ? (
              <a
                href={CTA_CONFIG.excelTemplateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-xs transition-colors hover:bg-blue-50"
              >
                <FileSpreadsheet aria-hidden="true" className="size-4" />
                <span>Adquirir Plantilla Excel Multi-SKU</span>
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </a>
            ) : (
              <button
                type="button"
                onClick={() => excelDialogRef.current?.showModal()}
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-xs transition-colors hover:bg-blue-50"
              >
                <FileSpreadsheet aria-hidden="true" className="size-4" />
                <span>Adquirir Plantilla Excel Multi-SKU</span>
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </button>
            )}
            <p className="text-center text-xs text-slate-300">
              Compatible con Microsoft Excel y Google Sheets · Entrega inmediata
            </p>
          </div>
        </article>
      </div>

      {/* Native <dialog> to configure wa.me link */}
      <dialog
        ref={waDialogRef}
        aria-labelledby="wa-dialog-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="fintech-dialog"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id="wa-dialog-title"
                className="text-lg font-bold text-slate-900"
              >
                Configurar enlace de WhatsApp (wa.me)
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Define el número con lada internacional (sin signos ni espacios) para recibir solicitudes de auditoría.
              </p>
            </div>
            <button
              type="button"
              onClick={() => waDialogRef.current?.close()}
              aria-label="Cerrar configuración de WhatsApp"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>

          <form onSubmit={handleSaveWhatsapp} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="wa-phone-input"
                className="block text-sm font-semibold text-slate-900"
              >
                Número WhatsApp (formato internacional)
              </label>
              <p id="wa-phone-hint" className="mt-0.5 text-xs text-slate-600">
                Ejemplo para México: 5215512345678 (52 + 1 + 10 dígitos). También puedes pasar{" "}
                <code className="rounded bg-slate-100 px-1 py-0.5 font-mono">?wa=521...</code> en la URL.
              </p>
              <div className="fintech-numeric-wrap mt-2">
                <span
                  aria-hidden="true"
                  className="select-none ps-3 font-mono text-xs font-semibold text-slate-600"
                >
                  https://wa.me/
                </span>
                <input
                  id="wa-phone-input"
                  name="wa_phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  enterKeyHint="done"
                  aria-describedby="wa-phone-hint"
                  value={phoneDraft}
                  onChange={(e) =>
                    setPhoneDraft(sanitizeWhatsappNumber(e.target.value))
                  }
                  className="fintech-numeric-input text-start! font-mono!"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={handleResetWhatsapp}
                className="min-h-[44px] rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Restablecer
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => waDialogRef.current?.close()}
                  className="min-h-[44px] rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] rounded-xl bg-blue-700 px-5 py-2 text-sm font-bold text-white hover:bg-blue-800"
                >
                  Guardar número
                </button>
              </div>
            </div>
          </form>
        </div>
      </dialog>

      {/* Native <dialog> detailing the Multi-SKU Excel Template */}
      <dialog
        ref={excelDialogRef}
        aria-labelledby="excel-dialog-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="fintech-dialog"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-800">
                Excel + Google Sheets
              </span>
              <h2
                id="excel-dialog-title"
                className="mt-2 text-lg font-bold text-slate-900"
              >
                Plantilla Avanzada Multi-SKU ({formatWholeCurrency(CTA_CONFIG.excelTemplatePriceMxn)} MXN)
              </h2>
            </div>
            <button
              type="button"
              onClick={() => excelDialogRef.current?.close()}
              aria-label="Cerrar detalles de plantilla Excel"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>

          <p className="mt-2 text-sm text-slate-600">
            Diseñada para dueños de e-commerce y marcas D2C en México que necesitan visibilidad financiera real sobre todo su catálogo sin perder horas en hojas rotas.
          </p>

          <ul role="list" className="mt-4 space-y-2.5">
            {EXCEL_FEATURES.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2.5 text-sm text-slate-800"
              >
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-emerald-700"
                />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => excelDialogRef.current?.close()}
              className="min-h-[44px] rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Seguir calculando
            </button>
            <a
              href={excelWhatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
            >
              <MessageCircle aria-hidden="true" className="size-4" />
              <span>Solicitar acceso por WhatsApp</span>
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </a>
          </div>
        </div>
      </dialog>
    </section>
  );
}
