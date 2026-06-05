#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ==========================================
// KONSOL CONFIG WIFI & DHT SENSOR
// ==========================================
const char* WIFI_SSID = "ISI_NAMA_WIFI";
const char* WIFI_PASS = "ISI_PASSWORD_WIFI";

#define DHTPIN 4
#define DHTTYPE DHT22   // Ganti DHT11 jika menggunakan modul sensor DHT11
DHT dht(DHTPIN, DHTTYPE);

// ==========================================
// OUT CHANNEL RELAY (GPIO PINOUT ESP32)
// Relay module biasanya ACTIVE LOW:
// - ON  = signal LOW
// - OFF = signal HIGH
// ==========================================
#define RELAY_ACTIVE_LOW true

const int relayPins[4] = {16, 17, 18, 19};
bool relayState[4] = {false, false, false, false};

// ==========================================
// CONFIGURASI TOPIC MQTT (SINKRON DENGAN WEB)
// ==========================================
const char* DEVICE_ID = "esp32-gzza-core-01";
const char* BASE_TOPIC = "gzza-core/iot/esp32-gzza-core-01";

String topicSensor       = String(BASE_TOPIC) + "/sensor";
String topicRelayStatus  = String(BASE_TOPIC) + "/relay/status";
String topicDeviceStatus = String(BASE_TOPIC) + "/device/status";
String topicModeStatus   = String(BASE_TOPIC) + "/mode/status";

String topicRelaySet     = String(BASE_TOPIC) + "/relay/+/set";
String topicModeSet      = String(BASE_TOPIC) + "/mode/set";

// ==========================================
// RETRIEVAL BROKER 1: CEDALO PRO MOSQUITTO
// ==========================================
const char* BROKER1_HOST = "pf-khkqcj4oqntlaiv975yr.cedalo.cloud";
const int   BROKER1_PORT = 8883;
const char* BROKER1_USER = "ISI_USERNAME_CEDALO_CLIENT";
const char* BROKER1_PASS = "ISI_PASSWORD_CEDALO_CLIENT";

// ==========================================
// RETRIEVAL BROKER 2: FLESPI
// Token Flespi dimasukkan sebagai username.
// Password dikosongkan.
// ==========================================
const char* BROKER2_HOST = "mqtt.flespi.io";
const int   BROKER2_PORT = 8883;
const char* BROKER2_USER = "ISI_TOKEN_FLESPI";
const char* BROKER2_PASS = "";

// ==========================================
// RETRIEVAL BROKER 3: SHIFTR.IO
// ==========================================
const char* BROKER3_HOST = "glazegull811.cloud.shiftr.io";
const int   BROKER3_PORT = 8883;
const char* BROKER3_USER = "ISI_USERNAME_SHIFTR";
const char* BROKER3_PASS = "ISI_PASSWORD_SHIFTR";

// ==========================================
// MQTT CLIENT SECURE (TLS SUITE)
// ==========================================
WiFiClientSecure secureClient1;
WiFiClientSecure secureClient2;
WiFiClientSecure secureClient3;

PubSubClient mqtt1(secureClient1);
PubSubClient mqtt2(secureClient2);
PubSubClient mqtt3(secureClient3);

unsigned long lastSensorPublish = 0;
unsigned long lastReconnectTry = 0;

const unsigned long SENSOR_INTERVAL = 5000;
const unsigned long RECONNECT_INTERVAL = 5000;

// ==========================================
// GENERAL TOOLS / HELPERS
// ==========================================
String getChipId() {
  uint64_t chipid = ESP.getEfuseMac();
  return String((uint32_t)(chipid & 0xFFFFFFFF), HEX);
}

void mqttLoopOnly() {
  mqtt1.loop();
  mqtt2.loop();
  mqtt3.loop();
}

void setRelay(int index, bool state) {
  if (index < 0 || index > 3) return;

  relayState[index] = state;

  if (RELAY_ACTIVE_LOW) {
    digitalWrite(relayPins[index], state ? LOW : HIGH);
  } else {
    digitalWrite(relayPins[index], state ? HIGH : LOW);
  }
}

void setAllRelays(bool state) {
  for (int i = 0; i < 4; i++) {
    setRelay(i, state);
  }
}

void publishToAll(String topic, String payload, bool retained = false) {
  if (mqtt1.connected()) mqtt1.publish(topic.c_str(), payload.c_str(), retained);
  if (mqtt2.connected()) mqtt2.publish(topic.c_str(), payload.c_str(), retained);
  if (mqtt3.connected()) mqtt3.publish(topic.c_str(), payload.c_str(), retained);
}

void publishRelayStatus() {
  StaticJsonDocument<256> doc;

  doc["device_id"] = DEVICE_ID;
  doc["relay1"] = relayState[0];
  doc["relay2"] = relayState[1];
  doc["relay3"] = relayState[2];
  doc["relay4"] = relayState[3];
  doc["relay_logic"] = "ACTIVE_LOW";

  String payload;
  serializeJson(doc, payload);

  publishToAll(topicRelayStatus, payload, true);
}

