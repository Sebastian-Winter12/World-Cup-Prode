import { useState, useEffect } from "react";
import { useGetMe, useUpdateMe, useGetMyStats, useDeleteMe } from "@workspace/api-client-react";
import { useUser, useClerk } from "@clerk/react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useI18n } from "@/i18n/context";
import { useTheme, type Theme } from "@/contexts/theme-context";
import { ProdeAvatar, PRODE_AVATARS } from "@/components/prode-avatar";
import { Camera, ChevronDown, ChevronUp, Mail, Lock, Palette, Globe, Bell, LogOut, Trash2, Trophy, Target, Award, Activity, Users, TrendingUp } from "lucide-react";
import type { Language } from "@/i18n/translations";

const usernameSchema = z.object({
  username: z.string().min(3, "Minimum 3 characters").max(30, "Maximum 30 characters"),
});

function SettingSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="p-6 bg-card border-border">
      <h2 className="text-lg font-bold flex items-center gap-2 mb-5 text-foreground">
        {icon}
        {title}
      </h2>
      {children}
    </Card>
  );
}

export default function Profile() {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const { data: user, isLoading } = useGetMe();
  const { data: stats } = useGetMyStats();
  const updateMe = useUpdateMe();
  const deleteMe = useDeleteMe();

  const [showEditUsername, setShowEditUsername] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [pwChanging, setPwChanging] = useState(false);

  const usernameForm = useForm<z.infer<typeof usernameSchema>>({
    resolver: zodResolver(usernameSchema),
    defaultValues: { username: "" },
  });

  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");

  useEffect(() => {
    if (user) {
      usernameForm.reset({ username: user.username });
    }
  }, [user?.username]);

  const handleSaveUsername = (values: z.infer<typeof usernameSchema>) => {
    updateMe.mutate({ data: { username: values.username } }, {
      onSuccess: () => {
        toast({ title: t.profile.usernameUpdated });
        queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
        setShowEditUsername(false);
      },
      onError: () => {
        toast({ title: t.profile.failedUsername, variant: "destructive" });
      },
    });
  };

  const handleChangePassword = async () => {
    if (!clerkUser) return;
    if (pwNew !== pwConfirm) {
      toast({ title: t.profile.passwordMismatch, variant: "destructive" });
      return;
    }
    if (pwNew.length < 8) {
      toast({ title: t.profile.passwordTooShort, variant: "destructive" });
      return;
    }
    setPwChanging(true);
    try {
      await clerkUser.updatePassword({ currentPassword: pwCurrent, newPassword: pwNew });
      toast({ title: t.profile.passwordChanged });
      await signOut({ redirectUrl: basePath || "/" });
    } catch {
      toast({ title: t.profile.failedPassword, variant: "destructive" });
    } finally {
      setPwChanging(false);
    }
  };

  const handleSelectAvatar = (avatarId: string) => {
    updateMe.mutate({ data: { avatarUrl: `prode-avatar:${avatarId}` } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
        setAvatarOpen(false);
      },
    });
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    updateMe.mutate({ data: { theme: newTheme } });
  };

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    updateMe.mutate({ data: { language: newLang } });
  };

  const handleNotifChange = (field: string, value: boolean) => {
    updateMe.mutate({ data: { [field]: value } as any }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      },
    });
  };

  const handleDeleteAccount = () => {
    const confirmWord = lang === "es" ? "ELIMINAR" : "DELETE";
    if (deleteConfirm !== confirmWord) return;

    deleteMe.mutate(undefined, {
      onSuccess: async () => {
        toast({ title: t.profile.accountDeleted });
        await signOut({ redirectUrl: basePath || "/" });
      },
      onError: () => {
        toast({ title: t.profile.failedDelete, variant: "destructive" });
        setDeleteOpen(false);
      },
    });
  };

  if (isLoading || !user) {
    return (
      <Layout>
        <div className="p-6 md:p-10 max-w-2xl mx-auto w-full space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </Layout>
    );
  }

  const confirmWord = lang === "es" ? "ELIMINAR" : "DELETE";

  return (
    <Layout>
      <div className="p-6 md:p-10 max-w-2xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-1">
            {t.profile.title}
          </h1>
          <p className="text-muted-foreground text-lg">{t.profile.subtitle}</p>
        </div>

        {/* Profile Card */}
        <SettingSection title={t.profile.profileSection} icon={<Trophy className="h-5 w-5 text-accent" />}>
          <div className="flex items-start gap-5 mb-6">
            <div className="relative group cursor-pointer" onClick={() => setAvatarOpen(true)}>
              <ProdeAvatar avatarUrl={user.avatarUrl} username={user.username} size="xl" />
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold truncate">{user.username}</h2>
              <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm truncate">{user.email}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {t.profile.joined} {format(new Date(user.createdAt), "MMMM yyyy")}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1 italic">{t.profile.emailManagedByClerk}</p>
            </div>
          </div>

          {/* Edit Username */}
          <div className="border-t border-border pt-5">
            <button
              onClick={() => setShowEditUsername(v => !v)}
              className="flex items-center justify-between w-full text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                {t.profile.editUsername}
              </span>
              {showEditUsername ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showEditUsername && (
              <div className="mt-4">
                <Form {...usernameForm}>
                  <form onSubmit={usernameForm.handleSubmit(handleSaveUsername)} className="flex gap-3">
                    <FormField
                      control={usernameForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input {...field} placeholder={t.profile.username} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={updateMe.isPending}>
                      {updateMe.isPending ? t.profile.savingUsername : t.profile.saveUsername}
                    </Button>
                  </form>
                </Form>
              </div>
            )}
          </div>

          {/* Change Password */}
          <div className="border-t border-border pt-5 mt-5">
            <button
              onClick={() => setShowChangePassword(v => !v)}
              className="flex items-center justify-between w-full text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                {t.profile.changePassword}
              </span>
              {showChangePassword ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showChangePassword && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-sm font-medium block mb-1.5">{t.profile.currentPassword}</label>
                  <Input
                    type="password"
                    value={pwCurrent}
                    onChange={e => setPwCurrent(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{t.profile.newPassword}</label>
                  <Input
                    type="password"
                    value={pwNew}
                    onChange={e => setPwNew(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{t.profile.confirmNewPassword}</label>
                  <Input
                    type="password"
                    value={pwConfirm}
                    onChange={e => setPwConfirm(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={pwChanging || !pwCurrent || !pwNew || !pwConfirm}
                  className="w-full"
                >
                  {pwChanging ? t.profile.changingPassword : t.profile.changePasswordBtn}
                </Button>
              </div>
            )}
          </div>
        </SettingSection>

        {/* Statistics */}
        <SettingSection title={t.profile.stats} icon={<TrendingUp className="h-5 w-5 text-primary" />}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: t.profile.statsPredictions, value: stats?.predictionsCount ?? 0, icon: <Activity className="h-4 w-4 text-purple-400" /> },
              { label: t.profile.statsCorrectWinners, value: stats?.correctWinners ?? 0, icon: <Award className="h-4 w-4 text-blue-400" /> },
              { label: t.profile.statsExactScores, value: stats?.exactScores ?? 0, icon: <Target className="h-4 w-4 text-primary" /> },
              { label: t.profile.statsTotalPoints, value: stats?.totalPoints ?? 0, icon: <Trophy className="h-4 w-4 text-accent" /> },
              { label: t.profile.statsAvgPoints, value: stats?.avgPointsPerPrediction ?? 0, icon: <TrendingUp className="h-4 w-4 text-green-400" /> },
              { label: t.profile.statsGroups, value: stats?.groupsCount ?? 0, icon: <Users className="h-4 w-4 text-muted-foreground" /> },
            ].map(stat => (
              <div key={stat.label} className="bg-muted/50 rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider leading-tight">{stat.label}</span>
                  {stat.icon}
                </div>
                <span className="text-3xl font-display font-bold">{stat.value}</span>
              </div>
            ))}
          </div>
        </SettingSection>

        {/* Appearance */}
        <SettingSection title={t.profile.appearance} icon={<Palette className="h-5 w-5 text-blue-400" />}>
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium block mb-3">{t.profile.theme}</label>
              <div className="flex gap-2">
                {([
                  { value: "light", label: t.profile.themeLight },
                  { value: "dark", label: t.profile.themeDark },
                  { value: "system", label: t.profile.themeSystem },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleThemeChange(opt.value)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                      theme === opt.value
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-muted text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-5">
              <label className="text-sm font-medium block mb-3">{t.profile.language}</label>
              <div className="flex gap-2">
                {([
                  { value: "es" as Language, label: t.profile.languageEs },
                  { value: "en" as Language, label: t.profile.languageEn },
                ]).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleLanguageChange(opt.value)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                      lang === opt.value
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-muted text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SettingSection>

        {/* Notifications */}
        <SettingSection title={t.profile.notifications} icon={<Bell className="h-5 w-5 text-yellow-400" />}>
          <div className="space-y-4">
            {[
              { label: t.profile.notifMatchReminders, field: "notifMatchReminders", value: user.notifMatchReminders },
              { label: t.profile.notifGroupActivity, field: "notifGroupActivity", value: user.notifGroupActivity },
              { label: t.profile.notifLeaderboard, field: "notifLeaderboard", value: user.notifLeaderboard },
              { label: t.profile.notifAnnouncements, field: "notifAnnouncements", value: user.notifAnnouncements },
            ].map(notif => (
              <div key={notif.field} className="flex items-center justify-between">
                <label className="text-sm font-medium cursor-pointer" htmlFor={notif.field}>
                  {notif.label}
                </label>
                <Switch
                  id={notif.field}
                  checked={notif.value}
                  onCheckedChange={(checked) => handleNotifChange(notif.field, checked)}
                />
              </div>
            ))}
          </div>
        </SettingSection>

        {/* Account */}
        <SettingSection title={t.profile.account} icon={<LogOut className="h-5 w-5 text-muted-foreground" />}>
          <div className="space-y-3">
            <Button
              variant="secondary"
              className="w-full justify-start gap-3"
              onClick={() => signOut({ redirectUrl: basePath || "/" })}
            >
              <LogOut className="h-4 w-4" />
              {t.profile.signOut}
            </Button>

            <div className="pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">{t.profile.deleteAccountDesc}</p>
              <Button
                variant="destructive"
                className="w-full justify-start gap-3"
                onClick={() => { setDeleteConfirm(""); setDeleteOpen(true); }}
              >
                <Trash2 className="h-4 w-4" />
                {t.profile.deleteAccount}
              </Button>
            </div>
          </div>
        </SettingSection>
      </div>

      {/* Avatar Gallery Dialog */}
      <Dialog open={avatarOpen} onOpenChange={setAvatarOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.profile.chooseAvatar}</DialogTitle>
            <p className="text-sm text-muted-foreground">{t.profile.chooseAvatarDesc}</p>
          </DialogHeader>
          <div className="grid grid-cols-6 gap-3 py-2">
            {PRODE_AVATARS.map(avatar => {
              const isSelected = user.avatarUrl === `prode-avatar:${avatar.id}`;
              return (
                <button
                  key={avatar.id}
                  onClick={() => handleSelectAvatar(avatar.id)}
                  className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition-all hover:scale-110 ${
                    isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105" : ""
                  }`}
                  style={{ background: avatar.bg }}
                  title={avatar.id}
                >
                  {avatar.emoji}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">{t.profile.deleteAccountConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.profile.deleteAccountConfirmDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Input
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder={t.profile.deleteAccountConfirmPlaceholder}
              className="border-destructive/50 focus-visible:ring-destructive"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== confirmWord || deleteMe.isPending}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {deleteMe.isPending ? t.profile.deleting : t.profile.deleteAccountBtn}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
