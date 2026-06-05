import React from 'react';
import { useMqtt } from '../context/MqttContext';
import { ToggleLeft, Power, Sparkles, Zap, ShieldAlert } from 'lucide-react';

export const KontrolTab: React.FC = () => {
  const { relayState, setRelay, triggerVariasi } = useMqtt();

  const handleAllOn = () => {
    setRelay('1', 'ON');
    setRelay('2', 'ON');
    setRelay('3', 'ON');
    setRelay('4', 'ON');
  };

  const handleAllOff = () => {
    setRelay('1', 'OFF');
    setRelay('2', 'OFF');
    setRelay('3', 'OFF');
    setRelay('4', 'OFF');
  };

  const relays: ('1' | '2' | '3' | '4')[] = ['1', '2', '3', '4'];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Kontrol Relay & Lampu</h2>
          <p className="text-xs text-slate-400">Hubungkan dan perintah relay multi-broker secara waktu-nyata</p>
        </div>
        
        {/* Bulk controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAllOn}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold text-xs tracking-wide transition-all shadow-md shadow-blue-500/10 active:scale-95 flex items-center gap-1.5"
          >
            <Power className="w-3.5 h-3.5" /> Nyalakan Semua
          </button>
          <button
            type="button"
            onClick={handleAllOff}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded-xl text-slate-300 font-bold text-xs tracking-wide transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Power className="w-3.5 h-3.5 text-red-500" /> Matikan Semua
          </button>
        </div>
      </div>

      {/* Grid of Relay Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {relays.map((id) => {
          const isOn = relayState[id] === 'ON';
          return (
            <div 
              key={id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between h-[180px] relative overflow-hidden backdrop-blur-xl ${
                isOn 
                  ? 'bg-blue-950/20 border-blue-500/30' 
                  : 'bg-slate-900/60 border-white/5'
              }`}
            >
              {/* LED Status glow */}
              <div className={`absolute top-4 right-4 w-2.5 h-2.5 rounded-full ${
                isOn ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6]' : 'bg-slate-700'
              }`} />

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Aktuator Output
                </span>
                <h3 className="text-lg font-bold text-white">Relay {id}</h3>
                <span className={`text-xs font-bold ${isOn ? 'text-blue-400' : 'text-slate-500'}`}>
                  {isOn ? 'STATUS: AKTIF (ON)' : 'STATUS: PADAM (OFF)'}
                </span>
              </div>

              {/* Individual controller buttons */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setRelay(id, 'ON')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    isOn 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                      : 'bg-slate-950 text-slate-400 border border-white/5 hover:text-white'
                  }`}
                >
                  AKTIF
                </button>
                <button
                  type="button"
                  onClick={() => setRelay(id, 'OFF')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    !isOn 
                      ? 'bg-red-600/20 text-red-400 border border-red-500/30 shadow-lg' 
                      : 'bg-slate-950 text-slate-400 border border-white/5 hover:text-white'
                  }`}
                >
                  OFF
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Variasi Efek */}
      <div className="p-5 bg-slate-900/60 rounded-xl border border-white/5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Variasi Perintah Berurutan</h3>
          <p className="text-xs text-slate-400">Efek kustom lampu otomatis dipublish ke topic set-mode</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Variasi 1 */}
          <div className="p-4 rounded-xl bg-slate-950 border border-white/5 space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-blue-400 tracking-wider">
                <Sparkles className="w-4 h-4" /> VARIASI 1 (BERURUTAN)
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Relay menyala bergantian indah satu-persatu dari kiri ke kanan: Relay 1, Relay 2, Relay 3, Relay 4.
              </p>
            </div>
            <button
              type="button"
              onClick={() => triggerVariasi('VARIASI1')}
              className="w-full py-2 bg-slate-900 hover:bg-slate-850 border border-white/10 rounded-xl text-slate-200 font-bold text-xs tracking-wider transition-all active:scale-95"
            >
              JALANKAN VARIASI 1
            </button>
          </div>

          {/* Variasi 2 */}
          <div className="p-4 rounded-xl bg-slate-950 border border-white/5 space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-amber-400 tracking-wider">
                <Zap className="w-4 h-4" /> VARIASI 2 (EFEK STROBO)
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Semua relay berkedip bersamaan seirama menghasilkan efek strobo neon di lapangan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => triggerVariasi('VARIASI2')}
              className="w-full py-2 bg-slate-900 hover:bg-slate-850 border border-white/10 rounded-xl text-slate-200 font-bold text-xs tracking-wider transition-all active:scale-95"
            >
              JALANKAN VARIASI 2
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
