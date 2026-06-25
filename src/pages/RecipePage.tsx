import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getRecipeById, listRecipeIngredients } from "../features/recipes/api";
import { useAuth } from "../lib/auth";
import type { Recipe, RecipeIngredient } from "../types/recipe";

export function RecipePage() {
  const { recipeId } = useParams();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!isAuthenticated || !recipeId) {
      setRecipe(null);
      setIngredients([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    void Promise.all([getRecipeById(recipeId), listRecipeIngredients(recipeId)])
      .then(([recipeData, ingredientData]) => {
        if (!isMounted) {
          return;
        }

        setRecipe(recipeData);
        setIngredients(ingredientData);
        setErrorMessage(null);
      })
      .catch((error: { message?: string }) => {
        if (!isMounted) {
          return;
        }

        setErrorMessage(error.message ?? "Unable to load recipe.");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isAuthLoading, recipeId]);

  const instructionSteps = recipe?.instructions
    .split("\n")
    .map((step) => step.trim())
    .filter(Boolean);

  if (isAuthLoading || isLoading) {
    return (
      <section className="panel">
        <p className="muted">Loading recipe...</p>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="panel">
        <h2>Sign in required</h2>
        <p className="muted">Sign in to view recipes and save favorites.</p>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="panel">
        <h2>Unable to load recipe</h2>
        <p className="status-message error">{errorMessage}</p>
      </section>
    );
  }

  if (!recipe) {
    return (
      <section className="panel">
        <h2>Recipe not found</h2>
        <p className="muted">This recipe does not exist or is not accessible to the current user.</p>
      </section>
    );
  }

  return (
    <section className="panel stack">
      <div className="panel-header">
        <div>
          <p className="recipe-meta">{recipe.category ?? "Uncategorized"}</p>
          <h2>{recipe.title}</h2>
        </div>
        <button className="button-secondary" type="button">
          Favorite
        </button>
      </div>

      <p>{recipe.description ?? "No description yet."}</p>

      <div className="detail-grid">
        <div className="meta-block">
          <h3>Details</h3>
          <ul className="simple-list">
            <li>Prep time: {recipe.prepTime ? `${recipe.prepTime} min` : "Not set"}</li>
            <li>Cook time: {recipe.cookTime ? `${recipe.cookTime} min` : "Not set"}</li>
            <li>Servings: {recipe.servings ?? "Not set"}</li>
          </ul>
        </div>
      </div>

      <div className="detail-grid">
        <div>
          <h3>Ingredients</h3>
          {ingredients.length === 0 ? (
            <p className="muted">No ingredients added yet.</p>
          ) : (
            <ul className="simple-list">
              {ingredients.map((item) => (
                <li key={item.id}>
                  {[item.amount, item.unit, item.ingredient].filter(Boolean).join(" ")}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3>Instructions</h3>
          {instructionSteps && instructionSteps.length > 0 ? (
            <ol className="simple-list">
              {instructionSteps.map((step, index) => (
                <li key={`${recipe.id}-${index}`}>{step}</li>
              ))}
            </ol>
          ) : (
            <p className="muted">No instructions added yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
