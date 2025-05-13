import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  CheckCircle, 
  MessageCircle, 
  Link as LinkIcon, 
  RefreshCw, 
  Loader2, 
  BellRing,
  LogOut,
  AlertTriangle,
  Copy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from '@/hooks/use-translations';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function TelegramConnect() {
  const { t } = useTranslations();
  const { toast } = useToast();
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Получение статуса подключения Telegram
  const { data: telegramStatus, isLoading } = useQuery({
    queryKey: ['/api/telegram/status'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/telegram/status');
      return res.json();
    },
  });

  // Мутация для генерации кода привязки
  const generateLinkMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/telegram/generate-link-code');
      return res.json();
    },
    onSuccess: (data) => {
      setLinkCode(data.linkCode);
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Мутация для отправки тестового уведомления
  const sendTestNotificationMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/telegram/send-self-test');
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: t('telegram.testNotificationSent'),
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Мутация для отключения Telegram
  const disconnectTelegramMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/telegram/disconnect');
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: t('telegram.disconnected'),
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/telegram/status'] });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Генерация кода привязки
  const handleGenerateLink = () => {
    generateLinkMutation.mutate();
  };

  // Отправка тестового уведомления
  const handleSendTestNotification = () => {
    sendTestNotificationMutation.mutate();
  };
  
  // Отключение Telegram
  const handleDisconnect = () => {
    disconnectTelegramMutation.mutate();
  };

  // Проверка статуса подключения
  const handleRefreshStatus = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/telegram/status'] });
  };

  // Отображение инструкций для привязки
  const renderLinkInstructions = () => {
    if (!linkCode) return null;

    // Функция для копирования команды в буфер обмена
    const copyCommand = () => {
      navigator.clipboard.writeText(`/link ${linkCode}`);
      toast({
        title: t('common.copied'),
        description: t('telegram.commandCopied'),
      });
    };

    return (
      <Alert className="mt-4">
        <AlertTitle className="font-semibold">{t('telegram.linkInstructions')}</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-2">1. {t('telegram.openBot')}: <a href="https://t.me/saasly_bot" target="_blank" rel="noopener noreferrer" className="text-primary underline">@saasly_bot</a></p>
          <p className="mb-2 flex items-center">
            2. {t('telegram.sendCommand')}: 
            <code className="bg-muted px-2 py-1 rounded ml-1 mr-1">/link {linkCode}</code>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 p-0 hover:bg-muted" 
              onClick={copyCommand}
              title={t('common.copy')}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </p>
          <p>{t('telegram.afterLink')}</p>
        </AlertDescription>
      </Alert>
    );
  };
  
  // Диалог подтверждения отключения
  const renderDisconnectDialog = () => {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full mt-4 bg-destructive/5 text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={disconnectTelegramMutation.isPending}
          >
            {disconnectTelegramMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            {t('telegram.disconnect')}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t('telegram.confirmDisconnect')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('telegram.disconnectWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDisconnect}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('telegram.disconnect')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  // Пока загружаются данные, показываем спиннер
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('telegram.title')}</CardTitle>
          <CardDescription>{t('telegram.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          {t('telegram.title')}
        </CardTitle>
        <CardDescription>{t('telegram.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {telegramStatus?.connected ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              <span className="text-lg font-medium">{t('telegram.connected')}</span>
            </div>
            
            <p className="text-center text-muted-foreground mb-2">
              {t('telegram.receiveNotifications')}
            </p>
            
            {/* Кнопка отправки тестового уведомления */}
            <Button 
              onClick={handleSendTestNotification}
              variant="secondary"
              className="w-full"
              disabled={sendTestNotificationMutation.isPending}
            >
              {sendTestNotificationMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <BellRing className="mr-2 h-4 w-4" />
              )}
              {t('telegram.sendTestNotification')}
            </Button>
            
            {/* Кнопка отключения с диалогом подтверждения */}
            <div className="w-full">
              {renderDisconnectDialog()}
            </div>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            <p className="text-center text-muted-foreground mb-2">
              {t('telegram.notConnected')}
            </p>
            <Button 
              onClick={handleGenerateLink} 
              className="w-full"
              disabled={generateLinkMutation.isPending}
            >
              {generateLinkMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LinkIcon className="mr-2 h-4 w-4" />
              )}
              {t('telegram.generateLink')}
            </Button>
            
            {renderLinkInstructions()}
            
            <div className="text-center mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefreshStatus}
                disabled={generateLinkMutation.isPending}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('common.refresh') || "Refresh"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}