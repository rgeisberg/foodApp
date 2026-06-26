import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listFavoriteRecipes, searchRecipes } from "../features/recipes/api";
import { useAuth } from "../lib/auth";
import type { Recipe } from "../types/recipe";

export function HomePage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favoriteRecipeIds, setFavoriteRecipeIds] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showFrequentlyMadeOnly, setShowFrequentlyMadeOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!isAuthenticated) {
      setRecipes([]);
      setFavoriteRecipeIds([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    void Promise.all([searchRecipes(searchTerm), listFavoriteRecipes()])
      .then(([recipeData, favoriteRecipes]) => {
        if (!isMounted) {
          return;
        }

        setRecipes(recipeData);
        setFavoriteRecipeIds(favoriteRecipes.map((recipe) => recipe.id));
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
  }, [isAuthenticated, isAuthLoading, searchTerm]);

  const filteredRecipes = recipes.filter((recipe) => {
    if (showFavoritesOnly && !favoriteRecipeIds.includes(recipe.id)) {
      return false;
    }

    if (showFrequentlyMadeOnly && !recipe.frequentlyMade) {
      return false;
    }

    return true;
  });

  return (
    <section className="stack">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Recipe Library</h3>
            <p className="muted">Search title, category, instructions, or ingredients.</p>
          </div>

          {!isLoading && isAuthenticated ? (
            <p className="muted">{filteredRecipes.length} result{filteredRecipes.length === 1 ? "" : "s"}</p>
          ) : null}
        </div>

        <label className="search-field">
          Search
          <input
            type="text"
            placeholder="Try fish, pasta, soup, blueberry..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>

        <div className="toggle-row library-filters">
          <button
            type="button"
            className={showFavoritesOnly ? "button-secondary active-pill" : "button-secondary"}
            onClick={() => setShowFavoritesOnly((current) => !current)}
          >
            Favorites only
          </button>

          <button
            type="button"
            className={showFrequentlyMadeOnly ? "button-secondary active-pill" : "button-secondary"}
            onClick={() => setShowFrequentlyMadeOnly((current) => !current)}
          >
            Frequently made only
          </button>
        </div>

        {isAuthLoading || isLoading ? <p className="muted">Loading recipes...</p> : null}

        {!isAuthLoading && !isAuthenticated ? (
          <p className="muted">Sign in to view the shared recipe collection.</p>
        ) : null}

        {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}

        {!isLoading && isAuthenticated && !errorMessage && filteredRecipes.length === 0 ? (
          <p className="muted">
            {searchTerm.trim()
              ? "No recipes matched that search."
              : showFavoritesOnly || showFrequentlyMadeOnly
                ? "No recipes matched the selected filters."
                : "No recipes yet. Add the first one from the Add Recipe page."}
          </p>
        ) : null}

        {filteredRecipes.length > 0 ? (
          <div className="recipe-grid">
            {filteredRecipes.map((recipe) => (
              <article key={recipe.id} className="recipe-card">
                {recipe.imageUrl ? (
                  <Link to={`/recipes/${recipe.id}`} className="recipe-image-link">
                    <img src={recipe.imageUrl} alt={recipe.title} className="recipe-image" />
                  </Link>
                ) : null}
                <p className="recipe-meta">{recipe.category ?? "Uncategorized"}</p>
                <h4>{recipe.title}</h4>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </section>
  );
}
