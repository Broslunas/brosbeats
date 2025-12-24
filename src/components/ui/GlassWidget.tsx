import { cn } from "@/lib/utils";
import React from "react";

interface GlassWidgetProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  intensity?: "low" | "medium" | "high";
}

export function GlassWidget({ 
  children, 
  className, 
  intensity = "medium",
  ...props 
}: GlassWidgetProps) {
  
  const intensityClasses = {
    low: "bg-white/5 backdrop-blur-sm",
    medium: "bg-white/10 backdrop-blur-md",
    high: "bg-white/15 backdrop-blur-xl",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 shadow-lg transition-all duration-300 hover:border-white/20",
        intensityClasses[intensity],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function GlassHeader({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("px-6 py-4 border-b border-white/5", className)}>
      {children}
    </div>
  )
}

export function GlassContent({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("p-6", className)}>
      {children}
    </div>
  )
}
