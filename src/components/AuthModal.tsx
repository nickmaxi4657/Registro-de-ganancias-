import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  LogOut, 
  Cloud, 
  CloudCheck, 
  X, 
  Check, 
  AlertCircle, 
  Smartphone, 
  Laptop, 
  RefreshCw,
  Key,
  Shield,
  Layers,
  Settings
} from 'lucide-react';
import { UserProfile, FirebaseConfig, SyncStatus } from '../types';
import { 
  loginWithEmail, 
  registerWithEmail, 
  logoutUser, 
  isFirebaseConfigured, 
  getSavedFirebaseConfig, 
  saveFirebaseConfig,
  initializeFirebaseServices
} from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  syncStatus: SyncStatus;
  onUploadLocalToCloud: () => Promise<void>;
  onForceSync: () => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  syncStatus,
  onUploadLocalToCloud,
  onForceSync,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'config'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Custom Firebase config state
  const existingConfig = getSavedFirebaseConfig();
  const [apiKey, setApiKey] = useState(existingConfig?.apiKey || '');
  const [projectId, setProjectId] = useState(existingConfig?.projectId || '');
  const [appId, setAppId] = useState(existingConfig?.appId || '');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      await loginWithEmail(email, password);
      setSuccessMsg('¡Sesión iniciada con éxito! Tus datos se sincronizan con la nube.');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrorMsg('Email o contraseña incorrectos.');
      } else if (err.code === 'auth/invalid-email') {
        setErrorMsg('El formato del correo electrónico no es válido.');
      } else {
        setErrorMsg(err.message || 'Error al iniciar sesión.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      await registerWithEmail(email, password, displayName);
      setSuccessMsg('¡Cuenta creada con éxito! Sincronizando con la nube...');
      // Upload local data to cloud immediately
      await onUploadLocalToCloud();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('Este correo ya está registrado. Prueba iniciando sesión.');
      } else {
        setErrorMsg(err.message || 'Error al registrar la cuenta.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      setSuccessMsg('Sesión cerrada correctamente.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cerrar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || !projectId.trim()) {
      setErrorMsg('Debes ingresar al menos el apiKey y projectId de Firebase.');
      return;
    }
    const newConfig: FirebaseConfig = {
      apiKey: apiKey.trim(),
      authDomain: `${projectId.trim()}.firebaseapp.com`,
      projectId: projectId.trim(),
      storageBucket: `${projectId.trim()}.firebasestorage.app`,
      appId: appId.trim() || '1:123456789:web:abcdef'
    };
    saveFirebaseConfig(newConfig);
    initializeFirebaseServices(newConfig);
    setSuccessMsg('Configuración de Firebase guardada con éxito.');
    setMode('login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div 
        id="auth-modal-container"
        className="bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-800 text-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-5 bg-blue-500 rounded-full"></span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Cuenta y Sincronización en la Nube</span>
                <Cloud className="w-4 h-4 text-blue-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Accede desde tu celular o PC con sincronización en tiempo real
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

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Notifications */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-950/80 border border-red-800/80 text-xs text-red-200 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 text-xs text-emerald-200 flex items-center gap-2.5">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* If already logged in */}
          {currentUser ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold">
                    Cuenta Activa
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Sincronizado
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                    {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white text-sm truncate">
                      {currentUser.displayName || 'Usuario Emprendedor'}
                    </div>
                    <div className="text-xs text-slate-400 font-mono truncate">
                      {currentUser.email}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Laptop className="w-3.5 h-3.5 text-blue-400" />
                    PC & Celular sincronizados
                  </span>
                  <button
                    type="button"
                    onClick={onForceSync}
                    className="text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Sincronizar ahora</span>
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={onUploadLocalToCloud}
                  className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium inline-flex items-center gap-2 transition-colors"
                >
                  <Cloud className="w-3.5 h-3.5 text-blue-400" />
                  <span>Subir datos locales a la nube</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-red-950/40 hover:bg-red-950/80 border border-red-900/60 text-red-300 text-xs font-medium inline-flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tabs: Iniciar Sesión / Registrarse / Configurar Firebase */}
              <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                    mode === 'login'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                    mode === 'register'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Crear Cuenta
                </button>
                <button
                  type="button"
                  onClick={() => setMode('config')}
                  className={`px-3 py-1.5 text-xs font-mono rounded-xl transition-all ${
                    mode === 'config'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Ajustes de Firebase"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Explanation Card */}
              <div className="p-3.5 rounded-2xl bg-blue-950/20 border border-blue-900/40 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="text-xs space-y-1">
                  <div className="font-bold text-white">Sincronización Automática Móvil + PC</div>
                  <p className="text-slate-400 leading-relaxed">
                    Inicia sesión con la misma cuenta en tu teléfono y en tu computadora para ver todas tus ventas, stock y reinversiones sincronizadas en tiempo real.
                  </p>
                </div>
              </div>

              {/* Login Form */}
              {mode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-3.5">
                  <div>
                    <label className="text-[10px] uppercase text-slate-500 font-bold mb-1.5 block tracking-wider">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase text-slate-500 font-bold mb-1.5 block tracking-wider">
                      Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Entrar y Sincronizar</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Register Form */}
              {mode === 'register' && (
                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div>
                    <label className="text-[10px] uppercase text-slate-500 font-bold mb-1.5 block tracking-wider">
                      Nombre o Negocio
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Ej. Tienda Urbana"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase text-slate-500 font-bold mb-1.5 block tracking-wider">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase text-slate-500 font-bold mb-1.5 block tracking-wider">
                      Contraseña (mínimo 6 caracteres)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Crear Cuenta y Conectar</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Config Form */}
              {mode === 'config' && (
                <form onSubmit={handleSaveConfig} className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
                    <span className="font-bold text-white block">Credenciales de Firebase</span>
                    <p className="text-[11px]">
                      Puedes conectar tu propio proyecto de Firebase gratuito para Firestore y Authentication.
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">
                      API Key
                    </label>
                    <input
                      type="text"
                      required
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">
                      Project ID
                    </label>
                    <input
                      type="text"
                      required
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      placeholder="mi-proyecto-1234"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">
                      App ID (Opcional)
                    </label>
                    <input
                      type="text"
                      value={appId}
                      onChange={(e) => setAppId(e.target.value)}
                      placeholder="1:123456789:web:abcdef"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
                    >
                      Volver
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      Guardar Configuración
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60 text-xs text-slate-500 font-mono">
          <span>{isFirebaseConfigured() ? 'Firebase Activo' : 'Modo Local / Nube Opcional'}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
