# System Architecture — KC868-A6 Mijia 8 MQTT Dashboard

## 1. ภาพรวมระบบ

ระบบรับข้อมูลจาก Xiaomi Mijia Temperature/Humidity Sensor จำนวน 8 ตัว ผ่าน Bluetooth Low Energy (BLE) โดยใช้ KinCony KC868-A6 เป็น BLE Gateway จากนั้นส่งข้อมูลผ่าน Wi-Fi → MQTT → Home Assistant Dashboard

## 2. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    BLE Sensors Layer                         │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ Mijia#1 │ │ Mijia#2 │ │ Mijia#3 │ │ Mijia#4 │          │
│  │ Temp    │ │ Temp    │ │ Temp    │ │ Temp    │          │
│  │ Humid   │ │ Humid   │ │ Humid   │ │ Humid   │          │
│  │ Battery │ │ Battery │ │ Battery │ │ Battery │          │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘          │
│       │           │           │           │                 │
│  ┌────┴────┐ ┌────┴────┐ ┌────┴────┐ ┌────┴────┐          │
│  │ Mijia#5 │ │ Mijia#6 │ │ Mijia#7 │ │ Mijia#8 │          │
│  │ Temp    │ │ Temp    │ │ Temp    │ │ Temp    │          │
│  │ Humid   │ │ Humid   │ │ Humid   │ │ Humid   │          │
│  │ Battery │ │ Battery │ │ Battery │ │ Battery │          │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘          │
│       └──────┬─────┴──────┬────┴──────┬────┘               │
│              │  BLE 2.4GHz │           │                    │
└──────────────┼─────────────┼───────────┼────────────────────┘
               │             │           │
               ▼             ▼           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Gateway Layer                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              KC868-A6 (ESP-WROOM-32)                │   │
│  │                                                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │   │
│  │  │ BLE Tracker  │→│ Xiaomi BLE   │→│ MQTT     │  │   │
│  │  │ (Scanner)    │  │ Decoder      │  │ Client   │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────┘  │   │
│  │                                                     │   │
│  │  ESPHome Firmware (ESP-IDF Framework)               │   │
│  └─────────────────────────┬───────────────────────────┘   │
│                             │                               │
└─────────────────────────────┼───────────────────────────────┘
                              │ Wi-Fi 2.4GHz
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Network Layer                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          MQTT Broker (Mosquitto)                     │   │
│  │                                                     │   │
│  │  Topics:                                            │   │
│  │    home/kc868-a6/sensor/mijia_XX_temperature/state  │   │
│  │    home/kc868-a6/sensor/mijia_XX_humidity/state     │   │
│  │    home/kc868-a6/sensor/mijia_XX_battery/state      │   │
│  │    home/kc868-a6/sensor/mijia_XX_rssi/state         │   │
│  │    home/kc868-a6/status                             │   │
│  │                                                     │   │
│  │  QoS: 1 (at-least-once) | Retain: true             │   │
│  └─────────────────────────┬───────────────────────────┘   │
│                             │                               │
└─────────────────────────────┼───────────────────────────────┘
                              │ MQTT
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Application Layer                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          Home Assistant                              │   │
│  │                                                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │   │
│  │  │ MQTT         │→│ Sensor       │→│ Dashboard│  │   │
│  │  │ Integration  │  │ Entities     │  │ (UI)     │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────┘  │   │
│  │                                                     │   │
│  │  Auto-discovery via MQTT Discovery                  │   │
│  │  ~32+ entities (8 sensors × 4 metrics)              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 3. Data Flow

```
Mijia Sensor → BLE Advertisement → KC868-A6 BLE Scanner
                                         │
                                         ▼
                                   MAC Filtering
                                   (เลือกเฉพาะ MAC ที่ลงทะเบียน)
                                         │
                                         ▼
                                   Xiaomi BLE Decoder
                                   (ถอดรหัส advertisement)
                                         │
                                         ▼
                                   Sensor Data Extraction
                                   ├── Temperature (°C)
                                   ├── Humidity (%)
                                   ├── Battery (%)
                                   └── RSSI (dBm)
                                         │
                                         ▼
                                   MQTT Publish (via Wi-Fi)
                                   ├── QoS: 1
                                   └── Retain: true
                                         │
                                         ▼
                                   MQTT Broker (Mosquitto)
                                         │
                                         ▼
                                   Home Assistant
                                   ├── MQTT Discovery
                                   ├── Entity Creation
                                   └── Dashboard Display
```

