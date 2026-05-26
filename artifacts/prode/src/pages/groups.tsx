import { useState } from "react";
import { Link } from "wouter";
import { useListMyGroups, useCreateGroup, useJoinGroup } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Plus, Hash } from "lucide-react";
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
      <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">
              {t.groups.title}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t.groups.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="gap-2">
                  <Hash className="h-4 w-4" /> {t.groups.joinViaCode}
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
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> {t.groups.createGroup}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}
          </div>
        ) : groups && groups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map(group => (
              <Link key={group.id} href={`/groups/${group.id}`}>
                <Card className="p-6 bg-card border-border hover:border-primary/50 transition-colors cursor-pointer flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-display font-bold text-xl">{group.name}</h3>
                    <div className="bg-muted px-2 py-1 rounded text-xs font-mono font-medium">
                      {t.groups.code}: {group.inviteCode}
                    </div>
                  </div>
                  {group.description && (
                    <p className="text-muted-foreground text-sm mb-6 flex-1 line-clamp-2">
                      {group.description}
                    </p>
                  )}
                  <div className="flex justify-between items-center mt-auto pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{group.memberCount} {t.groups.rank === "Rank" ? "members" : "miembros"}</span>
                    </div>
                    <div className="text-sm font-medium">
                      {t.groups.rank}: <span className="text-accent">#{group.myRank}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-xl border border-border flex flex-col items-center justify-center gap-4">
            <Users className="h-12 w-12 text-muted-foreground" />
            <div className="space-y-1">
              <h3 className="text-xl font-bold">{t.groups.noGroups}</h3>
              <p className="text-muted-foreground">{t.groups.noGroupsDesc}</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
