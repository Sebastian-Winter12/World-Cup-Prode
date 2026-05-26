import { MatchWithPrediction } from "@workspace/api-client-react/src/generated/api.schemas";
import { format } from "date-fns";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function MatchCard({ match }: { match: MatchWithPrediction }) {
  const isFinished = match.status === "finished";
  const isLive = match.status === "live";

  return (
    <Link href={`/matches/${match.id}`}>
      <Card className="p-4 hover:border-primary/50 transition-colors cursor-pointer group bg-card">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            {match.stage} {match.group ? `• Group ${match.group}` : ""}
          </span>
          {isLive ? (
            <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
          ) : isFinished ? (
            <Badge variant="secondary">FT</Badge>
          ) : (
            <span className="text-xs text-muted-foreground">
              {format(new Date(match.matchDate), "MMM d, HH:mm")}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex items-center justify-center border">
                {match.homeFlag ? (
                  <img src={match.homeFlag} alt={match.homeTeam} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold">{match.homeTeam.substring(0, 3).toUpperCase()}</span>
                )}
              </div>
              <span className="font-semibold text-lg">{match.homeTeam}</span>
            </div>
            <span className="font-display font-bold text-2xl">
              {match.homeScore ?? "-"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex items-center justify-center border">
                {match.awayFlag ? (
                  <img src={match.awayFlag} alt={match.awayTeam} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold">{match.awayTeam.substring(0, 3).toUpperCase()}</span>
                )}
              </div>
              <span className="font-semibold text-lg">{match.awayTeam}</span>
            </div>
            <span className="font-display font-bold text-2xl">
              {match.awayScore ?? "-"}
            </span>
          </div>
        </div>

        {match.myPrediction && (
          <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Your prediction:</span>
            <span className="font-mono font-medium">
              {match.myPrediction.homeGoals} - {match.myPrediction.awayGoals}
            </span>
          </div>
        )}
      </Card>
    </Link>
  );
}
