import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface AnimatedLoaderProps {
  text?: string;
}

export function AnimatedLoader({ text = "Загрузка данных..." }: AnimatedLoaderProps) {
  return (
    <motion.div 
      className="flex flex-col items-center justify-center h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 0, 0]
        }}
        transition={{ 
          duration: 1.5, 
          ease: "easeInOut",
          repeat: Infinity,
        }}
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
      </motion.div>
      <motion.div
        className="text-sm text-muted-foreground"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {text}
      </motion.div>
    </motion.div>
  );
}