"use client";

import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";

const Loading = ({ isLoading }: { isLoading?: "loading" | "loaded" | "fetched" }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isLoading === "loading") {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) return prev;
          return prev + Math.random() * 5 + 3;
        });
      }, 100);

      return () => clearInterval(interval);
    } else if (isLoading === "fetched") {
      const timeout = setTimeout(() => setProgress(100), 300);
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  return (
    <div className="flex justify-center fixed z-50 w-screen space-x-5 items-center h-screen bg-zinc-900">
      {isLoading
        ? <Progress value={progress} className="absolute transition-all duration-150 left-0 top-0 h-[0.12rem] " />
        : <div className="absolute transition-all duration-150 left-0 top-0 h-[0.12rem] w-full"></div>
      }
      <div className="flex space-x-3 select-none hover:text-white text-zinc-300 transition-colors cursor-pointer">
        <img src="/linkaroo.png" alt="linkaroo-logo" width={54} />
        <span className="font-helvetica text-6xl">Linkaroo</span>
      </div>
    </div>
  );
};

export default Loading;
