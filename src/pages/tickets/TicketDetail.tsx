import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send } from "lucide-react";
import { useState } from "react";

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

const TicketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");

  const canChangeStatus = profile?.role === "admin" || profile?.role === "manager";

  const { data: ticket, isLoading: ticketLoading } = useQuery({
    queryKey: ["ticket", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          objects(name),
          profiles!assigned_to(full_name),
          profiles!created_by(full_name)
        `)
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ["comments", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*, profiles(full_name)")
        .eq("ticket_id", id!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("comments").insert({
        ticket_id: id!,
        author_id: profile!.id,
        content: commentText,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", id] });
      setCommentText("");
    },
    onError: () => {
      toast({ title: "Fehler", description: "Kommentar konnte nicht gespeichert werden.", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from("tickets")
        .update({ status: newStatus })
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: () => {
      toast({ title: "Fehler", description: "Status konnte nicht geändert werden.", variant: "destructive" });
    },
  });

  if (ticketLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-4 text-muted-foreground">
        <p>Ticket nicht gefunden</p>
        <Button variant="outline" onClick={() => navigate("/dashboard/tickets")}>
          <ArrowLeft className="h-4 w-4" /> Zurück
        </Button>
      </div>
    );
  }

  const s = statusConfig[ticket.status] ?? { label: ticket.status, className: "" };
  const p = priorityConfig[ticket.priority] ?? { label: ticket.priority, className: "" };

  // Access created_by profile — Supabase aliases the second profiles join
  const createdByName = (ticket as any)["profiles!created_by"]?.full_name ?? "–";
  const assignedToName = (ticket as any)["profiles!assigned_to"]?.full_name ?? "–";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/tickets")} className="mb-1 -ml-2">
            <ArrowLeft className="h-4 w-4" /> Zurück zu Tickets
          </Button>
          <h1 className="text-2xl font-bold text-foreground">{ticket.title}</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={s.className}>{s.label}</Badge>
            <Badge variant="outline" className={p.className}>{p.label}</Badge>
          </div>
        </div>

        {canChangeStatus && (
          <Select value={ticket.status} onValueChange={(v) => updateStatusMutation.mutate(v)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="offen">Offen</SelectItem>
              <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
              <SelectItem value="erledigt">Erledigt</SelectItem>
              <SelectItem value="eskaliert">Eskaliert</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Description + Comments */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Beschreibung</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {ticket.description || "Keine Beschreibung vorhanden."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kommentare</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {commentsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !comments?.length ? (
                <p className="text-muted-foreground text-sm">Noch keine Kommentare.</p>
              ) : (
                comments.map((comment: any) => (
                  <div key={comment.id} className="rounded-lg border bg-muted/30 p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{comment.profiles?.full_name ?? "Unbekannt"}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleString("de-DE")}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                  </div>
                ))
              )}

              <Separator />

              <div className="flex gap-2">
                <Textarea
                  placeholder="Kommentar schreiben..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[60px]"
                />
                <Button
                  size="icon"
                  onClick={() => addCommentMutation.mutate()}
                  disabled={!commentText.trim() || addCommentMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Metadata */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MetaRow label="Objekt" value={ticket.objects?.name} />
            <MetaRow label="Kategorie" value={ticket.category} />
            <MetaRow label="Erstellt von" value={createdByName} />
            <MetaRow label="Zugewiesen an" value={assignedToName} />
            <MetaRow
              label="Erstellt am"
              value={new Date(ticket.created_at).toLocaleDateString("de-DE")}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const MetaRow = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm font-medium">{value || "–"}</p>
  </div>
);

export default TicketDetail;
