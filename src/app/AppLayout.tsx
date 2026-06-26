import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth";

const navItems = [
  { to: "/", label: "Recipes" },
  { to: "/favorites", label: "Favorites" },
  { to: "/made-history", label: "Made History" },
  { to: "/recipes/new", label: "Add Recipe" },
  { to: "/login", label: "Login" },
];

export function AppLayout() {
  const { isAuthenticated, isLoading, signOut, userEmail } = useAuth();

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Family Cookbook</p>
          <h1>Food App</h1>
        </div>
        <div className="header-actions">
          <nav className="nav">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="session-chip">
            {isLoading ? (
              <span>Checking session...</span>
            ) : isAuthenticated ? (
              <>
                <span>{userEmail}</span>
                <button className="button-secondary" type="button" onClick={() => void signOut()}>
                  Sign Out
                </button>
              </>
            ) : (
              <span>Not signed in</span>
            )}
          </div>
        </div>
      </header>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
