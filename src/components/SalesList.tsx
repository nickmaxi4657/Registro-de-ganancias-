import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Copy, 
  Calendar, 
  Tag, 
  ArrowUpDown, 
  Wallet, 
  PiggyBank, 
  ShoppingBag,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { DateFilter, Sale } from '../types';
import { formatCurrency, formatDate, formatPercent } from '../utils/formatters';

interface SalesListProps {
  sales: Sale[];
  currency: string;
  onEditSale: (sale: Sale) => void;
  onDeleteSale: (saleId: string) => void;
  onDuplicateSale: (sale: Sale) => void;
  onOpenNewSale: () => void;
}

export const SalesList: React.FC<SalesListProps> = ({
  sales,
  currency,
  onEditSale,
  onDeleteSale,
  onDuplicateSale,
  onOpenNewSale,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'profit-desc' | 'revenue-desc'>('date-desc');
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    sales.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return Array.from(set);
  }, [sales]);

  // Filter sales
  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return sales.filter((sale) => {
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = sale.productName.toLowerCase().includes(query);
        const matchesCat = (sale.category || '').toLowerCase().includes(query);
        const matchesNotes = (sale.notes || '').toLowerCase().includes(query);
        if (!matchesName && !matchesCat && !matchesNotes) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && sale.category !== selectedCategory) {
        return false;
      }

      // Date filter
      const saleDate = new Date(sale.date);
      if (dateFilter === 'today') {
        return saleDate >= todayStart;
      }
      if (dateFilter === 'week') {
        return saleDate >= weekStart;
      }
      if (dateFilter === 'month') {
        return saleDate >= monthStart;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'profit-desc') {
        return b.netProfit - a.netProfit;
      }
      if (sortBy === 'revenue-desc') {
        return b.totalRevenue - a.totalRevenue;
      }
      // date-desc default
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [sales, searchTerm, dateFilter, selectedCategory, sortBy]);

  const confirmDelete = (id: string) => {
    onDeleteSale(id);
    setSaleToDelete(null);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm overflow-hidden flex flex-col">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-6 bg-blue-500 rounded-full shrink-0"></span>
          <h2 className="text-base sm:text-lg font-bold text-white">
            Últimas Ventas Realizadas
          </h2>
          <span className="text-xs font-mono text-slate-400 bg-slate-950 border border-slate-800 px-2.5 py-0.5 rounded-full">
            {filteredSales.length} {filteredSales.length === 1 ? 'venta' : 'ventas'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Filter Tabs */}
          <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs font-medium">
            {(['all', 'today', 'week', 'month'] as const).map((filter) => {
              const labels = { all: 'Todo', today: 'Hoy', week: '7 Días', month: 'Este Mes' };
              const isActive = dateFilter === filter;
              return (
                <button
                  key={filter}
                  id={`filter-${filter}`}
                  type="button"
                  onClick={() => setDateFilter(filter)}
                  className={`px-2.5 py-1 rounded-lg transition-colors text-[11px] font-mono ${
                    isActive 
                      ? 'bg-slate-800 text-white font-bold shadow-xs' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {labels[filter]}
                </button>
              );
            })}
          </div>

          <span className="hidden md:inline-flex text-[11px] text-slate-400 border border-slate-800 px-3 py-1 rounded-full bg-slate-950 font-mono">
            Auto-Split Activo
          </span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 mb-4">
        {/* Search bar */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            id="sales-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por producto, categoría o nota..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 font-sans"
          />
        </div>

        {/* Category Dropdown */}
        <div className="sm:col-span-3">
          <select
            id="sales-category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Todas las Categorías</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="sm:col-span-3">
          <select
            id="sales-sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="date-desc">Más Recientes</option>
            <option value="profit-desc">Mayor Ganancia</option>
            <option value="revenue-desc">Mayor Venta ($)</option>
          </select>
        </div>
      </div>

      {/* List / Table Content */}
      {filteredSales.length === 0 ? (
        <div className="text-center py-12 px-4 bg-slate-950/40 rounded-2xl border border-slate-800/80">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-200">No hay ventas registradas</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            {searchTerm || selectedCategory !== 'all' || dateFilter !== 'all'
              ? 'Prueba cambiando los filtros o el término de búsqueda.'
              : 'Empieza a registrar tus ventas para ver tus ganancias netas y la reinversión calculada automáticamente.'}
          </p>
          <button
            id="btn-empty-new-sale"
            type="button"
            onClick={onOpenNewSale}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            <span>+ Registrar Primera Venta</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                <th className="pb-3 px-3">Producto / Fecha</th>
                <th className="pb-3 px-3 text-right">Venta</th>
                <th className="pb-3 px-3 text-right">Ganancia</th>
                <th className="pb-3 px-3 text-right">A Reinversión</th>
                <th className="pb-3 px-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-800/60">
              {filteredSales.map((sale) => {
                const personalPercent = Math.max(0, 100 - sale.reinvestmentPercent);

                return (
                  <tr 
                    key={sale.id}
                    id={`sale-item-${sale.id}`}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Producto */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
                          {sale.productName}
                        </span>
                        {sale.quantity > 1 && (
                          <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                            x{sale.quantity}
                          </span>
                        )}
                        {sale.category && (
                          <span className="text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.2 rounded hidden sm:inline">
                            {sale.category}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                        <span>{formatDate(sale.date)}</span>
                        {sale.paymentMethod && (
                          <span className="text-slate-600">• {sale.paymentMethod}</span>
                        )}
                        {sale.notes && (
                          <span className="text-slate-500 italic truncate max-w-[160px] hidden sm:inline">
                            "{sale.notes}"
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Venta */}
                    <td className="py-3.5 px-3 text-right font-mono">
                      <div className="font-bold text-slate-200">
                        {formatCurrency(sale.totalRevenue, currency)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Costo: {formatCurrency(sale.totalCost, currency)}
                      </div>
                    </td>

                    {/* Ganancia */}
                    <td className="py-3.5 px-3 text-right font-mono">
                      <div className="font-bold text-emerald-400">
                        {formatCurrency(sale.netProfit, currency)}
                      </div>
                      <div className="text-[10px] text-emerald-500/80">
                        {formatPercent(sale.profitMargin)} mrg
                      </div>
                    </td>

                    {/* A Reinversión */}
                    <td className="py-3.5 px-3 text-right font-mono">
                      <div className="font-bold text-blue-400">
                        {formatCurrency(sale.reinvestmentAmount, currency)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {sale.reinvestmentPercent}% • Bolsillo: {formatCurrency(sale.personalProfitAmount, currency)}
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onDuplicateSale(sale)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          title="Duplicar venta"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditSale(sale)}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Editar venta"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSaleToDelete(sale.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Eliminar venta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Inline Delete Confirmation */}
                      {saleToDelete === sale.id && (
                        <div className="mt-2 p-2 rounded-xl bg-red-950/80 border border-red-800/80 flex items-center justify-end gap-2 text-xs text-red-200">
                          <span className="text-[11px]">¿Eliminar venta?</span>
                          <button
                            type="button"
                            onClick={() => setSaleToDelete(null)}
                            className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700 text-[11px]"
                          >
                            No
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDelete(sale.id)}
                            className="px-2 py-0.5 rounded bg-red-600 text-white font-semibold text-[11px]"
                          >
                            Sí
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
