import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { SendIcon } from "lucide-react";

import { sendBroadcast } from "@/features/notifications/api/sendBroadcast";
import { sendTargeted } from "@/features/notifications/api/sendTargeted";
import type {
  BroadcastNotificationResponse,
  TargetedNotificationResponse,
} from "@/types/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/Card";
import { Toast } from "@/components/ui/Toast";
import { cn } from "@/utils/cn";

type Tab = "broadcast" | "targeted";

function useToast() {
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  return { toast, showToast, clearToast: () => setToast(null) };
}

export default function NotificationForm() {
  const [tab, setTab] = useState<Tab>("broadcast");

  // ── Broadcast state ──
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastResult, setBroadcastResult] =
    useState<BroadcastNotificationResponse | null>(null);

  // ── Targeted state ──
  const [targetedBusinessId, setTargetedBusinessId] = useState("");
  const [targetedTitle, setTargetedTitle] = useState("");
  const [targetedBody, setTargetedBody] = useState("");
  const [targetedResult, setTargetedResult] =
    useState<TargetedNotificationResponse | null>(null);

  const { toast, showToast, clearToast } = useToast();

  // ── Broadcast mutation ──
  const broadcastMutation = useMutation({
    mutationFn: sendBroadcast,
    onSuccess: (data) => {
      setBroadcastResult(data);
      showToast(`Broadcast sent to ${data.count} device(s).`, "success");
    },
    onError: () => {
      showToast("Failed to send broadcast notification.", "error");
    },
  });

  // ── Targeted mutation ──
  const targetedMutation = useMutation({
    mutationFn: sendTargeted,
    onSuccess: (data) => {
      setTargetedResult(data);
      showToast(
        data.success
          ? "Targeted notification sent successfully."
          : "Failed to send targeted notification.",
        data.success ? "success" : "error",
      );
    },
    onError: () => {
      showToast("Failed to send targeted notification.", "error");
    },
  });

  const handleBroadcast = () => {
    if (!broadcastTitle.trim() || !broadcastBody.trim()) return;
    setBroadcastResult(null);
    broadcastMutation.mutate({ title: broadcastTitle, body: broadcastBody });
  };

  const handleTargeted = () => {
    if (
      !targetedBusinessId.trim() ||
      !targetedTitle.trim() ||
      !targetedBody.trim()
    )
      return;
    setTargetedResult(null);
    targetedMutation.mutate({
      businessId: targetedBusinessId,
      title: targetedTitle,
      body: targetedBody,
    });
  };

  const isBroadcastValid =
    broadcastTitle.trim().length > 0 && broadcastBody.trim().length > 0;
  const isTargetedValid =
    targetedBusinessId.trim().length > 0 &&
    targetedTitle.trim().length > 0 &&
    targetedBody.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* ── Toast ── */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={clearToast} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Send Notifications</CardTitle>
          <CardDescription>
            Push notifications to business owners via FCM.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* ── Tabs ── */}
          <div className="flex border-b mb-6">
            <button
              type="button"
              onClick={() => setTab("broadcast")}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                tab === "broadcast"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              Broadcast
            </button>
            <button
              type="button"
              onClick={() => setTab("targeted")}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                tab === "targeted"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              Targeted
            </button>
          </div>

          {/* ── Broadcast Tab ── */}
          {tab === "broadcast" && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="broadcast-title"
                  className="block text-sm font-medium mb-1"
                >
                  Title
                </label>
                <Input
                  id="broadcast-title"
                  type="text"
                  placeholder="Notification title"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="broadcast-body"
                  className="block text-sm font-medium mb-1"
                >
                  Body
                </label>
                <Input
                  id="broadcast-body"
                  type="text"
                  placeholder="Notification message"
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                />
              </div>

              <Button
                onClick={handleBroadcast}
                disabled={!isBroadcastValid}
                loading={broadcastMutation.isPending}
              >
                <SendIcon className="h-4 w-4" />
                Send to All
              </Button>

              {broadcastResult && (
                <p className="text-sm text-muted-foreground">
                  Last broadcast sent to{" "}
                  <span className="font-semibold text-foreground">
                    {broadcastResult.count}
                  </span>{" "}
                  device(s).
                </p>
              )}
            </div>
          )}

          {/* ── Targeted Tab ── */}
          {tab === "targeted" && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="targeted-business-id"
                  className="block text-sm font-medium mb-1"
                >
                  Business ID
                </label>
                <Input
                  id="targeted-business-id"
                  type="text"
                  placeholder="e.g. biz_abc123"
                  value={targetedBusinessId}
                  onChange={(e) => setTargetedBusinessId(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="targeted-title"
                  className="block text-sm font-medium mb-1"
                >
                  Title
                </label>
                <Input
                  id="targeted-title"
                  type="text"
                  placeholder="Notification title"
                  value={targetedTitle}
                  onChange={(e) => setTargetedTitle(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="targeted-body"
                  className="block text-sm font-medium mb-1"
                >
                  Body
                </label>
                <Input
                  id="targeted-body"
                  type="text"
                  placeholder="Notification message"
                  value={targetedBody}
                  onChange={(e) => setTargetedBody(e.target.value)}
                />
              </div>

              <Button
                onClick={handleTargeted}
                disabled={!isTargetedValid}
                loading={targetedMutation.isPending}
              >
                <SendIcon className="h-4 w-4" />
                Send to Business
              </Button>

              {targetedResult && (
                <p className="text-sm text-muted-foreground">
                  Status:{" "}
                  <span
                    className={cn(
                      "font-semibold",
                      targetedResult.success
                        ? "text-green-600"
                        : "text-red-600",
                    )}
                  >
                    {targetedResult.success ? "Sent successfully" : "Failed"}
                  </span>
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
