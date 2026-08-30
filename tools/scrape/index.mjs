#!/usr/bin/env node
/**
 * Scrapes turbo-computer.com into public/data JSON files.
 * Usage:
 *   node tools/scrape/index.mjs --limit 20
 *   node tools/scrape/index.mjs
 *   node tools/scrape/index.mjs --resume
 */
import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT = join(ROOT, "public", "data");
const ORIGIN = "https://turbo-computer.com";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const args = new Set(process.argv.slice(2));
const limitArg = process.argv.includes("--limit")
  ? Number(process.argv[process.argv.indexOf("--limit") + 1])
  : 0;
const RESUME = args.has("--resume");
const CONCURRENCY = 6;

const CATEGORIES = [
  { slug: "laptops", name: "Laptops & Notebooks", nameAr: "لابتوب", parentSlug: null },
  { slug: "accessories", name: "Accessories", nameAr: "إكسسوارات", parentSlug: null },
  { slug: "cables-adapters", name: "Cables & Adapters", nameAr: "كابلات ومحولات", parentSlug: "accessories" },
  { slug: "keyboard-mouse-combos", name: "Keyboard & Mouse Combos", nameAr: "كيبورد وماوس", parentSlug: "accessories" },
  { slug: "converters-docking-stations", name: "Converters & Docking Stations", nameAr: "محولات ودوك", parentSlug: "accessories" },
  { slug: "gamepads-controllers", name: "Gamepads & Controllers", nameAr: "جوستيك وكنترولر", parentSlug: "accessories" },
  { slug: "gaming-mouse-pads-desk-mats", name: "Gaming Mouse Pads & Desk Mats", nameAr: "ماوس باد", parentSlug: "accessories" },
  { slug: "headphones-headsets", name: "Headphones & Headsets", nameAr: "سماعات", parentSlug: "accessories" },
  { slug: "keyboards-input-devices", name: "Keyboards & Input Devices", nameAr: "كيبوردات", parentSlug: "accessories" },
  { slug: "laptop-bags-sleeves", name: "Laptop Bags & Sleeves", nameAr: "شنط لابتوب", parentSlug: null },
  { slug: "laptop-cooling-pads-stands", name: "Laptop Cooling Pads & Stands", nameAr: "قواعد تبريد", parentSlug: "accessories" },
  { slug: "microphones-audio-gear", name: "Microphones & Audio Gear", nameAr: "مايكروفونات", parentSlug: "accessories" },
  { slug: "mice", name: "Mice", nameAr: "ماوس", parentSlug: "accessories" },
  { slug: "pc-cooling-thermal-solutions", name: "PC Cooling & Thermal Solutions", nameAr: "تبريد المعالج", parentSlug: null },
  { slug: "presenters-laser-pointers", name: "Presenters & Laser Pointers", nameAr: "مؤشرات ليزر", parentSlug: "accessories" },
  { slug: "projectors", name: "Projectors", nameAr: "بروجيكتور", parentSlug: "accessories" },
  { slug: "surveillance-cameras", name: "Surveillance Cameras", nameAr: "كاميرات مراقبة", parentSlug: "accessories" },
  { slug: "usb-flash-drives", name: "USB Flash Drives", nameAr: "فلاش ميموري", parentSlug: null },
  { slug: "webcams", name: "Webcams", nameAr: "ويب كام", parentSlug: "accessories" },
  { slug: "monitors-displays", name: "Monitors & Displays", nameAr: "شاشات", parentSlug: null },
  { slug: "processors-cpus", name: "Processors (CPUs)", nameAr: "معالجات", parentSlug: null },
  { slug: "motherboards", name: "Motherboards", nameAr: "لوحات أم", parentSlug: null },
  { slug: "graphics-cards", name: "Graphics Cards", nameAr: "كروت شاشة", parentSlug: null },
  { slug: "computer-memory-ram", name: "Computer Memory (RAM)", nameAr: "رامات", parentSlug: null },
  { slug: "ssd-external-storage", name: "SSD & External Storage", nameAr: "وحدات تخزين SSD", parentSlug: null },
  { slug: "hard-drives", name: "Hard Drives", nameAr: "هارد ديسك", parentSlug: null },
  { slug: "pc-cases-chasses", name: "PC Cases", nameAr: "كيسات", parentSlug: null },
  { slug: "pc-bundle", name: "PC Bundles", nameAr: "تجميعات", parentSlug: null },
  { slug: "networking", name: "Networking Equipment", nameAr: "شبكات", parentSlug: null },
  { slug: "power-supplies", name: "Power Supplies (PSU)", nameAr: "باور سبلاي", parentSlug: null },
  { slug: "point-of-sale", name: "Point of Sale (POS)", nameAr: "نقاط بيع", parentSlug: null },
];

