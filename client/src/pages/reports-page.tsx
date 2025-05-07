import { useState } from "react";
import { useTranslations } from "@/hooks/use-translations";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { format, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  CalendarIcon,
  LineChart,
  Users,
  CreditCard,
  MessageSquare,
  BarChart4,
  File,
  Trash2,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import Layout from "@/components/layout/layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  formatFileSize, 
  getReports, 
  generateReport, 
  deleteReport, 
  getReportDownloadUrl,
  type Report, 
  type ReportParams 
} from "@/lib/reports-api";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Схема формы для создания отчета
const formSchema = z.object({
  reportType: z.string(),
  format: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  language: z.enum(['en', 'ru']).default('en'),
});

export default function ReportsPage() {
  const { t } = useTranslations();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Получаем текущий язык из localStorage
  const currentLanguage = localStorage.getItem('app-language') || 'en';
  
  // Состояния компонента
  const [generatingReport, setGeneratingReport] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [generatedReportUrl, setGeneratedReportUrl] = useState('');
  const [generatedReportName, setGeneratedReportName] = useState('');
  
  // Запрос на получение списка отчетов
  const { data: reports = [], isLoading: isLoadingReports } = useQuery({
    queryKey: ['/api/reports'],
    queryFn: getReports
  });
  
  // Мутация для генерации отчета
  const generateReportMutation = useMutation({
    mutationFn: generateReport,
    onSuccess: (data) => {
      setGeneratingReport(false);
      setGeneratedReportUrl(data.downloadUrl);
      setGeneratedReportName(data.fileName);
      setSuccessDialog(true);
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
    },
    onError: (error) => {
      setGeneratingReport(false);
      toast({
        variant: "destructive",
        title: t('reports.errorGenerating'),
        description: String(error),
      });
    }
  });
  
  // Мутация для удаления отчета
  const deleteReportMutation = useMutation({
    mutationFn: deleteReport,
    onSuccess: () => {
      setConfirmDelete(false);
      setSelectedReport(null);
      toast({
        title: t('reports.reportDeleted'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
    },
    onError: (error) => {
      setConfirmDelete(false);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: String(error),
      });
    }
  });
  
  // Настройка формы с учетом языка пользователя
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reportType: "subscriptions",
      format: "pdf",
      language: currentLanguage as 'en' | 'ru',
    },
  });

  // Обработка отправки формы
  function onSubmit(values: z.infer<typeof formSchema>) {
    setGeneratingReport(true);
    // Преобразуем значения формы в параметры отчета и отправляем запрос
    const params: ReportParams = {
      reportType: values.reportType as any,
      format: values.format as any,
      startDate: values.startDate,
      endDate: values.endDate,
      language: values.language,
    };
    generateReportMutation.mutate(params);
  }

  // Функция для скачивания отчета
  const handleDownload = (report: Report) => {
    window.open(getReportDownloadUrl(report.name), '_blank');
  };
  
  // Функция для подтверждения удаления отчета
  const handleDeleteConfirm = (report: Report) => {
    setSelectedReport(report);
    setConfirmDelete(true);
  };
  
  // Функция для удаления отчета
  const handleDelete = () => {
    if (selectedReport) {
      deleteReportMutation.mutate(selectedReport.name);
    }
  };

  // Список типов отчетов с их описаниями и иконками
  const reportTypes = [
    { 
      id: "subscriptions", 
      name: t('reports.subscriptionReport'), 
      description: t('reports.subscriptionReportDesc'), 
      icon: <CreditCard className="h-4 w-4" />
    },
    { 
      id: "users", 
      name: t('reports.userReport'), 
      description: t('reports.userReportDesc'), 
      icon: <Users className="h-4 w-4" />
    },
    { 
      id: "services", 
      name: t('reports.servicesReport'), 
      description: t('reports.servicesReportDesc'), 
      icon: <MessageSquare className="h-4 w-4" />
    },
    { 
      id: "financial", 
      name: t('reports.financialReport'), 
      description: t('reports.financialReportDesc'), 
      icon: <LineChart className="h-4 w-4" />
    },
    { 
      id: "trends", 
      name: t('reports.trendsReport'), 
      description: t('reports.trendsReportDesc'), 
      icon: <BarChart4 className="h-4 w-4" />
    },
  ];

  // Список доступных форматов отчетов
  const reportFormats = [
    { id: "pdf", name: t('reports.pdfDocument'), icon: <File className="h-4 w-4 text-red-500" /> },
    { id: "excel", name: t('reports.excelSpreadsheet'), icon: <FileSpreadsheet className="h-4 w-4 text-green-500" /> },
    { id: "csv", name: t('reports.csvFile'), icon: <FileText className="h-4 w-4 text-blue-500" /> },
  ];
  
  // Функция для получения иконки формата
  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case 'pdf':
        return <File className="h-5 w-5 text-red-500" />;
      case 'xlsx':
      case 'excel':
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
      case 'csv':
        return <FileText className="h-5 w-5 text-blue-500" />;
      default:
        return <File className="h-5 w-5" />;
    }
  };
  
  // Функция для отображения языка отчета
  const getLanguageLabel = (language: string) => {
    const languages = {
      'en': 'English',
      'ru': 'Русский',
    };
    return languages[language as keyof typeof languages] || language;
  };

  return (
    <Layout>
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-6">{t('reports.title')}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('reports.generateReport')}</CardTitle>
                <CardDescription>{t('reports.generateReportDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="reportType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('reports.reportType')}</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('reports.selectReportType')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {reportTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id} className="flex items-center">
                                  <div className="flex items-center gap-2">
                                    {type.icon}
                                    <span>{type.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>{t('reports.startDate')}</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>{t('reports.pickDate')}</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>{t('reports.endDate')}</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>{t('reports.pickDate')}</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="format"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('reports.format')}</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('reports.selectFormat')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {reportFormats.map((format) => (
                                  <SelectItem key={format.id} value={format.id}>
                                    <div className="flex items-center gap-2">
                                      {format.icon}
                                      <span>{format.name}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('reports.language')}</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="ru">Русский</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button type="submit" className="w-full md:w-auto" disabled={generatingReport}>
                      {generatingReport ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('reports.generating')}
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          {t('reports.generateReport')}
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{t('reports.recentReports')}</CardTitle>
                <CardDescription>{t('reports.recentReportsDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingReports ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center p-4">
                    <p className="font-medium">{t('reports.noReports')}</p>
                    <p className="text-sm text-muted-foreground">{t('reports.noReportsDesc')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.slice(0, 5).map((report) => (
                      <div key={report.name} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-2">
                          {getFormatIcon(report.format)}
                          <div>
                            <p className="text-sm font-medium">{report.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(report.createdAt), "PPP")}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownload(report)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteConfirm(report)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => document.getElementById('all-reports')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {t('reports.viewAllReports')}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
        
        {/* Список всех отчетов */}
        <div id="all-reports" className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.reportsList')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingReports ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center p-4">
                  <p className="font-medium">{t('reports.noReports')}</p>
                  <p className="text-sm text-muted-foreground">{t('reports.noReportsDesc')}</p>
                </div>
              ) : (
                <div className="border rounded-md">
                  <div className="grid grid-cols-5 gap-4 p-4 font-medium bg-muted text-muted-foreground">
                    <div>{t('reports.reportType')}</div>
                    <div>{t('reports.format')}</div>
                    <div>{t('reports.dateCreated')}</div>
                    <div>{t('reports.fileSize')}</div>
                    <div className="text-right">{t('common.actions')}</div>
                  </div>
                  {reports.map((report) => (
                    <div key={report.name} className="grid grid-cols-5 gap-4 p-4 border-t">
                      <div className="flex items-center gap-2">
                        {getFormatIcon(report.format)}
                        <span>{report.name}</span>
                      </div>
                      <div className="capitalize">{report.format}</div>
                      <div>{format(new Date(report.createdAt), "yyyy-MM-dd HH:mm")}</div>
                      <div>{formatFileSize(report.size)}</div>
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownload(report)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          {t('reports.downloadReport')}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteConfirm(report)}
                        >
                          <Trash2 className="h-4 w-4 mr-1 text-red-500" />
                          {t('reports.deleteReport')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Диалог подтверждения удаления */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('reports.deleteReport')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('reports.confirmDelete')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {deleteReportMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Диалог успешного создания отчета */}
      <Dialog open={successDialog} onOpenChange={setSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('reports.reportGenerated')}</DialogTitle>
            <DialogDescription>
              {t('reports.reportGeneratedDesc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              onClick={() => {
                window.open(generatedReportUrl, '_blank');
                setSuccessDialog(false);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              {t('reports.downloadReport')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}