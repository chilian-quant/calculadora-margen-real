export interface CalculatorInputs {
  /** Precio de venta al público (MXN) */
  price: number;
  /** Costo del producto / COGS (MXN) */
  cogs: number;
  /** Comisión de plataforma o pasarela (%) */
  commissionPct: number;
  /** Costo de envío y empaque por orden (MXN) */
  shipping: number;
  /** Gasto en publicidad por venta / CPA (MXN) */
  cpa: number;
  /** Gastos fijos mensuales (MXN) */
  fixedCosts: number;
}

export const DEFAULT_INPUTS: CalculatorInputs = {
  price: 350,
  cogs: 120,
  commissionPct: 15,
  shipping: 92,
  cpa: 35,
  fixedCosts: 8000,
};

export interface CommissionPreset {
  id: string;
  label: string;
  shortLabel: string;
  value: number;
}

export const COMMISSION_PRESETS: readonly CommissionPreset[] = [
  {
    id: "mercado-libre",
    label: "Mercado Libre (15%)",
    shortLabel: "Mercado Libre",
    value: 15,
  },
  {
    id: "shopify-stripe",
    label: "Shopify/Stripe (4%)",
    shortLabel: "Shopify/Stripe",
    value: 4,
  },
  {
    id: "venta-directa",
    label: "Venta Directa (0%)",
    shortLabel: "Venta Directa",
    value: 0,
  },
] as const;

export type HealthStatus = "red" | "yellow" | "green";

export interface BreakdownSegment {
  key: "cogs" | "platformAndShipping" | "ads" | "profit";
  label: string;
  amount: number;
  shareOfPricePct: number;
  barWidthPct: number;
  sublabel?: string;
}

export interface FinancialResults {
  /** Entradas sanitizadas usadas en el cálculo */
  sanitized: CalculatorInputs;
  /** Comisión en pesos por unidad */
  commissionAmount: number;
  /** Comisiones + envío por unidad */
  platformAndShippingAmount: number;
  /** Costo variable total por unidad */
  totalVariableCost: number;
  /** Utilidad neta real por unidad (MXN) */
  netProfitPerUnit: number;
  /** Margen neto real (%) */
  netMarginPct: number;
  /** Semáforo de salud financiera */
  healthStatus: HealthStatus;
  /** Etiqueta corta de estado */
  healthTitle: string;
  /** Diagnóstico textual directo */
  healthDiagnosis: string;
  /** Indica si la venta actual genera pérdida o margen cero */
  isLoss: boolean;
  /** Desglose porcentual de cada peso vendido */
  breakdown: BreakdownSegment[];
  /** Indica si los costos variables superan el precio de venta */
  isOverBudget: boolean;
  /** Precio mínimo sugerido para lograr 20% de margen neto libre (null si comisión >= 80%) */
  suggestedPrice20: number | null;
  /** Diferencia en MXN respecto al precio actual para llegar al precio sugerido */
  suggestedPriceDelta: number | null;
  /** Diferencia porcentual respecto al precio actual */
  suggestedPriceDeltaPct: number | null;
  /** True si el producto ya cumple o supera el 20% de margen */
  meetsTargetMargin: boolean;
  /** Punto de equilibrio mensual */
  breakEven: {
    achievable: boolean;
    units: number | null;
    monthlyRevenue: number | null;
    unitsPerDay: number | null;
  };
  /** Simulación rápida al subir el precio +10% */
  plus10: {
    newPrice: number;
    priceDelta: number;
    newCommissionAmount: number;
    newNetProfitPerUnit: number;
    newNetMarginPct: number;
    profitDeltaPerUnit: number;
    profitIncreasePct: number | null;
    turnsProfitable: boolean;
    newBreakEvenUnits: number | null;
    breakEvenUnitsSaved: number | null;
    newHealthStatus: HealthStatus;
  };
}

const TARGET_NET_MARGIN = 0.2;

function sanitizeNonNegative(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value;
}

