import { supabase } from "../../lib/supabase";
import type { Recipe, RecipeIngredient } from "../../types/recipe";

type RecipeRow = {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  instructions: string;
  prep_time: number | null;
  cook_time: number | null;
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

function mapRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description,
    instructions: row.instructions,
    prepTime: row.prep_time,
    cookTime: row.cook_time,
    servings: row.servings,
    imageUrl: row.image_url,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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

export async function listRecipes() {
  const { data, error } = await supabase
    .from("recipes")
    .select(
      "id, title, category, description, instructions, prep_time, cook_time, servings, image_url, created_by, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data as RecipeRow[]).map(mapRecipe);
}

export async function getRecipeById(recipeId: string) {
  const { data, error } = await supabase
    .from("recipes")
    .select(
      "id, title, category, description, instructions, prep_time, cook_time, servings, image_url, created_by, created_at, updated_at",
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
