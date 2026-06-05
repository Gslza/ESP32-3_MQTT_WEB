import React, { useState, useEffect } from 'react';
import { MqttProvider, useMqtt } from './context/MqttContext';
import { LoginScreen } from './components/LoginScreen';
import { auth, signOut, onAuthStateChanged, User } from './lib/firebase';
import { UnifiedDashboard } from './components/UnifiedDashboard';
import { MqttConfigTab } from './components/MqttConfigTab';
import { HistoryTablesTabs } from './components/HistoryTablesTabs';
import { ActiveTab } from './types';

// Icons
import { 
  Menu, X, LogOut, Sun, Moon, Cpu, User as UserIcon, 
  Settings, Database, ToggleLeft, Activity, Radio, Thermometer, CloudRain
} from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { brokers, score } = useMqtt() as any; // safe fallback or empty
  const mqttState = useMqtt();
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (loggedUser) => {
      setUser(loggedUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (window.confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error('Error signing out:', err);
      }
    }
  };

  // Connected count of active brokers
  const connectedCount = mqttState.brokers.filter(b => b.connected).length;

  if (!user) {
    return <LoginScreen onLoginSuccess={() => {}} />;
  }

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
      themeMode === 'dark' 
        ? 'bg-slate-950 text-slate-100' 
        : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* BACKGROUND PARTICLES/DECORATIONS FOR DARK MODE */}
      {themeMode === 'dark' && (
        <>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[160px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[160px] pointer-events-none" />
        </>
      )}

      {/* TOPBAR */}
      <header className={`sticky top-0 z-40 px-4 md:px-6 py-4 flex items-center justify-between border-b backdrop-blur-xl ${
        themeMode === 'dark' 
          ? 'bg-slate-950/80 border-white/5' 
          : 'bg-white/80 border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            title="Toggle Sidebar"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/10">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm md:text-base font-extrabold tracking-tight">Sistem IoT Multi-Broker</h1>
              <span className="hidden md:inline text-[10px] text-slate-400 font-bold tracking-wider uppercase">
                ESP32 DevKit V1 ● Perintah Suara
              </span>
            </div>
          </div>
        </div>

        {/* Status Indicators & Admin Profiles */}
        <div className="flex items-center gap-4">
          
          {/* Connection quick metrics */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/5 text-[11px] font-semibold">
            <Radio className="w-3.5 h-3.5 text-blue-400" />
            <span>Konektivitas Broker:</span>
            <span className={`font-mono font-extrabold ${connectedCount > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
              {connectedCount}/3 SINKRON
            </span>
          </div>

          {/* Theme mode toggle */}
          <button
            type="button"
            onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              themeMode === 'dark' 
                ? 'bg-slate-900 border-white/5 text-yellow-400 hover:text-yellow-300' 
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title={themeMode === 'dark' ? "Mode Terang" : "Mode Gelap"}
          >
            {themeMode === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>

          {/* Topbar email snippet */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8.5 h-8.5 rounded-full bg-blue-600/10 border border-blue-500/30 flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-200 leading-tight">Admin Console</div>
              <div className="text-[10px] text-slate-400">{user.email}</div>
            </div>
          </div>
        </div>
      </header>

      {/* VIEW WRAPPER */}
      <div className="flex relative items-stretch min-h-[calc(100vh-73px)]">
        
        {/* COLLAPSIBLE SIDEBAR */}
        <aside className={`transition-all duration-300 ease-in-out border-r shrink-0 z-30 absolute md:static flex flex-col justify-between h-full bg-slate-950/95 md:bg-transparent ${
          sidebarOpen ? 'w-[260px] translate-x-0 border-white/5' : 'w-0 -translate-x-[260px] md:translate-x-0 md:w-0 border-transparent overflow-hidden'
        }`}>
          
          {/* Main Navigation Stack */}
          <div className="p-4 space-y-6">
            
            {/* Embedded Mini User Bio */}
            <div className="p-4 rounded-xl bg-slate-900 border border-white/5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-emerald-600 to-blue-500 flex items-center justify-center font-extrabold text-white">
                AP
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-white truncate">Administrator</div>
                <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
              </div>
            </div>

            {/* Nav Menu Groups */}
            <div className="space-y-4">
              
              {/* GROUP 1: MONITOR & KONTROL */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-2">Monitor & Kontrol</span>
                <nav className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('dashboard')}
                    className={`nav-btn w-full px-3 py-2 rounded-lg text-left text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                      activeTab === 'dashboard' 
                        ? 'bg-blue-600 text-white font-bold' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <Activity className="w-4.5 h-4.5" /> Dashboard Utama
                  </button>
                </nav>
              </div>

              {/* GROUP 2: SETTING */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-2">Setting</span>
                <nav className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('mqtt-config')}
                    className={`nav-btn w-full px-3 py-2 rounded-lg text-left text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                      activeTab === 'mqtt-config' 
                        ? 'bg-blue-600 text-white font-bold' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <Settings className="w-4.5 h-4.5" /> Konfigurasi MQTT
                  </button>
                </nav>
              </div>

              {/* GROUP 4: STATIC LOGS */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-2">Statistik Lokal</span>
                <nav className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('data-suhu')}
                    className={`nav-btn w-full px-3 py-2 rounded-lg text-left text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                      activeTab === 'data-suhu' 
                        ? 'bg-blue-600 text-white font-bold' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <Database className="w-4.5 h-4.5" /> Data Suhu
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('data-kelembapan')}
                    className={`nav-btn w-full px-3 py-2 rounded-lg text-left text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                      activeTab === 'data-kelembapan' 
                        ? 'bg-blue-600 text-white font-bold' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <Database className="w-4.5 h-4.5" /> Data Kelembapan
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('log-mqtt')}
                    className={`nav-btn w-full px-3 py-2 rounded-lg text-left text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                      activeTab === 'log-mqtt' 
                        ? 'bg-blue-600 text-white font-bold' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <Activity className="w-4.5 h-4.5" /> Log MQTT
                  </button>
                </nav>
              </div>

            </div>
          </div>

          {/* Bottom Sidebar logouts */}
          <div className="p-4 border-t border-white/5">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full px-3 py-2 rounded-lg text-left text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-2.5 cursor-pointer"
            >
              <LogOut className="w-4.5 h-4.5 text-red-500" /> Logout Akun
            </button>
          </div>
        </aside>

        {/* CONTAINER VIEW FOR ACTIVE TAB */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto overflow-y-auto">
          <div className="space-y-6">
            {activeTab === 'dashboard' && <UnifiedDashboard themeMode={themeMode} />}
            {activeTab === 'mqtt-config' && <MqttConfigTab />}
            {activeTab === 'data-suhu' && <HistoryTablesTabs activeSubTab="suhu" />}
            {activeTab === 'data-kelembapan' && <HistoryTablesTabs activeSubTab="kelembapan" />}
            {activeTab === 'log-mqtt' && <HistoryTablesTabs activeSubTab="log" />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [init, setInit] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (loggedUser) => {
      setUser(loggedUser);
      setInit(false);
    });
    return () => unsubscribe();
  }, []);

  if (init) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <span className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mempersiapkan Sistem IoT...</span>
        </div>
      </div>
    );
  }

  return (
    <MqttProvider>
      {user ? <DashboardContent /> : <LoginScreen onLoginSuccess={() => {}} />}
    </MqttProvider>
  );
}
