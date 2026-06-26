import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  addRecipeFavorite,
  getRecipeById,
  isRecipeFavorited,
  listRecipeIngredients,
  markRecipeMade,
  removeRecipeFavorite,
} from "../features/recipes/api";
import { useAuth } from "../lib/auth";
import type { Recipe, RecipeIngredient } from "../types/recipe";

export function RecipePage() {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [isMarkingMade, setIsMarkingMade] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!isAuthenticated || !recipeId) {
      setRecipe(null);
      setIngredients([]);
      setIsFavorited(false);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    void Promise.all([
      getRecipeById(recipeId),
      listRecipeIngredients(recipeId),
      isRecipeFavorited(recipeId),
    ])
      .then(([recipeData, ingredientData, favorited]) => {
        if (!isMounted) {
          return;
        }

        setRecipe(recipeData);
        setIngredients(ingredientData);
        setIsFavorited(favorited);
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

  async function handleFavoriteToggle() {
    if (!recipe) {
      return;
    }

    setIsFavoriteLoading(true);
    setErrorMessage(null);

    try {
      if (isFavorited) {
        await removeRecipeFavorite(recipe.id);
        setIsFavorited(false);
      } else {
        await addRecipeFavorite(recipe.id);
        setIsFavorited(true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update favorite.";
      setErrorMessage(message);
    } finally {
      setIsFavoriteLoading(false);
    }
  }

  async function handleMarkRecipeMade() {
    if (!recipe) {
      return;
    }

    setIsMarkingMade(true);
    setErrorMessage(null);

    try {
      const updatedRecipe = await markRecipeMade(recipe.id);
      setRecipe(updatedRecipe);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to log recipe.";
      setErrorMessage(message);
    } finally {
      setIsMarkingMade(false);
    }
  }

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
          {recipe.source ? <p className="muted">Source: {recipe.source}</p> : null}
          {recipe.sourceUrl ? (
            <p className="muted">
              <a href={recipe.sourceUrl} target="_blank" rel="noreferrer" className="recipe-link">
                Recipe Link
              </a>
            </p>
          ) : null}
        </div>
        <div className="detail-actions">
          <Link to={`/recipes/${recipe.id}/edit`} className="button-secondary">
            Edit Recipe
          </Link>
          <button
            className="button-secondary"
            type="button"
            onClick={() => void handleMarkRecipeMade()}
            disabled={isMarkingMade}
          >
            {isMarkingMade ? "Logging..." : "Making This Recipe"}
          </button>
          <button
            className={isFavorited ? "button-secondary active-pill" : "button-secondary"}
            type="button"
            onClick={() => void handleFavoriteToggle()}
            disabled={isFavoriteLoading}
          >
            {isFavoriteLoading ? "Saving..." : isFavorited ? "Favorited" : "Favorite"}
          </button>
        </div>
      </div>

      {recipe.imageUrl ? (
        <img src={recipe.imageUrl} alt={recipe.title} className="recipe-detail-image" />
      ) : null}

      <p>{recipe.description ?? "No description yet."}</p>

      {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}

      <div className="detail-grid">
        <div className="meta-block">
          <h3>Details</h3>
          <ul className="simple-list">
            <li>Prep time: {recipe.prepTime ? `${recipe.prepTime} min` : "Not set"}</li>
            <li>Cook time: {recipe.cookTime ? `${recipe.cookTime} min` : "Not set"}</li>
            <li>Total time: {recipe.totalTime ? `${recipe.totalTime} min` : "Not set"}</li>
            <li>Servings: {recipe.servings ?? "Not set"}</li>
            <li>Made before: {recipe.haveIMadeItBefore ? "Yes" : "No"}</li>
            <li>Frequently made: {recipe.frequentlyMade ? "Yes" : "No"}</li>
            <li>Times made: {recipe.timesMade}</li>
            <li>
              Last made: {recipe.lastMadeAt ? new Date(recipe.lastMadeAt).toLocaleString() : "Not set"}
            </li>
          </ul>
        </div>
      </div>

      {recipe.notes ? (
        <section className="panel inset-panel">
          <h3>Notes</h3>
          <p>{recipe.notes}</p>
        </section>
      ) : null}

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
