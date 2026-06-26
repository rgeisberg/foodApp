import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: Session | null;
  userEmail: string | null;
  userDisplayName: string | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getUserDisplayName(session: Session | null) {
  const user = session?.user;

  if (!user) {
    return null;
  }

  const metadata = user.user_metadata;
  const candidates = [
    metadata?.display_name,
    metadata?.full_name,
    metadata?.name,
    metadata?.preferred_username,
  ];

  const namedCandidate = candidates.find(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );

  if (namedCandidate) {
    return namedCandidate.trim();
  }

  if (user.email) {
    return user.email.split("@")[0];
  }

  return "there";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setSession(data.session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, nextSession) => {
      if (!isMounted) {
        return;
      }

      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(session),
        isLoading,
        session,
        userEmail: session?.user.email ?? null,
        userDisplayName: getUserDisplayName(session),
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
