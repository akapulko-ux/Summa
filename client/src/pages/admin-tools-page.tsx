import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "@/hooks/use-translations";
import { useState } from "react";

export default function AdminToolsPage() {
  const { t } = useTranslations();
  const [migratingIcons, setMigratingIcons] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{
    migrated: number;
    failed: number;
    message: string;
  } | null>(null);

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

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Инструменты администратора</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                disabled={migratingIcons}
                className="w-full"
              >
                {migratingIcons ? "Миграция..." : "Начать миграцию"}
              </Button>

              {migrationResult && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="font-medium">Результаты миграции:</p>
                  <p>Успешно перенесено: <span className="font-semibold text-green-600">{migrationResult.migrated}</span></p>
                  <p>Ошибок: <span className="font-semibold text-red-600">{migrationResult.failed}</span></p>
                  <p className="text-sm text-muted-foreground mt-2">{migrationResult.message}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}