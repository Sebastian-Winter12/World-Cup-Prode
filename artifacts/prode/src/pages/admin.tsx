import { useState } from "react";
import { useListMatches, useUpdateMatchScore } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { useUser } from "@clerk/react";
import { Redirect } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const ADMIN_CLERK_ID = "user_3EVYiCvGQ24CfcJew9jLYd13HjE";

type MatchStatus = "scheduled" | "live" | "finished";

function ScoreEditor({ match }: { match: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { mutate, isPending } = useUpdateMatchScore();

  const [home, setHome] = useState<string>(match.homeScore?.toString() ?? "");
  const [away, setAway] = useState<string>(match.awayScore?.toString() ?? "");
  const [status, setStatus] = useState<MatchStatus>(match.status);

  const handleSave = () => {
    mutate(
      {
        matchId: match.id,
        data: {
          homeScore: parseInt(home) ?? 0,
          awayScore: parseInt(away) ?? 0,
          status,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries();
          toast({ title: "Partido actualizado" });
        },
        onError: () => {
          toast({ title: "Error al actualizar", variant: "destructive" });
        },
      }
    );
  };

  const statusColor: Record<MatchStatus, string> = {
    scheduled: "text-muted-foreground",
    live: "text-red-500",
    finished: "text-emerald-500",
  };

  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {match.homeFlag && <img src={match.homeFlag} className="h-5 w-7 object-cover rounded-sm shrink-0" />}
          <span className="font-medium text-sm truncate">{match.homeTeam}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <input
            type="number"
            min={0}
            max={99}
            value={home}
            onChange={(e) => setHome(e.target.value)}
            className="w-12 text-center bg-muted border border-border rounded-md py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <span className="text-muted-foreground text-sm">-</span>
          <input
            type="number"
            min={0}
            max={99}
            value={away}
            onChange={(e) => setAway(e.target.value)}
            className="w-12 text-center bg-muted border border-border rounded-md py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-2 min-w-0 justify-end">
          <span className="font-medium text-sm truncate">{match.awayTeam}</span>
          {match.awayFlag && <img src={match.awayFlag} className="h-5 w-7 object-cover rounded-sm shrink-0" />}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as MatchStatus)}
          className={`flex-1 bg-muted border border-border rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary ${statusColor[status]}`}
        >
          <option value="scheduled">Programado</option>
          <option value="live">En vivo</option>
          <option value="finished">Finalizado</option>
        </select>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-3 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isPending ? "..." : "Guardar"}
        </button>
      </div>

      <div className="text-xs text-muted-foreground">
        {new Date(match.matchDate).toLocaleString("es-AR", {
          weekday: "short", day: "numeric", month: "short",
          hour: "2-digit", minute: "2-digit"
        })}
        {match.group && <span className="ml-2">· {match.group}</span>}
      </div>
    </Card>
  );
}

export default function Admin() {
  const { user } = useUser();
  const [filter, setFilter] = useState<"all" | "live" | "scheduled" | "finished">("live");

  const { data: matches, isLoading } = useListMatches(
    filter !== "all" ? { status: filter } : undefined
  );

  if (user && user.id !== ADMIN_CLERK_ID) {
    return <Redirect to="/dashboard" />;
  }

  const sorted = [...(matches ?? [])].sort(
    (a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
  );

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">Admin</h1>
          <p className="text-muted-foreground text-sm mt-1">Actualizá scores y estados de los partidos</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {(["live", "scheduled", "finished", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border ${
                filter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {f === "live" ? "En vivo" : f === "scheduled" ? "Programados" : f === "finished" ? "Finalizados" : "Todos"}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="text-muted-foreground text-sm">Cargando partidos...</div>
        )}

        {!isLoading && sorted.length === 0 && (
          <div className="text-muted-foreground text-sm">No hay partidos para mostrar.</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sorted.map((match) => (
            <ScoreEditor key={match.id} match={match} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