void publishDeviceStatus(const char* status) {
  StaticJsonDocument<128> doc;

  doc["device_id"] = DEVICE_ID;
  doc["status"] = status;
  doc["wifi_rssi"] = WiFi.RSSI();

  String payload;
  serializeJson(doc, payload);

  publishToAll(topicDeviceStatus, payload, true);
}

void publishSensorData() {
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Gagal membaca sensor dari pin DHT!");
    return;
  }

  StaticJsonDocument<256> doc;

  doc["device_id"] = DEVICE_ID;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["unit_temperature"] = "C";
  doc["unit_humidity"] = "%";

  String payload;
  serializeJson(doc, payload);

  publishToAll(topicSensor, payload, false);

  Serial.println("Publish data sensor ke brokers:");
  Serial.println(payload);
}

// ==========================================
// LOGIKA VARIASI MODE RELAY
// ==========================================
void runLeftToRightMode() {
  Serial.println("Mode VARIASI 1 (LEFT_TO_RIGHT) aktif");

  publishToAll(topicModeStatus, "{\"mode\":\"LEFT_TO_RIGHT\",\"status\":\"running\"}", false);

  for (int repeat = 0; repeat < 3; repeat++) {
    for (int i = 0; i < 4; i++) {
      setAllRelays(false);
      setRelay(i, true);
      publishRelayStatus();

      unsigned long startDelay = millis();
      while (millis() - startDelay < 400) {
        mqttLoopOnly();
        delay(10);
      }
    }
  }

  setAllRelays(false);
  publishRelayStatus();
  publishToAll(topicModeStatus, "{\"mode\":\"LEFT_TO_RIGHT\",\"status\":\"finished\"}", false);
}

void runStrobeMode() {
  Serial.println("Mode VARIASI 2 (STROBE) aktif");

  publishToAll(topicModeStatus, "{\"mode\":\"STROBE\",\"status\":\"running\"}", false);

  for (int i = 0; i < 8; i++) {
    setAllRelays(true);
    publishRelayStatus();

    unsigned long startOn = millis();
    while (millis() - startOn < 300) {
      mqttLoopOnly();
      delay(10);
    }

    setAllRelays(false);
    publishRelayStatus();

    unsigned long startOff = millis();
    while (millis() - startOff < 300) {
      mqttLoopOnly();
      delay(10);
    }
  }

  publishToAll(topicModeStatus, "{\"mode\":\"STROBE\",\"status\":\"finished\"}", false);
}

// ==========================================
// MQTT MESSAGE INCOMING INTERCEPTOR
// ==========================================
void handleMqttMessage(String brokerName, char* topic, byte* payload, unsigned int length) {
  String topicStr = String(topic);
  String message = "";

  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  message.trim();

  Serial.println("==========================================");
  Serial.println("Incoming Broker : " + brokerName);
  Serial.println("Topic           : " + topicStr);
  Serial.println("Payload         : " + message);
  Serial.println("==========================================");

  // Parse Mode Command
  if (topicStr.endsWith("/mode/set")) {
    String mode = message;

    StaticJsonDocument<128> doc;
    DeserializationError error = deserializeJson(doc, message);

    if (!error && doc["mode"]) {
      mode = doc["mode"].as<String>();
    }

    mode.toUpperCase();

    if (mode == "STROBE") {
      runStrobeMode();
    } else if (mode == "LEFT_TO_RIGHT" || mode == "LEFT_RIGHT") {
      runLeftToRightMode();
    }

    return;
  }

  // Parse Relay Commands (All, 1, 2, 3, or 4)
  if (topicStr.indexOf("/relay/") >= 0 && topicStr.endsWith("/set")) {
    String stateCommand = message;
    String target = "";

    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, message);

    if (!error) {
      if (doc["state"]) {
        stateCommand = doc["state"].as<String>();
      }
      if (doc["target"]) {
        target = doc["target"].as<String>();
      }
    }

    stateCommand.toUpperCase();
    bool targetState = false;

    if (stateCommand == "ON") {
      targetState = true;
    } else if (stateCommand == "OFF") {
      targetState = false;
    } else {
      Serial.println("Perintah relay ditolak: State tidak valid!");
      return;
    }

    if (topicStr.indexOf("/relay/all/set") >= 0 || target == "all") {
      setAllRelays(targetState);
    } else if (topicStr.indexOf("/relay/1/set") >= 0 || target == "relay1") {
      setRelay(0, targetState);
    } else if (topicStr.indexOf("/relay/2/set") >= 0 || target == "relay2") {
      setRelay(1, targetState);
    } else if (topicStr.indexOf("/relay/3/set") >= 0 || target == "relay3") {
      setRelay(2, targetState);
    } else if (topicStr.indexOf("/relay/4/set") >= 0 || target == "relay4") {
      setRelay(3, targetState);
    }

    publishRelayStatus();
  }
}

