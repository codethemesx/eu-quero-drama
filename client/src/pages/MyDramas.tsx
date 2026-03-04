import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAppAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tv2, Download, Play, BookOpen, Lock, ChevronDown, ChevronUp, ExternalLink, ArrowLeft
} from "lucide-react";

export default function MyDramas() {
  const { user, loading } = useAppAuth();
  const [, navigate] = useLocation();

  const { data: purchases, isLoading } = trpc.user.purchases.useQuery(
    {},
    { enabled: !!user }
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-12 max-w-4xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6 bg-card" />
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl bg-card" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center max-w-md mx-auto">
          <Lock className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Acesso restrito</h2>
          <p className="text-muted-foreground mb-6">Faça login para ver suas novelas compradas</p>
          <Button asChild className="bg-primary text-primary-foreground">
            <Link href="/login">Fazer login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-primary" />
            Minhas Novelas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {purchases?.length ?? 0} novela{(purchases?.length ?? 0) !== 1 ? "s" : ""} na sua biblioteca
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl bg-card" />
            ))}
          </div>
        ) : !purchases?.length ? (
          <div className="text-center py-20">
            <Tv2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg font-medium">Sua biblioteca está vazia</p>
            <p className="text-muted-foreground/60 text-sm mt-1 mb-6">
              Compre novelas no catálogo para acessá-las aqui
            </p>
            <Button asChild className="bg-primary text-primary-foreground">
              <Link href="/">Explorar catálogo</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {purchases.map((p) => (
              p.drama && (
                <PurchasedDramaCard
                  key={p.purchase.id}
                  drama={p.drama}
                  purchasedAt={p.purchase.purchasedAt}
                  pricePaid={p.purchase.pricePaid}
                />
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PurchasedDramaCard({
  drama,
  purchasedAt,
  pricePaid,
}: {
  drama: {
    id: number;
    title: string;
    coverUrl: string | null;
    totalEpisodes: number;
  };
  purchasedAt: Date;
  pricePaid: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const { data: episodes, isLoading } = trpc.user.dramaEpisodes.useQuery(
    { dramaId: drama.id },
    { enabled: expanded }
  );

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 p-5">
        {/* Cover */}
        <div className="w-16 h-24 rounded-xl overflow-hidden bg-secondary flex-shrink-0 border border-border">
          {drama.coverUrl ? (
            <img src={drama.coverUrl} alt={drama.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Tv2 className="w-6 h-6 text-muted-foreground/40" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground text-base leading-tight mb-1">{drama.title}</h3>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground text-xs">
              <Play className="w-2.5 h-2.5 mr-1" />
              {drama.totalEpisodes} episódios
            </Badge>
            <Badge className="bg-green-500/10 text-green-400 border border-green-500/20 text-xs">
              Comprado
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Comprado em {new Date(purchasedAt).toLocaleDateString("pt-BR")} · R$ {parseFloat(pricePaid).toFixed(2).replace(".", ",")}
          </p>
        </div>

        {/* Expand button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent gap-1"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">Downloads</span>
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </Button>
      </div>

      {/* Episodes */}
      {expanded && (
        <div className="border-t border-border">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 rounded-lg bg-secondary" />
              ))}
            </div>
          ) : !episodes?.length ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              Nenhum episódio disponível ainda
            </div>
          ) : (
            <div className="divide-y divide-border">
              {episodes.map((ep) => (
                <div key={ep.id} className="flex items-center gap-3 px-5 py-3 hover:bg-accent/30 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">{ep.episodeNumber}</span>
                  </div>
                  <span className="flex-1 text-sm text-foreground">
                    {ep.title || `Episódio ${ep.episodeNumber}`}
                  </span>
                  <a
                    href={ep.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Baixar
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
