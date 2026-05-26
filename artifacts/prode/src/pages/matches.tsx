import { useState } from "react";
import { useListMatches } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { MatchCard } from "@/components/match-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function Matches() {
  const [stage, setStage] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const { data: matches, isLoading } = useListMatches({
    stage: stage !== "all" ? stage : undefined,
    status: status !== "all" ? status : undefined,
  }, {
    query: { refetchInterval: 60000 }
  });

  return (
    <Layout>
      <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">
            Match Center
          </h1>
          <p className="text-muted-foreground text-lg">
            All World Cup 2026 matches. Track scores and make your predictions.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Select value={stage} onValueChange={setStage}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              <SelectItem value="Group Stage">Group Stage</SelectItem>
              <SelectItem value="Round of 32">Round of 32</SelectItem>
              <SelectItem value="Round of 16">Round of 16</SelectItem>
              <SelectItem value="Quarterfinals">Quarterfinals</SelectItem>
              <SelectItem value="Semifinals">Semifinals</SelectItem>
              <SelectItem value="Third Place">Third Place</SelectItem>
              <SelectItem value="Final">Final</SelectItem>
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="finished">Finished</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : matches && matches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground bg-card rounded-xl border border-border">
            No matches found for the selected filters.
          </div>
        )}
      </div>
    </Layout>
  );
}
