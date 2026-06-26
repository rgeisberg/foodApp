(function () {
  function slugify(value) {
    return String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }

  function buildRecipeKey(title, sourceUrl) {
    const urlPart = sourceUrl.split("/").filter(Boolean).pop() || "recipe";
    return `${slugify(title || "recipe")}-${slugify(urlPart)}`.slice(0, 120);
  }

  function collectRecipeObjects(value, results) {
    if (Array.isArray(value)) {
      value.forEach((item) => collectRecipeObjects(item, results));
      return;
    }

    if (!value || typeof value !== "object") {
      return;
    }

    const typeValue = value["@type"];
    const types = Array.isArray(typeValue) ? typeValue : [typeValue];
    if (types.includes("Recipe")) {
      results.push(value);
    }

    if (Array.isArray(value["@graph"])) {
      collectRecipeObjects(value["@graph"], results);
    }
  }

  function extractDurationMinutes(value) {
    if (!value || typeof value !== "string") {
      return null;
    }

    const match = value.match(
      /^P(?:(?<days>\d+)D)?(?:T(?:(?<hours>\d+)H)?(?:(?<minutes>\d+)M)?(?:(?<seconds>\d+)S)?)?$/i,
    );

    if (!match || !match.groups) {
      return null;
    }

    const days = Number(match.groups.days || 0);
    const hours = Number(match.groups.hours || 0);
    const minutes = Number(match.groups.minutes || 0);
    const seconds = Number(match.groups.seconds || 0);
    return days * 24 * 60 + hours * 60 + minutes + Math.round(seconds / 60);
  }

  function extractServings(value) {
    if (typeof value === "number") {
      return value;
    }

    if (!value || typeof value !== "string") {
      return null;
    }

    const match = value.match(/\d+/);
    return match ? Number(match[0]) : null;
  }

  function normalizeInstructions(value) {
    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (typeof item === "string") {
            return item.trim();
          }

          if (item && typeof item === "object" && typeof item.text === "string") {
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

  function normalizeCategory(value) {
    if (typeof value === "string") {
      return value.trim() || null;
    }

    if (Array.isArray(value)) {
      const first = value.find((item) => typeof item === "string" && item.trim().length > 0);
      return first ? first.trim() : null;
    }

    return null;
  }

  function normalizeImage(value) {
    if (typeof value === "string") {
      return value;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const normalized = normalizeImage(item);
        if (normalized) {
          return normalized;
        }
      }
      return null;
    }

    if (value && typeof value === "object") {
      if (typeof value.url === "string") {
        return value.url;
      }

      if (typeof value.contentUrl === "string") {
        return value.contentUrl;
      }

      if (typeof value["@id"] === "string") {
        return value["@id"];
      }
    }

    return null;
  }

  function parseMinutesFromText(value) {
    if (!value || typeof value !== "string") {
      return null;
    }

    const normalized = value.toLowerCase().trim();
    const hourMatch = normalized.match(/(\d+)\s*hour/);
    const minuteMatch = normalized.match(/(\d+)\s*minute/);

    if (hourMatch || minuteMatch) {
      const hours = hourMatch ? Number(hourMatch[1]) : 0;
      const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
      return hours * 60 + minutes;
    }

    const rangeMatch = normalized.match(/(\d+)\s*(?:to|-)\s*(\d+)\s*minutes?/);
    if (rangeMatch) {
      return Number(rangeMatch[2]);
    }

    const plainMinuteMatch = normalized.match(/(\d+)\s*minutes?/);
    if (plainMinuteMatch) {
      return Number(plainMinuteMatch[1]);
    }

    return null;
  }

  function fallbackTotalTimeFromPage() {
    const labels = Array.from(document.querySelectorAll("dt"));
    for (const label of labels) {
      if (label.textContent && label.textContent.trim().toLowerCase() === "total time") {
        const valueNode = label.nextElementSibling;
        if (valueNode && valueNode.textContent) {
          return parseMinutesFromText(valueNode.textContent);
        }
      }
    }

    const bodyText = document.body ? document.body.innerText : "";
    const inlineMatch = bodyText.match(/Total Time\s+([^\n]+)/i);
    return inlineMatch ? parseMinutesFromText(inlineMatch[1]) : null;
  }

  function fallbackImageFromPage() {
    const selectors = [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      'meta[name="twitter:image:src"]',
      'meta[itemprop="image"]',
      'link[rel="image_src"]',
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      const content = element && (element.getAttribute("content") || element.getAttribute("href"));
      if (content) {
        return content;
      }
    }

    const image = document.querySelector("img");
    return image ? image.currentSrc || image.src || null : null;
  }

  const payloads = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
    .map((script) => script.textContent && script.textContent.trim())
    .filter(Boolean)
    .flatMap((text) => {
      try {
        return [JSON.parse(text)];
      } catch {
        return [];
      }
    });

  const recipeObjects = [];
  payloads.forEach((payload) => collectRecipeObjects(payload, recipeObjects));

  if (recipeObjects.length === 0) {
    throw new Error("No Recipe JSON-LD object found on this page.");
  }

  const recipe = recipeObjects[0];
  const sourceUrl = window.location.href;
  const title = String(recipe.name || document.title || "Untitled Recipe").trim();
  const normalized = {
    recipeKey: buildRecipeKey(title, sourceUrl),
    sourceUrl,
    title,
    description: typeof recipe.description === "string" ? recipe.description.trim() : "",
    category: normalizeCategory(recipe.recipeCategory),
    imageUrl: normalizeImage(recipe.image) || fallbackImageFromPage(),
    prepTime: extractDurationMinutes(recipe.prepTime),
    cookTime: extractDurationMinutes(recipe.cookTime),
    totalTime: extractDurationMinutes(recipe.totalTime) || fallbackTotalTimeFromPage(),
    servings: extractServings(recipe.recipeYield),
    ingredients: Array.isArray(recipe.recipeIngredient)
      ? recipe.recipeIngredient.map((item) => String(item).trim()).filter(Boolean)
      : [],
    instructions: normalizeInstructions(recipe.recipeInstructions),
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(normalized, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${normalized.recipeKey}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);

  console.log("Downloaded recipe JSON:", normalized.recipeKey, normalized);
})();
