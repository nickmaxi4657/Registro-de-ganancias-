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
  Settings,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { UserProfile, FirebaseConfig, SyncStatus } from '../types';
import { 
  isFirebaseConfigured, 
  getSavedFirebaseConfig, 
  saveFirebaseConfig,
  initializeFirebaseServices
} from '../lib/firebase';
import {
  loginAccount,
  registerAccount,
  logoutAccount,
  loginBuiltinCloud,
  registerBuiltinCloud
} from '../lib/syncService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  syncStatus: SyncStatus;
  onUploadLocalToCloud: () => Promise<void>;
  onForceSync: () => Promise<void>;
  onUserChanged?: (user: UserProfile | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  syncStatus,
  onUploadLocalToCloud,
  onForceSync,
  onUserChanged,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'config'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showConfigNotFound, setShowConfigNotFound] = useState(false);

  // Custom Firebase config state
  const existingConfig = getSavedFirebaseConfig();
  const [apiKey, setApiKey] = useState(existingConfig?.apiKey || '');
  const [projectId, setProjectId] = useState(existingConfig?.projectId || '');
  const [appId, setAppId] = useState(existingConfig?.appId || '');
  const [authDomain, setAuthDomain] = useState(existingConfig?.authDomain || '');
  const [rawSnippet, setRawSnippet] = useState('');
  const [snippetParsed, setSnippetParsed] = useState(false);

  const handleSnippetPaste = (val: string) => {
    setRawSnippet(val);
    if (!val.trim()) return;

    // Smart regex extraction
    const extractField = (key: string) => {
      const regex = new RegExp(`["']?${key}["']?\\s*[:=]\\s*["']([^"']+)["']`, 'i');
      const match = val.match(regex);
      return match ? match[1].trim() : '';
    };

    const foundApiKey = extractField('apiKey');
    const foundProjectId = extractField('projectId');
    const foundAppId = extractField('appId');
    const foundAuthDomain = extractField('authDomain');

    let count = 0;
    if (foundApiKey) { setApiKey(foundApiKey); count++; }
    if (foundProjectId) { setProjectId(foundProjectId); count++; }
    if (foundAppId) { setAppId(foundAppId); count++; }
    if (foundAuthDomain) { setAuthDomain(foundAuthDomain); count++; }

    if (count >= 2) {
      setSnippetParsed(true);
      setErrorMsg(null);
    }
  };

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowConfigNotFound(false);
    setLoading(true);

    try {
      const loggedUser = await loginAccount(email, password);
      if (onUserChanged) onUserChanged(loggedUser);
      if ((loggedUser as any)?.isFallbackCloud) {
        setSuccessMsg('¡Sesión iniciada con la Nube! Tus datos se sincronizan con tu cuenta.');
      } else {
        setSuccessMsg('¡Sesión iniciada con éxito! Tus datos se sincronizan con Firebase.');
      }
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/configuration-not-found' || err.message?.includes('configuration-not-found')) {
        setErrorMsg('Firebase: En tu consola de Firebase aún falta habilitar el proveedor Correo/Contraseña.');
        setShowConfigNotFound(true);
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
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
    setShowConfigNotFound(false);
    setLoading(true);

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      const registeredUser = await registerAccount(email, password, displayName);
      if (onUserChanged) onUserChanged(registeredUser);
      if ((registeredUser as any)?.isFallbackCloud) {
        setSuccessMsg('¡Cuenta creada y conectada a la Nube! Sincronizando datos...');
      } else {
        setSuccessMsg('¡Cuenta creada con éxito en Firebase! Sincronizando datos...');
      }
      // Upload local data to cloud immediately
      await onUploadLocalToCloud();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/configuration-not-found' || err.message?.includes('configuration-not-found')) {
        setErrorMsg('Firebase: En tu consola de Firebase aún falta habilitar el proveedor Correo/Contraseña.');
        setShowConfigNotFound(true);
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('Este correo ya está registrado. Prueba iniciando sesión.');
      } else {
        setErrorMsg(err.message || 'Error al registrar la cuenta.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDirectCloudConnect = async () => {
    if (!email || !password) {
      setErrorMsg('Ingresa tu email y contraseña para continuar con la Nube.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      let user;
      if (mode === 'register') {
        user = await registerBuiltinCloud(email, password, displayName);
        await onUploadLocalToCloud();
      } else {
        try {
          user = await loginBuiltinCloud(email, password);
        } catch {
          // If login failed because not registered yet, register seamlessly
          user = await registerBuiltinCloud(email, password, displayName);
          await onUploadLocalToCloud();
        }
      }
      if (onUserChanged) onUserChanged(user);
      setSuccessMsg('¡Conectado exitosamente a la Sincronización en la Nube!');
      setShowConfigNotFound(false);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al conectar con la Nube.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutAccount();
      if (onUserChanged) onUserChanged(null);
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
    const cleanProjectId = projectId.trim();
    const newConfig: FirebaseConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim() || `${cleanProjectId}.firebaseapp.com`,
      projectId: cleanProjectId,
      storageBucket: `${cleanProjectId}.firebasestorage.app`,
      appId: appId.trim() || '1:123456789:web:abcdef'
    };
    saveFirebaseConfig(newConfig);
    initializeFirebaseServices(newConfig);
    setSuccessMsg('¡Configuración de Firebase guardada y activada con éxito!');
    setMode('login');
  };

  const handleClearConfig = () => {
    saveFirebaseConfig(null);
    const def = getSavedFirebaseConfig();
    setApiKey(def?.apiKey || '');
    setProjectId(def?.projectId || '');
    setAppId(def?.appId || '');
    setAuthDomain(def?.authDomain || '');
    setRawSnippet('');
    setSnippetParsed(false);
    setSuccessMsg('Configuración restaurada al proyecto predeterminado.');
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

          {showConfigNotFound && (
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/80 space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Activa "Correo electrónico" en Firebase Console</span>
              </div>
              <div className="text-[11px] text-slate-300 space-y-2 leading-relaxed">
                <p>
                  El error <code className="bg-amber-950/80 px-1 py-0.5 rounded text-amber-300 font-mono">auth/configuration-not-found</code> ocurre porque en tu proyecto de Firebase todavía no se habilitó el método de acceso por Correo/Contraseña:
                </p>
                <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800/80 font-mono text-[11px] space-y-1.5 text-slate-300">
                  <div>1. Abre <a href={`https://console.firebase.google.com/project/${projectId || 'calculadora-de-ganancias-44b62'}/authentication/providers`} target="_blank" rel="noopener noreferrer" className="underline text-amber-400 font-bold inline-flex items-center gap-0.5">Firebase Console <ExternalLink className="w-3 h-3" /></a></div>
                  <div>2. Ve a <strong>Authentication</strong> &gt; <strong>Sign-in method</strong></div>
                  <div>3. Selecciona <strong>Correo electrónico/Contraseña</strong> &gt; Activar &gt; <strong>Guardar</strong></div>
                </div>
              </div>
              <div className="pt-1 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleDirectCloudConnect}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Cloud className="w-4 h-4" />
                  <span>Conectar con Nube Integrada (Sin esperar)</span>
                </button>
              </div>
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
                <form onSubmit={handleSaveConfig} className="space-y-4">
                  {/* Step-by-step guide */}
                  <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-900/40 text-xs text-amber-200/90 space-y-2">
                    <div className="font-bold flex items-center justify-between text-amber-300">
                      <span>¿Cómo obtener tus credenciales de Firebase?</span>
                      <a 
                        href="https://console.firebase.google.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[11px] underline text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono"
                      >
                        Abrir Firebase Console <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
                      <li>Crea o abre tu proyecto gratuito en <strong>Firebase Console</strong>.</li>
                      <li>En <strong>Compilación</strong>, activa <strong>Authentication</strong> (Método: Correo/Contraseña).</li>
                      <li>En <strong>Compilación</strong>, activa <strong>Firestore Database</strong> (Modo prueba o reglas abiertas).</li>
                      <li>En <strong>Configuración del proyecto (ícono de engranaje)</strong> &gt; <em>Tus apps</em>, añade una app <strong>Web (&lt;/&gt;)</strong> y copia el código <code>firebaseConfig</code>.</li>
                    </ol>
                  </div>

                  {/* Fast Paste Box */}
                  <div>
                    <label className="text-[10px] uppercase text-slate-400 font-bold mb-1.5 flex items-center justify-between">
                      <span>Pegar configuración completa de Firebase</span>
                      <span className="text-slate-500 font-normal normal-case">Pega el bloque completo</span>
                    </label>
                    <textarea
                      rows={3}
                      value={rawSnippet}
                      onChange={(e) => handleSnippetPaste(e.target.value)}
                      placeholder={'const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  projectId: "mi-negocio",\n  ...\n};'}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 placeholder:text-slate-600"
                    />
                    {snippetParsed && (
                      <p className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" /> ¡Credenciales extraídas correctamente!
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">
                        Auth Domain (Opcional)
                      </label>
                      <input
                        type="text"
                        value={authDomain}
                        onChange={(e) => setAuthDomain(e.target.value)}
                        placeholder={`${projectId || 'proyecto'}.firebaseapp.com`}
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
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {isFirebaseConfigured() ? (
                      <button
                        type="button"
                        onClick={handleClearConfig}
                        className="px-3 py-1.5 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-rose-900/40 transition-colors"
                      >
                        Desconectar Firebase
                      </button>
                    ) : <div />}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMode('login')}
                        className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
                      >
                        Volver
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Guardar y Activar</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60 text-xs text-slate-500 font-mono">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {isFirebaseConfigured() ? `Firebase Conectado (${getSavedFirebaseConfig()?.projectId})` : 'Sincronización Cloud Activa'}
          </span>
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
