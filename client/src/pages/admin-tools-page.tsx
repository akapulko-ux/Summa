import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "@/hooks/use-translations";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/ui/file-upload";

export default function AdminToolsPage() {
  const { t } = useTranslations();
  const [migratingIcons, setMigratingIcons] = useState(false);
  const [testingIcon, setTestingIcon] = useState(false);
  const [testIconUrl, setTestIconUrl] = useState("");
  const [testIconData, setTestIconData] = useState("");
  const [migrationResult, setMigrationResult] = useState<{
    migrated: number;
    failed: number;
    message: string;
  } | null>(null);
  const [iconStatus, setIconStatus] = useState<{
    inDb: number;
    onlyFilesystem: number;
    missing: number;
    total: number;
  } | null>(null);

  // Функция для получения статуса иконок
  const fetchIconStatus = async () => {
    try {
      const response = await fetch("/api/service-icons-status");
      if (!response.ok) {
        throw new Error(`Ошибка получения статуса: ${response.statusText}`);
      }
      const status = await response.json();
      setIconStatus(status);
    } catch (error) {
      console.error("Ошибка получения статуса иконок:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось получить статус иконок сервисов",
        variant: "destructive",
      });
    }
  };

  // Загружаем статус иконок при загрузке страницы
  useEffect(() => {
    fetchIconStatus();
  }, []);

  // Функция для миграции иконок сервисов
  const handleMigrateIcons = async () => {
    try {
      setMigratingIcons(true);
      setMigrationResult(null);

      const response = await fetch("/api/migrate-icons", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Ошибка миграции: ${response.statusText}`);
      }

      const result = await response.json();
      setMigrationResult(result);

      // Обновляем статус иконок после миграции
      await fetchIconStatus();

      toast({
        title: "Миграция завершена",
        description: `Успешно перенесено: ${result.migrated}, ошибок: ${result.failed}`,
      });
    } catch (error) {
      console.error("Ошибка миграции иконок:", error);
      toast({
        title: "Ошибка миграции",
        description: error instanceof Error ? error.message : "Произошла ошибка во время миграции",
        variant: "destructive",
      });
    } finally {
      setMigratingIcons(false);
    }
  };

  // Функция для тестирования загрузки иконки
  const handleTestIconUpload = (data: { iconUrl: string, iconData?: string, iconMimeType?: string }) => {
    setTestIconUrl(data.iconUrl);
    setTestIconData(data.iconData || "");

    toast({
      title: "Иконка загружена",
      description: "Тестовая иконка успешно загружена и преобразована в base64",
    });
  };

  // Функция для тестирования отображения иконки из базы данных
  const handleTestIconRetrieval = async () => {
    if (!testIconUrl) {
      toast({
        title: "Ошибка",
        description: "Сначала загрузите тестовую иконку",
        variant: "destructive",
      });
      return;
    }

    setTestingIcon(true);

    try {
      // Получаем ID сервиса из URL иконки (для тестирования используем первый сервис)
      const testServiceId = 1;
      
      // Обновляем иконку для тестового сервиса
      const updateResponse = await fetch(`/api/services/${testServiceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          iconUrl: testIconUrl,
          iconData: testIconData,
          iconMimeType: "image/png" // предполагаем png для тестирования
        }),
      });

      if (!updateResponse.ok) {
        throw new Error(`Ошибка обновления: ${updateResponse.statusText}`);
      }

      // Проверяем, что иконка сохранилась в базе данных
      const checkResponse = await fetch(`/api/service-icon/${testServiceId}`);
      
      if (!checkResponse.ok) {
        throw new Error(`Ошибка проверки: ${checkResponse.statusText}`);
      }

      toast({
        title: "Тест успешен",
        description: "Иконка успешно сохранена в базе данных и может быть получена",
      });
    } catch (error) {
      console.error("Ошибка тестирования иконки:", error);
      toast({
        title: "Ошибка теста",
        description: error instanceof Error ? error.message : "Произошла ошибка во время тестирования",
        variant: "destructive",
      });
    } finally {
      setTestingIcon(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Инструменты администратора</h1>

      <Tabs defaultValue="icons" className="space-y-6">
        <TabsList>
          <TabsTrigger value="icons">Управление иконками</TabsTrigger>
          <TabsTrigger value="test">Тестирование</TabsTrigger>
        </TabsList>

        <TabsContent value="icons">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Статус иконок сервисов</CardTitle>
                <CardDescription>
                  Информация о текущем состоянии иконок для сервисов
                </CardDescription>
              </CardHeader>
              <CardContent>
                {iconStatus ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Всего сервисов:</span>
                      <Badge variant="outline">{iconStatus.total}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Иконки в базе данных:</span>
                      <Badge variant="secondary">{iconStatus.inDb}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Только в файловой системе:</span>
                      <Badge variant="outline" className="bg-amber-100 text-amber-800">{iconStatus.onlyFilesystem}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Отсутствуют иконки:</span>
                      <Badge variant="outline" className="bg-red-100 text-red-800">{iconStatus.missing}</Badge>
                    </div>
                    
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Статус миграции</AlertTitle>
                      <AlertDescription>
                        {iconStatus.onlyFilesystem > 0 
                          ? `${iconStatus.onlyFilesystem} иконок могут быть потеряны при деплое. Рекомендуем выполнить миграцию.` 
                          : "Все иконки сохранены в базе данных и защищены от потери при деплое."}
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Миграция иконок сервисов</CardTitle>
                <CardDescription>
                  Перенос иконок сервисов из файловой системы в базу данных для сохранения при деплое
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    onClick={handleMigrateIcons} 
                    disabled={migratingIcons || (!!iconStatus && iconStatus.onlyFilesystem === 0)}
                    className="w-full"
                  >
                    {migratingIcons ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Миграция...
                      </>
                    ) : (
                      "Начать миграцию"
                    )}
                  </Button>

                  {migrationResult && (
                    <div className="mt-4 p-3 bg-muted rounded-md">
                      <p className="font-medium">Результаты миграции:</p>
                      <p>Успешно перенесено: <span className="font-semibold text-green-600">{migrationResult.migrated}</span></p>
                      <p>Ошибок: <span className="font-semibold text-red-600">{migrationResult.failed}</span></p>
                      <p className="text-sm text-muted-foreground mt-2">{migrationResult.message}</p>
                    </div>
                  )}

                  {iconStatus && iconStatus.onlyFilesystem === 0 && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertTitle>Все иконки мигрированы</AlertTitle>
                      <AlertDescription>
                        Все иконки уже сохранены в базе данных и будут доступны после деплоя.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Тестирование хранения иконок</CardTitle>
              <CardDescription>
                Проверка загрузки и сохранения иконок в базе данных
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Шаг 1: Загрузка тестовой иконки</h3>
                  <FileUpload 
                    onUpload={handleTestIconUpload}
                    label="Тестовая иконка"
                    description="Загрузите иконку для проверки сохранения в базе данных"
                    accept="image/png, image/jpeg, image/gif"
                    initialUrl={testIconUrl}
                  />
                </div>

                {testIconUrl && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Шаг 2: Проверка сохранения в базе данных</h3>
                    <Button 
                      onClick={handleTestIconRetrieval}
                      disabled={testingIcon || !testIconUrl}
                      className="w-full"
                    >
                      {testingIcon ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Проверка...
                        </>
                      ) : (
                        "Проверить сохранение в базе данных"
                      )}
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      Это обновит иконку для тестового сервиса и проверит, что она правильно сохраняется и извлекается из базы данных.
                    </p>
                  </div>
                )}

                {testIconData && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Информация о тестовой иконке</h3>
                    <div className="bg-muted p-3 rounded-md">
                      <p><span className="font-medium">URL:</span> {testIconUrl}</p>
                      <p><span className="font-medium">Размер Base64:</span> {testIconData.length} символов</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Иконка успешно конвертирована в формат Base64 для хранения в базе данных
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}