void callbackBroker1(char* topic, byte* payload, unsigned int length) {
  handleMqttMessage("Cedalo", topic, payload, length);
}

void callbackBroker2(char* topic, byte* payload, unsigned int length) {
  handleMqttMessage("Flespi", topic, payload, length);
}

void callbackBroker3(char* topic, byte* payload, unsigned int length) {
  handleMqttMessage("Shiftr", topic, payload, length);
}

// ==========================================
// MQTT SUBSCRIPTIONS
// ==========================================
void subscribeTopics(PubSubClient& client) {
  client.subscribe(topicRelaySet.c_str());
  client.subscribe(topicModeSet.c_str());
}

bool connectBroker(
  PubSubClient& client,
  const char* brokerLabel,
  const char* username,
  const char* password,
  String clientId
) {
  if (client.connected()) {
    return true;
  }

  Serial.print("Menghubungkan ke broker -> ");
  Serial.println(brokerLabel);

  bool connected;

  if (strlen(username) > 0) {
    connected = client.connect(
      clientId.c_str(),
      username,
      password,
      topicDeviceStatus.c_str(),
      1,
      true,
      "{\"status\":\"offline\"}"
    );
  } else {
    connected = client.connect(
      clientId.c_str(),
      topicDeviceStatus.c_str(),
      1,
      true,
      "{\"status\":\"offline\"}"
    );
  }

  if (connected) {
    Serial.print("Koneksi sukses ke ");
    Serial.println(brokerLabel);

    subscribeTopics(client);
    publishDeviceStatus("online");
    publishRelayStatus();

    return true;
  } else {
    Serial.print("Gagal terhubung ke ");
    Serial.print(brokerLabel);
    Serial.print(", RCState = ");
    Serial.println(client.state());

    return false;
  }
}

void reconnectAllMqtt() {
  if (millis() - lastReconnectTry < RECONNECT_INTERVAL) {
    return;
  }

  lastReconnectTry = millis();

  String chipId = getChipId();

  // 1. Cedalo
  connectBroker(
    mqtt1,
    "Cedalo",
    BROKER1_USER,
    BROKER1_PASS,
    "gzza_esp32_cedalo_" + chipId
  );

  // 2. Flespi
  connectBroker(
    mqtt2,
    "Flespi",
    BROKER2_USER,
    BROKER2_PASS,
    "gzza_esp32_flespi_" + chipId
  );

  // 3. Shiftr
  connectBroker(
    mqtt3,
    "Shiftr",
    BROKER3_USER,
    BROKER3_PASS,
    "gzza_esp32_shiftr_" + chipId
  );
}

// ==========================================
// ARDUINO SETUP
// ==========================================
void setup() {
  Serial.begin(115200);

  dht.begin();

  for (int i = 0; i < 4; i++) {
    pinMode(relayPins[i], OUTPUT);
    setRelay(i, false); // Default ALL OFF saat startup
  }

  WiFi.begin(WIFI_SSID, WIFI_PASS);

  Serial.print("Menyalakan WiFi & mengoneksikan");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi Terkoneksi Sukses!");
  Serial.print("IP Node ESP32: ");
  Serial.println(WiFi.localIP());

  // Untuk keperluan TLS Client, abaikan sertifikat CA
  // demi fleksibilitas pengujian mandiri:
  secureClient1.setInsecure();
  secureClient2.setInsecure();
  secureClient3.setInsecure();

  mqtt1.setServer(BROKER1_HOST, BROKER1_PORT);
  mqtt2.setServer(BROKER2_HOST, BROKER2_PORT);
  mqtt3.setServer(BROKER3_HOST, BROKER3_PORT);

  mqtt1.setCallback(callbackBroker1);
  mqtt2.setCallback(callbackBroker2);
  mqtt3.setCallback(callbackBroker3);

  // Mengalokasikan ukuran buffer MQTT yang cukup untuk payload JSON
  mqtt1.setBufferSize(512);
  mqtt2.setBufferSize(512);
  mqtt3.setBufferSize(512);

  reconnectAllMqtt();
}

// ==========================================
// ARDUINO LOOP ENGINE
// ==========================================
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Koneksi WiFi terputus! Menyambungkan kembali...");
    WiFi.reconnect();
    delay(1000);
    return;
  }

  reconnectAllMqtt();

  mqtt1.loop();
  mqtt2.loop();
  mqtt3.loop();

  if (millis() - lastSensorPublish >= SENSOR_INTERVAL) {
    lastSensorPublish = millis();
    publishSensorData();
    publishRelayStatus();
  }
}
