import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth";

const navItems = [
  { to: "/", label: "Recipes" },
  { to: "/favorites", label: "Favorites" },
  { to: "/frequently-made", label: "Frequently Made" },
  { to: "/made-history", label: "Made History" },
  { to: "/recipes/new", label: "Add Recipe" },
];

export function AppLayout() {
  const { isAuthenticated, isLoading, signOut, userDisplayName } = useAuth();
  const visibleNavItems = isAuthenticated
    ? navItems
    : [...navItems, { to: "/login", label: "Login" }];

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Family Cookbook</p>
          <h1>Geisberg Recipes</h1>
        </div>
        <div className="header-actions">
          <nav className="nav">
            {visibleNavItems.map((item) => (
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
                <span>Hello {userDisplayName}</span>
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
