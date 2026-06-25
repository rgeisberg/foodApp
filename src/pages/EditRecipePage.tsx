export function EditRecipePage() {
  return (
    <section className="panel stack">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Update</p>
          <h2>Edit Recipe</h2>
        </div>
      </div>

      <p className="muted">
        This route will reuse the recipe form and load existing recipe data from Supabase.
      </p>
    </section>
  );
}
