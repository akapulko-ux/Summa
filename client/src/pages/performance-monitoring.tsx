import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Database, Server, BarChart, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslations } from '@/hooks/use-translations';

interface QueryStat {
  query: string;
  count: number;
  avgTime: number;
}

interface PoolStatus {
  totalConnections: number;
  idleConnections: number;
  waitingClients: number;
}

interface PerformanceMetrics {
  totalQueries: number;
  avgResponseTime: number;
  cacheUsageRatio: number;
  potentialCacheHits: number;
}

interface DBStats {
  poolStatus: PoolStatus;
  queryStats: QueryStat[];
  performanceMetrics: PerformanceMetrics;
}

export default function PerformanceMonitoring() {
  const { t } = useTranslations();
  const { toast } = useToast();
  const [monitoringEnabled, setMonitoringEnabled] = useState(false);

  // Получаем статистику БД
  const { 
    data: dbStats,
    isLoading: isLoadingStats,
    refetch: refetchDbStats
  } = useQuery<DBStats>({
    queryKey: ['/api/monitoring/db/stats'],
    enabled: true,
    refetchInterval: 5000 // Обновляем каждые 5 секунд, когда страница активна
  });

  // Мутация для включения/отключения мониторинга
  const toggleMonitoringMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const result = await apiRequest('POST', '/api/monitoring/db/monitoring', { 
        enabled 
      });
      return await result.json();
    },
    onSuccess: () => {
      setMonitoringEnabled((prev) => !prev);
      toast({
        title: monitoringEnabled ? t('monitoring.disabled') : t('monitoring.enabled'),
        description: monitoringEnabled ? t('monitoring.monitoring_off') : t('monitoring.monitoring_on'),
      });
      refetchDbStats();
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Мутация для очистки кэша
  const clearCacheMutation = useMutation({
    mutationFn: async () => {
      const result = await apiRequest('POST', '/api/monitoring/cache/clear', {});
      return await result.json();
    },
    onSuccess: () => {
      toast({
        title: t('cache.cleared'),
        description: t('cache.cleared_desc'),
      });
      refetchDbStats();
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  useEffect(() => {
    // Можно добавить код для проверки текущего состояния мониторинга при загрузке компонента
  }, []);

  const handleToggleMonitoring = () => {
    toggleMonitoringMutation.mutate(!monitoringEnabled);
  };

  const handleClearCache = () => {
    clearCacheMutation.mutate();
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">{t('monitoring.title')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {t('monitoring.db_status')}
            </CardTitle>
            <CardDescription>{t('monitoring.db_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="flex justify-center py-4">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : dbStats ? (
              <>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{t('monitoring.connections')}</span>
                    <span className="text-sm">
                      {dbStats.poolStatus.totalConnections - dbStats.poolStatus.idleConnections}/
                      {dbStats.poolStatus.totalConnections}
                    </span>
                  </div>
                  <Progress 
                    value={((dbStats.poolStatus.totalConnections - dbStats.poolStatus.idleConnections) / 
                      Math.max(dbStats.poolStatus.totalConnections, 1)) * 100} 
                    className="h-2"
                  />
                </div>
                
                <div className="mt-6">
                  <h4 className="text-sm font-semibold mb-2">{t('monitoring.performance')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted rounded-md p-3">
                      <p className="text-xs text-muted-foreground">{t('monitoring.avg_time')}</p>
                      <p className="text-xl font-bold">{dbStats.performanceMetrics?.avgResponseTime || 0} ms</p>
                    </div>
                    <div className="bg-muted rounded-md p-3">
                      <p className="text-xs text-muted-foreground">{t('monitoring.cache_ratio')}</p>
                      <p className="text-xl font-bold">{Math.round((dbStats.performanceMetrics?.cacheUsageRatio || 0) * 100)}%</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('common.no_data')}</AlertTitle>
                <AlertDescription>
                  {t('monitoring.no_data_desc')}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex items-center space-x-2">
              <Switch 
                id="monitoring" 
                checked={monitoringEnabled}
                onCheckedChange={handleToggleMonitoring}
              />
              <Label htmlFor="monitoring">{t('monitoring.toggle')}</Label>
            </div>
            <Button variant="outline" onClick={() => refetchDbStats()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('common.refresh')}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              {t('monitoring.query_stats')}
            </CardTitle>
            <CardDescription>{t('monitoring.query_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="flex justify-center py-4">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : dbStats && dbStats.queryStats && dbStats.queryStats.length > 0 ? (
              <div className="max-h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('monitoring.query')}</TableHead>
                      <TableHead className="text-right">{t('monitoring.count')}</TableHead>
                      <TableHead className="text-right">{t('monitoring.avg_time')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dbStats.queryStats.map((stat, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{stat.query}</TableCell>
                        <TableCell className="text-right">{stat.count}</TableCell>
                        <TableCell className="text-right">{Math.round(stat.avgTime)} ms</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('common.no_data')}</AlertTitle>
                <AlertDescription>
                  {t('monitoring.no_queries')}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={handleClearCache}>
              {t('cache.clear')}
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            {t('monitoring.system_info')}
          </CardTitle>
          <CardDescription>{t('monitoring.system_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="cache">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cache">{t('cache.title')}</TabsTrigger>
              <TabsTrigger value="stats">{t('monitoring.metrics')}</TabsTrigger>
            </TabsList>
            <TabsContent value="cache" className="mt-4">
              {dbStats && dbStats.performanceMetrics ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted rounded-md p-4">
                    <h3 className="font-medium mb-1">{t('cache.total_hits')}</h3>
                    <p className="text-2xl font-bold">
                      {dbStats.performanceMetrics.potentialCacheHits}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('cache.hits_desc')}
                    </p>
                  </div>
                  <div className="bg-muted rounded-md p-4">
                    <h3 className="font-medium mb-1">{t('cache.efficiency')}</h3>
                    <div className="flex items-end gap-2">
                      <p className="text-2xl font-bold">
                        {Math.round(dbStats.performanceMetrics.cacheUsageRatio * 100)}%
                      </p>
                      {dbStats.performanceMetrics.cacheUsageRatio >= 0.5 ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mb-1" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-500 mb-1" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('cache.efficiency_desc')}
                    </p>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t('common.no_data')}</AlertTitle>
                  <AlertDescription>
                    {t('cache.no_data')}
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
            <TabsContent value="stats" className="mt-4">
              {dbStats && dbStats.performanceMetrics ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">{t('monitoring.response_times')}</h3>
                    <div className="bg-muted rounded-md p-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">{t('monitoring.avg_response')}</span>
                        <span className="text-sm font-medium">
                          {dbStats.performanceMetrics.avgResponseTime} ms
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(100, (dbStats.performanceMetrics.avgResponseTime / 200) * 100)} 
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        {dbStats.performanceMetrics.avgResponseTime < 100 
                          ? t('monitoring.good_performance')
                          : t('monitoring.consider_optimizing')}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">{t('monitoring.total_stats')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted rounded-md p-4">
                        <h4 className="text-xs text-muted-foreground">{t('monitoring.queries_executed')}</h4>
                        <p className="text-2xl font-bold">{dbStats.performanceMetrics.totalQueries}</p>
                      </div>
                      <div className="bg-muted rounded-md p-4">
                        <h4 className="text-xs text-muted-foreground">{t('monitoring.unique_queries')}</h4>
                        <p className="text-2xl font-bold">{dbStats.queryStats.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t('common.no_data')}</AlertTitle>
                  <AlertDescription>
                    {t('monitoring.enable_monitoring')}
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}