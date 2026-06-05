import { BrokerConfig } from '../types';

const generateRandomId = () => Math.random().toString(36).substring(2, 8);

export const DEFAULT_BROKERS: BrokerConfig[] = [
  {
    name: 'Flespi',
    type: 'MQTT Broker 1',
    websocketUrl: 'wss://mqtt.flespi.io',
    port: '443',
    username: '',
    password: '',
    clientId: `web_flespi_${generateRandomId()}`,
    baseTopic: 'gzza-core/iot/esp32-gzza-core-01',
    connected: false
  },
  {
    name: 'Cedalo MQTT',
    type: 'MQTT Broker 2',
    websocketUrl: 'wss://pf-khkqcj4oqntlaiv975yr.cedalo.cloud',
    port: '443',
    username: '',
    password: '',
    clientId: `web_cedalo_${generateRandomId()}`,
    baseTopic: 'gzza-core/iot/esp32-gzza-core-01',
    connected: false
  },
  {
    name: 'Shiftr',
    type: 'MQTT Broker 3',
    websocketUrl: 'wss://glazegull811.cloud.shiftr.io',
    port: '443',
    username: '',
    password: '',
    clientId: `web_shiftr_${generateRandomId()}`,
    baseTopic: 'gzza-core/iot/esp32-gzza-core-01',
    connected: false
  }
];

export const loadBrokerConfigs = (): BrokerConfig[] => {
  const stored = localStorage.getItem('mqtt_broker_configs');
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as BrokerConfig[];
      // Make sure all 3 exist
      if (parsed.length === 3) {
        return parsed.map(b => ({ ...b, connected: false }));
      }
    } catch (e) {
      console.error('Error loading stored brokers:', e);
    }
  }
  return DEFAULT_BROKERS;
};

export const saveBrokerConfigs = (configs: BrokerConfig[]) => {
  localStorage.setItem('mqtt_broker_configs', JSON.stringify(configs));
};

export const resetBrokerConfigs = (): BrokerConfig[] => {
  localStorage.removeItem('mqtt_broker_configs');
  return DEFAULT_BROKERS;
};
