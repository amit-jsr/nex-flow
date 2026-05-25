const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface Agent {
  id: string;
  name: string;
  role: string | null;
  system_prompt: string;
  model: string;
  tools: string[];
  memory_enabled: boolean;
  max_tokens: number;
  temperature: number;
  channel: string | null;
  guardrails: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type AgentCreateInput = Omit<Agent, "id" | "created_at" | "updated_at">;

export interface Workflow {
  id: string;
  name: string;
  description: string | null;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowNode {
  id: string;
  agent_id: string;
  position?: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

export type WorkflowCreateInput = Omit<Workflow, "id" | "created_at" | "updated_at">;

export interface Run {
  id: string;
  workflow_id: string | null;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  input: string | null;
  output: string | null;
  total_tokens: number;
  total_cost_usd: number;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`NxFlow API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  listAgents: () => request<Agent[]>("/agents/"),
  getAgent: (id: string) => request<Agent>(`/agents/${id}`),
  createAgent: (agent: AgentCreateInput) =>
    request<Agent>("/agents/", { method: "POST", body: JSON.stringify(agent) }),
  listWorkflows: () => request<Workflow[]>("/workflows/"),
  getWorkflow: (id: string) => request<Workflow>(`/workflows/${id}`),
  createWorkflow: (workflow: WorkflowCreateInput) =>
    request<Workflow>("/workflows/", { method: "POST", body: JSON.stringify(workflow) }),
  getRun: (id: string) => request<Run>(`/runs/${id}`),
  startRun: (workflowId: string, input: string) =>
    request<Run>(`/workflows/${workflowId}/runs`, {
      method: "POST",
      body: JSON.stringify({ input }),
    }),
};
