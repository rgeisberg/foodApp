import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listFavoriteRecipes } from "../features/recipes/api";
import { useAuth } from "../lib/auth";
import type { Recipe } from "../types/recipe";

export function FavoritesPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!isAuthenticated) {
      setRecipes([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    void listFavoriteRecipes()
      .then((data) => {
        if (!isMounted) {
          return;
        }

        setRecipes(data);
        setErrorMessage(null);
      })
      .catch((error: { message?: string }) => {
        if (!isMounted) {
          return;
        }

        setErrorMessage(error.message ?? "Unable to load favorites.");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isAuthLoading]);

  return (
    <section className="panel stack">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Per-user</p>
          <h2>My Favorites</h2>
        </div>
      </div>

      {isAuthLoading || isLoading ? <p className="muted">Loading favorites...</p> : null}

      {!isAuthLoading && !isAuthenticated ? (
        <p className="muted">Sign in to view your saved recipes.</p>
      ) : null}

      {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}

      {!isLoading && isAuthenticated && !errorMessage && recipes.length === 0 ? (
        <p className="muted">You have not favorited any recipes yet.</p>
      ) : null}

      {recipes.length > 0 ? (
        <div className="recipe-grid">
          {recipes.map((recipe) => (
            <article key={recipe.id} className="recipe-card">
              {recipe.imageUrl ? (
                <img src={recipe.imageUrl} alt={recipe.title} className="recipe-image" />
              ) : null}
              <p className="recipe-meta">{recipe.category ?? "Uncategorized"}</p>
              <h4>{recipe.title}</h4>
              <p className="muted">{recipe.description ?? "No description yet."}</p>
              <Link to={`/recipes/${recipe.id}`} className="button-link">
                View Recipe
              </Link>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
