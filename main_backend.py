"""
Smart Hospital Central System (Main System) — Laptop 2
------------------------------------------------------

This Flask application is intentionally designed for a *decoupled* IoT architecture:

  - Laptop 1 runs the "Sensor Server" which ONLY emits raw vitals as JSON.
  - Laptop 2 (this app) pulls that data on a fixed interval and performs:
      * business logic (risk evaluation)
      * alerting
      * state management
      * API serving for dashboards / clients

The sensor server never calls into this service. Instead, this service *polls* the sensor
server (pull model). This makes the demo easier to run in unreliable networks: if Laptop 1
is offline, the Main System keeps running and the polling loop simply logs the error and
tries again later.

Endpoints:
  - GET  /live-data  -> latest sensor data merged with ML/risk output
  - GET  /alerts     -> last 50 critical alerts
  - POST /login      -> demo login (hardcoded credentials), returns a mock JWT-like token

Run:
  pip install flask flask-cors requests
  python main_backend.py

Configuration:
  Set SENSOR_SERVER_IP to Laptop 1's IP (recommended):
    - PowerShell:  $env:SENSOR_SERVER_IP="192.168.0.25"
    - Bash:        export SENSOR_SERVER_IP="192.168.0.25"

  The Main System will poll:
    http://<SENSOR_SERVER_IP>:5000/data
"""

from __future__ import annotations

import os
import threading
import time
from typing import Any, Dict, List, Optional

import requests
from flask import Flask, jsonify, request
from flask_cors import CORS


# -----------------------------
# App + CORS (frontend-friendly)
# -----------------------------

app = Flask(__name__)
CORS(app)


# -----------------------------
# Configuration (Sensor Server)
# -----------------------------

SENSOR_SERVER_IP = os.environ.get("SENSOR_SERVER_IP", "").strip()

if SENSOR_SERVER_IP:
    SENSOR_URL = f"http://{SENSOR_SERVER_IP}:5000/data"
else:
    # Placeholder makes the intent visible in logs for demo presentations.
    SENSOR_URL = "http://<SENSOR_SERVER_IP>:5000/data"

POLL_INTERVAL_SECONDS = 1.0
REQUEST_TIMEOUT_SECONDS = 0.8  # keep below the polling interval


# -----------------------------
# Thread-safe global state
# -----------------------------

state_lock = threading.Lock()

# Latest merged state: sensor payload + risk evaluation.
current_patient_data: Dict[str, Any] = {
    "spo2": None,
    "heart_rate": None,
    "bp_sys": None,
    "bp_dia": None,
    "resp_rate": None,
    "temperature": None,
    "glucose": None,
    "map": None,
    "cardiac_output": None,
    "cardiac_index": None,
    "cvp": None,
    "timestamp": None,
    "risk": None,
    "risk_score": None,
    "reason": None,
    "source": {
        "sensor_url": SENSOR_URL,
        "last_fetch_ok": False,
        "last_error": None,
        "last_error_at": None,
    },
}

# Last 50 CRITICAL alerts only (in-memory for demo).
recent_alerts: List[Dict[str, Any]] = []


# -----------------------------
# "ML" Risk Engine (rule-based)
# -----------------------------

def analyze_risk(spo2: int, heart_rate: int) -> Dict[str, Any]:
    """
    Demo risk engine.

    The sensor server produces vitals in roughly these modes:
      - normal:  spo2 95-100, hr 70-90
      - warning: spo2 85-92,  hr 100-120
      - critical:spo2 75-85,  hr 120-140

    We keep logic extremely simple for clarity in presentations.
    """
    if spo2 < 85 or heart_rate > 120:
        return {
            "risk": "CRITICAL",
            "risk_score": 95,
            "reason": "Severe Hypoxia/Tachycardia",
        }
    if 85 <= spo2 <= 92:
        return {
            "risk": "WARNING",
            "risk_score": 60,
            "reason": "Oxygen Saturation Dropping",
        }
    return {
        "risk": "NORMAL",
        "risk_score": 15,
        "reason": "Vitals Stable",
    }


# -----------------------------
# Alerting
# -----------------------------

ANSI_RED = "\033[91m"
ANSI_RESET = "\033[0m"


def _append_alert(alert: Dict[str, Any]) -> None:
    """Append alert to in-memory list and keep only last 50."""
    global recent_alerts
    recent_alerts.append(alert)
    if len(recent_alerts) > 50:
        recent_alerts = recent_alerts[-50:]


def _print_critical_alert(alert: Dict[str, Any]) -> None:
    """Terminal highlight for CRITICAL events (high visibility for demos)."""
    msg = (
        f"[CRITICAL ALERT] ts={alert.get('timestamp')} "
        f"spo2={alert.get('spo2')} hr={alert.get('heart_rate')} "
        f"reason={alert.get('reason')}"
    )
    print(f"{ANSI_RED}{msg}{ANSI_RESET}")


# -----------------------------
# Polling loop (daemon thread)
# -----------------------------

