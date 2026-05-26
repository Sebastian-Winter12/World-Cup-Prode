import { useParams, useLocation } from "wouter";
import { useGetGroup, useLeaveGroup } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Users, LogOut, Copy, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useQueryClient } from "@tanstack/react-query";

export default function GroupDetail() {
  const { groupId } = useParams();
  const id = parseInt(groupId || "0", 10);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: group, isLoading } = useGetGroup(id, {
    query: { enabled: !!id }
  });

  const leaveGroup = useLeaveGroup();

  const handleCopyCode = () => {
    if (group?.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode);
      toast({
        title: "Copied to clipboard",
        description: `Invite code ${group.inviteCode} copied.`,
      });
    }
  };

  const handleLeaveGroup = () => {
    leaveGroup.mutate({ groupId: id }, {
      onSuccess: () => {
        toast({ title: "Left group successfully" });
        queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
        setLocation("/groups");
      },
      onError: () => {
        toast({ title: "Failed to leave group", variant: "destructive" });
      }
    });
  };

  if (isLoading || !group) {
    return (
      <Layout>
        <div className="p-6 md:p-10 max-w-5xl mx-auto w-full space-y-8">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  // Sort members by points descending
  const sortedMembers = [...group.members].sort((a, b) => b.points - a.points);

  return (
    <Layout>
      <div className="p-6 md:p-10 max-w-5xl mx-auto w-full space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-2">
              {group.name}
            </h1>
            {group.description && (
              <p className="text-muted-foreground text-lg mb-4">{group.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm font-medium">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md text-foreground">
                <Users className="h-4 w-4" />
                {group.members.length} members
              </div>
              <Button variant="outline" size="sm" onClick={handleCopyCode} className="gap-2 font-mono h-8">
                <Copy className="h-4 w-4" />
                {group.inviteCode}
              </Button>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <LogOut className="h-4 w-4" /> Leave Group
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. You will lose your rank in this group.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLeaveGroup} disabled={leaveGroup.isPending}>
                  {leaveGroup.isPending ? "Leaving..." : "Leave Group"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <Card className="bg-card border-border overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/50">
            <h2 className="text-2xl font-display font-bold flex items-center gap-3">
              <Trophy className="h-6 w-6 text-accent" /> Leaderboard
            </h2>
          </div>
          <div className="divide-y divide-border">
            {sortedMembers.map((member, index) => (
              <div key={member.userId} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-8 font-display font-bold text-xl text-center ${
                    index === 0 ? "text-accent" :
                    index === 1 ? "text-gray-400" :
                    index === 2 ? "text-amber-700" :
                    "text-muted-foreground"
                  }`}>
                    {index + 1}
                  </div>
                  <Avatar className="h-10 w-10 border-2 border-background">
                    <AvatarImage src={member.avatarUrl ?? ""} />
                    <AvatarFallback>{member.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-lg">{member.username}</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-display font-bold">{member.points}</span>
                  <span className="text-sm text-muted-foreground ml-1">pts</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
