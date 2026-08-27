#!/usr/bin/env python3
"""
KC868-A6 + Mijia 8 Sensors — MQTT Mock Data Publisher
═════════════════════════════════════════════════════
สคริปต์จำลองการส่งข้อมูล MQTT จาก KC868-A6 ไปยัง MQTT Broker
เพื่อทดสอบการทำงานของ Web Dashboard และ Home Assistant โดยไม่ต้องมีฮาร์ดแวร์จริง

การติดตั้ง library ที่จำเป็น:
    pip install paho-mqtt

วิธีรัน:
    python tools/mock_mqtt_publisher.py --host 127.0.0.1 --port 1883
"""

import time
import json
import random
import argparse
import sys

try:
    import paho.mqtt.client as mqtt
except ImportError:
    print("⚠️ กรุณาติดตั้ง paho-mqtt ก่อนด้วยคำสั่ง:")
    print("   pip install paho-mqtt")
    print("\nกำลังรันในโหมดสาธิตแบบจำลอง (Demo Console Only)...")
    mqtt = None

SENSORS = [
    {"id": 1, "name": "mijia_01", "mac": "A4:C1:38:00:00:01", "temp": 27.3, "hum": 61.0, "bat": 94, "rssi": -52},
    {"id": 2, "name": "mijia_02", "mac": "A4:C1:38:00:00:02", "temp": 26.8, "hum": 59.0, "bat": 88, "rssi": -55},
    {"id": 3, "name": "mijia_03", "mac": "A4:C1:38:00:00:03", "temp": 28.1, "hum": 64.0, "bat": 91, "rssi": -48},
    {"id": 4, "name": "mijia_04", "mac": "A4:C1:38:00:00:04", "temp": 27.7, "hum": 60.0, "bat": 85, "rssi": -61},
    {"id": 5, "name": "mijia_05", "mac": "A4:C1:38:00:00:05", "temp": 27.0, "hum": 63.0, "bat": 90, "rssi": -57},
    {"id": 6, "name": "mijia_06", "mac": "A4:C1:38:00:00:06", "temp": 28.5, "hum": 65.0, "bat": 77, "rssi": -63},
    {"id": 7, "name": "mijia_07", "mac": "A4:C1:38:00:00:07", "temp": 26.9, "hum": 58.0, "bat": 79, "rssi": -50},
    {"id": 8, "name": "mijia_08", "mac": "A4:C1:38:00:00:08", "temp": 27.8, "hum": 62.0, "bat": 81, "rssi": -58},
]

def main():
    parser = argparse.ArgumentParser(description="Simulate KC868-A6 MQTT Publisher for Mijia Sensors")
    parser.add_argument("--host", default="127.0.0.1", help="MQTT Broker Host / IP (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=1883, help="MQTT Broker Port (default: 1883)")
    parser.add_argument("--prefix", default="home/kc868-a6", help="Topic Prefix (default: home/kc868-a6)")
    parser.add_argument("--interval", type=float, default=5.0, help="Publish interval in seconds (default: 5.0)")
    parser.add_argument("--format", choices=["both", "esphome", "json"], default="both", help="Publish format")
    args = parser.parse_args()

    if mqtt is None:
        print("❌ ไม่สามารถเชื่อมต่อ Broker ได้เนื่องจากไม่มี library paho-mqtt")
        return

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2 if hasattr(mqtt, 'CallbackAPIVersion') else None, "kc868_mock_publisher")
    
    # Configure Birth / Will message
    status_topic = f"{args.prefix}/status"
    client.will_set(status_topic, payload="offline", qos=1, retain=True)

    print(f"🔌 Connecting to MQTT Broker {args.host}:{args.port}...")
    try:
        client.connect(args.host, args.port, 60)
        client.loop_start()
        # Publish Online status
        client.publish(status_topic, payload="online", qos=1, retain=True)
        print(f"✅ Connected! Published gateway status: online -> {status_topic}")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print(f"💡 ตรวจสอบว่า Mosquitto กำลังรันอยู่ที่ {args.host}:{args.port}")
        return

    print(f"📡 Publishing mock data every {args.interval}s (Press Ctrl+C to stop)...")
    round_count = 0

    try:
        while True:
            round_count += 1
            print(f"\n--- Round #{round_count} [{time.strftime('%H:%M:%S')}] ---")

            for s in SENSORS:
                # Slight random fluctuation
                s["temp"] = round(s["temp"] + (random.random() - 0.5) * 0.4, 1)
                s["hum"] = round(max(20.0, min(95.0, s["hum"] + (random.random() - 0.5) * 0.8)), 1)
                s["rssi"] = int(max(-90, min(-30, s["rssi"] + random.randint(-2, 2))))
                if random.random() < 0.05:
                    s["bat"] = max(0, s["bat"] - 1)

                num_str = f"{s['id']:02d}"

                # 1. ESPHome discrete format
                if args.format in ["both", "esphome"]:
                    t_temp = f"{args.prefix}/sensor/mijia_{num_str}_temperature/state"
                    t_hum = f"{args.prefix}/sensor/mijia_{num_str}_humidity/state"
                    t_bat = f"{args.prefix}/sensor/mijia_{num_str}_battery/state"
                    t_rssi = f"{args.prefix}/sensor/mijia_{num_str}_rssi/state"

                    client.publish(t_temp, str(s["temp"]), qos=1, retain=True)
                    client.publish(t_hum, str(s["hum"]), qos=1, retain=True)
                    client.publish(t_bat, str(s["bat"]), qos=1, retain=True)
                    client.publish(t_rssi, str(s["rssi"]), qos=1, retain=True)

                # 2. JSON state format
                if args.format in ["both", "json"]:
                    json_topic = f"{args.prefix}/mijia/{num_str}/state"
                    json_payload = json.dumps({
                        "temperature": s["temp"],
                        "humidity": s["hum"],
                        "battery": s["bat"],
                        "rssi": s["rssi"]
                    })
                    client.publish(json_topic, json_payload, qos=1, retain=True)

                print(f"  Mijia #{num_str}: {s['temp']}°C | {s['hum']}% | Bat {s['bat']}% | RSSI {s['rssi']} dBm")

            time.sleep(args.interval)

    except KeyboardInterrupt:
        print("\n🛑 Stopping publisher...")
        client.publish(status_topic, payload="offline", qos=1, retain=True)
        client.loop_stop()
        client.disconnect()
        print("Done.")

if __name__ == "__main__":
    main()
