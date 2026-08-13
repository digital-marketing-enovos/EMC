// Creates a session and posts N synthetic submissions through the real API, so
// the scoring, validation and storage paths are the ones actually exercised.
//
//   npm run dev                       # in another terminal
//   node scripts/seed.mjs             # 12 responses against localhost:3000
//   node scripts/seed.mjs --n 15 --url https://your-app.vercel.app --burst
//
// --burst fires everything at once: the 15-phones-in-two-minutes check.

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const base = arg("url", "http://localhost:3000").replace(/\/$/, "");
const n = Number(arg("n", 12));
const burst = args.includes("--burst");

const ITEM_IDS = Array.from({ length: 12 }, (_, i) => i + 1);
const RAW = [-3, -1, 1, 3];
const pick = () => RAW[Math.floor(Math.random() * RAW.length)];

// A believable spread: everyone leans somewhere, nobody is identical.
function submission(i) {
  const answers = {};
  for (const id of ITEM_IDS) answers[id] = { today: pick(), target: pick() };
  return { answers, label: `P${String(i + 1).padStart(2, "0")}` };
}

const created = await fetch(`${base}/api/sessions`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ title: "Seeded session" }),
});
if (!created.ok) {
  console.error("could not create session:", created.status, await created.text());
  process.exit(1);
}
const { code, secret } = await created.json();

const started = Date.now();
const post = (i) =>
  fetch(`${base}/api/s/${code}/responses`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(submission(i)),
  }).then(async (r) => {
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
    return r.json();
  });

let ok = 0;
const failures = [];
if (burst) {
  const results = await Promise.allSettled(Array.from({ length: n }, (_, i) => post(i)));
  for (const r of results) (r.status === "fulfilled" ? ok++ : failures.push(r.reason?.message));
} else {
  for (let i = 0; i < n; i++) {
    try {
      await post(i);
      ok++;
    } catch (e) {
      failures.push(e.message);
    }
  }
}

console.log(`${ok}/${n} responses accepted in ${Date.now() - started}ms`);
if (failures.length) console.error("failures:", failures);
console.log(`join     ${base}/s/${code}`);
console.log(`present  ${base}/s/${code}/present`);
console.log(`results  ${base}/s/${code}/results?k=${secret}`);
