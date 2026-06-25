import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getRecipeById, listRecipeIngredients, updateRecipe } from "../features/recipes/api";

type IngredientFormRow = {
  id: string;
  amount: string;
  unit: string;
  ingredient: string;
};

function createEmptyIngredientRow(): IngredientFormRow {
  return {
    id: crypto.randomUUID(),
    amount: "",
    unit: "",
    ingredient: "",
  };
}

export function EditRecipePage() {
  const navigate = useNavigate();
  const { recipeId } = useParams();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [ingredients, setIngredients] = useState<IngredientFormRow[]>([createEmptyIngredientRow()]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!recipeId) {
      setErrorMessage("Recipe ID is missing.");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    void Promise.all([getRecipeById(recipeId), listRecipeIngredients(recipeId)])
      .then(([recipe, recipeIngredients]) => {
        if (!isMounted) {
          return;
        }

        setTitle(recipe.title);
        setCategory(recipe.category ?? "");
        setDescription(recipe.description ?? "");
        setInstructions(recipe.instructions);
        setPrepTime(recipe.prepTime?.toString() ?? "");
        setCookTime(recipe.cookTime?.toString() ?? "");
        setServings(recipe.servings?.toString() ?? "");
        setExistingImageUrl(recipe.imageUrl ?? null);
        setIngredients(
          recipeIngredients.length > 0
            ? recipeIngredients.map((item) => ({
                id: item.id,
                amount: item.amount ?? "",
                unit: item.unit ?? "",
                ingredient: item.ingredient,
              }))
            : [createEmptyIngredientRow()],
        );
        setErrorMessage(null);
      })
      .catch((error: { message?: string }) => {
        if (!isMounted) {
          return;
        }

        setErrorMessage(error.message ?? "Unable to load recipe for editing.");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [recipeId]);

  function updateIngredientRow(
    rowId: string,
    field: keyof Omit<IngredientFormRow, "id">,
    value: string,
  ) {
    setIngredients((currentRows) =>
      currentRows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)),
    );
  }

  function addIngredientRow() {
    setIngredients((currentRows) => [...currentRows, createEmptyIngredientRow()]);
  }

  function removeIngredientRow(rowId: string) {
    setIngredients((currentRows) => {
      if (currentRows.length === 1) {
        return [createEmptyIngredientRow()];
      }

      return currentRows.filter((row) => row.id !== rowId);
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!recipeId) {
      setErrorMessage("Recipe ID is missing.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const recipe = await updateRecipe({
        recipeId,
        title: title.trim(),
        category: category.trim(),
        description: description.trim(),
        instructions: instructions.trim(),
        prepTime: prepTime ? Number(prepTime) : null,
        cookTime: cookTime ? Number(cookTime) : null,
        servings: servings ? Number(servings) : null,
        imageFile,
        existingImageUrl,
        ingredients,
      });

      navigate(`/recipes/${recipe.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update recipe.";
      setErrorMessage(message);
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <section className="panel">
        <p className="muted">Loading recipe editor...</p>
      </section>
    );
  }

  return (
    <section className="panel stack">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Update</p>
          <h2>Edit Recipe</h2>
        </div>
      </div>

      {existingImageUrl ? (
        <img src={existingImageUrl} alt={title || "Recipe"} className="recipe-detail-image" />
      ) : null}

      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Title
          <input
            type="text"
            placeholder="Grandma's lasagna"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </label>

        <label>
          Category
          <input
            type="text"
            placeholder="Dinner"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          />
        </label>

        <label>
          Prep Time (minutes)
          <input
            type="number"
            min="0"
            placeholder="20"
            value={prepTime}
            onChange={(event) => setPrepTime(event.target.value)}
          />
        </label>

        <label>
          Cook Time (minutes)
          <input
            type="number"
            min="0"
            placeholder="35"
            value={cookTime}
            onChange={(event) => setCookTime(event.target.value)}
          />
        </label>

        <label>
          Servings
          <input
            type="number"
            min="1"
            placeholder="6"
            value={servings}
            onChange={(event) => setServings(event.target.value)}
          />
        </label>

        <label>
          Replace Image
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
          />
        </label>

        <label className="full-width">
          Description
          <textarea
            rows={4}
            placeholder="Short summary of the recipe"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>

        <label className="full-width">
          Instructions
          <textarea
            rows={8}
            placeholder="Recipe steps will go here"
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            required
          />
        </label>

        <section className="full-width ingredient-panel">
          <div className="ingredient-header">
            <div>
              <p className="eyebrow">Ingredients</p>
              <h3>Edit ingredient rows</h3>
            </div>
            <button className="button-secondary" type="button" onClick={addIngredientRow}>
              Add Ingredient
            </button>
          </div>

          <div className="ingredient-stack">
            {ingredients.map((row, index) => (
              <div key={row.id} className="ingredient-row">
                <label>
                  Amount
                  <input
                    type="text"
                    placeholder="2"
                    value={row.amount}
                    onChange={(event) => updateIngredientRow(row.id, "amount", event.target.value)}
                  />
                </label>

                <label>
                  Unit
                  <input
                    type="text"
                    placeholder="cups"
                    value={row.unit}
                    onChange={(event) => updateIngredientRow(row.id, "unit", event.target.value)}
                  />
                </label>

                <label className="ingredient-name">
                  Ingredient
                  <input
                    type="text"
                    placeholder={index === 0 ? "Flour" : "Ingredient name"}
                    value={row.ingredient}
                    onChange={(event) =>
                      updateIngredientRow(row.id, "ingredient", event.target.value)
                    }
                  />
                </label>

                <button
                  className="button-secondary ingredient-remove"
                  type="button"
                  onClick={() => removeIngredientRow(row.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>

        {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}

        <div className="full-width actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </section>
  );
}
