export interface BrokerConfig {
  name: string;
  type: string;
  websocketUrl: string;
  port: string;
  username: string;
  password?: string;
  clientId: string;
  baseTopic: string;
  connected: boolean;
}

export interface MqttLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warn' | 'error' | 'publish' | 'subscribe' | 'voice' | 'relay';
  broker: string;
  message: string;
}

export interface SensorData {
  temperature: number;
  humidity: number;
  timestamp: string;
}

export interface SensorLog {
  id: string;
  timestamp: string;
  broker: string;
  value: number;
}

export interface RelayState {
  '1': 'ON' | 'OFF';
  '2': 'ON' | 'OFF';
  '3': 'ON' | 'OFF';
  '4': 'ON' | 'OFF';
}

export type ActiveTab = 
  | 'dashboard'
  | 'voice' 
  | 'suhu' 
  | 'kelembapan' 
  | 'mqtt-config' 
  | 'data-suhu' 
  | 'data-kelembapan' 
  | 'log-mqtt' 
  | 'kontrol-relay';
