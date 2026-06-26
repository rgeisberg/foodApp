export type Recipe = {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  instructions: string;
  source: string | null;
  sourceUrl: string | null;
  notes: string | null;
  haveIMadeItBefore: boolean;
  frequentlyMade: boolean;
  timesMade: number;
  lastMadeAt: string | null;
  prepTime: number | null;
  cookTime: number | null;
  totalTime: number | null;
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

export type RecipeMakeLogEntry = {
  id: string;
  madeAt: string;
  userId: string;
  recipe: {
    id: string;
    title: string;
    category: string | null;
    imageUrl?: string | null;
    lastMadeAt: string | null;
    timesMade: number;
    source: string | null;
    sourceUrl: string | null;
  };
};
