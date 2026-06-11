// Genera los íconos de la app (barra de pesas neón sobre fondo oscuro).
// Uso: node scripts/generate-icons.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BG = [11, 11, 11, 255]; // #0B0B0B
const NEON = [198, 255, 0, 255]; // #C6FF00

// ---------- Codificador PNG ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePNG(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // profundidad
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- Dibujo ----------
function makeImage(size, bg) {
  const data = Buffer.alloc(size * size * 4);
  if (bg) {
    for (let i = 0; i < size * size; i++) {
      data[i * 4] = bg[0];
      data[i * 4 + 1] = bg[1];
      data[i * 4 + 2] = bg[2];
      data[i * 4 + 3] = bg[3];
    }
  }
  return { size, data };
}

function roundRect(img, x, y, w, h, r, col) {
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(img.size, Math.ceil(x + w));
  const y1 = Math.min(img.size, Math.ceil(y + h));
  const cx = x + w / 2;
  const cy = y + h / 2;
  const hw = w / 2 - r;
  const hh = h / 2 - r;
  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      const dx = Math.max(Math.abs(px + 0.5 - cx) - hw, 0);
      const dy = Math.max(Math.abs(py + 0.5 - cy) - hh, 0);
      if (dx * dx + dy * dy <= r * r) {
        const i = (py * img.size + px) * 4;
        img.data[i] = col[0];
        img.data[i + 1] = col[1];
        img.data[i + 2] = col[2];
        img.data[i + 3] = col[3];
      }
    }
  }
}

// Logo: barra de pesas. Coordenadas sobre un lienzo de diseño de 1024.
function drawLogo(img, scale) {
  const u = (img.size / 1024) * scale;
  const rr = (dx, dy, dw, dh, dr) =>
    roundRect(
      img,
      (dx - 512) * u + img.size / 2,
      (dy - 512) * u + img.size / 2,
      dw * u,
      dh * u,
      dr * u,
      NEON
    );
  rr(120, 488, 784, 48, 24); // barra
  rr(248, 312, 88, 400, 36); // disco interno izq
  rr(688, 312, 88, 400, 36); // disco interno der
  rr(144, 372, 72, 280, 30); // disco externo izq
  rr(808, 372, 72, 280, 30); // disco externo der
}

// Reduce 4x con promedio (antialiasing).
function downscale4(img) {
  const s = img.size / 4;
  const out = makeImage(s, null);
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let dy = 0; dy < 4; dy++) {
        for (let dx = 0; dx < 4; dx++) {
          const i = ((y * 4 + dy) * img.size + x * 4 + dx) * 4;
          r += img.data[i];
          g += img.data[i + 1];
          b += img.data[i + 2];
          a += img.data[i + 3];
        }
      }
      const o = (y * s + x) * 4;
      out.data[o] = r / 16;
      out.data[o + 1] = g / 16;
      out.data[o + 2] = b / 16;
      out.data[o + 3] = a / 16;
    }
  }
  return out;
}

function render(file, size, logoScale, withBg) {
  const big = makeImage(size * 4, withBg ? BG : null);
  drawLogo(big, logoScale);
  const img = downscale4(big);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, encodePNG(img.size, img.size, img.data));
  console.log('OK', file);
}

const root = path.join(__dirname, '..');
render(path.join(root, 'assets', 'icon.png'), 1024, 0.74, true);
render(path.join(root, 'assets', 'adaptive-icon.png'), 1024, 0.52, false);
render(path.join(root, 'assets', 'splash.png'), 1024, 0.5, false);
render(path.join(root, 'assets', 'favicon.png'), 64, 0.84, true);
render(path.join(root, 'public', 'icon-192.png'), 192, 0.74, true);
render(path.join(root, 'public', 'icon-512.png'), 512, 0.74, true);
render(path.join(root, 'public', 'icon-512-maskable.png'), 512, 0.52, true);
render(path.join(root, 'public', 'apple-touch-icon.png'), 180, 0.74, true);
