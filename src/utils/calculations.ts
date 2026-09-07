import { Sale, SummaryMetrics } from '../types';

export function calculateSaleMetrics(
  unitCost: number,
  unitPrice: number,
  quantity: number = 1,
  reinvestmentPercent: number = 40
): {
  totalCost: number;
  totalRevenue: number;
  netProfit: number;
  profitMargin: number;
  markupPercent: number;
  reinvestmentAmount: number;
  personalProfitAmount: number;
  totalBusinessRetention: number;
} {
  const safeCost = Math.max(0, Number(unitCost) || 0);
  const safePrice = Math.max(0, Number(unitPrice) || 0);
  const safeQty = Math.max(1, Number(quantity) || 1);
  const safeReinvestPct = Math.min(100, Math.max(0, Number(reinvestmentPercent) || 0));

  const totalCost = safeCost * safeQty;
  const totalRevenue = safePrice * safeQty;
  const netProfit = totalRevenue - totalCost;

  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const markupPercent = totalCost > 0 ? (netProfit / totalCost) * 100 : (netProfit > 0 ? 100 : 0);

  // If net profit is positive, split it between reinvestment and personal profit.
  // If net profit is 0 or negative (loss), no reinvestment or personal profit from profit.
  const reinvestmentAmount = netProfit > 0 ? netProfit * (safeReinvestPct / 100) : 0;
  const personalProfitAmount = netProfit > 0 ? netProfit - reinvestmentAmount : netProfit;

  // Capital retained in business = cost recovered + reinvestment share
  const totalBusinessRetention = totalCost + reinvestmentAmount;

  return {
    totalCost,
    totalRevenue,
    netProfit,
    profitMargin,
    markupPercent,
    reinvestmentAmount,
    personalProfitAmount,
    totalBusinessRetention,
  };
}

export function calculateSummaryMetrics(sales: Sale[]): SummaryMetrics {
  let totalRevenue = 0;
  let totalCost = 0;
  let totalNetProfit = 0;
  let totalReinvestmentFund = 0;
  let totalPersonalProfit = 0;
  let totalBusinessWorkingCapital = 0;
  let totalUnitsSold = 0;

  sales.forEach((sale) => {
    totalRevenue += sale.totalRevenue;
    totalCost += sale.totalCost;
    totalNetProfit += sale.netProfit;
    totalReinvestmentFund += sale.reinvestmentAmount;
    totalPersonalProfit += sale.personalProfitAmount;
    totalBusinessWorkingCapital += sale.totalBusinessRetention;
    totalUnitsSold += sale.quantity;
  });

  const averageProfitMargin = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;

  return {
    totalSalesCount: sales.length,
    totalUnitsSold,
    totalRevenue,
    totalCost,
    totalNetProfit,
    totalReinvestmentFund,
    totalPersonalProfit,
    totalBusinessWorkingCapital,
    averageProfitMargin,
  };
}
