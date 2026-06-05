# ESP32 Multi-Broker IoT Controller (Cedalo, Flespi, Shiftr.io)

Repositori ini berisi program firmware Arduino IDE untuk mikrokontroler **ESP32** guna mengontrol 4 channel Out Relay dan memonitor parameter sensor suhu & kelembapan udara (DHT22/DHT11). Data disinkronisasikan secara *real-time* ke sistem web dashboard berbasis React menggunakan protokol **MQTT Secure (TLS Port 8883)** melintasi 3 broker MQTT sekaligus.

---

## 📌 Topologi Topik MQTT

Firmware ini menggunakan *base topic* terpadu:  
`gzza-core/iot/esp32-gzza-core-01`

Berikut daftar lengkap topik yang didukung untuk kontrol & monitoring:

| Arah Aliran | Nama Topik MQTT | Format Payload | Deskripsi Fungsi |
| :--- | :--- | :--- | :--- |
| **Send (ESP32)** | `.../sensor` | JSON | Berisi data real-time `temperature` dan `humidity`. |
| **Send (ESP32)** | `.../relay/status` | JSON | Laporan status relay aktual (`relay1` s.d `relay4`) saat berubah. |
| **Send (ESP32)** | `.../device/status` | JSON | Status vitalitas ESP32 (`{"status": "online"\/"offline"}`). LWT diatur disini. |
| **Send (ESP32)** | `.../mode/status` | JSON | Kabar eksekusi mode variasi lampu (`running` / `finished`). |
| **Receive (Web)** | `.../relay/+/set` | String (`ON` / `OFF`) | Command dari Web untuk mengontrol individual Relay 1-4, atau `all` untuk semua relay. |
| **Receive (Web)** | `.../mode/set` | String (`LEFT_TO_RIGHT` / `STROBE`) | Pemicu pola/variasi gerakan relay otomatis. |

---

## 🛠️ Persiapan & Instalasi Library Arduino Ideal

Untuk melakukan kompilasi program pada Arduino IDE, harap mengunduh library-library berikut melalui panel **Library Manager** (`Ctrl+Shift+I`):

1. **PubSubClient** (oleh Nick O'Leary) - Untuk emulasi tumpukan protokol MQTT.
2. **ArduinoJson** (oleh Benoit Blanchon) - Guna melakukan serialisasi dan deserialisasi format payload berbasis JSON terstruktur.
3. **DHT sensor library** (oleh Adafruit) - Membaca sensor fisik DHT11, DHT21 atau DHT22.
4. **Adafruit Unified Sensor** (oleh Adafruit) - Dependensi dasar pendukung DHT library.

---

## 🔌 Skema Koneksi Pinout ESP32

Pastikan sambungan kabel jumper fisik pinout ESP32 Anda telah disesuaikan sebagai berikut:

- **Sensor DHT22 / DHT11** -> Input Data Pin dihubungkan ke **GPIO 4**.
- **Module Relay 4-Channel (Active Low)**:
  - **Relay 1** -> **GPIO 16**
  - **Relay 2** -> **GPIO 17**
  - **Relay 3** -> **GPIO 18**
  - **Relay 4** -> **GPIO 19**

---

## 💬 Pertanyaan Umum (FAQ) & Penjelasan Kredensial

### 🔑 1. Pada Cedalo, apakah menggunakan 1 user yang sama antara Web Dashboard dan ESP32?

**Jawaban:**  
**Ya, Anda dapat menggunakan pasangan Username & Password akun Cedalo yang sama** untuk Web Dashboard dan modul ESP32. 

**NAMUN, yang paling krusial adalah CLIENT ID harus dibedakan!**
- Di dalam protokol MQTT, jika ada dua buah device/koneksi aktif yang menggunakan **Client ID yang persis sama**, maka broker akan memutus koneksi pertama demi perangkat kedua, lalu perangkat pertama mencoba reconnect sehingga terjadi loop saling tendang (*connection fight loop*).
- Oleh sebab itu, firmware ESP32 ini dirancang secara dinamis menggunakan **ID unik chip mikrokontroler**:
  ```cpp
  "gzza_esp32_cedalo_" + chipId
  ```
- Sementara Web Dashboard Anda secara otomatis menggunakan:
  ```typescript
  `web_cedalo_${randomId}`
  ```
- Dengan pemisahan Client ID otomatis ini, ESP32 dan Web Dashboard Anda dapat bersanding online bersamaan tanpa saling memutuskan koneksi meskipun menggunakan satu akun/user Cedalo yang sama.

### 2. Bagaimana cara memasukkan kredensial broker?
Ganti baris-baris bertuliskan `ISI_...` pada baris kode firmware berikut:
- **SSID & Password Wifi:**
  ```cpp
  const char* WIFI_SSID = "GantiDenganNamaWifiAnda";
  const char* WIFI_PASS = "GantiDenganPasswordWifiAnda";
  ```
- **Cedalo:** Isikan Client Username & Password hasil konfigurasi Client Management di broker Cedalo Cloud Anda.
- **Flespi:** Cari Token akun Flespi Anda di Client Dashboard Flespi, masukkan token tersebut ke `BROKER2_USER` dan kosongkan password (`""`).
- **Shiftr.io:** Isikan Token Username & Password dari Shiftr Instance Space Anda.

---

## 🧠 Algoritma Pola Variasi Otomatis (Mode Lampu)

Web Dashboard memiliki 2 buah tombol Variasi Lampu:
1. **VARIASI 1 (`LEFT_TO_RIGHT`):**
   Relay 1 hingga Relay 4 akan menyala secara bergiliran mirip pola *running-led* (bergeser dari kiri ke kanan) sebanyak 3 kali perulangan dengan interval pergantian 400 milidetik.
2. **VARIASI 2 (`STROBE`):**
   Seluruh relai akan menyala berbarengan secara serentak (flash/strobe) lalu padam kembali sebanyak 8 kali berulang-ulang dengan kecepatan interval kedip 300 milidetik.

---

### 🛡️ Catatan Keamanan Koneksi TLS
Program firmware ini menggunakan komponen `WiFiClientSecure` dengan pemanggilan fungsi `.setInsecure()` yang memungkinkan komunikasi terenkripsi SSL/TLS terjadi tanpa membutuhkan verifikasi berkas Root CA Certificate secara manual. Hal ini bertujuan demi kemudahan operasional dan pengujian mandiri di mana sertifikat SSL broker pihak ketiga dapat berganti sewaktu-waktu.
