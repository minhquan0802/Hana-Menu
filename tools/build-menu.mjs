// Chuyển PDF menu (xuất từ Canva) thành các trang cho cuốn menu lật (menu.html).
//
//   npm run build:menu                         → dùng PDF/HANA-menu-2026.pdf.pdf, bỏ các trang ghi trong package.json
//   node tools/build-menu.mjs "PDF/x.pdf" --bo 20,25
//        --bo: số trang PDF KHÔNG đưa lên web (đếm như trong PDF, bìa = 1)
//
// Kết quả:
//   assets/menu-pages/01.webp, 02.webp, …   ảnh từng trang (rộng 1000px)
//   data/menu-pages.js                       số trang, kích thước và chữ của từng trang
//                                            (chữ để sẵn cho tìm kiếm / trình đọc màn hình nếu cần sau này)
// Sau khi build: kiểm tra lại vị trí các danh mục trong data/data.js → menuBook.sections.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { PDFiumLibrary } from "@hyzyla/pdfium";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import sharp from "sharp";

const ROOT = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const boIdx = args.indexOf("--bo");
const SKIP = new Set(boIdx > -1 ? String(args.splice(boIdx, 2)[1] || "").split(",").map(Number).filter(Boolean) : []);
const PDF_FILE = resolve(ROOT, args[0] || "PDF/HANA-menu-2026.pdf.pdf");
const PAGE_DIR = resolve(ROOT, "assets/menu-pages");
const TEXT_FILE = resolve(ROOT, "data/menu-pages.js");
const WIDTH = 1000;      // px — đủ nét cho màn hình retina, mỗi trang ~100–300KB
const QUALITY = 80;      // chất lượng WebP

const data = readFileSync(PDF_FILE);
console.log("PDF:", PDF_FILE, Math.round(data.length / 1048576) + "MB", SKIP.size ? "| bỏ trang: " + [...SKIP].join(", ") : "");

/* ---------- 1. ảnh từng trang ---------- */
mkdirSync(PAGE_DIR, { recursive: true });
for (const f of readdirSync(PAGE_DIR)) if (f.endsWith(".webp")) unlinkSync(resolve(PAGE_DIR, f));

const lib = await PDFiumLibrary.init();
const doc = await lib.loadDocument(data);
let count = 0, pdfNo = 0, height = 0, total = 0;
for (const page of doc.pages()) {
  if (SKIP.has(++pdfNo)) continue;
  count++;
  const { originalWidth } = page.getOriginalSize();
  const img = await page.render({ scale: WIDTH / originalWidth, render: "bitmap" });
  height = img.height;
  const file = resolve(PAGE_DIR, String(count).padStart(2, "0") + ".webp");
  await sharp(img.data, { raw: { width: img.width, height: img.height, channels: 4 } })
    .flatten({ background: "#1b1b1b" })
    .webp({ quality: QUALITY })
    .toFile(file);
  total += statSync(file).size;
  process.stdout.write(`\r  trang ${count}`);
}
doc.destroy();
lib.destroy();
console.log(`\n  ${count} trang, ${WIDTH}x${height}px, tổng ${(total / 1048576).toFixed(1)}MB`);

/* ---------- 2. chữ từng trang (xếp theo dòng: trên → dưới, trái → phải) ---------- */
const pdf = await pdfjs.getDocument({ data: new Uint8Array(data), disableFontFace: true, verbosity: 0 }).promise;
const texts = [];
for (let i = 1; i <= pdf.numPages; i++) {
  if (SKIP.has(i)) continue;
  const page = await pdf.getPage(i);
  const { items } = await page.getTextContent();
  const words = items
    .filter((t) => t.str.trim())
    .map((t) => ({ s: t.str.trim(), x: t.transform[4], y: t.transform[5], h: Math.abs(t.transform[3]) || 8 }));
  words.sort((a, b) => b.y - a.y || a.x - b.x);
  const lines = [];
  for (const w of words) {
    const line = lines.find((l) => Math.abs(l.y - w.y) < Math.max(3, w.h * 0.5));
    if (line) line.words.push(w); else lines.push({ y: w.y, words: [w] });
  }
  texts.push(lines
    .sort((a, b) => b.y - a.y)
    .map((l) => l.words.sort((a, b) => a.x - b.x).map((w) => w.s).join(" "))
    .join("\n")
    .replace(/[ \t]+/g, " ")
    .trim());
  page.cleanup();
}

writeFileSync(TEXT_FILE,
  "/* TỰ ĐỘNG TẠO bởi tools/build-menu.mjs — không sửa tay, chạy lại `npm run build:menu` khi có PDF mới. */\n" +
  "window.HANA_MENU_PAGES = " + JSON.stringify({ count, width: WIDTH, height, dir: "assets/menu-pages/", ext: ".webp", text: texts }, null, 1) + ";\n");
console.log("  chữ:", TEXT_FILE);
console.log("Xong. Nhớ kiểm tra menuBook.sections trong data/data.js nếu thứ tự trang thay đổi.");