## 4. Hardware Specifications

### KC868-A6
| คุณสมบัติ | รายละเอียด |
|-----------|------------|
| Chip | ESP-WROOM-32 (ESP32 คลาสสิก) |
| BLE | Bluetooth 4.2 (BLE) |
| Wi-Fi | 802.11 b/g/n 2.4GHz |
| Framework | ESP-IDF (via ESPHome) |
| Power | DC 12V |

> ⚠️ **ข้อสังเกต**: Wi-Fi และ BLE ใช้ radio/เสาอากาศร่วมกัน ควรวาง KC868-A6 ห่างจากอุปกรณ์ 2.4GHz อื่น ๆ อย่างน้อย 2-3 เมตร

### Mijia Sensor (LYWSD03MMC)
| คุณสมบัติ | รายละเอียด |
|-----------|------------|
| Protocol | BLE (Bluetooth Low Energy) |
| Data | Temperature, Humidity, Battery |
| Advertisement | Encrypted (ต้องใช้ bindkey) |
| Range | ~10m (ขึ้นกับสภาพแวดล้อม) |
| Battery | CR2032 |

## 5. File Structure

```
DashBoardMajin8/
├── esphome/
│   ├── kc868_a6_mijia.yaml          # Main config (imports packages)
│   ├── kc868_a6_ble_scan.yaml       # Phase 1 BLE scanner (standalone)
│   ├── secrets.yaml                  # Credentials (⚠️ ห้าม commit)
│   └── packages/
│       ├── ble.yaml                  # BLE tracker (singleton)
│       ├── mqtt.yaml                 # MQTT broker config
│       └── sensors.yaml              # Mijia x8 sensor definitions
├── documentation/
│   ├── architecture.md               # เอกสารนี้
│   ├── mac-address-table.md          # ตาราง MAC Address
│   └── test-results.md              # ผลการทดสอบ
├── Plan/
│   └── KC868-A6_Mijia_8_MQTT_Dashboard_Project_Plan_Revised.md
└── README.md
```

## 6. MQTT Topic Structure

```
home/kc868-a6/                              # Topic prefix
├── status                                  # Device availability (online/offline)
├── debug                                   # Debug log (WARN level)
├── sensor/
│   ├── mijia_01_temperature/state         # Mijia #01 Temperature
│   ├── mijia_01_humidity/state            # Mijia #01 Humidity
│   ├── mijia_01_battery/state             # Mijia #01 Battery
│   ├── mijia_01_rssi/state                # Mijia #01 RSSI
│   ├── ... (02-07)
│   ├── mijia_08_temperature/state         # Mijia #08 Temperature
│   ├── mijia_08_humidity/state            # Mijia #08 Humidity
│   ├── mijia_08_battery/state             # Mijia #08 Battery
│   ├── mijia_08_rssi/state                # Mijia #08 RSSI
│   ├── kc868_a6_uptime/state              # Device uptime
│   └── kc868_a6_wifi_signal/state         # WiFi signal strength
└── text_sensor/
    ├── kc868_a6_ip_address/state          # Device IP
    ├── kc868_a6_wifi_ssid/state           # Connected SSID
    └── kc868_a6_wifi_mac/state            # Device WiFi MAC
```

## 7. ข้อจำกัดทางเทคนิค

1. **BLE/Wi-Fi Coexistence**: ESP32 ใช้ radio ร่วมกัน — อาจเกิดหน่วงเมื่อ BLE scan 8 ตัวพร้อม Wi-Fi
2. **BLE Range**: ระยะจริง ~10m ในพื้นที่เปิดโล่ง ลดลงเมื่อมีผนัง/สิ่งกีดขวาง
3. **Advertisement Interval**: Mijia ส่ง BLE advertisement ทุก ~10-60 วินาที (ขึ้นกับรุ่น)
4. **Encrypted BLE**: LYWSD03MMC ใช้ encrypted advertisement — ต้องมี bindkey
5. **Concurrent Scanning**: 8 sensors คือจำนวนที่ยังรับได้ แต่ควรทดสอบ reliability ใน Phase 4
