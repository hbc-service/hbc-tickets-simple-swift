import { Ticket, FolderKanban, CheckSquare, Clock, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

const stats = [
  { label: "Offene Tickets", value: 12, icon: Ticket, change: "+3 heute" },
  { label: "Aktive Projekte", value: 4, icon: FolderKanban, change: "1 fällig" },
  { label: "Meine Aufgaben", value: 7, icon: CheckSquare, change: "2 überfällig" },
  { label: "Ø Reaktionszeit", value: "2.4h", icon: Clock, change: "-12% vs. Vorwoche" },
];

const recentTickets = [
  { id: "T-1042", title: "Heizungsausfall Gebäude C", priority: "Hoch", status: "Offen" },
  { id: "T-1041", title: "Aufzug Wartung Block A", priority: "Mittel", status: "In Bearbeitung" },
  { id: "T-1040", title: "Reinigung Außenbereich", priority: "Niedrig", status: "Offen" },
  { id: "T-1039", title: "Schlüssel verloren – Büro 204", priority: "Hoch", status: "In Bearbeitung" },
  { id: "T-1038", title: "Beleuchtung Tiefgarage defekt", priority: "Mittel", status: "Erledigt" },
];

const priorityColor: Record<string, string> = {
  Hoch: "bg-destructive/10 text-destructive",
  Mittel: "bg-accent/10 text-accent",
  Niedrig: "bg-muted text-muted-foreground",
};

const statusColor: Record<string, string> = {
  Offen: "bg-destructive/10 text-destructive",
  "In Bearbeitung": "bg-accent/10 text-accent",
  Erledigt: "bg-green-100 text-green-700",
};

const roleLabels: Record<string, string> = {
  admin: "Administrator",
  manager: "Manager",
  employee: "Mitarbeiter",
};

const DashboardHome = () => {
  const { profile } = useAuth();
  const displayName = profile?.full_name || "Benutzer";
  const role = profile?.role || "employee";

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Guten Tag, {displayName} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hier ist Ihre Übersicht für heute.
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 border-accent/30">
          <Shield className="h-3.5 w-3.5 text-accent" />
          <span className="text-xs font-medium">{roleLabels[role] ?? role}</span>
        </Badge>
      </div>

      {/* Role-specific hint */}
      {role === "admin" && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="py-3 px-4 text-sm text-accent">
            Sie haben <strong>Administrator</strong>-Zugriff. Alle Bereiche sind freigeschaltet.
          </CardContent>
        </Card>
      )}
      {role === "manager" && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="py-3 px-4 text-sm text-accent">
            Sie haben <strong>Manager</strong>-Zugriff auf Ihr Team und zugewiesene Projekte.
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Tickets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Aktuelle Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground w-16">{ticket.id}</span>
                  <span className="text-sm text-card-foreground">{ticket.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${priorityColor[ticket.priority]}`}>{ticket.priority}</span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColor[ticket.status]}`}>{ticket.status}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardHome;
