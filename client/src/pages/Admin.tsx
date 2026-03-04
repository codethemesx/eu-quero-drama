import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAppAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import {
  LayoutDashboard, Film, Settings, ShoppingBag, TrendingUp, Users, DollarSign,
  Plus, Pencil, Trash2, Save, Loader2, ArrowLeft, Eye, EyeOff, Check,
  ChevronDown, ChevronUp, Play, Lock, X, BarChart2, Package
} from "lucide-react";
import { toast } from "sonner";

type AdminTab = "dashboard" | "dramas" | "orders" | "settings";

export default function Admin() {
  const { user, loading } = useAppAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-12">
          <Skeleton className="h-8 w-48 mb-6 bg-card" />
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <Lock className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Acesso negado</h2>
          <p className="text-muted-foreground mb-6">Você não tem permissão para acessar esta área</p>
          <Button asChild className="bg-primary text-primary-foreground">
            <Link href="/">Voltar ao início</Link>
          </Button>
        </div>
      </div>
    );
  }

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "dramas", label: "Novelas", icon: <Film className="w-4 h-4" /> },
    { id: "orders", label: "Pedidos", icon: <ShoppingBag className="w-4 h-4" /> },
    { id: "settings", label: "Configurações", icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Painel Administrativo</h1>
            <p className="text-xs text-muted-foreground">Eu Quero Dramas</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-card border border-border rounded-xl p-1 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "dramas" && <DramasTab />}
        {activeTab === "orders" && <OrdersTab />}
        {activeTab === "settings" && <SettingsTab />}
      </div>
    </div>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardTab() {
  const { data: stats, isLoading } = trpc.admin.stats.useQuery({});

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl bg-card" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      label: "Receita Total",
      value: `R$ ${stats.totalRevenue.toFixed(2).replace(".", ",")}`,
      icon: <DollarSign className="w-5 h-5" />,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Pedidos Pagos",
      value: stats.paidOrders,
      icon: <Check className="w-5 h-5" />,
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
    {
      label: "Taxa de Conversão",
      value: `${stats.conversionRate.toFixed(1)}%`,
      icon: <TrendingUp className="w-5 h-5" />,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Total de Usuários",
      value: stats.totalUsers,
      icon: <Users className="w-5 h-5" />,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
  ];

  const chartData = stats.recentSales.map((s: any) => ({
    date: s.date ? new Date(s.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "",
    receita: parseFloat(s.revenue || "0"),
    vendas: s.count,
  }));

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-card border border-border rounded-2xl p-5">
            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
              <span className={card.color}>{card.icon}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Extra stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total de Pedidos</p>
          <p className="text-2xl font-bold text-foreground">{stats.totalOrders}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Pedidos Pendentes</p>
          <p className="text-2xl font-bold text-foreground">{stats.pendingOrders}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 col-span-2 md:col-span-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Ticket Médio</p>
          <p className="text-2xl font-bold text-foreground">
            {stats.paidOrders > 0
              ? `R$ ${(stats.totalRevenue / stats.paidOrders).toFixed(2).replace(".", ",")}`
              : "—"}
          </p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            Receita por dia (últimos 30 dias)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.01 30)" />
              <XAxis dataKey="date" tick={{ fill: "oklch(0.60 0.02 60)", fontSize: 11 }} />
              <YAxis tick={{ fill: "oklch(0.60 0.02 60)", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.18 0.01 30)",
                  border: "1px solid oklch(0.28 0.01 30)",
                  borderRadius: "8px",
                  color: "oklch(0.93 0.01 60)",
                }}
                formatter={(value: number) => [`R$ ${value.toFixed(2).replace(".", ",")}`, "Receita"]}
              />
              <Bar dataKey="receita" fill="oklch(0.70 0.18 50)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top dramas */}
      {stats.topDramas.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            Novelas mais vendidas
          </h3>
          <div className="space-y-3">
            {stats.topDramas.map((d: any, i: number) => (
              <div key={d.dramaId} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{d.title}</p>
                  <p className="text-xs text-muted-foreground">{d.count} vendas</p>
                </div>
                <span className="text-sm font-semibold text-primary">
                  R$ {parseFloat(d.revenue || "0").toFixed(2).replace(".", ",")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Dramas Tab ───────────────────────────────────────────────────────────────

function DramasTab() {
  const utils = trpc.useUtils();
  const { data: dramas, isLoading } = trpc.admin.listDramas.useQuery({});
  const [showAddDrama, setShowAddDrama] = useState(false);
  const [editDrama, setEditDrama] = useState<any>(null);
  const [managingEpisodes, setManagingEpisodes] = useState<number | null>(null);

  const deleteMutation = trpc.admin.deleteDrama.useMutation({
    onSuccess: () => {
      utils.admin.listDramas.invalidate();
      toast.success("Novela excluída");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleDelete = (id: number, title: string) => {
    if (confirm(`Excluir "${title}"? Esta ação não pode ser desfeita.`)) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Novelas ({dramas?.length ?? 0})
        </h2>
        <Button
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => setShowAddDrama(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Nova novela
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl bg-card" />)}
        </div>
      ) : !dramas?.length ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <Film className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhuma novela cadastrada</p>
          <Button
            size="sm"
            className="mt-4 bg-primary text-primary-foreground"
            onClick={() => setShowAddDrama(true)}
          >
            <Plus className="w-4 h-4 mr-1" /> Adicionar novela
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {dramas.map((drama) => (
            <div key={drama.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-4">
                {/* Cover */}
                <div className="w-12 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0 border border-border">
                  {drama.coverUrl ? (
                    <img src={drama.coverUrl} alt={drama.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="w-5 h-5 text-muted-foreground/40" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground text-sm truncate">{drama.title}</h3>
                    <Badge
                      variant={drama.isActive ? "default" : "secondary"}
                      className={`text-xs flex-shrink-0 ${drama.isActive ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-secondary text-muted-foreground"}`}
                    >
                      {drama.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {drama.discountPrice
                        ? <>
                            <span className="text-primary font-semibold">R$ {parseFloat(drama.discountPrice).toFixed(2).replace(".", ",")}</span>
                            <span className="line-through ml-1">R$ {parseFloat(drama.price).toFixed(2).replace(".", ",")}</span>
                          </>
                        : <span className="text-primary font-semibold">R$ {parseFloat(drama.price).toFixed(2).replace(".", ",")}</span>
                      }
                    </span>
                    <span>·</span>
                    <span>{drama.totalEpisodes} episódios</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setManagingEpisodes(managingEpisodes === drama.id ? null : drama.id)}
                    className="text-muted-foreground hover:text-foreground hover:bg-accent text-xs gap-1"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Eps</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditDrama(drama)}
                    className="text-muted-foreground hover:text-foreground hover:bg-accent"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(drama.id, drama.title)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Episodes manager */}
              {managingEpisodes === drama.id && (
                <div className="mt-4 border-t border-border pt-4">
                  <EpisodesManager dramaId={drama.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Drama Dialog */}
      <DramaFormDialog
        open={showAddDrama}
        onClose={() => setShowAddDrama(false)}
        onSuccess={() => {
          utils.admin.listDramas.invalidate();
          setShowAddDrama(false);
        }}
      />

      {/* Edit Drama Dialog */}
      {editDrama && (
        <DramaFormDialog
          open={!!editDrama}
          drama={editDrama}
          onClose={() => setEditDrama(null)}
          onSuccess={() => {
            utils.admin.listDramas.invalidate();
            setEditDrama(null);
          }}
        />
      )}
    </div>
  );
}

function DramaFormDialog({
  open,
  drama,
  onClose,
  onSuccess,
}: {
  open: boolean;
  drama?: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!drama;
  const [title, setTitle] = useState(drama?.title ?? "");
  const [description, setDescription] = useState(drama?.description ?? "");
  const [coverUrl, setCoverUrl] = useState(drama?.coverUrl ?? "");
  const [price, setPrice] = useState(drama?.price ?? "");
  const [discountPrice, setDiscountPrice] = useState(drama?.discountPrice ?? "");
  const [isActive, setIsActive] = useState(drama?.isActive ?? true);

  const createMutation = trpc.admin.createDrama.useMutation({
    onSuccess,
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.admin.updateDrama.useMutation({
    onSuccess,
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) {
      toast.error("Título e preço são obrigatórios");
      return;
    }
    if (isEdit) {
      updateMutation.mutate({
        id: drama.id,
        title,
        description: description || undefined,
        coverUrl: coverUrl || undefined,
        price,
        discountPrice: discountPrice || null,
        isActive,
      });
    } else {
      createMutation.mutate({
        title,
        description: description || undefined,
        coverUrl: coverUrl || undefined,
        price,
        discountPrice: discountPrice || undefined,
        isActive,
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEdit ? "Editar novela" : "Nova novela"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-foreground">Título *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome da novela"
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-foreground">Descrição</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sinopse da novela..."
              rows={3}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-foreground">URL da capa</Label>
            <Input
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://..."
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
            {coverUrl && (
              <div className="w-16 h-24 rounded-lg overflow-hidden border border-border mt-2">
                <img src={coverUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-foreground">Preço (R$) *</Label>
              <Input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="29.90"
                type="number"
                step="0.01"
                min="0"
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-foreground">Preço com desconto (R$)</Label>
              <Input
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                placeholder="Opcional"
                type="number"
                step="0.01"
                min="0"
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative w-10 h-5 rounded-full transition-colors ${isActive ? "bg-primary" : "bg-secondary"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow ${isActive ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
            <Label className="text-sm text-foreground cursor-pointer" onClick={() => setIsActive(!isActive)}>
              {isActive ? "Ativo (visível no catálogo)" : "Inativo (oculto)"}
            </Label>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-border text-foreground">
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? "Salvar" : "Criar novela"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EpisodesManager({ dramaId }: { dramaId: number }) {
  const utils = trpc.useUtils();
  const { data: episodes, isLoading } = trpc.admin.listEpisodes.useQuery({ dramaId });
  const [addMode, setAddMode] = useState(false);
  const [epNumber, setEpNumber] = useState("");
  const [epTitle, setEpTitle] = useState("");
  const [epUrl, setEpUrl] = useState("");
  const [editEp, setEditEp] = useState<any>(null);

  const createMutation = trpc.admin.createEpisode.useMutation({
    onSuccess: () => {
      utils.admin.listEpisodes.invalidate({ dramaId });
      utils.admin.listDramas.invalidate();
      setAddMode(false);
      setEpNumber("");
      setEpTitle("");
      setEpUrl("");
      toast.success("Episódio adicionado");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.admin.updateEpisode.useMutation({
    onSuccess: () => {
      utils.admin.listEpisodes.invalidate({ dramaId });
      setEditEp(null);
      toast.success("Episódio atualizado");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.admin.deleteEpisode.useMutation({
    onSuccess: () => {
      utils.admin.listEpisodes.invalidate({ dramaId });
      utils.admin.listDramas.invalidate();
      toast.success("Episódio excluído");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleAdd = () => {
    if (!epNumber || !epUrl) {
      toast.error("Número e link são obrigatórios");
      return;
    }
    createMutation.mutate({
      dramaId,
      episodeNumber: parseInt(epNumber),
      title: epTitle || undefined,
      downloadUrl: epUrl,
    });
  };

  const handleUpdate = () => {
    if (!editEp) return;
    updateMutation.mutate({
      id: editEp.id,
      episodeNumber: parseInt(editEp.episodeNumber),
      title: editEp.title || undefined,
      downloadUrl: editEp.downloadUrl,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Episódios ({episodes?.length ?? 0})
        </p>
        <Button
          size="sm"
          variant="outline"
          className="border-border text-foreground hover:bg-accent text-xs h-7"
          onClick={() => setAddMode(!addMode)}
        >
          <Plus className="w-3 h-3 mr-1" />
          Adicionar
        </Button>
      </div>

      {/* Add form */}
      {addMode && (
        <div className="bg-secondary/50 border border-border rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Nº *</Label>
              <Input
                value={epNumber}
                onChange={(e) => setEpNumber(e.target.value)}
                placeholder="1"
                type="number"
                min="1"
                className="bg-input border-border text-foreground h-8 text-sm mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Título (opcional)</Label>
              <Input
                value={epTitle}
                onChange={(e) => setEpTitle(e.target.value)}
                placeholder="Episódio 1"
                className="bg-input border-border text-foreground h-8 text-sm mt-1"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Link de download *</Label>
            <Input
              value={epUrl}
              onChange={(e) => setEpUrl(e.target.value)}
              placeholder="https://drive.google.com/... ou qualquer link"
              className="bg-input border-border text-foreground h-8 text-sm mt-1"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs"
              onClick={handleAdd}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Salvar"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-border text-foreground h-8 text-xs"
              onClick={() => setAddMode(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Episodes list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <Skeleton key={i} className="h-8 rounded-lg bg-secondary" />)}
        </div>
      ) : !episodes?.length ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          Nenhum episódio. Clique em "Adicionar" para começar.
        </p>
      ) : (
        <div className="space-y-1.5">
          {episodes.map((ep) => (
            <div key={ep.id}>
              {editEp?.id === ep.id ? (
                <div className="bg-secondary/50 border border-border rounded-lg p-3 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      value={editEp.episodeNumber}
                      onChange={(e) => setEditEp({ ...editEp, episodeNumber: e.target.value })}
                      type="number"
                      className="bg-input border-border text-foreground h-7 text-xs"
                    />
                    <Input
                      value={editEp.title ?? ""}
                      onChange={(e) => setEditEp({ ...editEp, title: e.target.value })}
                      placeholder="Título"
                      className="bg-input border-border text-foreground h-7 text-xs col-span-2"
                    />
                  </div>
                  <Input
                    value={editEp.downloadUrl}
                    onChange={(e) => setEditEp({ ...editEp, downloadUrl: e.target.value })}
                    placeholder="Link"
                    className="bg-input border-border text-foreground h-7 text-xs"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-primary text-primary-foreground h-7 text-xs" onClick={handleUpdate} disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Salvar"}
                    </Button>
                    <Button size="sm" variant="outline" className="border-border text-foreground h-7 text-xs" onClick={() => setEditEp(null)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-secondary/30 rounded-lg px-3 py-2 group">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {ep.episodeNumber}
                  </span>
                  <span className="flex-1 text-xs text-foreground truncate">
                    {ep.title || `Episódio ${ep.episodeNumber}`}
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-[120px] hidden sm:block">
                    {ep.downloadUrl.substring(0, 30)}...
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditEp(ep)} className="text-muted-foreground hover:text-foreground p-1">
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Excluir este episódio?")) {
                          deleteMutation.mutate({ id: ep.id, dramaId });
                        }
                      }}
                      className="text-muted-foreground hover:text-destructive p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────

function OrdersTab() {
  const { data: orders, isLoading } = trpc.admin.orders.useQuery({});

  const statusColors: Record<string, string> = {
    paid: "bg-green-500/10 text-green-400 border-green-500/20",
    pending: "bg-primary/10 text-primary border-primary/20",
    expired: "bg-muted text-muted-foreground border-border",
    cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  };

  const statusLabels: Record<string, string> = {
    paid: "Pago",
    pending: "Pendente",
    expired: "Expirado",
    cancelled: "Cancelado",
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">
        Todos os pedidos ({orders?.length ?? 0})
      </h2>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl bg-card" />)}
        </div>
      ) : !orders?.length ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum pedido ainda</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">ID</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Usuário</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Valor</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Data</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any) => (
                  <tr key={o.order.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                    <td className="px-4 py-3 text-foreground font-mono text-xs">#{o.order.id}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-foreground text-xs font-medium">{o.user?.name || "—"}</p>
                        <p className="text-muted-foreground text-xs">{o.user?.email || "—"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-primary font-semibold text-xs">
                      R$ {parseFloat(o.order.totalAmount).toFixed(2).replace(".", ",")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs border ${statusColors[o.order.status] || ""}`}>
                        {statusLabels[o.order.status] || o.order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(o.order.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab() {
  const utils = trpc.useUtils();
  const { data: settings, isLoading } = trpc.admin.getSettings.useQuery({});
  const [mpToken, setMpToken] = useState("");
  const [showMpToken, setShowMpToken] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Initialize form with current values
  if (settings && !initialized) {
    setWhatsapp(settings.whatsappLink ?? "");
    setInitialized(true);
  }

  const saveMutation = trpc.admin.saveSettings.useMutation({
    onSuccess: () => {
      utils.admin.getSettings.invalidate();
      utils.publicSettings.whatsappLink.invalidate();
      toast.success("Configurações salvas!");
      setMpToken("");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      mpAccessToken: mpToken || undefined,
      whatsappLink: whatsapp,
    });
  };

  return (
    <div className="space-y-6 max-w-xl">
      <h2 className="text-lg font-semibold text-foreground">Configurações</h2>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-xl bg-card" />
          <Skeleton className="h-24 rounded-xl bg-card" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Mercado Pago */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Mercado Pago</h3>
                <p className="text-xs text-muted-foreground">
                  {settings?.hasMpToken
                    ? "✓ Chave configurada"
                    : "Nenhuma chave configurada"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-foreground">
                Access Token {settings?.hasMpToken ? "(deixe em branco para manter)" : "*"}
              </Label>
              <div className="relative">
                <Input
                  type={showMpToken ? "text" : "password"}
                  value={mpToken}
                  onChange={(e) => setMpToken(e.target.value)}
                  placeholder={settings?.hasMpToken ? "••••••••••••••••" : "APP_USR-..."}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowMpToken(!showMpToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showMpToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Obtenha em{" "}
                <a
                  href="https://www.mercadopago.com.br/developers/panel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  mercadopago.com.br/developers
                </a>
              </p>
            </div>
          </div>

          {/* WhatsApp */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <span className="text-base">💬</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Comunidade WhatsApp</h3>
                <p className="text-xs text-muted-foreground">
                  Link exibido no banner para os usuários
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-foreground">Link do grupo/comunidade</Label>
              <Input
                type="url"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="https://chat.whatsapp.com/..."
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Deixe em branco para ocultar o banner
              </p>
            </div>
          </div>

          <Button
            type="submit"
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Salvar configurações</>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
