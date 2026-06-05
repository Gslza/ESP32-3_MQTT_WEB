# 🌐 Integrated Multi-Broker IoT System & 3D Interactive Dashboard

[![React](https://img.shields.io/badge/React-18.x-blue.svg?style=flat-flat&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF.svg?style=flat&logo=vite)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r150-black.svg?style=flat&logo=three.js)](https://threejs.org/)
[![MQTT](https://img.shields.io/badge/MQTT-v3.1.1-orange.svg?style=flat&logo=mqtt)](https://mqtt.org/)
[![ESP32](https://img.shields.io/badge/ESP32-Espressif-red.svg?style=flat&logo=espressif)](https://www.espressif.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-yellow.svg?style=flat&logo=firebase)](https://firebase.google.com/)

Sistem monitoring dan kendali IoT (*Internet of Things*) terpadu generasi baru yang mengombinasikan kekuatan **React**, **Three.js (Visualisasi 3D)**, dan **Web Speech API (Voice Command)** di sisi Frontend, tersambung lurus secara paralel dengan mikrokontroler **ESP32** menggunakan tumpukan protokol **MQTT Secure melintasi 3 broker eksternal (Flespi, Cedalo, Shiftr)** secara redundan dan tersinkronisasi.

---

## 🏗️ Arsitektur Sistem Terpadu

```
    ┌────────────────┐         (Voice & Telemetri)         ┌─────────────────────────┐
    │  Web Dashboard │ <─────────────────────────────────> │  Multi-Broker MQTT      │
    │  (React + 3D)  │        MQTT over WebSockets         │  (Flespi, Cedalo,       │
    └────────────────┘                                     │   Shiftr, dll)          │
            ▲                                              └─────────────────────────┘
            │ Auth                                                      ▲
    ┌───────▼────────┐                                                  │ MQTT Secure
    │    Firebase    │                                                  │ (Port 8883)
    │ Authentication │                                                  ▼
    └────────────────┘                                     ┌─────────────────────────┐
                                                           │      ESP32 Controller   │
                                                           │   (DHT22 / 4x Relay Out)│
                                                           └─────────────────────────┘
```

---

## ✨ Fitur-Fitur Utama Dashboard & Firmware

*   **🎙️ Voice Controller Spectrum 3D (Web Speech/Three.js):**
    Mengontrol on/off relay dan memicu variasi gerakan lampu melalui asisten suara pintar berbahasa Indonesia dengan gelombang spektrum audio 3D dinamis yang hidup di browser.
*   **🌡️ Visualisasi Sensor Emoticon 3D Real-time:**
    Keadaan suhu dan kelembapan dikonversi menjadi ekspresi emoticon 3D interaktif yang berputar dan memancarkan sistem partikel cuaca (salju, rintik hujan, emisi panas, kerut kekeringan) sesuai dengan status sensor DHT aktual.
*   **🔄 Multi-Broker MQTT Redundant & Sync:**
    Sistem web dan ESP32 terhubung ke 3 broker MQTT premium sekaligus secara *real-time*:
    1.  **Cedalo Pro Mosquitto**
    2.  **Flespi MQTT**
    3.  **Shiftr.io Space**
*   **⚡ Kontrol Aktuator Penuh:**
    Kontrol manual per-relay, fitur *ALL ON*, *ALL OFF*, serta pemicu mode pola variasi kelistrikan otomatis (*STROBE* dan *LEFT_TO_RIGHT*) langsung dari dashboard web.
*   **📊 Pencatatan Riwayat Data Historis & Log Aktivitas:**
    Dilengkapi tabel arsip log telemetri sensor suhu, kelembapan, serta log sistem operasional web yang mendetail demi kemudahan *debug* sistem integrasi hardware.
*   **🔒 Ekosistem Keamanan Terintegrasi:**
    Menggunakan **Firebase Authentication** untuk mengunci konsol web dashboard dari akses eksternal tak berizin.

---

## 📂 Struktur Direktori Repositori

```
├── .env.example             # Template konfigurasi variabel lingkungan web
├── index.html               # Entrypoint HTML utama
├── package.json             # Dependensi NodeJs, bundler, dsb.
├── tsconfig.json            # Konfigurasi compiler TypeScript
├── vite.config.ts           # Konfigurasi bundler Vite
├── src/                     # Source code aplikasi web (React)
│   ├── App.tsx              # Component container utama & Sidebar Router
│   ├── types.ts             # Definisi blueprint tipe dan enum TypeScript
│   ├── index.css            # Entry global stylesheet Tailwind CSS v4
│   ├── components/          # Kumpulan modular UI React
│   │   ├── UnifiedDashboard.tsx  # Dashboard Utama (Fokus monitoring & kontrol)
│   │   ├── ThreeDView.tsx        # Sistem Render Engine 3D (Three.js/Fiber)
│   │   ├── MqttConfigTab.tsx     # Pengaturan credential Multi-Broker MQTT
│   │   ├── LoginScreen.tsx       # Sistem security login authenticator
│   │   └── HistoryTablesTabs.tsx # Antarmuka pelaporan historis log
│   ├── context/
│   │   └── MqttContext.tsx  # Jembatan state logik web dengan client MQTT.js
│   └── lib/
│       ├── firebase.ts      # Inisialisasi Firebase Admin & Auth Service
│       └── mqttStore.ts     # Inisialisasi default parameter 3 target Broker
└── esp32-code/              # Kumpulan modul firmware Mikrokontroler (Arduino)
    ├── ESP32-Code.ino       # Source file program C/C++ ESP32 IoT
    └── README.md            # Dokumentasi panduan kompilasi hardware lengkap
```

---

## 🚀 Panduan Memulai Cepat (Quick Start)

### Bagian 1: Konfigurasi & Run Web Dashboard di Lokal

1.  **Clone repositori ini ke komputer Anda:**
    ```bash
    git clone https://github.com/USERNAME_ANDA/REPOSITORI_ANDA.git
    cd REPOSITORI_ANDA
    ```

2.  **Instalasi seluruh dependensi NodeJs pendukung:**
    ```bash
    npm install
    ```

3.  **Siapkan berkas Environment Variables:**
    Salin berkas `.env.example` menjadi `.env` lalu masukkan kredensial Firebase Auth milik Anda:
    ```bash
    cp .env.example .env
    ```
    Isi nilai variable berikut di dalam `.env`:
    ```env
    VITE_FIREBASE_API_KEY=your_api_key_here
    VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
    VITE_FIREBASE_PROJECT_ID=your_project_id_here
    VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
    VITE_FIREBASE_APP_ID=your_app_id_here
    ```

4.  **Jalankan server pengembang lokal (Development Server):**
    ```bash
    npm run dev
    ```
    Buka peramban browser Anda di alamat `http://localhost:3000`.

5.  **Build untuk Produksi:**
    ```bash
    npm run build
    ```

---

### Bagian 2: Memasang Firmware Kodingan pada Modul ESP32

Kumpulan dokumentasi lengkap mengenai pinout, library serta cara kompilasi Arduino IDE dari program ESP32 telah dirangkum secara khusus di dalam folder [esp32-code/README.md](./esp32-code/README.md).

Berikut intisari langkah cepatnya:
1.  Buka aplikasi **Arduino IDE**.
2.  Buka berkas file `esp32-code/ESP32-Code.ino`.
3.  Ubah baris `SDA_SSID`, `SDA_PASS` WiFi, serta ubah kredensial token/username/password akun Cedalo, Flespi, dan Shiftr.io Anda pada baris konfigurasi broker.
4.  Hubungkan papan ESP32 ke komputer, centang tipe board (ESP32 Dev Module), lalu tekan ikon **Upload (Panah Kanan)**.

---

## 🛰️ Integrasi Multi-Broker MQTT & Solusi Connection Fight

### Penjelasan Mengenai Akun Cedalo (ESP32 vs Web Client)
Banyak developer pemula mengalami kegagalan di mana ESP32 dan Web Dashboard saling menendang satu sama lain (*connection loop disconnect*) ketika menggunakan satu akun kredensial broker Cedalo yang sama. 

Sistem ini memecahkan problem tersebut secara menyeluruh dengan memisahkan pengenalan **Client ID** unik pada sisi internal koneksi meskipun menggunakan satu identitas akun user Cedalo yang sama:

*   **Sisi Web Client:** Secara otomatis mengaktifkan Client ID acak:  
    `web_cedalo_[Karakter_Acak]`
*   **Sisi ESP32 Client:** Secara cerdas mengambil ID bawaan chip batiniah (Hardware MAC Address):  
    `gzza_esp32_cedalo_[Chip_MAC_ID]`

Dengan ini, Anda dapat memonitor telemetri dan menerbitkan perintah kontrol secara stabil secara paralel di waktu yang bersamaan dari segala arah!

---

## 🛡️ Lisensi & Kontribusi

Proyek ini dibangun untuk tujuan pembelajaran, kendali industri mandiri, dan integrasi digital IoT yang lebih luas. 
Jika Anda ingin berkontribusi, silakan ajukan *Pull Request* atau buat *New Issue* pada halaman GitHub Repositori ini.

**Created with 💙 by [Gusliyanza](https://github.com/gusliyanza02)**
