import { Link } from "wouter";
import { useGetDashboard } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { MatchCard } from "@/components/match-card";
import { Trophy, Target, Award, Activity, Users, ChevronRight } from "lucide-react";
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
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="space-y-1">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 md:space-y-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-display font-bold tracking-tight mb-1">
            {t.dashboard.title}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {t.dashboard.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <Link href="/groups">
            <Card className="p-4 bg-card border-border flex flex-col gap-2 cursor-pointer hover:border-primary/40 transition-colors">
              <div className="flex justify-between items-center">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider leading-tight">{t.dashboard.totalPoints}</p>
                <Trophy className="h-4 w-4 text-accent shrink-0" />
              </div>
              <p className="text-3xl font-display font-bold leading-none">{dashboard.totalPoints}</p>
            </Card>
          </Link>
          <Card className="p-4 bg-card border-border flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider leading-tight">{t.dashboard.exactScores}</p>
              <Target className="h-4 w-4 text-emerald-500 shrink-0" />
            </div>
            <p className="text-3xl font-display font-bold leading-none">{dashboard.exactScores}</p>
          </Card>
          <Card className="p-4 bg-card border-border flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider leading-tight">{t.dashboard.correctWinners}</p>
              <Award className="h-4 w-4 text-blue-500 shrink-0" />
            </div>
            <p className="text-3xl font-display font-bold leading-none">{dashboard.correctWinners}</p>
          </Card>
          <Link href="/matches">
            <Card className="p-4 bg-card border-border flex flex-col gap-2 cursor-pointer hover:border-primary/40 transition-colors">
              <div className="flex justify-between items-center">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider leading-tight">
                  {t.dashboard.predicted}
                </p>
                <Activity className="h-4 w-4 text-purple-500 shrink-0" />
              </div>
              <p className="text-3xl font-display font-bold leading-none">
                {dashboard.predictedCount}
                <span className="text-base text-muted-foreground font-sans ml-1">
                  / {dashboard.totalMatches}
                </span>
              </p>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {dashboard.upcomingMatches.length > 0 && (
              <section>
                <h2 className="text-lg md:text-xl font-display font-bold mb-3 md:mb-4">
                  {t.dashboard.upcomingMatches}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  {dashboard.upcomingMatches.map(match => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </section>
            )}

                <section>
                <h2 className="text-lg md:text-xl font-display font-bold mb-3 md:mb-4 flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  {t.dashboard.liveMatches}
                </h2>
                
                {dashboard.liveMatches?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    {dashboard.liveMatches.map(match => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                ) : (
                  <Card className="p-5 text-center text-muted-foreground border-dashed text-sm">
                    <p>{t.dashboard.noLiveMatches}</p>
                  </Card>
                )}
              </section>
              
            {dashboard.recentResults.length > 0 && (
              <section>
                <h2 className="text-lg md:text-xl font-display font-bold mb-3 md:mb-4">
                  {t.dashboard.recentResults}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  {dashboard.recentResults.map(match => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </section>
            )}
          </div>


          <div className="space-y-3">
            <h2 className="text-lg md:text-xl font-display font-bold">{t.dashboard.yourGroups}</h2>
            {dashboard.groupRankings.length > 0 ? (
              <div className="flex flex-col gap-2">
                {dashboard.groupRankings.map(group => (
                  <Link key={group.groupId} href={`/groups/${group.groupId}`}>
                    <Card className="p-3 md:p-4 flex items-center gap-3 hover:border-primary/40 transition-colors cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{group.groupName}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Users className="h-3 w-3" />
                          {group.memberCount} {t.dashboard.members}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <p className="text-xl font-display font-bold text-accent leading-none">#{group.rank}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{group.totalPoints} pts</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="p-5 text-center text-muted-foreground border-dashed text-sm">
                <p>{t.dashboard.noGroups}</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
