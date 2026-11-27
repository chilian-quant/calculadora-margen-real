export const CTA_CONFIG = {
  /**
   * Número de WhatsApp en formato internacional sin signos ni espacios (ej. 5215512345678).
   * También puede configurarse mediante la variable de entorno NEXT_PUBLIC_WHATSAPP_NUMBER
   * o en tiempo de ejecución desde el botón "Configurar wa.me" o el parámetro URL ?wa=521...
   */
  defaultWhatsappNumber:
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5215500000000",

  /**
   * URL externa de checkout/descarga para la Plantilla Avanzada en Excel (opcional).
   * Si se deja vacía, el botón abre el modal con el desglose de la plantilla y solicitud directa.
   */
  excelTemplateUrl: process.env.NEXT_PUBLIC_EXCEL_TEMPLATE_URL || "",

  /** Precio referencial de la plantilla (MXN) */
  excelTemplatePriceMxn: 249,

  /** Clave versionada en localStorage para persistir un número wa.me personalizado */
  whatsappStorageKey: "margen-real:whatsapp-number:v1",
} as const;

export function sanitizeWhatsappNumber(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 15);
}

export function buildWhatsappAuditUrl(
  phoneDigits: string,
  summary: {
    price: number;
    cogs: number;
    commissionPct: number;
    shipping: number;
    cpa: number;
    netProfitPerUnit: number;
    netMarginPct: number;
    suggestedPrice: number | null;
    breakEvenUnits: number | null;
  }
): string {
  const cleanPhone = sanitizeWhatsappNumber(phoneDigits) || CTA_CONFIG.defaultWhatsappNumber;
  const formatMxn = (val: number) =>
    `$${val.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;

  const lines = [
    "Hola, quiero solicitar una auditoría rápida de catálogo.",
    "",
    "Mis números actuales en la Calculadora de Margen Real:",
    `• Precio de venta: ${formatMxn(summary.price)}`,
    `• Costo producto (COGS): ${formatMxn(summary.cogs)}`,
    `• Comisión plataforma: ${summary.commissionPct}%`,
    `• Envío y empaque: ${formatMxn(summary.shipping)}`,
    `• Ads / CPA: ${formatMxn(summary.cpa)}`,
    `• Utilidad neta real: ${formatMxn(summary.netProfitPerUnit)} (${summary.netMarginPct.toFixed(1)}%)`,
    summary.suggestedPrice !== null
      ? `• Precio mínimo sugerido (20%): ${formatMxn(summary.suggestedPrice)}`
      : "• Precio sugerido (20%): Comisión demasiado alta",
    summary.breakEvenUnits !== null
      ? `• Punto de equilibrio: ${summary.breakEvenUnits} unidades/mes`
      : "• Punto de equilibrio: Inalcanzable con margen actual",
  ];

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export function buildWhatsappTemplateUrl(phoneDigits: string): string {
  const cleanPhone = sanitizeWhatsappNumber(phoneDigits) || CTA_CONFIG.defaultWhatsappNumber;
  const message =
    "Hola, me interesa adquirir la Plantilla Avanzada en Excel para calcular márgenes de múltiples SKUs.";
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

