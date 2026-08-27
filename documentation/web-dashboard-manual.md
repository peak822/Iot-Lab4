# คู่มือการใช้งาน Web Dashboard ฉบับสมบูรณ์
## KC868-A6 10-Channel Mijia BLE Telemetry Matrix (Laboratory Precision Instrument Edition)

---

## 📑 สารบัญ (Table of Contents)
1. [ภาพรวมของระบบ (System Overview)](#1-ภาพรวมของระบบ-system-overview)
2. [การติดตั้งและเปิดใช้งาน (Getting Started)](#2-การติดตั้งและเปิดใช้งาน-getting-started)
3. [คู่มือการใช้งานหน้าจอหลัก (Main Interface Guide)](#3-คู่มือการใช้งานหน้าจอหลัก-main-interface-guide)
4. [โหมดมุมมองทั้ง 4 รูปแบบ (4 Dashboard View Modes)](#4-โหมดมุมมองทั้ง-4-รูปแบบ-4-dashboard-view-modes)
5. [หน้าต่างวิเคราะห์เชิงลึกและการตั้งชื่อ (Diagnostic Modal & Custom Aliasing)](#5-หน้าต่างวิเคราะห์เชิงลึกและการตั้งชื่อ-diagnostic-modal--custom-aliasing)
6. [การเชื่อมต่อ MQTT Broker และตั้งค่าระบบ (MQTT Configuration Drawer)](#6-การเชื่อมต่อ-mqtt-broker-และตั้งค่าระบบ-mqtt-configuration-drawer)
7. [การปรับแต่งพื้นหลัง WebGL Radar (Radar Optics Control)](#7-การปรับแต่งพื้นหลัง-webgl-radar-radar-optics-control)
8. [ระบบจำลองข้อมูลและการรับข้อมูลจริง (Simulation vs Live MQTT)](#8-ระบบจำลองข้อมูลและการรับข้อมูลจริง-simulation-vs-live-mqtt)
9. [การแก้ไขปัญหาเบื้องต้น (Troubleshooting & FAQs)](#9-การแก้ไขปัญหาเบื้องต้น-troubleshooting--faqs)

---

## 1. ภาพรวมของระบบ (System Overview)

Web Dashboard นี้ถูกออกแบบและพัฒนาขึ้นภายใต้มาตรฐาน **Laboratory Precision Instrument HUD** สำหรับตรวจวัดและบันทึกข้อมูลสภาพแวดล้อมจากเซนเซอร์ **Xiaomi Mijia BLE (LYWSD03MMC)** จำนวน 10 ตัว (CH.01–CH.10) แสดงผลค่าความละเอียดจุดทศนิยม 2 ตำแหน่ง (`0.01°C` / `0.01% RH`) ผ่านเกตเวย์ **KinCony KC868-A6 (ESP32)** ด้วยโพรโทคอล **MQTT over WebSocket**

```
┌─────────────────────────┐
│ 10x Mijia BLE Sensors   │ (Temperature, Humidity, Battery, RSSI)
└────────────┬────────────┘
             │ Bluetooth Low Energy (BLE Advertising 1100ms)
┌────────────▼────────────┐
│ KinCony KC868-A6 (ESP32)│ (ESPHome Firmware)
└────────────┬────────────┘
             │ Wi-Fi / MQTT Topic (home/kc868-a6/# หรือ pkru/104-106-110-119/<MAC>/data)
┌────────────▼────────────┐
│ MQTT Broker (Mosquitto) │ (Port 1883 TCP & Port 8080/9001 WebSocket)
└────────────┬────────────┘
             │ WebSocket (ws:// or wss://)
┌────────────▼────────────┐
│ Web Dashboard HUD       │ (WebGL Radar, Glassmorphism, 4 Views, 10 Channels)
└─────────────────────────┘
```

### 💎 จุดเด่นสำคัญ:
- **0.01°C Dual-Decimal Precision**: แสดงผลจุดทศนิยม 2 ตำแหน่งทุกมุมมอง (การ์ด, Hero Ribbon, ผังห้อง Spatial, ตาราง Data Sheet, และ Modal วิเคราะห์) ไม่สูญเสียความละเอียดของเซนเซอร์
- **10-Channel Matrix**: รองรับ 10 แชนแนลแบบเต็มพิกัด (2 แถว x 5 คอลัมน์ บนหน้าจอเดสก์ท็อป)
- **WebGL Radar Background**: ลำแสงเรดาร์หมุนวนตรวจจับสัญญาณสด ตอบสนองต่อการขยับเมาส์ และเปลี่ยนสีตามธีมสด ๆ
- **Obsidian Dark Glassmorphism**: ดีไซน์กระจกฝ้าหรูหรา ตัดด้วยเส้นกริดวิศวกรรม (CAD Precision Grid) และมาร์กเกอร์มุมสี่เหลี่ยมแบบ Hairline Brackets
- **Real-Time Responsiveness**: รองรับการถอดรหัสทั้งแบบแยก Topic ตามมาตรฐาน ESPHome และแบบ JSON Payload (BTHome v2) พร้อมไฟกระพริบวาบ (`Real-time Packet Glimmer Glow`) เมื่อได้รับแพ็กเก็ตใหม่
- **Zero Dependencies Backend**: ทำงานได้บนเว็บเบราว์เซอร์มาตรฐานทุกตัว โดยไม่ต้องติดตั้ง Node.js หรือ Framework หนัก ๆ

---

## 2. การติดตั้งและเปิดใช้งาน (Getting Started)

### โครงสร้างไฟล์ Web Dashboard (`dashboard/`):
```
dashboard/
├── index.html        # โครงสร้างหน้าจอ HUD และโมดอลทั้งหมด (10 ช่อง)
├── style.css         # สไตล์การออกแบบ Obsidian Dark, CAD Grid, แอนิเมชัน
└── app.js            # ระบบ WebGL Radar, MQTT WebSocket, Chart.js, สถิติ
```

### วิธีเปิดใช้งานบนเครื่อง (Localhost):
1. เปิด Command Prompt หรือ PowerShell ในโฟลเดอร์โปรเจกต์
2. สั่งรันเว็บเซิร์ฟเวอร์แบบเบาด้วย Python:
   ```bash
   python -m http.server 8080
   ```
3. เปิดเว็บเบราว์เซอร์ (Chrome, Edge, Firefox, Safari) แล้วไปที่:
   🔗 **`http://localhost:8080`**

---

## 3. คู่มือการใช้งานหน้าจอหลัก (Main Interface Guide)

หน้าจอหลักประกอบด้วย 3 ส่วนสำคัญ:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [LOGO] KC868-A6 LAB-PRO  | UPTIME | GATEWAY | MQTT | [THEME] [SFX] [SIM] │  <- Header Bar
├──────────────────────────────────────────────────────────────────────────┤
│ [ACTIVE CH 10/10]   [AVG TEMP]   [AVG HUMIDITY]  [GATEWAY RF] [BUFFER]   │  <- Hero Ribbon
├──────────────────────────────────────────────────────────────────────────┤
│ FACILITY MATRIX // 10 CHANNELS                                           │
│ [CARD GRID] [SPATIAL MATRIX] [ANALYTICS] [DATA SHEET]  [Search] [Sort ▼] │  <- Toolbar
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                 [ 10x Laboratory Precision Telemetry Cards ]             │  <- Main Panel
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 1. แถบเมนูด้านบน (Header Bar):
- **Brand Identity**: โลโก้หกเหลี่ยม `KC868-A6 LAB-PRO`
- **Pills แสดงสถานะระบบ**:
  - `UPTIME`: ระยะเวลาที่ระบบเปิดทำงานต่อเนื่อง
  - `GATEWAY`: สถานะออนไลน์ของบอร์ด ESP32 (`ONLINE` / `OFFLINE`)
  - `MQTT LINK`: สถานะการเชื่อมต่อกับ MQTT Broker
- **ปุ่มควบคุมด่วน**:
  - 🎨 **Theme Switcher** (`Cryo Cyan` / `Bioclean Lab` / `Laser Physics` / `Radiation Amber`): กดเพื่อสลับโทนสีไฟและลำแสงเรดาร์
  - 🔊 **Sound Toggle**: เปิด/ปิดเสียงสังเคราะห์ทางวิทยาศาสตร์ (Web Audio SFX)
  - 🔘 **Sim: ON / OFF**: สลับระหว่างโหมดจำลองข้อมูล และโหมด Standby รอรับข้อมูลจากฮาร์ดแวร์จริง
  - ⚙️ **Config Drawer**: เปิดแถบตั้งค่า MQTT Broker และเรดาร์

### 2. แถบสถิติภาพรวม (Hero Ribbon):
- **ACTIVE CHANNELS**: จำนวนเซนเซอร์ที่ส่งข้อมูลเข้ามาพร้อมใช้งาน (เช่น `10 / 10 NOMINAL`)
- **THERMAL MATRIX AVG**: อุณหภูมิเฉลี่ยรวมทุกช่อง (ทศนิยม 2 ตำแหน่ง) พร้อมระบุ `MIN` และ `MAX`
- **HYGROMETRIC AVG**: ความชื้นสัมพัทธ์เฉลี่ยรวม (ทศนิยม 2 ตำแหน่ง) พร้อมระบุระดับมาตรฐาน ISO Cleanroom
- **GATEWAY RF LINK**: ความแรงสัญญาณ Wi-Fi ของบอร์ด KC868-A6
- **THROUGHPUT BUFFER**: จำนวนข้อความแพ็กเก็ต MQTT ทั้งหมดที่ได้รับตั้งแต่เปิดหน้าจอ

### 3. การ์ดเซนเซอร์ (Laboratory Telemetry Card):
การ์ดแต่ละใบประกอบด้วยองค์ประกอบระดับพรีเมียม:
- **มุมการ์ด Hairline Brackets**: มาร์กเกอร์ HUD ที่มุมการ์ด
- **Radial Power Gauge**: วงแหวนแสดงระดับแบตเตอรี่รอบไอคอนเซนเซอร์
- **Environmental Status Badge (ENV STATUS)**: ป้ายสถานะสภาวะแวดล้อมจำแนกตามเกณฑ์ห้องแล็บ (`NOMINAL`, `CRYO`, `ELEVATED`, `HUMID`, `DRY`, `STANDBY`)
- **Monospace Decimals**: ตัวเลขอุณหภูมิ (`°C`) และความชื้น (`%`) คมชัด
- **Real-Time Sparkline**: กราฟเส้นแนวโน้มย้อนหลัง 18 จุดล่าสุด
- **10-Segment Calibrated LED Scale**: แถบไฟ LED ดิจิทัล 10 ขีดตามช่วงอุณหภูมิ 20°C - 35°C
- **Packet Glimmer Glow**: แสงวาบเลเซอร์รอบขอบการ์ดทุกครั้งที่ได้รับแพ็กเก็ตใหม่
- **3D Parallax Tilt**: การ์ดจะเอียงตามมุมการชี้ของเคอร์เซอร์เมาส์อย่างนุ่มนวล

---

## 4. โหมดมุมมองทั้ง 4 รูปแบบ (4 Dashboard View Modes)

ผู้ใช้สามารถสลับมุมมองได้จากแถบเมนูด้านบน:

```
[ CARD GRID ]   [ SPATIAL MATRIX ]   [ ANALYTICS ]   [ DATA SHEET ]
```

### 1. 🎛️ Card Grid (ค่าเริ่มต้น)
- แสดงการ์ดเซนเซอร์ทั้ง 8 ช่องแบบ Grid 4 คอลัมน์ x 2 แถว
- มีแถบ **Search Box** สำหรับพิมพ์ค้นหาด่วนตามชื่อช่องหรือ MAC Address
- มีเมนู **Sort Dropdown** สำหรับเรียงลำดับการ์ด:
  - `SORT: CH 01 → 08` (ตามลำดับช่อง)
  - `SORT: CH 08 → 01` (ย้อนลำดับช่อง)
  - `TEMP: HIGH → LOW` (อุณหภูมิสูงสุดไปต่ำสุด)
  - `TEMP: LOW → HIGH` (อุณหภูมิต่ำสุดไปสูงสุด)
  - `HUMIDITY: HIGH → LOW` (ความชื้นสูงสุดไปต่ำสุด)
  - `BATTERY: LOWEST` (แบตเตอรี่เหลือน้อยสุด สำหรับตรวจเช็คเปลี่ยนถ่าน)
  - `SIGNAL: STRONGEST` (สัญญาณ RF แรงสุด)

### 2. 🗺️ Spatial Matrix (แผนผังโซนความร้อน 8 ห้อง)
- แสดงแผนผังจำลอง 8 โซน/ห้องปฏิบัติการ (`CHAMBER 01` ถึง `CHAMBER 08`)
- พื้นหลังของแต่ละห้องจะเรืองแสงตามระดับความร้อนจริง:
  - 🔵 **สีฟ้า**: โซนความเย็น (`CRYO < 26.0°C`)
  - 🟢 **สีเขียว**: สภาวะปกติสมบูรณ์ (`NOMINAL 26.0 - 28.0°C`)
  - 🔴 **สีแดง**: โซนอุณหภูมิสูง (`ELEVATED > 28.0°C`)

### 3. 📈 Multi-Channel Thermal Spectrum (กราฟเปรียบเทียบสด)
- กราฟเส้นเปรียบเทียบอุณหภูมิของเซนเซอร์ทั้ง 10 แชนแนลบนแกนเวลาเดียวกันแบบ Dynamic Rolling Window
- มีปุ่มชิปเปิด/ปิดเส้นกราฟของแต่ละช่องด้านซ้าย (`CH.1` ถึง `CH.10`) เพื่อเลือกดูเฉพาะช่องที่สนใจ

### 4. 📋 Data Sheet (ตารางข้อมูลรวม & ส่งออก CSV)
- ตารางสรุปข้อมูลเซนเซอร์ทุกช่องอย่างละเอียด (Channel, Identifier, MAC, Status, Temperature, Humidity, ENV Status, Battery, RSSI, Packets, Last Seen)
- ปุ่ม **`CSV EXPORT`**: ดาวน์โหลดข้อมูลตารางออกมาเป็นไฟล์ `.csv` แบบ UTF-8 พร้อมเปิดใช้งานบน Microsoft Excel ได้ทันที

---

## 5. หน้าต่างวิเคราะห์เชิงลึกและการตั้งชื่อ (Diagnostic Modal & Custom Aliasing)

เมื่อ **คลิกที่การ์ดเซนเซอร์ใบใดก็ได้** หน้าต่างวิเคราะห์เชิงลึก (Diagnostic Modal) จะเปิดขึ้น:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [ICON] CHANNEL // 01 // CHAMBER 01                     [● ONLINE]  [ X ] │
│        MAC: A4:C1:38:00:00:01                                            │
├──────────────────────────────────────────────────────────────────────────┤
│ CUSTOM ALIAS & CHAMBER LABEL                                             │
│ [ Server Rack Main Room A   ] [ CHAMBER 01     ]  [ SAVE ]  [ ↺ ]        │
├──────────────────────────────────────────────────────────────────────────┤
│ [ TEMPERATURE ]    [ HUMIDITY ]    [ POWER CELL ]    [ RF LINK QUALITY ] │
│    27.40°C            61.2%             94%               -53 dBm        │
│ Dew Point: 19.3°C  Vapor: 2.1 kPa  CR2032 · 3.01V    Link Quality: 96%   │
├──────────────────────────────────────────────────────────────────────────┤
│ [ PEAK (24H): 27.96°C ] [ MIN: 26.77°C ] [ AVG: 27.37°C ] [ VAR: ±0.29°C]│
├──────────────────────────────────────────────────────────────────────────┤
│ [ 24H Thermal Timeline ]           │ [ 24H Hygrometric Timeline ]        │
│ (กราฟพื้นที่อุณหภูมิย้อนหลัง)      │ (กราฟพื้นที่ความชื้นย้อนหลัง)       │
├────────────────────────────────────┼─────────────────────────────────────┤
│ [ BLE RSSI RF Telemetry ]          │ [ Power Degradation Timeline ]      │
│ (กราฟคุณภาพสัญญาณ RF)              │ (กราฟความเสถียรของพลังงานแบตเตอรี่) │
└────────────────────────────────────┴─────────────────────────────────────┘
```

### ✏️ วิธีเปลี่ยนชื่อช่องสัญญาณ (In-Place Custom Aliasing):
1. คลิกที่การ์ดเซนเซอร์ที่ต้องการเปลี่ยนชื่อ
2. ในกล่อง **`CUSTOM ALIAS & CHAMBER LABEL`**:
   - ช่องแรก: พิมพ์ชื่ออุปกรณ์ที่ต้องการ (เช่น `Server Rack A`, `Main Refrigerator`, `ตู้แช่ยา 01`)
   - ช่องที่สอง: พิมพ์ชื่อโซน/ห้อง (เช่น `LAB ZONE 1`, `ROOM 204`)
3. กดปุ่ม **`SAVE`**
   - ระบบจะส่งเสียงยืนยัน บันทึกชื่อลง `localStorage` และอัปเดตชื่อในทุกหน้าจอทันที
4. หากต้องการย้อนกลับเป็นชื่อเริ่มต้นของฮาร์ดแวร์ ให้กดปุ่ม **`↺` (Reset)**

### 📊 สถิติเชิงลึก (24H Statistical Insights):
- **PEAK (24H)**: อุณหภูมิสูงสุดที่บันทึกได้ในรอบ 24 ชั่วโมง
- **MIN (24H)**: อุณหภูมิต่ำสุดที่บันทึกได้ในรอบ 24 ชั่วโมง
- **AVG (24H)**: ค่าเฉลี่ยอุณหภูมิตลอด 24 ชั่วโมง
- **VARIANCE**: ค่าความแปรปรวนของอุณหภูมิ (`±X.XX°C`)
- **Dew Point Calculation**: คำนวณจุดน้ำค้างสัมพัทธ์อัตโนมัติ
- **Vapor Pressure Calculation**: คำนวณความดันไอน้ำในอากาศ (`kPa`)

---

## 6. การเชื่อมต่อ MQTT Broker และตั้งค่าระบบ (MQTT Configuration Drawer)

คลิกที่ **ไอคอนฟันเฟือง (⚙️)** ที่มุมขวาบน เพื่อเปิด Settings Drawer:

```
┌──────────────────────────────────────────────┐
│ MQTT Gateway Configuration             [ X ] │
├──────────────────────────────────────────────┤
│ [● CONNECTED] 127.0.0.1:9001                 │
├──────────────────────────────────────────────┤
│ QUICK BROKER PRESETS                         │
│ [ Local Mosquitto ] [ Public EMQX ] [ HiveMQ]│
├──────────────────────────────────────────────┤
│ BROKER CONNECTION                            │
│ Protocol: [ ws:// Plain WebSocket ▼ ]        │
│ Host/IP:  [ 127.0.0.1               ]        │
│ WS Port:  [ 9001 ]   WS Path: [ /mqtt ]      │
├──────────────────────────────────────────────┤
│ CREDENTIALS (OPTIONAL)                       │
│ Username: [         ]  Password: [         ] │
├──────────────────────────────────────────────┤
│ TOPIC ROUTING                                │
│ Topic Prefix: [ home/kc868-a6              ] │
│ Status Topic: [ home/kc868-a6/status       ] │
│ Payload Mode: [ Auto-Detect (ESPHome/JSON)▼] │
├──────────────────────────────────────────────┤
│ [ CONNECT LIVE ]         [ DISCONNECT ]      │
├──────────────────────────────────────────────┤
│ RADAR BACKGROUND OPTICS                      │
│ OPACITY: [========== 55% ]                   │
│ SPEED:   [========== 1.0x]                   │
│ SCALE:   [========== 1.0x]                   │
├──────────────────────────────────────────────┤
│ LIVE TELEMETRY LOG                   [Clear] │
│ [11:05:12] Subscribed to home/kc868-a6/#     │
│ [11:05:14] CH.01: Temp 27.4°C Hum 61.2%      │
└──────────────────────────────────────────────┘
```

### ขั้นตอนการเชื่อมต่อ:
1. **เลือก Broker Preset หรือกรอกเอง**:
   - หากใช้ Mosquitto ในเครื่อง ให้กดปุ่ม **`Local Mosquitto`** (ค่าเริ่มต้น: `ws://127.0.0.1:9001/mqtt`)
   - หากใช้ Cloud Broker สามารถเลือก **`Public EMQX`** หรือ **`Public HiveMQ`** ได้ทันที
2. **ตั้งค่า Topic Prefix**:
   - ค่าเริ่มต้นคือ `home/kc868-a6` (ตรงกับเฟิร์มแวร์ ESPHome ในโปรเจกต์นี้)
3. **กดปุ่ม `CONNECT LIVE`**:
   - หน้าจอจะทำการเชื่อมต่อไปยัง Broker และ Subscribe หัวข้อ `home/kc868-a6/#` อัตโนมัติ
   - แถบสถานะด้านบนจะเปลี่ยนเป็น `CONNECTED` และเริ่มรับข้อมูลจริงทันที

---

## 7. การปรับแต่งพื้นหลัง WebGL Radar (Radar Optics Control)

ใน Settings Drawer ด้านล่าง จะมีตัวปรับแต่งพื้นหลังเรดาร์ 3 แกน:
1. **OPACITY (ความโปร่งแสง)**: ปรับความเข้มของวงแหวนและลำแสงเรดาร์ (0% ถึง 100%)
2. **SWEEP SPEED (ความเร็วรอบหมุน)**: ปรับความเร็วในการหมุนของลำแสงสแกน (0.2x ถึง 2.5x)
3. **SCALE / ZOOM (ขนาดเรดาร์)**: ปรับขนาดความกว้างของวงแหวนเรดาร์ให้พอดีกับขนาดหน้าจอ

> 💡 **ลูกเล่นพิเศษ**: เมื่อขยับเมาส์บนหน้าจอ จุดศูนย์กลางของเรดาร์จะเอียงและขยับตามทิศทางเคอร์เซอร์ (`Mouse Parallax Lerp`) เพิ่มมิติความลึกให้หน้าเว็บ

---

## 8. ระบบจำลองข้อมูลและการรับข้อมูลจริง (Simulation vs Live MQTT)

ระบบรองรับการทำงาน 2 โหมดอย่างชาญฉลาด:

| ฟังก์ชัน | 🔘 โหมดจำลองข้อมูล (Sim: ON) | 🔌 โหมดเชื่อมต่อจริง (MQTT Live) |
|:---|:---|:---|
| **สถานะปุ่ม** | ปุ่มเรืองแสงสีเขียว `Sim: ON` | แถบสถานะด้านบนแสดง `CONNECTED` |
| **การทำงาน** | ระบบจำลองการเปลี่ยนแปลงอุณหภูมิและความชื้นแบบสุ่มตามหลักคณิตศาสตร์ทุก 5 วินาที | รับข้อมูลจริงจากแพ็กเก็ต BLE ที่บอร์ด KC868-A6 ส่งผ่าน MQTT |
| **เมื่อกดปิด (Sim: OFF)** | เข้าสู่ **Clean Standby Mode** (แสดงผล `--°C`, `--%`, `STANDBY` ซ่อนคำว่า Simulation ทั้งหมด) | รับข้อมูลจริงต่อไปอย่างต่อเนื่อง |
| **Watchdog Timeout** | ไม่มี Timeout | หากเซนเซอร์ตัวใดไม่ส่งข้อมูลเกิน 3 นาที ระบบจะเปลี่ยนสถานะเป็น `OFFLINE` อัตโนมัติ |

---

## 9. การแก้ไขปัญหาเบื้องต้น (Troubleshooting & FAQs)

### Q1: กดปุ่ม CONNECT LIVE แล้วขึ้น Connection Error หรือต่อไม่ติด?
- **สาเหตุ 1**: Mosquitto Broker ยังไม่ได้เปิดพอร์ต WebSocket (พอร์ต 9001)
  - **วิธีแก้**: ตรวจสอบไฟล์คอนฟิก `mosquitto.conf` ว่ามี 2 บรรทัดนี้หรือไม่:
    ```conf
    listener 9001
    protocol websockets
    ```
- **สาเหตุ 2**: ใช้เว็บแบบ `https://` แต่ต่อกับ `ws://` (Mixed Content Security)
  - **วิธีแก้**: หากเปิดเว็บผ่าน `http://localhost:8080` ให้ใช้โพรโทคอล `ws://`

### Q2: เซนเซอร์ตัวจริงไม่แสดงค่าบน Dashboard?
- **ตรวจสอบที่ 1**: ตรวจสอบว่า MAC Address ในไฟล์ `packages/sensors.yaml` ตรงกับของ Mijia ตัวจริงหรือไม่
- **ตรวจสอบที่ 2**: ตรวจสอบว่า Topic Prefix ในหน้าเว็บตรงกับในไฟล์ `packages/mqtt.yaml` หรือไม่ (ค่าเริ่มต้นคือ `home/kc868-a6`)
- **ตรวจสอบที่ 3**: เปิดดูในกล่อง **LIVE TELEMETRY LOG** ใน Settings Drawer ว่ามีแพ็กเก็ตส่งเข้ามาหรือไม่

### Q3: ชื่อแชนแนลที่แก้ไขไว้หายไปเมื่อเปิดบนเครื่องอื่น?
- **คำชี้แจง**: ระบบบันทึกชื่อ Custom Alias ลงใน `localStorage` ของเบราว์เซอร์เครื่องนั้น ๆ เพื่อความสะดวกรวดเร็วโดยไม่ต้องพึ่งพาฐานข้อมูลภายนอก

---

*เอกสารฉบับนี้จัดทำขึ้นสำหรับโปรเจกต์ KC868-A6 Mijia 8-Channel Telemetry Bus System*
