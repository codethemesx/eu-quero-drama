import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAppAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tv2, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const [, navigate] = useLocation();
  const { refetch } = useAppAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      refetch();
      toast.success("Conta criada com sucesso! Bem-vindo(a)!");
      navigate("/");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao criar conta");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirm) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    registerMutation.mutate({ name, email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <Tv2 className="w-9 h-9 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Eu Quero Dramas</h1>
          </Link>
          <p className="text-muted-foreground mt-2 text-sm">Crie sua conta e acesse o melhor dos dramas</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl shadow-black/20">
          <h2 className="text-xl font-semibold text-foreground mb-6">Criar conta</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-foreground">Nome</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground pr-10"
                  autoComplete="new-password"
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

            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-sm font-medium text-foreground">Confirmar senha</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Repita a senha"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                autoComplete="new-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-11 mt-2"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Criando conta...</>
              ) : (
                "Criar conta"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Já tem conta?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Fazer login
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
