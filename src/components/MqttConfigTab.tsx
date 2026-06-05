import React, { useState } from 'react';
import { useMqtt } from '../context/MqttContext';
import { BrokerConfig } from '../types';
import { Settings, Check, AlertCircle, RefreshCw, KeyRound, ShieldCheck } from 'lucide-react';

export const MqttConfigTab: React.FC = () => {
  const { brokers, updateBrokerConfig, testBrokerConnection, resetAllBrokers } = useMqtt();
  
  const [formStates, setFormStates] = useState<BrokerConfig[]>(() => JSON.parse(JSON.stringify(brokers)));
  const [testResults, setTestResults] = useState<{ [key: string]: 'success' | 'failed' | 'testing' | null }>({});
  const [savedStatus, setSavedStatus] = useState<{ [key: string]: boolean }>({});

  const handleInputChange = (index: number, field: keyof BrokerConfig, value: string) => {
    setFormStates((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setSavedStatus((prev) => ({ ...prev, [formStates[index].name]: false }));
  };

  const handleSave = (index: number) => {
    const configToSave = formStates[index];
    updateBrokerConfig(index, configToSave);
    setSavedStatus((prev) => ({ ...prev, [configToSave.name]: true }));
    setTimeout(() => {
      setSavedStatus((prev) => ({ ...prev, [configToSave.name]: false }));
    }, 2500);
  };

  const handleTest = async (index: number) => {
    const broker = formStates[index];
    setTestResults((prev) => ({ ...prev, [broker.name]: 'testing' }));
    
    const isSuccess = await testBrokerConnection(broker);
    
    setTestResults((prev) => ({
      ...prev,
      [broker.name]: isSuccess ? 'success' : 'failed',
    }));
  };

  const handleReset = () => {
    if (window.confirm('Apakah Anda yakin ingin menyetel ulang semua broker ke konfigurasi bawaan?')) {
      resetAllBrokers();
      setTimeout(() => {
        // Reload fresh values to local forms
        window.location.reload();
      }, 500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Visual Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Konfigurasi MQTT Broker</h2>
          <p className="text-xs text-slate-400">Atur kredensial dan URL WebSocket penyiaran untuk 3 MQTT Broker yang digunakan</p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded-xl text-xs font-bold text-slate-300 transition-all flex items-center gap-1.5 active:scale-95 self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Setel Ulang Default
        </button>
      </div>

      {/* Grid of the 3 broker forms */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {formStates.map((broker, idx) => {
          const isSaved = savedStatus[broker.name];
          const testStatus = testResults[broker.name];
          const isConnected = brokers[idx].connected;

          return (
            <div 
              key={broker.name} 
              className={`p-5 rounded-2xl border bg-slate-900/60 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between ${
                isConnected ? 'border-emerald-500/20' : 'border-white/5'
              }`}
            >
              <div className="space-y-4">
                {/* Header card info */}
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">
                      {broker.type}
                    </span>
                    <h3 className="text-sm font-bold text-white">{broker.name}</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-850 text-slate-500'
                  }`}>
                    {isConnected ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>

                {/* Form fields */}
                <div className="space-y-3 text-xs">
                  {/* WS URL */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      WebSocket URL (WSS)
                    </label>
                    <input
                      type="text"
                      value={broker.websocketUrl}
                      onChange={(e) => handleInputChange(idx, 'websocketUrl', e.target.value)}
                      placeholder="wss://broker.hivemq.com:8884/mqtt"
                      className="w-full px-3 py-2 bg-slate-950 border border-white/5 text-white rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Port */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Port Broker
                    </label>
                    <input
                      type="text"
                      value={broker.port}
                      onChange={(e) => handleInputChange(idx, 'port', e.target.value)}
                      placeholder="8884"
                      className="w-full px-3 py-2 bg-slate-950 border border-white/5 text-white rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Client ID */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Client ID
                    </label>
                    <input
                      type="text"
                      value={broker.clientId}
                      onChange={(e) => handleInputChange(idx, 'clientId', e.target.value)}
                      placeholder="client_name"
                      className="w-full px-3 py-2 bg-slate-950 border border-white/5 text-white rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  {/* Base Topic */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Base Topic
                    </label>
                    <input
                      type="text"
                      value={broker.baseTopic}
                      onChange={(e) => handleInputChange(idx, 'baseTopic', e.target.value)}
                      placeholder="root/topic"
                      className="w-full px-3 py-2 bg-slate-950 border border-white/5 text-white rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  {/* Username (Optional) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Username (Opsional)
                    </label>
                    <input
                      type="text"
                      value={broker.username}
                      onChange={(e) => handleInputChange(idx, 'username', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-white/5 text-white rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Password (Optional) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Password (Opsional)
                    </label>
                    <input
                      type="password"
                      value={broker.password || ''}
                      onChange={(e) => handleInputChange(idx, 'password', e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-slate-950 border border-white/5 text-white rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Card footer actions */}
              <div className="mt-5 space-y-2 pt-4 border-t border-white/5">
                {/* Connection Status feedback bar */}
                {testStatus && (
                  <div className={`p-2 rounded text-[11px] font-medium flex items-center gap-1.5 text-center justify-center ${
                    testStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    testStatus === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse'
                  }`}>
                    {testStatus === 'success' && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                    {testStatus === 'failed' && <AlertCircle className="w-4 h-4 text-red-500" />}
                    {testStatus === 'testing' && <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />}
                    {testStatus === 'testing' ? 'Memulai Uji Coba...' : testStatus === 'success' ? 'Koneksi Berhasil!' : 'Koneksi Gagal.'}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTest(idx)}
                    disabled={testStatus === 'testing'}
                    className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-white/5 disabled:opacity-50 transition-all active:scale-95"
                  >
                    Test Koneksi
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSave(idx)}
                    className="py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.97] flex items-center justify-center gap-1"
                  >
                    {isSaved ? <Check className="w-3.5 h-3.5" /> : null}
                    {isSaved ? 'Tersimpan!' : 'Simpan'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
