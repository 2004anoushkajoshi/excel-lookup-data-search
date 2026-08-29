# OmniParse - Privacy-First Local Excel Phone Directory Search

A sleek, 100% client-side web application to look up contact information inside large Excel or CSV directory files. 

**Created by**: Anoushka Joshi (anoushka.joshi2004@gmail.com)

---

## 🔒 Privacy & Security Model

This application is designed with a strict **zero-trust, offline-first** architecture:
* **100% In-Browser Execution**: Excel files are parsed and searched locally in your browser's transient memory (`ArrayBuffer`). No data is ever uploaded to a database or sent to a server.
* **Verified Offline Capability**: Since the SheetJS parsing engine is bundled locally in the repository (`lib/xlsx.full.min.js`), the tool can run completely offline. You can load the site, disconnect your internet connection, and perform searches normally.
* **Privacy Shield Monitor**: Built-in visual sandbox console logs and blocks outbound network requests (`fetch`/`XMLHttpRequest`) to verify no outbound data leaks occur.
* **Transient Storage**: As soon as you refresh or close the tab, all cached Excel records are permanently wiped from your browser memory.

---

## 🚀 Key Features

* **Instant Search**: Normalizes and matches phone numbers regardless of formatting (strips spaces, dashes, parentheses, or country codes to ensure correct matches).
* **Multi-Column Search**: Searches across all columns simultaneously to find your query.
* **Web Worker Engine**: Runs parsing and matching in a background thread, preventing browser freeze even when handling files with **100,000+ records**.
* **One-Click Clipboard Export**: Easily copy matched details to your clipboard with a single click.

---

## 💻 Running Locally

You can run this application locally on your machine:

### Option 1: Python HTTP Server
Open your terminal in the repository folder and run:
```bash
python -m http.server 8080
```
Then open your browser to **[http://localhost:8080](http://localhost:8080)**.

### Option 2: VS Code Live Server Extension
1. Install the **Live Server** extension (by Ritwick Dey) in VS Code.
2. Right-click `index.html` and select **Open with Live Server**.
