import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/i18n/context";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  onBack?: () => void;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, backHref, onBack, action }: PageHeaderProps) {
  const [, setLocation] = useLocation();
  const { t } = useI18n();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backHref) {
      setLocation(backHref);
    } else {
      window.history.back();
    }
  };

  return (
    <div className="mb-6">
      {(backHref !== undefined || onBack) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mb-3 gap-1.5 text-muted-foreground hover:text-foreground -ml-2 h-8"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline text-sm font-medium">{t.common.back}</span>
        </Button>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted-foreground mt-1 text-sm md:text-base">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
