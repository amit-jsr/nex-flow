"use client";

import { type FormEvent, useState } from "react";

import type { AgentCreateInput } from "../lib/api";

const defaultAgent: AgentCreateInput = {
  name: "",
  role: null,
  system_prompt: "",
  model: "gpt-4o",
  tools: [],
  memory_enabled: true,
  max_tokens: 2000,
  temperature: 0.7,
  channel: null,
  guardrails: {},
};

export default function AgentForm({
  initialValue = defaultAgent,
  onSubmit,
}: {
  initialValue?: AgentCreateInput;
  onSubmit: (agent: AgentCreateInput) => void | Promise<void>;
}) {
  const [agent, setAgent] = useState(initialValue);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(agent);
  }

  return (
    <form className="panel" onSubmit={submit}>
      <div className="panel-hd">
        <span className="panel-title">Agent Configuration</span>
      </div>
      <div className="modal-body">
        <label className="form-group">
          <span className="form-label">Agent Name</span>
          <input
            className="form-input"
            required
            value={agent.name}
            onChange={(event) => setAgent({ ...agent, name: event.target.value })}
          />
        </label>
        <label className="form-group">
          <span className="form-label">Model</span>
          <select
            className="form-input form-select"
            value={agent.model}
            onChange={(event) => setAgent({ ...agent, model: event.target.value })}
          >
            <optgroup label="OpenAI">
              <option value="gpt-5.4-nano">gpt-5.4-nano</option>
              <option value="gpt-5-nano">gpt-5-nano</option>
              <option value="gpt-5.4-mini">gpt-5.4-mini</option>
              <option value="gpt-5-mini">gpt-5-mini</option>
              <option value="gpt-5.5">gpt-5.5</option>
              <option value="gpt-5.4">gpt-5.4</option>
            </optgroup>
            <optgroup label="Anthropic">
              <option value="claude-3-5-haiku-20241022">claude-3-5-haiku-20241022</option>
              <option value="claude-3-haiku-20240307">claude-3-haiku-20240307</option>
              <option value="claude-sonnet-4-20250514">claude-sonnet-4-20250514</option>
              <option value="claude-3-7-sonnet-20250219">claude-3-7-sonnet-20250219</option>
              <option value="claude-opus-4-1-20250805">claude-opus-4-1-20250805</option>
              <option value="claude-opus-4-20250514">claude-opus-4-20250514</option>
            </optgroup>
            <optgroup label="xAI Grok">
              <option value="grok-4.3">grok-4.3</option>
              <option value="grok-4-fast-non-reasoning">grok-4-fast-non-reasoning</option>
              <option value="grok-build-0.1">grok-build-0.1</option>
              <option value="grok-4-fast-reasoning">grok-4-fast-reasoning</option>
              <option value="grok-3-mini">grok-3-mini</option>
              <option value="grok-3-mini-high">grok-3-mini-high</option>
            </optgroup>
          </select>
        </label>
        <label className="form-group">
          <span className="form-label">System Prompt</span>
          <textarea
            className="form-input form-textarea"
            required
            value={agent.system_prompt}
            onChange={(event) => setAgent({ ...agent, system_prompt: event.target.value })}
          />
        </label>
      </div>
      <div className="modal-ft">
        <button className="btn btn-primary" type="submit">
          Save Agent
        </button>
      </div>
    </form>
  );
}
