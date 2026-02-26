import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";

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

const TicketList = () => {
  const { profile } = useAuth();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          id, title, status, priority, created_at,
          objects(name),
          profiles!assigned_to(full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Tickets</h1>
        <Button>
          <Plus className="h-4 w-4" />
          Neues Ticket
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !tickets?.length ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground">
          Keine Tickets vorhanden
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titel</TableHead>
                <TableHead>Objekt</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priorität</TableHead>
                <TableHead>Zugewiesen an</TableHead>
                <TableHead>Datum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket: any) => {
                const s = statusConfig[ticket.status] ?? { label: ticket.status, className: "" };
                const p = priorityConfig[ticket.priority] ?? { label: ticket.priority, className: "" };
                return (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.title}</TableCell>
                    <TableCell>{ticket.objects?.name ?? "–"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={s.className}>{s.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={p.className}>{p.label}</Badge>
                    </TableCell>
                    <TableCell>{ticket.profiles?.full_name ?? "–"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(ticket.created_at).toLocaleDateString("de-DE")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default TicketList;
