import { useState, useRef } from "react";
import { useTranslations } from "@/hooks/use-translations";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, DownloadCloud, Upload, Trash2, RefreshCw, Clock, Info, FileUp, Cog } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import { ru } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Helmet } from 'react-helmet';
import { AppLayout } from '@/components/layout/app-layout';
import { 
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

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

// Расширенный тип структуры резервной копии
type BackupFileExtended = {
  name: string;
  size: number;
  date: Date;
  type: string; // manual, auto, pre-restore, imported, unknown
  format: string; // plain, custom, directory, tar, compressed, unknown
  tables?: string[];
  schemas?: string[];
};

// Компонент для отображения метаданных о бэкапе
function BackupMetadataDialog({ backupName }: { backupName: string }) {
  const { language } = useTranslations();
  const { toast } = useToast();
  const [metadata, setMetadata] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMetadata = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/backups/metadata/${backupName}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setMetadata(data);
    } catch (error: any) {
      toast({
        title: language === 'ru' ? "Ошибка получения метаданных" : "Error fetching metadata",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" onClick={fetchMetadata}>
          <Info className="h-4 w-4" />
          <span className="sr-only">
            {language === 'ru' ? "Информация" : "Info"}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {language === 'ru' ? "Информация о резервной копии" : "Backup Information"}
          </DialogTitle>
          <DialogDescription>
            {language === 'ru' 
              ? "Детальная информация о резервной копии базы данных"
              : "Detailed information about the database backup"}
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : metadata ? (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium">
                {language === 'ru' ? "Имя файла" : "Filename"}
              </h4>
              <p className="text-sm text-muted-foreground break-all">{metadata.name}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium">
                  {language === 'ru' ? "Размер" : "Size"}
                </h4>
                <p className="text-sm text-muted-foreground">{formatBytes(metadata.size)}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium">
                  {language === 'ru' ? "Тип" : "Type"}
                </h4>
                <p className="text-sm text-muted-foreground">
                  <Badge variant="outline">
                    {metadata.type === 'manual' 
                      ? (language === 'ru' ? "Ручной" : "Manual") 
                      : metadata.type === 'auto'
                        ? (language === 'ru' ? "Авто" : "Auto")
                        : metadata.type === 'pre-restore'
                          ? (language === 'ru' ? "Пред-восстановление" : "Pre-restore")
                          : metadata.type === 'imported'
                            ? (language === 'ru' ? "Импортированный" : "Imported")
                            : (language === 'ru' ? "Неизвестный" : "Unknown")}
                  </Badge>
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium">
                  {language === 'ru' ? "Формат" : "Format"}
                </h4>
                <p className="text-sm text-muted-foreground">{metadata.format}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium">
                  {language === 'ru' ? "Дата создания" : "Created"}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(metadata.created), language === 'ru' ? 'dd MMMM yyyy, HH:mm:ss' : 'MMM dd, yyyy HH:mm:ss', {
                    locale: language === 'ru' ? ru : undefined
                  })}
                </p>
              </div>
            </div>
            
            {metadata.tables && metadata.tables.length > 0 && (
              <div>
                <h4 className="text-sm font-medium">
                  {language === 'ru' ? "Таблицы" : "Tables"}
                </h4>
                <div className="flex flex-wrap gap-1 mt-1">
                  {metadata.tables.slice(0, 10).map((table: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {table}
                    </Badge>
                  ))}
                  {metadata.tables.length > 10 && (
                    <Badge variant="secondary">
                      +{metadata.tables.length - 10} {language === 'ru' ? "еще" : "more"}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            {metadata.schemas && metadata.schemas.length > 0 && (
              <div>
                <h4 className="text-sm font-medium">
                  {language === 'ru' ? "Схемы" : "Schemas"}
                </h4>
                <div className="flex flex-wrap gap-1 mt-1">
                  {metadata.schemas.map((schema: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {schema}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {metadata.comment && (
              <div>
                <h4 className="text-sm font-medium">
                  {language === 'ru' ? "Комментарий" : "Comment"}
                </h4>
                <p className="text-sm text-muted-foreground">{metadata.comment}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            {language === 'ru' 
              ? "Нет данных о резервной копии"
              : "No backup metadata available"}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Компонент для загрузки файла резервной копии
function UploadBackupDialog() {
  const { t, language } = useTranslations();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [prefixName, setPrefixName] = useState('imported');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: language === 'ru' ? "Файл не выбран" : "No file selected",
        description: language === 'ru'
          ? "Пожалуйста, выберите файл для загрузки"
          : "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    // Проверка расширения файла
    const validExtensions = ['.sql', '.dump', '.dir', '.tar', '.zip'];
    const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(fileExtension)) {
      toast({
        title: language === 'ru' ? "Неподдерживаемый формат файла" : "Unsupported file format",
        description: language === 'ru'
          ? `Допустимые форматы: ${validExtensions.join(', ')}`
          : `Allowed formats: ${validExtensions.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('backupFile', selectedFile);
      formData.append('prefixName', prefixName);

      const response = await fetch('/api/backups/upload', {
        method: 'POST',
        body: formData,
        // Не передаем заголовок Content-Type, браузер установит его с правильным boundary
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();
      
      toast({
        title: language === 'ru' ? "Файл загружен успешно" : "File uploaded successfully",
        description: language === 'ru'
          ? `Файл бэкапа импортирован как ${data.backupFileName}`
          : `Backup file imported as ${data.backupFileName}`,
        variant: "default",
      });
      
      // Очищаем состояние
      setSelectedFile(null);
      setPrefixName('imported');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Обновляем список бэкапов
      queryClient.invalidateQueries({ queryKey: ["/api/backups/list"] });
    } catch (error: any) {
      toast({
        title: language === 'ru' ? "Ошибка загрузки файла" : "File upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileUp className="mr-2 h-4 w-4" />
          {language === 'ru' ? "Загрузить бэкап" : "Upload Backup"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{language === 'ru' ? "Загрузка резервной копии" : "Upload Backup File"}</DialogTitle>
          <DialogDescription>
            {language === 'ru'
              ? "Загрузите файл резервной копии для импорта в систему"
              : "Upload a backup file to import into the system"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="backupFile">
              {language === 'ru' ? "Файл резервной копии" : "Backup File"}
            </Label>
            <Input
              id="backupFile"
              type="file"
              accept=".sql,.dump,.dir,.tar,.zip"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <p className="text-sm text-muted-foreground">
              {language === 'ru'
                ? "Поддерживаемые форматы: .sql, .dump, .dir, .tar, .zip"
                : "Supported formats: .sql, .dump, .dir, .tar, .zip"}
            </p>
          </div>
          
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="prefixName">
              {language === 'ru' ? "Префикс имени" : "Name Prefix"}
            </Label>
            <Select
              value={prefixName}
              onValueChange={setPrefixName}
              disabled={isUploading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="imported">
                  {language === 'ru' ? "Импортированный" : "Imported"}
                </SelectItem>
                <SelectItem value="manual">
                  {language === 'ru' ? "Ручной" : "Manual"}
                </SelectItem>
                <SelectItem value="migrated">
                  {language === 'ru' ? "Перенесенный" : "Migrated"}
                </SelectItem>
                <SelectItem value="external">
                  {language === 'ru' ? "Внешний" : "External"}
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {language === 'ru'
                ? "Префикс для классификации загруженного бэкапа"
                : "Prefix for categorizing the uploaded backup"}
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" onClick={handleUpload} disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {language === 'ru' ? "Загрузка..." : "Uploading..."}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {language === 'ru' ? "Загрузить" : "Upload"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Компонент расширенного восстановления из бэкапа
function AdvancedRestoreSheet({ backupName }: { backupName: string }) {
  const { t, language } = useTranslations();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRestoring, setIsRestoring] = useState(false);
  const [options, setOptions] = useState({
    createBackupFirst: true,
    onlySchema: false,
    onlyData: false,
    schemas: [] as string[],
    tables: [] as string[]
  });
  const [schemasText, setSchemasText] = useState('');
  const [tablesText, setTablesText] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleRestore = async () => {
    setIsRestoring(true);

    try {
      // Обработка схем и таблиц из текстовых полей
      const parsedOptions = {
        ...options,
        schemas: schemasText.split(',').map(s => s.trim()).filter(s => s.length > 0),
        tables: tablesText.split(',').map(t => t.trim()).filter(t => t.length > 0)
      };

      // Запрос на восстановление с расширенными опциями
      const response = await fetch(`/api/backups/restore-advanced/${backupName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          createBackupFirst: parsedOptions.createBackupFirst,
          onlySchema: parsedOptions.onlySchema,
          onlyData: parsedOptions.onlyData,
          schemas: parsedOptions.schemas.length > 0 ? parsedOptions.schemas : undefined,
          tables: parsedOptions.tables.length > 0 ? parsedOptions.tables : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Restore failed');
      }

      toast({
        title: language === 'ru' ? "Восстановление выполнено" : "Restore completed",
        description: language === 'ru'
          ? `База данных успешно восстановлена из ${backupName} с расширенными опциями`
          : `Database successfully restored from ${backupName} with advanced options`,
        variant: "default",
      });

      // Обновляем все данные, так как они могли измениться
      queryClient.invalidateQueries();
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: language === 'ru' ? "Ошибка восстановления" : "Restore failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsOpen(true)}
        >
          <Cog className="h-4 w-4" />
          <span className="sr-only">
            {language === 'ru' ? "Расширенное восстановление" : "Advanced restore"}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {language === 'ru' ? "Расширенное восстановление" : "Advanced Restore"}
          </SheetTitle>
          <SheetDescription>
            {language === 'ru'
              ? `Настройте параметры восстановления из файла ${backupName}`
              : `Configure restore options for ${backupName}`}
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-6 space-y-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="createBackupFirst"
              checked={options.createBackupFirst}
              onCheckedChange={(checked) => 
                setOptions({...options, createBackupFirst: !!checked})
              }
            />
            <Label htmlFor="createBackupFirst">
              {language === 'ru'
                ? "Создать резервную копию перед восстановлением"
                : "Create backup before restoring"}
            </Label>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h4 className="text-sm font-medium">
              {language === 'ru' ? "Тип восстановления" : "Restore Type"}
            </h4>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="onlySchema"
                checked={options.onlySchema}
                onCheckedChange={(checked) => {
                  const newOnlySchema = !!checked;
                  // Если выбрали "только схема", отключаем "только данные"
                  setOptions({
                    ...options,
                    onlySchema: newOnlySchema,
                    onlyData: newOnlySchema ? false : options.onlyData
                  });
                }}
              />
              <Label htmlFor="onlySchema">
                {language === 'ru'
                  ? "Восстановить только структуру (без данных)"
                  : "Restore structure only (no data)"}
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="onlyData"
                checked={options.onlyData}
                onCheckedChange={(checked) => {
                  const newOnlyData = !!checked;
                  // Если выбрали "только данные", отключаем "только схема"
                  setOptions({
                    ...options,
                    onlyData: newOnlyData,
                    onlySchema: newOnlyData ? false : options.onlySchema
                  });
                }}
              />
              <Label htmlFor="onlyData">
                {language === 'ru'
                  ? "Восстановить только данные (не меняя структуру)"
                  : "Restore data only (keep structure unchanged)"}
              </Label>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h4 className="text-sm font-medium">
              {language === 'ru' ? "Фильтры восстановления" : "Restore Filters"}
            </h4>
            
            <div className="grid gap-2">
              <Label htmlFor="schemas">
                {language === 'ru' ? "Схемы (через запятую)" : "Schemas (comma-separated)"}
              </Label>
              <Input
                id="schemas"
                placeholder={language === 'ru' ? "public, auth, ..." : "public, auth, ..."}
                value={schemasText}
                onChange={(e) => setSchemasText(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {language === 'ru'
                  ? "Восстановить только указанные схемы"
                  : "Restore only specified schemas"}
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="tables">
                {language === 'ru' ? "Таблицы (через запятую)" : "Tables (comma-separated)"}
              </Label>
              <Input
                id="tables"
                placeholder={language === 'ru' ? "users, services, ..." : "users, services, ..."}
                value={tablesText}
                onChange={(e) => setTablesText(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {language === 'ru'
                  ? "Восстановить только указанные таблицы"
                  : "Restore only specified tables"}
              </p>
            </div>
          </div>
        </div>
        
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">
              {language === 'ru' ? "Отмена" : "Cancel"}
            </Button>
          </SheetClose>
          <Button onClick={handleRestore} disabled={isRestoring}>
            {isRestoring ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {language === 'ru' ? "Восстановление..." : "Restoring..."}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {language === 'ru' ? "Восстановить" : "Restore"}
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
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
    <AppLayout title={t('backups.title')}>
      <Helmet>
        <title>{language === 'ru' ? "Резервное копирование | SaaSly" : "Backup Management | SaaSly"}</title>
      </Helmet>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="text-muted-foreground">
              {t('backups.manageBackups')}
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
                    {t('backups.createBackup')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {language === 'ru' 
                    ? "Создать новую резервную копию базы данных"
                    : "Create a new database backup"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <UploadBackupDialog />
            
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
                    {t('backups.cleanOldBackups')}
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
            <CardTitle>{t('backups.title')}</CardTitle>
            <CardDescription>
              {t('backups.manageBackups')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('common.error')}
              </div>
            ) : !backups || backups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('backups.noBackups')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('backups.backupName')}</TableHead>
                      <TableHead>{language === 'ru' ? "Тип" : "Type"}</TableHead>
                      <TableHead>{t('backups.backupSize')}</TableHead>
                      <TableHead>{t('backups.backupDate')}</TableHead>
                      <TableHead className="text-right">{language === 'ru' ? "Действия" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backups.map((backup) => {
                      const date = new Date(backup.date);
                      
                      // Определяем тип резервной копии по имени файла
                      let type = 'unknown';
                      let badgeVariant = 'secondary';
                      let badgeLabel = language === 'ru' ? "Неизвестный" : "Unknown";
                      
                      if (backup.name.startsWith('manual')) {
                        type = 'manual';
                        badgeVariant = 'default';
                        badgeLabel = language === 'ru' ? "Ручной" : "Manual";
                      } else if (backup.name.startsWith('auto')) {
                        type = 'auto';
                        badgeVariant = 'secondary';
                        badgeLabel = language === 'ru' ? "Авто" : "Auto";
                      } else if (backup.name.startsWith('pre-restore')) {
                        type = 'pre-restore';
                        badgeVariant = 'outline';
                        badgeLabel = language === 'ru' ? "Пред-восстановление" : "Pre-restore";
                      } else if (backup.name.startsWith('imported')) {
                        type = 'imported';
                        badgeVariant = 'destructive';
                        badgeLabel = language === 'ru' ? "Импортированный" : "Imported";
                      }
                      
                      return (
                        <TableRow key={backup.name}>
                          <TableCell className="font-medium truncate max-w-xs">
                            {backup.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant={badgeVariant as any}>
                              {badgeLabel}
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
                            <div className="flex justify-end items-center gap-1">
                              <BackupMetadataDialog backupName={backup.name} />
                              
                              <a 
                                href={`/api/backups/download/${backup.name}`}
                                download={backup.name}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <DownloadCloud className="h-4 w-4" />
                                  <span className="sr-only">
                                    {language === 'ru' ? "Скачать" : "Download"}
                                  </span>
                                </Button>
                              </a>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedBackup(backup.name)}
                                  >
                                    <Upload className="h-4 w-4 mr-1" />
                                    {t('common.restore')}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {t('backups.restoreBackup')}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t('backups.confirmRestore')}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      {t('common.cancel')}
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
                                      {t('common.restore')}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              
                              <AdvancedRestoreSheet backupName={backup.name} />
                              
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
                                      {t('common.delete')}
                                    </span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {t('backups.deleteBackup')}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t('backups.confirmDelete')}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      {t('common.cancel')}
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
                                      {t('common.delete')}
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
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-medium mb-1">
                  {language === 'ru' ? "Типы резервных копий" : "Backup Types"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'ru'
                    ? "Резервные копии имеют разные типы: ручные (manual), автоматические (auto), создаваемые перед восстановлением (pre-restore) и импортированные (imported)."
                    : "Backup files have different types: manual, automatic (auto), pre-restore (created before restoration), and imported."}
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-1">
                  {language === 'ru' ? "Расширенное восстановление" : "Advanced Restore"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'ru'
                    ? "Функция расширенного восстановления позволяет восстановить только структуру или только данные, а также выбрать определенные схемы или таблицы."
                    : "The advanced restore feature allows you to restore only the structure or only the data, and also select specific schemas or tables."}
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-1">
                  {language === 'ru' ? "Импорт и экспорт" : "Import and Export"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'ru'
                    ? "Вы можете загрузить файлы резервных копий из внешних источников или скачать существующие резервные копии для хранения на внешних носителях."
                    : "You can upload backup files from external sources or download existing backup files for storage on external media."}
                </p>
              </div>
            </div>
            
            <CardFooter className="flex flex-col items-start gap-2 pt-6 px-0">
              <h3 className="text-sm font-medium">
                {language === 'ru' ? "Рекомендации по использованию" : "Usage Recommendations"}
              </h3>
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                <li>
                  {language === 'ru'
                    ? "Создавайте резервные копии перед внесением значительных изменений в систему"
                    : "Create backups before making significant changes to the system"}
                </li>
                <li>
                  {language === 'ru'
                    ? "Регулярно скачивайте важные резервные копии для внешнего хранения"
                    : "Regularly download important backups for external storage"}
                </li>
                <li>
                  {language === 'ru'
                    ? "Используйте расширенное восстановление для точечного восстановления данных"
                    : "Use advanced restore for targeted data recovery"}
                </li>
                <li>
                  {language === 'ru'
                    ? "При восстановлении рекомендуется создавать предварительную резервную копию"
                    : "When restoring, it is recommended to create a preliminary backup"}
                </li>
              </ul>
            </CardFooter>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}