def polling_loop() -> None:
    """
    Background polling loop:
      - Every 1.0 second, fetch JSON from Sensor Server
      - Merge into global state
      - Run risk engine
      - Trigger alert if CRITICAL

    IMPORTANT (decoupled design):
      This loop must never crash the whole application if Laptop 1 is offline.
      Instead, it logs the error and keeps trying.
    """
    while True:
        started_at = time.time()
        now_ts = int(time.time())

        try:
            resp = requests.get(SENSOR_URL, timeout=REQUEST_TIMEOUT_SECONDS)
            resp.raise_for_status()
            payload = resp.json()

            # Sensor payload (new version) includes many vitals + ISO timestamp string.
            spo2 = int(payload.get("spo2"))
            heart_rate = int(payload.get("heart_rate"))
            timestamp = str(payload.get("timestamp", now_ts))

            bp_sys = payload.get("bp_sys")
            bp_dia = payload.get("bp_dia")
            resp_rate = payload.get("resp_rate")
            temperature = payload.get("temperature")
            glucose = payload.get("glucose")
            map_value = payload.get("map")
            cardiac_output = payload.get("cardiac_output")
            cardiac_index = payload.get("cardiac_index")
            cvp = payload.get("cvp")

            risk_result = analyze_risk(spo2=spo2, heart_rate=heart_rate)

            with state_lock:
                current_patient_data.update(
                    {
                        "spo2": spo2,
                        "heart_rate": heart_rate,
                        "bp_sys": bp_sys,
                        "bp_dia": bp_dia,
                        "resp_rate": resp_rate,
                        "temperature": temperature,
                        "glucose": glucose,
                        "map": map_value,
                        "cardiac_output": cardiac_output,
                        "cardiac_index": cardiac_index,
                        "cvp": cvp,
                        "timestamp": timestamp,
                        **risk_result,
                        "source": {
                            "sensor_url": SENSOR_URL,
                            "last_fetch_ok": True,
                            "last_error": None,
                            "last_error_at": None,
                        },
                    }
                )

                # Alerting is a business-logic responsibility of the Main System.
                if risk_result["risk"] == "CRITICAL":
                    alert = {
                        "timestamp": timestamp,
                        "spo2": spo2,
                        "heart_rate": heart_rate,
                        "reason": risk_result["reason"],
                        "risk_score": risk_result["risk_score"],
                    }
                    _append_alert(alert)
                    _print_critical_alert(alert)

        except requests.exceptions.RequestException as e:
            # Sensor Server is offline / network issue / timeout.
            # Do not crash. Log and keep polling.
            print(f"[polling] Sensor fetch failed: {e}")
            with state_lock:
                current_patient_data["source"] = {
                    "sensor_url": SENSOR_URL,
                    "last_fetch_ok": False,
                    "last_error": str(e),
                    "last_error_at": now_ts,
                }

        except (ValueError, TypeError) as e:
            # Malformed payload from Sensor Server: treat as non-fatal and retry next cycle.
            print(f"[polling] Invalid sensor payload: {e}")
            with state_lock:
                current_patient_data["source"] = {
                    "sensor_url": SENSOR_URL,
                    "last_fetch_ok": False,
                    "last_error": f"Invalid payload: {e}",
                    "last_error_at": now_ts,
                }

        # Sleep to maintain ~1.0s cadence
        elapsed = time.time() - started_at
        remaining = POLL_INTERVAL_SECONDS - elapsed
        if remaining > 0:
            time.sleep(remaining)


def start_background_thread() -> None:
    t = threading.Thread(target=polling_loop, name="sensor-poller", daemon=True)
    t.start()


# -----------------------------
# REST API
# -----------------------------

@app.get("/live-data")
def get_live_data():
    """
    Returns current global state:
      - latest sensor vitals
      - latest risk engine output
      - sensor connection metadata (last error, etc.)
    """
    with state_lock:
        snapshot = dict(current_patient_data)
        # deep copy nested 'source' dict to avoid mutation races
        snapshot["source"] = dict(current_patient_data.get("source", {}))
    return jsonify(snapshot)


@app.get("/alerts")
def get_alerts():
    """Returns up to the last 50 CRITICAL alerts."""
    with state_lock:
        alerts_snapshot = list(recent_alerts)
    return jsonify({"count": len(alerts_snapshot), "alerts": alerts_snapshot})


@app.post("/login")
def login():
    """
    Demo auth endpoint.
    For presentations, we hardcode a single credential:
      username: admin_nurse
      password: smartbed2026
    """
    data: Optional[Dict[str, Any]] = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Expected JSON body"}), 400

    username = str(data.get("username", ""))
    password = str(data.get("password", ""))

    if username == "admin_nurse" and password == "smartbed2026":
        # This is NOT a real JWT. It's a mock token for UI demos.
        token = f"mock.jwt.{int(time.time())}"
        return jsonify({"token": token, "token_type": "Bearer"}), 200

    return jsonify({"error": "Invalid credentials"}), 401


# -----------------------------
# Entrypoint
# -----------------------------

if __name__ == "__main__":
    print(f"[main] Smart Hospital Central System starting on :5001")
    print(f"[main] Polling sensor server at: {SENSOR_URL}")
    if "<SENSOR_SERVER_IP>" in SENSOR_URL:
        print(
            "[main] WARNING: SENSOR_SERVER_IP is not set. "
            "Set env var SENSOR_SERVER_IP to Laptop 1's IP."
        )

    start_background_thread()

    # Flask dev server is enough for demos; for production use gunicorn/uwsgi.
    app.run(host="0.0.0.0", port=5001, debug=False)

