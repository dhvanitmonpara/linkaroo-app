"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KnownConnectorApp } from "@/utils/connectorDetector";
import { Plug, Zap, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";

interface ConnectorPromptModalProps {
  open: boolean;
  app: KnownConnectorApp | null;
  onClose: () => void;
  onContinueAdd: () => void;
  onConnectedSuccess?: () => void;
}

export default function ConnectorPromptModal({
  open,
  app,
  onClose,
  onContinueAdd,
  onConnectedSuccess,
}: ConnectorPromptModalProps) {
  const [step, setStep] = useState<"prompt" | "connect">("prompt");
  const [tokenInput, setTokenInput] = useState("");
  const [connecting, setConnecting] = useState(false);

  if (!app) return null;

  const handleOpenConnect = () => {
    setStep("connect");
    setTokenInput("");
  };

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      toast.error("Please enter a valid access token.");
      return;
    }

    try {
      setConnecting(true);
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_API_URL || "http://localhost:8000/api/v1";

      const response = await axios.post(
        `${serverUrl}/connectors/connect`,
        {
          provider: app.id,
          token: tokenInput.trim(),
        },
        { withCredentials: true }
      );

      if (response.status === 200) {
        toast.success(`Connected ${app.name} integration!`);
        // Mark as prompted
        try {
          const prompted = JSON.parse(localStorage.getItem("linkaroo_prompted_connectors") || "{}");
          prompted[app.id] = true;
          localStorage.setItem("linkaroo_prompted_connectors", JSON.stringify(prompted));
        } catch (e) {}

        onConnectedSuccess && onConnectedSuccess();
        onContinueAdd();
        onClose();
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data?.error || "Failed to connect integration.");
      } else {
        toast.error("Failed to connect integration.");
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleSkip = () => {
    try {
      const prompted = JSON.parse(localStorage.getItem("linkaroo_prompted_connectors") || "{}");
      prompted[app.id] = true;
      localStorage.setItem("linkaroo_prompted_connectors", JSON.stringify(prompted));
    } catch (e) {}

    onContinueAdd();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-indigo-950/80 border border-indigo-800/60 text-indigo-400">
              <Plug className="w-5 h-5" />
            </span>
            <DialogTitle className="text-lg font-bold text-white">
              {step === "prompt" ? `Connect ${app.name}?` : `Authenticate ${app.name}`}
            </DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400 text-xs leading-relaxed">
            {step === "prompt"
              ? `You pasted a ${app.name} link! Connecting your ${app.name} account allows Linkaroo to mount it as a synchronized data source.`
              : `Enter your ${app.name} Personal Access Token or secret credentials to enable full synchronization.`}
          </DialogDescription>
        </DialogHeader>

        {step === "prompt" ? (
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800 space-y-1 text-xs text-zinc-300">
              <p className="font-semibold text-indigo-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Key Features
              </p>
              <p className="text-zinc-400 text-[11px] leading-normal">{app.description}</p>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="w-full sm:w-auto bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 text-xs"
              >
                Skip & Add Link Only
              </Button>
              <Button
                onClick={handleOpenConnect}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                <Zap className="w-3.5 h-3.5 mr-1.5" /> Connect {app.name} Account
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleConnectSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="token-input" className="text-xs font-medium text-zinc-200">
                {app.id === "GITHUB" ? "GitHub Personal Access Token (PAT)" : "Access Token / Secret"}
              </Label>
              <Input
                id="token-input"
                type="password"
                placeholder={app.id === "GITHUB" ? "ghp_xxxxxxxxxxxxxxxxxxxx" : "Enter credential token..."}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 text-xs"
              />
              <p className="text-[11px] text-zinc-500 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Credentials stored with 256-bit AES-GCM encryption.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep("prompt")}
                className="text-zinc-400 hover:bg-zinc-800 text-xs"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={connecting}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                {connecting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Authenticating...
                  </>
                ) : (
                  <>
                    Save & Enable <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
