import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { setLocalUser } from "@/lib/stockpro";

const SignupInner = () => {
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!authLoading && user) return <Navigate to="/" replace />;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    if (!isSupabaseConfigured) {
      setLocalUser(email, name);
      setLoading(false);
      toast({ title: "Account created", description: "Local dev mode active. Add Supabase keys for production auth." });
      navigate("/");
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (!error && data.user) {
      await supabase.from("profiles").upsert({ id: data.user.id, name });
    }
    setLoading(false);
    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Account created", description: "Login karke dashboard open karo." });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-warm" />
      <div className="absolute inset-0 bg-gradient-aurora opacity-70" />
      <form onSubmit={submit} className="relative z-10 w-full max-w-md rounded-3xl bg-card/95 backdrop-blur-xl border border-border shadow-elegant p-7 space-y-5">
        <div>
          <h1 className="font-display text-4xl">Create StockPro Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Start managing advisory clients with real data.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <Button className="w-full bg-gradient-primary" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Signup
        </Button>
        <p className="text-sm text-center text-muted-foreground">
          Already have an account? <Link className="text-primary font-medium" to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default function Signup() {
  return <ThemeProvider><SignupInner /></ThemeProvider>;
}
