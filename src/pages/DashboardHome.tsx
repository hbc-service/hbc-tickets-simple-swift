import { Ticket, AlertTriangle, Clock, CalendarPlus, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const statusConfig: Record<string, { label: string; className: string }> = {
  offen: { label: "Offen", className: "bg-blue-500/15 text-blue-700 border-blue-300" },
  in_bearbeitung: { label: "In Bearbeitung", className: "bg-yellow-500/15 text-yellow-700 border-yellow-300" },
  erledigt: { label: "Erledigt", className: "bg-green-500/15 text-green-700 border-green-300" },
  eskaliert: { label: "Eskaliert", className: "bg-red-500/15 text-red-700 border-red-300" },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  hoch: { label: "Hoch", className: "bg-red-500/15 text-red-700 border-red-300" },
  mittel: { label: "Mittel", className: "bg-yellow-500/15 text-yellow-700 border-yellow-300" },
  niedrig: { label: "Niedrig", className: "bg-muted text-muted-foreground border-border" },
};

const roleLabels: Record<string, string> = {
  admin: "Administrator",
  manager: "Manager",
  employee: "Mitarbeiter",
};

const DashboardHome = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const displayName = profile?.full_name || "Benutzer";
  const role = profile?.role || "employee";

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: countOffen, isLoading: l1 } = useQuery({
    queryKey: ["kpi", "offen"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("tickets").select("*", { count: "exact", head: true })
        .eq("status", "offen");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: countBearbeitung, isLoading: l2 } = useQuery({
    queryKey: ["kpi", "in_bearbeitung"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("tickets").select("*", { count: "exact", head: true })
        .eq("status", "in_bearbeitung");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: countEskaliert, isLoading: l3 } = useQuery({
    queryKey: ["kpi", "eskaliert"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("tickets").select("*", { count: "exact", head: true })
        .eq("status", "eskaliert");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: countToday, isLoading: l4 } = useQuery({
    queryKey: ["kpi", "today"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("tickets").select("*", { count: "exact", head: true })
        .gte("created_at", todayStart.toISOString());
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: myTickets, isLoading: l5 } = useQuery({
    queryKey: ["my-tickets", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("id, title, status, priority, created_at")
        .eq("assigned_to", profile!.id)
        .neq("status", "erledigt")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const { data: recentTickets, isLoading: l6 } = useQuery({
    queryKey: ["recent-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("id, title, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const kpis = [
    { label: "Offene Tickets", value: countOffen, icon: Ticket, loading: l1 },
    { label: "In Bearbeitung", value: countBearbeitung, icon: Clock, loading: l2 },
    { label: "Eskaliert", value: countEskaliert, icon: AlertTriangle, loading: l3 },
    { label: "Heute erstellt", value: countToday, icon: CalendarPlus, loading: l4 },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Guten Tag, {displayName} 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">Hier ist Ihre Übersicht für heute.</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 border-accent/30">
          <Shield className="h-3.5 w-3.5 text-accent" />
          <span className="text-xs font-medium">{roleLabels[role] ?? role}</span>
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{kpi.label}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {kpi.loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-card-foreground">{kpi.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* My Tickets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Meine Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {l5 ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : !myTickets?.length ? (
            <p className="text-sm text-muted-foreground">Keine offenen Tickets zugewiesen.</p>
          ) : (
            <div className="space-y-2">
              {myTickets.map((t: any) => {
                const s = statusConfig[t.status] ?? { label: t.status, className: "" };
                const p = priorityConfig[t.priority] ?? { label: t.priority, className: "" };
                return (
                  <div key={t.id} onClick={() => navigate(`/dashboard/tickets/${t.id}`)} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                    <span className="text-sm text-card-foreground truncate">{t.title}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={p.className}>{p.label}</Badge>
                      <Badge variant="outline" className={s.className}>{s.label}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Letzte Aktivität</CardTitle>
        </CardHeader>
        <CardContent>
          {l6 ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : !recentTickets?.length ? (
            <p className="text-sm text-muted-foreground">Keine Tickets vorhanden.</p>
          ) : (
            <div className="space-y-2">
              {recentTickets.map((t: any) => {
                const s = statusConfig[t.status] ?? { label: t.status, className: "" };
                return (
                  <div key={t.id} onClick={() => navigate(`/dashboard/tickets/${t.id}`)} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm text-card-foreground truncate">{t.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={s.className}>{s.label}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString("de-DE")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardHome;
