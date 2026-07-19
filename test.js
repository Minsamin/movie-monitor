const { firefox } = require("playwright");
const fs = require("fs");

(async () => {

    const browser = await firefox.launch({
        headless: true
    });

    const page = await browser.newPage();

    await page.goto(
        "https://in.bookmyshow.com/movies/hyderabad/spider-man-brand-new-day/ET00447840",
        {
            waitUntil: "domcontentloaded"
        }
    );

    await page.waitForTimeout(4000);

    const btn = page.getByRole("button", {
        name: /Book tickets/i
    });

    if (await btn.count() === 0) {
        console.log("Booking closed");
        return;
    }

    await btn.click();

    await page.waitForTimeout(5000);

    await page.screenshot({
        path: "after-click.png",
        fullPage: true
    });

    fs.writeFileSync(
        "after-click.html",
        await page.content()
    );

    console.log("saved");

    await browser.close();

})();
