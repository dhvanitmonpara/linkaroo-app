"use client";

import React from "react";
import { Globe } from "lucide-react";

interface ProcessingMetadataCardProps {
  url?: string;
  className?: string;
}

export const ProcessingMetadataCard: React.FC<ProcessingMetadataCardProps> = ({
  url,
  className = "",
}) => {
  let hostname = "";
  if (url) {
    try {
      hostname = new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
    } catch {
      hostname = url.length > 28 ? `${url.substring(0, 25)}...` : url;
    }
  }

  return (
    <div
      className={`break-inside-avoid mb-3 group relative w-full flex flex-col rounded-2xl bg-muted/40 backdrop-blur-md border border-border/60 shadow-xs overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Precision Hairline Laser Beam */}
      <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_rgba(52,211,153,0.85)] z-30 pointer-events-none animate-laser-scan" />

      {/* Media Canvas Skeleton */}
      <div className="w-full aspect-video border-b border-border/50 bg-muted/30 relative overflow-hidden flex flex-col items-center justify-center space-y-2 p-4">
        {/* Soft background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent animate-pulse pointer-events-none" />

        {/* Minimal pill indicator */}
        <div className="relative z-10 flex items-center space-x-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-md border border-border/50 shadow-xs">
          <Globe className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
          <span className="text-xs text-muted-foreground font-mono truncate max-w-[180px]">
            {hostname || "scanning source..."}
          </span>
        </div>
      </div>

      {/* Title & Description Skeleton */}
      <div className="w-full p-3.5 flex flex-col space-y-2 relative z-10">
        <div className="h-3.5 w-4/5 rounded bg-muted/80" />
        <div className="h-2.5 w-3/5 rounded bg-muted/40" />
      </div>
    </div>
  );
};

export default ProcessingMetadataCard;
