# KC868-A6 Mijia 8 Sensors — MQTT Dashboard

ระบบ IoT ครบวงจรสำหรับรวบรวมข้อมูลอุณหภูมิ, ความชื้น, แบตเตอรี่, และ RSSI จาก **Xiaomi Mijia Sensor จำนวน 8 ตัว** ผ่าน Bluetooth Low Energy (BLE) โดยใช้ **KinCony KC868-A6** เป็น BLE Gateway และส่งข้อมูลผ่าน Wi-Fi → MQTT Broker → **Web Dashboard** (Real-time WebSocket) และ **Home Assistant**

```
┌─────────────────┐       BLE 2.4GHz       ┌─────────────────┐       Wi-Fi       ┌─────────────────┐
│ Mijia Sensors   │ ─────────────────────> │ KinCony KC868-A6│ ────────────────> │   MQTT Broker   │
│ (8 ตัว x 4 ค่า) │                        │ (ESP-WROOM-32)  │                   │ (Mosquitto/EMQX)│
└─────────────────┘                        └─────────────────┘                   └────────┬────────┘
                                                                                          │
                                           ┌──────────────────────────────────────────────┴──────────┐
                                           ▼                                                         ▼
                                 ┌───────────────────┐                                     ┌───────────────────┐
                                 │   Web Dashboard   │                                     │  Home Assistant   │
                                 │ (WebSocket: 9001) │                                     │  (MQTT Discovery) │
                                 └───────────────────┘                                     └───────────────────┘
```

---

## 🌟 จุดเด่นของระบบ (Key Features)

- ✅ **BLE Multi-Sensor Scanning**: สแกนและถอดรหัส Xiaomi Mijia BLE sensors ได้ 8 ตัวพร้อมกันแบบ Continuous Scanning (1100ms)
- ✅ **Real-time Web Dashboard**: แดชบอร์ดสำเร็จรูปพร้อมกราฟประวัติ 24 ชม., Sparklines, Glassmorphism Dark Theme
- ✅ **Dual-Mode Dashboard**: รองรับทั้งโหมดจำลอง (**Simulation Mode**) และโหมดรับข้อมูลสดจาก MQTT (**Live Mode**)
- ✅ **Universal MQTT Ingestion**: รองรับทั้ง ESPHome Discrete Topics (`.../sensor/mijia_XX_temp/state`) และ JSON Payload (`.../mijia/XX/state`)
- ✅ **Gateway & Sensor Watchdogs**: ตรวจจับสถานะ Online/Offline ของบอร์ด KC868-A6 และ Sensor แต่ละตัวอัตโนมัติ (Timeout 3 นาที)
- ✅ **Data Exporting**: ส่งออกข้อมูลประวัติและค่าปัจจุบันเป็นไฟล์ **CSV** เพื่อใช้ทำรายงานผลการทดลอง
- ✅ **Home Assistant Auto-Discovery**: สร้าง Sensor Entities ใน Home Assistant อัตโนมัติกว่า 32+ entities ผ่าน MQTT Discovery
- ✅ **Mock Testing Tool**: สคริปต์ Python จำลองการส่งข้อมูล MQTT สำหรับทดสอบระบบโดยไม่ต้องมีฮาร์ดแวร์จริง

---

## 📁 โครงสร้างโปรเจค (Project Structure)

```
DashBoardMajin8/
├── esphome/
│   ├── kc868_a6_mijia.yaml          ← ไฟล์หลัก ESPHome (ใช้งานจริง)
│   ├── kc868_a6_ble_scan.yaml       ← Phase 1 BLE Scanner (ค้นหา MAC)
│   ├── secrets.yaml                  ← ข้อมูลลับ Wi-Fi, MQTT, Encryption Key
│   └── packages/
│       ├── ble.yaml                  ← BLE Tracker (Singleton Component)
│       ├── mqtt.yaml                 ← MQTT Client + Birth/Will + Discovery
│       └── sensors.yaml              ← นิยามเซนเซอร์ Mijia 8 ตัว + RSSI 8 ตัว
├── dashboard/
│   ├── index.html                    ← Web Dashboard หน้าหลัก
│   ├── style.css                     ← สไตล์ Dark Theme + Glassmorphism
│   └── app.js                        ← ระบบรับ-ส่ง MQTT WebSocket และวาดกราฟ
├── tools/
│   ├── mosquitto_sample.conf         ← คอนฟิก Mosquitto พร้อมเปิด WebSocket (Port 9001)
│   └── mock_mqtt_publisher.py        ← สคริปต์จำลองการส่งข้อมูล MQTT เพื่อทดสอบ
├── documentation/
│   ├── web-dashboard-manual.md       ← คู่มือการใช้งาน Web Dashboard ฉบับสมบูรณ์
│   ├── architecture.md               ← สถาปัตยกรรมระบบและ Data Flow
│   ├── mac-address-table.md          ← ตารางบันทึก MAC Address & Bindkey
│   └── test-results.md               ← แบบฟอร์มบันทึกผลการทดสอบทุก Phase
├── Plan/
│   └── KC868-A6_..._Revised.md       ← แผนการดำเนินงานฉบับปรับปรุง
├── .gitignore
└── README.md
```

