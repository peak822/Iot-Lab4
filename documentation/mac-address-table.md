# MAC Address Table — Mijia Sensors

## วิธีบันทึก MAC Address

1. Flash `kc868_a6_ble_scan.yaml` ลง KC868-A6
2. เปิด ESPHome Log / Serial Monitor
3. เปิด Mijia ทีละตัว → บันทึก MAC ที่ปรากฏ
4. ปิด Mijia → ยืนยันว่า MAC หายไป
5. เปิดกลับ → ยืนยันว่า MAC กลับมา
6. บันทึก Model Name จาก BLE Name ใน Log (สำคัญ! ใช้เลือก platform ใน YAML)

---

## ตาราง MAC Address

| ID | Model | MAC Address | Bindkey | RSSI | ยืนยัน ON/OFF | หมายเหตุ |
|:---:|:------|:------------|:--------|-----:|:--------------:|:---------|
| 01 | _________________ | `__:__:__:__:__:__` | ________________________________ | _____ | ☐ | |
| 02 | _________________ | `__:__:__:__:__:__` | ________________________________ | _____ | ☐ | |
| 03 | _________________ | `__:__:__:__:__:__` | ________________________________ | _____ | ☐ | |
| 04 | _________________ | `__:__:__:__:__:__` | ________________________________ | _____ | ☐ | |
| 05 | _________________ | `__:__:__:__:__:__` | ________________________________ | _____ | ☐ | |
| 06 | _________________ | `__:__:__:__:__:__` | ________________________________ | _____ | ☐ | |
| 07 | _________________ | `__:__:__:__:__:__` | ________________________________ | _____ | ☐ | |
| 08 | _________________ | `__:__:__:__:__:__` | ________________________________ | _____ | ☐ | |

### ตัวอย่างรุ่น Mijia และ Platform Name

| BLE Name / Model | ESPHome Platform | ต้องใช้ Bindkey? |
|:------------------|:-----------------|:----------------:|
| LYWSDCGQ | `xiaomi_lywsdcgq` | ไม่ |
| LYWSD03MMC | `xiaomi_lywsd03mmc` | ใช่ |
| LYWSD02 | `xiaomi_lywsd02` | ไม่ |
| CGG1 | `xiaomi_cgg1` | ขึ้นกับ firmware |
| CGDK2 | `xiaomi_cgdk2` | ใช่ |

---

## Checklist

- [ ] MAC ทั้ง 8 ตัวไม่ซ้ำกัน
- [ ] บันทึก Model ของแต่ละตัวครบ
- [ ] ทดสอบ ON/OFF ยืนยัน MAC แต่ละตัวครบ
- [ ] บันทึก Bindkey (ถ้าจำเป็น) ครบ
- [ ] อัพเดท MAC/Bindkey ลงใน `esphome/packages/sensors.yaml` แล้ว

---

## วิธีหา Bindkey สำหรับ LYWSD03MMC

สำหรับ Mijia รุ่น LYWSD03MMC ที่ใช้ encrypted advertisement:

1. ใช้แอป **Xiaomi Home** (Mi Home) จับคู่ sensor กับบัญชี Xiaomi
2. ใช้เครื่องมือ **TelinkFlasher** (https://pvvx.github.io/ATC_MiThermometer/TelinkMiFlasher.html) ผ่าน Web Bluetooth:
   - เชื่อมต่อกับ sensor
   - กด "Do Activation" เพื่อดึง bindkey
   - บันทึก bindkey (32 ตัวอักษร hex)
3. หรือใช้ custom firmware **ATC/PVVX** เพื่อปิด encryption และไม่ต้องใช้ bindkey
