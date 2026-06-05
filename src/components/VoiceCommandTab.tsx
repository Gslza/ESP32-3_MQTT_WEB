import React, { useState, useEffect, useRef } from 'react';
import { VoiceSpectrum3D } from './ThreeDView';
import { useMqtt } from '../context/MqttContext';
import { Mic, MicOff } from 'lucide-react';

interface VoiceCommandTabProps {
  themeMode: 'dark' | 'light';
}

export const VoiceCommandTab: React.FC<VoiceCommandTabProps> = ({ themeMode }) => {
  const { publishToAll, setRelay, triggerVariasi, temperature, humidity } = useMqtt();
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
      rec.lang = 'id-ID'; // Indonesian as requested

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
      setRecognitionError('Browser Anda tidak mendukung Web Speech API secara utuh. Gunakan Google Chrome.');
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
      // Simulator fallback if no speech API
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

    // Publish original voice commands raw string to topic voice command
    publishToAll('gusliyanza/iot-multibroker/voice/cmd', rawText);

    // Command Parser logic
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

  // Simulation fallback to test voice commands without microphone input
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

  return (
    <div className="space-y-6">
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Voice Controller</h2>
          <p className="text-xs text-slate-400">Gunakan Web Speech API id-ID untuk mengontrol Relay secara lisan</p>
        </div>
        
        {/* Warning Fallback */}
        {recognitionError && (
          <div className="px-3.5 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 text-xs font-semibold">
            {recognitionError}
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto w-full">
        {/* 3D spectrum */}
        <div className="flex flex-col justify-between p-6 bg-slate-900/60 rounded-2xl border border-white/5 relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
                Visualisasi Gelombang Spektrum 3D
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                isListening ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' : 'bg-slate-800 text-slate-400'
              }`}>
                {isListening ? 'Mendengarkan...' : 'Siaga'}
              </span>
            </div>

            {/* Three.js canvas component */}
            <VoiceSpectrum3D isListening={isListening} themeMode={themeMode} />
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-4 items-center justify-center">
            {/* Start/Stop Controls */}
            {!isListening ? (
              <button
                type="button"
                onClick={startListening}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2"
              >
                <Mic className="w-4 h-4 text-white" /> Mulai Bicara (id-ID)
              </button>
            ) : (
              <button
                type="button"
                onClick={stopListening}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-red-500/20 active:scale-95 flex items-center justify-center gap-2"
              >
                <MicOff className="w-4 h-4 text-white" /> Hentikan Suara
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
