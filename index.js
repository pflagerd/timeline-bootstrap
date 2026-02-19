const puppeteer = require('puppeteer');
const express = require('express');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

// ── Paths to watch for live reload ──────────────────────────────────────────
// Add or remove glob patterns here to control which files trigger a reload.
const WATCH_PATHS = [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, '**/*.css'),
    path.join(__dirname, '**/*.js'),
];

// Files/directories that should never trigger a reload.
const WATCH_IGNORED = [
    path.join(__dirname, 'node_modules/**'),
    path.join(__dirname, 'window-size.json'),
    __filename,   // ignore index.js itself – restarting the process is out of scope here
];

const configPath = path.join(__dirname, 'window-size.json');

function loadWindowSize() {
    try {
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
    } catch (err) {
        console.error('Error loading config:', err);
    }
    return { width: 1920, height: 1080 };
}

(async () => {
    const app = express();
    app.use(express.static(__dirname));
    const server = app.listen(3000, () => {
        console.log('Server running on http://localhost:3000');
    });

    const windowSize = loadWindowSize();

    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            `--window-size=${windowSize.width},${windowSize.height}`
        ],
        defaultViewport: null
    });

    const pages = await browser.pages();
    const page = pages[0];

    // Create browser-level CDP session for getting window bounds
    const client = await browser.target().createCDPSession();

    // Expose function to save window size
    await page.exposeFunction('saveWindowSize', async () => {
        try {
            const { windowId } = await client.send('Browser.getWindowForTarget', {
                targetId: page.target()._targetId
            });
            const { bounds } = await client.send('Browser.getWindowBounds', { windowId });

            fs.writeFileSync(configPath, JSON.stringify({
                width: bounds.width,
                height: bounds.height
            }, null, 2));
        } catch (err) {
            console.error('Error saving config:', err);
        }
    });

    // Inject resize listener
    await page.evaluateOnNewDocument(() => {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                window.saveWindowSize();
            }, 500); // Debounce for 500ms
        });
    });

    await page.goto('http://localhost:3000/index.html');

    // ── Live-reload watcher ──────────────────────────────────────────────────
    let reloadDebounce;

    const watcher = chokidar.watch(WATCH_PATHS, {
        ignored: WATCH_IGNORED,
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 150,  // ms quiet period before treating write as done
            pollInterval: 50,
        },
    });

    const reloadPage = (filePath) => {
        clearTimeout(reloadDebounce);
        reloadDebounce = setTimeout(async () => {
            console.log(`[watch] Changed: ${path.relative(__dirname, filePath)} – reloading…`);
            try {
                await page.reload({ waitUntil: 'domcontentloaded' });
            } catch (err) {
                // Page may have closed already; ignore.
            }
        }, 100);
    };

    watcher
        .on('change', reloadPage)
        .on('add',    reloadPage)
        .on('error',  (err) => console.error('[watch] Error:', err));

    console.log('[watch] Watching for file changes…');

    browser.on('disconnected', () => {
        watcher.close();
        server.close();
    });
})();
