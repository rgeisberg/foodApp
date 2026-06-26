import { supabase } from "../../lib/supabase";
import type { Recipe, RecipeIngredient, RecipeMakeLogEntry } from "../../types/recipe";

const RECIPE_IMAGE_BUCKET = "recipe-images";
const FREQUENTLY_MADE_THRESHOLD = 6;
function isExcludedChickenSearchIngredient(ingredient: string) {
  const normalizedIngredient = ingredient.toLowerCase();

  return (
    normalizedIngredient.includes("chicken broth") ||
    normalizedIngredient.includes("chicken stock") ||
    (normalizedIngredient.includes("chicken") &&
      (normalizedIngredient.includes("broth") || normalizedIngredient.includes("stock")))
  );
}

function isExcludedVegetableSearchIngredient(ingredient: string) {
  return ingredient.toLowerCase().includes("vegetable oil");
}

type RecipeRow = {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  instructions: string;
  source: string | null;
  source_url: string | null;
  notes: string | null;
  have_i_made_it_before: boolean;
  frequently_made: boolean;
  times_made: number;
  last_made_at: string | null;
  prep_time: number | null;
  cook_time: number | null;
  total_time: number | null;
  servings: number | null;
  image_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type RecipeIngredientRow = {
  id: string;
  recipe_id: string;
  ingredient: string;
  amount: string | null;
  unit: string | null;
  sort_order: number;
};

type RecipeWithIngredientsRow = RecipeRow & {
  recipe_ingredients?: Array<{
    ingredient: string;
  }> | null;
};

type RecipeMakeLogRow = {
  id: string;
  made_at: string;
  user_id: string;
  recipes: RecipeRow | RecipeRow[] | null;
};

function mapRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description,
    instructions: row.instructions,
    source: row.source,
    sourceUrl: row.source_url,
    notes: row.notes,
    haveIMadeItBefore: row.have_i_made_it_before,
    frequentlyMade: row.frequently_made,
    timesMade: row.times_made,
    lastMadeAt: row.last_made_at,
    prepTime: row.prep_time,
    cookTime: row.cook_time,
    totalTime: row.total_time,
    servings: row.servings,
    imageUrl: row.image_url,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMakeLogEntry(row: RecipeMakeLogRow): RecipeMakeLogEntry | null {
  const recipeRow = Array.isArray(row.recipes) ? row.recipes[0] : row.recipes;
  if (!recipeRow) {
    return null;
  }

  const recipe = mapRecipe(recipeRow);
  return {
    id: row.id,
    madeAt: row.made_at,
    userId: row.user_id,
    recipe: {
      id: recipe.id,
      title: recipe.title,
      category: recipe.category,
      imageUrl: recipe.imageUrl,
      lastMadeAt: recipe.lastMadeAt,
      timesMade: recipe.timesMade,
      source: recipe.source,
      sourceUrl: recipe.sourceUrl,
    },
  };
}

function mapIngredient(row: RecipeIngredientRow): RecipeIngredient {
  return {
    id: row.id,
    recipeId: row.recipe_id,
    ingredient: row.ingredient,
    amount: row.amount,
    unit: row.unit,
    sortOrder: row.sort_order,
  };
}

function getStoragePathFromPublicUrl(publicUrl: string) {
  try {
    const url = new URL(publicUrl);
    const marker = `/object/public/${RECIPE_IMAGE_BUCKET}/`;
    const markerIndex = url.pathname.indexOf(marker);

    if (markerIndex === -1) {
      return null;
    }

    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}

function shouldMarkFrequentlyMade(timesMade: number, manuallyMarked: boolean) {
  return manuallyMarked || timesMade >= FREQUENTLY_MADE_THRESHOLD;
}

export async function listRecipes() {
  const { data, error } = await supabase
    .from("recipes")
    .select(
      "id, title, category, description, instructions, source, source_url, notes, have_i_made_it_before, frequently_made, times_made, last_made_at, prep_time, cook_time, total_time, servings, image_url, created_by, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data as RecipeRow[]).map(mapRecipe);
}

export async function searchRecipes(query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  const { data, error } = await supabase
    .from("recipes")
    .select(
      "id, title, category, description, instructions, source, source_url, notes, have_i_made_it_before, frequently_made, times_made, last_made_at, prep_time, cook_time, total_time, servings, image_url, created_by, created_at, updated_at, recipe_ingredients(ingredient)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const recipeRows = (data as RecipeWithIngredientsRow[]) ?? [];

  if (!normalizedQuery) {
    return recipeRows.map((row) => mapRecipe(row));
  }

  return recipeRows
    .filter((row) => {
      const normalizedIngredients = (row.recipe_ingredients ?? []).map((ingredientRow) =>
        ingredientRow.ingredient.toLowerCase(),
      );

      if (
        normalizedQuery === "chicken" &&
        normalizedIngredients.some((ingredient) => isExcludedChickenSearchIngredient(ingredient))
      ) {
        return false;
      }

      if (
        normalizedQuery === "vegetable" &&
        normalizedIngredients.some((ingredient) => isExcludedVegetableSearchIngredient(ingredient))
      ) {
        return false;
      }

      const ingredientsText = normalizedIngredients.join(" ");

      const haystack = [
        row.title,
        row.category ?? "",
        row.instructions,
        row.notes ?? "",
        row.source ?? "",
        row.source_url ?? "",
        ingredientsText,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    })
    .map((row) => mapRecipe(row));
}

export async function getRecipeById(recipeId: string) {
  const { data, error } = await supabase
    .from("recipes")
    .select(
      "id, title, category, description, instructions, source, source_url, notes, have_i_made_it_before, frequently_made, times_made, last_made_at, prep_time, cook_time, total_time, servings, image_url, created_by, created_at, updated_at",
    )
    .eq("id", recipeId)
    .single();

  if (error) {
    throw error;
  }

  return mapRecipe(data as RecipeRow);
}

export async function listRecipeIngredients(recipeId: string) {
  const { data, error } = await supabase
    .from("recipe_ingredients")
    .select("id, recipe_id, ingredient, amount, unit, sort_order")
    .eq("recipe_id", recipeId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return (data as RecipeIngredientRow[]).map(mapIngredient);
}

export async function isRecipeFavorited(recipeId: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from("recipe_favorites")
    .select("recipe_id")
    .eq("user_id", user.id)
    .eq("recipe_id", recipeId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function addRecipeFavorite(recipeId: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be signed in to favorite a recipe.");
  }

  const { error } = await supabase.from("recipe_favorites").insert({
    user_id: user.id,
    recipe_id: recipeId,
  });

  if (error) {
    throw error;
  }
}

export async function removeRecipeFavorite(recipeId: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be signed in to remove a favorite.");
  }

  const { error } = await supabase
    .from("recipe_favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("recipe_id", recipeId);

  if (error) {
    throw error;
  }
}

export async function listFavoriteRecipes() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("recipe_favorites")
    .select(
      "created_at, recipes!inner(id, title, category, description, instructions, source, source_url, notes, have_i_made_it_before, frequently_made, times_made, last_made_at, prep_time, cook_time, total_time, servings, image_url, created_by, created_at, updated_at)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data as Array<{ recipes: RecipeRow | RecipeRow[] | null }>) ?? [])
    .map((item) => {
      const recipeRow = Array.isArray(item.recipes) ? item.recipes[0] : item.recipes;
      return recipeRow ? mapRecipe(recipeRow) : null;
    })
    .filter((recipe): recipe is Recipe => recipe !== null);
}

export async function listFrequentlyMadeRecipes() {
  const { data, error } = await supabase
    .from("recipes")
    .select(
      "id, title, category, description, instructions, source, source_url, notes, have_i_made_it_before, frequently_made, times_made, last_made_at, prep_time, cook_time, total_time, servings, image_url, created_by, created_at, updated_at",
    )
    .eq("frequently_made", true)
    .order("times_made", { ascending: false })
    .order("title", { ascending: true });

  if (error) {
    throw error;
  }

  return (data as RecipeRow[]).map(mapRecipe);
}

export async function listRecipeMakeHistory() {
  const { data, error } = await supabase
    .from("recipe_make_log")
    .select(
      "id, made_at, user_id, recipes!inner(id, title, category, description, instructions, source, source_url, notes, have_i_made_it_before, frequently_made, times_made, last_made_at, prep_time, cook_time, total_time, servings, image_url, created_by, created_at, updated_at)",
    )
    .order("made_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data as RecipeMakeLogRow[]) ?? [])
    .map(mapMakeLogEntry)
    .filter((entry): entry is RecipeMakeLogEntry => entry !== null);
}

type CreateRecipeInput = {
  title: string;
  category: string;
  description: string;
  instructions: string;
  source: string;
  sourceUrl: string;
  notes: string;
  haveIMadeItBefore: boolean;
  frequentlyMade: boolean;
  timesMade: number;
  prepTime: number | null;
  cookTime: number | null;
  totalTime: number | null;
  servings: number | null;
  imageFile: File;
  ingredients: Array<{
    ingredient: string;
    amount: string;
    unit: string;
  }>;
};

type UpdateRecipeInput = {
  recipeId: string;
  title: string;
  category: string;
  description: string;
  instructions: string;
  source: string;
  sourceUrl: string;
  notes: string;
  haveIMadeItBefore: boolean;
  frequentlyMade: boolean;
  timesMade: number;
  prepTime: number | null;
  cookTime: number | null;
  totalTime: number | null;
  servings: number | null;
  imageFile?: File | null;
  existingImageUrl?: string | null;
  ingredients: Array<{
    ingredient: string;
    amount: string;
    unit: string;
  }>;
};

export async function createRecipe(input: CreateRecipeInput) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be signed in to create a recipe.");
  }

  const fileExt = input.imageFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(RECIPE_IMAGE_BUCKET)
    .upload(filePath, input.imageFile, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(RECIPE_IMAGE_BUCKET).getPublicUrl(filePath);

  const frequentlyMade = shouldMarkFrequentlyMade(input.timesMade, input.frequentlyMade);

  const { data, error } = await supabase
    .from("recipes")
    .insert({
      title: input.title,
      category: input.category || null,
      description: input.description || null,
      instructions: input.instructions,
      source: input.source || null,
      source_url: input.sourceUrl || null,
      notes: input.notes || null,
      have_i_made_it_before: input.haveIMadeItBefore,
      frequently_made: frequentlyMade,
      times_made: input.timesMade,
      prep_time: input.prepTime,
      cook_time: input.cookTime,
      total_time: input.totalTime,
      servings: input.servings,
      image_url: publicUrl,
      created_by: user.id,
    })
    .select(
      "id, title, category, description, instructions, source, source_url, notes, have_i_made_it_before, frequently_made, times_made, last_made_at, prep_time, cook_time, total_time, servings, image_url, created_by, created_at, updated_at",
    )
    .single();

  if (error) {
    throw error;
  }

  const trimmedIngredients = input.ingredients
    .map((item, index) => ({
      recipe_id: (data as RecipeRow).id,
      ingredient: item.ingredient.trim(),
      amount: item.amount.trim() || null,
      unit: item.unit.trim() || null,
      sort_order: index,
    }))
    .filter((item) => item.ingredient.length > 0);

  if (trimmedIngredients.length > 0) {
    const { error: ingredientError } = await supabase
      .from("recipe_ingredients")
      .insert(trimmedIngredients);

    if (ingredientError) {
      throw ingredientError;
    }
  }

  return mapRecipe(data as RecipeRow);
}

export async function updateRecipe(input: UpdateRecipeInput) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be signed in to edit a recipe.");
  }

  let imageUrl = input.existingImageUrl ?? null;

  if (input.imageFile) {
    const fileExt = input.imageFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(RECIPE_IMAGE_BUCKET)
      .upload(filePath, input.imageFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(RECIPE_IMAGE_BUCKET).getPublicUrl(filePath);

    imageUrl = publicUrl;
  }

  const frequentlyMade = shouldMarkFrequentlyMade(input.timesMade, input.frequentlyMade);

  const { data, error } = await supabase
    .from("recipes")
    .update({
      title: input.title,
      category: input.category || null,
      description: input.description || null,
      instructions: input.instructions,
      source: input.source || null,
      source_url: input.sourceUrl || null,
      notes: input.notes || null,
      have_i_made_it_before: input.haveIMadeItBefore,
      frequently_made: frequentlyMade,
      times_made: input.timesMade,
      prep_time: input.prepTime,
      cook_time: input.cookTime,
      total_time: input.totalTime,
      servings: input.servings,
      image_url: imageUrl,
    })
    .eq("id", input.recipeId)
    .select(
      "id, title, category, description, instructions, source, source_url, notes, have_i_made_it_before, frequently_made, times_made, last_made_at, prep_time, cook_time, total_time, servings, image_url, created_by, created_at, updated_at",
    )
    .single();

  if (error) {
    throw error;
  }

  const { error: deleteIngredientsError } = await supabase
    .from("recipe_ingredients")
    .delete()
    .eq("recipe_id", input.recipeId);

  if (deleteIngredientsError) {
    throw deleteIngredientsError;
  }

  const trimmedIngredients = input.ingredients
    .map((item, index) => ({
      recipe_id: input.recipeId,
      ingredient: item.ingredient.trim(),
      amount: item.amount.trim() || null,
      unit: item.unit.trim() || null,
      sort_order: index,
    }))
    .filter((item) => item.ingredient.length > 0);

  if (trimmedIngredients.length > 0) {
    const { error: ingredientError } = await supabase
      .from("recipe_ingredients")
      .insert(trimmedIngredients);

    if (ingredientError) {
      throw ingredientError;
    }
  }

  return mapRecipe(data as RecipeRow);
}

export async function deleteRecipe(recipeId: string, imageUrl?: string | null) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be signed in to delete a recipe.");
  }

  const { error } = await supabase.from("recipes").delete().eq("id", recipeId);

  if (error) {
    throw error;
  }

  const storagePath = imageUrl ? getStoragePathFromPublicUrl(imageUrl) : null;

  if (storagePath) {
    const { error: storageError } = await supabase.storage
      .from(RECIPE_IMAGE_BUCKET)
      .remove([storagePath]);

    if (storageError) {
      throw storageError;
    }
  }
}

export async function markRecipeMade(recipeId: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be signed in to log a recipe.");
  }

  const madeAt = new Date().toISOString();

  const { error: logError } = await supabase.from("recipe_make_log").insert({
    recipe_id: recipeId,
    user_id: user.id,
    made_at: madeAt,
  });

  if (logError) {
    throw logError;
  }

  const { data: currentData, error: currentError } = await supabase
    .from("recipes")
    .select(
      "id, title, category, description, instructions, source, source_url, notes, have_i_made_it_before, frequently_made, times_made, last_made_at, prep_time, cook_time, total_time, servings, image_url, created_by, created_at, updated_at",
    )
    .eq("id", recipeId)
    .single();

  if (currentError) {
    throw currentError;
  }

  const current = mapRecipe(currentData as RecipeRow);
  const nextTimesMade = current.timesMade + 1;

  const { data, error } = await supabase
    .from("recipes")
    .update({
      have_i_made_it_before: true,
      frequently_made: shouldMarkFrequentlyMade(nextTimesMade, current.frequentlyMade),
      last_made_at: madeAt,
      times_made: nextTimesMade,
    })
    .eq("id", recipeId)
    .select(
      "id, title, category, description, instructions, source, source_url, notes, have_i_made_it_before, frequently_made, times_made, last_made_at, prep_time, cook_time, total_time, servings, image_url, created_by, created_at, updated_at",
    )
    .single();

  if (error) {
    throw error;
  }

  return mapRecipe(data as RecipeRow);
}
