import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { getLocalUser } from "@/lib/stockpro";

type AuthContextValue = {
  user: User | { id: string; email: string } | null;
  session: Session | null;
  loading: boolean;
  displayName: string;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);

  const loadProfile = async (currentUser: User | null) => {
    if (!currentUser) {
      setDisplayName("");
      return;
    }
    const fallback = (currentUser.user_metadata?.name as string) || currentUser.email?.split("@")[0] || "User";
    const { data } = await supabase.from("profiles").select("name").eq("id", currentUser.id).maybeSingle();
    setDisplayName(data?.name || fallback);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!isSupabaseConfigured) {
        const localUser = getLocalUser();
        setSession(null);
        setUser(localUser ? { id: localUser.id, email: localUser.email } : null);
        setDisplayName(localUser?.name ?? "");
        setLoading(false);
        return;
      }
      setSession(data.session);
      setUser(data.session?.user ?? null);
      await loadProfile(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isSupabaseConfigured) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      loadProfile(nextSession?.user ?? null);
    });

    const onLocalAuth = () => {
      const localUser = getLocalUser();
      setUser(localUser ? { id: localUser.id, email: localUser.email } : null);
      setDisplayName(localUser?.name ?? "");
      setLoading(false);
    };
    window.addEventListener("stockpro-local-auth", onLocalAuth);

    return () => {
      listener.subscription.unsubscribe();
      window.removeEventListener("stockpro-local-auth", onLocalAuth);
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    session,
    loading,
    displayName,
    refreshProfile: () => loadProfile(user),
  }), [user, session, loading, displayName]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
