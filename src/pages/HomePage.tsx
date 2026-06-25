import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listRecipes } from "../features/recipes/api";
import { useAuth } from "../lib/auth";
import type { Recipe } from "../types/recipe";

export function HomePage() {
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

    void listRecipes()
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

        setErrorMessage(error.message ?? "Unable to load recipes.");
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
    <section className="stack">
      <div className="hero-card">
        <div>
          <p className="eyebrow">Shared recipes</p>
          <h2>Keep every family recipe in one place.</h2>
          <p className="muted">
            This app will let your family browse recipes, save favorites, and add new dishes.
          </p>
        </div>
      </div>

      <section className="panel">
        <div className="panel-header">
          <h3>Recipe Library</h3>
          <p className="muted">Shared recipes available to signed-in family members.</p>
        </div>

        {isAuthLoading || isLoading ? <p className="muted">Loading recipes...</p> : null}

        {!isAuthLoading && !isAuthenticated ? (
          <p className="muted">Sign in to view the shared recipe collection.</p>
        ) : null}

        {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}

        {!isLoading && isAuthenticated && !errorMessage && recipes.length === 0 ? (
          <p className="muted">No recipes yet. Add the first one from the Add Recipe page.</p>
        ) : null}

        {recipes.length > 0 ? (
          <div className="recipe-grid">
            {recipes.map((recipe) => (
              <article key={recipe.id} className="recipe-card">
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
    </section>
  );
}
