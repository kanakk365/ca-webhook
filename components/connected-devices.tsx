"use client";

import { useEffect, useState, useCallback } from "react";
import { Unplug, Watch, Smartphone, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TerraUser {
  user_id: string;
  provider: string;
  active: boolean;
  last_webhook_update: string | null;
  reference_id: string | null;
}

function providerIcon(provider: string) {
  const name = provider?.toLowerCase() || "";
  if (name.includes("apple") || name.includes("samsung") || name.includes("health"))
    return <Smartphone className="w-4 h-4" />;
  return <Watch className="w-4 h-4" />;
}

function providerColor(provider: string) {
  const name = provider?.toLowerCase() || "";
  if (name.includes("apple")) return "bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200";
  if (name.includes("garmin")) return "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300";
  if (name.includes("fitbit")) return "bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300";
  if (name.includes("samsung")) return "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300";
  if (name.includes("google")) return "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300";
  if (name.includes("oura")) return "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300";
  return "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300";
}

export default function ConnectedDevices() {
  const [users, setUsers] = useState<TerraUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/terra/users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      setError("Failed to load connected devices.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleDisconnect(userId: string) {
    setDisconnecting(userId);
    try {
      const res = await fetch(`/api/terra/deauthenticate?user_id=${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        // Remove from list immediately
        setUsers((prev) => prev.filter((u) => u.user_id !== userId));
      } else {
        const data = await res.json();
        setError(data.error || "Failed to disconnect device.");
      }
    } catch {
      setError("An error occurred while disconnecting.");
    } finally {
      setDisconnecting(null);
    }
  }

  return (
    <div
      className={cn(
        "w-full",
        "bg-white dark:bg-zinc-900/70",
        "border border-zinc-100 dark:border-zinc-800",
        "rounded-xl shadow-sm backdrop-blur-xl",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Connected Devices
          </h2>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            {users.length} device{users.length !== 1 ? "s" : ""} linked
          </p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          title="Refresh"
          className={cn(
            "p-1.5 rounded-lg transition-all duration-200",
            "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100",
            "hover:bg-zinc-100 dark:hover:bg-zinc-800",
            loading && "animate-spin"
          )}
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="p-3">
        {error && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {loading && users.length === 0 ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-14 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse"
              />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Watch className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mb-2" />
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">No devices connected</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              Connect a wearable using the Connect Device option.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {users.map((user) => (
              <div
                key={user.user_id}
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-lg",
                  "hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                  "transition-all duration-200 group",
                )}
              >
                {/* Provider icon */}
                <div className={cn("p-2 rounded-lg shrink-0", providerColor(user.provider))}>
                  {providerIcon(user.provider)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-medium text-zinc-900 dark:text-zinc-100 capitalize truncate">
                      {user.provider?.replace(/_/g, " ") || "Unknown Device"}
                    </h3>
                    {user.active ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="w-3 h-3 text-zinc-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    {user.last_webhook_update
                      ? `Last sync: ${new Date(user.last_webhook_update).toLocaleDateString()}`
                      : "Never synced"}
                  </p>
                </div>

                {/* Disconnect button */}
                <button
                  onClick={() => handleDisconnect(user.user_id)}
                  disabled={disconnecting === user.user_id}
                  title="Disconnect device"
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg",
                    "text-[11px] font-medium",
                    "border border-red-200 dark:border-red-800/60",
                    "text-red-600 dark:text-red-400",
                    "hover:bg-red-50 dark:hover:bg-red-900/20",
                    "transition-all duration-200",
                    "opacity-0 group-hover:opacity-100",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                >
                  {disconnecting === user.user_id ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Unplug className="w-3 h-3" />
                  )}
                  <span className="hidden sm:inline">
                    {disconnecting === user.user_id ? "Disconnecting…" : "Disconnect"}
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