---

## 🚀 คู่มือการเริ่มต้นใช้งาน (Quick Start Guide)

### 1. การเตรียมซอฟต์แวร์

1. **Python 3.x**
2. **VS Code** พร้อม Extension:
   - ESPHome
   - PlatformIO IDE
3. **MQTT Broker (Eclipse Mosquitto)**:
   - ดาวน์โหลดจาก https://mosquitto.org/download/
   - หรือใช้ Docker:
     ```bash
     docker run -d --name mosquitto -p 1883:1883 -p 9001:9001 -v $(pwd)/tools/mosquitto_sample.conf:/mosquitto/config/mosquitto.conf eclipse-mosquitto
     ```

---

### 2. การตั้งค่า Credentials (`secrets.yaml`)

แก้ไขไฟล์ `esphome/secrets.yaml`:

```yaml
wifi_ssid: "YOUR_WIFI_SSID"
wifi_password: "YOUR_WIFI_PASSWORD"
mqtt_broker: "192.168.1.100"        # IP ของเครื่องที่รัน Mosquitto
mqtt_username: ""                   # ใส่ถ้าเปิด authentication
mqtt_password: ""
encryption_key: "YOUR_BASE64_KEY"   # สร้างด้วย: python3 -c "import secrets, base64; print(base64.b64encode(secrets.token_bytes(32)).decode())"
ota_password: "YOUR_OTA_PASSWORD"
```

---

### 3. ขั้นตอนการทดสอบตาม Phase

#### 🔍 Phase 1: BLE Discovery (หา MAC Address ของเซนเซอร์ทั้ง 8 ตัว)
1. เชื่อมต่อบอร์ด KC868-A6 ผ่านสาย USB เข้ากับคอมพิวเตอร์
2. Flash ไฟล์ `esphome/kc868_a6_ble_scan.yaml`
3. เปิด ESPHome Logs แล้วเปิดสวิตช์ Mijia ทีละตัวเพื่อบันทึก MAC Address
4. บันทึกผลลงใน `documentation/mac-address-table.md`

#### ⚙️ Phase 2–5: ติดตั้ง Firmware หลัก (Main Gateway)
1. นำ MAC Address ทั้ง 8 ตัวไปใส่ใน `esphome/packages/sensors.yaml`
2. หากเป็นรุ่น LYWSD03MMC (จอเหลี่ยม) ให้ใส่ `bindkey` หรือแฟลช Custom Firmware ATC/PVVX
3. Flash ไฟล์ `esphome/kc868_a6_mijia.yaml` ลงบอร์ด KC868-A6
4. บอร์ดจะเชื่อมต่อ Wi-Fi และเริ่มส่งข้อมูลไปยัง MQTT Broker อัตโนมัติ

#### 🌐 Phase 6: เปิดใช้งาน Web Dashboard
1. เปิด Web Server ในโฟลเดอร์ `dashboard/`:
   ```bash
   python -m http.server 8080 --directory dashboard
   ```
2. เปิดเบราว์เซอร์ไปที่ **http://localhost:8080**
3. คลิกปุ่ม **⚙️ MQTT Disconnected** ที่มุมขวาบน
4. ใส่ Host / Port (ค่าเริ่มต้น `127.0.0.1:9001`) แล้วกด **🔗 Connect**
5. แดชบอร์ดจะสลับเข้าสู่ **LIVE MODE** และแสดงข้อมูลสดทันที!

