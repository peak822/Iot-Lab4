# Project Plan: KC868-A6 + Mijia 8 Sensors + ESPHome + MQTT Dashboard — ฉบับแก้ไข

> **หมายเหตุฉบับแก้ไข**: เอกสารนี้ปรับปรุงจากแผนต้นฉบับตามข้อเสนอแนะจากการตรวจสอบโครงการ **โดยไม่เพิ่มขอบเขตงานหรืออุปกรณ์ใหม่ใด ๆ** จุดที่แก้ไขเป็นเพียงการแก้รายละเอียดทางเทคนิคให้ถูกต้องและใช้งานได้จริงภายใน scope เดิมเท่านั้น จุดที่แก้ไข/เพิ่มเติมจะมีป้ายกำกับ `✏️ แก้ไข` ไว้ตลอดทั้งเอกสาร

## 1. Project Scope

ระบบนี้มีอุปกรณ์หลัก:

1. KinCony KC868-A6
2. Mijia Temperature & Humidity Sensor จำนวน 8 ตัว
3. ESPHome
4. Visual Studio Code
5. MQTT Broker
6. Dashboard (แนะนำ Home Assistant)

### เป้าหมาย

รับข้อมูลจาก Mijia ทั้ง 8 ตัวผ่าน Bluetooth Low Energy (BLE) โดย KC868-A6 จากนั้นส่งข้อมูลผ่าน Wi-Fi และ MQTT ไปยัง Dashboard เพื่อแสดง:

- Temperature
- Humidity
- Battery
- RSSI
- Online/Offline
- Last Update
- MAC Address

---

# 2. System Architecture

```text
Mijia #1 ──BLE──┐
Mijia #2 ──BLE──┤
Mijia #3 ──BLE──┤
Mijia #4 ──BLE──┤
Mijia #5 ──BLE──┤
Mijia #6 ──BLE──┤
Mijia #7 ──BLE──┤
Mijia #8 ──BLE──┘
                  │
                  ▼
          ┌─────────────────┐
          │    KC868-A6     │
          │                 │
          │ ESP32            │
          │ BLE Scanner      │
          │ Xiaomi Decoder   │
          │ MQTT Client      │
          └────────┬────────┘
                   │
                 Wi-Fi
                   │
                   ▼
          ┌─────────────────┐
          │  MQTT Broker    │
          │   Mosquitto     │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │ Home Assistant  │
          │                 │
          │ MQTT Discovery  │
          │ Dashboard       │
          └─────────────────┘
```

---

# 3. Role of Each Component

## 3.1 Mijia Sensors

Mijia ทำหน้าที่:

```text
Temperature
Humidity
Battery
     ↓
BLE Advertisement
```

ไม่จำเป็นต้องต่อสายกับ KC868-A6

---

## 3.2 KC868-A6

KC868-A6 ทำหน้าที่เป็นศูนย์กลางของระบบ:

```text
BLE Scanner
    ↓
ค้นหา Mijia
    ↓
ตรวจสอบ MAC Address
    ↓
Xiaomi BLE Decoder
    ↓
Temperature / Humidity / Battery
    ↓
MQTT
```

> **`✏️ แก้ไข` เพิ่มข้อสังเกตทางเทคนิค**: KC868-A6 ใช้ชิป **ESP-WROOM-32 (ESP32 คลาสสิก ไม่มีพอร์ต Ethernet แยก)** ซึ่งหมายความว่า Wi-Fi และ BLE ใช้ radio/เสาอากาศร่วมกันภายในตัวชิป และเสาสัญญาณ Wi-Fi บนบอร์ดรุ่นนี้ยังวางอยู่ใกล้กับเสาสัญญาณ nRF24L01 ที่ทำงานความถี่ 2.4GHz เดียวกัน จึงมีโอกาสรบกวนกันเองได้ **ควรวาง KC868-A6 ให้ห่างจากอุปกรณ์ที่ปล่อยคลื่นรบกวน 2.4GHz อื่น ๆ (เราท์เตอร์, สวิตช์เครือข่าย) อย่างน้อยสองสามเมตร** และให้สังเกตผลกระทบนี้เป็นพิเศษใน **Phase 4 (Test 8 Sensors Simultaneously)** และ **Phase 5 (MQTT)** ซึ่งเป็นจุดที่ Wi-Fi กับ BLE ทำงานพร้อมกันจริงเป็นครั้งแรก — เป็นเพียงข้อสังเกตเพื่อการวางตำแหน่งอุปกรณ์ ไม่ใช่การเพิ่มฮาร์ดแวร์ใหม่

---

## 3.3 ESPHome

ESPHome ทำหน้าที่:

- ควบคุม ESP32 ใน KC868-A6
- BLE scanning
- อ่าน Xiaomi/Mijia BLE
- Wi-Fi connection
- MQTT communication
- Monitoring และ logging

