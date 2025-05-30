import { ReactNode } from 'react';
import Layout from '@/components/layout/layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { useTranslations } from '@/hooks/use-translations';

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  backUrl?: string;
  actions?: ReactNode;
}

export function AppLayout({ children, title, backUrl, actions }: AppLayoutProps) {
  const { t } = useTranslations();
  
  return (
    <Layout>
      <div className="container py-4 md:py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center">
            {backUrl && (
              <Button
                variant="ghost"
                size="icon"
                className="mr-2"
                asChild
              >
                <Link href={backUrl}>
                  <ArrowLeft className="h-5 w-5" />
                  <span className="sr-only">{t('common.back')}</span>
                </Link>
              </Button>
            )}
            <h1 className="text-2xl md:text-3xl font-bold ml-1" style={{ height: "1.2em", lineHeight: "1.2" }}>{title}</h1>
          </div>
          {actions && (
            <div className="mt-3 md:mt-0 space-x-2 flex flex-wrap gap-2">
              {actions}
            </div>
          )}
        </div>
        
        {children}
      </div>
    </Layout>
  );
}