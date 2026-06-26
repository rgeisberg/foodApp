import fs from "node:fs/promises";
import path from "node:path";

export const ROOT_DIR = path.resolve(process.cwd());
export const DATA_DIR = path.join(ROOT_DIR, "data", "nyt");
export const URLS_FILE = path.join(DATA_DIR, "urls.txt");
export const HTML_DIR = path.join(DATA_DIR, "html");
export const JSON_DIR = path.join(DATA_DIR, "json");
export const PDF_DIR = path.join(DATA_DIR, "pdfs");
export const CSV_DIR = path.join(DATA_DIR, "csv");
export const BROWSER_PROFILE_DIR = path.join(DATA_DIR, "browser-profile");

const KNOWN_UNITS = new Set([
  "teaspoon",
  "teaspoons",
  "tsp",
  "tablespoon",
  "tablespoons",
  "tbsp",
  "cup",
  "cups",
  "pint",
  "pints",
  "quart",
  "quarts",
  "gallon",
  "gallons",
  "ounce",
  "ounces",
  "oz",
  "pound",
  "pounds",
  "lb",
  "lbs",
  "gram",
  "grams",
  "g",
  "kilogram",
  "kilograms",
  "kg",
  "milliliter",
  "milliliters",
  "ml",
  "liter",
  "liters",
  "l",
  "clove",
  "cloves",
  "sprig",
  "sprigs",
  "slice",
  "slices",
  "can",
  "cans",
  "package",
  "packages",
  "bunch",
  "bunches",
  "pinch",
  "pinches",
  "dash",
  "dashes",
]);

export async function ensureDirectories() {
  await Promise.all(
    [DATA_DIR, HTML_DIR, JSON_DIR, PDF_DIR, CSV_DIR, BROWSER_PROFILE_DIR].map((dir) =>
      fs.mkdir(dir, { recursive: true }),
    ),
  );
}

export async function readRecipeUrls() {
  const content = await fs.readFile(URLS_FILE, "utf8");
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

export function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function buildRecipeKey({ title, sourceUrl }) {
  const urlPart = sourceUrl.split("/").filter(Boolean).pop() ?? "recipe";
  return `${slugify(title || "recipe")}-${slugify(urlPart)}`.slice(0, 120);
}

export function extractDurationMinutes(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const match = value.match(
    /^P(?:(?<days>\d+)D)?(?:T(?:(?<hours>\d+)H)?(?:(?<minutes>\d+)M)?(?:(?<seconds>\d+)S)?)?$/i,
  );

  if (!match?.groups) {
    return null;
  }

  const days = Number(match.groups.days ?? 0);
  const hours = Number(match.groups.hours ?? 0);
  const minutes = Number(match.groups.minutes ?? 0);
  const seconds = Number(match.groups.seconds ?? 0);

  return days * 24 * 60 + hours * 60 + minutes + Math.round(seconds / 60);
}

export function extractServings(value) {
  if (typeof value === "number") {
    return value;
  }

  if (!value || typeof value !== "string") {
    return null;
  }

  const match = value.match(/\d+/);
  return match ? Number(match[0]) : null;
}

export function normalizeInstructions(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          return item.trim();
        }

        if (item && typeof item === "object" && "text" in item && typeof item.text === "string") {
          return item.text.trim();
        }

        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return "";
}

export function normalizeImage(value) {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === "string");
    return typeof first === "string" ? first : null;
  }

  if (value && typeof value === "object" && "url" in value && typeof value.url === "string") {
    return value.url;
  }

  return null;
}

export function normalizeCategory(value) {
  if (typeof value === "string") {
    return value.trim() || null;
  }

  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === "string" && item.trim().length > 0);
    return typeof first === "string" ? first.trim() : null;
  }

  return null;
}

function normalizeUnicodeFractions(input) {
  return input
    .replaceAll("½", "1/2")
    .replaceAll("⅓", "1/3")
    .replaceAll("⅔", "2/3")
    .replaceAll("¼", "1/4")
    .replaceAll("¾", "3/4")
    .replaceAll("⅛", "1/8");
}

export function parseIngredientLine(line) {
  const raw = String(line ?? "").trim().replace(/\s+/g, " ");

  if (!raw) {
    return {
      raw,
      amount: "",
      unit: "",
      ingredient: "",
    };
  }

  const normalized = normalizeUnicodeFractions(raw);
  const parts = normalized.split(" ");
  const amountParts = [];
  let index = 0;

  while (index < parts.length) {
    const token = parts[index];
    if (/^\d+([./-]\d+)?$/.test(token) || /^\d+\.\d+$/.test(token)) {
      amountParts.push(token);
      index += 1;
      continue;
    }

    break;
  }

  let unit = "";
  if (index < parts.length && KNOWN_UNITS.has(parts[index].toLowerCase().replace(/[.,]$/, ""))) {
    unit = parts[index].replace(/[.,]$/, "");
    index += 1;
  }

  return {
    raw,
    amount: amountParts.join(" "),
    unit,
    ingredient: parts.slice(index).join(" ").trim(),
  };
}

export function escapeCsvValue(value) {
  const stringValue = String(value ?? "");
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

export function toCsv(headers, rows) {
  const headerLine = headers.join(",");
  const bodyLines = rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(","));
  return [headerLine, ...bodyLines].join("\n");
}

export function recipeToPrintableHtml(recipe) {
  const ingredients = recipe.ingredients
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("");
  const instructions = recipe.instructions
    .split("\n")
    .filter(Boolean)
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(recipe.title)}</title>
    <style>
      body { font-family: Georgia, serif; margin: 36px; color: #222; }
      h1, h2 { margin-bottom: 8px; }
      .meta { color: #555; margin-bottom: 20px; }
      img { max-width: 100%; border-radius: 12px; margin: 16px 0 20px; }
      ul, ol { padding-left: 22px; }
      section { margin-bottom: 24px; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(recipe.title)}</h1>
    <p class="meta">${escapeHtml(recipe.sourceUrl)}</p>
    ${recipe.imageUrl ? `<img src="${escapeHtml(recipe.imageUrl)}" alt="${escapeHtml(recipe.title)}" />` : ""}
    ${recipe.description ? `<p>${escapeHtml(recipe.description)}</p>` : ""}
    <section>
      <h2>Ingredients</h2>
      <ul>${ingredients}</ul>
    </section>
    <section>
      <h2>Instructions</h2>
      <ol>${instructions}</ol>
    </section>
  </body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
