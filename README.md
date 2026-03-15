# EcoFlow-Bot

Automatisierter Bot für das EcoFlow User-Portal, inkl. Screenshot-Management und optionalem Healthcheck.

---

## 1. Voraussetzungen

- Docker ≥ 20.x  
- Docker Compose ≥ 2.x  

---

## 2. Installation / Build

1. Repository klonen oder Dateien in ein Verzeichnis legen.  
2. Docker Image bauen:

```bash
docker-compose build
````

---

## 3. Konfiguration (Environment-Variablen)

Alle Variablen werden in der `docker-compose.yml` gesetzt:

| Variable                    | Beschreibung                                              | Standard / Beispiel           |
| --------------------------- | --------------------------------------------------------- | ----------------------------- |
| `ECOFLOW_EMAIL`             | Login E-Mail für EcoFlow Portal                           | `MAILADRESSE`                 |
| `ECOFLOW_PASSWORD`          | Passwort für EcoFlow Portal                               | `PASSWORT`                    |
| `HEALTHCHECK_URL`           | Optional: URL, die der Healthcheck alle X Minuten aufruft | `https://example.com/trigger` |
| `HEALTHCHECK_INTERVAL_MIN`  | Optional: Intervall für Healthcheck in Minuten            | `5`                           |
| `SCREENSHOT_RETENTION_DAYS` | Anzahl Tage, alte Screenshots aufzubewahren               | `5`                           |

> Hinweis: Healthcheck wird nur aktiviert, wenn `HEALTHCHECK_URL` gesetzt ist.

---

## 4. Start des Bots

```bash
docker-compose up -d
```

* Der Bot läuft **ständig im Hintergrund**.
* Healthcheck läuft **parallel**, falls konfiguriert.
* Screenshots werden in `/app/screenshots` gespeichert.

---

## 5. Logs ansehen

```bash
docker-compose logs -f ecoflow-bot
```

* Hier siehst du: Login-Prozesse, Healthcheck-Status, Screenshots und eventuelle Fehler.

---

## 6. Healthcheck

* Optional: ruft eine URL ab, **alle X Minuten**, nur wenn der Bot korrekt eingeloggt ist.
* Aktiviert über: `HEALTHCHECK_URL` und `HEALTHCHECK_INTERVAL_MIN`.
* Deaktiviert, wenn `HEALTHCHECK_URL` leer ist.

---

## 7. Screenshot-Retention

* Alte Screenshots werden automatisch nach `SCREENSHOT_RETENTION_DAYS` gelöscht.
* Konfigurierbar über ENV: `SCREENSHOT_RETENTION_DAYS`.

---

## 8. Stopp / Neustart

```bash
docker-compose down
docker-compose up -d
```

* Nutzt das gleiche Volume `/app` für persistente Daten wie Screenshots und `session.json`.

---

## 9. Hinweise

* Base Image: `mcr.microsoft.com/playwright:v1.58.2-jammy`
* Node 16 wird verwendet (kompatibel mit `node-fetch@2`)
* Bot-Flow selbst wurde **nicht verändert** – nur Healthcheck und Screenshot-Retention sind optional und konfigurierbar.

---

## 10. Troubleshooting / Tipps

* **Healthcheck funktioniert nicht:** Prüfe, ob `HEALTHCHECK_URL` gesetzt ist und erreichbar.
* **Screenshots werden nicht gelöscht:** Prüfe, ob `SCREENSHOT_RETENTION_DAYS` korrekt gesetzt ist und Schreibrechte im Volume bestehen.
* **Bot startet nicht:** Prüfe Logs via `docker-compose logs -f ecoflow-bot` für Fehler bei Node oder Playwright.

---
