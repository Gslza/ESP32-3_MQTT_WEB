import React, { useState } from 'react';
import { useMqtt } from '../context/MqttContext';
import { Trash2, AlertCircle, FileSpreadsheet, Terminal, TerminalSquare } from 'lucide-react';

interface TabType {
  activeSubTab: 'suhu' | 'kelembapan' | 'log';
}

export const HistoryTablesTabs: React.FC<TabType> = ({ activeSubTab }) => {
  const { tempHistory, humidityHistory, logs, clearHistory } = useMqtt();
  
  // Terminal log typing filters
  const [logFilter, setLogFilter] = useState<'all' | 'publish' | 'subscribe' | 'relay' | 'voice' | 'error'>('all');

  const filteredLogs = logs.filter((log) => {
    if (logFilter === 'all') return true;
    return log.type === logFilter;
  });

  return (
    <div className="space-y-6">
      
      {/* Sub-tab view: Data Suhu */}
      {activeSubTab === 'suhu' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-400" /> Riwayat Log Data Suhu
              </h2>
              <p className="text-xs text-slate-400">Arsip nilai sensor temperatur yang disimpan secara lokal di peranti Anda</p>
            </div>
            
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Hapus seluruh riwayat suhu lokal?')) {
                  clearHistory('suhu');
                }
              }}
              disabled={tempHistory.length === 0}
              className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 rounded-xl text-xs font-bold text-red-400 transition-all active:scale-95 disabled:opacity-30 self-start flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Hapus Riwayat
            </button>
          </div>

          <div className="bg-slate-900/60 rounded-xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium border-collapse">
                <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-white/5 text-[10px]">
                  <tr>
                    <th className="p-4">Waktu Diterima</th>
                    <th className="p-4">Broker Pengirim</th>
                    <th className="p-4 text-right">Nilai Suhu (°C)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {tempHistory.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-slate-500 italic">
                        Belum ada data suhu yang terekam. Masukkan simulasi atau hubungkan MQTT broker.
                      </td>
                    </tr>
                  ) : (
                    tempHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-950/20 transition-colors">
                        <td className="p-4 font-mono text-[11px] text-slate-400">{item.timestamp}</td>
                        <td className="p-4 font-mono text-[11px] text-blue-400 font-bold">{item.broker}</td>
                        <td className="p-4 text-right font-extrabold text-sm">{item.value} °C</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab view: Data Kelembapan */}
      {activeSubTab === 'kelembapan' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-cyan-400" /> Riwayat Log Data Kelembapan
              </h2>
              <p className="text-xs text-slate-400">Arsip nilai kelembapan udara relatif (RH) yang terekam secara lokal</p>
            </div>
            
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Hapus seluruh riwayat kelembapan lokal?')) {
                  clearHistory('kelembapan');
                }
              }}
              disabled={humidityHistory.length === 0}
              className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 rounded-xl text-xs font-bold text-red-400 transition-all active:scale-95 disabled:opacity-30 self-start flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Hapus Riwayat
            </button>
          </div>

          <div className="bg-slate-900/60 rounded-xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium border-collapse">
                <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-white/5 text-[10px]">
                  <tr>
                    <th className="p-4">Waktu Diterima</th>
                    <th className="p-4">Broker Pengirim</th>
                    <th className="p-4 text-right">Nilai Kelembapan (% RH)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {humidityHistory.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-slate-500 italic">
                        Belum ada data kelembapan yang terekam. Masukkan simulasi atau hubungkan MQTT broker.
                      </td>
                    </tr>
                  ) : (
                    humidityHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-950/20 transition-colors">
                        <td className="p-4 font-mono text-[11px] text-slate-400">{item.timestamp}</td>
                        <td className="p-4 font-mono text-[11px] text-cyan-400 font-bold">{item.broker}</td>
                        <td className="p-4 text-right font-extrabold text-sm text-cyan-400">{item.value} % RH</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab view: Log MQTT */}
      {activeSubTab === 'log' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-400" /> Log Transaksi & Antarmuka MQTT
              </h2>
              <p className="text-xs text-slate-400">Daftar kejadian mentah, pengiriman payload, dan status broker waktu-nyata</p>
            </div>
            
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Bersihkan seluruh log konsol lokal?')) {
                  clearHistory('log');
                }
              }}
              disabled={logs.length === 0}
              className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 rounded-xl text-xs font-bold text-red-400 transition-all active:scale-95 disabled:opacity-30 self-start flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Bersihkan Log
            </button>
          </div>

          {/* Console filters */}
          <div className="flex flex-wrap items-center gap-2 pb-1 text-xs">
            {(['all', 'publish', 'subscribe', 'relay', 'voice', 'error'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setLogFilter(filter)}
                className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  logFilter === filter 
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow shadow-emerald-500/5' 
                    : 'bg-slate-900 border-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                {filter === 'all' ? 'SEMUA' : filter}
              </button>
            ))}
          </div>

          {/* Scrolling Terminal Code Panel */}
          <div className="bg-slate-950 p-4 border border-white/5 rounded-xl block font-mono text-[11px] h-[340px] overflow-y-auto pr-2 space-y-1.5 leading-relaxed">
            {filteredLogs.length === 0 ? (
              <div className="text-slate-600 italic text-center pt-24">
                Belum ada log yang cocok dalam saringan ini...
              </div>
            ) : (
              filteredLogs.map((log) => {
                let badgeColor = 'text-blue-400';
                if (log.type === 'publish') badgeColor = 'text-orange-400 font-bold';
                else if (log.type === 'subscribe') badgeColor = 'text-emerald-400';
                else if (log.type === 'error') badgeColor = 'text-red-500 font-extrabold';
                else if (log.type === 'voice') badgeColor = 'text-purple-400';
                else if (log.type === 'relay') badgeColor = 'text-teal-400';

                return (
                  <div key={log.id} className="flex gap-2.5 items-start p-1.5 border-b border-white/5 hover:bg-white/5 rounded transition-all">
                    <span className="text-slate-600 flex-shrink-0">[{log.timestamp}]</span>
                    <span className={`flex-shrink-0 font-bold ${badgeColor}`}>
                      [{log.type.toUpperCase()}]
                    </span>
                    <span className="text-blue-300 font-bold flex-shrink-0">[{log.broker}]</span>
                    <span className="text-slate-300 break-all">{log.message}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

    </div>
  );
};
