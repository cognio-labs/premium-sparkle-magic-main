import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const LoginInner = () => {
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!authLoading && user) return <Navigate to="/" replace />;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Login successful" });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-warm" />
      <div className="absolute inset-0 bg-gradient-aurora opacity-70" />
      <form onSubmit={submit} className="relative z-10 w-full max-w-md rounded-3xl bg-card/95 backdrop-blur-xl border border-border shadow-elegant p-7 space-y-5">
        <div>
          <h1 className="font-display text-4xl">StockPro Login</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to manage clients, portfolios, and websites.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <Button className="w-full bg-gradient-primary" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Login
        </Button>
        <p className="text-sm text-center text-muted-foreground">
          No account? <Link className="text-primary font-medium" to="/signup">Create one</Link>
        </p>
      </form>
    </div>
  );
};

export default function Login() {
  return <ThemeProvider><LoginInner /></ThemeProvider>;
}
