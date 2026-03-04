import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAppAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Tv2, Play, ShoppingCart, Tag, ArrowLeft, Lock, CheckCircle2, Loader2, Film
} from "lucide-react";
import { toast } from "sonner";

export default function DramaDetail() {
  const params = useParams<{ id: string }>();
  const dramaId = parseInt(params.id);
  const [, navigate] = useLocation();
  const { user } = useAppAuth();
  const [isOrdering, setIsOrdering] = useState(false);

  const { data: drama, isLoading } = trpc.dramas.detail.useQuery(
    { id: dramaId },
    { enabled: !isNaN(dramaId) }
  );

  const createOrderMutation = trpc.orders.createOrder.useMutation({
    onSuccess: (data) => {
      navigate(`/pagamento/${data.orderId}`);
    },
    onError: (err) => {
      setIsOrdering(false);
      if (err.message?.includes("login")) {
        toast.error("Faça login para comprar");
        navigate("/login");
      } else {
        toast.error(err.message || "Erro ao criar pedido");
      }
    },
  });

  const handleBuy = async () => {
    if (!user) {
      toast.error("Faça login para comprar");
      navigate("/login");
      return;
    }
    setIsOrdering(true);
    createOrderMutation.mutate({ dramaIds: [dramaId] });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-8">
          <div className="flex flex-col md:flex-row gap-8">
            <Skeleton className="w-full md:w-64 aspect-[2/3] rounded-2xl bg-card" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-8 w-3/4 bg-card" />
              <Skeleton className="h-4 w-full bg-card" />
              <Skeleton className="h-4 w-2/3 bg-card" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!drama) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <Tv2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">Novela não encontrada</p>
          <Button asChild className="mt-4 bg-primary text-primary-foreground">
            <Link href="/">Voltar ao catálogo</Link>
          </Button>
        </div>
      </div>
    );
  }

  const hasDiscount = !!drama.discountPrice;
  const displayPrice = hasDiscount ? parseFloat(drama.discountPrice!) : parseFloat(drama.price);
  const originalPrice = parseFloat(drama.price);
  const discountPct = hasDiscount ? Math.round((1 - displayPrice / originalPrice) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8">
        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao catálogo
        </Link>

        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* Cover */}
          <div className="w-full md:w-64 lg:w-72 flex-shrink-0">
            <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-card border border-border shadow-2xl shadow-black/40">
              {drama.coverUrl ? (
                <img src={drama.coverUrl} alt={drama.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-card to-secondary">
                  <Tv2 className="w-20 h-20 text-muted-foreground/30" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start gap-3 mb-3">
              {hasDiscount && (
                <Badge className="bg-primary text-primary-foreground font-bold">
                  <Tag className="w-3 h-3 mr-1" />
                  -{discountPct}% OFF
                </Badge>
              )}
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                <Film className="w-3 h-3 mr-1" />
                {drama.totalEpisodes} episódios
              </Badge>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
              {drama.title}
            </h1>

            {drama.description && (
              <p className="text-muted-foreground leading-relaxed mb-6 text-base">
                {drama.description}
              </p>
            )}

            <Separator className="bg-border mb-6" />

            {/* Price & Buy */}
            <div className="bg-card border border-border rounded-2xl p-6 mb-6">
              <div className="flex items-end gap-3 mb-4">
                <span className="text-4xl font-bold text-primary">
                  R$ {displayPrice.toFixed(2).replace(".", ",")}
                </span>
                {hasDiscount && (
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-sm line-through">
                      R$ {originalPrice.toFixed(2).replace(".", ",")}
                    </span>
                    <span className="text-primary text-xs font-semibold">
                      Economia de R$ {(originalPrice - displayPrice).toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  Acesso permanente a todos os {drama.totalEpisodes} episódios
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  Download disponível a qualquer momento
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  Pagamento via Pix — rápido e seguro
                </div>
              </div>

              <Button
                size="lg"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base h-12 shadow-lg shadow-primary/25"
                onClick={handleBuy}
                disabled={isOrdering || createOrderMutation.isPending}
              >
                {isOrdering || createOrderMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...</>
                ) : (
                  <><ShoppingCart className="w-4 h-4 mr-2" /> Comprar agora</>
                )}
              </Button>

              {!user && (
                <p className="text-center text-xs text-muted-foreground mt-3">
                  <Lock className="w-3 h-3 inline mr-1" />
                  <Link href="/login" className="text-primary hover:underline">Faça login</Link> para comprar
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Episodes list */}
        {drama.episodes && drama.episodes.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Episódios ({drama.episodes.length})
            </h2>
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              {drama.episodes.map((ep, idx) => (
                <div
                  key={ep.id}
                  className={`flex items-center gap-4 px-5 py-3.5 ${idx < drama.episodes.length - 1 ? "border-b border-border" : ""}`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">{ep.episodeNumber}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {ep.title || `Episódio ${ep.episodeNumber}`}
                    </p>
                  </div>
                  <Lock className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-3">
              <Lock className="w-3.5 h-3.5 inline mr-1" />
              Compre a novela para desbloquear os downloads
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