---

## 3.4 VS Code

ใช้สำหรับ:

- เขียน YAML
- ตรวจสอบ Configuration
- Compile
- Upload Firmware
- ดู Log
- Debug

---

## 3.5 MQTT Broker

MQTT ทำหน้าที่เป็นตัวกลาง:

```text
KC868-A6
    ↓
MQTT Publish
    ↓
MQTT Broker
    ↓
Dashboard Subscribe
```

แนะนำ Mosquitto สำหรับงานทดลอง

---

## 3.6 Dashboard

แนะนำ Home Assistant เพื่อ:

- MQTT Integration
- MQTT Discovery
- Sensor Entities
- Dashboard
- History Graph
- Online/Offline Status

---

# 4. Main Data Flow

```text
Mijia
  │
  │ BLE Advertisement
  ▼
KC868-A6
  │
  ├── MAC Filtering
  │
  ├── Xiaomi BLE Decode
  │
  └── Sensor Data
       │
       ├── Temperature
       ├── Humidity
       ├── Battery
       └── RSSI
              │
              ▼
           Wi-Fi
              │
              ▼
        MQTT Broker
              │
              ▼
       Home Assistant
              │
              ▼
          Dashboard
```

---

# 5. Phase 1 — BLE Discovery

## Objective

ค้นหาอุปกรณ์ BLE รอบ KC868-A6 และค้นหา MAC Address ของ Mijia

เริ่มต้นด้วย Mijia ทีละตัว

```text
Mijia #1
   ↓
KC868-A6 BLE Scan
   ↓
ค้นหา MAC
```

ยังไม่ต้องเริ่มด้วย MQTT

---

# 6. BLE Scanner Configuration

สร้างไฟล์:

```text
kc868_a6_ble_scan.yaml
```

ตัวอย่าง Configuration:

```yaml
esphome:
  name: kc868-a6-ble-scan
  friendly_name: KC868 A6 BLE Scanner

esp32:
  variant: esp32
  framework:
    type: esp-idf

logger:
  level: DEBUG

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

api:
  encryption:
    key: !secret encryption_key

ota:
  - platform: esphome

esp32_ble_tracker:

text_sensor:
  - platform: ble_scanner
    name: "BLE Devices Scanner"
```

> **`✏️ แก้ไข`** เพิ่ม `encryption.key` ใต้ `api:` ตามตัวอย่าง config ที่ทางการของ ESPHome แนะนำสำหรับบอร์ด KC868-A6 โดยเฉพาะ — เดิมมีแค่ `api:` เปล่า ๆ ซึ่งใช้งานได้แต่สื่อสารแบบไม่เข้ารหัส ควรเพิ่ม `encryption_key` ลงใน `secrets.yaml` ตั้งแต่ Phase 1 เพื่อความปลอดภัยของ network ในบ้าน (เป็นการเติมรายละเอียดที่ควรมีอยู่แล้วใน scope เดิม)

## จุดประสงค์ของไฟล์นี้

ใช้เพื่อดู:

- MAC Address
- BLE Name
- RSSI
- อุปกรณ์ BLE ที่ KC868-A6 มองเห็น

ยังไม่ต้องอ่าน Temperature/Humidity

---

# 7. MAC Address Identification

ให้ทำทีละตัว

## Mijia #1

```text
Mijia #1 ON
      ↓
BLE Scan
      ↓
พบ MAC
      ↓
บันทึก MAC
```

จากนั้นปิด Mijia:

```text
Mijia #1 OFF
      ↓
BLE Scan
      ↓
MAC หาย
```

เปิดกลับ:

```text
Mijia #1 ON
      ↓
BLE Scan
      ↓
MAC กลับมา
```

จึงยืนยันว่า MAC ดังกล่าวเป็นของ Mijia #1

> **`✏️ แก้ไข` เพิ่ม**: ระหว่างการยืนยัน MAC ในขั้นตอนนี้ ให้บันทึก **ชื่อรุ่น (Model/BLE Name)** ที่ปรากฏใน log การสแกนไว้ด้วย (เช่น LYWSDCGQ, LYWSD03MMC) เพราะจะต้องใช้ระบุ platform ที่ถูกต้องใน Phase 2 (ดูข้อ 9) — เป็นเพียงการบันทึกข้อมูลที่สแกนเจอเพิ่มเติมจากขั้นตอนเดิม ไม่ใช่ขั้นตอนใหม่

---

# 8. ทำซ้ำสำหรับ Mijia #1–#8

สร้างตาราง:

