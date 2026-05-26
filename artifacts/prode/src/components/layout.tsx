import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Trophy, Home, Users, UserCircle, LogOut, Menu } from "lucide-react";
import { useClerk } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useI18n } from "@/i18n/context";
import { useTheme } from "@/contexts/theme-context";
import { useGetMe } from "@workspace/api-client-react";
import type { Language } from "@/i18n/translations";
import type { Theme } from "@/contexts/theme-context";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { t, setLang } = useI18n();
  const { setTheme } = useTheme();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const { data: user } = useGetMe();

  useEffect(() => {
    if (user) {
      const dbLang = user.language as Language;
      if (dbLang === "en" || dbLang === "es") setLang(dbLang);
      const dbTheme = user.theme as Theme;
      if (dbTheme === "light" || dbTheme === "dark" || dbTheme === "system") setTheme(dbTheme);
    }
  }, [user?.language, user?.theme]);

  const navItems = [
    { href: "/dashboard", label: t.nav.dashboard, icon: Home },
    { href: "/matches", label: t.nav.matches, icon: Trophy },
    { href: "/groups", label: t.nav.groups, icon: Users },
    { href: "/profile", label: t.nav.profile, icon: UserCircle },
  ];

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const isActive = location === item.href || location.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href}>
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </div>
          </Link>
        );
      })}
      <button
        onClick={() => signOut({ redirectUrl: basePath || "/" })}
        className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-destructive hover:bg-destructive/10 w-full mt-auto"
      >
        <LogOut className="h-5 w-5" />
        {t.nav.signOut}
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <header className="md:hidden flex items-center justify-between p-4 border-b bg-card sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          <span className="font-display font-bold text-lg tracking-tight">PRODE 26</span>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] sm:w-[320px] p-6 flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-8 px-4">
              <Trophy className="h-8 w-8 text-primary" />
              <span className="font-display font-bold text-2xl tracking-tight">PRODE 26</span>
            </div>
            <NavLinks />
          </SheetContent>
        </Sheet>
      </header>

      <aside className="hidden md:flex flex-col w-64 border-r bg-card min-h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3 mb-6">
          <Trophy className="h-8 w-8 text-primary" />
          <span className="font-display font-bold text-2xl tracking-tight text-foreground">PRODE 26</span>
        </div>
        <nav className="flex-1 px-4 space-y-2 flex flex-col">
          <NavLinks />
        </nav>
      </aside>

      <main className="flex-1 flex flex-col w-full max-w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
