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

const createGroupSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  description: z.string().max(200).optional(),
});

const joinGroupSchema = z.object({
  inviteCode: z.string().min(1, "Invite code is required"),
});

export default function Groups() {
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
        toast({ title: "Group created successfully" });
        queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
        setIsCreateOpen(false);
        createForm.reset();
      },
      onError: (err) => {
        toast({ title: "Failed to create group", variant: "destructive" });
      }
    });
  };

  const onJoinSubmit = (values: z.infer<typeof joinGroupSchema>) => {
    joinGroup.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Joined group successfully" });
        queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
        setIsJoinOpen(false);
        joinForm.reset();
      },
      onError: (err) => {
        toast({ title: "Failed to join group", description: "Invalid code or already joined", variant: "destructive" });
      }
    });
  };

  return (
    <Layout>
      <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">
              My Groups
            </h1>
            <p className="text-muted-foreground text-lg">
              Compete with friends, family, and colleagues.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="gap-2">
                  <Hash className="h-4 w-4" /> Join via Code
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join a Group</DialogTitle>
                </DialogHeader>
                <Form {...joinForm}>
                  <form onSubmit={joinForm.handleSubmit(onJoinSubmit)} className="space-y-4">
                    <FormField
                      control={joinForm.control}
                      name="inviteCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invite Code</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter 6-digit code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={joinGroup.isPending}>
                      {joinGroup.isPending ? "Joining..." : "Join Group"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> Create Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a New Group</DialogTitle>
                </DialogHeader>
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                    <FormField
                      control={createForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Group Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Office Pool" {...field} />
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
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="A few words about this group" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={createGroup.isPending}>
                      {createGroup.isPending ? "Creating..." : "Create Group"}
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
                      Code: {group.inviteCode}
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
                      <span>{group.memberCount} members</span>
                    </div>
                    <div className="text-sm font-medium">
                      Rank: <span className="text-accent">#{group.myRank}</span>
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
              <h3 className="text-xl font-bold">No Groups Yet</h3>
              <p className="text-muted-foreground">Join an existing group or create a new one to start competing.</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
