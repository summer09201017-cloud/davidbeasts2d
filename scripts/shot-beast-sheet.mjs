// 2D 獸造型「renderer 單元台」:直接 import Renderer、在空白 canvas 上把每個狀態各畫一隻,
// 不用在遊戲裡追著獸跑(獸會一直移動/被打,截到的都是亂的)。
// 一張聯絡表看完:獅/熊 × approach/telegraph/charge/recovery,另出一張死神模式。
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const URL = process.env.URL;
const OUT = process.env.OUT || ".";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROME_EXE });
const page = await browser.newPage({ viewport: { width: 1240, height: 700 }, deviceScaleFactor: 3 });
const errs = [];
page.on("pageerror", (e) => errs.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text()); });
await page.goto(URL, { waitUntil: "domcontentloaded" });

async function sheet(name, deathMode) {
  await page.evaluate(async ({ deathMode }) => {
    const { Renderer } = await import("/src/renderer.js");
    document.getElementById("probe")?.remove();
    const cv = document.createElement("canvas");
    cv.id = "probe";
    cv.width = 1200; cv.height = 660;
    cv.style.cssText = "position:fixed;left:0;top:0;z-index:99999;background:#6f7a3a";
    document.body.appendChild(cv);
    const r = new Renderer(cv);
    const ctx = r.ctx;
    ctx.fillStyle = "#6f7a3a";
    ctx.fillRect(0, 0, 1200, 660);
    const STATES = ["approach", "telegraph", "charge", "recovery"];
    const rows = [["lion", 0], ["bear", 1]];
    for (const [kind, ri] of rows) {
      for (let i = 0; i < STATES.length; i++) {
        const x = 170 + i * 290;
        const footY = 250 + ri * 330;
        // t 各格錯開,順便驗眨眼/走路不同相位;phase 0=滿血色
        r._lion(x, footY, -1, STATES[i], 0, 0.7 + i * 0.9 + ri * 2.3, 0, STATES[i] === "recovery", deathMode, kind);
        ctx.fillStyle = "#fff";
        ctx.font = '20px "Noto Sans TC",sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(`${kind} · ${STATES[i]}`, x, footY + 34);
      }
    }
  }, { deathMode });
  await page.locator("#probe").screenshot({ path: `${OUT}/${name}.png` });
  console.log("shot", name);
}

await sheet("2d-normal", false);
await sheet("2d-death", true);
console.log("pageerrors:", errs.length, errs.slice(0, 5));
await browser.close();
