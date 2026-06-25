import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { EditRecipePage } from "../pages/EditRecipePage";
import { FavoritesPage } from "../pages/FavoritesPage";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { NewRecipePage } from "../pages/NewRecipePage";
import { RecipePage } from "../pages/RecipePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "recipes/new",
        element: <NewRecipePage />,
      },
      {
        path: "recipes/:recipeId",
        element: <RecipePage />,
      },
      {
        path: "recipes/:recipeId/edit",
        element: <EditRecipePage />,
      },
      {
        path: "favorites",
        element: <FavoritesPage />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
    ],
  },
]);
