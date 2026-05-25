import AgentNode from "./AgentNode";
import type { Agent, Workflow } from "../lib/api";


export default function WorkflowBuilder({
  workflow,
  agents,
}: {
  workflow: Pick<Workflow, "name" | "nodes">;
  agents: Agent[];
}) {
  const agentsById = new Map(agents.map((agent) => [agent.id, agent]));

  return (
    <section className="wf-canvas">
      <div className="wf-toolbar">
        <span>{workflow.name}</span>
      </div>
      <div className="wf-area" style={{ padding: 24, display: "flex", gap: 24 }}>
        {workflow.nodes.map((node) => {
          const agent = agentsById.get(node.agent_id);
          return agent ? <AgentNode agent={agent} key={node.id} /> : null;
        })}
      </div>
    </section>
  );
}
