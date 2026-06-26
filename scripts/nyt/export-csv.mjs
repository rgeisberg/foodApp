import fs from "node:fs/promises";
import path from "node:path";
import {
  CSV_DIR,
  JSON_DIR,
  ensureDirectories,
  parseIngredientLine,
  toCsv,
} from "./shared.mjs";

async function listJsonFilesRecursively(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listJsonFilesRecursively(fullPath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(fullPath);
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

async function loadRecipes() {
  const fileNames = await listJsonFilesRecursively(JSON_DIR);
  const recipes = [];

  for (const fileName of fileNames) {
    const raw = await fs.readFile(fileName, "utf8");
    recipes.push(JSON.parse(raw));
  }

  return recipes;
}

async function main() {
  await ensureDirectories();
  const recipes = await loadRecipes();

  if (recipes.length === 0) {
    throw new Error("No parsed recipe JSON files found in data/nyt/json");
  }

  const recipeRows = recipes.map((recipe) => ({
    import_key: recipe.recipeKey,
    source_url: recipe.sourceUrl,
    title: recipe.title,
    category: recipe.category ?? "",
    description: recipe.description ?? "",
    instructions: recipe.instructions ?? "",
    prep_time: recipe.prepTime ?? "",
    cook_time: recipe.cookTime ?? "",
    total_time: recipe.totalTime ?? "",
    servings: recipe.servings ?? "",
    image_url: recipe.imageUrl ?? "",
  }));

  const ingredientRows = recipes.flatMap((recipe) =>
    (recipe.ingredients ?? []).map((line, index) => {
      const parsed = parseIngredientLine(line);
      return {
        import_key: recipe.recipeKey,
        source_url: recipe.sourceUrl,
        sort_order: index,
        amount: parsed.amount,
        unit: parsed.unit,
        ingredient: parsed.ingredient || parsed.raw,
        raw_ingredient_line: parsed.raw,
      };
    }),
  );

  const recipesCsv = toCsv(
    [
      "import_key",
      "source_url",
      "title",
      "category",
      "description",
      "instructions",
      "prep_time",
      "cook_time",
      "total_time",
      "servings",
      "image_url",
    ],
    recipeRows,
  );

  const ingredientsCsv = toCsv(
    ["import_key", "source_url", "sort_order", "amount", "unit", "ingredient", "raw_ingredient_line"],
    ingredientRows,
  );

  await fs.writeFile(path.join(CSV_DIR, "recipes.csv"), recipesCsv, "utf8");
  await fs.writeFile(path.join(CSV_DIR, "recipe_ingredients.csv"), ingredientsCsv, "utf8");

  console.log(`Exported ${recipeRows.length} recipes and ${ingredientRows.length} ingredients to data/nyt/csv`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
