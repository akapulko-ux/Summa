import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

type AnimatedLoaderProps = {
  text?: string;
  size?: "small" | "medium" | "large";
  color?: string;
};

export function AnimatedLoader({ text, size = "medium", color }: AnimatedLoaderProps) {
  // Определение размера в зависимости от параметра size
  const sizeMap = {
    small: "h-4 w-4",
    medium: "h-8 w-8",
    large: "h-12 w-12",
  };

  const loaderSize = sizeMap[size];
  const textSize = size === "small" ? "text-sm" : size === "large" ? "text-lg" : "text-base";

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          rotate: 360 
        }}
        transition={{ 
          duration: 1.5,
          repeat: Infinity,
          ease: "linear",
        }}
        className="relative"
      >
        <Loader2 className={`${loaderSize} animate-spin ${color || "text-primary"}`} />
      </motion.div>
      
      {text && (
        <motion.p 
          className={`${textSize} text-muted-foreground text-center max-w-xs`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}