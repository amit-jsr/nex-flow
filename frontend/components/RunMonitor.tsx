"use client";

import TokenUsageBar from "./TokenUsageBar";
import { useWebSocket } from "../lib/useWebSocket";


export default function RunMonitor({ runId }: { runId: string }) {
  const { events, status } = useWebSocket(runId);
  const tokens = events.reduce((total, event) => total + (event.tokens_used ?? 0), 0);

  return (
    <section className="panel">
      <div className="panel-hd">
        <span className="panel-title">Live Run Monitor</span>
        <span className="badge b-blue">{status}</span>
      </div>
      <div className="modal-body">
        <TokenUsageBar tokens={tokens} />
        <div className="term-body">
          {events.map((event, index) => (
            <div className="run-log-line" key={index}>
              <span className="t-info">[{event.event_type ?? event.type ?? "event"}]</span>
              <span>{event.content ?? JSON.stringify(event)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
