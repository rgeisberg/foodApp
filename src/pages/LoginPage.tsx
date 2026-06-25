import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";

export function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);

    const action =
      mode === "login"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: window.location.origin,
            },
          });

    const { error } = await action;

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    setMessage(
      mode === "login"
        ? "Signed in successfully."
        : "Account created. Check your email if confirmation is enabled.",
    );
    setIsSubmitting(false);
  }

  return (
    <section className="panel stack narrow">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Authentication</p>
          <h2>{mode === "login" ? "Login" : "Create Account"}</h2>
        </div>
      </div>

      <div className="toggle-row">
        <button
          className={mode === "login" ? "button-secondary active-pill" : "button-secondary"}
          type="button"
          onClick={() => setMode("login")}
        >
          Sign In
        </button>
        <button
          className={mode === "signup" ? "button-secondary active-pill" : "button-secondary"}
          type="button"
          onClick={() => setMode("signup")}
        >
          Sign Up
        </button>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="full-width">
          Email
          <input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="full-width">
          Password
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />
        </label>

        {message ? <p className="status-message success">{message}</p> : null}
        {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}

        <div className="full-width actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Working..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </div>
      </form>
    </section>
  );
}