| ID | Model | MAC Address | RSSI | Temperature | Humidity | Battery |
|---|---|---|---:|---:|---:|---:|
| 01 | ? | ? | ? | ? | ? | ? |
| 02 | ? | ? | ? | ? | ? | ? |
| 03 | ? | ? | ? | ? | ? | ? |
| 04 | ? | ? | ? | ? | ? | ? |
| 05 | ? | ? | ? | ? | ? | ? |
| 06 | ? | ? | ? | ? | ? | ? |
| 07 | ? | ? | ? | ? | ? | ? |
| 08 | ? | ? | ? | ? | ? | ? |

**หมายเหตุ:** MAC Address จริงต้องมาจากอุปกรณ์ของผู้ทดลอง ห้ามใช้ MAC ตัวอย่างในเอกสารเป็น MAC จริง

> **`✏️ แก้ไข`**: คอลัมน์ **Model** ในตารางนี้มีความสำคัญมากกว่าที่แผนเดิมสื่อไว้ — ค่านี้จะถูกใช้กำหนด **ชื่อ platform ใน YAML ของ Phase 2 โดยตรง** (ดูข้อ 9) จึงต้องกรอกให้ครบก่อนเริ่มเขียน `sensors.yaml`

---

# 9. Phase 2 — Xiaomi BLE

หลังจากยืนยัน MAC ทั้ง 8 ตัวแล้วจึงเริ่มอ่านข้อมูล Mijia

แนวคิด:

```text
Mijia #1
MAC_01
  ↓
Temperature
Humidity
Battery
```

ทำเหมือนกันจนถึง Mijia #8

> **`✏️ แก้ไข` แก้ไขตัวอย่าง YAML ทั้งหมด** — ตัวอย่างเดิมใช้ `platform: xiaomi_ble` ซึ่งไม่ใช่ platform จริงตามเอกสารทางการของ ESPHome และมีแค่ `mac_address:` โดยไม่ระบุ sub-field ใด ๆ เลย ทำให้ compile ไม่ผ่านหรือไม่สร้าง entity ใดหากใช้ตามเดิม ตาม ESPHome จริง ๆ ต้องใช้ **platform เฉพาะรุ่น** (มาจากคอลัมน์ Model ในตารางข้อ 8) พร้อมระบุ sub-field `temperature:`, `humidity:`, `battery_level:` กำกับด้วย `name:` เสมอ:

