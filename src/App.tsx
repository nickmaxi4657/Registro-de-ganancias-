import React, { useState, useEffect } from 'react';
import { AppSettings, ProductPreset, Sale, UserProfile, SyncStatus } from './types';
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
import { AuthModal } from './components/AuthModal';
import { DesktopInstallModal } from './components/DesktopInstallModal';
import { usePWA } from './hooks/usePWA';
import { 
  getFirebaseAuth, 
  mapFirebaseUser, 
  subscribeToUserSales, 
  subscribeToUserSettings, 
  subscribeToUserPresets,
  isFirebaseConfigured
} from './lib/firebase';
import {
  checkCurrentSession,
  fetchCloudData,
  uploadFullCloudData,
  syncSingleSaleToCloud,
  deleteSingleSaleFromCloud,
  syncPresetToCloud,
  deletePresetFromCloud,
  syncSettingsToCloud,
  getCachedUser
} from './lib/syncService';
import { onAuthStateChanged } from 'firebase/auth';

const STORAGE_KEYS = {
  SALES: 'profit_tracker_sales_v1',
  PRESETS: 'profit_tracker_presets_v1',
  SETTINGS: 'profit_tracker_settings_v1',
  SIMULATOR: 'profit_tracker_sim_open_v1',
};

export default function App() {
  // PWA Hook
  const { isInstallable, isInstalled, isOnline, installPWA } = usePWA();

  // Cloud Auth & Sync State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('local_only');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

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

  // Temporary toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3200);
  };

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

  // 4. Session & Cloud Sync Manager
  useEffect(() => {
    // If Firebase is configured, listen to Firebase Auth
    if (isFirebaseConfigured()) {
      const auth = getFirebaseAuth();
      if (auth) {
        let unsubSales: (() => void) | null = null;
        let unsubSettings: (() => void) | null = null;
        let unsubPresets: (() => void) | null = null;

        const unsubAuth = onAuthStateChanged(auth, (user) => {
          if (user) {
            const userProf = mapFirebaseUser(user);
            setCurrentUser(userProf);
            setSyncStatus('syncing');

            unsubSales = subscribeToUserSales(
              user.uid,
              (cloudSales) => {
                if (cloudSales.length > 0) setSales(cloudSales);
                setSyncStatus('synced');
              },
              () => setSyncStatus('error')
            );

            unsubSettings = subscribeToUserSettings(user.uid, (cloudSettings) => {
              if (cloudSettings) setSettings(cloudSettings);
            });

            unsubPresets = subscribeToUserPresets(user.uid, (cloudPresets) => {
              if (cloudPresets.length > 0) setPresets(cloudPresets);
            });
            showToast(`Conectado a Firebase como ${userProf.displayName}`);
          } else {
            setCurrentUser(null);
            setSyncStatus('local_only');
          }
        });

        return () => {
          unsubAuth();
          if (unsubSales) unsubSales();
          if (unsubSettings) unsubSettings();
          if (unsubPresets) unsubPresets();
        };
      }
    }

    // Built-in Cloud Sync Backend Session check
    checkCurrentSession().then((user) => {
      if (user) {
        setCurrentUser(user);
        setSyncStatus('syncing');
        // Pull latest cloud data
        fetchCloudData().then((data) => {
          if (data) {
            if (Array.isArray(data.sales) && data.sales.length > 0) {
              setSales(data.sales);
            }
            if (Array.isArray(data.presets) && data.presets.length > 0) {
              setPresets(data.presets);
            }
            if (data.settings) {
              setSettings(data.settings);
            }
          }
          setSyncStatus('synced');
        }).catch(() => setSyncStatus('error'));
      } else {
        setSyncStatus('local_only');
      }
    });
  }, []);

  // Periodic Cloud Sync for multi-device sync between phone & PC
  useEffect(() => {
    if (!currentUser || isFirebaseConfigured()) return;

    const pullUpdates = async () => {
      try {
        const data = await fetchCloudData();
        if (data && Array.isArray(data.sales) && data.sales.length > 0) {
          setSales(data.sales);
          if (Array.isArray(data.presets)) setPresets(data.presets);
          if (data.settings) setSettings(data.settings);
          setSyncStatus('synced');
        }
      } catch (err) {
        console.warn('Sync poll skipped:', err);
      }
    };

    // Auto-poll every 8 seconds when connected
    const interval = setInterval(pullUpdates, 8000);
    // Also pull immediately when tab or app comes into focus
    window.addEventListener('focus', pullUpdates);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', pullUpdates);
    };
  }, [currentUser]);

  // Sync actions
  const handleUploadLocalToCloud = async () => {
    if (!currentUser) return;
    try {
      setSyncStatus('syncing');
      await uploadFullCloudData(currentUser.uid, sales, presets, settings);
      setSyncStatus('synced');
      showToast('¡Datos locales sincronizados en la nube!');
    } catch (err: any) {
      console.error(err);
      showToast('Error al subir datos a la nube');
      setSyncStatus('error');
    }
  };

  const handleForceSync = async () => {
    if (!currentUser) return;
    setSyncStatus('syncing');
    try {
      const data = await fetchCloudData();
      if (data && Array.isArray(data.sales)) {
        setSales(data.sales);
      }
      setSyncStatus('synced');
      showToast('Sincronización actualizada con éxito');
    } catch {
      setSyncStatus('synced');
      showToast('Datos locales vigentes');
    }
  };

  // 5. Sales Actions (Local + Cloud)
  const handleSaveSale = async (saleData: Omit<Sale, 'id'>, editId?: string) => {
    let targetSale: Sale;
    if (editId) {
      targetSale = { ...saleData, id: editId };
      setSales((prev) =>
        prev.map((s) => (s.id === editId ? targetSale : s))
      );
      showToast('Venta actualizada correctamente');
    } else {
      targetSale = {
        ...saleData,
        id: `sale-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      setSales((prev) => [targetSale, ...prev]);
      showToast('Venta registrada exitosamente');
    }

    // Sync to Cloud if authenticated
    if (currentUser) {
      try {
        await syncSingleSaleToCloud(currentUser.uid, targetSale);
      } catch (err) {
        console.error('Error syncing sale to cloud:', err);
      }
    }

    setEditingSale(null);
    setSaleInitialData(null);
  };

  const handleDeleteSale = async (saleId: string) => {
    setSales((prev) => prev.filter((s) => s.id !== saleId));
    showToast('Venta eliminada del historial');

    if (currentUser) {
      try {
        await deleteSingleSaleFromCloud(currentUser.uid, saleId);
      } catch (err) {
        console.error('Error deleting sale from cloud:', err);
      }
    }
  };

  const handleDuplicateSale = async (sale: Sale) => {
    const duplicated: Sale = {
      ...sale,
      id: `sale-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: new Date().toISOString(),
    };
    setSales((prev) => [duplicated, ...prev]);
    showToast(`Venta duplicada: "${sale.productName}"`);

    if (currentUser) {
      try {
        await syncSingleSaleToCloud(currentUser.uid, duplicated);
      } catch (err) {
        console.error('Error syncing duplicated sale to cloud:', err);
      }
    }
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

  // 6. Presets Actions
  const handleSavePreset = async (preset: ProductPreset) => {
    setPresets((prev) => {
      const exists = prev.some((p) => p.id === preset.id);
      if (exists) {
        return prev.map((p) => (p.id === preset.id ? preset : p));
      }
      return [...prev, preset];
    });
    showToast('Producto guardado en el catálogo');

    if (currentUser) {
      try {
        await syncPresetToCloud(currentUser.uid, preset);
      } catch (err) {
        console.error('Error syncing preset to cloud:', err);
      }
    }
  };

  const handleDeletePreset = async (presetId: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== presetId));
    showToast('Producto eliminado del catálogo');

    if (currentUser) {
      try {
        await deletePresetFromCloud(currentUser.uid, presetId);
      } catch (err) {
        console.error('Error deleting preset from cloud:', err);
      }
    }
  };

  // 7. Settings & Data Actions
  const handleSaveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    showToast('Ajustes guardados');

    if (currentUser) {
      try {
        await syncSettingsToCloud(currentUser.uid, newSettings);
      } catch (err) {
        console.error('Error syncing settings to cloud:', err);
      }
    }
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

  // 8. CSV Export
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

  // 9. JSON Export / Import
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
      
      {/* App Header with PWA & Cloud Hub */}
      <Header
        settings={settings}
        currentUser={currentUser}
        syncStatus={syncStatus}
        isOnline={isOnline}
        isInstalled={isInstalled}
        onOpenNewSale={handleOpenNewSale}
        onOpenCatalog={() => setIsCatalogOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenInstall={() => setIsInstallModalOpen(true)}
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
            <strong className="text-slate-400">Registro de Ganancias y Reinversión</strong> — PWA con Cloud Sync
          </p>
          <div className="flex items-center gap-3">
            <span>Sincronización multi-dispositivo PC y Móvil</span>
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

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        syncStatus={syncStatus}
        onUploadLocalToCloud={handleUploadLocalToCloud}
        onForceSync={handleForceSync}
        onUserChanged={(user) => {
          setCurrentUser(user);
          if (user) {
            setSyncStatus('synced');
            fetchCloudData().then((data) => {
              if (data && Array.isArray(data.sales) && data.sales.length > 0) {
                setSales(data.sales);
              }
            });
          } else {
            setSyncStatus('local_only');
          }
        }}
      />

      <DesktopInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        onInstall={installPWA}
      />

    </div>
  );
}
