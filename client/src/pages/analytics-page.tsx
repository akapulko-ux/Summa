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
  AreaChart
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Layout from "@/components/layout/layout";
import { motion, AnimatePresence } from "framer-motion";

// Цвета для графиков
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsPage() {
  const { t } = useTranslations();
  const [period, setPeriod] = useState("month");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [animatedData, setAnimatedData] = useState<any[]>([]);
  
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
        <h1 className="text-3xl font-bold mb-6">{t.nav.analytics}</h1>
        
        <div className="flex items-center mb-6 space-x-2">
          <Select
            value={period}
            onValueChange={(value) => setPeriod(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="quarter">Quarterly</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
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
                {date ? format(date, "PPP") : <span>Pick a date</span>}
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
        </div>
        
        <Tabs defaultValue="revenue">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="revenue" className="relative overflow-hidden group">
              <span className="relative z-10">Revenue Analytics</span>
              <motion.div 
                className="absolute inset-0 bg-primary opacity-0 group-data-[state=active]:opacity-10 transition-opacity"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </TabsTrigger>
            <TabsTrigger value="users" className="relative overflow-hidden group">
              <span className="relative z-10">User Analytics</span>
              <motion.div 
                className="absolute inset-0 bg-primary opacity-0 group-data-[state=active]:opacity-10 transition-opacity"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </TabsTrigger>
            <TabsTrigger value="services" className="relative overflow-hidden group">
              <span className="relative z-10">Service Analytics</span>
              <motion.div 
                className="absolute inset-0 bg-primary opacity-0 group-data-[state=active]:opacity-10 transition-opacity"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
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
                    <CardTitle>Revenue Overview</CardTitle>
                    <CardDescription>Total revenue by {period}</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {isLoadingSubscriptions ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
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
                    <CardTitle>Revenue Distribution</CardTitle>
                    <CardDescription>Revenue by service type</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {isLoadingSubscriptions ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
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
                    <CardTitle>User Growth</CardTitle>
                    <CardDescription>New users by {period}</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {isLoadingUsers ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
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
                    <CardTitle>User Activity</CardTitle>
                    <CardDescription>Active vs inactive users</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {isLoadingUsers ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
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
                    <CardTitle>Popular Services</CardTitle>
                    <CardDescription>Services by subscription count</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {isLoadingServices ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
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
                    <CardTitle>Service Revenue</CardTitle>
                    <CardDescription>Revenue by service</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {isLoadingSubscriptions ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
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
        </Tabs>
      </div>
    </Layout>
  );
}