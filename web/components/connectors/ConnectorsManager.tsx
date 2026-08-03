"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw, Plug, CheckCircle2, AlertCircle, ExternalLink, Zap, ShieldCheck, Database } from "lucide-react";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
import useProfileStore from "@/store/profileStore";

interface ProviderInfo {
  id: string;
  name: string;
  category: string;
  description: string;
  auth_type: string;
  capabilities: string[];
  is_supported: boolean;
}

interface ConnectorInstance {
  id: string;
  provider: string;
  state: string;
  health: {
    level: string;
    last_checked?: string;
    error_message?: string;
  };
  capabilities: string[];
}

export default function ConnectorsManager() {
  const { profile } = useProfileStore();
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [activeConnectors, setActiveConnectors] = useState<ConnectorInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Connection Dialog State
  const [selectedProvider, setSelectedProvider] = useState<ProviderInfo | null>(null);
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [connecting, setConnecting] = useState(false);

  const fetchConnectorData = async () => {
    try {
      setLoading(true);
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_API_URL || "http://localhost:8000/api/v1";

      const [provRes, connRes] = await Promise.all([
        axios.get(`${serverUrl}/connectors/providers`, { withCredentials: true }),
        axios.get(`${serverUrl}/connectors`, { withCredentials: true }),
      ]);

      if (provRes.data?.data) {
        setProviders(provRes.data.data);
      }
      if (connRes.data?.data) {
        setActiveConnectors(connRes.data.data);
      }
    } catch (err) {
      console.error("Failed to load connectors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectorData();
  }, []);

  const handleOpenConnect = (provider: ProviderInfo) => {
    if (!provider.is_supported) {
      toast.error(`${provider.name} connector will be supported in an upcoming release.`);
      return;
    }
    setSelectedProvider(provider);
    setTokenInput("");
    setIsConnectOpen(true);
  };

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider || !tokenInput.trim()) {
      toast.error("Please enter a valid credential token.");
      return;
    }

    try {
      setConnecting(true);
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_API_URL || "http://localhost:8000/api/v1";

      const response = await axios.post(
        `${serverUrl}/connectors/connect`,
        {
          provider: selectedProvider.id,
          token: tokenInput.trim(),
        },
        { withCredentials: true }
      );

      if (response.status === 200) {
        toast.success(`Successfully connected ${selectedProvider.name}!`);
        setIsConnectOpen(false);
        fetchConnectorData();
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data?.error || "Failed to connect integration.");
      } else {
        toast.error("Error establishing connector connection.");
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (instanceId: string, providerName: string) => {
    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_API_URL || "http://localhost:8000/api/v1";
      await axios.post(`${serverUrl}/connectors/${instanceId}/disconnect`, {}, { withCredentials: true });
      toast.success(`Disconnected ${providerName}.`);
      fetchConnectorData();
    } catch (err) {
      toast.error("Failed to disconnect connector.");
    }
  };

  const handleSyncNow = async (instanceId: string, providerName: string) => {
    try {
      setSyncingId(instanceId);
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_API_URL || "http://localhost:8000/api/v1";
      const response = await axios.post(
        `${serverUrl}/connectors/${instanceId}/sync`,
        { userId: profile._id },
        { withCredentials: true }
      );

      if (response.data?.data) {
        const result = response.data.data;
        toast.success(`Synced ${providerName}: ${result.items_imported ?? 0} items imported!`);
      } else {
        toast.success(`Sync completed for ${providerName}.`);
      }
      fetchConnectorData();
    } catch (err) {
      toast.error(`Sync failed for ${providerName}.`);
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="w-full space-y-6 text-zinc-100">
      <div className="flex flex-col space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Plug className="w-5 h-5 text-indigo-400" /> Third-Party Connectors
        </h2>
        <p className="text-sm text-zinc-400">
          Mount external services (GitHub, Google Drive, Notion, Slack) as canonical Linkaroo data sources.
        </p>
      </div>

      {/* Active Connectors Section */}
      {activeConnectors.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Active Integrations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeConnectors.map((conn) => (
              <Card key={conn.id} className="bg-zinc-900/90 border-zinc-800 text-zinc-100 shadow-sm">
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                      {conn.provider}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> {conn.state}
                      </span>
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400 mt-1">
                      Instance ID: {conn.id}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-zinc-300 pt-0">
                  <div className="flex items-center justify-between text-zinc-400 bg-zinc-950/60 p-2 rounded border border-zinc-800/60">
                    <span>Capabilities:</span>
                    <span className="font-mono text-[11px] text-indigo-300">
                      {conn.capabilities.join(", ") || "READ_ITEMS"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={syncingId === conn.id}
                      onClick={() => handleSyncNow(conn.id, conn.provider)}
                      className="bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-700 hover:text-white h-8 text-xs"
                    >
                      {syncingId === conn.id ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                      )}
                      Sync Now
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnect(conn.id, conn.provider)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-950/30 h-8 text-xs"
                    >
                      Disconnect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Provider Catalog Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
          <Database className="w-4 h-4 text-indigo-400" /> Available Service Connectors
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-zinc-400 text-sm">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading platform connectors...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {providers.map((provider) => (
              <Card
                key={provider.id}
                className="bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 transition-colors text-zinc-100 flex flex-col justify-between"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-white">
                      {provider.name}
                    </CardTitle>
                    {provider.is_supported ? (
                      <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                        Ready
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                        Platform Plugin
                      </span>
                    )}
                  </div>
                  <CardDescription className="text-xs text-zinc-400 line-clamp-2 mt-1">
                    {provider.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0 space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {provider.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="px-1.5 py-0.5 text-[10px] font-mono bg-zinc-950/80 text-zinc-400 border border-zinc-800 rounded"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleOpenConnect(provider)}
                    className={`w-full text-xs font-medium ${
                      provider.is_supported
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-800 cursor-not-allowed"
                    }`}
                  >
                    {provider.is_supported ? (
                      <>
                        <Zap className="w-3.5 h-3.5 mr-1.5" /> Connect {provider.name}
                      </>
                    ) : (
                      "Plugin Architecture"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Connector Credentials Modal */}
      <Dialog open={isConnectOpen} onOpenChange={setIsConnectOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plug className="w-5 h-5 text-indigo-400" /> Connect {selectedProvider?.name}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Provide credentials to mount {selectedProvider?.name} as a structured data source in Linkaroo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConnectSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="auth-token" className="text-xs font-medium text-zinc-200">
                {selectedProvider?.auth_type === "PERSONAL_ACCESS_TOKEN"
                  ? "Personal Access Token (PAT)"
                  : selectedProvider?.auth_type === "API_KEY"
                  ? "API Key Secret"
                  : "OAuth2 Access Token"}
              </Label>
              <Input
                id="auth-token"
                type="password"
                placeholder={
                  selectedProvider?.id === "GITHUB" ? "ghp_xxxxxxxxxxxxxxxxxxxx" : "Enter token..."
                }
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 text-xs placeholder:text-zinc-500"
              />
              <p className="text-[11px] text-zinc-500">
                Credentials are encrypted at rest using AES-256-GCM symmetric token encryption.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsConnectOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-xs"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={connecting}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
              >
                {connecting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Authenticating...
                  </>
                ) : (
                  "Save & Connect"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
