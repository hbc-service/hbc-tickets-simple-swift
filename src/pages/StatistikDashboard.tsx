import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  // 1. Tickets nach Status
  const { data: statusData, isLoading: l1 } = useQuery({
    queryKey: ["stats", "status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("status");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach((t: any) => {
        counts[t.status] = (counts[t.status] || 0) + 1;
      });
      return Object.entries(counts).map(([status, anzahl]) => ({
        name: statusLabels[status] ?? status,
        anzahl,
        status,
      }));
    },
  });

  // 2. Tickets nach Priorität
  const { data: priorityData, isLoading: l2 } = useQuery({
    queryKey: ["stats", "priority"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("priority");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach((t: any) => {
        counts[t.priority] = (counts[t.priority] || 0) + 1;
      });
      return Object.entries(counts).map(([priority, anzahl]) => ({
        name: priorityLabels[priority] ?? priority,
        anzahl,
      }));
    },
  });

  // 3. Top 5 Objekte
  const { data: objectData, isLoading: l3 } = useQuery({
    queryKey: ["stats", "objects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("objects(name)");
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

  // 4. Tickets pro Woche (letzte 8 Wochen)
  const { data: weeklyData, isLoading: l4 } = useQuery({
    queryKey: ["stats", "weekly"],
    queryFn: async () => {
      const eightWeeksAgo = new Date();
      eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
      const { data, error } = await supabase
        .from("tickets")
        .select("created_at")
        .gte("created_at", eightWeeksAgo.toISOString());
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

  // KPI calculations
  const totalTickets = statusData?.reduce((sum, s) => sum + s.anzahl, 0) ?? 0;
  const erledigtCount = statusData?.find((s) => s.status === "erledigt")?.anzahl ?? 0;
  const erledigungsquote = totalTickets > 0 ? Math.round((erledigtCount / totalTickets) * 100) : 0;
  const avgPerWeek = totalTickets > 0 ? (totalTickets / 8).toFixed(1) : "0";

  const isLoading = l1 || l2 || l3 || l4;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Statistiken & Auswertungen</h1>

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
