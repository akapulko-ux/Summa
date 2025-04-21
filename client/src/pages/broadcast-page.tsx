import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { 
  Send, 
  Users, 
  Loader2, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Filter
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "@/hooks/use-translations";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Схема для формы рассылки
const broadcastFormSchema = z.object({
  message: z.string().min(5, { message: "Message must be at least 5 characters" }),
  role: z.enum(["all", "admin", "client"]).default("all"),
});

type BroadcastFormValues = z.infer<typeof broadcastFormSchema>;

// Интерфейс для подключенного пользователя
interface LinkedUser {
  userId: number;
  telegramChatId: number;
  linkDate: Date;
}

export default function BroadcastPage() {
  const { t } = useTranslations();
  const { toast } = useToast();
  const [lastBroadcastResult, setLastBroadcastResult] = useState<{ success: number; failed: number } | null>(null);

  // Форма для отправки рассылки
  const form = useForm<BroadcastFormValues>({
    resolver: zodResolver(broadcastFormSchema),
    defaultValues: {
      message: "",
      role: "all",
    },
  });

  // Получение списка пользователей с подключенным Telegram
  const { data: linkedUsers, isLoading: isLoadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['/api/telegram/linked-users'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/telegram/linked-users');
      if (!res.ok) throw new Error('Failed to fetch linked users');
      const data = await res.json();
      return data.linkedUsers as LinkedUser[];
    }
  });

  // Мутация для отправки массовой рассылки
  const broadcastMutation = useMutation({
    mutationFn: async (values: BroadcastFormValues) => {
      const role = values.role !== 'all' ? values.role : undefined;
      const res = await apiRequest('POST', '/api/telegram/broadcast', {
        message: values.message,
        role
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to send broadcast');
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: t.broadcast.broadcastSent,
        description: t.broadcast.broadcastSentDesc
          .replace('{success}', data.success)
          .replace('{failed}', data.failed),
        duration: 5000
      });
      setLastBroadcastResult({ success: data.success, failed: data.failed });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: t.broadcast.broadcastFailed,
        description: error.message,
        variant: "destructive",
        duration: 5000
      });
    }
  });

  // Обработчик отправки формы
  function onSubmit(values: BroadcastFormValues) {
    broadcastMutation.mutate(values);
  }

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-6">{t.broadcast.title}</h1>
      
      <Tabs defaultValue="broadcast">
        <TabsList className="mb-4">
          <TabsTrigger value="broadcast">{t.broadcast.sendBroadcast}</TabsTrigger>
          <TabsTrigger value="connected">{t.broadcast.connectedUsers}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="broadcast" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t.broadcast.newBroadcast}</CardTitle>
              <CardDescription>{t.broadcast.newBroadcastDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.broadcast.recipientFilter}</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t.broadcast.selectRecipients} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="all">{t.broadcast.allUsers}</SelectItem>
                            <SelectItem value="admin">{t.broadcast.adminUsers}</SelectItem>
                            <SelectItem value="client">{t.broadcast.clientUsers}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>{t.broadcast.recipientFilterDesc}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.broadcast.messageContent}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t.broadcast.messageContentPlaceholder}
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>{t.broadcast.messageContentDesc}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={broadcastMutation.isPending}
                  >
                    {broadcastMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    {t.broadcast.sendNow}
                  </Button>
                </form>
              </Form>
            </CardContent>
            
            {lastBroadcastResult && (
              <CardFooter className="border-t bg-muted/50 pt-6">
                <Alert className="w-full">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertTitle>{t.broadcast.broadcastSent}</AlertTitle>
                  <AlertDescription>
                    {t.broadcast.lastBroadcastResult}
                    <div className="mt-2 flex space-x-4">
                      <div className="flex items-center">
                        <Badge variant="outline" className="mr-2 bg-green-100 text-green-700 hover:bg-green-200">
                          {lastBroadcastResult.success}
                        </Badge>
                        <span>{t.broadcast.deliveredCount}</span>
                      </div>
                      {lastBroadcastResult.failed > 0 && (
                        <div className="flex items-center">
                          <Badge variant="destructive" className="mr-2">
                            {lastBroadcastResult.failed}
                          </Badge>
                          <span>{t.broadcast.failedCount}</span>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              </CardFooter>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.broadcast.tips}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                <li>{t.broadcast.tip1}</li>
                <li>{t.broadcast.tip2}</li>
                <li>{t.broadcast.tip3}</li>
                <li>{t.broadcast.tip4}</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="connected">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle>{t.broadcast.connectedUsers}</CardTitle>
                <CardDescription>{t.broadcast.connectedUsersDesc}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchUsers()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t.common.refresh}
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : linkedUsers && linkedUsers.length > 0 ? (
                <div>
                  <div className="flex items-center mb-4">
                    <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {t.broadcast.totalConnected}: {linkedUsers.length}
                    </span>
                  </div>
                  <Separator className="mb-4" />
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {linkedUsers.map((user) => (
                        <div key={user.userId} className="border rounded-md p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">
                                {t.broadcast.userId}: {user.userId}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {t.broadcast.telegramChatId}: {user.telegramChatId}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {t.broadcast.linkedOn}: {new Date(user.linkDate).toLocaleString()}
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                form.setValue("message", 
                                  t.broadcast.testMessageToUser.replace('{userId}', String(user.userId)));
                                form.setFocus("message");
                              }}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              {t.broadcast.messageThis}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{t.broadcast.noConnectedUsers}</AlertTitle>
                  <AlertDescription>
                    {t.broadcast.noConnectedUsersDesc}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}