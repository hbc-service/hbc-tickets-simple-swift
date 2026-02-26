import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
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
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState("alle");
  const [priorityFilter, setPriorityFilter] = useState("alle");
  const [searchText, setSearchText] = useState("");

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["tickets", statusFilter, priorityFilter, searchText],
    queryFn: async () => {
      let query = supabase
        .from("tickets")
        .select(`
          id, title, status, priority, created_at,
          objects(name),
          profiles!assigned_to(full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (statusFilter && statusFilter !== "alle") {
        query = query.eq("status", statusFilter);
      }
      if (priorityFilter && priorityFilter !== "alle") {
        query = query.eq("priority", priorityFilter);
      }
      if (searchText) {
        query = query.ilike("title", `%${searchText}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Tickets</h1>
        <Button onClick={() => navigate("/dashboard/tickets/new")}>
          <Plus className="h-4 w-4" />
          Neues Ticket
        </Button>
      </div>

      {/* Filter-Leiste */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Status</SelectItem>
            <SelectItem value="offen">Offen</SelectItem>
            <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
            <SelectItem value="erledigt">Erledigt</SelectItem>
            <SelectItem value="eskaliert">Eskaliert</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Priorität" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Prioritäten</SelectItem>
            <SelectItem value="hoch">Hoch</SelectItem>
            <SelectItem value="mittel">Mittel</SelectItem>
            <SelectItem value="niedrig">Niedrig</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ticket suchen..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Ergebnis-Zähler */}
      {!isLoading && tickets && (
        <p className="text-sm text-muted-foreground">
          {tickets.length} Ticket{tickets.length !== 1 ? "s" : ""} gefunden
        </p>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !tickets?.length ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground">
          Keine Tickets gefunden
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
                  <TableRow key={ticket.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/dashboard/tickets/${ticket.id}`)}>
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
