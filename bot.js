const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

// Umgebungsvariablen
const EMAIL = process.env.ECOFLOW_EMAIL;
const PASSWORD = process.env.ECOFLOW_PASSWORD;
const LOGIN_URL = process.env.ECOFLOW_PORTAL_URL || "https://user-portal.ecoflow.com/user/eu/de/login";

// URLs & Selector
const DASHBOARD_SELECTOR = 'div[title="Übersicht"]';

// Screenshot Ordner & Management
const SCREENSHOT_DIR = "/app/screenshots";
const SCREENSHOT_RETENTION_DAYS = parseInt(process.env.SCREENSHOT_RETENTION_DAYS || "5");

// Hilfsfunktion für eindeutige Screenshot-Dateinamen
function getScreenshotPath(prefix) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return path.join(SCREENSHOT_DIR, `${prefix}_${timestamp}.png`);
}

// Alte Screenshots löschen
function cleanupOldScreenshots() {
    if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    const files = fs.readdirSync(SCREENSHOT_DIR);
    const cutoff = Date.now() - SCREENSHOT_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    files.forEach(file => {
        const filePath = path.join(SCREENSHOT_DIR, file);
        if (fs.statSync(filePath).mtimeMs < cutoff) fs.unlinkSync(filePath);
    });
}

// Login-Funktion
async function doLogin(page, context) {
    console.log("Login wird durchgeführt");

    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(15000);
    await page.waitForSelector('#normal_login_email', { timeout: 45000 });

    const preFillScreenshot = getScreenshotPath("login_before_fill");
    await page.screenshot({ path: preFillScreenshot });
    console.log(`Debug-Screenshot gespeichert: ${preFillScreenshot}`);

    await page.fill('#normal_login_email', EMAIL);
    await page.fill('#normal_login_password', PASSWORD);
    await page.check('#normal_login_agreement');

    const postFillScreenshot = getScreenshotPath("login_after_fill");
    await page.screenshot({ path: postFillScreenshot });
    console.log(`Debug-Screenshot nach Fill gespeichert: ${postFillScreenshot}`);

    await page.waitForSelector('button[type="submit"]', { timeout: 10000 });
    await page.click('button[type="submit"]', { force: true });

    const postClickScreenshot = getScreenshotPath("login_after_click");
    await page.screenshot({ path: postClickScreenshot });
    console.log(`Screenshot nach Klick gespeichert: ${postClickScreenshot}`);

    await page.waitForSelector(DASHBOARD_SELECTOR, { timeout: 20000 });

    const successLoginScreenshot = getScreenshotPath("login_success");
    await page.screenshot({ path: successLoginScreenshot });
    console.log(`Login erfolgreich – Screenshot gespeichert: ${successLoginScreenshot}`);

    await context.storageState({ path: "session.json" });
}

// Prüfen, ob ausgeloggt
async function isLoggedOut(page) {
    try {
        const emailVisible = await page.locator('#normal_login_email').isVisible().catch(() => false);
        const dashboardVisible = await page.locator(DASHBOARD_SELECTOR).isVisible().catch(() => false);
        return emailVisible && !dashboardVisible;
    } catch {
        return true;
    }
}

(async () => {
    cleanupOldScreenshots();

    const browser = await chromium.launch({
        headless: true,
        args: [
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-software-rasterizer',
            '--disable-extensions',
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
            '--no-sandbox'
        ]
    });

    const context = await browser.newContext({
        storageState: fs.existsSync("session.json") ? "session.json" : undefined
    });

    let page = await context.newPage();
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' }); // 

    if (await isLoggedOut(page)) {
        await doLogin(page, context);
    } else {
        console.log("Session geladen – bereits eingeloggt");
        const startScreenshot = getScreenshotPath("start");
        await page.screenshot({ path: startScreenshot });
        console.log(`Start-Screenshot gespeichert: ${startScreenshot}`);
    }

    console.log("Bot läuft...");

    while (true) {
        try {
            if (await isLoggedOut(page)) {
                console.log("Logout erkannt -> neuer Login");

                const logoutScreenshot = getScreenshotPath("logout");
                await page.screenshot({ path: logoutScreenshot });
                console.log(`Logout-Screenshot gespeichert: ${logoutScreenshot}`);

                let success = false;
                for (let i = 0; i < 3 && !success; i++) {
                    try {
                        await doLogin(page, context);
                        success = true;
                    } catch (e) {
                        console.log("Login fehlgeschlagen, Retry in 5 Sekunden");
                        await page.waitForTimeout(5000);
                    }
                }

                if (!success) {
                    console.log("Login gescheitert, Browser neu erstellen");
                    await page.close();
                    page = await context.newPage();
                    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' }); //
                }

                cleanupOldScreenshots();
            }

            await page.waitForTimeout(30000);

        } catch (e) {
            console.log("Fehler erkannt, Seite wird neu geladen");

            const errorScreenshot = getScreenshotPath("error");
            await page.screenshot({ path: errorScreenshot });
            console.log(`Error-Screenshot gespeichert: ${errorScreenshot}`);

            await page.reload({ waitUntil: 'domcontentloaded' }); // 
        }
    }
})();
