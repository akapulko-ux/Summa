import { useState, useEffect } from "react";
import { useTranslations } from "@/hooks/use-translations";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, DownloadCloud, Upload, Trash2, RefreshCw, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import { ru } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Helmet } from 'react-helmet';

type BackupFile = {
  name: string;
  size: number;
  date: string;
};

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export default function BackupsPage() {
  const { t, language } = useTranslations();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  
  // Получение списка резервных копий
  const { data: backups, isLoading, isError } = useQuery<BackupFile[]>({
    queryKey: ["/api/backups/list"],
    refetchInterval: 60000, // Автоматическое обновление каждую минуту
  });
  
  // Создание новой резервной копии
  const createBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/backups/create");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: language === 'ru' ? "Резервная копия создана" : "Backup created",
        description: language === 'ru' ? "Резервная копия базы данных успешно создана" : "Database backup was successfully created",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/backups/list"] });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ru' ? "Ошибка создания резервной копии" : "Backup creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Восстановление из резервной копии
  const restoreBackupMutation = useMutation({
    mutationFn: async (filename: string) => {
      const response = await apiRequest("POST", `/api/backups/restore/${filename}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: language === 'ru' ? "База данных восстановлена" : "Database restored",
        description: language === 'ru' ? "База данных успешно восстановлена из резервной копии" : "Database was successfully restored from backup",
        variant: "default",
      });
      setSelectedBackup(null);
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      toast({
        title: language === 'ru' ? "Ошибка восстановления" : "Restore failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Удаление резервной копии
  const deleteBackupMutation = useMutation({
    mutationFn: async (filename: string) => {
      const response = await apiRequest("DELETE", `/api/backups/${filename}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: language === 'ru' ? "Резервная копия удалена" : "Backup deleted",
        description: language === 'ru' ? "Резервная копия успешно удалена" : "Backup file was successfully deleted",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/backups/list"] });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ru' ? "Ошибка удаления" : "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Очистка старых резервных копий
  const cleanBackupsMutation = useMutation({
    mutationFn: async (keepCount: number) => {
      const response = await apiRequest("POST", "/api/backups/clean", { keepCount });
      return response.json();
    },
    onSuccess: (data) => {
      const deletedCount = data.deletedFiles?.length || 0;
      toast({
        title: language === 'ru' ? "Резервные копии очищены" : "Backups cleaned",
        description: language === 'ru'
          ? `Удалено ${deletedCount} устаревших резервных копий`
          : `Removed ${deletedCount} old backup files`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/backups/list"] });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ru' ? "Ошибка очистки" : "Clean failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{language === 'ru' ? "Доступ запрещен" : "Access Denied"}</CardTitle>
            <CardDescription>
              {language === 'ru'
                ? "У вас нет прав для доступа к системе резервного копирования"
                : "You don't have permission to access the backup system"}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>{language === 'ru' ? "Резервное копирование | SaaSly" : "Backup Management | SaaSly"}</title>
      </Helmet>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t.backups.title}
            </h1>
            <p className="text-muted-foreground">
              {t.backups.manageBackups}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={() => createBackupMutation.mutate()}
                    disabled={createBackupMutation.isPending}
                  >
                    {createBackupMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <DownloadCloud className="mr-2 h-4 w-4" />
                    )}
                    {t.backups.createBackup}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {language === 'ru' 
                    ? "Создать новую резервную копию базы данных"
                    : "Create a new database backup"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline"
                    onClick={() => cleanBackupsMutation.mutate(5)}
                    disabled={cleanBackupsMutation.isPending}
                  >
                    {cleanBackupsMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Clock className="mr-2 h-4 w-4" />
                    )}
                    {t.backups.cleanOldBackups}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {language === 'ru' 
                    ? "Оставить только 5 последних резервных копий"
                    : "Keep only the last 5 backup files"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/backups/list"] })}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {language === 'ru' ? "Обновить список" : "Refresh"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {language === 'ru' ? "Обновить список" : "Refresh list"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <Separator />
        
        <Card>
          <CardHeader>
            <CardTitle>{t.backups.title}</CardTitle>
            <CardDescription>
              {t.backups.manageBackups}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="text-center py-8 text-muted-foreground">
                {t.common.error}
              </div>
            ) : !backups || backups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t.backups.noBackups}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.backups.backupName}</TableHead>
                      <TableHead>{language === 'ru' ? "Тип" : "Type"}</TableHead>
                      <TableHead>{t.backups.backupSize}</TableHead>
                      <TableHead>{t.backups.backupDate}</TableHead>
                      <TableHead className="text-right">{language === 'ru' ? "Действия" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backups.map((backup) => {
                      const date = new Date(backup.date);
                      const isManual = backup.name.startsWith('manual');
                      
                      return (
                        <TableRow key={backup.name}>
                          <TableCell className="font-medium truncate max-w-xs">
                            {backup.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant={isManual ? "default" : "secondary"}>
                              {isManual 
                                ? (language === 'ru' ? "Ручной" : "Manual") 
                                : (language === 'ru' ? "Авто" : "Auto")}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatBytes(backup.size)}</TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger className="cursor-help">
                                  {formatDistanceToNow(date, { 
                                    addSuffix: true,
                                    locale: language === 'ru' ? ru : undefined
                                  })}
                                </TooltipTrigger>
                                <TooltipContent>
                                  {format(date, language === 'ru' ? 'dd MMMM yyyy, HH:mm:ss' : 'MMM dd, yyyy HH:mm:ss', {
                                    locale: language === 'ru' ? ru : undefined
                                  })}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedBackup(backup.name)}
                                  >
                                    <Upload className="h-4 w-4 mr-1" />
                                    {t.common.restore}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {t.backups.restoreBackup}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t.backups.confirmRestore}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      {t.common.cancel}
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => {
                                        if (selectedBackup) {
                                          restoreBackupMutation.mutate(selectedBackup);
                                        }
                                      }}
                                      disabled={restoreBackupMutation.isPending}
                                    >
                                      {restoreBackupMutation.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      )}
                                      {t.common.restore}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => setSelectedBackup(backup.name)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">
                                      {t.common.delete}
                                    </span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {t.backups.deleteBackup}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t.backups.confirmDelete}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      {t.common.cancel}
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => {
                                        if (selectedBackup) {
                                          deleteBackupMutation.mutate(selectedBackup);
                                        }
                                      }}
                                      disabled={deleteBackupMutation.isPending}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      {deleteBackupMutation.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      )}
                                      {t.common.delete}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>{t.common.information}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-1">
                {language === 'ru' ? "Автоматическое резервное копирование" : "Automatic Backup"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'ru'
                  ? "Система автоматически создает резервные копии базы данных каждые 24 часа в производственной среде."
                  : "The system automatically creates database backups every 24 hours in production environment."}
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">
                {language === 'ru' ? "Хранение резервных копий" : "Backup Storage"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'ru'
                  ? "Резервные копии хранятся в директории на сервере. Рекомендуется периодически скачивать важные резервные копии для внешнего хранения."
                  : "Backup files are stored in a directory on the server. It is recommended to periodically download important backups for external storage."}
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">
                {language === 'ru' ? "Очистка старых копий" : "Cleaning Old Backups"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'ru'
                  ? "Функция очистки оставляет только 5 последних резервных копий для экономии места на диске."
                  : "The cleaning function keeps only the last 5 backup files to save disk space."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}