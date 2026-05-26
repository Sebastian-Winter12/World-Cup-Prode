import { useGetMe, useUpdateMe } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { format } from "date-fns";

const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30),
  avatarUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useGetMe();
  const updateMe = useUpdateMe();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: "", avatarUrl: "" },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username,
        avatarUrl: user.avatarUrl ?? "",
      });
    }
  }, [user, form]);

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    updateMe.mutate({ data: {
      username: values.username,
      avatarUrl: values.avatarUrl || undefined
    } }, {
      onSuccess: () => {
        toast({ title: "Profile updated successfully" });
        queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      },
      onError: () => {
        toast({ title: "Failed to update profile", variant: "destructive" });
      }
    });
  };

  if (isLoading || !user) {
    return (
      <Layout>
        <div className="p-6 md:p-10 max-w-2xl mx-auto w-full space-y-8">
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 md:p-10 max-w-2xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">
            Profile Settings
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage your personal information and avatar.
          </p>
        </div>

        <Card className="p-8 bg-card border-border">
          <div className="flex items-center gap-6 mb-8">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={user.avatarUrl ?? ""} />
              <AvatarFallback className="text-2xl">{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{user.username}</h2>
              <p className="text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-1">Joined {format(new Date(user.createdAt), "MMMM yyyy")}</p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/avatar.png" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={updateMe.isPending} className="w-full sm:w-auto">
                {updateMe.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Form>
        </Card>
      </div>
    </Layout>
  );
}
