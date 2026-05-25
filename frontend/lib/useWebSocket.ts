"use client";

import { useEffect, useState } from "react";

export interface RunEvent {
  type?: string;
  event_type?: string;
  content?: string;
  tokens_used?: number;
  [key: string]: unknown;
}

type ConnectionState = "connecting" | "open" | "closed" | "error";

function websocketUrl(runId: string): string {
  const configuredUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (configuredUrl) {
    return `${configuredUrl}/ws/runs/${runId}`;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.hostname}:8000/ws/runs/${runId}`;
}

export function useWebSocket(runId: string) {
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [status, setStatus] = useState<ConnectionState>("connecting");

  useEffect(() => {
    setEvents([]);
    setStatus("connecting");

    const socket = new WebSocket(websocketUrl(runId));
    socket.onopen = () => setStatus("open");
    socket.onmessage = (message) => {
      const event = JSON.parse(message.data) as RunEvent;
      setEvents((current) => [...current, event]);
    };
    socket.onerror = () => setStatus("error");
    socket.onclose = () => setStatus("closed");

    return () => socket.close();
  }, [runId]);

  return { events, status };
}
