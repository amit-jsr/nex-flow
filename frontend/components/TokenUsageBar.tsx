export default function TokenUsageBar({
  tokens,
  limit = 10000,
}: {
  tokens: number;
  limit?: number;
}) {
  const percentage = Math.min(100, Math.round((tokens / limit) * 100));

  return (
    <div className="form-group">
      <div className="flex items-center" style={{ justifyContent: "space-between" }}>
        <span className="form-label">Token Usage</span>
        <span className="mono text-muted">
          {tokens.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div style={{ background: "var(--surface3)", borderRadius: 99, height: 7 }}>
        <div
          style={{
            background: "var(--accent)",
            borderRadius: 99,
            height: "100%",
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}
