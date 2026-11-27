"use client";

import { useId, useState, type CSSProperties, type ReactNode } from "react";

interface SyncedSliderInputProps {
  label: string;
  helperText?: string;
  value: number;
  onChange: (nextValue: number) => void;
  min: number;
  sliderMax: number;
  maxInput?: number;
  step: number;
  unitType: "currency" | "percent";
  unitBadge?: string;
  children?: ReactNode;
}

function formatSliderValueText(value: number, unitType: "currency" | "percent"): string {
  if (unitType === "percent") {
    return `${value}%`;
  }
  return `$${value.toLocaleString("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} MXN`;
}

function formatBoundLabel(value: number, unitType: "currency" | "percent"): string {
  if (unitType === "percent") {
    return `${value}%`;
  }
  return `$${value.toLocaleString("es-MX")}`;
}

export function SyncedSliderInput({
  label,
  helperText,
  value,
  onChange,
  min,
  sliderMax,
  maxInput = 10_000_000,
  step,
  unitType,
  unitBadge,
  children,
}: SyncedSliderInputProps) {
  const baseId = useId();
  const numericId = `${baseId}-num`;
  const sliderId = `${baseId}-range`;
  const helperId = `${baseId}-help`;

  const [isFocused, setIsFocused] = useState(false);
  const [draft, setDraft] = useState<string>("");

  const displayedInputValue = isFocused ? draft : String(value);

  const clampedSliderValue = Math.min(Math.max(value, min), sliderMax);
  const exceedsSliderRange = value > sliderMax;

  const sliderStyle = {
    "--attr-min": min,
    "--attr-max": sliderMax,
    "--control-value": clampedSliderValue,
  } as CSSProperties;

  const handleTextFocus = () => {
    setDraft(String(value));
    setIsFocused(true);
  };

  const handleTextChange = (raw: string) => {
    // Support MXN paste formats like "$8,000" or "$1,250.50" as well as decimal commas like "12,5"
    const strippedCurrency = raw.replace(/[\$\s]/g, "");
    const treatCommaAsThousands =
      strippedCurrency.includes(".") || /,\d{3}(\D|$)/.test(strippedCurrency);
    const cleaned = (
      treatCommaAsThousands
        ? strippedCurrency.replace(/,/g, "")
        : strippedCurrency.replace(/,/g, ".")
    ).replace(/[^\d.]/g, "");

    // Allow at most a single decimal point
    const firstDot = cleaned.indexOf(".");
    const normalized =
      firstDot === -1
        ? cleaned
        : `${cleaned.slice(0, firstDot + 1)}${cleaned
          .slice(firstDot + 1)
          .replace(/\./g, "")}`;

    setDraft(normalized);

    if (normalized === "" || normalized === ".") {
      onChange(min);
      return;
    }

    const parsed = Number.parseFloat(normalized);
    if (Number.isFinite(parsed)) {
      const clamped = Math.min(Math.max(parsed, min), maxInput);
      onChange(clamped);
    }
  };

  const handleTextBlur = () => {
    const parsed = Number.parseFloat(draft);
    if (Number.isFinite(parsed)) {
      const clamped = Math.min(Math.max(parsed, min), maxInput);
      const rounded =
        unitType === "percent"
          ? Math.round(clamped * 100) / 100
          : Math.round(clamped * 100) / 100;
      onChange(rounded);
    } else {
      onChange(min);
    }
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(maxInput, Math.round((value + step) * 100) / 100);
      onChange(next);
      setDraft(String(next));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.max(min, Math.round((value - step) * 100) / 100);
      onChange(next);
      setDraft(String(next));
    }
  };

  const handleSliderChange = (raw: string) => {
    const parsed = Number.parseFloat(raw);
    if (Number.isFinite(parsed)) {
      onChange(parsed);
      if (isFocused) {
        setDraft(String(parsed));
      }
    }
  };

  return (
    <div className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-4 transition-colors hover:border-slate-300">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <label
            htmlFor={numericId}
            className="block text-[0.9375rem] font-semibold leading-snug text-slate-900"
          >
            {label}
          </label>
          {helperText ? (
            <p id={helperId} className="mt-0.5 text-xs leading-relaxed text-slate-600">
              {helperText}
            </p>
          ) : null}
        </div>

        <div className="fintech-numeric-wrap w-36 shrink-0 sm:w-40">
          {unitType === "currency" ? (
            <span
              aria-hidden="true"
              className="select-none ps-3 text-sm font-semibold text-slate-600"
            >
              $
            </span>
          ) : null}

          <input
            id={numericId}
            name={numericId}
            type="text"
            inputMode="decimal"
            enterKeyHint="done"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            value={displayedInputValue}
            onFocus={handleTextFocus}
            onChange={(e) => handleTextChange(e.target.value)}
            onBlur={handleTextBlur}
            onKeyDown={handleKeyDown}
            aria-describedby={helperText ? helperId : undefined}
            className="fintech-numeric-input"
          />

          <span
            aria-hidden="true"
            className="select-none pe-3 text-xs font-semibold tracking-wide text-slate-600"
          >
            {unitBadge ?? (unitType === "percent" ? "%" : "MXN")}
          </span>
        </div>
      </div>

      <div className="mt-2">
        <input
          id={sliderId}
          type="range"
          min={min}
          max={sliderMax}
          step={step}
          value={clampedSliderValue}
          onChange={(e) => handleSliderChange(e.target.value)}
          aria-label={`Ajuste rápido: ${label}`}
          aria-valuetext={formatSliderValueText(value, unitType)}
          style={sliderStyle}
          className="fintech-slider"
        />

        <div className="mt-0.5 flex items-center justify-between text-xs font-medium text-slate-600 tabular-nums">
          <span>{formatBoundLabel(min, unitType)}</span>
          {exceedsSliderRange ? (
            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-800">
              Valor manual ({formatSliderValueText(value, unitType)})
            </span>
          ) : null}
          <span>{formatBoundLabel(sliderMax, unitType)}+</span>
        </div>
      </div>

      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}