ตัวอย่างโครงสร้างที่แก้ไขแล้ว (สมมติ Mijia #1 เป็นรุ่น LYWSDCGQ):

```yaml
esp32_ble_tracker:

sensor:
  - platform: xiaomi_lywsdcgq   # เปลี่ยนตามรุ่นจริงที่บันทึกไว้ในตารางข้อ 8
    mac_address: "MAC_01"
    temperature:
      name: "Mijia 01 Temperature"
    humidity:
      name: "Mijia 01 Humidity"
    battery_level:
      name: "Mijia 01 Battery"

  - platform: xiaomi_lywsdcgq   # ทำซ้ำแบบเดียวกันจนถึง Mijia #8
    mac_address: "MAC_02"
    temperature:
      name: "Mijia 02 Temperature"
    humidity:
      name: "Mijia 02 Humidity"
    battery_level:
      name: "Mijia 02 Battery"

  # ... ต่อจนถึง Mijia #8
```

> **`✏️ แก้ไข` หมายเหตุสำคัญ**: ถ้า Mijia ทั้ง 8 ตัวไม่ใช่รุ่นเดียวกันทั้งหมด **แต่ละ entry ต้องใช้ชื่อ platform ต่างกันตามรุ่นจริง** ไม่ใช่ copy-paste ชื่อเดียวซ้ำ 8 ครั้งแบบตัวอย่างเดิม และถ้ารุ่นใดมี encrypted advertisement (ตามที่ระบุไว้แล้วในข้อ 32.4) จะต้องเพิ่ม `bindkey:` ในแต่ละ entry ของรุ่นนั้นด้วย

ต้องปรับชื่อและ sensor fields ให้ตรงกับรุ่น Mijia ที่ใช้งานจริง (ข้อความเดิม — ยังคงถูกต้อง เพียงแต่ตัวอย่าง YAML ด้านบนแสดงให้เห็นวิธีทำจริงแล้ว)

---

# 10. Phase 3 — Test Xiaomi Data

ทดสอบทีละตัว:

```text
Mijia #1
   ↓
Temperature
Humidity
Battery
```

ตรวจสอบว่า:

- ได้ค่า Temperature
- ได้ค่า Humidity
- Battery ถูกต้อง
- ไม่มีการสลับข้อมูลระหว่าง sensor

จากนั้นทำ #2 ถึง #8

---

# 11. Phase 4 — Test 8 Sensors Simultaneously

เปิด Mijia ทั้ง 8 ตัว:

```text
Mijia #1 ─┐
Mijia #2 ─┤
Mijia #3 ─┤
Mijia #4 ─┤
Mijia #5 ─┤──> KC868-A6
Mijia #6 ─┤
Mijia #7 ─┤
Mijia #8 ─┘
```

ตรวจสอบ:

- MAC ครบ 8
- Temperature ครบ 8
- Humidity ครบ 8
- Battery ครบ 8
- ไม่มีข้อมูลสลับกัน

> **`✏️ แก้ไข` เพิ่ม**: Phase นี้เป็นจุดแรกที่ BLE scan 8 ตัวพร้อมกันทำงานร่วมกับ Wi-Fi connection ต่อเนื่อง (ตามข้อสังเกตในข้อ 3.2) หากพบอาการหน่วงหรือ MAC หายเป็นระยะ ให้ตรวจสอบตำแหน่งวาง KC868-A6 ก่อนเป็นอันดับแรก

---

# 12. Phase 5 — MQTT

เมื่อ BLE ผ่านแล้วจึงเพิ่ม MQTT

ตัวอย่าง:

```yaml
mqtt:
  broker: 192.168.1.xxx
  username: !secret mqtt_username
  password: !secret mqtt_password
```

ควรเก็บข้อมูล MQTT แยกจาก BLE เพื่อให้ง่ายต่อการ Debug

ลำดับ:

```text
BLE ผ่าน
   ↓
Xiaomi BLE ผ่าน
   ↓
MQTT Broker ผ่าน
   ↓
Home Assistant ผ่าน
```

> **`✏️ แก้ไข`**: ปรับข้อความจาก "Wi-Fi ผ่าน" เป็น **"MQTT Broker ผ่าน"** เพื่อให้ตรงกับความเป็นจริง เพราะ Wi-Fi ต้องเชื่อมต่อได้ตั้งแต่ Phase 1 อยู่แล้ว (จำเป็นสำหรับ OTA/API/logging ตาม YAML ในข้อ 6) สิ่งที่ทดสอบใหม่จริง ๆ ใน Phase นี้คือการเชื่อมต่อ MQTT Broker ไม่ใช่ Wi-Fi

---

# 13. MQTT Topic Design

แนะนำโครงสร้าง:

```text
home/
└── kc868-a6/
    └── mijia/
        ├── 01/
        │   ├── state
        │   ├── availability
        │   └── attributes
        │
        ├── 02/
        ├── 03/
        ├── 04/
        ├── 05/
        ├── 06/
        ├── 07/
        └── 08/
```

ตัวอย่าง:

```text
home/kc868-a6/mijia/01/state
home/kc868-a6/mijia/02/state
...
home/kc868-a6/mijia/08/state
```

---

# 14. MQTT State Payload

สามารถออกแบบ State เป็น JSON:

```json
{
  "temperature": 27.3,
  "humidity": 61.2,
  "battery": 94,
  "rssi": -52
}
```

ตัวอย่าง topic:

```text
home/kc868-a6/mijia/01/state
```

ข้อดี:

- Topic เป็นระบบ
- Sensor หนึ่งตัวมี State เดียว
- เพิ่ม field ในอนาคตได้ง่าย
- Dashboard สามารถดึงค่า JSON ด้วย template

---

# 15. MQTT QoS และ Retain

ค่าเริ่มต้นที่เหมาะกับการทดลอง:

```text
QoS = 1
Retain = true
```

เหตุผล:

### QoS 1

เหมาะกับ sensor monitoring ที่ต้องการให้ broker ได้รับ message อย่างน้อยหนึ่งครั้ง

### Retain

ช่วยให้ subscriber ที่เพิ่งเชื่อมต่อสามารถได้รับค่าล่าสุด

ไม่จำเป็นต้องใช้ QoS 2 สำหรับระบบนี้

---

# 16. MQTT Availability

Mijia เป็น BLE sensor จึงไม่ได้เชื่อม MQTT โดยตรง

ดังนั้นสถานะ Mijia ควรคำนวณจากการได้รับ BLE packet ล่าสุด

ตัวอย่างแนวคิด:

```text
ได้รับ BLE packet ภายในช่วงเวลาที่กำหนด
        ↓
ONLINE

ไม่มี packet ต่อเนื่องเกิน threshold
        ↓
OFFLINE
```

ต้องกำหนด threshold จากพฤติกรรมจริงของ Mijia ที่ใช้

> **`✏️ แก้ไข` เพิ่มค่าตั้งต้นสำหรับเริ่มทดสอบ**: ยังไม่มีตัวเลขเริ่มต้นให้ทดลองในแผนเดิม ให้เริ่มจากการสังเกต interval การส่ง BLE advertisement จริงจาก log ใน Phase 1 (Mijia ทั่วไปมักส่งทุก ๆ ประมาณ 10-60 วินาทีขึ้นกับรุ่น) แล้วตั้ง **threshold offline เริ่มต้นที่ประมาณ 3 เท่าของ interval ที่สังเกตได้จริง** จากนั้นค่อยปรับตามผลทดสอบจริงใน Phase 7-8

---

# 17. Phase 6 — Home Assistant

Home Assistant รับข้อมูลจาก MQTT:

```text
MQTT Broker
    ↓
Home Assistant MQTT
```

ควรสร้าง entities อย่างน้อย:

```text
Mijia #1
 ├── Temperature
 ├── Humidity
 ├── Battery
 └── RSSI

Mijia #2
 ├── Temperature
 ├── Humidity
 ├── Battery
 └── RSSI

...

Mijia #8
 ├── Temperature
 ├── Humidity
 ├── Battery
 └── RSSI
```

รวมประมาณ:

```text
8 × Temperature
8 × Humidity
8 × Battery
8 × RSSI
```

หรือประมาณ 32 entities หากเปิดทั้งหมด

---

# 18. MQTT Discovery

แนะนำให้ใช้ MQTT Discovery เพื่อช่วยสร้าง entities ใน Home Assistant

แนวคิด:

```text
KC868-A6
   ↓
MQTT Discovery
   ↓
Home Assistant
   ↓
สร้าง Mijia entities
```

ควรกำหนด:

- unique_id
- device name
- state topic
- unit
- value template
- availability

---

# 19. Dashboard Design

แนะนำแบ่ง Dashboard เป็น 2 หน้า

## Dashboard 1 — Overview

```text
┌─────────────────────────────────────────────────────────┐
│              KC868-A6 Mijia Monitor                    │
├──────────────────┬──────────────────┬──────────────────┤
│ Mijia #1         │ Mijia #2         │ Mijia #3         │
│ 27.3 °C          │ 26.8 °C          │ 28.1 °C          │
│ 61 %             │ 59 %             │ 64 %             │
│ Battery 94 %     │ Battery 88 %     │ Battery 91 %     │
│ Online           │ Online           │ Online            │
├──────────────────┼──────────────────┼──────────────────┤
│ Mijia #4         │ Mijia #5         │ Mijia #6         │
│ 27.7 °C          │ 27.0 °C          │ 28.5 °C          │
│ 60 %             │ 63 %             │ 65 %             │
│ Battery 85 %     │ Battery 90 %     │ Battery 77 %     │
│ Online           │ Online           │ Online            │
├──────────────────┼──────────────────┼──────────────────┤
│ Mijia #7         │ Mijia #8         │ KC868-A6         │
│ 26.9 °C          │ 27.8 °C          │ MQTT Connected   │
│ 58 %             │ 62 %             │ BLE Running      │
│ Battery 79 %     │ Battery 81 %     │ WiFi Connected   │
│ Online           │ Online           │ 8 Sensors        │
└──────────────────┴──────────────────┴──────────────────┘
```

---

# 20. Dashboard 2 — Detailed Sensor

เมื่อเลือก Mijia ตัวใดตัวหนึ่ง แสดง:

```text
Mijia #1

Temperature: 27.3 °C
Humidity:    61 %
Battery:     94 %
RSSI:        -52 dBm
Status:      Online
MAC:         XX:XX:XX:XX:XX:XX
Last Update: ...
```

และกราฟ:

```text
Temperature History
Humidity History
RSSI History
Battery History
```

---

# 21. Phase 7 — Distance Test

ทดสอบระยะ:

```text
1 m
3 m
5 m
10 m
```

ถ้าสถานที่เหมาะสม อาจเพิ่ม:

```text
ผ่านผนัง
ต่างห้อง
หลังสิ่งกีดขวาง
```

บันทึก:

- RSSI
- Packet reception
- Update interval
- Online/Offline

ตัวอย่าง:

| Sensor | Distance | RSSI | Packet Reception | Status |
|---|---:|---:|---:|---|
| #1 | 1 m | -42 | 100% | Good |
| #1 | 5 m | -58 | 98% | Good |
| #1 | 10 m | -71 | 92% | Acceptable |
| #8 | 10 m | -79 | 81% | Weak |

ค่าตัวเลขด้านบนเป็นตัวอย่างเท่านั้น

---

# 22. Phase 8 — MQTT Test

ตรวจสอบ MQTT โดยใช้ MQTT client หรือ MQTT Explorer

ตรวจ topic:

```text
home/kc868-a6/mijia/01/state
```

ตรวจ JSON:

```json
{
  "temperature": 27.3,
  "humidity": 61.2,
  "battery": 94,
  "rssi": -52
}
```

ทำจนถึง:

```text
01
02
03
04
05
06
07
08
```

---

# 23. Test Cases

| Test | รายละเอียด | Expected Result |
|---|---|---|
| T01 | Scan Mijia #1 | พบ MAC |
| T02 | Scan Mijia #1–#8 | พบครบ |
| T03 | ตรวจ MAC | ไม่ซ้ำ |
| T04 | อ่าน Temperature | ครบ 8 |
| T05 | อ่าน Humidity | ครบ 8 |
| T06 | อ่าน Battery | ครบ 8 |
| T07 | อ่าน RSSI | ครบ 8 |
| T08 | MQTT Publish | ครบ 8 |
| T09 | MQTT Reconnect | กลับมาได้ |
| T10 | MQTT Discovery | Entities ถูกสร้าง |
| T11 | Dashboard | แสดงครบ |
| T12 | Sensor Offline | ตรวจพบ Offline |
| T13 | Distance Test | บันทึก RSSI |
| T14 | 8 Sensors พร้อมกัน | ไม่สลับข้อมูล |

---

# 24. Data Collection

สร้างตารางเก็บผล:

| Time | Sensor | MAC | Temp | Humidity | Battery | RSSI | MQTT | Status |
|---|---|---|---:|---:|---:|---:|---|---|
| 08:00 | #1 | XX:XX | 27.3 | 61 | 94 | -52 | OK | Online |
| 08:00 | #2 | XX:XX | 26.8 | 59 | 88 | -55 | OK | Online |

ทำเช่นนี้สำหรับทั้ง 8 sensors

---

# 25. VS Code Project Structure

แนะนำ:

```text
KC868-A6-Mijia/
│
├── esphome/
│   ├── kc868_a6_mijia.yaml
│   ├── secrets.yaml
│   │
│   └── packages/
│       ├── ble.yaml
│       ├── mqtt.yaml
│       └── sensors.yaml
│
├── documentation/
│   ├── mac-address-table.xlsx
│   ├── test-results.xlsx
│   └── architecture.md
│
└── README.md
```

---

# 26. YAML Organization

## ble.yaml

เก็บ:

```text
BLE Tracker (esp32_ble_tracker: — ประกาศที่นี่ที่เดียวเท่านั้น)
```

> **`✏️ แก้ไข`**: เดิมข้อนี้เขียนว่า `ble.yaml` เก็บ "BLE Tracker" และ "Mijia #1–#8" รวมกัน แต่รายชื่อ Mijia #1-#8 (พร้อม temperature/humidity/battery) ควรย้ายไปอยู่ใน `sensors.yaml` แทน เพื่อไม่ให้ `esp32_ble_tracker:` ถูกประกาศซ้ำในหลายไฟล์เมื่อ ESPHome รวม package ทั้งหมดเข้าด้วยกัน (เป็น component แบบ singleton ประกาศได้ครั้งเดียวในไฟล์ที่ compile รวมแล้ว) — `ble.yaml` จึงควรมีแค่ `esp32_ble_tracker:` เพียงอย่างเดียว

## mqtt.yaml

เก็บ:

```text
MQTT Broker
Username
Password
QoS
Retain
Availability
```

## sensors.yaml

เก็บ:

```text
sensor: (list ของ xiaomi platform เฉพาะรุ่น พร้อม mac_address ของ Mijia #1-#8)
  - Temperature
  - Humidity
  - Battery
  - RSSI
```

> **`✏️ แก้ไข`**: `sensors.yaml` คือที่เก็บ list ของ sensor entries ทั้ง 8 ตัว (ตามตัวอย่าง YAML ที่แก้ไขในข้อ 9) โดย**ไม่ต้องประกาศ `esp32_ble_tracker:` ซ้ำอีก** เพราะประกาศไว้แล้วใน `ble.yaml`

## Main YAML

```text
kc868_a6_mijia.yaml
        │
        ├── ble.yaml
        ├── mqtt.yaml
        └── sensors.yaml
```

---

# 27. Recommended Development Sequence

ห้ามทำทั้งหมดพร้อมกัน

## Phase 1

```text
KC868-A6
↓
ESPHome (รวม Wi-Fi/API/OTA พื้นฐานตาม YAML ข้อ 6)
↓
BLE Scan
↓
ผ่าน
```

> **`✏️ แก้ไข`**: เพิ่มวงเล็บชี้แจงว่า Wi-Fi/API/OTA เชื่อมต่อได้ตั้งแต่ Phase นี้อยู่แล้ว (ตาม YAML ในข้อ 6) เพื่อให้สอดคล้องกับข้อ 12 ที่ปรับแก้ไปแล้ว — ไม่ใช่การเพิ่มขั้นตอนใหม่ เป็นแค่การอธิบายให้ตรงกับสิ่งที่เกิดขึ้นจริง

## Phase 2

```text
Mijia #1
↓
MAC
↓
Temperature
↓
Humidity
↓
ผ่าน
```

## Phase 3

```text
Mijia #1–#8
↓
MAC Mapping
↓
Temperature/Humidity
↓
ผ่าน
```

## Phase 4

```text
KC868-A6
↓
Wi-Fi (เชื่อมต่อต่อเนื่องพร้อม BLE — ดูข้อสังเกตในข้อ 3.2)
↓
MQTT Broker
↓
ผ่าน
```

## Phase 5

```text
8 Mijia
↓
KC868-A6
↓
MQTT
↓
Home Assistant
↓
ผ่าน
```

## Phase 6

```text
Dashboard
↓
8 Sensor Cards
↓
History Graph
↓
RSSI / Battery / Status
↓
Complete
```

## Phase 7

```text
Distance Test
↓
Packet Loss
↓
RSSI
↓
MQTT Reconnect
↓
Offline Test
↓
Evaluation
```

---

# 28. Final System

```text
                  ┌───────────────────┐
                  │ Mijia #1          │
                  ├───────────────────┤
                  │ Mijia #2          │
                  ├───────────────────┤
                  │ Mijia #3          │
                  ├───────────────────┤
                  │ Mijia #4          │
                  ├───────────────────┤
                  │ Mijia #5          │
                  ├───────────────────┤
                  │ Mijia #6          │
                  ├───────────────────┤
                  │ Mijia #7          │
                  ├───────────────────┤
                  │ Mijia #8          │
                  └─────────┬─────────┘
                            │
                         BLE 2.4 GHz
                            │
                            ▼
                 ┌────────────────────┐
                 │     KC868-A6       │
                 │                    │
                 │ ESP32-WROOM-32     │
                 │                    │
                 │ BLE Tracker        │
                 │       ↓            │
                 │ Xiaomi BLE         │
                 │       ↓            │
                 │ MQTT Client        │
                 └─────────┬──────────┘
                           │
                         Wi-Fi
                           │
                           ▼
                 ┌────────────────────┐
                 │   MQTT Broker      │
                 │     Mosquitto      │
                 └─────────┬──────────┘
                           │
                         MQTT
                           │
                           ▼
                 ┌────────────────────┐
                 │  Home Assistant    │
                 │                    │
                 │ MQTT Discovery     │
                 │       ↓            │
                 │ Dashboard          │
                 └────────────────────┘
```

---

# 29. Project Scope ที่ควรล็อกไว้

Version 1 ของโครงงานควรมีเฉพาะ:

```text
Mijia 8 ตัว
    ↓
BLE
    ↓
KC868-A6
    ↓
ESPHome
    ↓
Wi-Fi
    ↓
MQTT
    ↓
Home Assistant
    ↓
Dashboard
```

## ไม่จำเป็นต้องเพิ่มใน Version 1

- AI / Machine Learning
- Database ภายนอก
- Node-RED
- Raspberry Pi เพิ่ม
- Bluetooth Gateway เพิ่ม
- Zigbee
- LoRa
- Relay Control
- การควบคุม Mijia
- การแก้ Firmware Mijia

จุดสำคัญของโครงงานอยู่ที่:

1. BLE Discovery
2. MAC Address Identification
3. Multi-Sensor BLE Acquisition
4. ESPHome
5. MQTT Communication
6. 8-Sensor Data Management
7. Dashboard
8. Reliability Testing
9. Distance/RSSI Testing
10. MQTT/Offline Testing

---

# 30. Final Checklist

## Hardware

- [ ] KC868-A6
- [ ] Mijia #1
- [ ] Mijia #2
- [ ] Mijia #3
- [ ] Mijia #4
- [ ] Mijia #5
- [ ] Mijia #6
- [ ] Mijia #7
- [ ] Mijia #8

## Software

- [ ] VS Code
- [ ] ESPHome
- [ ] MQTT Broker
- [ ] Home Assistant
- [ ] MQTT Client/Explorer สำหรับทดสอบ

## BLE

- [ ] พบ Mijia #1
- [ ] พบ Mijia #2
- [ ] พบ Mijia #3
- [ ] พบ Mijia #4
- [ ] พบ Mijia #5
- [ ] พบ Mijia #6
- [ ] พบ Mijia #7
- [ ] พบ Mijia #8
- [ ] MAC ถูกต้อง
- [ ] MAC ไม่ซ้ำ
- [ ] ทดสอบ OFF/ON เพื่อยืนยัน MAC
- [ ] **`✏️ แก้ไข` บันทึก Model ของแต่ละตัวครบ (จำเป็นสำหรับเลือก platform ใน YAML)**

## Data

- [ ] Temperature × 8
- [ ] Humidity × 8
- [ ] Battery × 8
- [ ] RSSI × 8
- [ ] Status × 8

## MQTT

- [ ] Wi-Fi Connected
- [ ] MQTT Connected
- [ ] Publish สำเร็จ
- [ ] Topic ถูกต้อง
- [ ] Payload ถูกต้อง
- [ ] Reconnect ทดสอบแล้ว
- [ ] Retain ทดสอบแล้ว

## Dashboard

- [ ] Mijia #1
- [ ] Mijia #2
- [ ] Mijia #3
- [ ] Mijia #4
- [ ] Mijia #5
- [ ] Mijia #6
- [ ] Mijia #7
- [ ] Mijia #8
- [ ] Temperature
- [ ] Humidity
- [ ] Battery
- [ ] RSSI
- [ ] Online/Offline
- [ ] History Graph

## Evaluation

- [ ] 8 sensors พร้อมกัน
- [ ] Distance test
- [ ] RSSI test
- [ ] Packet reception test
- [ ] MQTT reconnect test
- [ ] Sensor offline test
- [ ] บันทึกผลการทดลอง
- [ ] วิเคราะห์ข้อจำกัด

---

# 31. References

- ESPHome — Xiaomi BLE Sensor:
  https://esphome.io/components/sensor/xiaomi_ble/

- ESPHome — ESP32 BLE Tracker:
  https://esphome.io/components/esp32_ble_tracker/

- ESPHome — MQTT:
  https://esphome.io/components/mqtt/

- ESPHome Devices — KinCony KC868-A6:
  https://devices.esphome.io/devices/kincony-kc868-a6/

- Home Assistant — MQTT:
  https://www.home-assistant.io/integrations/mqtt/

- Home Assistant — MQTT Sensor:
  https://www.home-assistant.io/integrations/sensor.mqtt/

- PlatformIO — VS Code:
  https://docs.platformio.org/en/latest/integration/ide/vscode.html

- **`✏️ แก้ไข` เพิ่ม** — KinCony KC868-A6 Hardware Design Details (อ้างอิงประเด็นเสาสัญญาณ Wi-Fi/nRF24L01 ในข้อ 3.2):
  https://www.kincony.com/kc868-a6-hardware-design-details.html

---

# 32. Important Technical Notes

1. MAC Address ต้องตรวจสอบจากอุปกรณ์จริง
2. อย่าใช้ MAC ตัวอย่างใน Configuration จริง
3. Mijia แต่ละรุ่นอาจมีรูปแบบ BLE advertisement แตกต่างกัน **`✏️ แก้ไข` และแต่ละรุ่นต้องใช้ชื่อ platform ต่างกันใน YAML ด้วย (ดูข้อ 9)**
4. Sensor บางรุ่นอาจมี encrypted advertisement และอาจต้องใช้ bindkey
5. จำนวน BLE devices ที่ scanner พบจริงขึ้นกับสภาพแวดล้อม
6. การมี Mijia 1 ตัวไม่ได้ทำให้เกิด MAC Address จริง 8 ตัว
7. หากต้องการทดสอบ 8 sensors ต้องมี Mijia จริง 8 ตัว หรือระบุข้อมูลจำลองว่าเป็น Simulation อย่างชัดเจน
8. ควรทำ BLE ให้ผ่านก่อนจึงเพิ่ม MQTT
9. ควรทำ MQTT ให้ผ่านก่อนจึงสร้าง Dashboard
10. การทดสอบ 8 sensors พร้อมกันเป็นขั้นตอนสำคัญของโครงงาน
11. **`✏️ แก้ไข` เพิ่ม**: `esp32_ble_tracker:` ต้องประกาศเพียงครั้งเดียวในไฟล์ที่ compile รวมกันแล้ว (แนะนำให้อยู่ใน `ble.yaml` เท่านั้น — ดูข้อ 26)
12. **`✏️ แก้ไข` เพิ่ม**: ควรวาง KC868-A6 ให้ห่างจากอุปกรณ์ที่ปล่อยคลื่น 2.4GHz อื่น ๆ อย่างน้อยสองสามเมตร เนื่องจาก Wi-Fi และ BLE บนชิป ESP-WROOM-32 ใช้ radio ร่วมกัน (ดูข้อ 3.2)

---

## สรุปฉบับปรับปรุง

จุดที่แก้ไขสำคัญที่สุด 3 จุด คือ **(1)** ตัวอย่าง YAML ในข้อ 9 ที่ใช้ platform ผิด/ไม่ครบ sub-field ซึ่งจะ compile ไม่ผ่านถ้าใช้ตามแผนเดิม **(2)** การป้องกันการประกาศ `esp32_ble_tracker:` ซ้ำเมื่อรวมไฟล์ package ตามโครงสร้างข้อ 25-26 และ **(3)** ข้อสังเกตเรื่อง Wi-Fi/BLE ใช้คลื่นความถี่เดียวกันบนชิป ESP32 รุ่นนี้ ซึ่งบันทึกไว้เป็นข้อสังเกตทางเทคนิคสำหรับ Phase 4-5 ทั้งหมดนี้เป็นการแก้ไขรายละเอียดให้ถูกต้องและใช้งานได้จริง **ภายในขอบเขตเดิมที่ล็อกไว้ในข้อ 29 ทุกประการ ไม่มีการเพิ่ม scope หรืออุปกรณ์ใหม่ใด ๆ**
