# 🔋 EcoFlow Portal Bot

Ein automatisierter Bot auf Basis von [Playwright](https://playwright.dev/), der dauerhaft im EcoFlow User-Portal eingeloggt bleibt und optional einen Healthcheck-Dienst (z. B. Uptime Kuma) in regelmäßigen Abständen benachrichtigt.

---

## 📦 Inhalt

| Datei | Beschreibung |
|---|---|
| `bot.js` | Hauptbot – Login, Session-Management, Loop |
| `healthcheck.js` | Optionaler Healthcheck-Pinger |
| `Dockerfile` | Container-Build auf Playwright-Basis |
| `docker-compose.yml` | Deployment-Konfiguration |

---

## 🚀 Quickstart

### 1. Volume anlegen

```bash
docker volume create ecoflow-bot
```

### 2. `docker-compose.yml` anpassen

Trage deine Zugangsdaten und optionale Einstellungen ein:

```yaml
environment:
  - ECOFLOW_EMAIL=deine@email.de
  - ECOFLOW_PASSWORD=deinPasswort
```

### 3. Container starten

```bash
docker compose up -d --build
```

### 4. Logs prüfen

```bash
docker compose logs -f
```

---

## ⚙️ Umgebungsvariablen

| Variable | Pflicht | Standard | Beschreibung |
|---|---|---|---|
| `ECOFLOW_EMAIL` | ✅ | – | E-Mail-Adresse des EcoFlow-Accounts |
| `ECOFLOW_PASSWORD` | ✅ | – | Passwort des EcoFlow-Accounts |
| `ECOFLOW_PORTAL_URL` | ❌ | `https://user-portal.ecoflow.com/user/eu/de/login` | Login-URL (z. B. für andere Regionen anpassbar) |
| `HEALTHCHECK_URL` | ❌ | – | URL die nach jedem Intervall gepingt wird (z. B. Uptime Kuma) |
| `HEALTHCHECK_INTERVAL_MIN` | ❌ | `5` | Intervall des Healthchecks in Minuten |
| `SCREENSHOT_RETENTION_DAYS` | ❌ | `5` | Aufbewahrungsdauer von Screenshots in Tagen |

> ⚠️ Wird `HEALTHCHECK_URL` nicht gesetzt, beendet sich `healthcheck.js` automatisch und der Bot läuft normal weiter.

---

## 🗂️ Volumes

Das Volume `ecoflow-bot` wird als externer Docker-Volume eingebunden und unter `/app` gemountet. Dort werden gespeichert:

- `session.json` – die gespeicherte Browser-Session
- `/app/screenshots/` – Debug-Screenshots (werden automatisch nach `SCREENSHOT_RETENTION_DAYS` Tagen gelöscht)

---

## 🐛 Debugging

Der Bot erstellt automatisch Screenshots bei folgenden Ereignissen:

| Dateiname | Zeitpunkt |
|---|---|
| `login_before_fill_*.png` | Vor dem Ausfüllen des Login-Formulars |
| `login_after_fill_*.png` | Nach dem Ausfüllen |
| `login_after_click_*.png` | Nach dem Klick auf „Anmelden" |
| `login_success_*.png` | Nach erfolgreichem Login |
| `logout_*.png` | Wenn ein Logout erkannt wird |
| `error_*.png` | Bei unerwarteten Fehlern |

Screenshots sind über das Volume zugänglich:

```bash
docker cp ecoflow-bot:/app/screenshots ./screenshots
```

---

## 🔄 Funktionsweise

```
Start
 ├─ session.json vorhanden? → Session laden, Login überspringen
 └─ Kein Session? → Login durchführen & session.json speichern

Loop (alle 30 Sekunden)
 ├─ Noch eingeloggt? → weiter warten
 └─ Ausgeloggt erkannt?
      ├─ Login erneut versuchen (max. 3x)
      └─ Fehlgeschlagen? → Neue Browser-Seite erstellen & erneut versuchen
```

---

## 🛠️ Technischer Stack

| Technologie | Version |
|---|---|
| Node.js | via Playwright-Image (Jammy) |
| Playwright | `^1.58.2` |
| node-fetch | `^2.6.7` |
| Basis-Image | `mcr.microsoft.com/playwright:v1.58.2-jammy` |

---

## 📝 Hinweise

- Der Bot läuft im **headless Chromium**-Modus, Xvfb wird für einen virtuellen Display verwendet
- Die `session.json` wird nach erfolgreichem Login automatisch gespeichert und bei Neustart wiederverwendet
- Das Portal erkennt unter Umständen headless Browser – bei Login-Problemen die Screenshots unter `/app/screenshots` prüfen

## ⚠️ Disclaimer

Dieses Projekt ist ein inoffizielles Community-Projekt und steht in keiner 
Verbindung zur EcoFlow Technology Co., Ltd. Es wird weder von EcoFlow 
unterstützt, gesponsert noch offiziell bereitgestellt. Die Nutzung erfolgt 
auf eigene Verantwortung. EcoFlow und alle zugehörigen Markennamen sind 
Eigentum der EcoFlow Technology Co., Ltd.
