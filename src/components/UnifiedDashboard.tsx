import React, { useState, useEffect, useRef } from 'react';
import { useMqtt } from '../context/MqttContext';
import { VoiceSpectrum3D, SuhuEmoticon3D, KelembapanEmoticon3D } from './ThreeDView';
import { 
  Mic, MicOff, Thermometer, CloudRain, Power, Sparkles, Zap, Radio 
} from 'lucide-react';

interface UnifiedDashboardProps {
  themeMode: 'dark' | 'light';
}

export const UnifiedDashboard: React.FC<UnifiedDashboardProps> = ({ themeMode }) => {
  const { 
    temperature, 
    humidity, 
    relayState, 
    setRelay, 
    triggerVariasi, 
    publishToAll 
  } = useMqtt();

  // Voice States
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [recognitionError, setRecognitionError] = useState<string>('');
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check speech recognition support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'id-ID';

      rec.onstart = () => {
        setIsListening(true);
        setRecognitionError('');
      };

      rec.onerror = (event: any) => {
        console.error(event);
        setRecognitionError(`Eror deteksi suara: ${event.error}`);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        processVoiceCommand(text);
      };

      recognitionRef.current = rec;
    } else {
      setRecognitionError('Browser tidak mendukung Web Speech API sepenuhnya (Gunakan Google Chrome).');
    }
  }, [temperature, humidity]);

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    } else {
      simulateVoiceCommand();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Speech synthesis not supported');
    }
  };

  const processVoiceCommand = (rawText: string) => {
    const text = rawText.toLowerCase().trim();
    publishToAll('gusliyanza/iot-multibroker/voice/cmd', rawText);

    if (text.includes('nyalakan relay 1')) {
      setRelay('1', 'ON');
      speakText('Menyalakan relay satu.');
    } else if (text.includes('matikan relay 1')) {
      setRelay('1', 'OFF');
      speakText('Mematikan relay satu.');
    } else if (text.includes('nyalakan relay 2')) {
      setRelay('2', 'ON');
      speakText('Menyalakan relay dua.');
    } else if (text.includes('matikan relay 2')) {
      setRelay('2', 'OFF');
      speakText('Mematikan relay dua.');
    } else if (text.includes('nyalakan relay 3')) {
      setRelay('3', 'ON');
      speakText('Menyalakan relay tiga.');
    } else if (text.includes('matikan relay 3')) {
      setRelay('3', 'OFF');
      speakText('Mematikan relay tiga.');
    } else if (text.includes('nyalakan relay 4')) {
      setRelay('4', 'ON');
      speakText('Menyalakan relay empat.');
    } else if (text.includes('matikan relay 4')) {
      setRelay('4', 'OFF');
      speakText('Mematikan relay empat.');
    } else if (text.includes('nyalakan semua relay') || text.includes('nyalakan semua')) {
      setRelay('1', 'ON');
      setRelay('2', 'ON');
      setRelay('3', 'ON');
      setRelay('4', 'ON');
      speakText('Menyalakan semua pintu relay.');
    } else if (text.includes('matikan semua relay') || text.includes('matikan semua')) {
      setRelay('1', 'OFF');
      setRelay('2', 'OFF');
      setRelay('3', 'OFF');
      setRelay('4', 'OFF');
      speakText('Mematikan semua lampu relay.');
    } else if (text.includes('jalankan variasi 1') || text.includes('variasi satu') || text.includes('variasi 1')) {
      triggerVariasi('VARIASI1');
      speakText('Menjalankan kontrol variasi satu.');
    } else if (text.includes('jalankan variasi 2') || text.includes('variasi dua') || text.includes('variasi 2')) {
      triggerVariasi('VARIASI2');
      speakText('Menjalankan kontrol variasi dua.');
    } else if (text.includes('baca suhu') || text.includes('berapa suhu') || text.includes('informasi suhu')) {
      speakText(`Suhu saat ini adalah ${temperature} derajat Celsius.`);
    } else if (text.includes('baca kelembapan') || text.includes('berapa kelembapan') || text.includes('info kelembapan')) {
      speakText(`Kelembapan saat ini adalah ${humidity} persen.`);
    } else {
      speakText('Perintah tidak dikenali, silakan coba katakan kembali.');
    }
  };

  const simulateVoiceCommand = () => {
    setIsListening(true);
    const mockCommands = [
      'nyalakan relay 1',
      'matikan semua relay',
      'jalankan variasi 1',
      'baca suhu',
      'baca kelembapan',
      'nyalakan semua relay',
      'jalankan variasi 2'
    ];
    const chosen = mockCommands[Math.floor(Math.random() * mockCommands.length)];
    
    setTimeout(() => {
      setTranscript(chosen);
      processVoiceCommand(chosen);
      setIsListening(false);
    }, 1800);
  };

  // Suhu Condition Evaluator
  const getSuhuCondition = (temp: number) => {
    if (temp < 25) {
      return {
        status: 'Dingin',
        color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        desc: 'Ekspresi emoticon menggigil dengan pergerakan bergetar pelan. Partikel salju meluncur di sekitarnya.'
      };
    } else if (temp >= 25 && temp <= 30) {
      return {
        status: 'Normal',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        desc: 'Emoticon tersenyum bahagia. Berputar santai mengelilingi sumbu dengan partikel hijau stabil.'
      };
    } else if (temp > 30 && temp <= 35) {
      return {
        status: 'Panas',
        color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        desc: 'Kulit oranye berkeringat di dahi. Berputar lebih terburu-buru dengan emisi partikel panas naik.'
      };
    } else {
      return {
        status: 'Sangat Panas',
        color: 'text-red-500 bg-red-500/10 border-red-500/20 shadow-red-500/5',
        desc: 'Sangat panas / merah menyala! Bergetar menggila dengan semburan api berkilau.'
      };
    }
  };

  // Kelembapan Condition Evaluator
  const getKelembapanCondition = (hum: number) => {
    if (hum < 40) {
      return {
        status: 'Kering',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        desc: 'Permukaan kuning terasa kering dan kerut tidak nyaman. Emoticon berputar lambat.'
      };
    } else if (hum >= 40 && hum <= 70) {
      return {
        status: 'Normal',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        desc: 'Wajah hijau tersenyum segar. Perputaran emoticon stabil dengan letupan partikel sekeliling.'
      };
    } else {
      return {
        status: 'Lembap',
        color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
        desc: 'Ekspresi berkeringat basah dengan pergerakan naik turun lembut seperti gelombang. Partikel hujan.'
      };
    }
  };

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

  const condSuhu = getSuhuCondition(temperature);
  const condKelembapan = getKelembapanCondition(humidity);
  const relays: ('1' | '2' | '3' | '4')[] = ['1', '2', '3', '4'];

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Dashboard Monitoring & Kontrol IoT</h2>
          <p className="text-xs text-slate-400">Kontrol real-time dikoordinasikan penuh dari satu konsol terintegrasi</p>
        </div>
        {recognitionError && (
          <div className="px-3.5 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/25 text-yellow-200 text-xs font-semibold">
            {recognitionError}
          </div>
        )}
      </div>

      {/* Grid Utama Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Kolom Kiri: Realtime Voice Command spektrum & kontrol */}
        <div className="space-y-6">
          
          {/* Card Voice Command */}
          <div className="p-6 bg-slate-900/60 rounded-2xl border border-white/5 flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <Radio className="w-4 h-4 text-blue-400 animate-pulse" /> Voice Controller Spectrum
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isListening ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' : 'bg-slate-800 text-slate-400'
                }`}>
                  {isListening ? 'Mendengarkan...' : 'Siaga'}
                </span>
              </div>
              
              <VoiceSpectrum3D isListening={isListening} themeMode={themeMode} />

              {transcript && (
                <div className="mt-4 p-3 bg-slate-950/50 border border-white/5 rounded-xl text-center">
                  <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block mb-1">Hasil Transkrip</span>
                  <p className="text-xs font-medium text-slate-300">"{transcript}"</p>
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-center">
              {!isListening ? (
                <button
                  type="button"
                  id="btn-voice-start"
                  onClick={startListening}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <Mic className="w-4 h-4 text-white" /> Mulai Bicara (id-ID)
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-voice-stop"
                  onClick={stopListening}
                  className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-red-500/20 active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <MicOff className="w-4 h-4 text-white" /> Hentikan Suara
                </button>
              )}
            </div>
          </div>

          {/* Grid Monitor Sensor 3D berdampingan di bawah Voice Command */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Sensor Suhu 3D Geometry */}
            <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-blue-400" /> Suhu 3D
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/10">
                      {temperature} °C
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${condSuhu.color}`}>
                      {condSuhu.status}
                    </span>
                  </div>
                </div>
                <SuhuEmoticon3D temperature={temperature} themeMode={themeMode} />
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/5 text-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Kondisi Logika 3D</span>
                <p className="text-[11px] leading-relaxed text-slate-300 truncate">{condSuhu.desc}</p>
              </div>
            </div>

            {/* Sensor Kelembapan 3D Geometry */}
            <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1">
                    <CloudRain className="w-3.5 h-3.5 text-cyan-400" /> Kelembapan 3D
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/10">
                      {humidity} % RH
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${condKelembapan.color}`}>
                      {condKelembapan.status}
                    </span>
                  </div>
                </div>
                <KelembapanEmoticon3D humidity={humidity} themeMode={themeMode} />
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/5 text-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Kondisi Logika 3D</span>
                <p className="text-[11px] leading-relaxed text-slate-300 truncate">{condKelembapan.desc}</p>
              </div>
            </div>

          </div>

        </div>

        {/* Kolom Kanan: Detail Relays */}
        <div className="space-y-6 flex flex-col justify-between">
          
          {/* Card Grid Relay */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest pl-1">
                Aktuator Relay Output
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-all-on"
                  onClick={handleAllOn}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-bold text-[10px] tracking-wide transition-all cursor-pointer"
                >
                  ALL ON
                </button>
                <button
                  type="button"
                  id="btn-all-off"
                  onClick={handleAllOff}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white font-bold text-[10px] tracking-wide border border-white/5 transition-all cursor-pointer"
                >
                  ALL OFF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {relays.map((id) => {
                const isOn = relayState[id] === 'ON';
                return (
                  <div 
                    key={id}
                    id={`relay-card-${id}`}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between h-[120px] relative overflow-hidden backdrop-blur-xl ${
                      isOn 
                        ? 'bg-blue-950/20 border-blue-500/30' 
                        : 'bg-slate-900/60 border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500">RELAY {id}</span>
                      <div className={`w-2 h-2 rounded-full ${isOn ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-slate-700'}`} />
                    </div>

                    <div className="mt-2 text-xs font-bold text-white">
                      Status: <span className={isOn ? 'text-blue-400' : 'text-slate-500'}>{isOn ? 'AKTIF' : 'PADAM'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 mt-2">
                      <button
                        type="button"
                        id={`btn-relay-on-${id}`}
                        onClick={() => setRelay(id, 'ON')}
                        className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          isOn ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400'
                        }`}
                      >
                        ON
                      </button>
                      <button
                        type="button"
                        id={`btn-relay-off-${id}`}
                        onClick={() => setRelay(id, 'OFF')}
                        className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          !isOn ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-slate-950 text-slate-400'
                        }`}
                      >
                        OFF
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Variasi Kontrol */}
          <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/5 space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Variasi Perintah</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="btn-var-1"
                onClick={() => triggerVariasi('VARIASI1')}
                className="py-2.5 bg-slate-950 hover:bg-slate-900 border border-white/5 rounded-xl text-xs font-bold text-blue-400 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" /> VARIASI 1
              </button>
              <button
                type="button"
                id="btn-var-2"
                onClick={() => triggerVariasi('VARIASI2')}
                className="py-2.5 bg-slate-950 hover:bg-slate-900 border border-white/5 rounded-xl text-xs font-bold text-amber-400 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" /> VARIASI 2
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
