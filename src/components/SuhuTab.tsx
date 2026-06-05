import React from 'react';
import { SuhuEmoticon3D } from './ThreeDView';
import { useMqtt } from '../context/MqttContext';
import { Thermometer, ChevronRight, AlertTriangle, RefreshCw } from 'lucide-react';

interface SuhuTabProps {
  themeMode: 'dark' | 'light';
}

export const SuhuTab: React.FC<SuhuTabProps> = ({ themeMode }) => {
  const { temperature, simulateIncomingSensor } = useMqtt();

  // Condition evaluator
  const getCondition = (temp: number) => {
    if (temp < 25) {
      return {
        status: 'Dingin',
        color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        desc: 'Ekspresi emoticon menggigil dengan pergerakan bergetar pelan. Partikel salju meluncur di sekitarnya.',
        accent: 'from-blue-600 to-cyan-500'
      };
    } else if (temp >= 25 && temp <= 30) {
      return {
        status: 'Normal',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        desc: 'Emoticon tersenyum bahagia. Berputar santai mengelilingi sumbu dengan partikel hijau stabil.',
        accent: 'from-emerald-600 to-teal-500'
      };
    } else if (temp > 30 && temp <= 35) {
      return {
        status: 'Panas',
        color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        desc: 'Kulit oranye berkeringat di dahi. Berputar lebih terburu-buru dengan emisi partikel panas naik.',
        accent: 'from-amber-600 to-red-500'
      };
    } else {
      return {
        status: 'Sangat Panas',
        color: 'text-red-500 bg-red-500/10 border-red-500/20 shadow-red-500/5',
        desc: 'Sangat panas / merah menyala! Bergetar menggila (hyper-excited) dengan semburan api berkilau.',
        accent: 'from-red-600 to-rose-500'
      };
    }
  };

  const cond = getCondition(temperature);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white text-center">Monitoring Suhu Realtime</h2>
        <p className="text-xs text-slate-400 text-center">Parameter sensor DHT11/22 dimonitoring langsung dari MQTT Broker</p>
      </div>

      <div className="max-w-2xl mx-auto w-full">
        
        {/* 3D Visualization */}
        <div className="p-6 bg-slate-900/60 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-blue-400" /> Sensor Suhu 3D Geometry
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cond.color}`}>
                Status: {cond.status}
              </span>
            </div>
            {/* The canvas */}
            <SuhuEmoticon3D temperature={temperature} themeMode={themeMode} />
          </div>

          <div className="mt-5 pt-4 border-t border-white/5 space-y-1.5 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Kondisi Logika 3D</span>
            <p className="text-xs leading-relaxed text-slate-300">{cond.desc}</p>
          </div>
        </div>

      </div>
    </div>
  );
};
