import { useState } from "react";
import { useListMatches } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { MatchCard } from "@/components/match-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/context";

export default function Matches() {
  const { t } = useI18n();
  const [stage, setStage] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const { data: matches, isLoading } = useListMatches({
    stage: stage !== "all" ? stage : undefined,
    status: status !== "all" ? status : undefined,
  }, {
    query: { refetchInterval: 60000 } as any
  });

  return (
    <Layout>
      <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">
            {t.matches.title}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t.matches.subtitle}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Select value={stage} onValueChange={setStage}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder={t.matches.filterStage} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.matches.allStages}</SelectItem>
              <SelectItem value="Group Stage">{t.matches.groupStage}</SelectItem>
              <SelectItem value="Round of 32">{t.matches.roundOf32}</SelectItem>
              <SelectItem value="Round of 16">{t.matches.roundOf16}</SelectItem>
              <SelectItem value="Quarterfinals">{t.matches.quarterFinals}</SelectItem>
              <SelectItem value="Semifinals">{t.matches.semiFinals}</SelectItem>
              <SelectItem value="Third Place">{t.matches.thirdPlace}</SelectItem>
              <SelectItem value="Final">{t.matches.final}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder={t.matches.filterStatus} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.matches.allStatuses}</SelectItem>
              <SelectItem value="scheduled">{t.matches.scheduled}</SelectItem>
              <SelectItem value="live">{t.matches.live}</SelectItem>
              <SelectItem value="finished">{t.matches.finished}</SelectItem>
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
            {t.matches.noMatches}
          </div>
        )}
      </div>
    </Layout>
  );
}
