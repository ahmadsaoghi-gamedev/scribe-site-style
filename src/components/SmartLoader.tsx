import React from "react";
import { cn } from "@/lib/utils";

interface SmartLoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}

/**
 * World-Class Loading Component
 * Features a sophisticated 'heartbeat' pulse animation with multiple layers
 * for a premium, high-fidelity aesthetic.
 */
export const SmartLoader: React.FC<SmartLoaderProps> = ({ 
  className, 
  size = "md",
  label 
}) => {
  const sizeMap = {
    sm: "h-6 w-6",
    md: "h-12 w-12",
    lg: "h-20 w-20"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4", className)}>
      <div className={cn("relative", sizeMap[size])}>
        {/* Outer Glow Pulse */}
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
        
        {/* Core Heartbeat Ring */}
        <div className="absolute inset-0 rounded-full border-2 border-primary/40 animate-[pulse_1.5s_ease-in-out_infinite]" />
        
        {/* Inner Solid Beat */}
        <div className="absolute inset-[25%] rounded-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)] animate-[heartbeat_1.5s_ease-in-out_infinite]" />
      </div>
      
      {label && (
        <p className="text-sm font-medium text-muted-foreground animate-pulse tracking-wide uppercase">
          {label}
        </p>
      )}
    </div>
  );
};

export const FullPageLoader = ({ label = "Sinkronisasi Data..." }: { label?: string }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-500">
    <SmartLoader size="lg" label={label} />
  </div>
);
