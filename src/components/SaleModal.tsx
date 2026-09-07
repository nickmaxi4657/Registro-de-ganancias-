import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  DollarSign, 
  Percent, 
  Calendar, 
  Tag, 
  CreditCard, 
  Wallet, 
  PiggyBank, 
  TrendingUp, 
  ShieldCheck,
  Package
} from 'lucide-react';
import { ProductPreset, Sale } from '../types';
import { calculateSaleMetrics } from '../utils/calculations';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSale: (saleData: Omit<Sale, 'id'>, editId?: string) => void;
  editSale?: Sale | null;
  initialData?: {
    productName: string;
    unitCost: number;
    unitPrice: number;
    quantity: number;
    reinvestmentPercent: number;
  } | null;
  currency: string;
  defaultReinvestmentPercent: number;
  presets: ProductPreset[];
}

export const SaleModal: React.FC<SaleModalProps> = ({
  isOpen,
  onClose,
  onSaveSale,
  editSale,
  initialData,
  currency,
  defaultReinvestmentPercent,
  presets,
}) => {
  const [productName, setProductName] = useState('');
  const [unitCost, setUnitCost] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [reinvestmentPercent, setReinvestmentPercent] = useState<number>(defaultReinvestmentPercent);
  const [category, setCategory] = useState<string>('General');
  const [paymentMethod, setPaymentMethod] = useState<string>('Transferencia');
  const [date, setDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (editSale) {
      setProductName(editSale.productName);
      setUnitCost(editSale.unitCost.toString());
      setUnitPrice(editSale.unitPrice.toString());
      setQuantity(editSale.quantity);
      setReinvestmentPercent(editSale.reinvestmentPercent);
      setCategory(editSale.category || 'General');
      setPaymentMethod(editSale.paymentMethod || 'Transferencia');
      setDate(editSale.date ? editSale.date.substring(0, 16) : new Date().toISOString().substring(0, 16));
      setNotes(editSale.notes || '');
    } else if (initialData) {
      setProductName(initialData.productName || '');
      setUnitCost(initialData.unitCost ? initialData.unitCost.toString() : '');
      setUnitPrice(initialData.unitPrice ? initialData.unitPrice.toString() : '');
      setQuantity(initialData.quantity || 1);
      setReinvestmentPercent(initialData.reinvestmentPercent || defaultReinvestmentPercent);
      setCategory('General');
      setPaymentMethod('Transferencia');
      setDate(new Date().toISOString().substring(0, 16));
      setNotes('');
    } else {
      // Reset defaults for new sale
      setProductName('');
      setUnitCost('');
      setUnitPrice('');
      setQuantity(1);
      setReinvestmentPercent(defaultReinvestmentPercent);
      setCategory('General');
      setPaymentMethod('Transferencia');
      setDate(new Date().toISOString().substring(0, 16));
      setNotes('');
    }
  }, [editSale, initialData, defaultReinvestmentPercent, isOpen]);

  if (!isOpen) return null;

  const costNum = parseFloat(unitCost) || 0;
  const priceNum = parseFloat(unitPrice) || 0;
  const previewMetrics = calculateSaleMetrics(costNum, priceNum, quantity, reinvestmentPercent);
  const personalPercent = Math.max(0, 100 - reinvestmentPercent);

  const handleSelectPreset = (preset: ProductPreset) => {
    setProductName(preset.name);
    setUnitCost(preset.unitCost.toString());
    setUnitPrice(preset.unitPrice.toString());
    if (preset.category) setCategory(preset.category);
    if (preset.reinvestmentPercent !== undefined) {
      setReinvestmentPercent(preset.reinvestmentPercent);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || priceNum <= 0) return;

    const fullDate = date ? new Date(date).toISOString() : new Date().toISOString();

    const salePayload = {
      productName: productName.trim(),
      unitCost: costNum,
      unitPrice: priceNum,
      quantity,
      category: category.trim() || 'General',
      paymentMethod: paymentMethod.trim() || 'Efectivo',
      date: fullDate,
      notes: notes.trim(),
      reinvestmentPercent,
      ...previewMetrics,
    };

    onSaveSale(salePayload, editSale ? editSale.id : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div 
        id="sale-modal-container"
        className="bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-800 text-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-5 bg-emerald-500 rounded-full"></span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {editSale ? 'Editar Registro de Venta' : 'Registrar Nueva Venta'}
              </h2>
              <p className="text-xs text-slate-400">
                Calculá tus márgenes y dividí automáticamente tu fondo de reinversión
              </p>
            </div>
          </div>
          <button
            id="btn-close-sale-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          
          {/* Presets suggestions (if any and not editing) */}
          {!editSale && presets.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2">
                <Package className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cargar rápido desde catálogo frecuente:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className="text-xs px-3 py-1 rounded-xl bg-slate-950 hover:bg-emerald-950/40 hover:text-emerald-300 hover:border-emerald-500/50 border border-slate-800 text-slate-300 transition-all text-left font-mono"
                  >
                    <span>{p.name}</span>
                    <span className="text-slate-500 ml-1.5">({formatCurrency(p.unitPrice, currency)})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Product Name */}
          <div>
            <label htmlFor="sale-product-name" className="text-[10px] uppercase text-slate-500 font-bold mb-1.5 block tracking-wider">
              Producto o Concepto <span className="text-emerald-400">*</span>
            </label>
            <input
              id="sale-product-name"
              type="text"
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Ej: Remera negra talle XL, Arreglo de PC, Joyería..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 font-medium"
            />
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Unit Cost */}
            <div>
              <label htmlFor="sale-unit-cost" className="text-[10px] uppercase text-slate-500 font-bold mb-1.5 block tracking-wider">
                Lo que te sale (Costo)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-500 font-mono">
                  {currency}
                </span>
                <input
                  id="sale-unit-cost"
                  type="number"
                  min="0"
                  step="any"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Costo unitario</span>
            </div>

            {/* Unit Price */}
            <div>
              <label htmlFor="sale-unit-price" className="text-[10px] uppercase text-slate-500 font-bold mb-1.5 block tracking-wider">
                Lo que tú cobras (Venta) <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-500 font-mono">
                  {currency}
                </span>
                <input
                  id="sale-unit-price"
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Precio cobrado</span>
            </div>

            {/* Quantity */}
            <div>
              <label htmlFor="sale-quantity" className="text-[10px] uppercase text-slate-500 font-bold mb-1.5 block tracking-wider">
                Cantidad
              </label>
              <input
                id="sale-quantity"
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Unidades</span>
            </div>
          </div>

          {/* Reinvestment percentage selector */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <PiggyBank className="w-4 h-4 text-blue-400" />
                Porcentaje para Reinversión Automática en esta Venta:
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg">
                {reinvestmentPercent}%
              </span>
            </div>

            <input
              id="sale-reinvestment-slider"
              type="range"
              min="0"
              max="100"
              step="5"
              value={reinvestmentPercent}
              onChange={(e) => setReinvestmentPercent(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />

            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>0% (Bolsillo total)</span>
              <span>50% (Equilibrado)</span>
              <span>100% (Reinversión total)</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] text-slate-500 font-semibold">Atajos:</span>
              {[20, 30, 40, 50, 60].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setReinvestmentPercent(pct)}
                  className={`px-2.5 py-0.5 text-xs font-mono rounded-lg transition-colors ${
                    reinvestmentPercent === pct
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Real-time split preview card */}
          {priceNum > 0 && (
            <div className="rounded-2xl p-4 bg-slate-950 border border-slate-800 border-dashed space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-2">
                <span>Resumen de esta venta:</span>
                <span className="text-emerald-400 font-mono font-semibold">
                  Margen: {formatPercent(previewMetrics.profitMargin)} | Markup: +{formatPercent(previewMetrics.markupPercent)}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center font-mono">
                {/* Cobro */}
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Cobro Total</span>
                  <span className="text-sm font-bold text-white">
                    {formatCurrency(previewMetrics.totalRevenue, currency)}
                  </span>
                </div>

                {/* Ganancia Limpia */}
                <div className="bg-slate-900 border border-emerald-500/30 p-2.5 rounded-xl">
                  <span className="text-[10px] text-emerald-400 block uppercase">Ganancia Neta</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {formatCurrency(previewMetrics.netProfit, currency)}
                  </span>
                </div>

                {/* Lo que te queda */}
                <div className="bg-slate-900 border border-indigo-500/30 p-2.5 rounded-xl">
                  <span className="text-[10px] text-indigo-300 block uppercase">
                    Te Quedás ({personalPercent}%)
                  </span>
                  <span className="text-sm font-bold text-indigo-300">
                    {formatCurrency(previewMetrics.personalProfitAmount, currency)}
                  </span>
                </div>

                {/* Reinversión */}
                <div className="bg-slate-900 border border-blue-500/30 p-2.5 rounded-xl">
                  <span className="text-[10px] text-blue-300 block uppercase">
                    Reinversión ({reinvestmentPercent}%)
                  </span>
                  <span className="text-sm font-bold text-blue-400">
                    {formatCurrency(previewMetrics.reinvestmentAmount, currency)}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Dejar en caja (Costo + Reinversión):
                </span>
                <span className="font-bold text-slate-200 font-mono">
                  {formatCurrency(previewMetrics.totalBusinessRetention, currency)}
                </span>
              </div>
            </div>
          )}

          {/* Secondary Details: Category, Payment, Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Category */}
            <div>
              <label htmlFor="sale-category" className="text-[10px] uppercase text-slate-500 font-bold mb-1.5 block tracking-wider">
                Categoría
              </label>
              <input
                id="sale-category"
                type="text"
                list="category-options"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ej. Indumentaria"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <datalist id="category-options">
                <option value="Indumentaria" />
                <option value="Calzado" />
                <option value="Accesorios" />
                <option value="Tecnología" />
                <option value="Comida / Gastronomía" />
                <option value="Servicios" />
                <option value="General" />
              </datalist>
            </div>

            {/* Payment Method */}
            <div>
              <label htmlFor="sale-payment-method" className="text-[10px] uppercase text-slate-500 font-bold mb-1.5 block tracking-wider">
                Método de Pago
              </label>
              <input
                id="sale-payment-method"
                type="text"
                list="payment-options"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                placeholder="Ej. Efectivo"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <datalist id="payment-options">
                <option value="Transferencia" />
                <option value="Mercado Pago" />
                <option value="Efectivo" />
                <option value="Tarjeta de Débito" />
                <option value="Tarjeta de Crédito" />
              </datalist>
            </div>

            {/* Date */}
            <div>
              <label htmlFor="sale-date" className="text-[10px] uppercase text-slate-500 font-bold mb-1.5 block tracking-wider">
                Fecha y Hora
              </label>
              <input
                id="sale-date"
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="sale-notes" className="text-[10px] uppercase text-slate-500 font-bold mb-1.5 block tracking-wider">
              Notas u observaciones (Opcional)
            </label>
            <input
              id="sale-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Cliente Juan, pago 50% de seña, entrega en local..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              id="btn-cancel-sale"
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-save-sale"
              type="submit"
              disabled={!productName.trim() || priceNum <= 0}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm inline-flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{editSale ? 'Guardar Cambios' : 'Registrar Venta'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
