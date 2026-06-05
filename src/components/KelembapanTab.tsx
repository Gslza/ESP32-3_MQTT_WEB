import React from 'react';
import { KelembapanEmoticon3D } from './ThreeDView';
import { useMqtt } from '../context/MqttContext';
import { CloudRain, ChevronRight } from 'lucide-react';

interface KelembapanTabProps {
  themeMode: 'dark' | 'light';
}

export const KelembapanTab: React.FC<KelembapanTabProps> = ({ themeMode }) => {
  const { humidity, simulateIncomingSensor } = useMqtt();

  const getCondition = (hum: number) => {
    if (hum < 40) {
      return {
        status: 'Kering',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        desc: 'Permukaan kuning terasa kering dan kerut tidak nyaman. Emoticon berputar lambat merepresentasikan kekeringan.',
        accent: 'from-amber-600 to-yellow-400'
      };
    } else if (hum >= 40 && hum <= 70) {
      return {
        status: 'Normal',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        desc: 'Wajah hijau tersenyum segar. Perputaran emoticon stabil dengan letupan partikel sekeliling.',
        accent: 'from-emerald-600 to-teal-500'
      };
    } else {
      return {
        status: 'Lembap',
        color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
        desc: 'Ekspresi berkeringat basah dengan pergerakan naik turun lembut seperti gelombang air. Letupan partikel hujan cyan.',
        accent: 'from-cyan-600 to-blue-500'
      };
    }
  };

  const cond = getCondition(humidity);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white text-center">Monitoring Kelembapan</h2>
        <p className="text-xs text-slate-400 text-center">Parameter kelembapan kelembapan relatif (RH) real-time</p>
      </div>

      <div className="max-w-2xl mx-auto w-full">
        
        {/* 3D Scene */}
        <div className="p-6 bg-slate-900/60 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <CloudRain className="w-4 h-4 text-cyan-400" /> Sensor Kelembapan 3D Geometry
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cond.color}`}>
                Status: {cond.status}
              </span>
            </div>
            {/* The Canvas */}
            <KelembapanEmoticon3D humidity={humidity} themeMode={themeMode} />
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
