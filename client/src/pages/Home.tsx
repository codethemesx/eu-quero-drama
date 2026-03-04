import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tv2, Play, Star, Tag, Film, Search } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const { data: dramas, isLoading } = trpc.dramas.list.useQuery();
  const [search, setSearch] = useState("");

  const filtered = dramas?.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-card to-background border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(0.70_0.18_50/0.12),transparent_60%)]" />
        <div className="container py-16 md:py-24 relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm text-primary font-medium mb-6">
              <Star className="w-3.5 h-3.5 fill-primary" />
              Os melhores dramas asiáticos
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight mb-4">
              Sua coleção de{" "}
              <span className="text-primary">dramas favoritos</span>{" "}
              em um só lugar
            </h1>
            <p className="text-muted-foreground text-lg mb-8">
              Compre, baixe e assista quando quiser. Sem mensalidade, sem assinatura — pague apenas pelo que quiser.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-lg shadow-primary/25" asChild>
                <a href="#catalogo">
                  <Film className="w-4 h-4 mr-2" />
                  Ver catálogo
                </a>
              </Button>
              <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-accent" asChild>
                <Link href="/registro">Criar conta grátis</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section id="catalogo" className="container py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Catálogo de Novelas</h2>
            <p className="text-muted-foreground text-sm mt-1">
              {dramas?.length ?? 0} novelas disponíveis
            </p>
          </div>
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar novela..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <DramaCardSkeleton key={i} />
            ))}
          </div>
        ) : !filtered?.length ? (
          <div className="text-center py-20">
            <Tv2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg font-medium">
              {search ? "Nenhuma novela encontrada" : "Nenhuma novela disponível ainda"}
            </p>
            <p className="text-muted-foreground/60 text-sm mt-1">
              {search ? "Tente outro termo de busca" : "Volte em breve!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map((drama) => (
              <DramaCard key={drama.id} drama={drama} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function DramaCard({ drama }: { drama: {
  id: number;
  title: string;
  coverUrl: string | null;
  price: string;
  discountPrice: string | null;
  totalEpisodes: number;
}}) {
  const hasDiscount = !!drama.discountPrice;
  const displayPrice = hasDiscount ? parseFloat(drama.discountPrice!) : parseFloat(drama.price);
  const originalPrice = parseFloat(drama.price);
  const discountPct = hasDiscount
    ? Math.round((1 - displayPrice / originalPrice) * 100)
    : 0;

  return (
    <Link href={`/novela/${drama.id}`}>
      <div className="group cursor-pointer">
        {/* Cover */}
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-card border border-border mb-3 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-black/40 group-hover:border-primary/40">
          {drama.coverUrl ? (
            <img
              src={drama.coverUrl}
              alt={drama.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-card to-secondary">
              <Tv2 className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}

          {/* Discount badge */}
          {hasDiscount && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 shadow-md">
                -{discountPct}%
              </Badge>
            </div>
          )}

          {/* Episodes badge */}
          <div className="absolute bottom-2 right-2">
            <Badge variant="secondary" className="bg-black/60 text-white border-0 text-xs backdrop-blur-sm">
              <Play className="w-2.5 h-2.5 mr-1" />
              {drama.totalEpisodes} ep.
            </Badge>
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <div className="bg-primary text-primary-foreground rounded-full px-4 py-1.5 text-xs font-semibold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200">
              Ver detalhes
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {drama.title}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-primary font-bold text-sm">
              R$ {displayPrice.toFixed(2).replace(".", ",")}
            </span>
            {hasDiscount && (
              <span className="text-muted-foreground text-xs line-through">
                R$ {originalPrice.toFixed(2).replace(".", ",")}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function DramaCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[2/3] rounded-xl mb-3 bg-card" />
      <Skeleton className="h-4 w-3/4 mb-1 bg-card" />
      <Skeleton className="h-4 w-1/2 bg-card" />
    </div>
  );
}
