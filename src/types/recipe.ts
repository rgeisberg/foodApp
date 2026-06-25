export type Recipe = {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  instructions: string;
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  imageUrl?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type RecipeIngredient = {
  id: string;
  recipeId: string;
  ingredient: string;
  amount: string | null;
  unit: string | null;
  sortOrder: number;
};
