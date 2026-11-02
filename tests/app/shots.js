// Screenshots of every app tab (visual check). Usage: node tests/app/shots.js http://localhost:8600 B12626 OUT_DIR [dark]
const { chromium } = require("playwright");
(async () => {
  const [base, id, out, dark] = process.argv.slice(2);
  const b = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: dark ? "dark" : "light" });
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  const tabs = ["overview", "drawings", "values", "decisions", "model", "sections", "analysis", "design", "verification", "run"];
  for (const n of ["home", ...tabs]) {
    await p.goto(base + "/" + (n === "home" ? "#/" : `#/p/${id}/${n}`)); await p.waitForTimeout(n === "model" ? 4000 : 1800);
    await p.screenshot({ path: `${out}/${id}_${n}${dark ? "_dark" : ""}.png`, fullPage: n !== "model" && n !== "drawings" });
  }
  console.log(errs.length ? "PAGE ERRORS:\n" + errs.join("\n") : "no page errors");
  await b.close();
  process.exit(errs.length ? 1 : 0);
})();
