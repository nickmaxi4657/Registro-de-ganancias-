import React, { useState, useRef } from 'react';
import { 
  X, 
  Check, 
  Settings, 
  PiggyBank, 
  DollarSign, 
  Store, 
  Download, 
  Upload, 
  Trash2, 
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { AppSettings, ProductPreset, Sale } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onResetAllData: () => void;
  onLoadSampleData: () => void;
  onExportJSON: () => void;
  onImportJSON: (data: { sales: Sale[]; presets: ProductPreset[]; settings: AppSettings }) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetAllData,
  onLoadSampleData,
  onExportJSON,
  onImportJSON,
}) => {
  const [currency, setCurrency] = useState(settings.currency);
  const [defaultReinvestmentPercent, setDefaultReinvestmentPercent] = useState<number>(
    settings.defaultReinvestmentPercent
  );
  const [businessName, setBusinessName] = useState(settings.businessName);
  const [confirmReset, setConfirmReset] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      currency: currency.trim() || '$',
      defaultReinvestmentPercent: Math.min(100, Math.max(0, defaultReinvestmentPercent)),
      businessName: businessName.trim() || 'Mi Negocio',
    });
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && Array.isArray(json.sales)) {
          onImportJSON(json);
          onClose();
        } else {
          alert('El archivo no tiene el formato correcto de respaldo.');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div 
        id="settings-modal-container"
        className="bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-800 text-slate-100 overflow-hidden my-auto max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-5 bg-emerald-500 rounded-full"></span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Ajustes y Parámetros
              </h2>
              <p className="text-xs text-slate-400">
                Configura tu moneda y tu política de reinversión automática
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          
          {/* Business Name */}
          <div>
            <label className="text-[10px] uppercase text-slate-500 font-bold mb-1.5 block tracking-wider">
              Nombre de tu Negocio o Emprendimiento
            </label>
            <div className="relative">
              <Store className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ej. Mi Tienda, Emprendimiento..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Currency */}
          <div>
            <label className="text-[10px] uppercase text-slate-500 font-bold mb-1.5 block tracking-wider">
              Símbolo o Código de Moneda
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="$"
                className="w-24 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500 text-center"
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                {['$', 'ARS', 'USD', 'EUR', 'MXN', 'COP'].map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setCurrency(curr)}
                    className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-colors ${
                      currency === curr
                        ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Default Reinvestment % */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <PiggyBank className="w-4 h-4 text-blue-400" />
                Porcentaje de Reinversión Predeterminado
              </label>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg">
                {defaultReinvestmentPercent}%
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Cada venta destinará automáticamente este porcentaje de la ganancia neta para comprar nuevo stock o reinvertir en el negocio.
            </p>

            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={defaultReinvestmentPercent}
              onChange={(e) => setDefaultReinvestmentPercent(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />

            <div className="flex items-center justify-between text-xs font-mono pt-1">
              <span className="text-blue-400">{defaultReinvestmentPercent}% Para Reinvertir</span>
              <span className="text-indigo-300">{100 - defaultReinvestmentPercent}% Bolsillo Personal</span>
            </div>
          </div>

          {/* Backup & Data management */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider block">
              Copia de Seguridad y Datos
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onExportJSON}
                className="p-2.5 text-xs font-mono text-slate-300 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Descargar (JSON)</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 text-xs font-mono text-slate-300 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-blue-400" />
                <span>Restaurar (JSON)</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onLoadSampleData();
                  onClose();
                }}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Cargar datos demo</span>
              </button>

              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-mono"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Borrar todo</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-[11px] text-red-400">¿Confirmas?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onResetAllData();
                      setConfirmReset(false);
                      onClose();
                    }}
                    className="px-2 py-0.5 text-xs bg-red-600 text-white rounded-lg font-bold hover:bg-red-500"
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="px-1.5 py-0.5 text-xs text-slate-400 hover:text-white"
                  >
                    No
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
            >
              Cerrar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm inline-flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Ajustes</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
