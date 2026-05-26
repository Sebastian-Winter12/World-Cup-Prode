import { useParams } from "wouter";
import { useGetMatch, useUpsertPrediction } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Trophy } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useI18n } from "@/i18n/context";

const predictionSchema = z.object({
  homeGoals: z.coerce.number().min(0).max(30),
  awayGoals: z.coerce.number().min(0).max(30),
});

export default function MatchDetail() {
  const { matchId } = useParams();
  const id = parseInt(matchId || "0", 10);
  const { toast } = useToast();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const { data: match, isLoading } = useGetMatch(id, {
    query: { refetchInterval: 60000, enabled: !!id } as any
  });

  const upsertPrediction = useUpsertPrediction();

  const form = useForm<z.infer<typeof predictionSchema>>({
    resolver: zodResolver(predictionSchema),
    defaultValues: { homeGoals: 0, awayGoals: 0 },
  });

  useEffect(() => {
    if (match?.myPrediction) {
      form.reset({
        homeGoals: match.myPrediction.homeGoals ?? 0,
        awayGoals: match.myPrediction.awayGoals ?? 0,
      });
    }
  }, [match, form]);

  const onSubmit = (values: z.infer<typeof predictionSchema>) => {
    upsertPrediction.mutate({ matchId: id, data: values }, {
      onSuccess: () => {
        toast({ title: t.matchDetail.predictionSaved, description: t.matchDetail.predictionSavedDesc });
        queryClient.invalidateQueries({ queryKey: ["/api/matches", id] });
      },
      onError: () => {
        toast({ title: t.matchDetail.error, description: t.matchDetail.errorDesc, variant: "destructive" });
      }
    });
  };

  if (isLoading || !match) {
    return (
      <Layout>
        <div className="p-6 md:p-10 max-w-4xl mx-auto w-full">
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const canEdit = new Date() < new Date(match.matchDate) && match.status === "scheduled";

  return (
    <Layout>
      <div className="p-6 md:p-10 max-w-4xl mx-auto w-full space-y-8">
        <div className="text-center">
          <div className="text-sm font-bold tracking-wider text-muted-foreground uppercase mb-2">
            {match.stage}{match.group ? ` • ${match.group}` : ""}
          </div>
          <p className="text-muted-foreground">
            {format(new Date(match.matchDate), "EEEE, MMMM do, yyyy • HH:mm")}
          </p>
          <p className="text-sm text-muted-foreground mt-1">{match.stadium}</p>
        </div>

        <Card className="p-8 bg-card border-border relative overflow-hidden">
          {isLive && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-destructive animate-pulse" />
          )}

          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col items-center gap-4 flex-1">
              <div className="w-24 h-24 rounded-full bg-muted overflow-hidden flex items-center justify-center border-4 border-card shadow-lg">
                {match.homeFlag ? (
                  <img src={match.homeFlag} alt={match.homeTeam} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold">{match.homeTeam.substring(0, 3).toUpperCase()}</span>
                )}
              </div>
              <h2 className="text-3xl font-display font-bold text-center">{match.homeTeam}</h2>
            </div>

            <div className="flex flex-col items-center gap-2 px-8">
              {isFinished || isLive ? (
                <div className="flex items-center gap-4 text-5xl font-display font-bold">
                  <span>{match.homeScore ?? 0}</span>
                  <span className="text-muted-foreground">-</span>
                  <span>{match.awayScore ?? 0}</span>
                </div>
              ) : (
                <div className="text-4xl font-display font-bold text-muted-foreground">vs</div>
              )}
              {isLive && <span className="text-destructive font-bold animate-pulse">LIVE</span>}
              {isFinished && <span className="text-muted-foreground font-bold">{t.matchDetail.fullTime}</span>}
            </div>

            <div className="flex flex-col items-center gap-4 flex-1">
              <div className="w-24 h-24 rounded-full bg-muted overflow-hidden flex items-center justify-center border-4 border-card shadow-lg">
                {match.awayFlag ? (
                  <img src={match.awayFlag} alt={match.awayTeam} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold">{match.awayTeam.substring(0, 3).toUpperCase()}</span>
                )}
              </div>
              <h2 className="text-3xl font-display font-bold text-center">{match.awayTeam}</h2>
            </div>
          </div>
        </Card>

        <Card className="p-8 bg-card border-border max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="h-6 w-6 text-accent" />
            <h3 className="text-2xl font-display font-bold">{t.matchDetail.yourPrediction}</h3>
          </div>

          {match.myPrediction?.points != null && isFinished && (
            <div className="mb-6 p-4 bg-accent/10 border border-accent/20 rounded-lg flex justify-between items-center">
              <span className="font-semibold text-accent-foreground">{t.matchDetail.pointsEarned}</span>
              <span className="text-2xl font-display font-bold text-accent">+{match.myPrediction.points}</span>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex items-center justify-center gap-8">
                <FormField
                  control={form.control}
                  name="homeGoals"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-center">
                      <FormControl>
                        <Input
                          type="number"
                          className="w-24 h-24 text-center text-4xl font-display font-bold bg-input"
                          {...field}
                          disabled={!canEdit || upsertPrediction.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <span className="text-3xl font-bold text-muted-foreground">-</span>

                <FormField
                  control={form.control}
                  name="awayGoals"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-center">
                      <FormControl>
                        <Input
                          type="number"
                          className="w-24 h-24 text-center text-4xl font-display font-bold bg-input"
                          {...field}
                          disabled={!canEdit || upsertPrediction.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {canEdit ? (
                <div className="flex justify-center mt-8">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full sm:w-auto px-12 h-14 text-lg font-bold"
                    disabled={upsertPrediction.isPending}
                  >
                    {upsertPrediction.isPending ? t.matchDetail.saving : t.matchDetail.savePrediction}
                  </Button>
                </div>
              ) : (
                <div className="text-center mt-6 text-muted-foreground bg-muted p-4 rounded-lg">
                  {isFinished ? t.matchDetail.finished : t.matchDetail.locked}
                </div>
              )}
            </form>
          </Form>
        </Card>
      </div>
    </Layout>
  );
}
