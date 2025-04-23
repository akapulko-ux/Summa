import { useState, useEffect } from "react";
import { useTranslations } from "@/hooks/use-translations";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ResponsiveContainer,
  BarChart as RechartBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  ComposedChart
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CalendarIcon, Loader2, CreditCard, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import Layout from "@/components/layout/layout";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedLoader } from "@/components/ui/animated-loader";

// Цвета для графиков
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsPage() {
  const { t, language } = useTranslations();
  const [period, setPeriod] = useState("month");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [animatedData, setAnimatedData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("revenue");
  
  // Эффект для создания анимированных данных при изменении периода
  useEffect(() => {
    // Имитация изменения данных при смене периода
    let newData;
    if (period === "month") {
      newData = [
        { name: 'Январь', revenue: 4000 },
        { name: 'Февраль', revenue: 3000 },
        { name: 'Март', revenue: 2000 },
        { name: 'Апрель', revenue: 2780 },
        { name: 'Май', revenue: 1890 },
        { name: 'Июнь', revenue: 2390 },
      ];
    } else if (period === "quarter") {
      newData = [
        { name: 'Q1', revenue: 9000 },
        { name: 'Q2', revenue: 7060 },
        { name: 'Q3', revenue: 8420 },
        { name: 'Q4', revenue: 5490 },
      ];
    } else if (period === "year") {
      newData = [
        { name: '2020', revenue: 23000 },
        { name: '2021', revenue: 27500 },
        { name: '2022', revenue: 29700 },
        { name: '2023', revenue: 34000 },
        { name: '2024', revenue: 31400 },
      ];
    } else {
      // Default data for other periods
      newData = revenueData;
    }
    
    setAnimatedData(newData);
  }, [period]);

  // Запрос статистики подписок
  const { data: subscriptionStats = {}, isLoading: isLoadingSubscriptions } = useQuery<any>({
    queryKey: ["/api/stats/subscriptions"],
  });

  // Запрос статистики пользователей
  const { data: userStats = {}, isLoading: isLoadingUsers } = useQuery<any>({
    queryKey: ["/api/stats/users"],
  });

  // Запрос популярности сервисов
  const { data: servicePopularity = [], isLoading: isLoadingServices } = useQuery<any[]>({
    queryKey: ["/api/stats/services"],
  });
  
  // Новые данные аналитики
  
  // Статистика регистраций пользователей
  const { data: registrationStats = [], isLoading: isLoadingRegistrations } = useQuery<any[]>({
    queryKey: ["/api/stats/registrations", { period }],
  });
  
  // Статистика по кэшбэку
  const { data: cashbackStats = [], isLoading: isLoadingCashback } = useQuery<any[]>({
    queryKey: ["/api/stats/cashback", { period }],
  });
  
  // Статистика активности клиентов
  const { data: clientsActivityStats = {}, isLoading: isLoadingClientsActivity } = useQuery<any>({
    queryKey: ["/api/stats/clients-activity"],
  });
  
  // Статистика по стоимости подписок
  const { data: subscriptionCostsStats = [], isLoading: isLoadingSubscriptionCosts } = useQuery<any[]>({
    queryKey: ["/api/stats/subscription-costs", { period }],
  });

  // Placeholder данные для примера
  const revenueData = [
    { name: 'Январь', revenue: 4000 },
    { name: 'Февраль', revenue: 3000 },
    { name: 'Март', revenue: 2000 },
    { name: 'Апрель', revenue: 2780 },
    { name: 'Май', revenue: 1890 },
    { name: 'Июнь', revenue: 2390 },
  ];

  const userGrowthData = [
    { name: 'Январь', users: 10 },
    { name: 'Февраль', users: 15 },
    { name: 'Март', users: 25 },
    { name: 'Апрель', users: 32 },
    { name: 'Май', users: 38 },
    { name: 'Июнь', users: 45 },
  ];

  return (
    <Layout>
      <div className="container py-6">
        <motion.h1 
          className="text-3xl font-bold mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {t('nav.analytics')}
        </motion.h1>
        
        <motion.div 
          className="flex items-center mb-6 space-x-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Select
            value={period}
            onValueChange={(value) => setPeriod(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('analytics.selectPeriod')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">{t('analytics.daily')}</SelectItem>
              <SelectItem value="week">{t('analytics.weekly')}</SelectItem>
              <SelectItem value="month">{t('analytics.monthly')}</SelectItem>
              <SelectItem value="quarter">{t('analytics.quarterly')}</SelectItem>
              <SelectItem value="year">{t('analytics.yearly')}</SelectItem>
            </SelectContent>
          </Select>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[280px] pl-3 text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>{t('analytics.pickDate')}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </motion.div>
        
        <Tabs defaultValue="revenue" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger 
              value="revenue" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative"
            >
              <span>{t('analytics.revenue')}</span>
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                initial={{ scaleX: 0 }}
                animate={{ 
                  scaleX: activeTab === "revenue" ? 1 : 0
                }}
                transition={{ duration: 0.3 }}
              />
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative"
            >
              <span>{t('analytics.users')}</span>
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                initial={{ scaleX: 0 }}
                animate={{ 
                  scaleX: activeTab === "users" ? 1 : 0
                }}
                transition={{ duration: 0.3 }}
              />
            </TabsTrigger>
            <TabsTrigger 
              value="services" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative"
            >
              <span>{t('analytics.services')}</span>
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                initial={{ scaleX: 0 }}
                animate={{ 
                  scaleX: activeTab === "services" ? 1 : 0
                }}
                transition={{ duration: 0.3 }}
              />
            </TabsTrigger>
            <TabsTrigger 
              value="cashback" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative"
            >
              <span>{t('analytics.cashback')}</span>
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                initial={{ scaleX: 0 }}
                animate={{ 
                  scaleX: activeTab === "cashback" ? 1 : 0
                }}
                transition={{ duration: 0.3 }}
              />
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative"
            >
              <span>{t('analytics.activity')}</span>
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                initial={{ scaleX: 0 }}
                animate={{ 
                  scaleX: activeTab === "activity" ? 1 : 0
                }}
                transition={{ duration: 0.3 }}
              />
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="revenue" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>{t('analytics.totalRevenue')}</CardTitle>
                    <CardDescription>{t('analytics.revenueDistribution')} {period}</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {isLoadingSubscriptions ? (
                      <AnimatedLoader text={t('analytics.loadingRevenue')} />
                    ) : (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`revenue-chart-${period}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5 }}
                          className="h-full"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartBarChart
                              data={animatedData.length > 0 ? animatedData : revenueData}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip 
                                contentStyle={{ 
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                  border: 'none'
                                }} 
                                animationDuration={300}
                              />
                              <Legend />
                              <Bar 
                                dataKey="revenue" 
                                fill="#8884d8" 
                                name="Revenue" 
                                animationDuration={1500}
                                animationEasing="ease-in-out"
                                radius={[4, 4, 0, 0]}
                              />
                            </RechartBarChart>
                          </ResponsiveContainer>
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>{t('analytics.revenueDistribution')}</CardTitle>
                    <CardDescription>{t('analytics.serviceRevenue')}</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {isLoadingSubscriptions ? (
                      <AnimatedLoader text={t('analytics.loadingDistribution')} />
                    ) : (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`pie-chart-${period}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.5 }}
                          className="h-full"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={servicePopularity || []}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="count"
                                nameKey="serviceTitle"
                                animationDuration={1000}
                                animationEasing="ease-out"
                              >
                                {(servicePopularity || []).map((_entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ 
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                  border: 'none'
                                }} 
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>
          
          <TabsContent value="users" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>{t('analytics.userGrowth')}</CardTitle>
                    <CardDescription>{t('analytics.newUsers')} {period}</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {isLoadingUsers ? (
                      <AnimatedLoader text={t('analytics.loadingUserGrowth')} />
                    ) : (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`user-growth-chart-${period}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.5 }}
                          className="h-full"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={userGrowthData}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <defs>
                                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip 
                                contentStyle={{ 
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                  border: 'none'
                                }} 
                              />
                              <Legend />
                              <Area 
                                type="monotone" 
                                dataKey="users" 
                                stroke="#82ca9d" 
                                fillOpacity={1} 
                                fill="url(#colorUsers)" 
                                name="New Users"
                                animationDuration={1500}
                                animationEasing="ease-in-out"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>{t('analytics.clientActivity')}</CardTitle>
                    <CardDescription>{t('analytics.activeVsInactive')}</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {isLoadingUsers ? (
                      <AnimatedLoader text={t('analytics.loadingActivity')} />
                    ) : userStats ? (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`user-activity-pie-${period}`}
                          initial={{ opacity: 0, rotateY: 90 }}
                          animate={{ opacity: 1, rotateY: 0 }}
                          exit={{ opacity: 0, rotateY: -90 }}
                          transition={{ duration: 0.6 }}
                          className="h-full"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: "Active", value: parseInt((userStats as any).active || "0") },
                                  { name: "Inactive", value: parseInt((userStats as any).total || "0") - parseInt((userStats as any).active || "0") }
                                ]}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                animationDuration={1200}
                                animationEasing="ease-out"
                              >
                                <Cell fill="#4CAF50" />
                                <Cell fill="#F44336" />
                              </Pie>
                              <Tooltip 
                                contentStyle={{ 
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                  border: 'none'
                                }} 
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </motion.div>
                      </AnimatePresence>
                    ) : null}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>
          
          <TabsContent value="services" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>{t('analytics.popularServices')}</CardTitle>
                    <CardDescription>{t('analytics.servicesByCount')}</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {isLoadingServices ? (
                      <AnimatedLoader text={t('analytics.loadingPopularServices')} />
                    ) : (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`services-chart-${period}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.5 }}
                          className="h-full"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartBarChart
                              layout="vertical"
                              data={servicePopularity || []}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                              <XAxis type="number" />
                              <YAxis type="category" dataKey="serviceTitle" />
                              <Tooltip 
                                contentStyle={{ 
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                  border: 'none'
                                }} 
                              />
                              <Legend />
                              <Bar 
                                dataKey="count" 
                                fill="#8884d8" 
                                name="Subscription Count"
                                animationDuration={1500}
                                animationEasing="ease-in-out"
                                radius={[0, 4, 4, 0]}
                              />
                            </RechartBarChart>
                          </ResponsiveContainer>
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>{t('analytics.serviceRevenue')}</CardTitle>
                    <CardDescription>{t('analytics.revenueByService')}</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {isLoadingSubscriptions ? (
                      <AnimatedLoader text={t('analytics.loadingServiceRevenue')} />
                    ) : (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`service-revenue-chart-${period}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.5 }}
                          className="h-full"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartBarChart
                              layout="vertical"
                              data={servicePopularity?.map(item => ({
                                ...item,
                                revenue: (item.count || 0) * 100 // Placeholder revenue calculation
                              })) || []}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="1" y2="0">
                                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#4CAF50" stopOpacity={1}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                              <XAxis type="number" />
                              <YAxis type="category" dataKey="serviceTitle" />
                              <Tooltip 
                                contentStyle={{ 
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                  border: 'none'
                                }} 
                              />
                              <Legend />
                              <Bar 
                                dataKey="revenue" 
                                fill="url(#colorRevenue)" 
                                name="Revenue"
                                animationDuration={1500}
                                animationEasing="ease-in-out"
                                radius={[0, 4, 4, 0]}
                              />
                            </RechartBarChart>
                          </ResponsiveContainer>
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>
          
          <TabsContent value="cashback" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>{t('analytics.cashbackAnalytics')}</CardTitle>
                    <CardDescription>{t('analytics.cashbackAmount')}</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {isLoadingCashback ? (
                      <AnimatedLoader text={t('analytics.loadingCashback')} />
                    ) : (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`cashback-chart-${period}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5 }}
                          className="h-full"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={cashbackStats}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="period" />
                              <YAxis />
                              <Tooltip 
                                contentStyle={{ 
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                  border: 'none'
                                }} 
                                formatter={(value) => [`$${value}`, 'Amount']}
                              />
                              <Legend />
                              <Line 
                                type="monotone" 
                                dataKey="amount" 
                                stroke="#ff7300" 
                                name="Cashback" 
                                activeDot={{ r: 8 }}
                                strokeWidth={2}
                                animationDuration={1500}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>{t('analytics.cashbackSummary')}</CardTitle>
                    <CardDescription>{t('analytics.totalCashback')}</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {isLoadingCashback ? (
                      <AnimatedLoader text={t('analytics.loadingCashback')} />
                    ) : (
                      <div className="flex flex-col h-full justify-center items-center">
                        <div className="grid grid-cols-1 gap-6 w-full">
                          <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-xl">
                            <div className="text-3xl font-bold mb-2">
                              ${cashbackStats.reduce((sum, item) => sum + parseFloat(item.amount), 0).toFixed(2)}
                            </div>
                            <div className="text-muted-foreground">{t('analytics.totalCashback')}</div>
                          </div>
                          
                          <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-xl">
                            <div className="text-3xl font-bold mb-2">
                              {cashbackStats.length > 0 ? 
                                `$${cashbackStats[cashbackStats.length - 1].amount}` : 
                                '$0.00'}
                            </div>
                            <div className="text-muted-foreground">{t('analytics.latestCashback')}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>
          
          <TabsContent value="activity" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>{t('analytics.clientActivity')}</CardTitle>
                    <CardDescription>{t('analytics.activeVsInactive')}</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {isLoadingClientsActivity ? (
                      <AnimatedLoader text={t('analytics.loadingActivity')} />
                    ) : (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`activity-chart-${period}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.5 }}
                          className="h-full"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: language === 'ru' ? 'Активные' : 'Active', value: clientsActivityStats.active || 0 },
                                  { name: language === 'ru' ? 'Неактивные' : 'Inactive', value: clientsActivityStats.inactive || 0 }
                                ]}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                <Cell fill="#4CAF50" /> {/* Active */}
                                <Cell fill="#F44336" /> {/* Inactive */}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ 
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                  border: 'none'
                                }} 
                              />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>{t('analytics.subscriptionCosts')}</CardTitle>
                    <CardDescription>{t('analytics.avgMinMaxPrices')}</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {isLoadingSubscriptionCosts ? (
                      <AnimatedLoader text={t('analytics.loadingSubscriptionCosts')} />
                    ) : (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`costs-chart-${period}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5 }}
                          className="h-full"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                              data={subscriptionCostsStats}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="period" />
                              <YAxis />
                              <Tooltip 
                                contentStyle={{ 
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                  border: 'none'
                                }} 
                                formatter={(value) => [`$${value}`, 'Price']}
                              />
                              <Legend />
                              <Area 
                                type="monotone" 
                                dataKey="avgPrice" 
                                fill="#8884d8" 
                                stroke="#8884d8" 
                                name={language === 'ru' ? "Средняя цена" : "Average Price"}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="maxPrice" 
                                stroke="#ff7300" 
                                name={language === 'ru' ? "Максимальная цена" : "Maximum Price"}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="minPrice" 
                                stroke="#4CAF50" 
                                name={language === 'ru' ? "Минимальная цена" : "Minimum Price"}
                              />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Нижние кнопки были удалены, чтобы избежать дублирования */}
      </div>
    </Layout>
  );
}