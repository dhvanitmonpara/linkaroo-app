"use client";

import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function TooltipContainer({
  children,
  tooltip,
  side = "top",
  wrapping = false,
  className = "",
}: {
  children: React.ReactNode;
  tooltip: string;
  side?: "top" | "right" | "bottom" | "left" | undefined;
  wrapping?: boolean;
  className?: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className={className} render={React.isValidElement(children) ? children : <span />}>
          {children}
        </TooltipTrigger>
        <TooltipContent side={side} className={wrapping ? "max-w-40 text-wrap" : ""}>
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default TooltipContainer;
