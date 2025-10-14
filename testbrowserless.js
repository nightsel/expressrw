// test-browserless.js
// test-browserless.js
import puppeteer from "puppeteer-core";
import dotenv from "dotenv";
dotenv.config();
const TOKEN = process.env.BROWSERLESS_TOKEN;

(async () => {
  try {
    const browser = await puppeteer.connect({
      browserWSEndpoint: `wss://production-sfo.browserless.io?token=${TOKEN}`,
    });

    const page = await browser.newPage();
    await page.goto("https://www.letras.com/?q=waste%20it%20on%20me", {
      waitUntil: "networkidle2",
    });

    const title = await page.title();
    console.log("Page title:", title);

    // Wait for Google CSE results container
    await page.waitForSelector(".gsc-webResult.gsc-result", { timeout: 15000 });

    const results = await page.$$eval(".gsc-webResult.gsc-result", nodes =>
      nodes.map((n, idx) => ({
        index: idx + 1,
        class: n.className,
        textSnippet: n.innerText.trim().slice(0, 100), // first 100 chars
        link: n.querySelector("a") ? n.querySelector("a").href : null,
      }))
    );

    console.log(`Found ${results.length} .gsc-webResult.gsc-result elements`);
    console.log("==============================================");

    results.forEach(r => {
      console.log(`\n\n================ [RESULT ${r.index}] ================`);
      console.log(`Class: ${r.class}`);
      console.log(`Link: ${r.link}`);
      console.log(`Snippet: ${r.textSnippet}`);
    });

    await browser.close();
    console.log("Browserless inspection succeeded!");
  } catch (err) {
    console.error("Browserless test failed:", err.message);
  }
})();
