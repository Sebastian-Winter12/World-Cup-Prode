import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetGroup, useLeaveGroup, useGetUserPredictions, useGetMe } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Users, LogOut, Copy, Trophy, Target, Award, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ProdeAvatar } from "@/components/prode-avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/i18n/context";
import { format } from "date-fns";
import type { GroupMember } from "@workspace/api-client-react";

function MovementIndicator({ current, previous }: { current: number; previous: number | null }) {
  if (previous === null || previous === current) {
    return <span className="text-xs text-muted-foreground"><Minus className="h-3 w-3 inline" /></span>;
  }
  if (previous > current) {
    const diff = previous - current;
    return <span className="text-xs text-emerald-500 font-bold flex items-center gap-0.5"><TrendingUp className="h-3 w-3" />+{diff}</span>;
  }
  const diff = current - previous;
  return <span className="text-xs text-red-500 font-bold flex items-center gap-0.5"><TrendingDown className="h-3 w-3" />-{diff}</span>;
}

function PredictionPreviewContent({ userId }: { userId: number }) {
  const { t } = useI18n();
  const { data: predictions, isLoading } = useGetUserPredictions(userId);

  if (isLoading) {
    return (
      <div className="space-y-3 py-2">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  if (!predictions || predictions.length === 0) {
    return (
      <div className="py-10 text-center text-muted-foreground">{t.groupDetail.noPredictions}</div>
    );
  }

  const getStatus = (p: typeof predictions[0]) => {
    if (p.matchStatus !== "finished") return { label: t.groupDetail.pending, cls: "text-muted-foreground bg-muted" };
    if (p.points === 7) return { label: t.groupDetail.exactScore, cls: "text-emerald-700 bg-emerald-500/15" };
    if ((p.points ?? 0) >= 5) return { label: t.groupDetail.correctWinner, cls: "text-blue-700 bg-blue-500/15" };
    if (p.points !== null) return { label: t.groupDetail.incorrect, cls: "text-red-700 bg-red-500/15" };
    return { label: t.groupDetail.pending, cls: "text-muted-foreground bg-muted" };
  };

  return (
    <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
      {predictions.map((p) => {
        const { label, cls } = getStatus(p);
        return (
          <div key={p.matchId} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{p.homeTeam} vs {p.awayTeam}</p>
              <p className="text-xs text-muted-foreground">{format(new Date(p.matchDate), "MMM d, yyyy")}</p>
            </div>
            <div className="text-center shrink-0">
              <p className="text-xs text-muted-foreground mb-0.5">{t.groupDetail.predicted}</p>
              <p className="font-display font-bold">{p.homeGoals} - {p.awayGoals}</p>
            </div>
            {p.matchStatus === "finished" && (
              <div className="text-center shrink-0">
                <p className="text-xs text-muted-foreground mb-0.5">{t.groupDetail.actual}</p>
                <p className="font-display font-bold">{p.homeScore ?? "?"} - {p.awayScore ?? "?"}</p>
              </div>
            )}
            <div className="shrink-0 text-right">
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cls}`}>{label}</span>
              {p.points !== null && p.matchStatus === "finished" && (
                <p className="text-xs font-bold text-accent mt-1">+{p.points} pts</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function GroupDetail() {
  const { groupId } = useParams();
  const id = parseInt(groupId || "0", 10);
  const { toast } = useToast();
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);

  const { data: group, isLoading } = useGetGroup(id, {
    query: { enabled: !!id } as any
  });
  const { data: me } = useGetMe();

  const leaveGroup = useLeaveGroup();

  const handleCopyCode = () => {
    if (group?.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode);
      toast({
        title: t.groupDetail.copied,
        description: t.groupDetail.copiedDesc.replace("{code}", group.inviteCode),
      });
    }
  };

  const handleLeaveGroup = () => {
    leaveGroup.mutate({ groupId: id }, {
      onSuccess: () => {
        toast({ title: t.groupDetail.leftGroup });
        queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
        setLocation("/groups");
      },
      onError: () => {
        toast({ title: t.groupDetail.failedLeave, variant: "destructive" });
      }
    });
  };

  if (isLoading || !group) {
    return (
      <Layout>
        <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  const sortedMembers = [...group.members].sort((a, b) => b.points - a.points);

  const getRankColor = (index: number) =>
    index === 0 ? "text-accent" : index === 1 ? "text-gray-400" : index === 2 ? "text-amber-600" : "text-muted-foreground";

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6">
        <PageHeader
          title={group.name}
          subtitle={group.description ?? undefined}
          backHref="/groups"
          action={
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-1.5">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.groupDetail.leaveGroup}</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t.groupDetail.areYouSure}</AlertDialogTitle>
                  <AlertDialogDescription>{t.groupDetail.leaveWarning}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t.groupDetail.cancel}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLeaveGroup} disabled={leaveGroup.isPending}>
                    {leaveGroup.isPending ? t.groupDetail.leaving : t.groupDetail.leaveGroup}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          }
        />

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md text-sm font-medium">
            <Users className="h-4 w-4" />
            {group.members.length} {t.groupDetail.members}
          </div>
          <Button variant="outline" size="sm" onClick={handleCopyCode} className="gap-2 font-mono h-8 text-xs">
            <Copy className="h-3.5 w-3.5" />
            {group.inviteCode}
          </Button>
        </div>

        <Card className="bg-card border-border overflow-hidden">
          <div className="p-4 md:p-5 border-b border-border bg-muted/50">
            <h2 className="text-xl font-display font-bold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" /> {t.groupDetail.leaderboard}
            </h2>
          </div>

          {sortedMembers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">{t.groupDetail.noPredictions}</div>
          ) : (
            <div className="divide-y divide-border">
              {sortedMembers.map((member, index) => {
                const isCurrentUser = me?.id === member.userId;
                return (
                  <button
                    key={member.userId}
                    onClick={() => setSelectedMember(member)}
                    className={`w-full flex items-center gap-3 p-3 md:p-4 hover:bg-muted/30 transition-colors text-left ${
                      isCurrentUser ? "bg-primary/5 border-l-4 border-primary" : ""
                    }`}
                  >
                    <div className="flex flex-col items-center w-8 shrink-0">
                      <span className={`font-display font-bold text-lg leading-none ${getRankColor(index)}`}>
                        {index + 1}
                      </span>
                      <MovementIndicator current={index + 1} previous={member.previousRank ?? null} />
                    </div>

                    <ProdeAvatar avatarUrl={member.avatarUrl} username={member.username} size="sm" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm md:text-base truncate">{member.username}</span>
                        {isCurrentUser && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0 shrink-0">
                            {t.groupDetail.you}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Award className="h-3 w-3 text-blue-500" />
                          {member.correctWinners} {t.groupDetail.winners}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Target className="h-3 w-3 text-emerald-500" />
                          {member.exactScores} {t.groupDetail.exact}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-xl md:text-2xl font-display font-bold">{member.points}</span>
                        <span className="text-xs text-muted-foreground ml-1">{t.groupDetail.pts}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="max-w-lg w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedMember && <ProdeAvatar avatarUrl={selectedMember.avatarUrl} username={selectedMember.username} size="sm" />}
              {selectedMember
                ? t.groupDetail.predictionsOf.replace("{username}", selectedMember.username)
                : ""}
            </DialogTitle>
          </DialogHeader>
          {selectedMember && <PredictionPreviewContent userId={selectedMember.userId} />}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
