"use client";

import { useState, useCallback } from "react";
import { detectConnectorApp, KnownConnectorApp } from "@/utils/connectorDetector";
import axios from "axios";

export function useConnectorDetection() {
  const [promptOpen, setPromptOpen] = useState(false);
  const [targetApp, setTargetApp] = useState<KnownConnectorApp | null>(null);
  const [pendingProceed, setPendingProceed] = useState<(() => void) | null>(null);

  const checkUrlAndPrompt = useCallback(
    async (url: string, onProceed: () => void) => {
      const app = detectConnectorApp(url);
      if (!app) {
        onProceed();
        return;
      }

      // Check if already prompted in localStorage
      try {
        const prompted = JSON.parse(localStorage.getItem("linkaroo_prompted_connectors") || "{}");
        if (prompted[app.id]) {
          onProceed();
          return;
        }
      } catch (e) {}

      // Check if already connected via API
      try {
        const serverUrl = process.env.NEXT_PUBLIC_SERVER_API_URL || "http://localhost:8000/api/v1";
        const response = await axios.get(`${serverUrl}/connectors`, { withCredentials: true });
        const activeConnectors: Array<{ provider: string }> = response.data?.data || [];

        const isConnected = activeConnectors.some(
          (c) => c.provider.toUpperCase() === app.id.toUpperCase()
        );

        if (isConnected) {
          onProceed();
          return;
        }
      } catch (e) {
        // If API check fails, proceed
      }

      // Show connector prompt modal
      setTargetApp(app);
      setPendingProceed(() => onProceed);
      setPromptOpen(true);
    },
    []
  );

  const handleContinueAdd = () => {
    if (pendingProceed) {
      pendingProceed();
      setPendingProceed(null);
    }
  };

  const handleClose = () => {
    setPromptOpen(false);
  };

  return {
    promptOpen,
    targetApp,
    checkUrlAndPrompt,
    handleContinueAdd,
    handleClose,
  };
}
