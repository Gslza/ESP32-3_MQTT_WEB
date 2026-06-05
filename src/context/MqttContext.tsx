import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import mqtt, { MqttClient } from 'mqtt';
import { BrokerConfig, MqttLog, SensorLog, RelayState } from '../types';
import { loadBrokerConfigs, saveBrokerConfigs } from '../lib/mqttStore';

interface MqttContextType {
  brokers: BrokerConfig[];
  relayState: RelayState;
  temperature: number;
  humidity: number;
  logs: MqttLog[];
  tempHistory: SensorLog[];
  humidityHistory: SensorLog[];
  publishToAll: (topic: string, payload: string) => void;
  setRelay: (relayId: '1' | '2' | '3' | '4' | 'all', state: 'ON' | 'OFF') => void;
  triggerVariasi: (variation: 'VARIASI1' | 'VARIASI2') => void;
  clearHistory: (type: 'suhu' | 'kelembapan' | 'log') => void;
  updateBrokerConfig: (index: number, updated: BrokerConfig) => void;
  testBrokerConnection: (broker: BrokerConfig) => Promise<boolean>;
  resetAllBrokers: () => void;
  simulateIncomingSensor: (temp: number, hum: number) => void;
}

const MqttContext = createContext<MqttContextType | undefined>(undefined);

