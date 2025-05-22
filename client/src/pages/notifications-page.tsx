import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from '@/hooks/use-translations';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Bell, Edit2, Send, History, Save, RefreshCw, Play, Plus } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface NotificationTemplate {
  id: number;
  triggerType: string;
  title: string;
  template: string;
  messageRu: string;
  messageEn: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotificationLog {
  log: {
    id: number;
    subscriptionId: number;
    triggerType: string;
    message: string;
    sentAt: string;
    status: string; // 'sent', 'failed', 'pending'
    errorMessage?: string;
  };
  subscription: {
    id: number;
    title: string;
  } | null;
  service: {
    title: string;
  } | null;
  user: {
    name: string | null;
    email: string;
  } | null;
}

const triggerTypeNames: Record<string, { en: string; ru: string }> = {
  month_before: { en: "1 Month Before", ru: "За месяц" },
  two_weeks_before: { en: "2 Weeks Before", ru: "За 2 недели" },
  ten_days_before: { en: "10 Days Before", ru: "За 10 дней" },
  week_before: { en: "1 Week Before", ru: "За неделю" },
  three_days_before: { en: "3 Days Before", ru: "За 3 дня" },
  day_before: { en: "1 Day Before", ru: "За день" },
  expiry_day: { en: "Expiry Day", ru: "День окончания" },
  renewed: { en: "Renewed", ru: "Продлено" }
};

export default function NotificationsPage() {
  const { t, language } = useTranslations();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<string>('');

  // Загрузка шаблонов уведомлений
  const { data: rawTemplates, isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/notification-templates']
  });

  // Преобразование шаблонов с парсингом JSON
  const templates = rawTemplates?.map((template: any) => {
    let messageRu = '';
    let messageEn = '';
    
    try {
      const parsedTemplate = JSON.parse(template.template);
      messageRu = parsedTemplate.ru || '';
      messageEn = parsedTemplate.en || '';
    } catch (e) {
      // Если template не JSON, используем как есть
      messageRu = template.template || '';
      messageEn = template.template || '';
    }
    
    return {
      ...template,
      messageRu,
      messageEn
    };
  });

  // Загрузка логов уведомлений
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['/api/notification-logs']
  });

  // Загрузка списка подписок для тестирования
  const { data: subscriptionsData } = useQuery({
    queryKey: ['/api/subscriptions/all']
  });

  // Мутация для обновления шаблона
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<NotificationTemplate> }) =>
      apiRequest(`/api/notification-templates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notification-templates'] });
      toast({
        title: language === 'ru' ? "Успешно" : "Success",
        description: language === 'ru' ? "Шаблон обновлен" : "Template updated"
      });
      setIsDialogOpen(false);
      setEditingTemplate(null);
    },
    onError: () => {
      toast({
        title: language === 'ru' ? "Ошибка" : "Error",
        description: language === 'ru' ? "Не удалось обновить шаблон" : "Failed to update template",
        variant: "destructive"
      });
    }
  });

  // Мутация для создания нового шаблона
  const createTemplateMutation = useMutation({
    mutationFn: (data: { triggerType: string; title: string; messageRu: string; messageEn: string; isActive: boolean }) => {
      const payload = {
        triggerType: data.triggerType,
        title: data.title,
        template: JSON.stringify({
          ru: data.messageRu,
          en: data.messageEn
        }),
        isActive: data.isActive
      };
      console.log('Отправляем данные на сервер:', payload);
      return apiRequest('POST', '/api/notification-templates', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notification-templates'] });
      toast({
        title: language === 'ru' ? "Успешно" : "Success",
        description: language === 'ru' ? "Шаблон создан" : "Template created"
      });
      setIsDialogOpen(false);
      setEditingTemplate(null);
    },
    onError: () => {
      toast({
        title: language === 'ru' ? "Ошибка" : "Error",
        description: language === 'ru' ? "Не удалось создать шаблон" : "Failed to create template",
        variant: "destructive"
      });
    }
  });

  // Мутация для тестовой отправки
  const testNotificationMutation = useMutation({
    mutationFn: async (data: { subscriptionId: number; triggerType: string }) => {
      const response = await apiRequest('POST', '/api/notification-test', data);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/notification-logs'] });
      toast({
        title: language === 'ru' ? "Уведомление отправлено" : "Notification Sent",
        description: data.success 
          ? (language === 'ru' ? "Тестовое уведомление успешно отправлено" : "Test notification sent successfully")
          : (language === 'ru' ? "Не удалось отправить уведомление" : "Failed to send notification"),
        variant: data.success ? "default" : "destructive"
      });
      setTestDialogOpen(false);
      setSelectedSubscription('');
    },
    onError: () => {
      toast({
        title: language === 'ru' ? "Ошибка" : "Error",
        description: language === 'ru' ? "Не удалось отправить тестовое уведомление" : "Failed to send test notification",
        variant: "destructive"
      });
    }
  });

  // Мутация для ручного запуска проверки автоматических уведомлений
  const manualCheckMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/notification-check', {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notification-logs'] });
      toast({
        title: language === 'ru' ? "Успешно" : "Success",
        description: language === 'ru' ? "Проверка автоматических уведомлений выполнена" : "Automatic notification check completed"
      });
    },
    onError: () => {
      toast({
        title: language === 'ru' ? "Ошибка" : "Error",
        description: language === 'ru' ? "Не удалось запустить проверку уведомлений" : "Failed to run notification check",
        variant: "destructive"
      });
    }
  });

  const handleEditTemplate = (template: NotificationTemplate) => {
    setEditingTemplate({...template});
    setIsDialogOpen(true);
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate) return;
    
    // Проверяем обязательные поля
    if (!editingTemplate.title.trim()) {
      toast({
        title: language === 'ru' ? "Ошибка" : "Error",
        description: language === 'ru' ? "Пожалуйста, введите название шаблона" : "Please enter template title",
        variant: "destructive"
      });
      return;
    }
    
    if (!editingTemplate.messageRu.trim() && !editingTemplate.messageEn.trim()) {
      toast({
        title: language === 'ru' ? "Ошибка" : "Error",
        description: language === 'ru' ? "Пожалуйста, введите текст хотя бы для одного языка" : "Please enter message text for at least one language",
        variant: "destructive"
      });
      return;
    }
    
    if (editingTemplate.id === 0) {
      // Создание нового шаблона
      createTemplateMutation.mutate({
        triggerType: editingTemplate.triggerType,
        title: editingTemplate.title,
        messageRu: editingTemplate.messageRu,
        messageEn: editingTemplate.messageEn,
        isActive: editingTemplate.isActive
      });
    } else {
      // Обновление существующего шаблона
      updateTemplateMutation.mutate({
        id: editingTemplate.id,
        data: {
          title: editingTemplate.title,
          template: JSON.stringify({
            ru: editingTemplate.messageRu,
            en: editingTemplate.messageEn
          }),
          isActive: editingTemplate.isActive
        }
      });
    }
  };

  const handleTestTemplate = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setTestDialogOpen(true);
  };

  const handleSendTestNotification = () => {
    if (!selectedTemplate || !selectedSubscription) return;
    
    testNotificationMutation.mutate({
      subscriptionId: parseInt(selectedSubscription),
      triggerType: selectedTemplate.triggerType
    });
  };

  if (templatesLoading) {
    return (
      <AppLayout title={language === 'ru' ? 'Управление уведомлениями' : 'Notification Management'}>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title={language === 'ru' ? 'Управление уведомлениями' : 'Notification Management'}
      actions={
        <div className="flex items-center gap-4">
          <Button
            onClick={() => manualCheckMutation.mutate()}
            disabled={manualCheckMutation.isPending}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {manualCheckMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            {language === 'ru' ? 'Проверить уведомления' : 'Check Notifications'}
          </Button>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              {language === 'ru' 
                ? 'Настройка Telegram уведомлений' 
                : 'Telegram notifications setup'
              }
            </span>
          </div>
        </div>
      }
    >
      <div className="space-y-6">

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates">
            {language === 'ru' ? 'Шаблоны' : 'Templates'}
          </TabsTrigger>
          <TabsTrigger value="logs">
            {language === 'ru' ? 'Логи отправки' : 'Delivery Logs'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {language === 'ru' ? 'Шаблоны уведомлений' : 'Notification Templates'}
            </h3>
            <Button
              onClick={() => {
                setEditingTemplate({
                  id: 0,
                  triggerType: 'week_before',
                  title: '',
                  template: '',
                  messageRu: '',
                  messageEn: '',
                  isActive: true,
                  createdAt: '',
                  updatedAt: ''
                });
                setIsDialogOpen(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {language === 'ru' ? 'Добавить шаблон' : 'Add Template'}
            </Button>
          </div>
          <div className="grid gap-4">
            {templates?.map((template: NotificationTemplate) => (
              <Card key={template.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-lg">
                      {triggerTypeNames[template.triggerType]?.[language] || template.triggerType}
                    </CardTitle>
                    <CardDescription>{template.title}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={template.isActive ? "default" : "secondary"}>
                      {template.isActive 
                        ? (language === 'ru' ? 'Активен' : 'Active')
                        : (language === 'ru' ? 'Неактивен' : 'Inactive')
                      }
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestTemplate(template)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {template.template}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          {logsLoading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {logsData?.logs?.map((logEntry: NotificationLog, index: number) => (
                <Card key={logEntry.log.id || index}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={logEntry.log.status === 'sent' ? "default" : logEntry.log.status === 'pending' ? "secondary" : "destructive"}>
                            {logEntry.log.status === 'sent' 
                              ? (language === 'ru' ? 'Отправлено' : 'Sent')
                              : logEntry.log.status === 'pending'
                              ? (language === 'ru' ? 'В процессе' : 'Pending')
                              : (language === 'ru' ? 'Ошибка' : 'Failed')
                            }
                          </Badge>
                          <span className="text-sm font-medium">
                            {triggerTypeNames[logEntry.log.triggerType]?.[language] || logEntry.log.triggerType}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {language === 'ru' ? 'Пользователь:' : 'User:'} {logEntry.user?.name || logEntry.user?.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {language === 'ru' ? 'Сервис:' : 'Service:'} {logEntry.service?.title}
                        </p>
                        {logEntry.log.status === 'failed' && logEntry.log.errorMessage && (
                          <p className="text-sm text-red-600">
                            {language === 'ru' ? 'Ошибка:' : 'Error:'} {logEntry.log.errorMessage}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {new Date(logEntry.log.sentAt).toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Диалог редактирования шаблона */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate?.id === 0 
                ? (language === 'ru' ? 'Создать шаблон' : 'Create Template')
                : (language === 'ru' ? 'Редактировать шаблон' : 'Edit Template')
              }
            </DialogTitle>
            <DialogDescription>
              {language === 'ru' 
                ? 'Измените содержимое и настройки шаблона уведомления'
                : 'Modify the content and settings of the notification template'
              }
            </DialogDescription>
          </DialogHeader>
          
          {editingTemplate && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  {language === 'ru' ? 'Название' : 'Title'}
                </Label>
                <Input
                  id="title"
                  value={editingTemplate.title}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    title: e.target.value
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template">
                  {language === 'ru' ? 'Шаблон сообщения' : 'Message Template'}
                </Label>
                <Textarea
                  id="template"
                  rows={6}
                  value={editingTemplate.template}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    template: e.target.value
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  {language === 'ru' 
                    ? 'Доступные переменные: {service_name}, {end_date}, {amount}, {user_name}'
                    : 'Available variables: {service_name}, {end_date}, {amount}, {user_name}'
                  }
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={editingTemplate.isActive}
                  onCheckedChange={(checked) => setEditingTemplate({
                    ...editingTemplate,
                    isActive: checked
                  })}
                />
                <Label htmlFor="active">
                  {language === 'ru' ? 'Активен' : 'Active'}
                </Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  {language === 'ru' ? 'Отмена' : 'Cancel'}
                </Button>
                <Button
                  onClick={handleSaveTemplate}
                  disabled={updateTemplateMutation.isPending}
                >
                  {updateTemplateMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {language === 'ru' ? 'Сохранить' : 'Save'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Диалог тестирования уведомлений */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === 'ru' ? 'Тестовое уведомление' : 'Test Notification'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ru' 
                ? 'Выберите подписку для тестирования шаблона уведомления'
                : 'Select a subscription to test the notification template'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTemplate && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-sm">
                  {language === 'ru' ? 'Шаблон:' : 'Template:'} {selectedTemplate.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {triggerTypeNames[selectedTemplate.triggerType]?.[language] || selectedTemplate.triggerType}
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'ru' ? 'Выберите подписку:' : 'Select subscription:'}
              </label>
              <select
                value={selectedSubscription}
                onChange={(e) => setSelectedSubscription(e.target.value)}
                className="w-full p-2 border rounded-md text-sm"
              >
                <option value="">
                  {language === 'ru' ? 'Выберите подписку...' : 'Select subscription...'}
                </option>
                {subscriptionsData?.map((subscription: any) => (
                  <option key={subscription.id} value={subscription.id}>
                    {subscription.serviceName || subscription.serviceTitle} - {subscription.userName} ({subscription.userEmail})
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setTestDialogOpen(false);
                setSelectedSubscription('');
              }}
            >
              {language === 'ru' ? 'Отмена' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleSendTestNotification}
              disabled={!selectedSubscription || testNotificationMutation.isPending}
            >
              {testNotificationMutation.isPending && (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              )}
              {language === 'ru' ? 'Отправить' : 'Send'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </AppLayout>
  );
}