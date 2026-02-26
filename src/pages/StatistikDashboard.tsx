import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from "recharts";

const statusLabels: Record<string, string> = {
  offen: "Offen",
  in_bearbeitung: "In Bearbeitung",
  erledigt: "Erledigt",
  eskaliert: "Eskaliert",
};

const priorityLabels: Record<string, string> = {
  hoch: "Hoch",
  mittel: "Mittel",
  niedrig: "Niedrig",
};

const StatistikDashboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [zeitraum, setZeitraum] = useState("30");
  const canExport = profile?.role === "admin" || profile?.role === "manager";

  const zeitraumDays = Number(zeitraum);
  const vonDatum = zeitraumDays > 0
    ? new Date(Date.now() - zeitraumDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  // helper to apply date filter
  const applyDateFilter = (query: any) => {
    if (vonDatum) return query.gte("created_at", vonDatum);
    return query;
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          id, title, status, priority, category, created_at,
          objects(name),
          profiles!assigned_to(full_name),
          profiles!created_by(full_name)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const headers = ["ID", "Titel", "Status", "Priorität", "Kategorie", "Objekt", "Zugewiesen an", "Erstellt von", "Erstellt am"];
      const rows = (data ?? []).map((t: any) => [
        t.id,
        t.title,
        t.status,
        t.priority,
        t.category ?? "",
        t.objects?.name ?? "",
        (t as any)["profiles!assigned_to"]?.full_name ?? "",
        (t as any)["profiles!created_by"]?.full_name ?? "",
        new Date(t.created_at).toLocaleDateString("de-DE"),
      ]);
      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell: any) => `"${cell}"`).join(";"))
        .join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `hbc-tickets-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({ title: "Export erfolgreich", description: `${rows.length} Tickets exportiert` });
    } catch {
      toast({ title: "Fehler", description: "Export fehlgeschlagen.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const { data: statusData, isLoading: l1 } = useQuery({
    queryKey: ["stats", "status", zeitraum],
    queryFn: async () => {
      const { data, error } = await applyDateFilter(
        supabase.from("tickets").select("status")
      );
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach((t: any) => { counts[t.status] = (counts[t.status] || 0) + 1; });
      return Object.entries(counts).map(([status, anzahl]) => ({
        name: statusLabels[status] ?? status, anzahl, status,
      }));
    },
  });

  const { data: priorityData, isLoading: l2 } = useQuery({
    queryKey: ["stats", "priority", zeitraum],
    queryFn: async () => {
      const { data, error } = await applyDateFilter(
        supabase.from("tickets").select("priority")
      );
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach((t: any) => { counts[t.priority] = (counts[t.priority] || 0) + 1; });
      return Object.entries(counts).map(([priority, anzahl]) => ({
        name: priorityLabels[priority] ?? priority, anzahl,
      }));
    },
  });

  const { data: objectData, isLoading: l3 } = useQuery({
    queryKey: ["stats", "objects", zeitraum],
    queryFn: async () => {
      const { data, error } = await applyDateFilter(
        supabase.from("tickets").select("objects(name)")
      );
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach((t: any) => {
        const name = t.objects?.name ?? "Unbekannt";
        counts[name] = (counts[name] || 0) + 1;
      });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, anzahl]) => ({ name, anzahl }));
    },
  });

  const { data: weeklyData, isLoading: l4 } = useQuery({
    queryKey: ["stats", "weekly", zeitraum],
    queryFn: async () => {
      let query = supabase.from("tickets").select("created_at");
      if (vonDatum) {
        query = query.gte("created_at", vonDatum);
      } else {
        const eightWeeksAgo = new Date();
        eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
        query = query.gte("created_at", eightWeeksAgo.toISOString());
      }
      const { data, error } = await query;
      if (error) throw error;

      const weeks: Record<string, number> = {};
      data.forEach((t: any) => {
        const d = new Date(t.created_at);
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay() + 1);
        const key = startOfWeek.toISOString().slice(0, 10);
        weeks[key] = (weeks[key] || 0) + 1;
      });
      return Object.entries(weeks)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([woche, anzahl]) => ({
          name: new Date(woche).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
          anzahl,
        }));
    },
  });

  const totalTickets = statusData?.reduce((sum, s) => sum + s.anzahl, 0) ?? 0;
  const erledigtCount = statusData?.find((s) => s.status === "erledigt")?.anzahl ?? 0;
  const erledigungsquote = totalTickets > 0 ? Math.round((erledigtCount / totalTickets) * 100) : 0;
  const weeksCount = weeklyData?.length || 1;
  const avgPerWeek = totalTickets > 0 ? (totalTickets / weeksCount).toFixed(1) : "0";

  const isLoading = l1 || l2 || l3 || l4;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Statistiken & Auswertungen</h1>
        <div className="flex items-center gap-3">
          <Select value={zeitraum} onValueChange={setZeitraum}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Letzte 7 Tage</SelectItem>
              <SelectItem value="30">Letzte 30 Tage</SelectItem>
              <SelectItem value="90">Letzte 90 Tage</SelectItem>
              <SelectItem value="365">Letzte 12 Monate</SelectItem>
              <SelectItem value="0">Gesamt</SelectItem>
            </SelectContent>
          </Select>
          {canExport && (
            <Button onClick={handleExport} disabled={exporting} variant="outline">
              <Download className="h-4 w-4" />
              {exporting ? "Exportiere…" : "CSV exportieren"}
            </Button>
          )}
        </div>
      </div>

      {/* KPI-Karten */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Gesamt Tickets</p>
            {isLoading ? <Skeleton className="h-9 w-16 mt-1" /> : (
              <p className="text-3xl font-bold">{totalTickets}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Erledigungsquote</p>
            {isLoading ? <Skeleton className="h-9 w-16 mt-1" /> : (
              <p className="text-3xl font-bold">{erledigungsquote}%</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Ø Tickets / Woche</p>
            {isLoading ? <Skeleton className="h-9 w-16 mt-1" /> : (
              <p className="text-3xl font-bold">{avgPerWeek}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Tickets nach Status</CardTitle></CardHeader>
          <CardContent className="h-64">
            {l1 ? <Skeleton className="h-full w-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="anzahl" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Tickets nach Priorität</CardTitle></CardHeader>
          <CardContent className="h-64">
            {l2 ? <Skeleton className="h-full w-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="anzahl" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Top 5 Objekte</CardTitle></CardHeader>
          <CardContent className="h-64">
            {l3 ? <Skeleton className="h-full w-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={objectData} layout="vertical">
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="anzahl" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Tickets pro Woche (Trend)</CardTitle></CardHeader>
          <CardContent className="h-64">
            {l4 ? <Skeleton className="h-full w-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="anzahl" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatistikDashboard;
