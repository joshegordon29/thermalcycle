import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const width = 1200;
const height = 630;
const out = path.join(process.cwd(), "public", "assets", "thermalcycle-og.png");

function crc32(buf) {
  let crc = ~0;
  for (const byte of buf) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function color(hex) {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

const paper = color("#f4efe6");
const ink = color("#181512");
const heat = color("#b64220");
const green = color("#405747");
const cream = color("#fff7ea");

const raw = Buffer.alloc((width * 3 + 1) * height);

function setPixel(x, y, rgb) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const row = y * (width * 3 + 1);
  const i = row + 1 + x * 3;
  raw[i] = rgb[0];
  raw[i + 1] = rgb[1];
  raw[i + 2] = rgb[2];
}

function fillRect(x, y, w, h, rgb) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) setPixel(xx, yy, rgb);
  }
}

const font = {
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  "/": ["00001", "00010", "00100", "01000", "10000", "00000", "00000"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01111", "10000", "10000", "10011", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  J: ["00111", "00010", "00010", "00010", "10010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
};

function drawText(text, x, y, scale, rgb, letterSpacing = 2) {
  let cursor = x;
  for (const char of text.toUpperCase()) {
    const glyph = font[char] || font[" "];
    for (let row = 0; row < glyph.length; row += 1) {
      for (let col = 0; col < glyph[row].length; col += 1) {
        if (glyph[row][col] === "1") {
          fillRect(cursor + col * scale, y + row * scale, scale, scale, rgb);
        }
      }
    }
    cursor += 5 * scale + letterSpacing * scale;
  }
}

function mix(a, b, t) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}

for (let y = 0; y < height; y += 1) {
  raw[y * (width * 3 + 1)] = 0;
  for (let x = 0; x < width; x += 1) {
    const heatGlow = Math.max(0, 1 - Math.hypot(x - 980, y - 120) / 620) * 0.28;
    const greenGlow = Math.max(0, 1 - Math.hypot(x - 120, y - 520) / 540) * 0.18;
    let rgb = mix(paper, heat, heatGlow);
    rgb = mix(rgb, green, greenGlow);
    setPixel(x, y, rgb);
  }
}

fillRect(68, 70, 108, 108, ink);
drawText("TC", 92, 106, 8, cream, 1);

drawText("SAUNA REVIEWS / MATERIALS / GEAR", 68, 214, 5, heat, 1);
drawText("THERMAL", 68, 292, 13, ink, 1);
drawText("CYCLE", 68, 394, 13, ink, 1);
drawText("SAUNA EQUIPMENT REVIEWS", 72, 516, 5, green, 1);
drawText("THERMALCYCLE.COM", 72, 570, 4, ink, 1);

fillRect(888, 250, 224, 224, ink);
fillRect(922, 284, 54, 12, cream);
fillRect(1008, 284, 54, 12, cream);
fillRect(922, 428, 140, 12, cream);
fillRect(922, 326, 140, 64, heat);

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0);
ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8;
ihdr[9] = 2;
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", ihdr),
  chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, png);
console.log(`Wrote ${out}`);
