const fs = require("fs");
const path = require("path");

const suits = [
  { code: "S", symbol: "♠", color: "black" },
  { code: "C", symbol: "♣", color: "black" },
  { code: "H", symbol: "♥", color: "red" },
  { code: "D", symbol: "♦", color: "red" }
];

const values = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

const outputDir = path.join(__dirname, "public", "cards");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

function makeCardSVG(value, suitSymbol, color) {
return `
<svg xmlns="http://www.w3.org/2000/svg" width="140" height="200" viewBox="0 0 140 200">
  <rect x="2" y="2" width="136" height="196" rx="12" ry="12" fill="white" stroke="black" stroke-width="2"/>
  <text x="10" y="26" font-size="22" font-weight="bold" fill="${color}">${value}</text>
  <text x="10" y="50" font-size="22" font-weight="bold" fill="${color}">${suitSymbol}</text>
  <text x="130" y="26" font-size="22" font-weight="bold" fill="${color}" text-anchor="end">${value}</text>
  <text x="130" y="50" font-size="22" font-weight="bold" fill="${color}" text-anchor="end">${suitSymbol}</text>
  <text x="70" y="120" font-size="60" text-anchor="middle" fill="${color}">${suitSymbol}</text>
</svg>`;
}

function makeBackSVG() {
return `
<svg xmlns="http://www.w3.org/2000/svg" width="140" height="200" viewBox="0 0 140 200">
  <rect x="2" y="2" width="136" height="196" rx="12" ry="12" fill="#0033aa" stroke="black" stroke-width="2"/>
  <rect x="20" y="20" width="100" height="160" rx="10" ry="10" fill="#0066ff" stroke="white" stroke-width="3"/>
</svg>`;
}

// generate full deck
suits.forEach(s => {
  values.forEach(v => {
    const name = `${v}${s.code}.svg`;
    const svg = makeCardSVG(v, s.symbol, s.color);
    fs.writeFileSync(path.join(outputDir, name), svg);
  });
});

// generate back
fs.writeFileSync(path.join(outputDir, "BACK.svg"), makeBackSVG());

console.log("✔ SVG Playing Cards Generated in public/cards/");
