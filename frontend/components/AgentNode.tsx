import type { Agent } from "../lib/api";


export default function AgentNode({ agent }: { agent: Pick<Agent, "name" | "model" | "role"> }) {
  return (
    <div className="wf-node" style={{ position: "relative", left: "auto", top: "auto" }}>
      <div className="wf-port in" />
      <div className="wf-node-icon">AI</div>
      <div className="wf-node-name">{agent.name}</div>
      <div className="wf-node-type">{agent.role ?? agent.model}</div>
      <div className="wf-port out" />
    </div>
  );
}
