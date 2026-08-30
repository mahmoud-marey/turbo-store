#!/usr/bin/env node
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = join(ROOT, "public", "data");

function blob(p) {
  return `${p.name} ${p.model} ${(p.tags || []).join(" ")} ${(p.specs || []).map((s) => `${s.label} ${s.value}`).join(" ")}`.toLowerCase();
}

function classify(p) {
  const t = blob(p);
  if (/laptop|notebook|vivobook|ideapad|loq |legion|nitro v|tuf gaming [af]|predator|macbook/.test(t)) return ["laptops"];
  if (/تجميعة|pc bundle|turbo intel|turbo amd/.test(t)) return ["pc-bundle"];
  if (/\bmonitor\b|gaming monitor|ips 1\d{2}hz|rapid ips/.test(t) && !/laptop/.test(t)) return ["monitors-displays"];
  if (/motherboard|mainboard|b650|b760|b850|z790|x870/.test(t)) return ["motherboards"];
  if (/(graphics card|vga|geforce|radeon rx|rtx \d{4}|gtx \d{4})/.test(t) && !/laptop/.test(t)) return ["graphics-cards"];
  if (/(processor|desktop cpu|\bcpu\b|ryzen \d|core i[3579]|core ultra)/.test(t) && !/laptop/.test(t)) return ["processors-cpus"];
  if (/(udimm|dimm|desktop ram|ddr[45].*mhz)/.test(t) && !/laptop/.test(t)) return ["computer-memory-ram"];
  if (/(nvme|m\.2|ssd)/.test(t) && !/laptop|headset/.test(t)) return ["ssd-external-storage"];
  if (/(hard drive|hdd|3\.5")/.test(t)) return ["hard-drives"];
  if (/(power supply|psu|80 plus|80plus)/.test(t)) return ["power-supplies"];
  if (/(cpu (air )?cooler|aio|liquid cpu|thermal)/.test(t)) return ["pc-cooling-thermal-solutions"];
  if (/(mid tower|full tower|pc case|chassis|panoramic)/.test(t)) return ["pc-cases-chasses"];
  if (/headset|headphone/.test(t)) return ["headphones-headsets"];
  if (/keyboard.*mouse|mouse.*keyboard|combo/.test(t)) return ["keyboard-mouse-combos"];
  if (/keyboard|keycaps/.test(t)) return ["keyboards-input-devices"];
  if (/mouse pad|desk mat/.test(t)) return ["gaming-mouse-pads-desk-mats"];
  if (/\bmouse\b|mice/.test(t)) return ["mice"];
  if (/gamepad|controller|joystick/.test(t)) return ["gamepads-controllers"];
  if (/webcam/.test(t)) return ["webcams"];
  if (/microphone|mic /.test(t)) return ["microphones-audio-gear"];
  if (/dock|hub /.test(t)) return ["converters-docking-stations"];
  if (/cable|adapter|hdmi|displayport/.test(t)) return ["cables-adapters"];
  if (/cooling pad|laptop stand/.test(t)) return ["laptop-cooling-pads-stands"];
  if (/bag|sleeve|backpack/.test(t)) return ["laptop-bags-sleeves"];
  if (/flash|usb stick/.test(t)) return ["usb-flash-drives"];
  if (/router|switch|access point|mesh/.test(t)) return ["networking"];
  if (/pos |point of sale|barcode/.test(t)) return ["point-of-sale"];
  if (/projector/.test(t)) return ["projectors"];
  if (/camera|surveillance/.test(t)) return ["surveillance-cameras"];
  if (/presenter|laser pointer/.test(t)) return ["presenters-laser-pointers"];
  return ["accessories"];
}

function inferSocket(text) {
  const t = text.toUpperCase();
  if (/\bAM5\b|7600X|7700|7800|7900|7950|8400F|8600|8700|9000/.test(t)) return "AM5";
  if (/\bAM4\b|3600|5500|5600|5700/.test(t)) return "AM4";
  if (/LGA\s?1851|CORE ULTRA/.test(t)) return "LGA1851";
  if (/LGA\s?1700|12\d{3}|13\d{3}|14\d{3}/.test(t)) return "LGA1700";
  return null;
}

async function main() {
  const files = (await readdir(join(OUT, "products"))).filter((f) => f.endsWith(".json"));
  const products = [];
  for (const f of files) {
    if (f.includes("*") || f.includes(",")) continue;
    const p = JSON.parse(await readFile(join(OUT, "products", f), "utf8"));
    p.categorySlugs = classify(p);
    if (p.inStock && !p.stock) p.stock = 3;
    await writeFile(join(OUT, "products", f), JSON.stringify(p, null, 2));
    products.push(p);
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
    tags: (p.tags || []).slice(0, 8),
    shortDescription: p.shortDescription,
    rating: p.rating,
    reviewCount: p.reviewCount,
    specs: p.specs || [],
  }));
  await writeFile(join(OUT, "products.json"), JSON.stringify(list, null, 2));

  const byCat = (slug) => products.filter((p) => p.categorySlugs.includes(slug));
  const mapPart = (p, extra) => ({ slug: p.slug, name: p.name, price: p.price, image: p.image, brand: p.brand, ...extra });
  const builder = {
    cpu: byCat("processors-cpus").map((p) => mapPart(p, { socket: inferSocket(`${p.name} ${p.specs.map((s) => s.value).join(" ")}`) })),
    motherboard: byCat("motherboards").map((p) => mapPart(p, { socket: inferSocket(p.name), ramType: /DDR5/i.test(p.name) ? "DDR5" : "DDR4", form: /MATX|MICRO/i.test(p.name) ? "mATX" : "ATX" })),
    ram: byCat("computer-memory-ram").map((p) => mapPart(p, { ramType: /DDR5/i.test(p.name) ? "DDR5" : "DDR4" })),
    gpu: byCat("graphics-cards").map((p) => mapPart(p, { tdp: 180 })),
    storage: byCat("ssd-external-storage").concat(byCat("hard-drives")).map((p) => mapPart(p, {})),
    psu: byCat("power-supplies").map((p) => mapPart(p, { wattage: Number((p.name.match(/(\d{3,4})\s?W/i) || [])[1]) || 650 })),
    case: byCat("pc-cases-chasses").map((p) => mapPart(p, { form: "ATX" })),
    cooler: byCat("pc-cooling-thermal-solutions").map((p) => mapPart(p, {})),
  };
  await writeFile(join(OUT, "builder.json"), JSON.stringify(builder, null, 2));

  const home = JSON.parse(await readFile(join(OUT, "home.json"), "utf8"));
  home.categoryTiles = [
    { slug: "hard-drives", name: "PORTABLE STORAGE", fromLabel: "from 4.500LE", image: "https://turbo-computer.com/image/cache/catalog/b2-370x220w.jpeg" },
    { slug: "laptops", name: "LAPTOP", fromLabel: "from 12.000LE", image: "https://turbo-computer.com/image/cache/catalog/b3-370x220w.jpeg" },
    { slug: "monitors-displays", name: "GAMING MONITORS", fromLabel: "from 5.200LE", image: "https://turbo-computer.com/image/cache/catalog/b4-370x220w.jpeg" },
    { slug: "headphones-headsets", name: "Headphones", fromLabel: "from 500LE", image: "https://turbo-computer.com/image/cache/catalog/b1-370x220w.jpeg" },
  ];
  await writeFile(join(OUT, "home.json"), JSON.stringify(home, null, 2));

  const cats = JSON.parse(await readFile(join(OUT, "categories.json"), "utf8"));
  for (const c of cats) c.productCount = products.filter((p) => p.categorySlugs.includes(c.slug)).length;
  await writeFile(join(OUT, "categories.json"), JSON.stringify(cats, null, 2));

  console.log(`Normalized ${products.length} products. laptops=${byCat("laptops").length} cpu=${builder.cpu.length} gpu=${builder.gpu.length}`);
}

main();
