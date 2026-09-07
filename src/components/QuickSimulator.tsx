import React, { useState } from 'react';
import { 
  Calculator, 
  ArrowRight, 
  TrendingUp, 
  Wallet, 
  PiggyBank, 
  PlusCircle, 
  RotateCcw,
  Percent
} from 'lucide-react';
import { calculateSaleMetrics } from '../utils/calculations';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface QuickSimulatorProps {
  currency: string;
  defaultReinvestmentPercent: number;
  onApplyToNewSale: (data: {
    productName: string;
    unitCost: number;
    unitPrice: number;
    quantity: number;
    reinvestmentPercent: number;
  }) => void;
}

export const QuickSimulator: React.FC<QuickSimulatorProps> = ({
  currency,
  defaultReinvestmentPercent,
  onApplyToNewSale,
}) => {
  const [productName, setProductName] = useState('');
  const [costInput, setCostInput] = useState<string>('5000');
  const [priceInput, setPriceInput] = useState<string>('12000');
  const [quantity, setQuantity] = useState<number>(1);
  const [reinvestmentPct, setReinvestmentPct] = useState<number>(defaultReinvestmentPercent);

  const unitCost = parseFloat(costInput) || 0;
  const unitPrice = parseFloat(priceInput) || 0;

  const metrics = calculateSaleMetrics(unitCost, unitPrice, quantity, reinvestmentPct);
  const personalProfitPct = Math.max(0, 100 - reinvestmentPct);

  const handleReset = () => {
    setCostInput('');
    setPriceInput('');
    setProductName('');
    setQuantity(1);
    setReinvestmentPct(defaultReinvestmentPercent);
  };

  const handleRegisterSale = () => {
    if (unitPrice <= 0) return;
    onApplyToNewSale({
      productName: productName.trim() || 'Venta Rápida',
      unitCost,
      unitPrice,
      quantity,
      reinvestmentPercent: reinvestmentPct,
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
          <span className="w-2 h-6 bg-emerald-500 rounded-full shrink-0"></span>
          Calculadora de Venta
        </h2>

        <button
          id="btn-reset-simulator"
          type="button"
          onClick={handleReset}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-slate-700"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Limpiar</span>
        </button>
      </div>

      <div className="space-y-4">
        {/* Product Concept */}
        <div>
          <label htmlFor="sim-product-name" className="text-[10px] uppercase text-slate-500 font-bold mb-1.5 block tracking-wider">
            Nombre del Producto o Concepto
          </label>
          <input
            id="sim-product-name"
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Ej. Remera Oversize Beige, Servicio..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600"
          />
        </div>

        {/* Cost & Price Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="sim-cost" className="text-[10px] uppercase text-slate-500 font-bold mb-1.5 block tracking-wider">
              Costo ({currency})
            </label>
            <input
              id="sim-cost"
              type="number"
              min="0"
              step="any"
              value={costInput}
              onChange={(e) => setCostInput(e.target.value)}
              placeholder="0"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="sim-price" className="text-[10px] uppercase text-slate-500 font-bold mb-1.5 block tracking-wider">
              Venta / Cobro ({currency})
            </label>
            <input
              id="sim-price"
              type="number"
              min="0"
              step="any"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              placeholder="0"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-emerald-400 font-semibold focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="sim-quantity" className="text-[10px] uppercase text-slate-500 font-bold mb-1.5 block tracking-wider">
              Cantidad
            </label>
            <input
              id="sim-quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Reinvestment Slider */}
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
              <PiggyBank className="w-3.5 h-3.5 text-blue-400" />
              Tasa de Reinversión:
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {reinvestmentPct}% Auto ({personalProfitPct}% Te Quedás)
            </span>
          </div>

          <input
            id="sim-reinvestment-slider"
            type="range"
            min="0"
            max="100"
            step="5"
            value={reinvestmentPct}
            onChange={(e) => setReinvestmentPct(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />

          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[10px] text-slate-500 font-semibold">Atajos:</span>
            {[20, 30, 40, 50, 60].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setReinvestmentPct(pct)}
                className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors ${
                  reinvestmentPct === pct
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {/* Bento Desglose de Operación Panel */}
        <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 border-dashed space-y-2.5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Desglose de Operación</span>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Margen: {formatPercent(metrics.profitMargin)}
            </span>
          </p>

          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">Cobro Total</span>
            <span className="font-bold text-white font-mono">
              {formatCurrency(metrics.totalRevenue, currency)}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">Ganancia Neta</span>
            <span className="font-bold text-emerald-400 font-mono">
              {formatCurrency(metrics.netProfit, currency)} ({formatPercent(metrics.profitMargin)})
            </span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">Para Reinversión</span>
            <span className="font-bold text-blue-400 font-mono">
              {formatCurrency(metrics.reinvestmentAmount, currency)} ({reinvestmentPct}%)
            </span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">Para Tu Bolsillo</span>
            <span className="font-bold text-indigo-400 font-mono">
              {formatCurrency(metrics.personalProfitAmount, currency)} ({personalProfitPct}%)
            </span>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-xs">
            <span className="text-slate-500">Dejar en caja (Costo + Reinversión):</span>
            <span className="font-bold text-slate-200 font-mono">
              {formatCurrency(metrics.totalBusinessRetention, currency)}
            </span>
          </div>
        </div>

        {/* Action button in bento white button style */}
        <button
          id="btn-apply-simulator"
          type="button"
          onClick={handleRegisterSale}
          disabled={unitPrice <= 0}
          className="w-full bg-white text-slate-950 font-bold py-3.5 rounded-2xl hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-white transition-colors uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-sm"
        >
          <span>Guardar Transacción</span>
          <ArrowRight className="w-4 h-4 text-slate-900" />
        </button>
      </div>
    </div>
  );
};
