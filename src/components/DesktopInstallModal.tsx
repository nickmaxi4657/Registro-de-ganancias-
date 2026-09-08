import React, { useState } from 'react';
import { 
  Monitor, 
  Smartphone, 
  Download, 
  Check, 
  X, 
  ExternalLink, 
  Laptop, 
  Sparkles,
  ShieldCheck,
  Layers,
  ArrowRight
} from 'lucide-react';

interface DesktopInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  onInstall: () => Promise<boolean>;
}

export const DesktopInstallModal: React.FC<DesktopInstallModalProps> = ({
  isOpen,
  onClose,
  isInstallable,
  isInstalled,
  onInstall,
}) => {
  const [copiedScript, setCopiedScript] = useState(false);
  const [downloadedLauncher, setDownloadedLauncher] = useState(false);

  if (!isOpen) return null;

  const currentUrl = window.location.origin;

  // Function to create and download a native Windows desktop shortcut launcher (.bat / .url)
  const handleDownloadWindowsLauncher = () => {
    // Generates a Windows Internet Shortcut configured to open as standalone app
    const shortcutContent = `[InternetShortcut]\nURL=${currentUrl}\nIconIndex=0\nIconFile=${currentUrl}/icon-512.png\nHotKey=0\nIDList=\n[{000214A0-0000-0000-C000-000000000046}]\nProp3=19,11\n`;
    
    const blob = new Blob([shortcutContent], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Ganancias y Reinversion.url';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadedLauncher(true);
    setTimeout(() => setDownloadedLauncher(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div 
        id="pwa-install-modal"
        className="bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl border border-slate-800 text-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-5 bg-emerald-500 rounded-full"></span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Instalar Aplicación (PWA / Escritorio)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Offline & Nativo
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Usa la aplicación como un ejecutable independiente en PC o en tu celular
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
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Main Hero Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1 max-w-sm">
                <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Instalación en 1 Clic
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Ejecutar como App de Escritorio / Celular
                </h3>
                <p className="text-xs text-slate-400">
                  Sin barras de navegación, con ventana propia, icono en el escritorio e inicio instantáneo.
                </p>
              </div>

              {isInstalled ? (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shrink-0">
                  <Check className="w-4 h-4" />
                  <span>Ya está instalada</span>
                </div>
              ) : isInstallable ? (
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await onInstall();
                    if (ok) onClose();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-md shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Instalar Ahora</span>
                </button>
              ) : (
                <div className="text-xs text-slate-400 bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-xl text-center">
                  Disponible vía navegador
                </div>
              )}
            </div>
          </div>

          {/* Platform tabs / Guides */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Windows / Mac / Linux PC */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <Monitor className="w-4 h-4 text-blue-400" />
                <span>En PC de Escritorio (Windows / Mac)</span>
              </div>
              <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                <li>
                  En <strong className="text-slate-200">Chrome o Edge</strong>, haz clic en el icono de instalación en la barra superior o en el botón <strong className="text-emerald-400">"Instalar"</strong>.
                </li>
                <li>
                  Se crea una ventana independiente (.exe nativa) y un acceso directo en tu <strong className="text-slate-200">Escritorio</strong> y menú Inicio.
                </li>
              </ul>
              <button
                type="button"
                onClick={handleDownloadWindowsLauncher}
                className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>{downloadedLauncher ? '¡Acceso Descargado!' : 'Descargar Acceso Directo PC'}</span>
              </button>
            </div>

            {/* Mobile (Android / iOS) */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>En Celular (Android / iPhone)</span>
              </div>
              <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                <li>
                  <strong className="text-slate-200">Android (Chrome):</strong> Toca "Instalar" o los 3 puntos y selecciona "Instalar aplicación".
                </li>
                <li>
                  <strong className="text-slate-200">iPhone (Safari):</strong> Toca el botón <em>Compartir</em> (cuadrado con flecha) y elige <em>"Agregar a pantalla de inicio"</em>.
                </li>
              </ul>
              <div className="text-[11px] text-slate-500 font-mono pt-1">
                Funciona con pantalla completa y sin conexión a internet.
              </div>
            </div>

          </div>

          {/* Feature highlights */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div>
              <span className="block text-emerald-400 font-bold text-sm">Offline</span>
              <span className="text-[10px] text-slate-500">Sin conexión</span>
            </div>
            <div>
              <span className="block text-blue-400 font-bold text-sm">Cloud</span>
              <span className="text-[10px] text-slate-500">Auto-sincroniza</span>
            </div>
            <div>
              <span className="block text-indigo-400 font-bold text-sm">PWA 100%</span>
              <span className="text-[10px] text-slate-500">Multiplataforma</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-end bg-slate-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
