const fs = require('fs');
const fetch = require('node-fetch'); // Node 16 kompatibel

const URL = process.env.HEALTHCHECK_URL;
const INTERVAL_MIN = parseInt(process.env.HEALTHCHECK_INTERVAL_MIN || "5");
const INTERVAL = INTERVAL_MIN * 60 * 1000;
const SESSION_FILE = "./session.json";

// Healthcheck optional aktivieren
if (!URL) {
  console.log("HEALTHCHECK_URL nicht gesetzt – Healthcheck deaktiviert");
  process.exit(0);
}

async function triggerHealthcheck() {
  if (!fs.existsSync(SESSION_FILE)) {
    console.log("Login-Session nicht gefunden – Healthcheck übersprungen");
    return;
  }

  try {
    const session = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
    if (!session?.cookies?.length) {
      console.log("Session leer oder ungültig – Healthcheck übersprungen");
      return;
    }
  } catch {
    console.log("Session nicht lesbar – Healthcheck übersprungen");
    return;
  }

  try {
    const res = await fetch(URL);
    console.log(`Healthcheck ausgelöst: ${URL} – Status: ${res.status}`);
  } catch (e) {
    console.log("Healthcheck Fehler:", e.message);
  }
}

console.log(`Healthcheck gestartet: ${URL} alle ${INTERVAL_MIN} Minuten`);
triggerHealthcheck();
setInterval(triggerHealthcheck, INTERVAL);
