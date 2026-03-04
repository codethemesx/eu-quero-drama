import { useAppAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { Tv2, ShoppingCart, User, LogOut, Settings, BookOpen, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const { user, logout } = useAppAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: whatsappLink } = trpc.publicSettings.whatsappLink.useQuery(undefined, {
    staleTime: 60_000,
  });

  return (
    <>
      {/* WhatsApp Community Banner */}
      {whatsappLink && (
        <WhatsAppBanner link={whatsappLink} />
      )}

      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="container flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Tv2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
              Eu Quero Dramas
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${location === "/" ? "text-primary" : "text-muted-foreground"}`}
            >
              Catálogo
            </Link>
            {user && (
              <Link
                href="/minhas-novelas"
                className={`text-sm font-medium transition-colors hover:text-primary ${location === "/minhas-novelas" ? "text-primary" : "text-muted-foreground"}`}
              >
                Minhas Novelas
              </Link>
            )}
            {user?.role === "admin" && (
              <Link
                href="/admin"
                className={`text-sm font-medium transition-colors hover:text-primary ${location.startsWith("/admin") ? "text-primary" : "text-muted-foreground"}`}
              >
                Admin
              </Link>
            )}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 text-foreground hover:text-primary hover:bg-accent">
                    <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="max-w-[120px] truncate">{user.name || user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                  <DropdownMenuItem asChild>
                    <Link href="/minhas-novelas" className="flex items-center gap-2 cursor-pointer">
                      <BookOpen className="w-4 h-4" /> Minhas Novelas
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center gap-2 cursor-pointer text-primary">
                          <Settings className="w-4 h-4" /> Painel Admin
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
                  <Link href="/login">Entrar</Link>
                </Button>
                <Button size="sm" asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link href="/registro">Cadastrar</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-card px-4 py-4 flex flex-col gap-3">
            <Link href="/" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-foreground hover:text-primary py-2">
              Catálogo
            </Link>
            {user && (
              <Link href="/minhas-novelas" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-foreground hover:text-primary py-2">
                Minhas Novelas
              </Link>
            )}
            {user?.role === "admin" && (
              <Link href="/admin" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-primary py-2">
                Painel Admin
              </Link>
            )}
            {user ? (
              <button onClick={() => { logout(); setMobileOpen(false); }} className="text-sm font-medium text-destructive text-left py-2">
                Sair
              </button>
            ) : (
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>Entrar</Link>
                </Button>
                <Button size="sm" asChild className="bg-primary text-primary-foreground">
                  <Link href="/registro" onClick={() => setMobileOpen(false)}>Cadastrar</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </nav>
    </>
  );
}

function WhatsAppBanner({ link }: { link: string }) {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem("wa_banner_dismissed") === "1";
  });

  if (dismissed) return null;

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-sm text-foreground">
        <span className="text-base">💬</span>
        <span>
          <strong className="text-primary">Comunidade no WhatsApp!</strong>
          {" "}Junte-se ao nosso grupo e fique por dentro de todas as novidades.
        </span>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full hover:bg-primary/90 transition-colors ml-2"
        >
          Entrar no grupo
        </a>
      </div>
      <button
        onClick={() => {
          localStorage.setItem("wa_banner_dismissed", "1");
          setDismissed(true);
        }}
        className="text-muted-foreground hover:text-foreground flex-shrink-0"
        aria-label="Fechar banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
