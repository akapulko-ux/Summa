import { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { UploadIcon, XIcon, ImageIcon, Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onUpload: (data: { iconUrl: string, iconData?: string, iconMimeType?: string }) => void;
  initialUrl?: string;
  serviceId?: number;
  label?: string;
  accept?: string;
  description?: string;
}

export function FileUpload({
  onUpload,
  initialUrl,
  serviceId,
  label,
  accept = "image/*",
  description,
}: FileUploadProps) {
  const { t } = useTranslations();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Update previewUrl when initialUrl changes (for example, when loading data)
  useEffect(() => {
      if (initialUrl) {
      setPreviewUrl(initialUrl);
    }
  }, [initialUrl]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      // Display the preview of the uploaded file
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("icon", file);
      
      // If service ID exists, add it to the request
      if (serviceId) {
        formData.append("serviceId", serviceId.toString());
      }

      // Send the file to the server
      const response = await fetch("/api/upload/icon", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload error: ${response.statusText}`);
      }

      const data = await response.json();
      setPreviewUrl(data.iconUrl);
      
      // Pass all data back to the parent component
      onUpload({
        iconUrl: data.iconUrl,
        iconData: data.iconData,
        iconMimeType: data.iconMimeType
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while uploading the file");
      console.error("Error uploading file:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      // Check if service ID exists (required for deletion)
      if (!serviceId) {
        setError("Cannot delete icon without service ID");
        return;
      }
      
      // Parameters for the deletion request
      const url = `/api/upload/icon?serviceId=${serviceId}`;
      
      // Delete the icon from the database
      const response = await fetch(url, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Deletion error: ${response.statusText}`);
      }
      
      // Clear URL and data in parent component
      setPreviewUrl(null);
      onUpload({ 
        iconUrl: "",
        iconData: "", 
        iconMimeType: "" 
      });
      
      // Reset the file input field
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      console.log("Icon successfully deleted from database");
    } catch (error) {
      console.error("Error removing icon:", error);
      setError(error instanceof Error ? error.message : "Error deleting icon");
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
          {/* Предпросмотр изображения */}
          <div className="relative aspect-square w-full max-w-[160px] overflow-hidden rounded-md border bg-white">
            {previewUrl.endsWith('.svg') || previewUrl.endsWith('.png') || 
             previewUrl.endsWith('.jpg') || previewUrl.endsWith('.jpeg') || 
             previewUrl.endsWith('.gif') || 
             previewUrl.startsWith('/api/service-icon/') ? (
              <img
                src={previewUrl}
                alt="Uploaded file"
                className="h-full w-full object-contain p-2"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <ImageIcon className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
            
            {/* Кнопка удаления иконки (крестик) */}
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute right-2 top-2 h-6 w-6 rounded-full shadow-sm"
              onClick={handleRemove}
              title={t('common.delete')}
            >
              <XIcon className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Кнопки управления под превью */}
          <div className="flex justify-between items-center">
            {previewUrl.startsWith('/api/service-icon/') && (
              <div className="text-sm text-green-600 flex items-center">
                <ImageIcon className="h-4 w-4 mr-1" />
                <span>{t('services.iconSavedInDatabase')}</span>
              </div>
            )}
            {!previewUrl.startsWith('/api/service-icon/') && (
              <p className="text-sm text-muted-foreground break-all max-w-[70%] truncate">
                {previewUrl}
              </p>
            )}
            
            <div className="flex gap-2">
              {/* Кнопка замены файла */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                title={t('common.edit')}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UploadIcon className="h-4 w-4" />
                )}
              </Button>
              
              {/* Кнопка удаления */}
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemove}
                disabled={isUploading}
                title={t('common.delete')}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Скрытый input для загрузки нового файла */}
          <Input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
            disabled={isUploading}
          />
          
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}