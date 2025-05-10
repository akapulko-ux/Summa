import { useState, useRef } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { UploadIcon, XIcon, ImageIcon, Loader2 } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

interface FileUploadProps {
  onUpload: (url: string) => void;
  initialUrl?: string;
  label?: string;
  accept?: string;
  description?: string;
}

export function FileUpload({
  onUpload,
  initialUrl,
  label,
  accept = "image/*",
  description,
}: FileUploadProps) {
  const { t } = useTranslations();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      // Показываем превью загружаемого файла
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Создаем FormData для отправки файла
      const formData = new FormData();
      formData.append("icon", file);

      // Отправляем файл на сервер
      const response = await fetch("/api/upload/icon", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.statusText}`);
      }

      const data = await response.json();
      setPreviewUrl(data.iconUrl);
      onUpload(data.iconUrl); // Передаем URL обратно в родительский компонент
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке файла");
      console.error("Error uploading file:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      // Если есть URL файла и он загружен на сервер (начинается с /uploads/)
      if (previewUrl && previewUrl.startsWith('/uploads/')) {
        // Удаляем файл с сервера
        await fetch(`/api/upload/icon?iconUrl=${encodeURIComponent(previewUrl)}`, {
          method: 'DELETE',
        });
      }
      
      // Очищаем URL в родительском компоненте
      setPreviewUrl(null);
      onUpload("");
      
      // Сбрасываем поле ввода файла
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error removing file:", error);
      setError("Ошибка при удалении файла");
    }
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}

      {!previewUrl ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept={accept}
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
              disabled={isUploading}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UploadIcon className="mr-2 h-4 w-4" />
              )}
              {t('common.uploadFile')}
            </Button>
          </div>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="relative aspect-video w-full max-w-xs overflow-hidden rounded-md border">
            {previewUrl.endsWith('.svg') || previewUrl.endsWith('.png') || 
             previewUrl.endsWith('.jpg') || previewUrl.endsWith('.jpeg') || 
             previewUrl.endsWith('.gif') ? (
              <img
                src={previewUrl}
                alt="Uploaded file"
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <ImageIcon className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute right-2 top-2 h-6 w-6 rounded-full"
              onClick={handleRemove}
            >
              <XIcon className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground break-all">{previewUrl}</p>
        </div>
      )}
    </div>
  );
}