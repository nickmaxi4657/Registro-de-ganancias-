import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, Check, Package, ShoppingBag, ArrowRight } from 'lucide-react';
import { ProductPreset } from '../types';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { calculateSaleMetrics } from '../utils/calculations';

interface ProductCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  presets: ProductPreset[];
  onSavePreset: (preset: ProductPreset) => void;
  onDeletePreset: (presetId: string) => void;
  onSelectForSale: (preset: ProductPreset) => void;
  currency: string;
  defaultReinvestmentPercent: number;
}

export const ProductCatalogModal: React.FC<ProductCatalogModalProps> = ({
  isOpen,
  onClose,
  presets,
  onSavePreset,
  onDeletePreset,
  onSelectForSale,
  currency,
  defaultReinvestmentPercent,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [category, setCategory] = useState('General');
  const [reinvestmentPct, setReinvestmentPct] = useState<number>(defaultReinvestmentPercent);

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setName('');
    setUnitCost('');
    setUnitPrice('');
    setCategory('General');
    setReinvestmentPct(defaultReinvestmentPercent);
  };

  const handleStartEdit = (preset: ProductPreset) => {
    setIsAdding(true);
    setEditingId(preset.id);
    setName(preset.name);
    setUnitCost(preset.unitCost.toString());
    setUnitPrice(preset.unitPrice.toString());
    setCategory(preset.category || 'General');
    setReinvestmentPct(preset.reinvestmentPercent ?? defaultReinvestmentPercent);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(unitCost) || 0;
    const price = parseFloat(unitPrice) || 0;
    if (!name.trim() || price <= 0) return;

    onSavePreset({
      id: editingId || `preset-${Date.now()}`,
      name: name.trim(),
      unitCost: cost,
      unitPrice: price,
      category: category.trim() || 'General',
      reinvestmentPercent: reinvestmentPct,
    });

    setIsAdding(false);
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div 
        id="catalog-modal-container"
        className="bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-800 text-slate-100 overflow-hidden my-auto max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-5 bg-blue-500 rounded-full"></span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Catálogo de Productos y Servicios
              </h2>
              <p className="text-xs text-slate-400">
                Guarda tus artículos con costo y precio para registrar ventas al instante
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          {/* Top action to add new preset */}
          {!isAdding && (
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-slate-400">
                {presets.length} {presets.length === 1 ? 'producto guardado' : 'productos guardados'}
              </span>
              <button
                id="btn-start-add-preset"
                type="button"
                onClick={handleStartAdd}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Producto / Servicio</span>
              </button>
            </div>
          )}

          {/* Form to add/edit preset */}
          {isAdding && (
            <form onSubmit={handleSaveForm} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-emerald-500 rounded-full"></span>
                {editingId ? 'Modificar Producto Frecuente' : 'Agregar Nuevo Producto Frecuente'}
              </div>

              <div>
                <label className="text-[10px] uppercase text-slate-500 font-bold mb-1.5 block tracking-wider">
                  Nombre del Producto o Servicio <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Remera Clásica"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase text-slate-500 font-bold mb-1.5 block tracking-wider">
                    Costo ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase text-slate-500 font-bold mb-1.5 block tracking-wider">
                    Precio Cobrado ({currency}) <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase text-slate-500 font-bold mb-1.5 block tracking-wider">
                    % Reinversión
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={reinvestmentPct}
                    onChange={(e) => setReinvestmentPct(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-blue-400 font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Producto</span>
                </button>
              </div>
            </form>
          )}

          {/* List of presets */}
          <div className="space-y-2">
            {presets.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-slate-800/60">
                No tienes productos en tu catálogo. Añade uno para registrar ventas más rápido.
              </div>
            ) : (
              presets.map((preset) => {
                const preview = calculateSaleMetrics(preset.unitCost, preset.unitPrice, 1, preset.reinvestmentPercent ?? defaultReinvestmentPercent);

                return (
                  <div
                    key={preset.id}
                    className="p-3.5 rounded-2xl border border-slate-800 bg-slate-950 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{preset.name}</span>
                        {preset.category && (
                          <span className="text-[10px] bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-full">
                            {preset.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-1 flex-wrap">
                        <span>Costo: <strong className="text-slate-300">{formatCurrency(preset.unitCost, currency)}</strong></span>
                        <span>•</span>
                        <span>Precio: <strong className="text-emerald-400">{formatCurrency(preset.unitPrice, currency)}</strong></span>
                        <span>•</span>
                        <span>Ganancia: <strong className="text-blue-400">{formatCurrency(preview.netProfit, currency)}</strong> ({formatPercent(preview.profitMargin)})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(preset)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeletePreset(preset.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectForSale(preset);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-sm"
                      >
                        <span>Vender</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
