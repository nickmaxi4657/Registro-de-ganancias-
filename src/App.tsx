import React, { useState, useEffect } from 'react';
import { AppSettings, ProductPreset, Sale } from './types';
import { DEFAULT_SETTINGS, INITIAL_PRESETS, generateSampleSales } from './data/sampleData';
import { calculateSummaryMetrics } from './utils/calculations';
import { Header } from './components/Header';
import { MetricsOverview } from './components/MetricsOverview';
import { FinancialBreakdownBar } from './components/FinancialBreakdownBar';
import { QuickSimulator } from './components/QuickSimulator';
import { SalesList } from './components/SalesList';
import { SaleModal } from './components/SaleModal';
import { ProductCatalogModal } from './components/ProductCatalogModal';
import { SettingsModal } from './components/SettingsModal';

const STORAGE_KEYS = {
  SALES: 'profit_tracker_sales_v1',
  PRESETS: 'profit_tracker_presets_v1',
  SETTINGS: 'profit_tracker_settings_v1',
  SIMULATOR: 'profit_tracker_sim_open_v1',
};

export default function App() {
  // 1. App State with LocalStorage
  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SALES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading sales from storage', e);
    }
    // Default initial sample sales so the user immediately sees the visual flow
    return generateSampleSales();
  });

  const [presets, setPresets] = useState<ProductPreset[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRESETS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading presets', e);
    }
    return INITIAL_PRESETS;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Error loading settings', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SIMULATOR);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // 2. Modals state
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [saleInitialData, setSaleInitialData] = useState<{
    productName: string;
    unitCost: number;
    unitPrice: number;
    quantity: number;
    reinvestmentPercent: number;
  } | null>(null);

  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 3. Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    } catch (e) {
      console.error('Error saving sales', e);
    }
  }, [sales]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(presets));
    } catch (e) {
      console.error('Error saving presets', e);
    }
  }, [presets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SIMULATOR, JSON.stringify(isSimulatorOpen));
    } catch (e) {
      console.error('Error saving simulator state', e);
    }
  }, [isSimulatorOpen]);

  // Temporary toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3200);
  };

  // 4. Sales Actions
  const handleSaveSale = (saleData: Omit<Sale, 'id'>, editId?: string) => {
    if (editId) {
      setSales((prev) =>
        prev.map((s) => (s.id === editId ? { ...saleData, id: editId } : s))
      );
      showToast('Venta actualizada correctamente');
    } else {
      const newSale: Sale = {
        ...saleData,
        id: `sale-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      setSales((prev) => [newSale, ...prev]);
      showToast('Venta registrada exitosamente');
    }
    setEditingSale(null);
    setSaleInitialData(null);
  };

  const handleDeleteSale = (saleId: string) => {
    setSales((prev) => prev.filter((s) => s.id !== saleId));
    showToast('Venta eliminada del historial');
  };

  const handleDuplicateSale = (sale: Sale) => {
    const duplicated: Sale = {
      ...sale,
      id: `sale-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: new Date().toISOString(),
    };
    setSales((prev) => [duplicated, ...prev]);
    showToast(`Venta duplicada: "${sale.productName}"`);
  };

  const handleEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setSaleInitialData(null);
    setIsSaleModalOpen(true);
  };

  const handleOpenNewSale = () => {
    setEditingSale(null);
    setSaleInitialData(null);
    setIsSaleModalOpen(true);
  };

  const handleApplyFromSimulator = (data: {
    productName: string;
    unitCost: number;
    unitPrice: number;
    quantity: number;
    reinvestmentPercent: number;
  }) => {
    setEditingSale(null);
    setSaleInitialData(data);
    setIsSaleModalOpen(true);
  };

  const handleSelectPresetForSale = (preset: ProductPreset) => {
    setEditingSale(null);
    setSaleInitialData({
      productName: preset.name,
      unitCost: preset.unitCost,
      unitPrice: preset.unitPrice,
      quantity: 1,
      reinvestmentPercent: preset.reinvestmentPercent ?? settings.defaultReinvestmentPercent,
    });
    setIsSaleModalOpen(true);
  };

  // 5. Presets Actions
  const handleSavePreset = (preset: ProductPreset) => {
    setPresets((prev) => {
      const exists = prev.some((p) => p.id === preset.id);
      if (exists) {
        return prev.map((p) => (p.id === preset.id ? preset : p));
      }
      return [...prev, preset];
    });
    showToast('Producto guardado en el catálogo');
  };

  const handleDeletePreset = (presetId: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== presetId));
    showToast('Producto eliminado del catálogo');
  };

  // 6. Settings & Data Actions
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    showToast('Ajustes guardados');
  };

  const handleResetAllData = () => {
    setSales([]);
    localStorage.removeItem(STORAGE_KEYS.SALES);
    showToast('Historial reiniciado');
  };

  const handleLoadSampleData = () => {
    const samples = generateSampleSales();
    setSales(samples);
    setPresets(INITIAL_PRESETS);
    showToast('Datos de ejemplo cargados');
  };

  // 7. CSV Export
  const handleExportCSV = () => {
    if (sales.length === 0) {
      alert('No hay ventas para exportar.');
      return;
    }

    const headers = [
      'ID',
      'Fecha',
      'Producto',
      'Cantidad',
      'Costo Unitario',
      'Precio Unitario',
      'Costo Total',
      'Cobro Total (Ingreso)',
      'Ganancia Neta',
      'Margen (%)',
      '% Reinversion',
      'Monto Reinversion',
      'Ganancia Personal (Te quedas)',
      'Total a Retener en Negocio',
      'Metodo de Pago',
      'Categoria',
      'Notas',
    ];

    const rows = sales.map((s) => [
      `"${s.id}"`,
      `"${s.date}"`,
      `"${s.productName.replace(/"/g, '""')}"`,
      s.quantity,
      s.unitCost,
      s.unitPrice,
      s.totalCost,
      s.totalRevenue,
      s.netProfit,
      s.profitMargin.toFixed(2),
      s.reinvestmentPercent,
      s.reinvestmentAmount,
      s.personalProfitAmount,
      s.totalBusinessRetention,
      `"${(s.paymentMethod || '').replace(/"/g, '""')}"`,
      `"${(s.category || '').replace(/"/g, '""')}"`,
      `"${(s.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `ganancias_y_reinversion_${new Date().toISOString().substring(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Archivo CSV descargado');
  };

  // 8. JSON Export / Import
  const handleExportJSON = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings,
      presets,
      sales,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `respaldo_ganancias_${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Copia de respaldo JSON generada');
  };

  const handleImportJSON = (imported: {
    sales: Sale[];
    presets?: ProductPreset[];
    settings?: AppSettings;
  }) => {
    if (Array.isArray(imported.sales)) {
      setSales(imported.sales);
    }
    if (Array.isArray(imported.presets)) {
      setPresets(imported.presets);
    }
    if (imported.settings) {
      setSettings(imported.settings);
    }
    showToast('Copia restaurada exitosamente');
  };

  // Summary Metrics
  const summaryMetrics = calculateSummaryMetrics(sales);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
      
      {/* App Header */}
      <Header
        settings={settings}
        onOpenNewSale={handleOpenNewSale}
        onOpenCatalog={() => setIsCatalogOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleSimulator={() => setIsSimulatorOpen((prev) => !prev)}
        isSimulatorOpen={isSimulatorOpen}
        onExportCSV={handleExportCSV}
        salesCount={sales.length}
      />

      {/* Main Bento Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 1. KPIs / Metrics Overview Cards (4 Bento Cards) */}
        <MetricsOverview metrics={summaryMetrics} currency={settings.currency} />

        {/* 2. Bento Grid: Simulator & Breakdown + Sales List */}
        {isSimulatorOpen ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Quick Calculator & Global Financial Distribution */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <QuickSimulator
                currency={settings.currency}
                defaultReinvestmentPercent={settings.defaultReinvestmentPercent}
                onApplyToNewSale={handleApplyFromSimulator}
              />
              <FinancialBreakdownBar metrics={summaryMetrics} currency={settings.currency} />
            </div>

            {/* Right Column: Latest Sales Table */}
            <div className="lg:col-span-7">
              <SalesList
                sales={sales}
                currency={settings.currency}
                onEditSale={handleEditSale}
                onDeleteSale={handleDeleteSale}
                onDuplicateSale={handleDuplicateSale}
                onOpenNewSale={handleOpenNewSale}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <FinancialBreakdownBar metrics={summaryMetrics} currency={settings.currency} />
            <SalesList
              sales={sales}
              currency={settings.currency}
              onEditSale={handleEditSale}
              onDeleteSale={handleDeleteSale}
              onDuplicateSale={handleDuplicateSale}
              onOpenNewSale={handleOpenNewSale}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 font-mono">
          <p>
            <strong className="text-slate-400">Registro de Ganancias y Reinversión</strong> — Auto-Split Financiero
          </p>
          <div className="flex items-center gap-3">
            <span>Separación automática de fondo de stock y ganancia de bolsillo</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SaleModal
        isOpen={isSaleModalOpen}
        onClose={() => {
          setIsSaleModalOpen(false);
          setEditingSale(null);
          setSaleInitialData(null);
        }}
        onSaveSale={handleSaveSale}
        editSale={editingSale}
        initialData={saleInitialData}
        currency={settings.currency}
        defaultReinvestmentPercent={settings.defaultReinvestmentPercent}
        presets={presets}
      />

      <ProductCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        presets={presets}
        onSavePreset={handleSavePreset}
        onDeletePreset={handleDeletePreset}
        onSelectForSale={handleSelectPresetForSale}
        currency={settings.currency}
        defaultReinvestmentPercent={settings.defaultReinvestmentPercent}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onResetAllData={handleResetAllData}
        onLoadSampleData={handleLoadSampleData}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
      />

    </div>
  );
}
