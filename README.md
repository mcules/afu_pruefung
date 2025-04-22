# 📡 AFU Prüfungstool

Ein interaktives Lern- und Prüfungswerkzeug für angehende Funkamateure in Deutschland. Dieses Tool hilft dir, dich effizient auf die Amateurfunkprüfung (E, A, B) vorzubereiten – mit aktuellen Fragen, Bildern und praktischen Features.

> ⚠️ **Hinweis:** Dieses Projekt befindet sich noch in der Entwicklung (Work in Progress).

---

## ✨ Features

- ✅ **Alle offiziellen Prüfungsfragen** nach Klasse N, E und A
- 🖼️ **Darstellung der zugehörigen Bilder und SVGs**
- 🔍 **Fragensuche** und gezieltes Lernen nach Themengebieten
- 📊 **Statistiken** zum Lernfortschritt
- 📁 **Offline-Nutzung möglich** (lokales Hosting)
- 📱 **Responsive Web-App** – nutzbar auf Desktop, Tablet und Smartphone

---

## 🚀 Schnellstart

### Voraussetzungen

- Node.js ≥ 18
- pnpm (alternativ: npm oder yarn)
- Git

### Installation

```bash
git clone https://github.com/mcules/afu_pruefung.git
cd afu_pruefung
pnpm install
pnpm dev
```

Die App ist danach unter `http://localhost:5173` erreichbar.

---

## 📂 Projektstruktur

```plaintext
afu_pruefung/
├── public/              # Öffentliche Assets (inkl. Bilder/SVGs)
├── src/
│   ├── components/      # UI-Komponenten
│   ├── data/            # Fragenkatalog & Metadaten
│   ├── pages/           # Routenseiten (z. B. Start, Quiz, Statistik)
│   └── utils/           # Hilfsfunktionen
├── README.md
└── ...
```

---

## 🖼️ Bilder & Medien

Die Bilder und SVGs stammen aus dem offiziellen Fragenkatalog und werden lokal eingebunden. Details zur Struktur und Herkunft findest du in der [README im `public/` Verzeichnis](./public/README.txt).

---

## 🧠 Datenquelle

Die Fragen basieren auf dem offiziellen Katalog der Bundesnetzagentur. Der Katalog und die dazugehörigen Medien wurden maschinell aufbereitet und strukturiert.

---

## 📦 Deployment

Für ein Deployment auf deinem eigenen Server:

```bash
pnpm build
pnpm preview
```

Optional: Containerisierung mit Docker folgt in Kürze.

---

## 📣 Mitmachen

Fehler entdeckt oder Verbesserungsideen? PRs und Issues sind herzlich willkommen!  
👉 [Issues & Diskussion](https://github.com/mcules/afu_pruefung/issues)

---

## 📄 Lizenz

MIT License – frei nutzbar und veränderbar.

---

## 🙌 Danke

Ein Projekt von [@mcules](https://github.com/mcules) und der Open-Source-Community – für alle, die auf die Frequenzen wollen!