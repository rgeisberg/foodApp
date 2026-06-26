import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listRecipeMakeHistory } from "../features/recipes/api";
import { useAuth } from "../lib/auth";
import type { RecipeMakeLogEntry } from "../types/recipe";

export function MadeHistoryPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [entries, setEntries] = useState<RecipeMakeLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!isAuthenticated) {
      setEntries([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    void listRecipeMakeHistory()
      .then((data) => {
        if (!isMounted) {
          return;
        }

        setEntries(data);
        setErrorMessage(null);
      })
      .catch((error: { message?: string }) => {
        if (!isMounted) {
          return;
        }

        setErrorMessage(error.message ?? "Unable to load recipe history.");
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
          <p className="eyebrow">Recent cooking</p>
          <h2>Recipe History</h2>
        </div>
      </div>

      {isAuthLoading || isLoading ? <p className="muted">Loading history...</p> : null}
      {!isAuthLoading && !isAuthenticated ? (
        <p className="muted">Sign in to view recipe history.</p>
      ) : null}
      {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}
      {!isLoading && isAuthenticated && !errorMessage && entries.length === 0 ? (
        <p className="muted">No recipe history yet. Use “Making this recipe” to log a cook.</p>
      ) : null}

      {entries.length > 0 ? (
        <div className="history-list">
          {entries.map((entry) => (
            <article key={entry.id} className="history-card">
              {entry.recipe.imageUrl ? (
                <img src={entry.recipe.imageUrl} alt={entry.recipe.title} className="history-image" />
              ) : null}
              <div className="history-content">
                <p className="recipe-meta">{entry.recipe.category ?? "Uncategorized"}</p>
                <h3>{entry.recipe.title}</h3>
                <p className="muted">Made on {new Date(entry.madeAt).toLocaleString()}</p>
                <p className="muted">Times made: {entry.recipe.timesMade}</p>
                <Link to={`/recipes/${entry.recipe.id}`} className="button-link">
                  View Recipe
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
