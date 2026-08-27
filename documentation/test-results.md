# Test Results — KC868-A6 Mijia 8 MQTT Dashboard

## Test Case Summary

| Test ID | รายละเอียด | Expected Result | ผลทดสอบ | วันที่ | หมายเหตุ |
|:-------:|:-----------|:----------------|:-------:|:------:|:---------|
| T01 | Scan Mijia #1 | พบ MAC | ☐ Pass ☐ Fail | ____/____/____ | |
| T02 | Scan Mijia #1–#8 | พบครบ 8 ตัว | ☐ Pass ☐ Fail | ____/____/____ | |
| T03 | ตรวจ MAC ไม่ซ้ำ | MAC ไม่ซ้ำกัน | ☐ Pass ☐ Fail | ____/____/____ | |
| T04 | อ่าน Temperature | ได้ค่าครบ 8 ตัว | ☐ Pass ☐ Fail | ____/____/____ | |
| T05 | อ่าน Humidity | ได้ค่าครบ 8 ตัว | ☐ Pass ☐ Fail | ____/____/____ | |
| T06 | อ่าน Battery | ได้ค่าครบ 8 ตัว | ☐ Pass ☐ Fail | ____/____/____ | |
| T07 | อ่าน RSSI | ได้ค่าครบ 8 ตัว | ☐ Pass ☐ Fail | ____/____/____ | |
| T08 | MQTT Publish | ส่งข้อมูลครบ 8 ตัว | ☐ Pass ☐ Fail | ____/____/____ | |
| T09 | MQTT Reconnect | เชื่อมต่อกลับได้ | ☐ Pass ☐ Fail | ____/____/____ | |
| T10 | MQTT Discovery | Entities ถูกสร้างใน HA | ☐ Pass ☐ Fail | ____/____/____ | |
| T11 | Dashboard | แสดงข้อมูลครบ | ☐ Pass ☐ Fail | ____/____/____ | |
| T12 | Sensor Offline | ตรวจพบ Offline | ☐ Pass ☐ Fail | ____/____/____ | |
| T13 | Distance Test | บันทึก RSSI ตามระยะ | ☐ Pass ☐ Fail | ____/____/____ | |
| T14 | 8 Sensors พร้อมกัน | ไม่มีข้อมูลสลับกัน | ☐ Pass ☐ Fail | ____/____/____ | |

---

## Phase 1 — BLE Discovery Results

| Mijia | MAC Address | Model/BLE Name | RSSI (dBm) | สถานะ |
|:-----:|:------------|:---------------|:----------:|:-----:|
| #1 | | | | |
| #2 | | | | |
| #3 | | | | |
| #4 | | | | |
| #5 | | | | |
| #6 | | | | |
| #7 | | | | |
| #8 | | | | |

---

## Phase 3 — Individual Sensor Test

| Mijia | Temperature | Humidity | Battery | RSSI | สถานะ |
|:-----:|:-----------:|:--------:|:-------:|:----:|:-----:|
| #1 | ____°C | ____% | ____% | ____ dBm | ☐ Pass |
| #2 | ____°C | ____% | ____% | ____ dBm | ☐ Pass |
| #3 | ____°C | ____% | ____% | ____ dBm | ☐ Pass |
| #4 | ____°C | ____% | ____% | ____ dBm | ☐ Pass |
| #5 | ____°C | ____% | ____% | ____ dBm | ☐ Pass |
| #6 | ____°C | ____% | ____% | ____ dBm | ☐ Pass |
| #7 | ____°C | ____% | ____% | ____ dBm | ☐ Pass |
| #8 | ____°C | ____% | ____% | ____ dBm | ☐ Pass |

---

## Phase 4 — 8 Sensors Simultaneous Test

| รายการทดสอบ | ผล | หมายเหตุ |
|:-----------|:---:|:---------|
| MAC ครบ 8 ตัว | ☐ Pass ☐ Fail | |
| Temperature ครบ 8 | ☐ Pass ☐ Fail | |
| Humidity ครบ 8 | ☐ Pass ☐ Fail | |
| Battery ครบ 8 | ☐ Pass ☐ Fail | |
| ไม่มีข้อมูลสลับกัน | ☐ Pass ☐ Fail | |
| Wi-Fi ยังเชื่อมต่อปกติ | ☐ Pass ☐ Fail | ⚠️ BLE/Wi-Fi coexistence |

---

## Phase 7 — Distance Test

| Sensor | ระยะ | RSSI (dBm) | Packet Reception (%) | Update Interval | สถานะ |
|:------:|:----:|:----------:|:--------------------:|:---------------:|:-----:|
| #1 | 1 m | | | | |
| #1 | 3 m | | | | |
| #1 | 5 m | | | | |
| #1 | 10 m | | | | |
| #1 | ผ่านผนัง | | | | |
| | | | | | |
| #8 | 1 m | | | | |
| #8 | 3 m | | | | |
| #8 | 5 m | | | | |
| #8 | 10 m | | | | |
| #8 | ผ่านผนัง | | | | |

---

## Phase 8 — MQTT Test

| Sensor | Topic | JSON Payload ถูกต้อง | Retain ทำงาน | QoS 1 ส่งสำเร็จ | สถานะ |
|:------:|:------|:--------------------:|:------------:|:----------------:|:-----:|
| #01 | home/kc868-a6/sensor/mijia_01_temperature/state | ☐ | ☐ | ☐ | |
| #02 | home/kc868-a6/sensor/mijia_02_temperature/state | ☐ | ☐ | ☐ | |
| #03 | home/kc868-a6/sensor/mijia_03_temperature/state | ☐ | ☐ | ☐ | |
| #04 | home/kc868-a6/sensor/mijia_04_temperature/state | ☐ | ☐ | ☐ | |
| #05 | home/kc868-a6/sensor/mijia_05_temperature/state | ☐ | ☐ | ☐ | |
| #06 | home/kc868-a6/sensor/mijia_06_temperature/state | ☐ | ☐ | ☐ | |
| #07 | home/kc868-a6/sensor/mijia_07_temperature/state | ☐ | ☐ | ☐ | |
| #08 | home/kc868-a6/sensor/mijia_08_temperature/state | ☐ | ☐ | ☐ | |

---

## Data Collection Log

| เวลา | Sensor | MAC | Temp (°C) | Humidity (%) | Battery (%) | RSSI (dBm) | MQTT | Status |
|:-----|:------:|:----|:---------:|:------------:|:-----------:|:----------:|:----:|:------:|
| | #1 | | | | | | | |
| | #2 | | | | | | | |
| | #3 | | | | | | | |
| | #4 | | | | | | | |
| | #5 | | | | | | | |
| | #6 | | | | | | | |
| | #7 | | | | | | | |
| | #8 | | | | | | | |

---

## สรุปผลการทดลอง

### ข้อค้นพบ
1. 
2. 
3. 

### ข้อจำกัดที่พบ
1. 
2. 
3. 

### ข้อเสนอแนะ
1. 
2. 
3. 
