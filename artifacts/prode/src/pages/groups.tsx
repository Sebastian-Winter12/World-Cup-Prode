import { useState } from "react";
import { Link } from "wouter";
import { useListMyGroups, useCreateGroup, useJoinGroup } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Plus, Hash, ChevronRight, Trophy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/i18n/context";

const createGroupSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  description: z.string().max(200).optional(),
});

const joinGroupSchema = z.object({
  inviteCode: z.string().min(1, "Invite code is required"),
});

export default function Groups() {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: groups, isLoading } = useListMyGroups();
  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroup();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  const createForm = useForm<z.infer<typeof createGroupSchema>>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: { name: "", description: "" },
  });

  const joinForm = useForm<z.infer<typeof joinGroupSchema>>({
    resolver: zodResolver(joinGroupSchema),
    defaultValues: { inviteCode: "" },
  });

  const onCreateSubmit = (values: z.infer<typeof createGroupSchema>) => {
    createGroup.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: t.groups.groupCreated });
        queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
        setIsCreateOpen(false);
        createForm.reset();
      },
      onError: () => {
        toast({ title: t.groups.failedCreate, variant: "destructive" });
      }
    });
  };

  const onJoinSubmit = (values: z.infer<typeof joinGroupSchema>) => {
    joinGroup.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: t.groups.joinedGroup });
        queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
        setIsJoinOpen(false);
        joinForm.reset();
      },
      onError: () => {
        toast({ title: t.groups.failedJoin, description: t.groups.invalidCode, variant: "destructive" });
      }
    });
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight mb-1">
              {t.groups.title}
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              {t.groups.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm" className="gap-1.5">
                  <Hash className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.groups.joinViaCode}</span>
                  <span className="sm:hidden">Join</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t.groups.joinGroup}</DialogTitle>
                </DialogHeader>
                <Form {...joinForm}>
                  <form onSubmit={joinForm.handleSubmit(onJoinSubmit)} className="space-y-4">
                    <FormField
                      control={joinForm.control}
                      name="inviteCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.groups.inviteCode}</FormLabel>
                          <FormControl>
                            <Input placeholder={t.groups.inviteCodePlaceholder} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={joinGroup.isPending}>
                      {joinGroup.isPending ? t.groups.joining : t.groups.joinGroup}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.groups.createGroup}</span>
                  <span className="sm:hidden">Create</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t.groups.createNewGroup}</DialogTitle>
                </DialogHeader>
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                    <FormField
                      control={createForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.groups.groupName}</FormLabel>
                          <FormControl>
                            <Input placeholder={t.groups.groupNamePlaceholder} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.groups.description}</FormLabel>
                          <FormControl>
                            <Input placeholder={t.groups.descriptionPlaceholder} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={createGroup.isPending}>
                      {createGroup.isPending ? t.groups.creating : t.groups.createGroup}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : groups && groups.length > 0 ? (
          <div className="flex flex-col gap-3">
            {groups.map(group => (
              <Link key={group.id} href={`/groups/${group.id}`}>
                <Card className="p-4 bg-card border-border hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-display font-bold text-base leading-tight truncate">{group.name}</h3>
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground shrink-0">
                          {group.inviteCode}
                        </span>
                      </div>
                      {group.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mb-1.5">{group.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {group.memberCount} {t.groups.members}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-center hidden sm:block">
                        <div className="flex items-center gap-1 text-accent">
                          <Trophy className="h-3.5 w-3.5" />
                          <span className="font-display font-bold text-lg leading-none">#{group.myRank}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{t.groups.rank}</p>
                      </div>
                      <div className="text-center sm:hidden">
                        <span className="font-display font-bold text-lg text-accent">#{group.myRank}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-xl border border-border flex flex-col items-center justify-center gap-4">
            <Users className="h-10 w-10 text-muted-foreground" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold">{t.groups.noGroups}</h3>
              <p className="text-muted-foreground text-sm">{t.groups.noGroupsDesc}</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