---

## 🧪 การทดสอบจำลอง (Mock Testing Without Hardware)

คุณสามารถทดสอบ MQTT Broker และ Web Dashboard ได้ทันทีโดยไม่ต้องต่อฮาร์ดแวร์:

1. **รัน Mosquitto พร้อมเปิด WebSocket:**
   ```bash
   mosquitto -c tools/mosquitto_sample.conf -v
   ```
2. **รันสคริปต์จำลองการส่งข้อมูล:**
   ```bash
   pip install paho-mqtt
   python tools/mock_mqtt_publisher.py --host 127.0.0.1 --port 1883
   ```
3. **เปิด Web Dashboard** ที่ `http://localhost:8080` แล้วกด Connect จะเห็นข้อมูลของทั้ง 8 เซนเซอร์อัปเดตแบบเรียลไทม์!

---

## 📡 โครงสร้าง MQTT Topics (MQTT Topic Structure)

| Topic | Payload Example | รายละเอียด |
|:------|:----------------|:-----------|
| `home/kc868-a6/status` | `online` / `offline` | สถานะการทำงานของ Gateway KC868-A6 (LWT) |
| `home/kc868-a6/sensor/mijia_01_temperature/state` | `27.3` | อุณหภูมิ Mijia #01 (°C) |
| `home/kc868-a6/sensor/mijia_01_humidity/state` | `61.0` | ความชื้น Mijia #01 (%) |
| `home/kc868-a6/sensor/mijia_01_battery/state` | `94` | แบตเตอรี่ Mijia #01 (%) |
| `home/kc868-a6/sensor/mijia_01_rssi/state` | `-52` | สัญญาณ RSSI Mijia #01 (dBm) |
| `home/kc868-a6/mijia/01/state` | `{"temperature": 27.3, ...}` | Combined JSON payload (Optional) |

---

## ⚠️ ข้อควรระวังและการแก้ไขปัญหา (Troubleshooting)

1. **Wi-Fi และ Bluetooth กวนกัน (2.4GHz Coexistence):**
   - ชิป ESP-WROOM-32 บน KC868-A6 ใช้เสาสัญญาณ 2.4GHz เดียวกันสำหรับ Wi-Fi และ BLE
   - ใน `kc868_a6_mijia.yaml` มีการตั้งค่า `power_save_mode: NONE` เพื่อคงประสิทธิภาพสัญญาณสูงสุด
   - ควรวาง KC868-A6 ห่างจาก Router Wi-Fi หรือ Access Point อย่างน้อย 2–3 เมตร

2. **ปัญหา Bindkey บน Mijia LYWSD03MMC:**
   - เฟิร์มแวร์มาตรฐานของ Xiaomi เข้ารหัสข้อมูล advertisement จึงต้องใช้ bindkey 32 ตัวอักษร
   - **ทางเลือกที่สะดวกกว่า:** แฟลช Custom Firmware เช่น **PVVX / ATC** ผ่าน Web Bluetooth (https://pvvx.github.io/ATC_MiThermometer/TelinkMiFlasher.html) เพื่อเปลี่ยนเป็นโหมด BTHome / Custom Advertisement ที่ไม่ต้องใช้ Bindkey และประหยัดแบตเตอรี่มากกว่าเดิม

3. **เบราว์เซอร์ไม่สามารถเชื่อมต่อ WebSocket MQTT ได้:**
   - ตรวจสอบว่า Mosquitto ได้เปิด listener `protocol websockets` บนพอร์ต 9001 แล้วหรือไม่
   - หากเปิดผ่าน HTTPS ต้องใช้โปรโตคอล `wss://` ร่วมกับ Certificate ที่ถูกต้อง

---

## 📚 แหล่งข้อมูลอ้างอิง (References)

- [ESPHome Xiaomi BLE Components](https://esphome.io/components/sensor/xiaomi_ble/)
- [ESPHome ESP32 BLE Tracker](https://esphome.io/components/esp32_ble_tracker/)
- [KinCony KC868-A6 Hardware Design](https://www.kincony.com/kc868-a6-hardware-design-details.html)
- [Home Assistant MQTT Integration](https://www.home-assistant.io/integrations/mqtt/)
