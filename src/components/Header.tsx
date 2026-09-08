import React from 'react';
import { 
  PlusCircle, 
  Settings, 
  BookOpen, 
  Download, 
  TrendingUp, 
  Calculator,
  Cloud,
  Laptop,
  Smartphone,
  UserCheck,
  WifiOff
} from 'lucide-react';
import { AppSettings, UserProfile, SyncStatus } from '../types';

interface HeaderProps {
  settings: AppSettings;
  currentUser: UserProfile | null;
  syncStatus: SyncStatus;
  isOnline: boolean;
  isInstalled: boolean;
  onOpenNewSale: () => void;
  onOpenCatalog: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onOpenInstall: () => void;
  onToggleSimulator: () => void;
  isSimulatorOpen: boolean;
  onExportCSV: () => void;
  salesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  currentUser,
  syncStatus,
  isOnline,
  isInstalled,
  onOpenNewSale,
  onOpenCatalog,
  onOpenSettings,
  onOpenAuth,
  onOpenInstall,
  onToggleSimulator,
  isSimulatorOpen,
  onExportCSV,
  salesCount,
}) => {
  return (
    <header className="bg-slate-950 text-slate-200 border-b border-slate-800/90 sticky top-0 z-30 shadow-lg backdrop-blur-md">
      {/* Offline Alert Strip */}
      {!isOnline && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-center text-xs font-mono text-amber-400 flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Modo Offline: Los cambios se guardan localmente y se sincronizarán al reconectar.</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Brand and titles */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {settings.businessName || 'ProfitFlow'}{' '}
                  <span className="text-emerald-500 font-extrabold">Pro</span>
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800 hidden sm:inline-block">
                  PWA + Cloud
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gestión de Ganancias y Reinversión Automática
              </p>
            </div>
          </div>

          {/* Action buttons & Cloud/PWA Hub */}
          <div className="flex items-center flex-wrap gap-2.5">
            
            {/* Cloud User / Sync Pill */}
            <button
              id="btn-open-cloud-sync"
              type="button"
              onClick={onOpenAuth}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono border transition-all ${
                currentUser
                  ? 'bg-blue-950/40 text-blue-300 border-blue-800/80 hover:bg-blue-900/40'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
              title={currentUser ? `Conectado como ${currentUser.email}` : 'Iniciar sesión para sincronizar móvil y PC'}
            >
              <Cloud className={`w-3.5 h-3.5 ${currentUser ? 'text-blue-400' : 'text-slate-400'}`} />
              <div className="text-left flex items-center gap-1.5">
                {currentUser ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="max-w-[100px] truncate font-medium">{currentUser.displayName || currentUser.email?.split('@')[0]}</span>
                  </>
                ) : (
                  <span>Sincronizar Nube</span>
                )}
              </div>
            </button>

            {/* PWA Desktop/Mobile Install Button */}
            <button
              id="btn-open-pwa-install"
              type="button"
              onClick={onOpenInstall}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono bg-slate-900 text-slate-300 border border-slate-800 hover:border-emerald-500/50 hover:text-emerald-400 transition-colors"
              title="Instalar como app de escritorio o móvil"
            >
              <Laptop className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isInstalled ? 'App Instalada' : 'Instalar PC / Celular'}</span>
            </button>

            {/* Bento Reinvestment Pill */}
            <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl hidden lg:flex items-center gap-2.5">
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                  Reinversión
                </p>
                <p className="text-xs text-emerald-400 font-mono font-bold">
                  {settings.defaultReinvestmentPercent}%
                </p>
              </div>
              <div className="h-5 w-[1px] bg-slate-800"></div>
              <button
                type="button"
                onClick={onOpenSettings}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors"
              >
                Ajustar
              </button>
            </div>

            <button
              id="btn-toggle-simulator"
              type="button"
              onClick={onToggleSimulator}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                isSimulatorOpen
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
              title="Calculadora instantánea de márgenes y reinversión"
            >
              <Calculator className="w-4 h-4" />
              <span className="hidden sm:inline">{isSimulatorOpen ? 'Ocultar Sim.' : 'Calculadora'}</span>
            </button>

            <button
              id="btn-open-catalog"
              type="button"
              onClick={onOpenCatalog}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white transition-colors"
              title="Catálogo de productos frecuentes"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Catálogo</span>
            </button>

            {salesCount > 0 && (
              <button
                id="btn-export-csv"
                type="button"
                onClick={onExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white transition-colors"
                title="Exportar ventas a Excel / CSV"
              >
                <Download className="w-4 h-4" />
                <span className="hidden md:inline">Exportar</span>
              </button>
            )}

            <button
              id="btn-open-settings"
              type="button"
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white transition-colors"
              title="Ajustes"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              id="btn-new-sale"
              type="button"
              onClick={onOpenNewSale}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Venta</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
