import { useGetDashboard } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { MatchCard } from "@/components/match-card";
import { Trophy, Target, Award, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/context";

export default function Dashboard() {
  const { t } = useI18n();
  const { data: dashboard, isLoading } = useGetDashboard({
    query: { refetchInterval: 60000 } as any
  });

  if (isLoading || !dashboard) {
    return (
      <Layout>
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">
            {t.dashboard.title}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t.dashboard.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 bg-card border-border flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t.dashboard.totalPoints}</p>
              <Trophy className="h-5 w-5 text-accent" />
            </div>
            <p className="text-4xl font-display font-bold">{dashboard.totalPoints}</p>
          </Card>
          <Card className="p-6 bg-card border-border flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t.dashboard.exactScores}</p>
              <Target className="h-5 w-5 text-primary" />
            </div>
            <p className="text-4xl font-display font-bold">{dashboard.exactScores}</p>
          </Card>
          <Card className="p-6 bg-card border-border flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t.dashboard.correctWinners}</p>
              <Award className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-4xl font-display font-bold">{dashboard.correctWinners}</p>
          </Card>
          <Card className="p-6 bg-card border-border flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t.dashboard.predicted}</p>
              <Activity className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-4xl font-display font-bold">
              {dashboard.predictedCount} <span className="text-xl text-muted-foreground font-sans">/ {dashboard.totalMatches}</span>
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
            {dashboard.upcomingMatches.length > 0 && (
              <section>
                <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
                  {t.dashboard.upcomingMatches}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {dashboard.upcomingMatches.map(match => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </section>
            )}

            {dashboard.recentResults.length > 0 && (
              <section>
                <h2 className="text-2xl font-display font-bold mb-6">{t.dashboard.recentResults}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {dashboard.recentResults.map(match => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-display font-bold">{t.dashboard.yourGroups}</h2>
            {dashboard.groupRankings.length > 0 ? (
              <div className="flex flex-col gap-4">
                {dashboard.groupRankings.map(group => (
                  <Card key={group.groupId} className="p-5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{group.groupName}</p>
                      <p className="text-sm text-muted-foreground">{group.memberCount} {t.dashboard.members}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-display font-bold text-accent">#{group.rank}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{group.totalPoints} pts</p>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center text-muted-foreground border-dashed">
                <p>{t.dashboard.noGroups}</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
