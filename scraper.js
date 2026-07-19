const {
    getBrowser,
    restartBrowser
} = require("./browser");

const retry = require("./lib/retry");
const logger = require("./lib/logger");

const {
    openBookingFlow
} = require("./lib/navigation");

const {
    parseLanguages
} = require("./lib/parser");

/**
 * Scrape a BookMyShow movie page.
 */
async function scrapeMovie(url, wantedLanguage = "") {

    const browser = await getBrowser();

    const page = await browser.newPage({

        viewport: {
            width: 1366,
            height: 900
        }

    });

    page.setDefaultTimeout(15000);

    try {

        //----------------------------------------------------
        // Open movie page (with retry)
        //----------------------------------------------------

        logger.info(`Opening ${url}`);

        await retry(async () => {

            await page.goto(url, {

                waitUntil: "domcontentloaded",
                timeout: 60000

            });

        });

        await page.waitForTimeout(2000);

        //----------------------------------------------------
        // Basic movie info
        //----------------------------------------------------

        const movie =
            await page.locator("h1").innerText();

        const movieId =
            url.match(/\/(ET\d+)/)?.[1] || null;

        const city =
            url.split("/")[4] || null;

        //----------------------------------------------------
        // Open booking flow
        //----------------------------------------------------

        const flow =
            await openBookingFlow(page);

        //----------------------------------------------------
        // Booking not open
        //----------------------------------------------------

        if (flow.type === "BOOKING_NOT_OPEN") {

            logger.info(
                `${movie} : Booking not open`
            );

            return {

                success: true,

                movie: {
                    title: movie,
                    movieId,
                    city,
                    url
                },

                booking: {
                    open: false,
                    checkedAt: new Date().toISOString()
                },

                languages: [],

                wantedLanguage: {
                    name: wantedLanguage,
                    available: false
                }

            };

        }

        //----------------------------------------------------
        // Unknown flow
        //----------------------------------------------------

        if (flow.type === "UNKNOWN") {

            throw new Error(
                "Unknown booking flow."
            );

        }

        //----------------------------------------------------
        // Error dialog
        //----------------------------------------------------

        if (flow.type === "ERROR_DIALOG") {

            throw new Error(
                "BookMyShow displayed an error dialog."
            );

        }

        //----------------------------------------------------
        // Cinema page parser
        //----------------------------------------------------

        if (flow.type === "BOOKING_CINEMA_PAGE") {

            throw new Error(
                "Cinema page parser not implemented yet."
            );

        }

        //----------------------------------------------------
        // Language popup parser
        //----------------------------------------------------

        logger.info(
            "Parsing language popup"
        );

        const languages =
            await parseLanguages(page);

        const available =
            languages.some(
                item =>
                    item.language.toLowerCase() ===
                    wantedLanguage.toLowerCase()
            );

        //----------------------------------------------------
        // Final response
        //----------------------------------------------------

        return {

            success: true,

            movie: {
                title: movie,
                movieId,
                city,
                url
            },

            booking: {
                open: true,
                checkedAt: new Date().toISOString()
            },

            languages,

            wantedLanguage: {
                name: wantedLanguage,
                available
            }

        };

    }
    catch (err) {

        logger.error(err.message);

// Firefox crashed
    if (
        err.message.includes("Target page") ||
        err.message.includes("Browser has been closed") ||
        err.message.includes("Connection closed") ||
        err.message.includes("NS_ERROR")
    ) {

        logger.warn(
            "Restarting Firefox..."
        );

        await restartBrowser();

    }


        throw err;

    }
    finally {

        try {

            await page.close();

        }
        catch (e) {

            logger.warn(
                "Unable to close page."
            );

        }

    }

}

module.exports = {
    scrapeMovie
};
