export function FavoritesPage() {
  return (
    <section className="panel stack">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Per-user</p>
          <h2>My Favorites</h2>
        </div>
      </div>

      <p className="muted">
        This page will query the `recipe_favorites` table and show recipes saved by the current user.
      </p>

      <p className="muted">Favorites will appear here after the favorites query is wired up.</p>
    </section>
  );
}
