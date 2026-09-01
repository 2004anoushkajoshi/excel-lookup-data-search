# GlanceX - Zero-Transmission Directory Engine & Shared Sheet System

👉 **Live Application Link**: **[https://glancex.onrender.com/](https://glancex.onrender.com/)**

A powerful, privacy-first web application to look up contact information inside large Excel and CSV directory files, supporting both **Independent Local Sandbox Mode** and **Centralized Shared Directory Mode**.

**Created by**: Anoushka Joshi (anoushka.joshi2004@gmail.com)

---

## 🔒 Security & Privacy Architecture

GlanceX is built on a strict **zero-trust, dual-mode** architecture:

* **Independent Mode (100% In-Browser Execution)**:
  - Excel files are parsed and searched locally in browser memory (`ArrayBuffer` & Web Workers). 
  - **Zero Data Transmission**: No search queries or file bytes ever leave your device.
* **Dependent Mode (Centralized Shared Sheets)**:
  - **AES-256-GCM Military-Grade Encryption**: Admin shared directory files are encrypted at rest before storing in MongoDB Atlas.
  - **JWT Authentication & Role Control**: Multi-user directory permissions with Admin control panel.
  - **Auto Expiry & Purge**: Scheduled file visibility expiration rules.
* **Active Privacy Shield Network Monitor**:
  - Hooks `window.fetch` and `XMLHttpRequest` in real-time to monitor outgoing payloads.
  - Intercepts, logs, and blocks any unauthorized byte leaks live in the UI.

---

## 🚀 Key Features

* **Visual 4-Stage Upload Progress Bar**: Real-time percentage tracking for file byte uploading, AES-256 encryption, and Web Worker row indexing.
* **Smart Phone Lookup**: Flexibly matches numbers of any length (7 to 15+ digits), automatically handling country codes, spaces, dashes, and formatting.
* **Web Worker Engine**: Runs parsing and matching in a background thread, preventing browser freeze even when handling **900,000+ records**.
* **De-Cluttered Modern UI**: Sleek glassmorphism interface with inline file controls, rotating red cross reset actions, and horizontal feature ribbons.

---

## 🌐 Live Deployment & Continuous Integration

This repository branch (`v2-enhanced-version`) is connected to **Render Cloud Hosting**:
* **Live Site**: [https://glancex.onrender.com/](https://glancex.onrender.com/)
* **Continuous Deployment**: Every commit pushed to `v2-enhanced-version` automatically builds and updates the live website.

---

## 💻 Running Locally

You can run this application locally on your machine:

```bash
# 1. Install dependencies
npm install

# 2. Start GlanceX Server
node server.js
```
Then open your browser to **[http://localhost:8080](http://localhost:8080)**.
