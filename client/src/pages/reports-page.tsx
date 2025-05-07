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
import { format } from "date-fns";
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
  File
} from "lucide-react";
import { cn } from "@/lib/utils";
import Layout from "@/components/layout/layout";

// Схема формы для создания отчета
const formSchema = z.object({
  reportType: z.string(),
  format: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export default function ReportsPage() {
  const { t } = useTranslations();
  const [generatingReport, setGeneratingReport] = useState(false);
  
  // Настройка формы
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reportType: "subscriptions",
      format: "pdf",
    },
  });

  // Обработка отправки формы
  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    setGeneratingReport(true);
    
    // Имитация генерации отчета
    setTimeout(() => {
      setGeneratingReport(false);
    }, 2000);
  }

  // Список типов отчетов с их описаниями и иконками
  const reportTypes = [
    { 
      id: "subscriptions", 
      name: "Subscription Report", 
      description: "Detailed information about subscriptions and revenue", 
      icon: <CreditCard className="h-4 w-4" />
    },
    { 
      id: "users", 
      name: "User Report", 
      description: "User growth and activity statistics", 
      icon: <Users className="h-4 w-4" />
    },
    { 
      id: "services", 
      name: "Services Report", 
      description: "Service usage and popularity", 
      icon: <MessageSquare className="h-4 w-4" />
    },
    { 
      id: "financial", 
      name: "Financial Report", 
      description: "Revenue, expenses and profit information", 
      icon: <LineChart className="h-4 w-4" />
    },
    { 
      id: "trends", 
      name: "Trends Report", 
      description: "Trends and forecasts based on historical data", 
      icon: <BarChart4 className="h-4 w-4" />
    },
  ];

  // Список доступных форматов отчетов
  const reportFormats = [
    { id: "pdf", name: "PDF Document", icon: <File className="h-4 w-4 text-red-500" /> },
    { id: "excel", name: "Excel Spreadsheet", icon: <FileSpreadsheet className="h-4 w-4" /> },
    { id: "csv", name: "CSV File", icon: <FileText className="h-4 w-4" /> },
  ];

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
                    
                    <Button type="submit" className="w-full md:w-auto" disabled={generatingReport}>
                      {generatingReport ? (
                        <>{t('reports.generating')}</>
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
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center gap-2">
                      <File className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="text-sm font-medium">Subscription Report</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(), "PPP")}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">User Growth Report</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(Date.now() - 24 * 60 * 60 * 1000), "PPP")}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center gap-2">
                      <File className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="text-sm font-medium">Financial Report Q1</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), "PPP")}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">View All Reports</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}