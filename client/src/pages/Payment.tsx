import { useEffect, useState, useCallback } from "react";
import { useParams, useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2, Clock, XCircle, Copy, QrCode, RefreshCw, ArrowLeft, Loader2, BookOpen
} from "lucide-react";
import { toast } from "sonner";

type PaymentStatus = "pending" | "paid" | "expired" | "cancelled";

export default function Payment() {
  const params = useParams<{ orderId: string }>();
  const orderId = parseInt(params.orderId);
  const [, navigate] = useLocation();
  const [polling, setPolling] = useState(true);
  const [copied, setCopied] = useState(false);

  const { data, isLoading, refetch } = trpc.orders.getStatus.useQuery(
    { orderId },
    {
      enabled: !isNaN(orderId),
      refetchOnWindowFocus: true,
    }
  );

  // Poll every 5 seconds while pending
  useEffect(() => {
    if (!polling || data?.status !== "pending") {
      setPolling(false);
      return;
    }
    const interval = setInterval(() => {
      refetch();
    }, 5000);
    return () => clearInterval(interval);
  }, [polling, data?.status, refetch]);

  // Stop polling when paid/expired
  useEffect(() => {
    if (data?.status === "paid" || data?.status === "expired") {
      setPolling(false);
    }
  }, [data?.status]);

  const handleCopy = useCallback(async () => {
    const code = data?.pixCopyPaste;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Código Pix copiado!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Não foi possível copiar. Copie manualmente.");
    }
  }, [data?.pixCopyPaste]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-12 max-w-lg mx-auto">
          <Skeleton className="h-8 w-48 mb-6 bg-card" />
          <Skeleton className="h-64 w-full rounded-2xl bg-card" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">Pedido não encontrado</p>
          <Button asChild className="mt-4 bg-primary text-primary-foreground">
            <Link href="/">Voltar ao catálogo</Link>
          </Button>
        </div>
      </div>
    );
  }

  const status = data.status as PaymentStatus;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8 max-w-lg mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao catálogo
        </Link>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl shadow-black/20">
          {/* Status Header */}
          <div className="text-center mb-6">
            {status === "pending" && (
              <>
                <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-xl font-bold text-foreground">Pagamento via Pix</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Escaneie o QR Code ou copie o código para pagar
                </p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs text-muted-foreground">Aguardando pagamento...</span>
                  {polling && <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />}
                </div>
              </>
            )}

            {status === "paid" && (
              <>
                <div className="w-16 h-16 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h1 className="text-xl font-bold text-foreground">Pagamento confirmado!</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Sua novela já está disponível para download
                </p>
              </>
            )}

            {status === "expired" && (
              <>
                <div className="w-16 h-16 rounded-full bg-destructive/10 border-2 border-destructive/30 flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-destructive" />
                </div>
                <h1 className="text-xl font-bold text-foreground">Pagamento expirado</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  O tempo para pagamento expirou. Faça um novo pedido.
                </p>
              </>
            )}
          </div>

          {/* Pix Content */}
          {status === "pending" && (
            <div className="space-y-5">
              {/* QR Code */}
              {data.pixQrCode && (
                <div className="flex flex-col items-center">
                  {(data as any).pixQrCodeBase64 ? (
                    <div className="bg-white p-4 rounded-xl border border-border shadow-inner">
                      <img
                        src={`data:image/png;base64,${(data as any).pixQrCodeBase64}`}
                        alt="QR Code Pix"
                        className="w-48 h-48 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="bg-white p-4 rounded-xl border border-border w-48 h-48 flex items-center justify-center">
                      <QrCode className="w-32 h-32 text-gray-800" />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">QR Code Pix</p>
                </div>
              )}

              {/* Copy-paste code */}
              {data.pixCopyPaste && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Ou copie o código Pix:
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground font-mono break-all select-all overflow-hidden">
                      {data.pixCopyPaste.substring(0, 60)}...
                    </div>
                    <Button
                      size="sm"
                      onClick={handleCopy}
                      className={`flex-shrink-0 ${copied ? "bg-green-600 hover:bg-green-600" : "bg-primary hover:bg-primary/90"} text-primary-foreground`}
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {/* Expiry */}
              {data.expiresAt && (
                <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
                  <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-foreground">Válido até</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(data.expiresAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              )}

              {/* Manual refresh */}
              <Button
                variant="outline"
                size="sm"
                className="w-full border-border text-muted-foreground hover:text-foreground"
                onClick={() => refetch()}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-2" />
                Verificar pagamento manualmente
              </Button>

              <div className="bg-secondary/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Como pagar:</p>
                <p>1. Abra o app do seu banco</p>
                <p>2. Acesse a área Pix</p>
                <p>3. Escaneie o QR Code ou cole o código</p>
                <p>4. Confirme o pagamento</p>
                <p>5. Aguarde a confirmação automática nesta tela</p>
              </div>
            </div>
          )}

          {/* Paid - CTA */}
          {status === "paid" && (
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                <p className="text-sm text-green-400 font-medium">
                  Pagamento recebido em {data.paidAt ? new Date(data.paidAt).toLocaleString("pt-BR") : "agora"}
                </p>
              </div>
              <Button
                size="lg"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                onClick={() => navigate("/minhas-novelas")}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Ir para Minhas Novelas
              </Button>
            </div>
          )}

          {/* Expired - CTA */}
          {status === "expired" && (
            <Button
              size="lg"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
              onClick={() => navigate("/")}
            >
              Fazer novo pedido
            </Button>
          )}
        </div>

        {/* Security note */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          🔒 Pagamento seguro processado pelo Mercado Pago
        </p>
      </div>
    </div>
  );
}
