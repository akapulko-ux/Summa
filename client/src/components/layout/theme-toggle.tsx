import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTranslations } from '@/hooks/use-translations';
import { useTheme } from "@/providers/theme-provider";

export function ThemeToggle() {
  const { t } = useTranslations();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={t.layout.toggleTheme}
      title={t.layout.toggleTheme}
      className="animate-fade-in"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 transition-all rotate-0 scale-100" />
      ) : (
        <Moon className="h-5 w-5 transition-all rotate-0 scale-100" />
      )}
    </Button>
  );
}