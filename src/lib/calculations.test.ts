import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateFinancials,
  DEFAULT_INPUTS,
  formatMarginPct,
} from "./calculations.ts";

test("calculates exact default scenario (MXN)", () => {
  const result = calculateFinancials(DEFAULT_INPUTS);

  assert.equal(result.commissionAmount, 52.5);
  assert.equal(result.platformAndShippingAmount, 144.5);
  assert.equal(result.totalVariableCost, 299.5);
  assert.equal(result.netProfitPerUnit, 50.5);
  assert.ok(Math.abs(result.netMarginPct - (50.5 / 350) * 100) < 1e-9);
  assert.equal(result.healthStatus, "yellow");
  assert.equal(result.isLoss, false);
  assert.equal(result.isOverBudget, false);

  // Suggested price for 20% net margin: (120 + 92 + 35) / (1 - 0.15 - 0.20) = 247 / 0.65 = 380
  assert.ok(result.suggestedPrice20 !== null);
  assert.ok(Math.abs(result.suggestedPrice20 - 380) < 1e-9);
  assert.ok(result.suggestedPriceDelta !== null);
  assert.ok(Math.abs(result.suggestedPriceDelta - 30) < 1e-9);
  assert.equal(result.meetsTargetMargin, false);

  // Break-even: ceil(8000 / 50.5) = 159
  assert.equal(result.breakEven.achievable, true);
  assert.equal(result.breakEven.units, 159);
  assert.equal(result.breakEven.monthlyRevenue, 159 * 350);

  // +10% price simulator: 350 -> 385, commission = 57.75, profit = 80.25 (+29.75 / +58.91%)
  assert.ok(Math.abs(result.plus10.newPrice - 385) < 1e-9);
  assert.ok(Math.abs(result.plus10.newNetProfitPerUnit - 80.25) < 1e-9);
  assert.ok(Math.abs(result.plus10.profitDeltaPerUnit - 29.75) < 1e-9);
  assert.ok(
    result.plus10.profitIncreasePct !== null &&
      Math.abs(result.plus10.profitIncreasePct - (29.75 / 50.5) * 100) < 1e-9
  );
  assert.equal(result.plus10.newHealthStatus, "green");
  assert.equal(result.plus10.newBreakEvenUnits, 100);
  assert.equal(result.plus10.breakEvenUnitsSaved, 59);

  // Breakdown bar widths sum to 100%
  const totalBarWidth = result.breakdown.reduce(
    (sum, item) => sum + item.barWidthPct,
    0
  );
  assert.ok(Math.abs(totalBarWidth - 100) < 1e-9);
});

test("classifies green (>=20%), yellow (10-19.9%), and red (<10%) thresholds", () => {
  const green = calculateFinancials({ ...DEFAULT_INPUTS, price: 380 });
  assert.equal(green.healthStatus, "green");
  assert.equal(green.meetsTargetMargin, true);
  assert.ok(Math.abs(green.netMarginPct - 20) < 1e-9);

  const red = calculateFinancials({ ...DEFAULT_INPUTS, price: 300 });
  assert.equal(red.healthStatus, "red");
  assert.equal(red.isLoss, false);
  assert.ok(red.netMarginPct < 10);

  const loss = calculateFinancials({ ...DEFAULT_INPUTS, price: 250 });
  assert.equal(loss.healthStatus, "red");
  assert.equal(loss.isLoss, true);
  assert.equal(loss.isOverBudget, true);
  assert.equal(loss.breakEven.achievable, false);
  assert.equal(loss.breakEven.units, null);
  const lossBarSum = loss.breakdown.reduce((s, item) => s + item.barWidthPct, 0);
  assert.ok(Math.abs(lossBarSum - 100) < 1e-9);
  assert.equal(
    loss.breakdown.find((item) => item.key === "profit")?.barWidthPct,
    0
  );
});

test("handles extreme edge cases: zero price, zero fixed costs, >=80% commission", () => {
  const zeroPrice = calculateFinancials({ ...DEFAULT_INPUTS, price: 0 });
  assert.equal(zeroPrice.netMarginPct, 0);
  assert.equal(zeroPrice.healthStatus, "red");
  assert.equal(zeroPrice.breakEven.achievable, false);

  const zeroFixed = calculateFinancials({ ...DEFAULT_INPUTS, fixedCosts: 0 });
  assert.equal(zeroFixed.breakEven.achievable, true);
  assert.equal(zeroFixed.breakEven.units, 0);

  const highCommission = calculateFinancials({
    ...DEFAULT_INPUTS,
    commissionPct: 80,
  });
  assert.equal(highCommission.suggestedPrice20, null);
  assert.equal(highCommission.suggestedPriceDelta, null);
});

test("formatMarginPct never displays 20.0% for values strictly under 20%", () => {
  assert.equal(formatMarginPct(19.97), "19.9%");
  assert.equal(formatMarginPct(9.98), "9.9%");
  assert.equal(formatMarginPct(20), "20.0%");
});