export const MqttProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Configs
  const [brokers, setBrokers] = useState<BrokerConfig[]>(() => loadBrokerConfigs());

  // Realtime values
  const [relayState, setRelayState] = useState<RelayState>({
    '1': 'OFF',
    '2': 'OFF',
    '3': 'OFF',
    '4': 'OFF',
  });
  const [temperature, setTemperature] = useState<number>(27);
  const [humidity, setHumidity] = useState<number>(55);

  // Logs & History from local storage
  const [logs, setLogs] = useState<MqttLog[]>(() => {
    const raw = localStorage.getItem('mqtt_sys_logs');
    return raw ? JSON.parse(raw) : [];
  });
  const [tempHistory, setTempHistory] = useState<SensorLog[]>(() => {
    const raw = localStorage.getItem('mqtt_temp_history');
    return raw ? JSON.parse(raw) : [];
  });
  const [humidityHistory, setHumidityHistory] = useState<SensorLog[]>(() => {
    const raw = localStorage.getItem('mqtt_humidity_history');
    return raw ? JSON.parse(raw) : [];
  });

  // Client refs
  const clientsRef = useRef<{ [key: string]: MqttClient | null }>({});

  const appendLog = useCallback((
    type: MqttLog['type'],
    broker: string,
    message: string
  ) => {
    const newLog: MqttLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type,
      broker,
      message,
    };
    setLogs((prev) => {
      const updated = [newLog, ...prev].slice(0, 500); // limit to 500 records
      localStorage.setItem('mqtt_sys_logs', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const appendTemp = useCallback((broker: string, val: number) => {
    const newLog: SensorLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleString('id-ID'),
      broker,
      value: val,
    };
    setTempHistory((prev) => {
      const updated = [newLog, ...prev].slice(0, 100);
      localStorage.setItem('mqtt_temp_history', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const appendHumidity = useCallback((broker: string, val: number) => {
    const newLog: SensorLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleString('id-ID'),
      broker,
      value: val,
    };
    setHumidityHistory((prev) => {
      const updated = [newLog, ...prev].slice(0, 100);
      localStorage.setItem('mqtt_humidity_history', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Set Relay with local rollback/update in case of offline, and also publish to all
  const publishToAll = useCallback((topic: string, payload: string) => {
    brokers.forEach((b) => {
      const client = clientsRef.current[b.name];
      if (client && client.connected) {
        // Resolve legacy topic structures dynamically using config baseTopic
        const resolvedTopic = topic.startsWith('gusliyanza/iot-multibroker')
          ? topic.replace('gusliyanza/iot-multibroker', b.baseTopic)
          : topic;

        client.publish(resolvedTopic, payload, { qos: 1 });
        appendLog('publish', b.name, `Published to [${resolvedTopic}]: ${payload}`);
      } else {
        appendLog('error', b.name, `Failed to publish to [${topic}] (Disconnected)`);
      }
    });
  }, [brokers, appendLog]);

  const setRelay = useCallback((relayId: '1' | '2' | '3' | '4' | 'all', state: 'ON' | 'OFF') => {
    // 1. Instantly update UI for snappy feedback
    if (relayId === 'all') {
      setRelayState({
        '1': state,
        '2': state,
        '3': state,
        '4': state,
      });
    } else {
      setRelayState(prev => ({ ...prev, [relayId]: state }));
    }
    
    // 2. Publish to standard set topic for each active broker using its customized baseTopic
    brokers.forEach((b) => {
      const client = clientsRef.current[b.name];
      if (client && client.connected) {
        const topic = `${b.baseTopic}/relay/${relayId}/set`;
        client.publish(topic, state, { qos: 1 });
        appendLog('publish', b.name, `Published command: [${topic}] -> ${state}`);
      }
    });

    appendLog('relay', 'System', `Commanded Relay ${relayId} to ${state}`);
  }, [brokers, appendLog]);

  const triggerVariasi = useCallback((variation: 'VARIASI1' | 'VARIASI2') => {
    const payload = variation === 'VARIASI1' ? 'LEFT_TO_RIGHT' : 'STROBE';
    
    brokers.forEach((b) => {
      const client = clientsRef.current[b.name];
      if (client && client.connected) {
        const topic = `${b.baseTopic}/mode/set`;
        client.publish(topic, payload, { qos: 1 });
        appendLog('publish', b.name, `Published to [${topic}]: ${payload}`);
      }
    });

    appendLog('relay', 'System', `Triggered mode: ${payload}`);

    if (variation === 'VARIASI1') {
      // Local simulation: sequentially switch ON Relay 1 to 4 with 500ms delay
      const sequence = async () => {
        const relays: ('1'|'2'|'3'|'4')[] = ['1', '2', '3', '4'];
        // Turn all off first
        relays.forEach(id => setRelay(id, 'OFF'));
        for (let i = 0; i < relays.length; i++) {
          await new Promise(r => setTimeout(r, 600));
          setRelay(relays[i], 'ON');
        }
      };
      sequence();
    } else if (variation === 'VARIASI2') {
      // Strobe blinking simulation
      let blinkCount = 0;
      const interval = setInterval(() => {
        setRelayState(prev => {
          const nextState = prev['1'] === 'ON' ? 'OFF' : 'ON';
          return { '1': nextState, '2': nextState, '3': nextState, '4': nextState };
        });
        blinkCount++;
        if (blinkCount >= 8) {
          clearInterval(interval);
        }
      }, 400);
    }
  }, [brokers, setRelay, appendLog]);

  const clearHistory = useCallback((type: 'suhu' | 'kelembapan' | 'log') => {
    if (type === 'suhu') {
      setTempHistory([]);
      localStorage.removeItem('mqtt_temp_history');
    } else if (type === 'kelembapan') {
      setHumidityHistory([]);
      localStorage.removeItem('mqtt_humidity_history');
    } else if (type === 'log') {
      setLogs([]);
      localStorage.removeItem('mqtt_sys_logs');
    }
  }, []);

  const simulateIncomingSensor = useCallback((temp: number, hum: number) => {
    setTemperature(temp);
    setHumidity(hum);
    appendTemp('SimulatedSensor', temp);
    appendHumidity('SimulatedSensor', hum);
    appendLog('info', 'Simulation', `Received Simulated Sensor: Temp=${temp}°C, Hum=${hum}%`);
  }, [appendTemp, appendHumidity, appendLog]);

  // Connect individual broker
  const connectBroker = useCallback((b: BrokerConfig) => {
    if (clientsRef.current[b.name]) {
      try {
        clientsRef.current[b.name]?.end(true);
      } catch (e) {
        console.error(e);
      }
    }

    appendLog('info', b.name, `Attempting connection to ${b.websocketUrl}...`);

    const options = {
      clientId: b.clientId,
      username: b.username || undefined,
      password: b.password || undefined,
      connectTimeout: 4000,
      reconnectPeriod: 5000,
      clean: true,
    };

    try {
      const client = mqtt.connect(b.websocketUrl, options);

      client.on('connect', () => {
        appendLog('success', b.name, `Connected successfully! Client ID: ${b.clientId}`);
        setBrokers((prev) => 
          prev.map((item) => (item.name === b.name ? { ...item, connected: true } : item))
        );

        // Subscribing to relevant topics (matching ESP32 core capabilities)
        const topicsToSubscribe = [
          `${b.baseTopic}/sensor`,
          `${b.baseTopic}/relay/status`,
          `${b.baseTopic}/relay/+/set`,
          `${b.baseTopic}/relay/+/state`,
          `${b.baseTopic}/mode/status`,
          `${b.baseTopic}/mode/set`,
          `${b.baseTopic}/voice/cmd`,
          `${b.baseTopic}/device/status`,
          `${b.baseTopic}/log`
        ];

        topicsToSubscribe.forEach(topic => {
          client.subscribe(topic, { qos: 1 }, (err) => {
            if (err) {
              appendLog('error', b.name, `Subscribing failed for topic [${topic}]`);
            } else {
              appendLog('subscribe', b.name, `Subscribed to: ${topic}`);
            }
          });
        });
      });

      client.on('message', (topic, payload) => {
        const messageStr = payload.toString();
        appendLog('subscribe', b.name, `Message on [${topic}]: ${messageStr}`);

        // 1. Parsing Sensor Payload (JSON DHT)
        if (topic.endsWith('/sensor')) {
          try {
            const data = JSON.parse(messageStr);
            if (typeof data.temperature === 'number') {
              setTemperature(Number(data.temperature.toFixed(1)));
              appendTemp(b.name, Number(data.temperature.toFixed(1)));
            }
            if (typeof data.humidity === 'number') {
              setHumidity(Number(data.humidity.toFixed(1)));
              appendHumidity(b.name, Number(data.humidity.toFixed(1)));
            }
          } catch (e) {
            // Raw reading fallback
            const val = parseFloat(messageStr);
            if (!isNaN(val)) {
              if (topic.includes('temp') || messageStr.length < 5) {
                setTemperature(val);
                appendTemp(b.name, val);
              }
            }
          }
        }

        // 2. Parsing Real-Time Relay Status (ESP32 Multi-relay status topic)
        if (topic.endsWith('/relay/status')) {
          try {
            const data = JSON.parse(messageStr);
            setRelayState({
              '1': data.relay1 ? 'ON' : 'OFF',
              '2': data.relay2 ? 'ON' : 'OFF',
              '3': data.relay3 ? 'ON' : 'OFF',
              '4': data.relay4 ? 'ON' : 'OFF',
            });
            appendLog('success', b.name, `Relay states sync: R1=${data.relay1?'ON':'OFF'}, R2=${data.relay2?'ON':'OFF'}, R3=${data.relay3?'ON':'OFF'}, R4=${data.relay4?'ON':'OFF'}`);
          } catch (e) {
            console.error('Error parsing relay status JSON:', e);
          }
        }

        // 3. Alternative wildcard relay level status/set feedback
        const relayStateRegex = /relay\/(\d)\/(state|set)$/;
        const matchState = topic.match(relayStateRegex);
        if (matchState) {
          const relayId = matchState[1] as '1'|'2'|'3'|'4';
          const normalizedMsg = messageStr.toUpperCase().trim();
          if (normalizedMsg === 'ON' || normalizedMsg === 'OFF') {
            setRelayState((prev) => ({ ...prev, [relayId]: normalizedMsg }));
          }
        }

        // 4. Wildcard Relay ALL status/set feedback
        if (topic.endsWith('/relay/all/set') || topic.endsWith('/relay/all/state')) {
          const normalizedMsg = messageStr.toUpperCase().trim();
          if (normalizedMsg === 'ON' || normalizedMsg === 'OFF') {
            setRelayState({
              '1': normalizedMsg,
              '2': normalizedMsg,
              '3': normalizedMsg,
              '4': normalizedMsg,
            });
          }
        }

        // 5. Mode set command tracking
        if (topic.endsWith('/mode/set')) {
          const normalized = messageStr.toUpperCase().trim();
          appendLog('success', b.name, `Active mode updated to: ${normalized}`);
        }

        // 6. Mode status confirmations from Arduino
        if (topic.endsWith('/mode/status')) {
          try {
            const data = JSON.parse(messageStr);
            if (data.mode && data.status) {
              appendLog('info', b.name, `Arduino reports mode [${data.mode}] is ${data.status}`);
            }
          } catch (e) {
            appendLog('info', b.name, `Arduino mode status report: ${messageStr}`);
          }
        }

        // 7. Device online status confirmation
        if (topic.endsWith('/device/status')) {
          try {
            const data = JSON.parse(messageStr);
            if (data.status === 'online') {
              appendLog('success', b.name, `ESP32 connected online (RSSI: ${data.wifi_rssi || 'N/A'})`);
            } else if (data.status === 'offline') {
              appendLog('warn', b.name, `ESP32 disconnected (offline status published)`);
            }
          } catch (e) {
            appendLog('info', b.name, `Device status published: ${messageStr}`);
          }
        }
      });

      client.on('close', () => {
        setBrokers((prev) => 
          prev.map((item) => (item.name === b.name ? { ...item, connected: false } : item))
        );
      });

      client.on('error', (err) => {
        appendLog('error', b.name, `Error: ${err.message}`);
        setBrokers((prev) => 
          prev.map((item) => (item.name === b.name ? { ...item, connected: false } : item))
        );
      });

      clientsRef.current[b.name] = client;
    } catch (e: any) {
      appendLog('error', b.name, `Exception encountered: ${e.message}`);
    }
  }, [appendLog, appendTemp, appendHumidity]);

  // Connect all brokers on mount
  useEffect(() => {
    brokers.forEach((b) => {
      // Connect
      connectBroker(b);
    });

    // Cleanup on unmount
    return () => {
      Object.keys(clientsRef.current).forEach((key) => {
        const c = clientsRef.current[key];
        if (c) {
          try {
            c.end(true);
          } catch (e) {
            console.error(e);
          }
        }
      });
    };
  }, []); // Run once on startup

  const updateBrokerConfig = useCallback((index: number, updated: BrokerConfig) => {
    setBrokers((prev) => {
      const next = [...prev];
      next[index] = { ...updated, connected: false };
      saveBrokerConfigs(next);
      
      // Stop previous connection and restart
      if (clientsRef.current[updated.name]) {
        clientsRef.current[updated.name]?.end(true);
      }
      setTimeout(() => connectBroker(next[index]), 300);
      return next;
    });
  }, [connectBroker]);

  const testBrokerConnection = useCallback(async (broker: BrokerConfig): Promise<boolean> => {
    appendLog('info', 'Tester', `Testing connection to ${broker.websocketUrl}...`);
    return new Promise((resolve) => {
      const tempClient = mqtt.connect(broker.websocketUrl, {
        clientId: `web_test_${Math.random().toString(36).substring(2, 5)}`,
        username: broker.username || undefined,
        password: broker.password || undefined,
        connectTimeout: 3000,
        reconnectPeriod: 0, // do not reconnect during test
      });

      tempClient.on('connect', () => {
        appendLog('success', 'Tester', `Test Success: Connection to ${broker.name} established!`);
        tempClient.end(true);
        resolve(true);
      });

      tempClient.on('error', (err) => {
        appendLog('error', 'Tester', `Test Failed for ${broker.name}: ${err.message}`);
        tempClient.end(true);
        resolve(false);
      });

      setTimeout(() => {
        tempClient.end(true);
        resolve(false);
      }, 3500);
    });
  }, [appendLog]);

  const resetAllBrokers = useCallback(() => {
    localStorage.removeItem('mqtt_broker_configs');
    const fresh = loadBrokerConfigs();
    setBrokers(fresh);
    
    // Reset all connections
    Object.keys(clientsRef.current).forEach((key) => {
      const c = clientsRef.current[key];
      if (c) {
        try {
          c.end(true);
        } catch (e) {
          console.error(e);
        }
      }
    });

    fresh.forEach((b) => {
      connectBroker(b);
    });
    appendLog('warn', 'System', 'Broker configurations reset to initial defaults.');
  }, [connectBroker, appendLog]);

  return (
    <MqttContext.Provider value={{
      brokers,
      relayState,
      temperature,
      humidity,
      logs,
      tempHistory,
      humidityHistory,
      publishToAll,
      setRelay,
      triggerVariasi,
      clearHistory,
      updateBrokerConfig,
      testBrokerConnection,
      resetAllBrokers,
      simulateIncomingSensor
    }}>
      {children}
    </MqttContext.Provider>
  );
};

export const useMqtt = () => {
  const context = useContext(MqttContext);
  if (!context) {
    throw new Error('useMqtt must be used within an MqttProvider');
  }
  return context;
};
