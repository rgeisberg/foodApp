export function NewRecipePage() {
  return (
    <section className="panel stack">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Create</p>
          <h2>Add a New Recipe</h2>
        </div>
      </div>

      <form className="form-grid">
        <label>
          Title
          <input type="text" placeholder="Grandma's lasagna" />
        </label>

        <label>
          Category
          <input type="text" placeholder="Dinner" />
        </label>

        <label className="full-width">
          Description
          <textarea rows={4} placeholder="Short summary of the recipe" />
        </label>

        <label className="full-width">
          Instructions
          <textarea rows={8} placeholder="Recipe steps will go here" />
        </label>

        <div className="full-width actions">
          <button type="submit">Save Recipe</button>
        </div>
      </form>
    </section>
  );
}