const KNOWN_SLUGS = new Set([
  ...CATEGORIES.map((c) => c.slug),
  "blog",
  "warranty",
  "about_us",
  "privacy",
  "terms",
  "delivery",
  "contact",
  "index.php",
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function decode(html) {
  return html
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function stripTags(html) {
  return decode(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<button[\s\S]*?<\/button>/gi, "")
    .replace(/\sstyle="[^"]*"/gi, "")
    .replace(/\sdata-[a-z-]+="[^"]*"/gi, "")
    .replace(/\sclass="[^"]*"/gi, "")
    .replace(/<(?!\/?(p|h[1-6]|ul|ol|li|table|thead|tbody|tr|td|th|strong|b|em|i|br|a|div|span|img)\b)[^>]+>/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parsePrice(text) {
  if (!text) return null;
  const n = Number(String(text).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function slugFromUrl(url) {
  try {
    const u = new URL(url, ORIGIN);
    const path = u.pathname.replace(/\/+$/, "");
    const last = path.split("/").filter(Boolean).pop() || "";
    return decodeURIComponent(last).toLowerCase();
  } catch {
    return "";
  }
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

async function fetchText(url, retries = 4) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "text/html,application/xml,application/json,*/*" },
        signal: AbortSignal.timeout(45000),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.text();
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(800 * (i + 1));
    }
  }
  return "";
}

async function mapPool(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function parseSitemap(xml) {
  const products = [];
  const re =
    /<url>\s*<loc>([^<]+)<\/loc>[\s\S]*?(?:<image:loc>([^<]*)<\/image:loc>)?[\s\S]*?(?:<image:caption>([^<]*)<\/image:caption>)?/g;
  let m;
  while ((m = re.exec(xml))) {
    const loc = m[1].trim();
    if (!loc.startsWith(ORIGIN + "/")) continue;
    const slug = slugFromUrl(loc);
    if (!slug || KNOWN_SLUGS.has(slug) || slug.includes("index.php") || slug.includes(".")) continue;
    products.push({
      slug,
      url: loc,
      image: m[2] ? decode(m[2]) : "",
      caption: m[3] ? decode(m[3]) : "",
    });
  }
  const unique = new Map();
  for (const p of products) unique.set(p.slug, p);
  return [...unique.values()];
}

function parseJsonLd(html) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  for (const raw of blocks) {
    try {
      const data = JSON.parse(raw);
      if (data["@type"] === "Product" || data.type === "Product") return data;
    } catch {
      /* ignore malformed */
    }
  }
  return null;
}

function parseSpecs(html) {
  const specs = [];
  const tableMatch = html.match(/Technical Specifications[\s\S]{0,200}<table[\s\S]*?<\/table>/i) || html.match(/<table[\s\S]*?<\/table>/);
  if (!tableMatch) return specs;
  const rows = [...tableMatch[0].matchAll(/<tr[\s\S]*?<\/tr>/gi)];
  for (const row of rows.slice(1)) {
    const cells = [...row[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) => stripTags(c[1]));
    if (cells.length >= 2 && cells[0] && cells[1] && cells[0] !== "Component") {
      specs.push({ group: "specs", label: cells[0], value: cells[1] });
    }
  }
  return specs;
}

function parseGallery(html) {
  const images = [];
  const lg = html.match(/data-images='(\[[\s\S]*?\])'/);
  if (lg) {
    try {
      const arr = JSON.parse(decode(lg[1]));
      for (const item of arr) {
        const src = item.src || "";
        images.push({
          thumb: item.thumb || src.replace(/-\d+x\d+/, "-100x100"),
          medium: src,
          large: src.replace(/-600x600/, "-1500x1500").replace(/-\d+x\d+w/, (s) => s.replace(/\d+x\d+/, "1500x1500")),
        });
      }
    } catch {
      /* fall through */
    }
  }
  if (!images.length) {
    const srcs = [...html.matchAll(/data-largeimg="([^"]+)"/g)].map((m) => m[1]);
    for (const src of srcs) {
      images.push({
        thumb: src.replace(/-\d+x\d+/, "-100x100"),
        medium: src,
        large: src.replace(/-600x600/, "-1500x1500"),
      });
    }
  }
  return images;
}

function parseProductPage(html, slug, sitemapMeta) {
  const ld = parseJsonLd(html) || {};
  const stockMatch = html.match(/Stock:<\/b>\s*<span>\s*(\d+)/i) || html.match(/product-stock[^>]*>[\s\S]*?<span>\s*(\d+)/i);
  const stock = Number(stockMatch?.[1] ?? 0) || 0;
  const brandMatch = html.match(/product-manufacturer">[\s\S]*?href="([^"]+)"[^>]*>([^<]+)/i);
  const modelMatch = html.match(/product-model">[\s\S]*?<span>([^<]*)<\/span>/i);
  const idMatch = html.match(/name="product_id" value="(\d+)"/);
  const oldPriceMatch = html.match(/price-old[^>]*>[\s\S]*?EGP\s*([\d,.]+)/i) || html.match(/class="price-old"[^>]*>\s*EGP\s*([\d,.]+)/i);
  const newPriceMatch = html.match(/product-price[^>]*>\s*EGP\s*([\d,.]+)/i);
  const labels = [...html.matchAll(/class="product-label[^"]*"[^>]*>[\s\S]*?<strong>(?:<a[^>]*>)?([^<]+)/g)]
    .map((m) => stripTags(m[1]))
    .filter((t) => t && !/whatsapp|chat/i.test(t));
  const tags = [...html.matchAll(/route=product\/search&amp;tag=([^"]+)/g)].map((m) => decodeURIComponent(m[1].replace(/\+/g, " ")));
  const descBlock =
    html.match(/product-extra-description[\s\S]*?block-content[\s\S]*?>([\s\S]*?)block-expand-overlay/) ||
    html.match(/<p[^>]{0,200}>([\s\S]{80,1200}?)<\/p>\s*<h3[^>]*>[\s\S]*?Technical Specifications/i);
  const descriptionHtml = descBlock ? sanitizeHtml(descBlock[1]) : "";
  const brandName = stripTags(brandMatch?.[2] || ld.brand?.name || "");
  const brandHref = brandMatch?.[1] || "";
  const brandSlug = brandHref ? slugFromUrl(brandHref) : brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const price = parsePrice(ld.offers?.price) || parsePrice(newPriceMatch?.[1]) || 0;
  const oldPrice = parsePrice(oldPriceMatch?.[1]);
  const images = parseGallery(html);
  const primary = images[0]?.medium || sitemapMeta.image || "";
  const name = ld.name || sitemapMeta.caption || slug;
  const shortDescription = (ld.description || stripTags(descriptionHtml)).slice(0, 220);
  const specs = parseSpecs(html);
  const id = Number(idMatch?.[1] || 0) || hash(slug);
  const seed = hash(String(id));
  const rating = Number((3.6 + (seed % 14) / 10).toFixed(1));
  const reviewCount = 4 + (seed % 28);
  const reviewers = ["Omar H.", "Nour A.", "Karim S.", "Yasmin M.", "Mostafa E.", "Laila K.", "Ahmed R.", "Salma F."];
  const comments = [
    "Solid build and the performance matches the specs.",
    "Arrived quickly, packing was excellent.",
    "Great value compared to other stores.",
    "Turbo support answered all my questions before I bought.",
    "Exactly as described. Would buy again.",
    "Runs cool and quiet under load.",
  ];
  const reviews = Array.from({ length: Math.min(4, reviewCount) }, (_, i) => ({
    author: reviewers[(seed + i) % reviewers.length],
    rating: Math.max(3, Math.min(5, Math.round(rating + ((seed >> i) % 3) - 1))),
    comment: comments[(seed + i * 3) % comments.length],
    date: `2026-0${1 + ((seed + i) % 8)}-${String(10 + ((seed + i * 5) % 18)).padStart(2, "0")}`,
    demo: true,
  }));

  return {
    id,
    slug,
    name,
    model: stripTags(modelMatch?.[1] || ld.model || ""),
    brand: brandName || "Turbo",
    brandSlug: brandSlug || "turbo",
    categorySlugs: [],
    price,
    oldPrice: oldPrice && oldPrice > price ? oldPrice : null,
    currency: "EGP",
    stock,
    inStock: (ld.offers?.availability || "").includes("InStock") || stock > 0,
    image: primary,
    images,
    labels: [...new Set(labels)],
    tags,
    shortDescription,
    descriptionHtml,
    specs,
    rating,
    reviewCount,
    reviews,
  };
}

function parseCategoryProducts(html) {
  const items = [];
  const cards = html.split(/class="product-layout/);
  for (const card of cards.slice(1)) {
    const href = card.match(/href="(https:\/\/turbo-computer\.com\/[^"?#]+)"/i);
    if (!href) continue;
    const slug = slugFromUrl(href[1]);
    if (!slug || KNOWN_SLUGS.has(slug)) continue;
    const oldP = parsePrice((card.match(/price-old[^>]*>[\s\S]{0,40}EGP\s*([\d,.]+)/i) || [])[1]);
    const newP = parsePrice((card.match(/price-new[^>]*>[\s\S]{0,40}EGP\s*([\d,.]+)/i) || card.match(/product-price[^>]*>[\s\S]{0,40}EGP\s*([\d,.]+)/i) || [])[1]);
    const labels = [...card.matchAll(/<strong>([^<]+)<\/strong>/g)].map((m) => m[1]).filter((t) => /new|sale|hot|-%/i.test(t));
    items.push({ slug, price: newP, oldPrice: oldP, labels });
  }
  for (const slug of extractProductSlugsFrom(html)) {
    if (!items.some((i) => i.slug === slug)) items.push({ slug, price: null, oldPrice: null, labels: [] });
  }
  const showing = html.match(/Showing \d+ to \d+ of (\d+)/i);
  return { items, total: showing ? Number(showing[1]) : items.length };
}

function parseBrands(html) {
  const brands = [];
  const re = /src="(https:\/\/turbo-computer\.com\/image\/cache\/catalog\/LOGO[^"]+)"[^>]*alt="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) {
    const name = decode(m[2]);
    if (!name || /journal|turbo computer/i.test(name)) continue;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    brands.push({ slug, name, logo: m[1] });
  }
  const unique = new Map();
  for (const b of brands) unique.set(b.slug, b);
  return [...unique.values()];
}

function parseHero(html) {
  const slides = [];
  const block = html.match(/module-slider-1150[\s\S]*?swiper-pagination-wrapper/)?.[0] || html;
  const parts = block.split(/swiper-slide/);
  for (const part of parts.slice(1)) {
    const img = part.match(/src="(https:\/\/turbo-computer\.com\/image\/[^"]+)"/) || part.match(/data-srcset="(https:\/\/turbo-computer\.com\/image\/[^"\s]+)/);
    const href = part.match(/href="(https:\/\/turbo-computer\.com\/[^"]+)"/);
    const texts = [...part.matchAll(/slide-text-item"><span>([\s\S]*?)<\/span>/g)].map((x) => stripTags(x[1])).filter(Boolean);
    if (img || texts.length) {
      slides.push({
        image: img ? img[1] : "",
        title: texts[0] || "",
        subtitle: texts[1] || "",
        href: href ? "/" + slugFromUrl(href[1]) : "/c/laptops",
      });
    }
  }
  return slides;
}

function parseCategoryTiles(html) {
  const tiles = [];
  const block = html.match(/module-banners_grid-745[\s\S]*?PORTABLE STORAGE[\s\S]{0,12000}/)?.[0] || html.match(/PORTABLE STORAGE[\s\S]{0,12000}/)?.[0];
  const source = block || html;
  const parts = source.split(/slide-content-image/);
  for (const part of parts.slice(1)) {
    const img = part.match(/src="(https:\/\/turbo-computer\.com\/image\/[^"]+)"/) || part.match(/data-srcset="(https:\/\/turbo-computer\.com\/image\/[^"\s]+)/);
    const href = part.match(/href="(https:\/\/turbo-computer\.com\/[^"]+)"/);
    const texts = [...part.matchAll(/slide-text-item"><span>([\s\S]*?)<\/span>/g)].map((x) => stripTags(x[1])).filter(Boolean);
    if (!href) continue;
    tiles.push({
      slug: slugFromUrl(href[1]),
      name: texts[0] || slugFromUrl(href[1]),
      fromLabel: texts.find((t) => /from|LE/i.test(t)) || "",
      image: img ? img[1] : "",
    });
  }
  return tiles.slice(0, 8);
}

function extractProductSlugsFrom(html) {
  const slugs = [];
  for (const m of html.matchAll(/href="https:\/\/turbo-computer\.com\/([A-Za-z0-9][A-Za-z0-9-]{8,})"/g)) {
    const slug = m[1].toLowerCase();
    if (!KNOWN_SLUGS.has(slug) && !slugs.includes(slug)) slugs.push(slug);
  }
  return slugs;
}

function parseRails(html) {
  const titles = ["Top Sellers", "New Arrivals", "Laptop", "Gaming Monitor", "Bestsellers", "Most Popular", "Best Rated"];
  const rails = [];
  for (const title of titles) {
    const idx = html.indexOf(`>${title}</h3>`);
    if (idx < 0) continue;
    const slice = html.slice(idx, idx + 80000);
    const nextTitle = titles.find((t) => t !== title && slice.indexOf(`>${t}</h3>`) > 200);
    const end = nextTitle ? slice.indexOf(`>${nextTitle}</h3>`) : Math.min(slice.length, 25000);
    rails.push({
      id: title.toLowerCase().replace(/\s+/g, "-"),
      title,
      productSlugs: extractProductSlugsFrom(slice.slice(0, end)).slice(0, 12),
    });
  }
  return rails;
}

function parsePageContent(html, title) {
  const main =
    html.match(/id="content"[\s\S]*?>([\s\S]*?)<footer/i) ||
    html.match(/class="content[\s\S]*?>([\s\S]*?)<div id="bottom"/i);
  const body = main ? sanitizeHtml(main[1]).slice(0, 20000) : `<p>${title}</p>`;
  return { title, html: body };
}

function parseBlog(html) {
  const posts = [];
  for (const m of html.matchAll(/href="(https:\/\/turbo-computer\.com\/blog\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const slug = slugFromUrl(m[1]);
    const title = stripTags(m[2]);
    if (title && slug && !posts.some((p) => p.slug === slug)) posts.push({ slug, title, href: m[1] });
  }
  return posts.slice(0, 12);
}

function facetValue(product, kind) {
  const blob = `${product.name} ${product.tags.join(" ")} ${product.specs.map((s) => s.value).join(" ")}`;
  if (kind === "cpu") {
    const m = blob.match(/((?:Intel\s+Core\s+(?:Ultra\s+)?[iI]\d|AMD\s+Ryzen\s+\d)[^\s,/]{0,16})/i);
    return m ? m[1].replace(/\s+/g, " ") : null;
  }
  if (kind === "gpu") {
    const m = blob.match(/((?:RTX|GTX|RX)\s?\d{3,4}\s?(?:Ti|XT|SUPER)?(?:\s+\d+G[B]?)?)/i);
    return m ? m[1].toUpperCase().replace(/\s+/g, " ") : null;
  }
  if (kind === "ram") {
    const m = blob.match(/(\d+\s?GB)\s*(DDR[45])?/i);
    return m ? `${m[1].replace(" ", "")}${m[2] ? " " + m[2].toUpperCase() : ""}` : null;
  }
  if (kind === "storage") {
    const m = blob.match(/(\d+\s?(?:GB|TB))\s*(NVMe|SSD|HDD|M\.2)?/i);
    return m ? `${m[1].replace(" ", "")} ${m[2] || "SSD"}` : null;
  }
  if (kind === "refresh") {
    const m = blob.match(/(\d{2,3})\s?Hz/i);
    return m ? `${m[1]}Hz` : null;
  }
  return null;
}

function buildFilters(products) {
  const collect = (kind) => {
    const counts = new Map();
    for (const p of products) {
      const v = facetValue(p, kind);
      if (!v) continue;
      counts.set(v, (counts.get(v) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 18)
      .map(([value, count]) => ({ value, count }));
  };
  const brands = new Map();
  for (const p of products) brands.set(p.brand, (brands.get(p.brand) || 0) + 1);
  return {
    brands: [...brands.entries()].sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, count })),
    cpu: collect("cpu"),
    gpu: collect("gpu"),
    ram: collect("ram"),
    storage: collect("storage"),
    refresh: collect("refresh"),
    priceBuckets: [
      { id: "0-2000", min: 0, max: 2000, label: "Under 2,000" },
      { id: "2000-10000", min: 2000, max: 10000, label: "2,000 – 10,000" },
      { id: "10000-30000", min: 10000, max: 30000, label: "10,000 – 30,000" },
      { id: "30000-60000", min: 30000, max: 60000, label: "30,000 – 60,000" },
      { id: "60000+", min: 60000, max: null, label: "60,000+" },
    ],
  };
}

function inferSocket(text) {
  const t = text.toUpperCase();
  if (/\bAM5\b/.test(t)) return "AM5";
  if (/\bAM4\b/.test(t)) return "AM4";
  if (/LGA\s?1851|CORE ULTRA/.test(t)) return "LGA1851";
  if (/LGA\s?1700|14TH|13TH|12TH|I[3579]-1[234]/.test(t)) return "LGA1700";
  if (/LGA\s?1200/.test(t)) return "LGA1200";
  return null;
}

function inferRamType(text) {
  const t = text.toUpperCase();
  if (/DDR5/.test(t)) return "DDR5";
  if (/DDR4/.test(t)) return "DDR4";
  return null;
}

function inferWattage(text) {
  const m = text.match(/(\d{3,4})\s?W/i);
  return m ? Number(m[1]) : null;
}

function inferForm(text) {
  const t = text.toUpperCase();
  if (/E-?ATX/.test(t)) return "E-ATX";
  if (/MICRO[\s-]?ATX|MATX/.test(t)) return "mATX";
  if (/MINI[\s-]?ITX|ITX/.test(t)) return "ITX";
  if (/ATX/.test(t)) return "ATX";
  return null;
}

function buildBuilderCatalog(products) {
  const byCat = (slug) => products.filter((p) => p.categorySlugs.includes(slug));
  const mapPart = (p, extra) => ({
    slug: p.slug,
    name: p.name,
    price: p.price,
    image: p.image,
    brand: p.brand,
    ...extra,
  });
  return {
    cpu: byCat("processors-cpus").map((p) =>
      mapPart(p, { socket: inferSocket(`${p.name} ${p.specs.map((s) => s.value).join(" ")}`) }),
    ),
    motherboard: byCat("motherboards").map((p) => {
      const t = `${p.name} ${p.specs.map((s) => s.value).join(" ")}`;
      return mapPart(p, { socket: inferSocket(t), ramType: inferRamType(t), form: inferForm(t) || "ATX" });
    }),
    ram: byCat("computer-memory-ram").map((p) => mapPart(p, { ramType: inferRamType(p.name) || "DDR4" })),
    gpu: byCat("graphics-cards").map((p) => mapPart(p, { tdp: inferWattage(p.name) || 180 })),
    storage: byCat("ssd-external-storage").concat(byCat("hard-drives")).map((p) => mapPart(p, {})),
    psu: byCat("power-supplies").map((p) => mapPart(p, { wattage: inferWattage(p.name) || 650 })),
    case: byCat("pc-cases-chasses").map((p) => mapPart(p, { form: inferForm(p.name) || "ATX" })),
    cooler: byCat("pc-cooling-thermal-solutions").map((p) => mapPart(p, {})),
  };
}

async function writeJson(path, data) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2), "utf8");
}

async function main() {
  console.log("Scraping turbo-computer.com …");
  await mkdir(join(OUT, "products"), { recursive: true });
  await mkdir(join(OUT, "pages"), { recursive: true });

  const sitemap = await fetchText(`${ORIGIN}/sitemap.xml`);
  let catalog = parseSitemap(sitemap);
  console.log(`Sitemap products: ${catalog.length}`);
  if (limitArg > 0) catalog = catalog.slice(0, limitArg);

  const [homeHtml, brandsHtml, blogHtml] = await Promise.all([
    fetchText(`${ORIGIN}/`),
    fetchText(`${ORIGIN}/index.php?route=product/manufacturer`),
    fetchText(`${ORIGIN}/blog`),
  ]);

  const brands = parseBrands(brandsHtml);
  const hero = parseHero(homeHtml);
  if (!hero.length) {
    hero.push(
      { image: `${ORIGIN}/image/cache/catalog/H12-915x510w.jpeg`, title: "PC GAMING", subtitle: "تجميعة يعني تربو", href: "/c/pc-bundle" },
      { image: `${ORIGIN}/image/cache/catalog/H13-915x510w.jpeg`, title: "GAMING LAPTOP", subtitle: "LAPTOP GAMING / BUSINESS", href: "/c/laptops" },
      { image: `${ORIGIN}/image/cache/catalog/H14-915x510w.jpeg`, title: "GAMING ACCESSORIES", subtitle: "Most Advanced Accessories Features", href: "/c/accessories" },
    );
  }
  const tiles = parseCategoryTiles(homeHtml);
  if (!tiles.length) {
    tiles.push(
      { slug: "hard-drives", name: "PORTABLE STORAGE", fromLabel: "from 4.500LE", image: `${ORIGIN}/image/cache/catalog/b2-370x220w.jpeg` },
      { slug: "laptops", name: "LAPTOP", fromLabel: "from 12.000LE", image: `${ORIGIN}/image/cache/catalog/b3-370x220w.jpeg` },
      { slug: "monitors-displays", name: "GAMING MONITORS", fromLabel: "from 5.200LE", image: `${ORIGIN}/image/cache/catalog/b4-370x220w.jpeg` },
      { slug: "headphones-headsets", name: "Headphones", fromLabel: "from 500LE", image: `${ORIGIN}/image/cache/catalog/b1-370x220w.jpeg` },
    );
  }
  const rails = parseRails(homeHtml);

  const categoryMap = new Map();
  await mapPool(CATEGORIES, 3, async (cat) => {
    const slugs = [];
    let page = 1;
    let total = Infinity;
    while ((page - 1) * 100 < total && page <= 12) {
      const html = await fetchText(`${ORIGIN}/${cat.slug}?limit=100&page=${page}`);
      const parsed = parseCategoryProducts(html);
      total = parsed.total || parsed.items.length;
      for (const item of parsed.items) {
        slugs.push(item.slug);
        const prev = categoryMap.get(item.slug.toLowerCase()) || { categorySlugs: [], oldPrice: null, price: null, labels: [] };
        prev.categorySlugs = [...new Set([...prev.categorySlugs, cat.slug, cat.parentSlug].filter(Boolean))];
        if (item.oldPrice) prev.oldPrice = item.oldPrice;
        if (item.price) prev.price = item.price;
        prev.labels = [...new Set([...(prev.labels || []), ...(item.labels || [])])];
        categoryMap.set(item.slug.toLowerCase(), prev);
      }
      if (!parsed.items.length) break;
      page += 1;
    }
    cat.productCount = slugs.length;
    cat.image = tiles.find((t) => t.slug === cat.slug)?.image || "";
    console.log(`Category ${cat.slug}: ${slugs.length}`);
  });

  const done = new Set();
  if (RESUME) {
    try {
      const files = await readdir(join(OUT, "products"));
      for (const f of files) if (f.endsWith(".json")) done.add(f.replace(/\.json$/, ""));
    } catch {
      /* empty */
    }
  }

  const products = [];
  let ok = 0;
  let fail = 0;
  await mapPool(catalog, CONCURRENCY, async (meta, idx) => {
    try {
      let detail;
      const slug = meta.slug.toLowerCase();
      if (done.has(slug) || done.has(meta.slug)) {
        const file = done.has(slug) ? `${slug}.json` : `${meta.slug}.json`;
        detail = JSON.parse(await readFile(join(OUT, "products", file), "utf8"));
      } else {
        const html = await fetchText(meta.url);
        detail = parseProductPage(html, slug, meta);
      }
      const extra = categoryMap.get(slug);
      if (extra) {
        detail.categorySlugs = extra.categorySlugs;
        if (extra.oldPrice && extra.oldPrice > detail.price) detail.oldPrice = extra.oldPrice;
        if (extra.labels?.length) detail.labels = [...new Set([...detail.labels, ...extra.labels])];
      }
      detail.slug = slug;
      await writeJson(join(OUT, "products", `${slug}.json`), detail);
      products.push(detail);
      ok += 1;
      if ((idx + 1) % 20 === 0) console.log(`Products ${idx + 1}/${catalog.length}`);
    } catch (err) {
      fail += 1;
      console.warn(`Fail ${meta.slug}: ${err.message}`);
    }
  });

  const missingCats = products.filter((p) => !p.categorySlugs.length);
  for (const p of missingCats) {
    const blob = `${p.name} ${p.tags.join(" ")}`.toLowerCase();
    const guess =
      CATEGORIES.find((c) => blob.includes(c.slug.replace(/-/g, " "))) ||
      CATEGORIES.find((c) => blob.includes(c.slug.split("-")[0]));
    if (guess) p.categorySlugs = [guess.slug];
    else if (/laptop|notebook/.test(blob)) p.categorySlugs = ["laptops"];
    else if (/monitor|display/.test(blob)) p.categorySlugs = ["monitors-displays"];
    else if (/headset|headphone/.test(blob)) p.categorySlugs = ["headphones-headsets"];
    else if (/mouse/.test(blob)) p.categorySlugs = ["mice"];
    else if (/keyboard/.test(blob)) p.categorySlugs = ["keyboards-input-devices"];
    else if (/rtx|gtx|radeon|graphics/.test(blob)) p.categorySlugs = ["graphics-cards"];
    else if (/ryzen|core i|processor/.test(blob)) p.categorySlugs = ["processors-cpus"];
    else if (/motherboard|mainboard/.test(blob)) p.categorySlugs = ["motherboards"];
    else if (/ddr[45]|ram/.test(blob)) p.categorySlugs = ["computer-memory-ram"];
    else if (/ssd|nvme/.test(blob)) p.categorySlugs = ["ssd-external-storage"];
    else if (/hdd|hard drive/.test(blob)) p.categorySlugs = ["hard-drives"];
    else if (/psu|power supply/.test(blob)) p.categorySlugs = ["power-supplies"];
    else if (/case|chassis|tower/.test(blob)) p.categorySlugs = ["pc-cases-chasses"];
    else if (/تجميعة|bundle/.test(blob)) p.categorySlugs = ["pc-bundle"];
  }

  for (const p of products) {
    await writeJson(join(OUT, "products", `${p.slug}.json`), p);
  }

  const list = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    model: p.model,
    brand: p.brand,
    brandSlug: p.brandSlug,
    categorySlugs: p.categorySlugs,
    price: p.price,
    oldPrice: p.oldPrice,
    currency: p.currency,
    stock: p.stock,
    inStock: p.inStock,
    image: p.image,
    labels: p.labels,
    tags: p.tags.slice(0, 8),
    shortDescription: p.shortDescription,
    rating: p.rating,
    reviewCount: p.reviewCount,
    specs: p.specs,
  }));

  const home = {
    hero,
    categoryTiles: tiles,
    rails: rails.map((r) => {
      let slugs = r.productSlugs.filter((s) => products.some((p) => p.slug === s));
      if (slugs.length < 4) {
        const extra = products
          .filter((p) => {
            if (r.id.includes("laptop")) return p.categorySlugs.includes("laptops");
            if (r.id.includes("monitor")) return p.categorySlugs.includes("monitors-displays");
            if (r.id.includes("new")) return p.labels.includes("New");
            if (r.id.includes("rated")) return p.rating >= 4.5;
            return true;
          })
          .sort((a, b) => b.rating - a.rating)
          .map((p) => p.slug)
          .slice(0, 8);
        slugs = [...new Set([...slugs, ...extra])].slice(0, 8);
      }
      return { ...r, productSlugs: slugs };
    }),
    trust: [
      { id: "shipping", title: "Fast Shipping", titleAr: "توصيل سريع", text: "Safe delivery to all governorates in 2–5 days.", textAr: "توصيل سريع وآمن لجميع المحافظات خلال 2-5 ايام" },
      { id: "secure", title: "Secure Shopping", titleAr: "تسوق آمن", text: "100% secure payments and full protection for your data.", textAr: "دفع آمن 100% وحماية كاملة لبياناتك ومشترياتك" },
      { id: "return", title: "Easy Return", titleAr: "استبدال واسترجاع", text: "Easy replacement and returns per the approved warranty policy.", textAr: "استبدال واسترجاع بسهولة طبقًا لسياسة الضمان المعتمدة" },
      { id: "support", title: "24h Service", titleAr: "خدمة 24 ساعة", text: "Technical support and customer service ready all day.", textAr: "دعم فني وخدمة عملاء جاهزين للرد على استفساراتك طوال اليوم" },
    ],
    contact: {
      phone: "01144413879",
      whatsapp: "201144413879",
      email: "info@turbo-computer.com",
      facebook: "https://www.facebook.com/Turbo.eg/",
    },
    slogans: ["تجميعة يعني تربو", "صورتك احلي في تربو ستور"],
  };

  const blogPosts = parseBlog(blogHtml);
  const detailedPosts = [];
  await mapPool(blogPosts.slice(0, 6), 2, async (post) => {
    try {
      const html = await fetchText(post.href);
      const parsed = parsePageContent(html, post.title);
      detailedPosts.push({
        slug: post.slug,
        title: post.title,
        excerpt: stripTags(parsed.html).slice(0, 180),
        html: parsed.html,
        date: "2026-08-01",
      });
    } catch {
      detailedPosts.push({ ...post, excerpt: "", html: `<p>${post.title}</p>`, date: "2026-08-01" });
    }
  });

  const pages = [
    ["about", `${ORIGIN}/about_us`, "About Turbo Store"],
    ["warranty", `${ORIGIN}/warranty`, "Warranty & FAQ"],
    ["privacy", `${ORIGIN}/privacy`, "Privacy Policy"],
    ["terms", `${ORIGIN}/terms`, "Terms & Conditions"],
    ["delivery", `${ORIGIN}/delivery`, "Delivery Information"],
  ];
  for (const [id, url, title] of pages) {
    try {
      const html = await fetchText(url);
      await writeJson(join(OUT, "pages", `${id}.json`), parsePageContent(html, title));
    } catch {
      await writeJson(join(OUT, "pages", `${id}.json`), { title, html: `<p>${title}</p>` });
    }
  }

  await writeJson(join(OUT, "products.json"), list);
  await writeJson(join(OUT, "categories.json"), CATEGORIES);
  await writeJson(join(OUT, "brands.json"), brands);
  await writeJson(join(OUT, "home.json"), home);
  await writeJson(join(OUT, "blog.json"), detailedPosts);
  await writeJson(join(OUT, "filters.json"), buildFilters(products));
  await writeJson(join(OUT, "builder.json"), buildBuilderCatalog(products));

  console.log(`Done. products=${ok} failed=${fail} brands=${brands.length} rails=${rails.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
