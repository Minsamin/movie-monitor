const express = require("express");
const { firefox } = require("playwright");

const app = express();

app.use(express.json());

let browser;

async function getBrowser() {
    if (!browser) {
        console.log("Launching Firefox...");
        browser = await firefox.launch({
            headless: true
        });
    }

    return browser;
}

app.get("/health", (req, res) => {
    res.json({
        status: "ok"
    });
});

app.post("/check", async (req, res) => {
    const { url, wantedLanguage } = req.body;

    if (!url || !wantedLanguage) {
        return res.status(400).json({
            error: "url and wantedLanguage are required"
        });
    }

    let page;

    try {
        const browser = await getBrowser();

        page = await browser.newPage();

        await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: 60000
        });

const result = await page.evaluate(() => {
    return window.__INITIAL_STATE__;
});


console.log(JSON.stringify(result, null, 2));

return res.json({
    ok: true
});




        await page.close();

        res.json(result);

    } catch (e) {

        if (page)
            await page.close().catch(() => {});

        console.error(e);

        res.status(500).json({
            error: e.message
        });
    }
});


const PORT = 3000;

app.listen(PORT, async () => {
    await getBrowser();
    console.log(`Movie Monitor listening on port ${PORT}`);
});
