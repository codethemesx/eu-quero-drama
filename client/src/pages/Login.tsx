import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAppAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tv2, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const [, navigate] = useLocation();
  const { refetch } = useAppAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      refetch();
      toast.success(`Bem-vindo(a), ${data.user.name || data.user.email}!`);
      if (data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao fazer login");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <Tv2 className="w-9 h-9 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Eu Quero Dramas</h1>
          </Link>
          <p className="text-muted-foreground mt-2 text-sm">Faça login para acessar sua conta</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl shadow-black/20">
          <h2 className="text-xl font-semibold text-foreground mb-6">Entrar na conta</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-11"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Entrando...</>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Não tem conta?{" "}
            <Link href="/registro" className="text-primary hover:underline font-medium">
              Cadastre-se grátis
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link href="/" className="hover:text-foreground transition-colors">
            ← Voltar ao catálogo
          </Link>
        </p>
      </div>
    </div>
  );
}