function sanitizePercentage(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

export function getHealthStatus(netMarginPct: number, price: number): HealthStatus {
  if (price <= 0 || netMarginPct < 10) return "red";
  if (netMarginPct < 20) return "yellow";
  return "green";
}

function getHealthCopy(
  status: HealthStatus,
  netProfitPerUnit: number,
  price: number
): { title: string; diagnosis: string } {
  if (price <= 0) {
    return {
      title: "Sin precio definido",
      diagnosis:
        "Define un precio de venta mayor a $0 MXN para evaluar la rentabilidad real de tu producto.",
    };
  }

  if (netProfitPerUnit < 0) {
    return {
      title: "Pérdida por unidad",
      diagnosis:
        "Estás perdiendo dinero en cada venta. Sube tu precio o reduce de inmediato envío, comisión o gasto en ads.",
    };
  }

  if (status === "red") {
    return {
      title: "Margen Crítico (< 10%)",
      diagnosis:
        "Tu utilidad es demasiado frágil: una devolución, envío extra o subida en CPA puede dejarte en números rojos.",
    };
  }

  if (status === "yellow") {
    return {
      title: "Margen Ajustado (10% – 19.9%)",
      diagnosis:
        "El producto deja utilidad, pero con poco colchón para escalar publicidad o absorber imprevistos. Apunta al 20% libre.",
    };
  }

  return {
    title: "Margen Saludable (≥ 20%)",
    diagnosis:
      "Estructura rentable y sólida: tienes oxígeno real para reinvertir en inventario, anuncios y cubrir tus gastos fijos.",
  };
}

export function calculateFinancials(inputs: CalculatorInputs): FinancialResults {
  const sanitized: CalculatorInputs = {
    price: sanitizeNonNegative(inputs.price),
    cogs: sanitizeNonNegative(inputs.cogs),
    commissionPct: sanitizePercentage(inputs.commissionPct),
    shipping: sanitizeNonNegative(inputs.shipping),
    cpa: sanitizeNonNegative(inputs.cpa),
    fixedCosts: sanitizeNonNegative(inputs.fixedCosts),
  };

  const { price, cogs, commissionPct, shipping, cpa, fixedCosts } = sanitized;
  const commissionRate = commissionPct / 100;
  const commissionAmount = price * commissionRate;
  const platformAndShippingAmount = commissionAmount + shipping;
  const totalVariableCost = cogs + platformAndShippingAmount + cpa;
  const netProfitPerUnit = price - totalVariableCost;
  const netMarginPct = price > 0 ? (netProfitPerUnit / price) * 100 : 0;
  const isLoss = price > 0 && netProfitPerUnit <= 0;

  const healthStatus = getHealthStatus(netMarginPct, price);
  const { title: healthTitle, diagnosis: healthDiagnosis } = getHealthCopy(
    healthStatus,
    netProfitPerUnit,
    price
  );

  // Desglose porcentual de cada peso vendido
  const isOverBudget = price > 0 && totalVariableCost > price;
  const safeBaseForBars =
    price <= 0 ? 0 : isOverBudget ? totalVariableCost : price;

  const sharePct = (amount: number) => (price > 0 ? (amount / price) * 100 : 0);
  const barPct = (amount: number) =>
    safeBaseForBars > 0 ? (Math.max(0, amount) / safeBaseForBars) * 100 : 0;

  const breakdown: BreakdownSegment[] = [
    {
      key: "cogs",
      label: "Costo producto",
      amount: cogs,
      shareOfPricePct: sharePct(cogs),
      barWidthPct: barPct(cogs),
      sublabel: "COGS unitario",
    },
    {
      key: "platformAndShipping",
      label: "Comisiones y Envío",
      amount: platformAndShippingAmount,
      shareOfPricePct: sharePct(platformAndShippingAmount),
      barWidthPct: barPct(platformAndShippingAmount),
      sublabel: `Comisión ${formatCurrency(commissionAmount)} + Envío ${formatCurrency(shipping)}`,
    },
    {
      key: "ads",
      label: "Publicidad (CPA)",
      amount: cpa,
      shareOfPricePct: sharePct(cpa),
      barWidthPct: barPct(cpa),
      sublabel: "Costo por adquisición",
    },
    {
      key: "profit",
      label: "Utilidad libre",
      amount: netProfitPerUnit,
      shareOfPricePct: sharePct(netProfitPerUnit),
      barWidthPct: isOverBudget ? 0 : barPct(netProfitPerUnit),
      sublabel: netProfitPerUnit < 0 ? "Déficit por unidad" : "Ganancia neta real",
    },
  ];

  // Precio mínimo sugerido para lograr 20% de margen neto libre:
  // P * (1 - commissionRate - 0.20) = cogs + shipping + cpa
  const nonCommissionUnitCosts = cogs + shipping + cpa;
  const targetDenominator = 1 - commissionRate - TARGET_NET_MARGIN;
  const suggestedPrice20 =
    targetDenominator > 1e-6 ? nonCommissionUnitCosts / targetDenominator : null;
  const suggestedPriceDelta =
    suggestedPrice20 !== null ? suggestedPrice20 - price : null;
  const suggestedPriceDeltaPct =
    suggestedPrice20 !== null && price > 0
      ? ((suggestedPrice20 - price) / price) * 100
      : null;
  const meetsTargetMargin = price > 0 && netMarginPct >= 20;

  // Punto de equilibrio mensual (unidades para cubrir gastos fijos)
  const breakEven =
    fixedCosts <= 0
      ? {
          achievable: true,
          units: 0,
          monthlyRevenue: 0,
          unitsPerDay: 0,
        }
      : netProfitPerUnit > 0
        ? (() => {
            const units = Math.ceil(fixedCosts / netProfitPerUnit);
            return {
              achievable: true,
              units,
              monthlyRevenue: units * price,
              unitsPerDay: units / 30,
            };
          })()
        : {
            achievable: false,
            units: null,
            monthlyRevenue: null,
            unitsPerDay: null,
          };

  // Comparador rápido: +10% en precio de venta
  const newPrice = price * 1.1;
  const priceDelta = newPrice - price;
  const newCommissionAmount = newPrice * commissionRate;
  const newNetProfitPerUnit =
    newPrice - (cogs + newCommissionAmount + shipping + cpa);
  const newNetMarginPct =
    newPrice > 0 ? (newNetProfitPerUnit / newPrice) * 100 : 0;
  const profitDeltaPerUnit = newNetProfitPerUnit - netProfitPerUnit;
  const profitIncreasePct =
    netProfitPerUnit > 0 ? (profitDeltaPerUnit / netProfitPerUnit) * 100 : null;
  const turnsProfitable = netProfitPerUnit <= 0 && newNetProfitPerUnit > 0;
  const newBreakEvenUnits =
    fixedCosts <= 0
      ? 0
      : newNetProfitPerUnit > 0
        ? Math.ceil(fixedCosts / newNetProfitPerUnit)
        : null;
  const breakEvenUnitsSaved =
    breakEven.units !== null && newBreakEvenUnits !== null
      ? breakEven.units - newBreakEvenUnits
      : null;
  const newHealthStatus = getHealthStatus(newNetMarginPct, newPrice);

  return {
    sanitized,
    commissionAmount,
    platformAndShippingAmount,
    totalVariableCost,
    netProfitPerUnit,
    netMarginPct,
    healthStatus,
    healthTitle,
    healthDiagnosis,
    isLoss,
    breakdown,
    isOverBudget,
    suggestedPrice20,
    suggestedPriceDelta,
    suggestedPriceDeltaPct,
    meetsTargetMargin,
    breakEven,
    plus10: {
      newPrice,
      priceDelta,
      newCommissionAmount,
      newNetProfitPerUnit,
      newNetMarginPct,
      profitDeltaPerUnit,
      profitIncreasePct,
      turnsProfitable,
      newBreakEvenUnits,
      breakEvenUnitsSaved,
      newHealthStatus,
    },
  };
}

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactCurrencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const integerFormatter = new Intl.NumberFormat("es-MX", {
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "$0.00";
  const normalized = Math.abs(value) < 0.005 ? 0 : value;
  return currencyFormatter.format(normalized);
}

export function formatWholeCurrency(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  const normalized = Math.abs(value) < 0.5 ? 0 : value;
  return compactCurrencyFormatter.format(normalized);
}

export function formatInteger(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return integerFormatter.format(Math.round(value));
}

/**
 * Formatea el margen porcentual asegurando consistencia visual con los umbrales
 * exactos del semáforo (10% y 20%) para que 19.97% nunca se muestre como "20.0%" en estado amarillo.
 */
export function formatMarginPct(value: number): string {
  if (!Number.isFinite(value)) return "0.0%";
  let adjusted = value;
  if (value >= 19.95 && value < 20) {
    adjusted = 19.9;
  } else if (value >= 9.95 && value < 10) {
    adjusted = 9.9;
  } else if (Math.abs(value) < 0.05) {
    adjusted = 0;
  }
  return `${adjusted.toFixed(1)}%`;
}

