import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { SummaryMetrics } from '../types';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface FinancialBreakdownBarProps {
  metrics: SummaryMetrics;
  currency: string;
}

export const FinancialBreakdownBar: React.FC<FinancialBreakdownBarProps> = ({
  metrics,
  currency,
}) => {
  if (metrics.totalRevenue <= 0) {
    return null;
  }

  const costRatio = (metrics.totalCost / metrics.totalRevenue) * 100;
  const reinvestRatio = (metrics.totalReinvestmentFund / metrics.totalRevenue) * 100;
  const personalRatio = (metrics.totalPersonalProfit / metrics.totalRevenue) * 100;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <span className="w-2 h-5 bg-blue-500 rounded-full shrink-0"></span>
            <span>Distribución de tus Ingresos</span>
            <span className="text-[10px] uppercase font-mono text-slate-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-md">
              Automático
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Separación estricta entre costo base recuperado, fondo de reinversión para mercadería y ganancia libre.
          </p>
        </div>

        {/* Total business retention badge */}
        <div className="inline-flex items-center gap-2 bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-xl text-xs text-slate-300 self-start sm:self-auto font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Dejar en Caja:{' '}
            <strong className="text-emerald-400 font-bold">
              {formatCurrency(metrics.totalBusinessWorkingCapital, currency)}
            </strong>
          </span>
        </div>
      </div>

      {/* Progress segmented bar */}
      <div className="h-3.5 w-full rounded-full bg-slate-950 overflow-hidden flex border border-slate-800 mb-4 p-0.5">
        {/* 1. Cost */}
        <div
          style={{ width: `${Math.max(1, costRatio)}%` }}
          className="bg-slate-500 h-full rounded-l-full transition-all duration-300 relative group"
          title={`Costo base: ${formatCurrency(metrics.totalCost, currency)} (${formatPercent(costRatio)})`}
        />
        {/* 2. Reinvestment */}
        <div
          style={{ width: `${Math.max(1, reinvestRatio)}%` }}
          className="bg-blue-500 h-full transition-all duration-300 relative group"
          title={`Reinversión: ${formatCurrency(metrics.totalReinvestmentFund, currency)} (${formatPercent(reinvestRatio)})`}
        />
        {/* 3. Personal profit */}
        <div
          style={{ width: `${Math.max(1, personalRatio)}%` }}
          className="bg-emerald-500 h-full rounded-r-full transition-all duration-300 relative group"
          title={`Ganancia bolsillo: ${formatCurrency(metrics.totalPersonalProfit, currency)} (${formatPercent(personalRatio)})`}
        />
      </div>

      {/* Legend & Breakdown tiles in Bento cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Cost Recovery */}
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90">
          <div className="w-3.5 h-3.5 rounded-full bg-slate-500 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <div className="text-[11px] uppercase font-bold text-slate-400">1. Reposición de Costo</div>
            <div className="text-base font-bold text-white font-mono mt-0.5">
              {formatCurrency(metrics.totalCost, currency)}
            </div>
            <div className="text-[11px] text-slate-500">
              {formatPercent(costRatio)} del total cobrado
            </div>
          </div>
        </div>

        {/* Reinvestment Fund */}
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90">
          <div className="w-3.5 h-3.5 rounded-full bg-blue-500 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <div className="text-[11px] uppercase font-bold text-blue-400">2. Fondo de Reinversión</div>
            <div className="text-base font-bold text-blue-400 font-mono mt-0.5">
              {formatCurrency(metrics.totalReinvestmentFund, currency)}
            </div>
            <div className="text-[11px] text-slate-400">
              {formatPercent(reinvestRatio)} del total cobrado
            </div>
          </div>
        </div>

        {/* Personal Profit */}
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90">
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <div className="text-[11px] uppercase font-bold text-emerald-400">3. Lo Que Te Quedás</div>
            <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
              {formatCurrency(metrics.totalPersonalProfit, currency)}
            </div>
            <div className="text-[11px] text-slate-400">
              {formatPercent(personalRatio)} libre en tu bolsillo
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
