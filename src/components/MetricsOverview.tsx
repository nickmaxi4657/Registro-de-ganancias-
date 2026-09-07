import React from 'react';
import { 
  TrendingUp, 
  Wallet, 
  PiggyBank, 
  Plus,
  ArrowUpRight
} from 'lucide-react';
import { SummaryMetrics } from '../types';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface MetricsOverviewProps {
  metrics: SummaryMetrics;
  currency: string;
  onOpenNewSale?: () => void;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ 
  metrics, 
  currency,
  onOpenNewSale 
}) => {
  const personalSharePercent = metrics.totalNetProfit > 0 
    ? (metrics.totalPersonalProfit / metrics.totalNetProfit) * 100 
    : 0;
  
  const reinvestSharePercent = metrics.totalNetProfit > 0 
    ? (metrics.totalReinvestmentFund / metrics.totalNetProfit) * 100 
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Bento 1: Ganancia Total */}
      <div 
        id="metric-total-profit"
        className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:border-slate-700 transition-colors"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">
            Ganancia Total
          </p>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            {formatPercent(metrics.averageProfitMargin)} Margen
          </span>
        </div>
        <div>
          <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {formatCurrency(metrics.totalNetProfit, currency)}
          </p>
          <div className="flex items-center justify-between mt-1 text-xs">
            <span className="text-emerald-500 font-medium flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {metrics.totalSalesCount} {metrics.totalSalesCount === 1 ? 'venta' : 'ventas'}
            </span>
            <span className="text-slate-500">
              Ventas: {formatCurrency(metrics.totalRevenue, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Bento 2: Fondo Reinversión */}
      <div 
        id="metric-reinvestment"
        className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:border-slate-700 transition-colors"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">
            Fondo Reinversión
          </p>
          <div className="w-6 h-6 rounded-md bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <PiggyBank className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <p className="text-2xl sm:text-3xl font-bold text-blue-400 tracking-tight">
            {formatCurrency(metrics.totalReinvestmentFund, currency)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {formatPercent(reinvestSharePercent, 0)} • Listo para mercadería
          </p>
        </div>
      </div>

      {/* Bento 3: Margen Promedio & Bolsillo */}
      <div 
        id="metric-average-margin"
        className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:border-slate-700 transition-colors"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">
            Margen Promedio
          </p>
          <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-400 tracking-tight">
            {formatPercent(metrics.averageProfitMargin)}
          </p>
          <p className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>Rendimiento saludable</span>
            <span className="text-indigo-300 font-medium font-mono text-[11px]">
              Bolsillo: {formatCurrency(metrics.totalPersonalProfit, currency)}
            </span>
          </p>
        </div>
      </div>

      {/* Bento 4: Nueva Venta (Action Bento Card) */}
      <div 
        id="bento-new-sale-card"
        onClick={onOpenNewSale}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onOpenNewSale?.()}
        className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl p-5 flex flex-col justify-center items-center text-center cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-emerald-950/50 active:scale-[0.98] select-none group"
      >
        <div className="bg-white/20 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
          <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
        </div>
        <p className="text-white font-bold text-base">Nueva Venta</p>
        <p className="text-emerald-100 text-[10px] mt-0.5 uppercase tracking-wider font-semibold">
          Registrar operación
        </p>
      </div>
    </div>
  );
};
