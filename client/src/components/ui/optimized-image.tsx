import { useState } from "react";
import { useImageCache } from "@/hooks/use-image-cache";
import { Skeleton } from "@/components/ui/skeleton";

interface OptimizedImageProps {
  src: string | null;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  placeholder?: React.ReactNode;
}

// Оптимизированный компонент изображения с кэшированием
export const OptimizedImage = ({ 
  src, 
  alt, 
  className = "", 
  fallback,
  placeholder 
}: OptimizedImageProps) => {
  const { cachedUrl, isLoading, error } = useImageCache(src);
  const [imageError, setImageError] = useState(false);

  if (error || imageError) {
    return fallback || (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <span className="text-gray-400 text-xs">No icon</span>
      </div>
    );
  }

  if (isLoading || !cachedUrl) {
    return placeholder || <Skeleton className={className} />;
  }

  return (
    <img
      src={cachedUrl}
      alt={alt}
      className={className}
      onError={() => setImageError(true)}
      loading="lazy"
    />
  );
};