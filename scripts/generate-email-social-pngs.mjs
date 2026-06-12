import fs from "fs";
import path from "path";
import zlib from "zlib";

/** Minimal 24×24 white-on-transparent PNG writer for email social icons. */
function writePng(filePath, draw) {
  const w = 24;
  const h = 24;
  const rowSize = 1 + w * 4;
  const raw = Buffer.alloc(rowSize * h);
  for (let y = 0; y < h; y++) {
    const row = y * rowSize;
    raw[row] = 0;
    for (let x = 0; x < w; x++) {
      const i = row + 1 + x * 4;
      const on = draw(x, y);
      raw[i] = 255;
      raw[i + 1] = 255;
      raw[i + 2] = 255;
      raw[i + 3] = on ? 255 : 0;
    }
  }
  const compressed = zlib.deflateSync(raw);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const chunks = [
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ];
  fs.writeFileSync(filePath, Buffer.concat([signature, ...chunks]));
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = crc32(Buffer.concat([typeBuf, data]));
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc >>> 0, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}

function inCircle(x, y, cx, cy, r) {
  return (x - cx) ** 2 + (y - cy) ** 2 <= r ** 2;
}

const outDir = path.join(process.cwd(), "public", "email");
fs.mkdirSync(outDir, { recursive: true });

writePng(path.join(outDir, "social-linkedin.png"), (x, y) => {
  if (y >= 7 && y <= 16 && x >= 6 && x <= 8) return true;
  if (y >= 9 && y <= 11 && x >= 8 && x <= 10) return true;
  if (y >= 13 && y <= 16 && x >= 6 && x <= 10) return true;
  if (y >= 7 && y <= 10 && x >= 12 && x <= 17) return true;
  if (y >= 11 && y <= 13 && x >= 12 && x <= 16) return true;
  if (y >= 14 && y <= 16 && x >= 12 && x <= 17) return true;
  return false;
});

writePng(path.join(outDir, "social-instagram.png"), (x, y) => {
  const outer = x >= 5 && x <= 18 && y >= 5 && y <= 18 && (x === 5 || x === 18 || y === 5 || y === 18);
  const inner = inCircle(x, y, 12, 12, 4) && !inCircle(x, y, 12, 12, 2);
  const dot = inCircle(x, y, 17, 7, 1.5);
  return outer || inner || dot;
});

writePng(path.join(outDir, "social-youtube.png"), (x, y) => {
  const box = x >= 4 && x <= 19 && y >= 8 && y <= 16 && (y === 8 || y === 16 || x === 4 || x === 19);
  return box || (x >= 10 && x <= 16 && y >= 10 && y <= 14 && x - 10 >= (y < 12 ? (12 - y) * 0.6 : (y - 12) * 0.6));
});

console.log("Wrote social PNGs to public/email/");
