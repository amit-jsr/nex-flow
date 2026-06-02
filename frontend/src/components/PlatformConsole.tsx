"use client";

import { useEffect, useRef } from "react";

const markup = `<!-- MODALS -->\n\n<!-- CREATE / EDIT AGENT -->\n<div class=\"modal-overlay\" id=\"agentModal\">\n  <div class=\"modal agent-modal\">\n    <div class=\"modal-hd\">\n      <span class=\"modal-title\" id=\"agentModalTitle\">New Agent</span>\n      <button class=\"modal-close\" onclick=\"closeModal('agentModal')\">✕</button>\n    </div>\n    <div class=\"modal-body\">\n      <div class=\"form-row\">\n        <div class=\"form-group\">\n          <label class=\"form-label\">Agent Name *</label>\n          <input class=\"form-input\" id=\"f-agent-name\" placeholder=\"e.g. Research Agent\">\n        </div>\n        <div class=\"form-group\">\n          <label class=\"form-label\">App Icon</label>\n          <select class=\"form-input form-select\" id=\"f-agent-emoji\">\n            <optgroup label=\"Core agents\"><option value=\"bot\">AI Agent</option><option value=\"brain\">Reasoning Agent</option><option value=\"sparkles\">Creative Agent</option><option value=\"network\">Coordinator</option><option value=\"route\">Router</option><option value=\"workflow\">Orchestrator</option><option value=\"users\">Multi-Agent Team</option><option value=\"target\">Goal Tracker</option></optgroup>\n            <optgroup label=\"Knowledge and content\"><option value=\"search\">Search Agent</option><option value=\"globe\">Web Researcher</option><option value=\"book-open\">Knowledge Base</option><option value=\"file-text\">Document Reader</option><option value=\"newspaper\">News Analyst</option><option value=\"pen-line\">Writer</option><option value=\"list-checks\">Summarizer</option><option value=\"languages\">Translator</option></optgroup>\n            <optgroup label=\"Engineering and data\"><option value=\"code\">Code Agent</option><option value=\"terminal\">Terminal Agent</option><option value=\"database\">Database Agent</option><option value=\"table\">Spreadsheet Agent</option><option value=\"braces\">JSON Agent</option><option value=\"git-branch\">GitHub Agent</option><option value=\"folder\">File Agent</option><option value=\"server\">MCP Server Agent</option></optgroup>\n            <optgroup label=\"Operations\"><option value=\"shield-check\">QA Validator</option><option value=\"badge-check\">Compliance Reviewer</option><option value=\"activity\">Monitor</option><option value=\"bell\">Alert Agent</option><option value=\"clock\">Scheduler</option><option value=\"gauge\">Performance Analyst</option><option value=\"lock\">Security Agent</option><option value=\"wrench\">Support Agent</option></optgroup>\n            <optgroup label=\"Apps and actions\"><option value=\"send\">Telegram Agent</option><option value=\"mail\">Email Agent</option><option value=\"message-square\">Chat Agent</option><option value=\"slack\">Slack Agent</option><option value=\"webhook\">Webhook Agent</option><option value=\"plug\">Integration Agent</option><option value=\"calculator\">Calculator Agent</option><option value=\"credit-card\">Billing Agent</option></optgroup>\n          </select>\n        </div>\n      </div>\n      <div class=\"form-row\">\n        <div class=\"form-group\">\n          <label class=\"form-label\">Model *</label>\n          <select class=\"form-input form-select\" id=\"f-agent-model\">\n            <optgroup label=\"OpenAI\"><option>gpt-5.4-nano</option><option>gpt-5-nano</option><option>gpt-5.4-mini</option><option>gpt-5-mini</option><option>gpt-5.5</option><option>gpt-5.4</option></optgroup>\n            <optgroup label=\"Anthropic\"><option>claude-3-5-haiku-20241022</option><option>claude-3-haiku-20240307</option><option>claude-sonnet-4-20250514</option><option>claude-3-7-sonnet-20250219</option><option>claude-opus-4-1-20250805</option><option>claude-opus-4-20250514</option></optgroup>\n            <optgroup label=\"Groq\"><option>openai/gpt-oss-20b</option><option>llama-3.3-70b-versatile</option><option>openai/gpt-oss-120b</option><option>groq/compound</option><option>groq/compound-mini</option><option>llama-3.1-8b-instant</option></optgroup>\n            <optgroup label=\"Other\"><option>amazon.titan-text-express</option><option>meta.llama3-70b</option></optgroup>\n          </select>\n        </div>\n      </div>\n      <div class=\"form-row\">\n        <div class=\"form-group\">\n          <label class=\"form-label\">Personality / Tone</label>\n          <select class=\"form-input form-select\" id=\"f-agent-personality\">\n            <option>Professional</option><option>Friendly</option><option>Concise</option><option>Analytical</option><option>Creative</option>\n          </select>\n        </div>\n        <div class=\"form-group\">\n          <label class=\"form-label\">Memory</label>\n          <select class=\"form-input form-select\" id=\"f-agent-memory\">\n            <option>Off</option><option>Session</option><option>Project</option>\n          </select>\n        </div>\n      </div>\n      <div class=\"form-row\">\n        <div class=\"form-group\">\n          <label class=\"form-label\">Channel</label>\n          <select class=\"form-input form-select\" id=\"f-agent-channel\">\n            <option>None</option><option>Telegram</option><option>Slack</option><option>WhatsApp</option>\n          </select>\n        </div>\n        <div class=\"form-group\">\n          <label class=\"form-label\">Max Tool Calls</label>\n          <input class=\"form-input\" id=\"f-agent-tool-calls\" type=\"number\" value=\"8\" min=\"0\" max=\"50\">\n        </div>\n      </div>\n      <div class=\"form-group\">\n        <label class=\"form-label\">Goal</label>\n        <input class=\"form-input\" id=\"f-agent-desc\" placeholder=\"What should this agent accomplish?\">\n      </div>\n      <div class=\"form-group\">\n        <label class=\"form-label\">System Prompt *</label>\n        <textarea class=\"form-input form-textarea\" id=\"f-agent-prompt\" rows=\"4\" placeholder=\"You are a helpful AI agent that...&#10;&#10;Your primary responsibilities are:&#10;- ...\"></textarea>\n      </div>\n      <div class=\"form-group\">\n        <label class=\"form-label\">Output Format</label>\n        <select class=\"form-input form-select\" id=\"f-agent-output-format\">\n          <option>Plain text</option><option>Markdown</option><option>JSON</option><option>Bullets</option><option>Table</option>\n        </select>\n      </div>\n      <div class=\"form-group\">\n        <label class=\"form-label\">Tools</label>\n        <div class=\"tool-grid\" id=\"f-agent-tools\"></div>\n      </div>\n      <div class=\"form-row agent-limits-row\">\n        <div class=\"form-group\">\n          <label class=\"form-label\">Timeout Seconds</label>\n          <input class=\"form-input\" id=\"f-agent-timeout\" type=\"number\" value=\"120\" min=\"10\" max=\"3600\">\n        </div>\n        <div class=\"form-group\">\n          <label class=\"form-label\">Max Tokens</label>\n          <input class=\"form-input\" id=\"f-agent-tokens\" type=\"number\" value=\"1024\" min=\"256\" max=\"8192\" step=\"256\">\n        </div>\n        <div class=\"form-group\">\n          <label class=\"form-label\">Temperature</label>\n          <input class=\"form-input\" id=\"f-agent-temp\" type=\"number\" value=\"0.7\" min=\"0\" max=\"1\" step=\"0.1\">\n        </div>\n      </div>\n    </div>\n    <div class=\"modal-ft\">\n      <button class=\"btn btn-ghost\" onclick=\"closeModal('agentModal')\">Cancel</button>\n      <button class=\"btn btn-primary\" onclick=\"saveAgent()\">\n        <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z\"/><polyline points=\"17 21 17 13 7 13 7 21\"/><polyline points=\"7 3 7 8 15 8\"/></svg>\n        Save Agent\n      </button>\n    </div>\n  </div>\n</div>\n\n<!-- CREATE / EDIT WORKFLOW -->\n<div class=\"modal-overlay\" id=\"workflowModal\">\n  <div class=\"modal\">\n    <div class=\"modal-hd\">\n      <span class=\"modal-title\" id=\"wfModalTitle\">New Workflow</span>\n      <button class=\"modal-close\" onclick=\"closeModal('workflowModal')\">✕</button>\n    </div>\n    <div class=\"modal-body\">\n      <div class=\"form-row\">\n        <div class=\"form-group\">\n          <label class=\"form-label\">Workflow Name *</label>\n          <input class=\"form-input\" id=\"f-wf-name\" placeholder=\"e.g. Research Pipeline\">\n        </div>\n        <div class=\"form-group\">\n          <label class=\"form-label\">App Icon</label>\n          <select class=\"form-input form-select\" id=\"f-wf-icon\">\n            <optgroup label=\"Flow types\">\n              <option value=\"workflow\">Workflow</option>\n              <option value=\"zap\">Automation</option>\n              <option value=\"route\">Routing Flow</option>\n              <option value=\"network\">Orchestration</option>\n              <option value=\"users\">Multi-Agent Flow</option>\n              <option value=\"target\">Goal Flow</option>\n            </optgroup>\n            <optgroup label=\"Timing and triggers\">\n              <option value=\"clock\">Scheduled Run</option>\n              <option value=\"repeat\">Recurring Run</option>\n              <option value=\"webhook\">Webhook Trigger</option>\n              <option value=\"plug\">Integration Trigger</option>\n            </optgroup>\n            <optgroup label=\"Data and review\">\n              <option value=\"database\">Data Pipeline</option>\n              <option value=\"braces\">Transform Flow</option>\n              <option value=\"folder\">File Pipeline</option>\n              <option value=\"shield-check\">Review Flow</option>\n              <option value=\"activity\">Monitoring Flow</option>\n              <option value=\"chart-line\">Reporting Flow</option>\n              <option value=\"server\">MCP Tool Flow</option>\n            </optgroup>\n          </select>\n        </div>\n      </div>\n      <div class=\"form-group\">\n        <label class=\"form-label\">Description</label>\n        <input class=\"form-input\" id=\"f-wf-desc\" placeholder=\"What does this workflow accomplish?\">\n      </div>\n      <div class=\"form-row\">\n        <div class=\"form-group\">\n          <label class=\"form-label\">Trigger</label>\n          <select class=\"form-input form-select\" id=\"f-wf-trigger\">\n            <option>manual</option><option>webhook</option><option>schedule</option><option>api</option><option>telegram</option>\n          </select>\n        </div>\n        <div class=\"form-group\">\n          <label class=\"form-label\">Max Retries</label>\n          <input class=\"form-input\" id=\"f-wf-retries\" type=\"number\" value=\"3\" min=\"0\" max=\"10\">\n        </div>\n      </div>\n      <div class=\"form-group\">\n        <label class=\"form-label\">Agents in Workflow</label>\n        <div id=\"f-wf-agents\" style=\"display:flex;flex-direction:column;gap:8px\"></div>\n        <button class=\"btn btn-ghost btn-sm\" style=\"margin-top:8px;align-self:flex-start\" onclick=\"addWfAgentRow()\">\n          <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><line x1=\"12\" y1=\"5\" x2=\"12\" y2=\"19\"/><line x1=\"5\" y1=\"12\" x2=\"19\" y2=\"12\"/></svg>\n          Add Step\n        </button>\n      </div>\n      <div class=\"form-group\">\n        <label class=\"form-label\">Notes</label>\n        <textarea class=\"form-input form-textarea\" id=\"f-wf-notes\" rows=\"3\" placeholder=\"Additional configuration or documentation...\"></textarea>\n      </div>\n    </div>\n    <div class=\"modal-ft\">\n      <button class=\"btn btn-ghost\" onclick=\"closeModal('workflowModal')\">Cancel</button>\n      <button class=\"btn btn-primary\" onclick=\"saveWorkflow()\">\n        <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z\"/><polyline points=\"17 21 17 13 7 13 7 21\"/><polyline points=\"7 3 7 8 15 8\"/></svg>\n        Save Workflow\n      </button>\n    </div>\n  </div>\n</div>\n\n<!-- TRIGGER RUN -->\n<div class=\"modal-overlay\" id=\"runModal\">\n  <div class=\"modal\">\n    <div class=\"modal-hd\">\n      <span class=\"modal-title\">Trigger Run</span>\n      <button class=\"modal-close\" onclick=\"closeModal('runModal')\">✕</button>\n    </div>\n    <div class=\"modal-body\">\n      <div class=\"form-group\">\n        <label class=\"form-label\">Workflow *</label>\n        <select class=\"form-input form-select\" id=\"f-run-wf\"></select>\n      </div>\n      <div class=\"form-group\">\n        <label class=\"form-label\">Input Message *</label>\n        <textarea class=\"form-input form-textarea\" id=\"f-run-msg\" rows=\"4\" placeholder=\"Enter the task or question for this run...\"></textarea>\n      </div>\n      <div class=\"form-group\">\n        <label class=\"form-label\">Session ID <span class=\"text-muted\">(optional)</span></label>\n        <input class=\"form-input\" id=\"f-run-session\" placeholder=\"Leave blank to auto-generate\">\n        <span class=\"form-hint\">Used for memory continuity across runs</span>\n      </div>\n    </div>\n    <div class=\"modal-ft\">\n      <button class=\"btn btn-ghost\" onclick=\"closeModal('runModal')\">Cancel</button>\n      <button class=\"btn btn-primary\" onclick=\"triggerRun()\">\n        <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><polygon points=\"5 3 19 12 5 21 5 3\"/></svg>\n        Start Run\n      </button>\n    </div>\n  </div>\n</div>\n\n<!-- VIEW AGENT DETAIL -->\n<div class=\"modal-overlay\" id=\"agentDetailModal\">\n  <div class=\"modal modal-lg\">\n    <div class=\"modal-hd\">\n      <span class=\"modal-title\">Agent Details</span>\n      <button class=\"modal-close\" onclick=\"closeModal('agentDetailModal')\">✕</button>\n    </div>\n    <div class=\"modal-body\" id=\"agentDetailBody\"></div>\n    <div class=\"modal-ft\">\n      <button class=\"btn btn-ghost\" onclick=\"closeModal('agentDetailModal')\">Close</button>\n      <button class=\"btn btn-primary\" id=\"agentDetailEditBtn\">Edit Agent</button>\n    </div>\n  </div>\n</div>\n\n<!-- VIEW RUN DETAIL -->\n<div class=\"modal-overlay\" id=\"runDetailModal\">\n  <div class=\"modal modal-lg\">\n    <div class=\"modal-hd\">\n      <span class=\"modal-title\">Run Detail</span>\n      <button class=\"modal-close\" onclick=\"closeModal('runDetailModal')\">✕</button>\n    </div>\n    <div class=\"modal-body\" id=\"runDetailBody\"></div>\n    <div class=\"modal-ft\">\n      <button class=\"btn btn-ghost\" onclick=\"closeModal('runDetailModal')\">Close</button>\n    </div>\n  </div>\n</div>\n\n<!-- NOTIFICATION -->\n<div class=\"notif\" id=\"notif\"></div>\n\n<!-- SHELL -->\n<div class=\"shell\">\n  <!-- SIDEBAR -->\n  <aside class=\"sidebar\">\n    <div class=\"sidebar-logo\">\n      <div class=\"logo-row\">\n        <div class=\"logo-gem\">\n          <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"white\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"5\" cy=\"7\" r=\"2\"/><circle cx=\"5\" cy=\"17\" r=\"2\"/><circle cx=\"19\" cy=\"12\" r=\"2\"/><path d=\"M7 7h3c2.5 0 3.4 5 6.8 5\"/><path d=\"M7 17h3c2.5 0 3.4-5 6.8-5\"/></svg>\n        </div>\n        <span class=\"logo-text\">NxFlow<span class=\"logo-slash\">/</span></span>\n      </div>\n    </div>\n    <div class=\"nav-section\">\n      <div class=\"nav-label\">Platform</div>\n      <button class=\"nav-btn active\" onclick=\"nav('dashboard',this)\">\n        <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><rect x=\"3\" y=\"3\" width=\"7\" height=\"7\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\"/><rect x=\"14\" y=\"14\" width=\"7\" height=\"7\"/><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\"/></svg>\n        Dashboard\n      </button>\n      <button class=\"nav-btn\" onclick=\"nav('agents',this)\">\n        <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><circle cx=\"12\" cy=\"8\" r=\"4\"/><path d=\"M4 20c0-4 3.6-7 8-7s8 3 8 7\"/></svg>\n        Agents <span class=\"nav-pill\" id=\"np-agents\">0</span>\n      </button>\n      <button class=\"nav-btn\" onclick=\"nav('workflows',this)\">\n        <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><circle cx=\"18\" cy=\"5\" r=\"3\"/><circle cx=\"6\" cy=\"12\" r=\"3\"/><circle cx=\"18\" cy=\"19\" r=\"3\"/><line x1=\"8.59\" y1=\"13.51\" x2=\"15.42\" y2=\"17.49\"/><line x1=\"15.41\" y1=\"6.51\" x2=\"8.59\" y2=\"10.49\"/></svg>\n        Workflows <span class=\"nav-pill\" id=\"np-workflows\">0</span>\n      </button>\n      <button class=\"nav-btn\" onclick=\"nav('tools',this)\">\n        <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.4 2.4-3-3 2.4-2.4Z\"/><path d=\"m15 15 6 6\"/></svg>\n        Tools\n      </button>\n      <button class=\"nav-btn\" onclick=\"nav('runs',this)\">\n        <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><polyline points=\"22 12 18 12 15 21 9 3 6 12 2 12\"/></svg>\n        Runs <span class=\"nav-pill\" id=\"np-runs\">0</span>\n      </button>\n\n      <div class=\"nav-label\">Integrations</div>\n      <button class=\"nav-btn\" onclick=\"nav('telegram',this)\">\n        <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"m22 2-7 20-4-9-9-4Z\"/><path d=\"M22 2 11 13\"/></svg>\n        Telegram\n      </button>\n      <button class=\"nav-btn\" onclick=\"nav('mcp',this)\">\n        <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71\"/><path d=\"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71\"/></svg>\n        MCP Servers\n      </button>\n\n      <div class=\"nav-label\">System</div>\n      <button class=\"nav-btn\" onclick=\"nav('settings',this)\">\n        <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z\"/></svg>\n        Settings\n      </button>\n    </div>\n    <div class=\"sidebar-bottom\">\n      <div class=\"status-row\"><div class=\"pulse\"></div><span id=\"active-agents-count\">Nx Lab. | © 2026</span></div>\n    </div>\n  </aside>\n\n  <main class=\"main\">\n    <!-- TOPBAR -->\n    <div class=\"topbar\">\n      <div class=\"tb-left\">\n        <h1><span id=\"page-title\">Dashboard</span><span class=\"title-sep\">/</span><span id=\"page-sub\">Agents, workflows, and recent execution activity</span></h1>\n      </div>\n      <div class=\"tb-right\" id=\"topbar-actions\"></div>\n    </div>\n\n    <!-- DASHBOARD -->\n    <div class=\"page active\" id=\"page-dashboard\">\n      <div class=\"content\">\n        <div class=\"stats\" id=\"dash-stats\"></div>\n        <div class=\"two-col\">\n          <div style=\"display:flex;flex-direction:column;gap:20px\">\n            <div class=\"panel\">\n              <div class=\"panel-hd\"><span class=\"panel-title\">Agents</span><span class=\"panel-link\" id=\"dash-agents-link\" onclick=\"nav('agents',document.querySelectorAll('.nav-btn')[1])\">Manage Agents →</span></div>\n              <div id=\"dash-agents\"></div>\n            </div>\n            <div class=\"panel\">\n              <div class=\"panel-hd\"><span class=\"panel-title\">Workflows</span><span class=\"panel-link\" onclick=\"nav('workflows',document.querySelectorAll('.nav-btn')[2])\">Manage Workflow →</span></div>\n              <div id=\"dash-workflows\"></div>\n            </div>\n          </div>\n          <div style=\"display:flex;flex-direction:column;gap:20px\">\n            <div class=\"panel\">\n              <div class=\"panel-hd\"><span class=\"panel-title\">Recent Runs</span><span class=\"panel-link\" onclick=\"nav('runs',document.querySelectorAll('.nav-btn')[4])\">View all →</span></div>\n              <div id=\"dash-runs\"></div>\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n\n    <!-- AGENTS PAGE -->\n    <div class=\"page\" id=\"page-agents\">\n      <div class=\"content\">\n        <div class=\"three-col\" id=\"agents-grid\"></div>\n      </div>\n    </div>\n\n    <!-- WORKFLOWS PAGE -->\n    <div class=\"page\" id=\"page-workflows\">\n      <div class=\"content\">\n        <div style=\"display:flex;flex-direction:column;gap:20px\">\n          <div class=\"panel\" id=\"wf-list-panel\">\n            <div class=\"panel-hd\"><span class=\"panel-title\">All Workflows</span></div>\n            <div id=\"wf-list-body\"></div>\n          </div>\n          <div class=\"wf-canvas\">\n            <div class=\"wf-toolbar\">\n              <span style=\"font-size:12px;font-weight:500;color:var(--text2)\">Workflow Builder</span>\n              <div style=\"display:flex;gap:8px;margin-left:auto\">\n                <button class=\"btn btn-ghost btn-sm\" onclick=\"clearCanvas()\">Clear</button>\n                <button class=\"btn btn-ghost btn-sm\" id=\"wf-select-btn\" onclick=\"setWfAgent()\">Select Agent →</button>\n                <button class=\"btn btn-primary btn-sm\" onclick=\"resetWfForm();openModal('workflowModal')\">\n                  <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" style=\"width:12px;height:12px\"><line x1=\"12\" y1=\"5\" x2=\"12\" y2=\"19\"/><line x1=\"5\" y1=\"12\" x2=\"19\" y2=\"12\"/></svg>\n                  New Workflow\n                </button>\n              </div>\n            </div>\n            <div class=\"wf-area\" id=\"wf-canvas\" onclick=\"canvasClick(event)\">\n              <svg id=\"wf-svg\" style=\"position:absolute;inset:0;width:100%;height:100%;pointer-events:none\"></svg>\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n\n    <!-- TOOLS PAGE -->\n    <div class=\"page\" id=\"page-tools\">\n      <div class=\"content\">\n        <div style=\"display:flex;flex-direction:column;gap:20px\">\n          <div class=\"stats\" id=\"tools-stats\"></div>\n          <div class=\"panel\">\n            <div class=\"panel-hd\">\n              <span class=\"panel-title\">Tool Registry</span>\n            </div>\n            <div id=\"tools-list\"></div>\n          </div>\n        </div>\n      </div>\n    </div>\n\n    <!-- RUNS PAGE -->\n    <div class=\"page\" id=\"page-runs\">\n      <div class=\"tabs\" id=\"runs-tabs\">\n        <div class=\"tab active\" onclick=\"filterRuns('all',this)\">Runs</div>\n        <div class=\"tab\" onclick=\"filterRuns('stream',this)\">Live Stream</div>\n        <div class=\"tab\" onclick=\"filterRuns('running',this)\">Running</div>\n        <div class=\"tab\" onclick=\"filterRuns('completed',this)\">Completed</div>\n        <div class=\"tab\" onclick=\"filterRuns('failed',this)\">Failed</div>\n      </div>\n      <div class=\"content\">\n        <div class=\"panel\" id=\"runs-table-panel\">\n          <table class=\"tbl\">\n            <thead><tr>\n              <th>Run ID</th><th>Message</th><th>Workflow</th><th>Status</th><th>Tokens</th><th>Duration</th><th>Started</th><th></th>\n            </tr></thead>\n            <tbody id=\"runs-tbody\"></tbody>\n          </table>\n        </div>\n        <div class=\"runs-stream-layout\" id=\"runs-stream-panel\" style=\"display:none\">\n          <div class=\"term runs-stream\">\n            <div class=\"term-bar\">\n              <div class=\"term-dots\"><div class=\"term-dot\" style=\"background:#f87171\"></div><div class=\"term-dot\" style=\"background:#fbbf24\"></div><div class=\"term-dot\" style=\"background:#4ade80\"></div></div>\n              <div class=\"term-title\">live stream · nxflow<span class=\"badge b-green\" style=\"font-size:9px;padding:1px 6px\"><div class=\"badge-dot\"></div>LIVE</span></div>\n              <button class=\"btn btn-ghost btn-sm\" onclick=\"clearRunStream()\">Clear</button>\n            </div>\n            <div class=\"term-body\" id=\"term-out\"></div>\n          </div>\n          <div class=\"panel runs-log-panel\">\n            <div class=\"panel-hd\"><span class=\"panel-title\">Run Logs</span><span class=\"panel-link\" onclick=\"filterRuns('all',document.querySelector('#runs-tabs .tab'))\">View table</span></div>\n            <div id=\"run-stream-logs\"></div>\n          </div>\n        </div>\n      </div>\n    </div>\n\n    <!-- TELEGRAM PAGE -->\n    <div class=\"page\" id=\"page-telegram\">\n      <div class=\"content\">\n        <div style=\"max-width:600px;display:flex;flex-direction:column;gap:20px\">\n          <div class=\"panel\">\n            <div class=\"panel-hd\"><span class=\"panel-title\">Telegram Bot Configuration</span></div>\n            <div style=\"padding:20px;display:flex;flex-direction:column;gap:16px\">\n              <div class=\"form-group\">\n                <label class=\"form-label\">Bot Token</label>\n                <input class=\"form-input\" type=\"password\" id=\"tg-token\" placeholder=\"1234567890:AAxxxxxxxxxxxxxx\">\n              </div>\n              <div class=\"form-group\">\n                <label class=\"form-label\">Webhook URL</label>\n                <input class=\"form-input\" id=\"tg-webhook\" placeholder=\"https://your-api.com/telegram/webhook\">\n              </div>\n              <div class=\"form-group\">\n                <label class=\"form-label\">Default Workflow</label>\n                <select class=\"form-input form-select\" id=\"tg-wf\"></select>\n              </div>\n              <button class=\"btn btn-primary\" style=\"align-self:flex-start\" onclick=\"saveTelegramConfig()\">Save & Register Webhook</button>\n            </div>\n          </div>\n          <div class=\"panel\">\n            <div class=\"panel-hd\"><span class=\"panel-title\">Commands</span></div>\n            <table class=\"tbl\">\n              <thead><tr><th>Command</th><th>Description</th></tr></thead>\n              <tbody>\n                <tr><td class=\"mono\">/start</td><td>Initialize the bot session</td></tr>\n                <tr><td class=\"mono\">/ask [message]</td><td>Send a task to the default workflow</td></tr>\n                <tr><td class=\"mono\">/status</td><td>Check current run status</td></tr>\n                <tr><td class=\"mono\">/history</td><td>Show recent runs for this chat</td></tr>\n              </tbody>\n            </table>\n          </div>\n        </div>\n      </div>\n    </div>\n\n    <!-- MCP PAGE -->\n    <div class=\"page\" id=\"page-mcp\">\n      <div class=\"content\"></div>\n    </div>\n\n    <!-- SETTINGS PAGE -->
    <div class="page" id="page-settings">
      <div class="content">
        <div class="settings-wrap settings-simple"></div>
      </div>
    </div>\n\n  </main>\n</div>`;
const inlineScript = "// ══════════════════════════════════════════\n// STATE\n// ══════════════════════════════════════════\nconst TOOLS_AVAILABLE = ['web_search','calculator','http_request','telegram','file_reader','sql_query','code_exec','email_send','slack_notify','http_batch_request','memory_lookup'];\nconst TOOL_REGISTRY = [\n  {id:'calculator',name:'Calculator',source:'Built-in',category:'Compute',provider:'NxFlow',status:'available',desc:'Deterministic arithmetic and unit calculations.'},\n  {id:'current_time',name:'Current Time',source:'Built-in',category:'Utility',provider:'NxFlow',status:'available',desc:'Resolve current time, dates, and timezone-aware timestamps.'},\n  {id:'http_request',name:'HTTP Request',source:'Built-in',category:'Actions',provider:'NxFlow',status:'available',desc:'Call REST APIs from agent workflows.'},\n  {id:'file_reader',name:'File Reader',source:'Built-in',category:'Data',provider:'NxFlow Files',status:'available',desc:'Read uploaded or local files for context.'},\n  {id:'json_parser',name:'JSON Parser',source:'Built-in',category:'Utility',provider:'NxFlow',status:'available',desc:'Validate, transform, and extract structured JSON payloads.'},\n  {id:'web_search',name:'Web Search',source:'Integration',category:'Search',provider:'Search provider',status:'connected',desc:'Find current web results and synthesize sources.'},\n  {id:'telegram',name:'Telegram',source:'Integration',category:'Messaging',provider:'Telegram',status:'needs_setup',desc:'Read and send Telegram bot messages.'},\n  {id:'xai_web_search',name:'Grok Web Search',source:'Integration',category:'Search',provider:'xAI',status:'needs_setup',desc:'Use xAI/Grok web search for fresh web context.'},\n  {id:'xai_x_search',name:'Grok X Search',source:'Integration',category:'Search',provider:'xAI',status:'needs_setup',desc:'Search posts and real-time context from X through xAI.'},\n  {id:'xai_code_execution',name:'Grok Code Execution',source:'Integration',category:'Compute',provider:'xAI',status:'needs_setup',desc:'Run code-backed analysis through xAI tool execution.'},\n  {id:'sql_query',name:'SQL Query',source:'Integration',category:'Data',provider:'Database',status:'needs_setup',desc:'Query connected SQL databases.'},\n  {id:'email_send',name:'Email Send',source:'Integration',category:'Messaging',provider:'SMTP',status:'needs_setup',desc:'Send email notifications or reports.'},\n  {id:'slack_notify',name:'Slack Notify',source:'Integration',category:'Messaging',provider:'Slack',status:'needs_setup',desc:'Post workflow updates into Slack channels.'},\n  {id:'code_exec',name:'Code Exec',source:'Built-in',category:'Compute',provider:'Sandbox',status:'disabled',desc:'Run code in a controlled execution sandbox.'},\n  {id:'mcp.github.search',name:'GitHub Search',source:'MCP',category:'Developer',provider:'GitHub MCP',status:'connected',desc:'Search repositories, issues, pull requests, and code via MCP.'},\n  {id:'mcp.filesystem.read',name:'Filesystem Read',source:'MCP',category:'Data',provider:'Filesystem MCP',status:'connected',desc:'Read files exposed by a configured MCP filesystem server.'},\n];\nlet DB = {\n  agents: [],\n  workflows: [],\n  runs: [],\n};\n\nlet editingAgentId = null;\nlet editingWfId = null;\nlet wfNodes = [];\nlet wfConnections = [];\nlet dragNode = null;\nlet dragOffset = {x:0,y:0};\nlet runFilter = 'all';\nlet termLines = [];\nlet termInterval = null;\n\n// ══════════════════════════════════════════\n// SEED DATA\n// ══════════════════════════════════════════\nfunction seed(){\n  DB.agents=[\n    {id:uid(),name:'Orchestrator',emoji:'workflow',model:'gpt-4o',role:'orchestrator',desc:'Routes tasks to specialist agents using Agent-as-Tool pattern.',prompt:'You are the orchestrator agent. Analyze user tasks and delegate to specialist agents.',tools:['web_search','http_request'],tokens:2048,temp:0.3,status:'active',runs:48,created:daysAgo(14)},\n    {id:uid(),name:'WebSearch Agent',emoji:'search',model:'gpt-4o',role:'specialist',desc:'Real-time web queries with result synthesis.',prompt:'You are a web search specialist. Find accurate, up-to-date information from the web.',tools:['web_search','calculator'],tokens:1024,temp:0.2,status:'busy',runs:112,created:daysAgo(14)},\n    {id:uid(),name:'Telegram Bot',emoji:'send',model:'gpt-4o-mini',role:'specialist',desc:'Handles Telegram webhooks and dispatches to orchestrator.',prompt:'You handle Telegram messages. Greet users and delegate tasks to the orchestrator.',tools:['telegram','http_request'],tokens:512,temp:0.5,status:'active',runs:73,created:daysAgo(10)},\n    {id:uid(),name:'Summarizer',emoji:'list-checks',model:'claude-3-haiku',role:'summarizer',desc:'Condenses multi-agent output into concise responses.',prompt:'You are a summarization specialist. Produce concise, accurate summaries.',tools:['calculator'],tokens:1024,temp:0.1,status:'idle',runs:61,created:daysAgo(7)},\n    {id:uid(),name:'QA Validator',emoji:'shield-check',model:'gpt-4o',role:'validator',desc:'Validates workflow outputs against quality criteria.',prompt:'You validate outputs for quality, accuracy, and completeness.',tools:['http_request'],tokens:512,temp:0.0,status:'idle',runs:29,created:daysAgo(5)},\n    {id:uid(),name:'HTTP Agent',emoji:'webhook',model:'gpt-4o-mini',role:'specialist',desc:'Executes REST API calls as part of workflow chains.',prompt:'You are an HTTP specialist. Execute API calls precisely and handle errors gracefully.',tools:['http_request','calculator'],tokens:512,temp:0.2,status:'active',runs:37,created:daysAgo(3)},\n  ];\n  DB.workflows=[\n    {id:uid(),name:'Research Pipeline',icon:'workflow',desc:'End-to-end research with web search and summarization.',trigger:'manual',retries:3,agents:[DB.agents[0].id,DB.agents[1].id,DB.agents[3].id],notes:'',created:daysAgo(12)},\n    {id:uid(),name:'Telegram Q&A',icon:'webhook',desc:'Answer user questions via Telegram.',trigger:'telegram',retries:2,agents:[DB.agents[2].id,DB.agents[0].id,DB.agents[3].id],notes:'',created:daysAgo(9)},\n    {id:uid(),name:'Data Fetch & Validate',icon:'database',desc:'Fetch data via HTTP and validate quality.',trigger:'schedule',retries:3,agents:[DB.agents[5].id,DB.agents[4].id],notes:'',created:daysAgo(6)},\n    {id:uid(),name:'Multi-Agent Research',icon:'users',desc:'Parallel research across multiple specialist agents.',trigger:'api',retries:5,agents:[DB.agents[0].id,DB.agents[1].id,DB.agents[5].id,DB.agents[4].id],notes:'',created:daysAgo(2)},\n  ];\n  const msgs=['Research latest AI agent frameworks','Summarize PDF for Telegram user','Fetch OpenAI pricing','Validate QA report','Answer /ask from @alice_doe','Analyze market trends Q2','Translate document ES→EN','Check API health endpoints','Generate weekly digest','Summarize meeting transcript'];\n  const statuses=['completed','completed','completed','failed','running','completed','completed','failed','completed','completed'];\n  DB.runs=msgs.map((m,i)=>({\n    id:'run_'+Math.random().toString(36).slice(2,8),\n    msg:m,\n    workflow:DB.workflows[i%DB.workflows.length].id,\n    status:statuses[i],\n    tokens:Math.floor(1000+Math.random()*9000),\n    duration:(Math.random()*4+0.5).toFixed(1)+'s',\n    started:minutesAgo(i*7+3),\n    logs:generateLogs(statuses[i]),\n  }));\n}\n\nfunction generateLogs(status){\n  const lines=[\n    {type:'info',agent:'orchestrator',msg:'Task received and parsed'},\n    {type:'tool',agent:'orchestrator',msg:'web_search(\"query\")'},\n    {type:'ok',agent:'orchestrator',msg:'Retrieved 6 results · 412ms'},\n    {type:'sub',agent:'orchestrator',msg:'→ Spawning specialist agent'},\n    {type:'info',agent:'specialist',msg:'Processing retrieved data'},\n    {type:'ok',agent:'specialist',msg:'Extraction complete · 1,840 tokens'},\n    {type:'sub',agent:'orchestrator',msg:'→ Spawning summarizer'},\n    {type:'info',agent:'summarizer',msg:'Compressing output'},\n  ];\n  if(status==='completed') lines.push({type:'ok',agent:'orchestrator',msg:'Run complete ✓'});\n  else if(status==='failed') lines.push({type:'err',agent:'orchestrator',msg:'Error: upstream timeout'});\n  else lines.push({type:'info',agent:'orchestrator',msg:'In progress…'});\n  return lines;\n}\n\n// ══════════════════════════════════════════\n// HELPERS\n// ══════════════════════════════════════════\nfunction uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}\nfunction daysAgo(n){const d=new Date();d.setDate(d.getDate()-n);return d.toLocaleDateString('en-US',{month:'short',day:'numeric'})}\nfunction minutesAgo(n){if(n<1)return 'just now';if(n<60)return n+'m ago';return Math.floor(n/60)+'h ago'}\nfunction agentById(id){return DB.agents.find(a=>a.id===id)}\nfunction wfById(id){return DB.workflows.find(w=>w.id===id)}\nfunction statusClass(s){return{completed:'b-green',running:'b-blue',failed:'b-red',active:'b-green',busy:'b-amber',idle:'b-muted'}[s]||'b-muted'}\nfunction agentColor(role){return{orchestrator:'#1a2540',specialist:'#1a2d20',summarizer:'#2a1d2a',validator:'#1d2a3a',default:'#201d2a'}[role]||'#201d2a'}\nfunction notify(msg,ok=true){const n=document.getElementById('notif');n.textContent=msg;n.className='notif '+(ok?'notif-ok':'notif-err');n.classList.add('show');setTimeout(()=>n.classList.remove('show'),2800)}\nconst ICON_ALIASES={'⚙️':'workflow','◇':'bot','◈':'workflow','✦':'sparkles','⧉':'network','⌕':'search','◎':'brain','▤':'file-text','✍️':'pen-line','≡':'list-checks','✓':'shield-check','◆':'badge-check','◷':'clock','!':'bell','↗':'webhook','✈️':'send','@':'mail','#':'calculator','<>':'code','S':'slack','◧':'database','{}':'braces','▣':'folder','G':'git-branch','M':'server','F':'folder','⚡':'zap','↻':'repeat'};\nconst ICON_LABELS={bot:'AI Agent',brain:'Reasoning',sparkles:'Creative',network:'Coordinator',route:'Router',workflow:'Orchestrator',users:'Team',target:'Goals',search:'Search',globe:'Web','book-open':'Knowledge','file-text':'Documents',newspaper:'News','pen-line':'Writer','list-checks':'Summary',languages:'Translate',code:'Code',terminal:'Terminal',database:'Database',table:'Spreadsheet',braces:'JSON','git-branch':'GitHub',folder:'Files',server:'MCP','shield-check':'QA','badge-check':'Compliance',activity:'Monitor',bell:'Alerts',clock:'Schedule',gauge:'Metrics',lock:'Security',wrench:'Support',send:'Telegram',mail:'Email','message-square':'Chat',slack:'Slack',webhook:'Webhook',plug:'Integration',calculator:'Calculator','credit-card':'Billing',zap:'Automation',repeat:'Repeat','chart-line':'Reporting'};\nconst ICONS={bot:'<path d=\"M12 8V4\"/><rect x=\"4\" y=\"8\" width=\"16\" height=\"12\" rx=\"3\"/><path d=\"M8 16h8\"/><path d=\"M9 12h.01\"/><path d=\"M15 12h.01\"/>',brain:'<path d=\"M8 6a3 3 0 0 0-3 3 3 3 0 0 0 0 6 3 3 0 0 0 3 3\"/><path d=\"M16 6a3 3 0 0 1 3 3 3 3 0 0 1 0 6 3 3 0 0 1-3 3\"/><path d=\"M8 6a4 4 0 0 1 8 0v12a4 4 0 0 1-8 0Z\"/>',sparkles:'<path d=\"m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8Z\"/><path d=\"m19 15 .8 1.7L21 17.5l-1.2.8L19 20l-.8-1.7-1.2-.8 1.2-.8Z\"/>',network:'<circle cx=\"12\" cy=\"5\" r=\"2\"/><circle cx=\"5\" cy=\"19\" r=\"2\"/><circle cx=\"19\" cy=\"19\" r=\"2\"/><path d=\"M10.8 6.7 6.2 17.3\"/><path d=\"m13.2 6.7 4.6 10.6\"/><path d=\"M7 19h10\"/>',route:'<circle cx=\"6\" cy=\"6\" r=\"2\"/><circle cx=\"18\" cy=\"18\" r=\"2\"/><path d=\"M8 6h5a3 3 0 0 1 0 6h-2a3 3 0 0 0 0 6h5\"/>',workflow:'<rect x=\"3\" y=\"4\" width=\"6\" height=\"6\" rx=\"1.5\"/><rect x=\"15\" y=\"14\" width=\"6\" height=\"6\" rx=\"1.5\"/><path d=\"M9 7h3a3 3 0 0 1 3 3v4\"/>',users:'<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"/><circle cx=\"9\" cy=\"7\" r=\"4\"/><path d=\"M22 21v-2a4 4 0 0 0-3-3.8\"/><path d=\"M16 3.2a4 4 0 0 1 0 7.6\"/>',target:'<circle cx=\"12\" cy=\"12\" r=\"8\"/><circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v4\"/><path d=\"M12 18v4\"/><path d=\"M2 12h4\"/><path d=\"M18 12h4\"/>',search:'<circle cx=\"11\" cy=\"11\" r=\"7\"/><path d=\"m20 20-4-4\"/>',globe:'<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M3 12h18\"/><path d=\"M12 3a14 14 0 0 1 0 18\"/><path d=\"M12 3a14 14 0 0 0 0 18\"/>','book-open':'<path d=\"M12 7v14\"/><path d=\"M3 5a6 6 0 0 1 6 0v14a6 6 0 0 0-6 0Z\"/><path d=\"M21 5a6 6 0 0 0-6 0v14a6 6 0 0 1 6 0Z\"/>','file-text':'<path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z\"/><path d=\"M14 2v6h6\"/><path d=\"M8 13h8\"/><path d=\"M8 17h5\"/>',newspaper:'<path d=\"M4 6h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z\"/><path d=\"M8 10h6\"/><path d=\"M8 14h8\"/><path d=\"M8 18h5\"/>','pen-line':'<path d=\"M12 20h9\"/><path d=\"M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z\"/>','list-checks':'<path d=\"m3 7 2 2 4-4\"/><path d=\"M11 7h10\"/><path d=\"m3 17 2 2 4-4\"/><path d=\"M11 17h10\"/>',languages:'<path d=\"m5 8 6 6\"/><path d=\"m4 14 6-6 2-3\"/><path d=\"M2 5h12\"/><path d=\"M22 22l-5-10-5 10\"/><path d=\"M14 18h6\"/>',code:'<path d=\"m16 18 6-6-6-6\"/><path d=\"m8 6-6 6 6 6\"/>',terminal:'<path d=\"m4 17 6-6-6-6\"/><path d=\"M12 19h8\"/>',database:'<ellipse cx=\"12\" cy=\"5\" rx=\"8\" ry=\"3\"/><path d=\"M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5\"/><path d=\"M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3\"/>',table:'<rect x=\"3\" y=\"4\" width=\"18\" height=\"16\" rx=\"2\"/><path d=\"M3 10h18\"/><path d=\"M9 4v16\"/><path d=\"M15 4v16\"/>',braces:'<path d=\"M8 3H6a2 2 0 0 0-2 2v3a2 2 0 0 1-2 2 2 2 0 0 1 2 2v3a2 2 0 0 0 2 2h2\"/><path d=\"M16 3h2a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2 2 2 0 0 0-2 2v3a2 2 0 0 1-2 2h-2\"/>','git-branch':'<line x1=\"6\" y1=\"3\" x2=\"6\" y2=\"15\"/><circle cx=\"6\" cy=\"18\" r=\"3\"/><circle cx=\"6\" cy=\"6\" r=\"3\"/><circle cx=\"18\" cy=\"6\" r=\"3\"/><path d=\"M9 6h3a6 6 0 0 1 6 6v6\"/>',folder:'<path d=\"M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7l-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z\"/>',server:'<rect x=\"3\" y=\"4\" width=\"18\" height=\"8\" rx=\"2\"/><rect x=\"3\" y=\"12\" width=\"18\" height=\"8\" rx=\"2\"/><path d=\"M7 8h.01\"/><path d=\"M7 16h.01\"/>','shield-check':'<path d=\"M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3Z\"/><path d=\"m9 12 2 2 4-5\"/>','badge-check':'<path d=\"M3.9 8.4 8.4 3.9h7.2l4.5 4.5v7.2l-4.5 4.5H8.4l-4.5-4.5Z\"/><path d=\"m8.5 12 2.5 2.5 5-5\"/>',activity:'<path d=\"M22 12h-4l-3 8-6-16-3 8H2\"/>',bell:'<path d=\"M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9\"/><path d=\"M13.7 21a2 2 0 0 1-3.4 0\"/>',clock:'<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7v5l3 2\"/>',gauge:'<path d=\"M12 14l4-4\"/><path d=\"M3.3 19a9 9 0 1 1 17.4 0\"/><path d=\"M7 19h10\"/>',lock:'<rect x=\"4\" y=\"11\" width=\"16\" height=\"10\" rx=\"2\"/><path d=\"M8 11V7a4 4 0 0 1 8 0v4\"/>',wrench:'<path d=\"M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-3 3-3-3Z\"/>',send:'<path d=\"m22 2-7 20-4-9-9-4Z\"/><path d=\"M22 2 11 13\"/>',mail:'<rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"2\"/><path d=\"m3 7 9 6 9-6\"/>','message-square':'<path d=\"M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z\"/>',slack:'<path d=\"M14.5 2v6.5\"/><path d=\"M9.5 15.5V22\"/><path d=\"M22 14.5h-6.5\"/><path d=\"M8.5 9.5H2\"/><path d=\"M17.5 8.5a3 3 0 0 0-3-3\"/><path d=\"M6.5 15.5a3 3 0 0 0 3 3\"/>',webhook:'<path d=\"M18 16.5a4 4 0 0 1-6.5 3\"/><path d=\"M6 7.5a4 4 0 0 1 6.5-3\"/><path d=\"M12 8a4 4 0 0 1 6 5\"/><path d=\"M12 16a4 4 0 0 1-6-5\"/><circle cx=\"18\" cy=\"16\" r=\"2\"/><circle cx=\"6\" cy=\"8\" r=\"2\"/>',plug:'<path d=\"M12 22v-5\"/><path d=\"M9 8V2\"/><path d=\"M15 8V2\"/><path d=\"M6 8h12v4a6 6 0 0 1-12 0Z\"/>',calculator:'<rect x=\"4\" y=\"2\" width=\"16\" height=\"20\" rx=\"2\"/><path d=\"M8 6h8\"/><path d=\"M8 10h.01\"/><path d=\"M12 10h.01\"/><path d=\"M16 10h.01\"/><path d=\"M8 14h.01\"/><path d=\"M12 14h.01\"/><path d=\"M16 14h.01\"/>','credit-card':'<rect x=\"2\" y=\"5\" width=\"20\" height=\"14\" rx=\"2\"/><path d=\"M2 10h20\"/>',zap:'<path d=\"M13 2 3 14h8l-1 8 11-13h-8Z\"/>',repeat:'<path d=\"m17 1 4 4-4 4\"/><path d=\"M3 11V9a4 4 0 0 1 4-4h14\"/><path d=\"m7 23-4-4 4-4\"/><path d=\"M21 13v2a4 4 0 0 1-4 4H3\"/>','chart-line':'<path d=\"M3 3v18h18\"/><path d=\"m7 14 4-4 4 3 5-7\"/>'};\nfunction normalizeIcon(id){return ICON_ALIASES[id]||id||'bot'}\nfunction iconLabel(id){return ICON_LABELS[normalizeIcon(id)]||'App'}\nfunction iconMark(id,cls='app-icon'){\n  const key=normalizeIcon(id);const path=ICONS[key];\n  if(!path) return '<span class=\"'+cls+'\">'+String(id||'A').slice(0,2)+'</span>';\n  return '<span class=\"'+cls+'\" title=\"'+iconLabel(key)+'\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\">'+path+'</svg></span>';\n}\n\n// ══════════════════════════════════════════\n// MODAL\n// ══════════════════════════════════════════\nfunction openModal(id){document.getElementById(id).classList.add('show')}\nfunction closeModal(id){document.getElementById(id).classList.remove('show')}\n\n// ══════════════════════════════════════════\n// NAVIGATION\n// ══════════════════════════════════════════\nconst PAGE_META={\n  dashboard:{title:'Dashboard',sub:'Agents, workflows, and recent execution activity'},\n  agents:{title:'Agents',sub:'Build and assign agent capabilities'},\n  workflows:{title:'Workflows',sub:'Build and manage pipelines'},\n  tools:{title:'Tools',sub:'Capabilities available to agents'},\n  runs:{title:'Runs',sub:'Live streams and execution logs'},\n  telegram:{title:'Telegram',sub:'Bot integration'},\n  mcp:{title:'MCP Servers',sub:'Model Context Protocol integrations'},\n  settings:{title:'Settings',sub:'Platform configuration'},\n};\n\nconst PAGE_ACTIONS={\n  agents:`<button class=\"btn btn-primary\" onclick=\"openAgentModal()\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" style=\"width:14px;height:14px\"><line x1=\"12\" y1=\"5\" x2=\"12\" y2=\"19\"/><line x1=\"5\" y1=\"12\" x2=\"19\" y2=\"12\"/></svg>New Agent</button>`,\n  workflows:`<button class=\"btn btn-primary\" onclick=\"openModal('workflowModal');resetWfForm()\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" style=\"width:14px;height:14px\"><line x1=\"12\" y1=\"5\" x2=\"12\" y2=\"19\"/><line x1=\"5\" y1=\"12\" x2=\"19\" y2=\"12\"/></svg>New Workflow</button>`,\n  tools:``,\n  runs:`<button class=\"btn btn-primary\" onclick=\"openModal('runModal');populateRunModal()\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" style=\"width:14px;height:14px\"><polygon points=\"5 3 19 12 5 21 5 3\"/></svg>Trigger Run</button>`,\n  dashboard:`<button class=\"btn btn-primary\" onclick=\"openModal('runModal');populateRunModal()\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" style=\"width:14px;height:14px\"><polygon points=\"5 3 19 12 5 21 5 3\"/></svg>New Run</button>`,\n};\n\nfunction nav(page, btn){\n  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));\n  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));\n  document.getElementById('page-'+page).classList.add('active');\n  if(btn) btn.classList.add('active');\n  document.getElementById('page-title').textContent=PAGE_META[page]?.title||page;\n  document.getElementById('page-sub').textContent=PAGE_META[page]?.sub||'';\n  document.getElementById('topbar-actions').innerHTML=PAGE_ACTIONS[page]||'';\n  renderPage(page);\n}\n\nfunction renderPage(page){\n  if(page==='dashboard') renderDashboard();\n  else if(page==='agents') renderAgentsGrid();\n  else if(page==='workflows') renderWorkflowsPage();\n  else if(page==='tools') renderToolsPage();\n  else if(page==='runs') renderRunsTable();\n  else if(page==='mcp') renderMcp();\n  else if(page==='telegram') renderTelegram();\n  else if(page==='settings') renderSettings();\n}\n\n// ══════════════════════════════════════════\n// DASHBOARD\n// ══════════════════════════════════════════\nfunction renderDashboard(){\n  const totalRuns=DB.runs.length;\n  const activeAgents=DB.agents.filter(a=>a.status==='active'||a.status==='busy').length;\n  const totalTokens=DB.runs.reduce((s,r)=>s+r.tokens,0);\n  const cost=(totalTokens/1000*0.003).toFixed(2);\n\n  document.getElementById('dash-stats').innerHTML=`\n    <div class=\"stat c-blue\"><div class=\"stat-label\">Total Runs</div><div class=\"stat-val\">${totalRuns}</div><div class=\"stat-sub\"><span class=\"stat-up\">↑ 23%</span> vs last week</div></div>\n    <div class=\"stat c-green\"><div class=\"stat-label\">Active Agents</div><div class=\"stat-val\">${activeAgents}</div><div class=\"stat-sub\">${DB.agents.length} total configured</div></div>\n    <div class=\"stat c-amber\"><div class=\"stat-label\">Avg Latency</div><div class=\"stat-val\">1.4s</div><div class=\"stat-sub\">p95: 3.2s · p99: 8.1s</div></div>\n    <div class=\"stat c-purple\"><div class=\"stat-label\">Token Usage</div><div class=\"stat-val\">${(totalTokens/1000).toFixed(0)}k</div><div class=\"stat-sub\">~${cost} estimated cost</div></div>\n  `;\n\n  document.getElementById('dash-agents-link').textContent=`Manage Agents →`;\n  document.getElementById('dash-agents').innerHTML=DB.agents.slice(0,5).map(a=>`\n    <div style=\"display:flex;align-items:center;gap:12px;padding:11px 16px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .12s\" onmouseenter=\"this.style.background='var(--surface2)'\" onmouseleave=\"this.style.background=''\" onclick=\"showAgentDetail('${a.id}')\">\n      <div class=\"avatar\" style=\"background:${agentColor(a.role)}\">${iconMark(a.emoji)}</div>\n      <div style=\"flex:1;min-width:0\"><div style=\"font-size:13px;font-weight:500\">${a.name}</div><div class=\"mono\" style=\"font-size:10.5px;color:var(--muted)\">${a.model}</div></div>\n      <span class=\"badge ${statusClass(a.status)}\"><div class=\"badge-dot\"></div>${a.status}</span>\n      <div class=\"mono\" style=\"font-size:11px;color:var(--muted)\">${a.runs}</div>\n    </div>`).join('');\n\n  document.getElementById('dash-runs').innerHTML=DB.runs.slice(0,5).map(r=>{\n    const wf=wfById(r.workflow);\n    return`<div style=\"padding:11px 16px;border-bottom:1px solid var(--border);cursor:pointer\" onclick=\"showRunDetail('${r.id}')\">\n      <div style=\"display:flex;justify-content:space-between;margin-bottom:3px\">\n        <span class=\"mono\" style=\"font-size:10.5px;color:var(--muted)\">${r.id}</span>\n        <span style=\"font-size:11px;color:var(--muted)\">${r.started}</span>\n      </div>\n      <div style=\"font-size:12.5px;margin-bottom:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis\">${r.msg}</div>\n      <div style=\"display:flex;align-items:center;gap:8px\">\n        <span class=\"badge ${statusClass(r.status)}\"><div class=\"badge-dot\"></div>${r.status}</span>\n        <span style=\"font-size:11px;color:var(--muted)\">↳ ${wf?.name||'—'}</span>\n        <span class=\"mono\" style=\"font-size:10.5px;color:var(--muted);margin-left:auto\">${r.tokens.toLocaleString()} tok</span>\n      </div>\n    </div>`;\n  }).join('');\n\n  document.getElementById('dash-workflows').innerHTML=DB.workflows.map(w=>`\n    <div style=\"display:flex;align-items:center;gap:12px;padding:11px 16px;border-bottom:1px solid var(--border);cursor:pointer\" onclick=\"nav('workflows',document.querySelectorAll('.nav-btn')[2])\">\n      <div style=\"width:32px;height:32px;border-radius:8px;background:var(--surface2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:15px;color:var(--accent)\">${iconMark(w.icon)}</div>\n      <div style=\"flex:1;min-width:0\"><div style=\"font-size:13px;font-weight:500\">${w.name}</div><div style=\"font-size:11px;color:var(--muted)\">${w.agents.length} agents · ${w.trigger}</div></div>\n      <span class=\"badge b-muted\">${w.trigger}</span>\n    </div>`).join('');\n\n  document.getElementById('active-agents-count').textContent='Nx Lab. | © 2026';\n  document.getElementById('np-agents').textContent=DB.agents.length;\n  document.getElementById('np-workflows').textContent=DB.workflows.length;\n  document.getElementById('np-runs').textContent=DB.runs.length;\n}\n\n// ══════════════════════════════════════════\n// TERMINAL SIMULATION\n// ══════════════════════════════════════════\nconst TERM_SCRIPT=[\n  ['t-ts','14:31:02'],['t-info','[orchestrator]'],'Received: \"Research AI agent frameworks\"',\n  ['t-ts','14:31:02'],['t-tool','[tool_call]'],'web_search(\"nxflow agent workflows\")',\n  ['t-ts','14:31:03'],['t-ok','[tool_result]'],'8 results fetched · 847ms · 312 tok',\n  ['t-ts','14:31:03'],['t-sub','[sub_agent]'],'→ Spawning WebSearch Agent',\n  ['t-ts','14:31:04'],['t-dim','[webSearch]'],'Fetching https://example.com/docs',\n  ['t-ts','14:31:05'],['t-ok','[webSearch]'],'Extracted 2,140 tokens',\n  ['t-ts','14:31:05'],['t-sub','[sub_agent]'],'→ Spawning Summarizer Agent',\n  ['t-ts','14:31:06'],['t-dim','[summarizer]'],'Compressing 2,140 → 320 tokens',\n  ['t-ts','14:31:07'],['t-ok','[complete]'],'Run finished ✓ · 8,420 tok · 1.4s',\n  ['t-ts','14:31:09'],['t-dim','——'],'Waiting for next run…',\n];\nlet termIdx=0;\nfunction startTerminal(){\n  if(termInterval) return;\n  const el=document.getElementById('term-out');\n  if(!el) return;\n  termInterval=setInterval(()=>{\n    if(!document.getElementById('term-out')){clearInterval(termInterval);termInterval=null;return;}\n    if(termIdx>=TERM_SCRIPT.length){termIdx=0;document.getElementById('term-out').innerHTML='';return;}\n    const item=TERM_SCRIPT[termIdx];\n    if(Array.isArray(item)){\n      const ts=item[1];const cls=item[0];\n      termIdx++;\n      const msgItem=TERM_SCRIPT[termIdx];\n      const msg=Array.isArray(msgItem)?'':(termIdx++,msgItem);\n      const nextCls=Array.isArray(TERM_SCRIPT[termIdx])?TERM_SCRIPT[termIdx][0]:'';\n      document.getElementById('term-out').innerHTML+=`<div class=\"run-log-line\"><span class=\"t-ts\">${ts}</span><span class=\"${cls}\">${TERM_SCRIPT[termIdx-2]?.[1]||''}</span><span>${msg}</span></div>`;\n    } else {\n      termIdx++;\n    }\n    const to=document.getElementById('term-out');\n    if(to) to.scrollTop=to.scrollHeight;\n  },700);\n}\n\n// ══════════════════════════════════════════\n// AGENTS\n// ══════════════════════════════════════════\nfunction renderAgentsGrid(){\n  const grid=document.getElementById('agents-grid');\n  if(!DB.agents.length){\n    grid.innerHTML=`<div class=\"empty\" style=\"grid-column:1/-1\"><div class=\"empty-icon\">🤖</div><div class=\"empty-title\">No agents yet</div><div class=\"empty-sub\">Create your first agent to get started</div><button class=\"btn btn-primary\" style=\"margin-top:10px\" onclick=\"openAgentModal()\">Create Agent</button></div>`;\n    return;\n  }\n  grid.innerHTML=DB.agents.map(a=>`\n    <div class=\"agent-card\" onclick=\"showAgentDetail('${a.id}')\">\n      <div class=\"ac-top\">\n        <div class=\"ac-avatar\" style=\"background:${agentColor(a.role)}\">${iconMark(a.emoji)}</div>\n        <div class=\"ac-menu\">\n          <span class=\"badge ${statusClass(a.status)}\" style=\"font-size:9.5px\"><div class=\"badge-dot\"></div>${a.status}</span>\n        </div>\n      </div>\n      <div class=\"ac-name\">${a.name}</div>\n      <div class=\"ac-desc\">${a.desc||'No description'}</div>\n      <div class=\"ac-footer\">\n        <div class=\"tool-chips\">${a.tools.map(t=>`<span class=\"chip active\">${t}</span>`).join('')}</div>\n        <div class=\"ac-runs\">${a.runs} runs</div>\n      </div>\n    </div>`).join('');\n}\n\nfunction openAgentModal(id=null, assignToolId=''){\n  editingAgentId=id;\n  document.getElementById('agentModalTitle').textContent=id?'Edit Agent':'New Agent';\n  const a=id?agentById(id):null;\n  document.getElementById('f-agent-name').value=a?.name||'';\n  document.getElementById('f-agent-emoji').value=normalizeIcon(a?.emoji||'bot');\n  document.getElementById('f-agent-model').value=a?.model||'gpt-4o';\n  document.getElementById('f-agent-desc').value=a?.desc||'';\n  document.getElementById('f-agent-prompt').value=a?.prompt||'';\n  document.getElementById('f-agent-output-format').value=a?.outputFormat||'Plain text';\n  document.getElementById('f-agent-personality').value=a?.personality||'Professional';\n  document.getElementById('f-agent-memory').value=a?.memory||'Off';\n  document.getElementById('f-agent-channel').value=a?.channel||'None';\n  document.getElementById('f-agent-tool-calls').value=a?.maxToolCalls||8;\n  document.getElementById('f-agent-timeout').value=a?.timeoutSeconds||120;\n  document.getElementById('f-agent-tokens').value=a?.tokens||1024;\n  document.getElementById('f-agent-temp').value=a?.temp||0.7;\n  // render tool toggles\n  const toolsEl=document.getElementById('f-agent-tools');\n  toolsEl.innerHTML=TOOL_REGISTRY.filter(t=>t.status==='connected'||t.status==='available').map(t=>{\n    const unavailable=t.status==='needs_setup'||t.status==='disabled';\n    return `<button class=\"tool-toggle ${a?.tools?.includes(t.id)||(!a&&assignToolId===t.id)?'on':''}\" data-tool-id=\"${t.id}\" ${unavailable?'disabled':''} title=\"${unavailable?toolStatusLabel(t.status):t.desc}\" onclick=\"toggleTool(this,'${t.id}')\">${toolIcon(t.id)} ${t.id}</button>`;\n  }).join('');\n  openModal('agentModal');\n}\n\nfunction toggleTool(btn,t){btn.classList.toggle('on')}\n\nfunction saveAgent(){\n  const name=document.getElementById('f-agent-name').value.trim();\n  if(!name){notify('Agent name is required',false);return;}\n  const prompt=document.getElementById('f-agent-prompt').value.trim();\n  if(!prompt){notify('System prompt is required',false);return;}\n  const tools=[...document.querySelectorAll('#f-agent-tools .tool-toggle.on')].map(b=>b.dataset.toolId);\n  const data={\n    name,emoji:document.getElementById('f-agent-emoji').value||'bot',\n    model:document.getElementById('f-agent-model').value,\n    role:editingAgentId ? (agentById(editingAgentId)?.role || 'specialist') : 'specialist',\n    personality:document.getElementById('f-agent-personality').value,\n    memory:document.getElementById('f-agent-memory').value,\n    channel:document.getElementById('f-agent-channel').value,\n    outputFormat:document.getElementById('f-agent-output-format').value,\n    maxToolCalls:+document.getElementById('f-agent-tool-calls').value,\n    timeoutSeconds:+document.getElementById('f-agent-timeout').value,\n    desc:document.getElementById('f-agent-desc').value,\n    prompt,\n    tools,tokens:+document.getElementById('f-agent-tokens').value,\n    temp:+document.getElementById('f-agent-temp').value,\n  };\n  if(editingAgentId){\n    const idx=DB.agents.findIndex(a=>a.id===editingAgentId);\n    DB.agents[idx]={...DB.agents[idx],...data};\n    notify('Agent updated ✓');\n  } else {\n    DB.agents.push({id:uid(),...data,status:'idle',runs:0,created:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'})});\n    notify('Agent created ✓');\n  }\n  closeModal('agentModal');\n  updatePills();\n  renderPage(currentPage());\n}\n\nfunction showAgentDetail(id){\n  const a=agentById(id);if(!a)return;\n  const runs=DB.runs.filter(r=>DB.workflows.some(w=>w.id===r.workflow&&w.agents.includes(id)));\n  document.getElementById('agentDetailBody').innerHTML=`\n    <div class=\"detail-header\">\n      <div class=\"detail-avatar\" style=\"background:${agentColor(a.role)}\">${iconMark(a.emoji)}</div>\n      <div class=\"detail-meta\">\n        <h2>${a.name}</h2>\n        <p>${a.desc||'No description'}</p>\n        <div style=\"display:flex;gap:8px;margin-top:8px\">\n          <span class=\"badge ${statusClass(a.status)}\"><div class=\"badge-dot\"></div>${a.status}</span>\n          <span class=\"badge b-blue\">${a.model}</span>\n        </div>\n      </div>\n    </div>\n    <div class=\"kv-grid\">\n      <div class=\"kv\"><div class=\"kv-label\">Total Runs</div><div class=\"kv-val\">${a.runs}</div></div>\n      <div class=\"kv\"><div class=\"kv-label\">Max Tokens</div><div class=\"kv-val\">${a.tokens.toLocaleString()}</div></div>\n      <div class=\"kv\"><div class=\"kv-label\">Temperature</div><div class=\"kv-val\">${a.temp.toFixed(1)}</div></div>\n      <div class=\"kv\"><div class=\"kv-label\">Personality</div><div class=\"kv-val\">${a.personality||'Professional'}</div></div>\n      <div class=\"kv\"><div class=\"kv-label\">Memory</div><div class=\"kv-val\">${a.memory||'Off'}</div></div>\n      <div class=\"kv\"><div class=\"kv-label\">Channel</div><div class=\"kv-val\">${a.channel||'None'}</div></div>\n      <div class=\"kv\"><div class=\"kv-label\">Output Format</div><div class=\"kv-val\">${a.outputFormat||'Plain text'}</div></div>\n      <div class=\"kv\"><div class=\"kv-label\">Max Tool Calls</div><div class=\"kv-val\">${a.maxToolCalls||8}</div></div>\n      <div class=\"kv\"><div class=\"kv-label\">Timeout</div><div class=\"kv-val\">${a.timeoutSeconds||120}s</div></div>\n    </div>\n    <div class=\"form-group\">\n      <label class=\"form-label\">System Prompt</label>\n      <div style=\"background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:12px;font-family:'DM Mono',monospace;font-size:12px;line-height:1.7;color:var(--text2)\">${a.prompt||'—'}</div>\n    </div>\n    <div class=\"form-group\">\n      <label class=\"form-label\">Tools (${a.tools.length})</label>\n      <div style=\"display:flex;flex-wrap:wrap;gap:6px\">${a.tools.map(t=>`<span class=\"chip active\">${t}</span>`).join('')||'<span class=\"text-muted\">None</span>'}</div>\n    </div>\n    <div class=\"form-group\">\n      <label class=\"form-label\">Created</label>\n      <div style=\"font-size:13px\">${a.created}</div>\n    </div>\n  `;\n  document.getElementById('agentDetailEditBtn').onclick=()=>{closeModal('agentDetailModal');openAgentModal(id)};\n  openModal('agentDetailModal');\n}\n\nfunction deleteAgent(id){\n  DB.agents=DB.agents.filter(a=>a.id!==id);\n  updatePills();\n  notify('Agent deleted');\n  closeModal('agentDetailModal');\n  renderPage(currentPage());\n}\n\n// ══════════════════════════════════════════\n// WORKFLOWS\n// ══════════════════════════════════════════\nfunction renderWorkflowsPage(){\n  const body=document.getElementById('wf-list-body');\n  if(!DB.workflows.length){\n    body.innerHTML=`<div class=\"empty\"><div class=\"empty-icon\">🔀</div><div class=\"empty-title\">No workflows</div><div class=\"empty-sub\">Build your first workflow to orchestrate agents</div></div>`;\n  } else {\n    body.innerHTML=`<table class=\"tbl\"><thead><tr><th>Name</th><th>Agents</th><th>Trigger</th><th>Runs</th><th>Created</th><th></th></tr></thead><tbody>${\n      DB.workflows.map(w=>{\n        const wfRuns=DB.runs.filter(r=>r.workflow===w.id).length;\n        return`<tr onclick=\"editWorkflow('${w.id}')\">\n          <td><div style=\"display:flex;align-items:center;gap:10px\"><span class=\"wf-list-icon\">${iconMark(w.icon)}</span><div style=\"min-width:0\"><div style=\"font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis\">${w.name}</div><div style=\"font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis\">${w.desc}</div></div></div></td>\n          <td>${w.agents.map(id=>{const a=agentById(id);return a?`<span class=\"wf-agent-icon\" title=\"${a.name}\">${iconMark(a.emoji)}</span>`:''}).join('')}</td>\n          <td><span class=\"badge b-muted\">${w.trigger}</span></td>\n          <td class=\"mono\">${wfRuns}</td>\n          <td style=\"color:var(--muted)\">${w.created}</td>\n          <td><div style=\"display:flex;gap:6px\" onclick=\"event.stopPropagation()\">\n            <button class=\"btn btn-ghost btn-sm\" onclick=\"openModal('runModal');populateRunModal('${w.id}')\">▶ Run</button>\n            <button class=\"btn btn-ghost btn-sm\" onclick=\"editWorkflow('${w.id}')\">Edit</button>\n            <button class=\"btn btn-danger btn-sm\" onclick=\"deleteWorkflow('${w.id}')\">Delete</button>\n          </div></td>\n        </tr>`;\n      }).join('')\n    }</tbody></table>`;\n  }\n  renderWfCanvas();\n}\n\nfunction resetWfForm(){\n  editingWfId=null;\n  document.getElementById('wfModalTitle').textContent='New Workflow';\n  document.getElementById('f-wf-name').value='';\n  document.getElementById('f-wf-icon').value='zap';\n  document.getElementById('f-wf-desc').value='';\n  document.getElementById('f-wf-trigger').value='manual';\n  document.getElementById('f-wf-retries').value=3;\n  document.getElementById('f-wf-notes').value='';\n  document.getElementById('f-wf-agents').innerHTML='';\n  addWfAgentRow();\n}\n\nfunction addWfAgentRow(agentId=''){\n  const row=document.createElement('div');\n  row.style.cssText='display:flex;align-items:center;gap:8px';\n  row.innerHTML=`<select class=\"form-input form-select\" style=\"flex:1\">${DB.agents.map(a=>`<option value=\"${a.id}\" ${a.id===agentId?'selected':''}>${iconLabel(a.emoji)} - ${a.name}</option>`).join('')}</select><button class=\"btn btn-ghost btn-sm btn-icon\" onclick=\"this.parentElement.remove()\" title=\"Remove\">✕</button>`;\n  document.getElementById('f-wf-agents').appendChild(row);\n}\n\nfunction editWorkflow(id){\n  editingWfId=id;\n  const w=wfById(id);if(!w)return;\n  document.getElementById('wfModalTitle').textContent='Edit Workflow';\n  document.getElementById('f-wf-name').value=w.name;\n  document.getElementById('f-wf-icon').value=normalizeIcon(w.icon);\n  document.getElementById('f-wf-desc').value=w.desc;\n  document.getElementById('f-wf-trigger').value=w.trigger;\n  document.getElementById('f-wf-retries').value=w.retries;\n  document.getElementById('f-wf-notes').value=w.notes;\n  document.getElementById('f-wf-agents').innerHTML='';\n  w.agents.forEach(id=>addWfAgentRow(id));\n  openModal('workflowModal');\n}\n\nfunction saveWorkflow(){\n  const name=document.getElementById('f-wf-name').value.trim();\n  if(!name){notify('Workflow name is required',false);return;}\n  const agentSelects=[...document.querySelectorAll('#f-wf-agents select')];\n  const agents=agentSelects.map(s=>s.value).filter(Boolean);\n  if(!agents.length){notify('Select at least one agent',false);return;}\n  const data={\n    name,icon:document.getElementById('f-wf-icon').value||'zap',\n    desc:document.getElementById('f-wf-desc').value,\n    trigger:document.getElementById('f-wf-trigger').value,\n    retries:+document.getElementById('f-wf-retries').value,\n    agents,notes:document.getElementById('f-wf-notes').value,\n  };\n  if(editingWfId){\n    const idx=DB.workflows.findIndex(w=>w.id===editingWfId);\n    DB.workflows[idx]={...DB.workflows[idx],...data};\n    notify('Workflow updated ✓');\n  } else {\n    DB.workflows.push({id:uid(),...data,created:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'})});\n    notify('Workflow created ✓');\n  }\n  closeModal('workflowModal');\n  updatePills();\n  renderPage(currentPage());\n}\n\nfunction deleteWorkflow(id){\n  DB.workflows=DB.workflows.filter(w=>w.id!==id);\n  updatePills();\n  notify('Workflow deleted');\n  renderPage(currentPage());\n}\n\n// ══════════════════════════════════════════\n// TOOLS\n// ══════════════════════════════════════════\nfunction toolStatusClass(status){\n  return {connected:'b-green',available:'b-blue',needs_setup:'b-amber',disabled:'b-muted'}[status]||'b-muted';\n}\nfunction toolStatusLabel(status){\n  return {connected:'connected',available:'available',needs_setup:'needs setup',disabled:'disabled'}[status]||status;\n}\nfunction toolUsage(id){\n  return DB.agents.filter(a=>a.tools.includes(id));\n}\nfunction renderToolsPage(){\n  const visibleTools=TOOL_REGISTRY.filter(t=>t.status==='connected'||t.status==='available');\n  const categories=[...new Set(visibleTools.map(t=>t.category))];\n  const sources=[...new Set(visibleTools.map(t=>t.source))];\n  const connected=visibleTools.length;\n  const needsSetup=0;\n  const mcpTools=visibleTools.filter(t=>t.source==='MCP').length;\n  document.getElementById('tools-stats').innerHTML=`\n    <div class=\"stat c-blue\"><div class=\"stat-label\">Total Tools</div><div class=\"stat-val\">${visibleTools.length}</div><div class=\"stat-sub\">${sources.length} sources · ${categories.length} categories</div></div>\n    <div class=\"stat c-green\"><div class=\"stat-label\">Usable</div><div class=\"stat-val\">${connected}</div><div class=\"stat-sub\">Connected or built-in</div></div>\n    <div class=\"stat c-amber\"><div class=\"stat-label\">Needs Setup</div><div class=\"stat-val\">${needsSetup}</div><div class=\"stat-sub\">Configure providers first</div></div>\n    <div class=\"stat c-purple\"><div class=\"stat-label\">MCP Tools</div><div class=\"stat-val\">${mcpTools}</div><div class=\"stat-sub\">From connected MCP servers</div></div>\n  `;\n  document.getElementById('tools-list').innerHTML=sources.map((source,i)=>{\n    const sourceTools=visibleTools.filter(t=>t.source===source);\n    const usable=sourceTools.filter(t=>t.status==='connected'||t.status==='available').length;\n    return `<div class=\"tool-group collapsed\">\n      <div class=\"tool-group-hd\" onclick=\"toggleToolGroup(this)\">\n        <div>\n          <div class=\"tool-group-title\"><span class=\"badge ${sourceClass(source)}\">${source}</span>${sourceLabel(source)}</div>\n          <div class=\"tool-group-sub\">${sourceTools.length} tools · ${usable} usable</div>\n        </div>\n        <div class=\"tool-group-caret\">›</div>\n      </div>\n      <div class=\"tool-group-body\"><table class=\"tbl\"><tbody>${sourceTools.map(renderToolRow).join('')}</tbody></table></div>\n    </div>`;\n  }).join('');\n}\nfunction toggleToolGroup(header){\n  header.closest('.tool-group')?.classList.toggle('collapsed');\n}\nfunction renderToolRow(t){\n  const users=toolUsage(t.id);\n  const action=t.status==='needs_setup'\n    ? `<button class=\"btn btn-ghost btn-sm\" onclick=\"nav('${t.id==='telegram'?'telegram':'settings'}',document.querySelectorAll('.nav-btn')[${t.id==='telegram'?5:7}])\">Configure</button>`\n    : t.status==='disabled'\n      ? `<button class=\"btn btn-ghost btn-sm\" onclick=\"notify('Enable sandbox policy in Settings first',false)\">Enable</button>`\n      : `<button class=\"btn btn-ghost btn-sm\" onclick=\"openAgentModal(null,'${t.id}')\">Assign</button>`;\n  return `<tr>\n    <td><div style=\"display:flex;align-items:center;gap:10px\"><span class=\"wf-list-icon\">${toolIcon(t.id)}</span><div style=\"min-width:0\"><div style=\"font-weight:500\">${t.name}</div><div style=\"font-size:11px;color:var(--muted);max-width:420px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis\">${t.desc}</div></div></div></td>\n    <td><span class=\"badge b-muted\">${t.category}</span></td>\n    <td><span class=\"badge ${toolStatusClass(t.status)}\"><div class=\"badge-dot\"></div>${toolStatusLabel(t.status)}</span></td>\n    <td style=\"color:var(--muted)\">${t.provider}</td>\n    <td>${users.length?users.map(a=>`<span class=\"wf-agent-icon\" title=\"${a.name}\">${iconMark(a.emoji)}</span>`).join(''):'<span class=\"text-muted\">—</span>'}</td>\n    <td>${action}</td>\n  </tr>`;\n}\nfunction sourceLabel(source){\n  return {'Built-in':'NxFlow platform tools', Integration:'Provider-backed tools', MCP:'Tools exposed by MCP servers'}[source]||'Tools';\n}\nfunction toolIcon(id){\n  return iconMark({web_search:'search',calculator:'calculator',current_time:'clock',http_request:'webhook',telegram:'send',file_reader:'file-text',json_parser:'braces',sql_query:'database',code_exec:'terminal',email_send:'mail',slack_notify:'slack',xai_web_search:'search',xai_x_search:'message-square',xai_code_execution:'terminal','mcp.github.search':'git-branch','mcp.filesystem.read':'folder'}[id]||'plug');\n}\nfunction sourceClass(source){\n  return {'Built-in':'b-blue',Integration:'b-amber',MCP:'b-green'}[source]||'b-muted';\n}\n\n// ══════════════════════════════════════════\n// WORKFLOW CANVAS\n// ══════════════════════════════════════════\nfunction renderWfCanvas(){\n  const canvas=document.getElementById('wf-canvas');\n  // Remove existing nodes (keep SVG)\n  [...canvas.querySelectorAll('.wf-node')].forEach(n=>n.remove());\n\n  // Auto-place agents of first workflow\n  if(DB.workflows.length&&!wfNodes.length){\n    const w=DB.workflows[0];\n    w.agents.slice(0,6).forEach((aid,i)=>{\n      const a=agentById(aid);if(!a)return;\n      wfNodes.push({id:uid(),agentId:aid,x:60+i*190,y:140+(i%2)*80});\n    });\n    // connections\n    for(let i=0;i<wfNodes.length-1;i++) wfConnections.push({from:wfNodes[i].id,to:wfNodes[i+1].id});\n  }\n\n  wfNodes.forEach(n=>{\n    const a=agentById(n.agentId);if(!a)return;\n    const el=document.createElement('div');\n    el.className='wf-node';el.dataset.nid=n.id;\n    el.style.cssText=`left:${n.x}px;top:${n.y}px`;\n    el.innerHTML=`<div class=\"wf-port in\"></div><div class=\"wf-node-icon\">${iconMark(a.emoji)}</div><div class=\"wf-node-name\">${a.name}</div><div class=\"wf-node-type\">${a.model}</div><div class=\"wf-port out\"></div>`;\n    el.addEventListener('mousedown',startDragNode);\n    canvas.appendChild(el);\n  });\n  drawEdges();\n}\n\nfunction drawEdges(){\n  const svg=document.getElementById('wf-svg');\n  svg.innerHTML='';\n  wfConnections.forEach(c=>{\n    const fromEl=document.querySelector(`[data-nid=\"${c.from}\"]`);\n    const toEl=document.querySelector(`[data-nid=\"${c.to}\"]`);\n    if(!fromEl||!toEl)return;\n    const fr=fromEl.getBoundingClientRect();const tr=toEl.getBoundingClientRect();\n    const canvas=document.getElementById('wf-canvas').getBoundingClientRect();\n    const x1=fr.right-canvas.left,y1=fr.top+fr.height/2-canvas.top;\n    const x2=tr.left-canvas.left,y2=tr.top+tr.height/2-canvas.top;\n    const cx=(x1+x2)/2;\n    const path=document.createElementNS('http://www.w3.org/2000/svg','path');\n    path.setAttribute('d',`M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`);\n    path.setAttribute('fill','none');path.setAttribute('stroke','var(--accent)');\n    path.setAttribute('stroke-width','2');path.setAttribute('opacity','.45');\n    path.setAttribute('stroke-dasharray','6 3');\n    path.style.animation='dash 1.5s linear infinite';\n    svg.appendChild(path);\n  });\n}\n\nfunction startDragNode(e){\n  dragNode=e.currentTarget;dragNode.classList.add('selected');\n  const rect=dragNode.getBoundingClientRect();\n  const canvas=document.getElementById('wf-canvas').getBoundingClientRect();\n  dragOffset={x:e.clientX-rect.left,y:e.clientY-rect.top};\n  document.addEventListener('mousemove',doDragNode);\n  document.addEventListener('mouseup',stopDragNode);\n  e.preventDefault();\n}\nfunction doDragNode(e){\n  if(!dragNode)return;\n  const canvas=document.getElementById('wf-canvas').getBoundingClientRect();\n  const x=e.clientX-canvas.left-dragOffset.x;\n  const y=e.clientY-canvas.top-dragOffset.y;\n  dragNode.style.left=Math.max(0,x)+'px';\n  dragNode.style.top=Math.max(0,y)+'px';\n  const nid=dragNode.dataset.nid;\n  const node=wfNodes.find(n=>n.id===nid);\n  if(node){node.x=Math.max(0,x);node.y=Math.max(0,y);}\n  drawEdges();\n}\nfunction stopDragNode(){dragNode=null;document.removeEventListener('mousemove',doDragNode);document.removeEventListener('mouseup',stopDragNode);}\n\nfunction canvasClick(e){if(e.target.id==='wf-canvas'||e.target.id==='wf-svg')document.querySelectorAll('.wf-node').forEach(n=>n.classList.remove('selected'));}\nfunction clearCanvas(){wfNodes=[];wfConnections=[];renderWfCanvas();}\nfunction setWfAgent(){\n  if(!DB.agents.length){notify('Create agents first',false);return;}\n  const a=DB.agents[Math.floor(Math.random()*DB.agents.length)];\n  wfNodes.push({id:uid(),agentId:a.id,x:40+Math.random()*400,y:60+Math.random()*240});\n  if(wfNodes.length>1) wfConnections.push({from:wfNodes[wfNodes.length-2].id,to:wfNodes[wfNodes.length-1].id});\n  renderWfCanvas();notify(`Added ${a.name} to canvas`);\n}\n\n// ══════════════════════════════════════════\n// RUNS\n// ══════════════════════════════════════════\nfunction renderRunsTable(){\n  const tablePanel=document.getElementById('runs-table-panel');\n  const streamPanel=document.getElementById('runs-stream-panel');\n  if(runFilter==='stream'){\n    if(tablePanel) tablePanel.style.display='none';\n    if(streamPanel) streamPanel.style.display='grid';\n    renderRunStreamLogs();\n    startTerminal();\n    return;\n  }\n  if(tablePanel) tablePanel.style.display='block';\n  if(streamPanel) streamPanel.style.display='none';\n  const filtered=runFilter==='all'?DB.runs:DB.runs.filter(r=>r.status===runFilter);\n  const tbody=document.getElementById('runs-tbody');\n  if(!tbody) return;\n  if(!filtered.length){\n    tbody.innerHTML=`<tr><td colspan=\"8\"><div class=\"empty\"><div class=\"empty-icon\">📋</div><div class=\"empty-title\">No runs found</div></div></td></tr>`;\n    return;\n  }\n  tbody.innerHTML=filtered.map(r=>{\n    const wf=wfById(r.workflow);\n    return`<tr onclick=\"showRunDetail('${r.id}')\">\n      <td class=\"mono\" style=\"font-size:11.5px;color:var(--muted)\">${r.id}</td>\n      <td style=\"max-width:240px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis\">${r.msg}</td>\n      <td>${wf?`<span style=\"font-size:13px;color:var(--accent)\">${iconMark(wf.icon)}</span> ${wf.name}`:'—'}</td>\n      <td><span class=\"badge ${statusClass(r.status)}\"><div class=\"badge-dot\"></div>${r.status}</span></td>\n      <td class=\"mono\">${r.tokens.toLocaleString()}</td>\n      <td class=\"mono\">${r.duration}</td>\n      <td style=\"color:var(--muted)\">${r.started}</td>\n      <td><button class=\"btn btn-ghost btn-sm\" onclick=\"event.stopPropagation();showRunDetail('${r.id}')\">View logs</button></td>\n    </tr>`;\n  }).join('');\n}\n\nfunction clearRunStream(){\n  const el=document.getElementById('term-out');\n  if(el) el.innerHTML='';\n  termIdx=0;\n}\n\nfunction renderRunStreamLogs(){\n  const el=document.getElementById('run-stream-logs');\n  if(!el) return;\n  el.innerHTML=DB.runs.slice(0,8).map(r=>{\n    const wf=wfById(r.workflow);\n    const last=r.logs?.[r.logs.length-1];\n    return `<div class=\"stream-log-row\" onclick=\"showRunDetail('${r.id}')\">\n      <div class=\"stream-log-top\"><span class=\"mono\">${r.id}</span><span class=\"badge ${statusClass(r.status)}\"><div class=\"badge-dot\"></div>${r.status}</span></div>\n      <div class=\"stream-log-msg\">${r.msg}</div>\n      <div class=\"stream-log-meta\"><span>${wf?iconMark(wf.icon)+' '+wf.name:'—'}</span><span>${r.started}</span></div>\n      <div class=\"stream-log-line\"><span class=\"${{info:'t-info',tool:'t-tool',ok:'t-ok',err:'t-err',sub:'t-sub'}[last?.type]||'t-dim'}\">[${last?.agent||'system'}]</span> ${last?.msg||'Waiting for logs'}</div>\n    </div>`;\n  }).join('');\n}\n\nfunction filterRuns(f,tab){\n  runFilter=f;\n  document.querySelectorAll('#runs-tabs .tab').forEach(t=>t.classList.remove('active'));\n  tab.classList.add('active');\n  renderRunsTable();\n}\n\nfunction showRunDetail(id){\n  const r=DB.runs.find(x=>x.id===id);if(!r)return;\n  const wf=wfById(r.workflow);\n  document.getElementById('runDetailBody').innerHTML=`\n    <div class=\"kv-grid\">\n      <div class=\"kv\"><div class=\"kv-label\">Run ID</div><div class=\"kv-val mono\" style=\"font-size:12px\">${r.id}</div></div>\n      <div class=\"kv\"><div class=\"kv-label\">Status</div><div class=\"kv-val\"><span class=\"badge ${statusClass(r.status)}\"><div class=\"badge-dot\"></div>${r.status}</span></div></div>\n      <div class=\"kv\"><div class=\"kv-label\">Tokens</div><div class=\"kv-val\">${r.tokens.toLocaleString()}</div></div>\n      <div class=\"kv\"><div class=\"kv-label\">Duration</div><div class=\"kv-val\">${r.duration}</div></div>\n      <div class=\"kv\"><div class=\"kv-label\">Workflow</div><div class=\"kv-val\">${wf?.name||'—'}</div></div>\n      <div class=\"kv\"><div class=\"kv-label\">Started</div><div class=\"kv-val\">${r.started}</div></div>\n    </div>\n    <div class=\"form-group\">\n      <label class=\"form-label\">Input Message</label>\n      <div style=\"background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:12px;font-size:13px\">${r.msg}</div>\n    </div>\n    <div class=\"form-group\">\n      <label class=\"form-label\">Execution Log</label>\n      <div class=\"term-body\" style=\"background:#060810;border:1px solid var(--border);border-radius:var(--radius);max-height:300px;padding:12px\">\n        ${r.logs.map(l=>`<div class=\"run-log-line\"><span class=\"t-ts\">——</span><span class=\"${{info:'t-info',tool:'t-tool',ok:'t-ok',err:'t-err',sub:'t-sub'}[l.type]||'t-dim'}\">[${l.agent}]</span><span>${l.msg}</span></div>`).join('')}\n      </div>\n    </div>\n  `;\n  openModal('runDetailModal');\n}\n\nfunction populateRunModal(wfId=''){\n  const sel=document.getElementById('f-run-wf');\n  sel.innerHTML=DB.workflows.map(w=>`<option value=\"${w.id}\" ${w.id===wfId?'selected':''}>${iconLabel(w.icon)} - ${w.name}</option>`).join('');\n  document.getElementById('f-run-msg').value='';\n  document.getElementById('f-run-session').value='';\n}\n\nfunction triggerRun(){\n  const wfId=document.getElementById('f-run-wf').value;\n  if(!wfId){notify('Create a workflow before starting a run',false);return;}\n  const msg=document.getElementById('f-run-msg').value.trim();\n  if(!msg){notify('Input message is required',false);return;}\n  const run={\n    id:'run_'+Math.random().toString(36).slice(2,8),\n    msg,workflow:wfId,status:'running',\n    tokens:0,duration:'—',started:'just now',\n    logs:[{type:'info',agent:'orchestrator',msg:'Run started — processing input…'}],\n  };\n  DB.runs.unshift(run);\n  closeModal('runModal');\n  notify('Run started ✓');\n  updatePills();\n  // simulate completion\n  setTimeout(()=>{\n    run.status='completed';\n    run.tokens=Math.floor(2000+Math.random()*6000);\n    run.duration=(Math.random()*3+0.8).toFixed(1)+'s';\n    run.logs.push({type:'ok',agent:'orchestrator',msg:`Run complete ✓ · ${run.tokens.toLocaleString()} tokens`});\n    notify('Run completed ✓');\n    if(currentPage()==='runs') renderRunsTable();\n    if(currentPage()==='dashboard') renderDashboard();\n  },3000+Math.random()*2000);\n  if(currentPage()==='runs') renderRunsTable();\n  if(currentPage()==='dashboard') renderDashboard();\n}\n\n// ══════════════════════════════════════════\n// MCP + TELEGRAM + SETTINGS\n// ══════════════════════════════════════════\nfunction renderMcp(){}\n\nfunction renderTelegram(){\n  const sel=document.getElementById('tg-wf');\n  if(sel) sel.innerHTML=DB.workflows.map(w=>`<option value=\"${w.id}\">${iconLabel(w.icon)} - ${w.name}</option>`).join('');\n}\n\nfunction saveTelegramConfig(){\n  const telegram=TOOL_REGISTRY.find(t=>t.id==='telegram');\n  if(telegram) telegram.status='connected';\n  notify('Telegram webhook registered ✓');\n}\nfunction renderSettings(){}\n\nfunction saveSettings(){notify('Settings saved ✓')}\nfunction updatePills(){\n  document.getElementById('np-agents').textContent=DB.agents.length;\n  document.getElementById('np-workflows').textContent=DB.workflows.length;\n  document.getElementById('np-runs').textContent=DB.runs.length;\n  document.getElementById('active-agents-count').textContent='Nx Lab. | © 2026';\n}\nfunction currentPage(){return [...document.querySelectorAll('.page')].find(p=>p.classList.contains('active'))?.id.replace('page-','')||'dashboard'}\n\n// ══════════════════════════════════════════\n// INIT\n// ══════════════════════════════════════════\nseed();\nupdatePills();\nnav('dashboard',document.querySelector('.nav-btn.active'));\ndocument.getElementById('topbar-actions').innerHTML=PAGE_ACTIONS['dashboard'];";

export type ConsolePage =
  | "dashboard"
  | "agents"
  | "workflows"
  | "tools"
  | "runs"
  | "telegram"
  | "mcp"
  | "settings";

const navButtonIndex: Record<ConsolePage, number> = {
  dashboard: 0,
  agents: 1,
  workflows: 2,
  tools: 3,
  runs: 4,
  telegram: 5,
  mcp: 6,
  settings: 7,
};

const settingsMarkup = `
  <div class="settings-grid">
    <section class="panel settings-overview">
      <div class="panel-hd">
        <div class="settings-panel-heading">
          <span class="panel-title">Settings Overview</span>
          <span>Local console preferences. Provider credentials stay in the backend environment.</span>
        </div>
        <span class="badge b-green">Backend managed</span>
      </div>
      <div class="settings-panel-body">
        <div class="settings-summary-grid">
          <div class="settings-summary-card">
            <span class="settings-summary-label">Secrets</span>
            <strong>Server only</strong>
            <small>No API keys are stored in this browser.</small>
          </div>
          <div class="settings-summary-card">
            <span class="settings-summary-label">Catalog</span>
            <strong id="s-summary-models">11 models enabled</strong>
            <small>Choose which models agents can pick from.</small>
          </div>
          <div class="settings-summary-card">
            <span class="settings-summary-label">Runs</span>
            <strong id="s-summary-runs">10 concurrent</strong>
            <small id="s-summary-timeout">Default timeout is 120 seconds.</small>
          </div>
        </div>
      </div>
    </section>

    <section class="panel settings-models">
      <div class="panel-hd">
        <div class="settings-panel-heading">
          <span class="panel-title">Model Catalog</span>
          <span>Enable the models agents may use. Defaults are now resolved by the backend.</span>
        </div>
        <span class="badge b-blue" id="s-model-enabled-count">11 enabled</span>
      </div>
      <div class="settings-panel-body">
        <div class="model-list">
          <div class="model-provider-card">
            <div class="model-provider-title"><span class="badge b-purple">Groq</span><span class="model-count">3 of 6 enabled</span></div>
            <label class="model-check"><span>openai/gpt-oss-20b</span><input type="checkbox" checked></label>
            <label class="model-check"><span>llama-3.3-70b-versatile</span><input type="checkbox" checked></label>
            <label class="model-check"><span>openai/gpt-oss-120b</span><input type="checkbox"></label>
            <label class="model-check"><span>groq/compound</span><input type="checkbox" checked></label>
            <label class="model-check"><span>groq/compound-mini</span><input type="checkbox"></label>
            <label class="model-check"><span>llama-3.1-8b-instant</span><input type="checkbox"></label>
          </div>
          <div class="model-provider-card">
            <div class="model-provider-title"><span class="badge b-purple">OpenAI</span><span class="model-count">4 of 6 enabled</span></div>
            <label class="model-check"><span>gpt-5.4-nano</span><input type="checkbox" checked></label>
            <label class="model-check"><span>gpt-5-nano</span><input type="checkbox" checked></label>
            <label class="model-check"><span>gpt-5.4-mini</span><input type="checkbox" checked></label>
            <label class="model-check"><span>gpt-5-mini</span><input type="checkbox"></label>
            <label class="model-check"><span>gpt-5.5</span><input type="checkbox" checked></label>
            <label class="model-check"><span>gpt-5.4</span><input type="checkbox"></label>
          </div>
          <div class="model-provider-card">
            <div class="model-provider-title"><span class="badge b-purple">Anthropic</span><span class="model-count">4 of 6 enabled</span></div>
            <label class="model-check"><span>claude-3-5-haiku</span><input type="checkbox" checked></label>
            <label class="model-check"><span>claude-3-haiku</span><input type="checkbox" checked></label>
            <label class="model-check"><span>claude-sonnet-4</span><input type="checkbox" checked></label>
            <label class="model-check"><span>claude-3-7-sonnet</span><input type="checkbox"></label>
            <label class="model-check"><span>claude-opus-4.1</span><input type="checkbox" checked></label>
            <label class="model-check"><span>claude-opus-4</span><input type="checkbox"></label>
          </div>
        </div>
      </div>
    </section>

    <section class="panel settings-security">
      <div class="panel-hd">
        <div class="settings-panel-heading">
          <span class="panel-title">Security Controls</span>
          <span>Approval and retention defaults for every run.</span>
        </div>
      </div>
      <div class="settings-panel-body">
        <label class="settings-check">
          <input type="checkbox" checked id="s-mask-logs">
          <span><strong>Mask secrets in logs</strong><small>Hide tokens and key-like values in run output.</small></span>
        </label>
        <label class="settings-check">
          <input type="checkbox" checked id="s-tool-approval">
          <span><strong>Require tool approval</strong><small>Gate external network and file actions.</small></span>
        </label>
        <label class="settings-check">
          <input type="checkbox" id="s-retention">
          <span><strong>Short log retention</strong><small>Expire detailed run logs after 30 days.</small></span>
        </label>
      </div>
    </section>

    <section class="panel settings-storage">
      <div class="panel-hd">
        <div class="settings-panel-heading">
          <span class="panel-title">Data Storage</span>
          <span>Database and execution limits.</span>
        </div>
      </div>
      <div class="settings-panel-body">
        <div class="form-group">
          <label class="form-label">PostgreSQL URL</label>
          <input class="form-input" id="s-pg" value="postgresql://nxflow:nxflow@localhost/nxflow">
        </div>
        <div class="limit-number-grid">
          <div class="form-group">
            <label class="form-label">Max concurrent runs</label>
            <input class="form-input" type="number" id="s-concurrent" value="10">
          </div>
          <div class="form-group">
            <label class="form-label">Run timeout (s)</label>
            <input class="form-input" type="number" id="s-timeout" value="120">
          </div>
        </div>
      </div>
    </section>

    <section class="panel settings-guardrails">
      <div class="panel-hd">
        <div class="settings-panel-heading">
          <span class="panel-title">Guardrails</span>
          <span>Optional validation layer for agent outputs.</span>
        </div>
        <span class="badge b-muted">Future integration</span>
      </div>
      <div class="settings-panel-body">
        <div class="guardrails-copy">
          <small>Future integration. No enforcement is configured yet.</small>
        </div>
        <div class="guardrails-fields">
          <div class="form-group">
            <label class="form-label">Library</label>
            <select class="form-input form-select" id="s-guardrails-library" disabled>
              <option>Future integration</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Mode</label>
            <select class="form-input form-select" id="s-guardrails-mode" disabled>
              <option>Monitor only</option>
            </select>
          </div>
        </div>
        <div class="guardrail-tags" aria-label="Proposed checks">
          <span>PII detection</span>
          <span>Prompt injection</span>
          <span>Output schema</span>
        </div>
      </div>
    </section>
  </div>`;

const mcpPlaceholderMarkup = `
  <div class="mcp-placeholder">
    <div class="panel">
      <div class="panel-hd">
        <span class="panel-title">MCP Servers</span>
        <span class="badge b-muted">Future integration</span>
      </div>
      <div class="mcp-placeholder-body">
        <div class="empty">
          <div class="empty-icon">MCP</div>
          <div class="empty-title">MCP integrations are not part of this MVP</div>
          <div class="empty-sub">This section is reserved for future Model Context Protocol server setup.</div>
        </div>
      </div>
    </div>
  </div>`;

const agentsWorkspaceMarkup = `
  <div class="agents-grid" id="agents-grid"></div>`;

const workflowWorkspaceMarkup = `
  <div class="workflow-workspace">
    <section class="panel workflow-list-panel" id="wf-list-panel">
      <div class="panel-hd">
        <span class="panel-title">Workflows</span>
      </div>
      <div id="wf-list-body"></div>
    </section>

    <section class="workflow-builder-shell">
      <div class="wf-canvas">
        <div class="wf-toolbar">
          <div class="wf-toolbar-main">
            <span class="wf-toolbar-title" id="wf-selected-title">Workflow Builder</span>
          </div>
          <div class="wf-toolbar-actions">
            <button class="btn btn-ghost btn-sm" onclick="editSelectedWorkflow()">Edit</button>
            <button class="btn btn-primary btn-sm" onclick="runSelectedWorkflow()">Run</button>
          </div>
        </div>
        <div class="workflow-builder-summary" id="wf-selected-summary"></div>
        <div class="wf-area" id="wf-canvas" onclick="canvasClick(event)">
          <svg id="wf-svg" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"></svg>
        </div>
      </div>
    </section>
  </div>`;

const agentsRenderScript = `
let agentSearchQuery='';
function filterAgents(value){
  agentSearchQuery=(value||'').trim().toLowerCase();
  renderAgentsGrid();
}
function renderAgentsGrid(){
  const grid=document.getElementById('agents-grid');
  const search=document.getElementById('agent-search');
  if(!grid)return;
  if(search && search.value!==agentSearchQuery) search.value=agentSearchQuery;
  const agents=agentSearchQuery
    ? DB.agents.filter(a=>[a.name,a.desc,a.model,a.role,a.status,...a.tools].join(' ').toLowerCase().includes(agentSearchQuery))
    : DB.agents;
  if(!DB.agents.length){
    grid.innerHTML='<div class="empty" style="grid-column:1/-1"><div class="empty-icon">Agents</div><div class="empty-title">No agents yet</div><div class="empty-sub">Create your first agent to get started</div><button class="btn btn-primary" style="margin-top:10px" onclick="openAgentModal()">Create Agent</button></div>';
    return;
  }
  if(!agents.length){
    grid.innerHTML='<div class="empty agent-search-empty" style="grid-column:1/-1"><div class="empty-title">No matching agents</div><div class="empty-sub">Try a different name, status, model, or tool.</div></div>';
    return;
  }
  grid.innerHTML=agents.map(a=>
    '<div class="agent-card" onclick="showAgentDetail(\\''+a.id+'\\')">'+
      '<div class="ac-top">'+
        '<div class="ac-avatar" style="background:'+agentColor(a.role)+'">'+iconMark(a.emoji)+'</div>'+
        '<div class="ac-menu"><span class="badge '+statusClass(a.status)+'" style="font-size:9.5px"><div class="badge-dot"></div>'+a.status+'</span></div>'+
      '</div>'+
      '<div class="ac-name">'+a.name+'</div>'+
      '<div class="ac-desc">'+(a.desc||'No description')+'</div>'+
      '<div class="ac-footer">'+
        '<div class="tool-chips">'+a.tools.map(t=>'<span class="chip active">'+t+'</span>').join('')+'</div>'+
        '<div class="ac-runs">'+a.runs+' runs</div>'+
      '</div>'+
    '</div>'
  ).join('');
}
`;

const workflowRenderScript = `
let workflowSearchQuery='';
function filterWorkflows(value){
  workflowSearchQuery=(value||'').trim().toLowerCase();
  renderWorkflowsPage();
}
function currentWorkflowId(){
  if(!DB.workflows.length) return '';
  if(!window.__selectedWorkflowId || !wfById(window.__selectedWorkflowId)) window.__selectedWorkflowId=DB.workflows[0].id;
  return window.__selectedWorkflowId;
}
function selectWorkflow(id){
  window.__selectedWorkflowId=id;
  wfNodes=[];
  wfConnections=[];
  renderWorkflowsPage();
}
function runSelectedWorkflow(){
  const id=currentWorkflowId();
  if(!id){notify('Create a workflow before starting a run',false);return;}
  const w=wfById(id);
  if(!w?.agents.length){notify('Add at least one agent before running',false);return;}
  openModal('runModal');
  populateRunModal(id);
}
function editSelectedWorkflow(){
  const id=currentWorkflowId();
  if(!id){notify('Create a workflow first',false);return;}
  editWorkflow(id);
}
function renderWorkflowsPage(){
  const body=document.getElementById('wf-list-body');
  const search=document.getElementById('workflow-search');
  const activeId=currentWorkflowId();
  const title=document.getElementById('wf-selected-title');
  const summary=document.getElementById('wf-selected-summary');
  if(!body) return;
  if(search && search.value!==workflowSearchQuery) search.value=workflowSearchQuery;
  if(!DB.workflows.length){
    body.innerHTML='<div class="empty workflow-empty"><div class="empty-icon">Workflow</div><div class="empty-title">No workflows</div><div class="empty-sub">Build your first workflow to orchestrate agents</div></div>';
    if(title) title.textContent='Workflow Builder';
    if(summary) summary.innerHTML='';
    renderWfCanvas();
    return;
  }
  const workflows=workflowSearchQuery
    ? DB.workflows.filter(w=>[w.name,w.desc,w.trigger].join(' ').toLowerCase().includes(workflowSearchQuery))
    : DB.workflows;
  body.innerHTML=workflows.length ? workflows.map(w=>{
    const wfRuns=DB.runs.filter(r=>r.workflow===w.id).length;
    const agentsHtml=w.agents.map(id=>{const a=agentById(id);return a?'<span class="wf-agent-icon" title="'+a.name+'">'+iconMark(a.emoji)+'</span>':'';}).join('') || '<span class="text-muted">No agents</span>';
    return '<div class="workflow-row '+(w.id===activeId?'active':'')+'" onclick="selectWorkflow(\\''+w.id+'\\')">'+
      '<div class="workflow-row-icon">'+iconMark(w.icon)+'</div>'+
      '<div class="workflow-row-main"><div class="workflow-row-name">'+w.name+'</div><div class="workflow-row-desc">'+(w.desc||'No description')+'</div></div>'+
      '<div class="workflow-row-meta"><span class="badge b-muted">'+w.trigger+'</span><span class="mono">'+wfRuns+' runs</span></div>'+
      '<div class="workflow-row-agents">'+agentsHtml+'</div>'+
    '</div>';
  }).join('') : '<div class="empty workflow-empty"><div class="empty-title">No matching workflows</div><div class="empty-sub">Try another name, description, or trigger.</div></div>';
  const active=wfById(activeId);
  if(title) title.textContent=active?.name||'Workflow Builder';
  if(summary && active){
    const agents=active.agents.map(id=>agentById(id)).filter(Boolean);
    summary.innerHTML='<div class="workflow-summary-copy">'+(active.desc||'No description')+'</div>'+
      '<div class="workflow-summary-meta">'+
        '<span class="badge b-muted">'+active.trigger+'</span>'+
        '<span class="badge b-blue">'+active.retries+' retries</span>'+
        '<span class="badge b-green">'+agents.length+' agents</span>'+
        '<span class="workflow-summary-agents">'+agents.map(a=>'<span class="wf-agent-icon" title="'+a.name+'">'+iconMark(a.emoji)+'</span>').join('')+'</span>'+
      '</div>';
  }
  renderWfCanvas();
}
`;

const workflowCanvasActionsScript = `
function setWfAgent(){
  const id=typeof currentWorkflowId==='function'?currentWorkflowId():'';
  const w=wfById(id);
  if(!w){notify('Create a workflow first',false);return;}
  if(!DB.agents.length){notify('Create agents first',false);return;}
  const picker=document.getElementById('wf-agent-picker');
  if(picker){picker.remove();return;}
  const canvas=document.getElementById('wf-canvas');
  if(!canvas)return;
  const anchor=document.querySelector('.wf-add-node');
  const left=parseFloat(anchor?.style.left||'60')+54;
  const top=parseFloat(anchor?.style.top||'140')-8;
  const menu=document.createElement('div');
  menu.id='wf-agent-picker';
  menu.className='wf-agent-picker';
  menu.style.left=left+'px';
  menu.style.top=top+'px';
  menu.innerHTML=DB.agents.map(a=>'<button type="button" onclick="addAgentToSelectedWorkflow(\\''+a.id+'\\')">'+iconMark(a.emoji)+'<span>'+a.name+'</span></button>').join('');
  canvas.appendChild(menu);
}
function addAgentToSelectedWorkflow(agentId){
  const id=typeof currentWorkflowId==='function'?currentWorkflowId():'';
  const w=wfById(id);
  const agent=agentById(agentId);
  if(!w||!agent){notify('Agent not found',false);return;}
  w.agents.push(agent.id);
  wfNodes=[];
  wfConnections=[];
  document.getElementById('wf-agent-picker')?.remove();
  notify(agent.name+' added to workflow ✓');
  renderWorkflowsPage();
}
`;

const workflowCanvasRenderScript = `
function renderWfCanvas(){
  const canvas=document.getElementById('wf-canvas');
  if(!canvas)return;
  [...canvas.querySelectorAll('.wf-node,.wf-add-node,.wf-agent-picker')].forEach(n=>n.remove());
  const svg=document.getElementById('wf-svg');
  if(svg) svg.innerHTML='';
  const w=wfById(typeof currentWorkflowId==='function'?currentWorkflowId():window.__selectedWorkflowId)||DB.workflows[0];
  const agentIds=w?.agents||[];
  const nodeIds=wfNodes.map(n=>n.agentId).join('|');
  if(nodeIds!==agentIds.join('|')){
    wfNodes=[];
    wfConnections=[];
    agentIds.forEach((aid,i)=>{
      const a=agentById(aid);if(!a)return;
      const col=i%3;
      const row=Math.floor(i/3);
      wfNodes.push({id:uid(),agentId:aid,x:56+col*210,y:92+row*118});
    });
    for(let i=0;i<wfNodes.length-1;i++) wfConnections.push({from:wfNodes[i].id,to:wfNodes[i+1].id});
  }
  const rowCount=Math.max(1,Math.ceil((wfNodes.length+1)/3));
  canvas.style.minHeight=Math.max(520,120+rowCount*118)+'px';
  wfNodes.forEach((n,i)=>{
    const a=agentById(n.agentId);if(!a)return;
    const el=document.createElement('div');
    el.className='wf-node';el.dataset.nid=n.id;
    el.style.cssText='left:'+n.x+'px;top:'+n.y+'px';
    el.innerHTML='<div class="wf-port in"></div><div class="wf-step-num">'+(i+1)+'</div><div class="wf-node-icon">'+iconMark(a.emoji)+'</div><div class="wf-node-name">'+a.name+'</div><div class="wf-node-type">'+a.model+'</div><div class="wf-port out"></div>';
    el.addEventListener('mousedown',startDragNode);
    canvas.appendChild(el);
  });
  if(w){
    const last=wfNodes[wfNodes.length-1];
    const add=document.createElement('button');
    add.type='button';
    add.className='wf-add-node';
    add.title='Add agent';
    add.dataset.nid='wf-add-agent';
    const nextIndex=wfNodes.length;
    const nextCol=nextIndex%3;
    const nextRow=Math.floor(nextIndex/3);
    add.style.left=(last?56+nextCol*210:56)+'px';
    add.style.top=(last?92+nextRow*118:92)+'px';
    add.innerHTML='<span>+</span>';
    add.onclick=(event)=>{event.stopPropagation();setWfAgent();};
    canvas.appendChild(add);
    if(last){
      const svg=document.getElementById('wf-svg');
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');
      const lastRight=last.x+176;
      const lastMid=last.y+27;
      const addLeft=parseFloat(add.style.left);
      const addMid=parseFloat(add.style.top)+22;
      const sameRow=Math.abs(lastMid-addMid)<8;
      const d=sameRow
        ? 'M'+lastRight+','+lastMid+' L'+addLeft+','+addMid
        : 'M'+lastRight+','+lastMid+' C'+(lastRight+44)+','+lastMid+' '+(addLeft-44)+','+addMid+' '+addLeft+','+addMid;
      path.setAttribute('d',d);
      path.setAttribute('fill','none');
      path.setAttribute('stroke','var(--accent)');
      path.setAttribute('stroke-width','2');
      path.setAttribute('opacity','.34');
      path.setAttribute('stroke-dasharray','4 4');
      svg?.appendChild(path);
    }
  }
  drawEdges();
}
`;

const workflowAgentRowScript = `
function refreshWfAgentRowControls(){
  const rows=[...document.querySelectorAll('#f-wf-agents .wf-agent-row')];
  rows.forEach((row,index)=>{
    const up=row.querySelector('[data-wf-row-move="up"]');
    const down=row.querySelector('[data-wf-row-move="down"]');
    if(up) up.disabled=index===0;
    if(down) down.disabled=index===rows.length-1;
  });
}
function moveWfAgentRow(button,direction){
  const row=button.closest('.wf-agent-row');
  const parent=document.getElementById('f-wf-agents');
  if(!row||!parent)return;
  if(direction<0 && row.previousElementSibling) parent.insertBefore(row,row.previousElementSibling);
  if(direction>0 && row.nextElementSibling) parent.insertBefore(row.nextElementSibling,row);
  refreshWfAgentRowControls();
}
function addWfAgentRow(agentId=''){
  if(!DB.agents.length){notify('Create agents first',false);return;}
  const row=document.createElement('div');
  row.className='wf-agent-row';
  row.style.cssText='display:flex;align-items:center;gap:8px';
  row.innerHTML=\`<select class="form-input form-select" style="flex:1"><option value="" \${!agentId?'selected':''} disabled>Select agent...</option>\${DB.agents.map(a=>\`<option value="\${a.id}" \${a.id===agentId?'selected':''}>\${iconLabel(a.emoji)} - \${a.name}</option>\`).join('')}</select><div class="wf-row-reorder"><button type="button" class="btn btn-ghost btn-sm btn-icon" data-wf-row-move="up" onclick="moveWfAgentRow(this,-1)" title="Move earlier">↑</button><button type="button" class="btn btn-ghost btn-sm btn-icon" data-wf-row-move="down" onclick="moveWfAgentRow(this,1)" title="Move later">↓</button></div><button class="btn btn-ghost btn-sm btn-icon" onclick="this.parentElement.remove();refreshWfAgentRowControls()" title="Remove">✕</button>\`;
  document.getElementById('f-wf-agents').appendChild(row);
  refreshWfAgentRowControls();
}
`;

const workflowSaveScript = `
function saveWorkflow(){
  const name=document.getElementById('f-wf-name').value.trim();
  if(!name){notify('Workflow name is required',false);return;}
  const agentSelects=[...document.querySelectorAll('#f-wf-agents select')];
  const agents=agentSelects.map(s=>s.value).filter(Boolean);
  if(!agents.length){notify('Select at least one agent',false);return;}
  const data={
    name,icon:document.getElementById('f-wf-icon').value||'zap',
    desc:document.getElementById('f-wf-desc').value,
    trigger:document.getElementById('f-wf-trigger').value,
    retries:+document.getElementById('f-wf-retries').value,
    agents,notes:document.getElementById('f-wf-notes').value,
  };
  if(editingWfId){
    const idx=DB.workflows.findIndex(w=>w.id===editingWfId);
    if(idx<0){notify('Workflow not found',false);return;}
    DB.workflows[idx]={...DB.workflows[idx],...data};
    window.__selectedWorkflowId=editingWfId;
    notify('Workflow updated ✓');
  } else {
    const workflow={id:uid(),...data,created:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'})};
    DB.workflows.push(workflow);
    window.__selectedWorkflowId=workflow.id;
    notify('Workflow created ✓');
  }
  wfNodes=[];
  wfConnections=[];
  closeModal('workflowModal');
  updatePills();
  if(currentPage()==='workflows') renderWorkflowsPage();
  else renderPage(currentPage());
}
`;

const liveTerminalScript = `
function terminalClass(type){
  return {info:'t-info',tool:'t-tool',ok:'t-ok',err:'t-err',sub:'t-sub'}[type]||'t-dim';
}
function terminalLogsForRun(run){
  const logs=(run.logs||[]).filter(log=>log.msg&&log.msg!=='pending'&&log.eventType!=='text_delta');
  if(run.output && !logs.some(log=>log.msg===run.output)){
    logs.push({type:run.status==='failed'?'err':'ok',agent:'runtime',msg:run.output,created:run.started});
  }
  return logs;
}
function renderTerminalFromLogs(){
  const el=document.getElementById('term-out');
  if(!el) return;
  const lines=DB.runs
    .slice(0,6)
    .flatMap(run=>terminalLogsForRun(run).map(log=>({run,log})))
    .slice(-80);
  if(!lines.length){
    el.innerHTML='<div class="run-log-line"><span class="t-ts">--</span><span class="t-dim">[runtime]</span><span>No live run logs yet. Start a workflow run to stream events here.</span></div>';
    return;
  }
  el.innerHTML=lines.map(({run,log})=>{
    const timestamp=log.created||new Date().toLocaleTimeString();
    const agent=log.agent||'runtime';
    const msg=log.msg||run.status||'event';
    return \`<div class="run-log-line"><span class="t-ts">\${timestamp}</span><span class="\${terminalClass(log.type)}">[\${agent}]</span><span>\${msg}</span></div>\`;
  }).join('');
  el.scrollTop=el.scrollHeight;
}
function startTerminal(){
  renderTerminalFromLogs();
}
`;

const apiWiringScript = `
const API_BASE=localStorage.getItem('nxflow.apiBase')||'http://localhost:8000';
async function apiFetch(path,options={}){
  const res=await fetch(API_BASE+path,{headers:{'Content-Type':'application/json',...(options.headers||{})},...options});
  if(!res.ok){
    let detail='API request failed';
    try{const body=await res.json();detail=body.detail||detail;}catch{}
    throw new Error(detail);
  }
  if(res.status===204)return null;
  return res.json();
}
function uiMeta(entity){
  return entity?.guardrails?.ui || entity?.metadata?.ui || {};
}
function workflowMeta(workflow){
  return (workflow.nodes||[]).find(n=>n.type==='metadata')?.ui || {};
}
function providerFromModel(model){
  const value=(model||'').toLowerCase();
  if(value.startsWith('openai/')||value.startsWith('llama-')||value.startsWith('groq/')) return 'groq';
  if(value.startsWith('claude')) return 'anthropic';
  if(value.startsWith('gpt-')) return 'openai';
  return 'groq';
}
function apiAgentToUi(agent){
  const meta=uiMeta(agent);
  return {
    id:agent.id,
    name:agent.name,
    emoji:meta.emoji||'bot',
    model:agent.model,
    provider:agent.provider||providerFromModel(agent.model),
    role:agent.role||'specialist',
    desc:meta.desc||agent.role||'',
    prompt:agent.system_prompt||'',
    tools:agent.tools||[],
    tokens:agent.max_tokens||agent.limits?.max_tokens||2000,
    temp:agent.temperature??agent.limits?.temperature??0.7,
    status:'active',
    runs:0,
    created:agent.created_at?new Date(agent.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'}):'—',
    channel:agent.channel||'',
    memory_enabled:agent.memory_enabled,
    limits:agent.limits||{},
    memory_config:agent.memory_config||{},
  };
}
function workflowAgentIds(workflow){
  return (workflow.nodes||[]).filter(n=>n.type==='agent'&&n.agent_id).map(n=>n.agent_id);
}
function apiWorkflowToUi(workflow){
  const meta=workflowMeta(workflow);
  return {
    id:workflow.id,
    name:workflow.name,
    icon:meta.icon||'workflow',
    desc:workflow.description||'',
    trigger:meta.trigger||'manual',
    retries:meta.retries??3,
    agents:workflowAgentIds(workflow),
    notes:meta.notes||'',
    created:workflow.created_at?new Date(workflow.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'}):'—',
    nodes:workflow.nodes||[],
    edges:workflow.edges||[],
  };
}
function apiRunToUi(run){
  return {
    id:run.id,
    msg:run.input||'',
    workflow:run.workflow_id,
    status:run.status,
    tokens:run.total_tokens||0,
    cost:run.total_cost_usd||0,
    duration:run.ended_at&&run.started_at?(((new Date(run.ended_at)-new Date(run.started_at))/1000).toFixed(1)+'s'):'—',
    started:run.created_at?new Date(run.created_at).toLocaleString():'—',
    output:run.output||'',
    logs:run.output?[{type:run.status==='failed'?'err':run.status==='completed'?'ok':'info',agent:'runtime',msg:run.output}]:[],
  };
}
function apiMessageToUi(message){
  return {
    id:message.id,
    run:message.run_id,
    agent:message.agent_id,
    channel:message.channel||'',
    direction:message.direction||'',
    content:message.content||'',
    sender:message.sender_id||'',
    metadata:message.metadata||{},
    created:message.created_at?new Date(message.created_at).toLocaleString():'—',
  };
}
function apiEventToLog(event){
  const eventType=event.event_type||'';
  return {
    type:eventType==='run_failed'?'err':eventType==='run_completed'||eventType==='agent_completed'?'ok':eventType.includes('tool')?'tool':'info',
    agent:event.agent_name||'runtime',
    msg:event.content||eventType,
    eventType,
    tokens:event.tokens_used||0,
    cost:event.cost_usd||0,
    created:event.created_at?new Date(event.created_at).toLocaleTimeString():'—',
  };
}
function apiToolToUi(tool){
  return {
    id:tool.key,
    name:tool.name,
    source:tool.source,
    category:tool.category||'General',
    provider:tool.provider||'—',
    status:tool.status||'available',
    desc:tool.description||'',
  };
}
function agentPayloadFromForm(){
  const memory=document.getElementById('f-agent-memory').value;
  const maxTokens=+document.getElementById('f-agent-tokens').value||2000;
  const temperature=+document.getElementById('f-agent-temp').value||0.7;
  const maxToolCalls=+document.getElementById('f-agent-tool-calls').value||8;
  const model=document.getElementById('f-agent-model').value||'openai/gpt-oss-20b';
  return {
    name:document.getElementById('f-agent-name').value.trim(),
    role:document.getElementById('f-agent-personality').value.toLowerCase(),
    system_prompt:document.getElementById('f-agent-prompt').value.trim(),
    provider:providerFromModel(model),
    model,
    tools:[...document.querySelectorAll('#f-agent-tools .tool-toggle.on')].map(button=>button.dataset.toolId).filter(Boolean),
    channel:(document.getElementById('f-agent-channel').value||'').toLowerCase()==='none'?null:document.getElementById('f-agent-channel').value.toLowerCase(),
    memory_enabled:memory!=='Off',
    memory_config:{scope:memory.toLowerCase()},
    interaction_rules:{tone:document.getElementById('f-agent-personality').value,output_format:document.getElementById('f-agent-output-format').value},
    guardrails:{ui:{emoji:document.getElementById('f-agent-emoji').value,desc:document.getElementById('f-agent-desc').value}},
    limits:{max_tool_calls:maxToolCalls,timeout_seconds:+document.getElementById('f-agent-timeout').value||120,max_tokens:maxTokens,temperature},
    max_tokens:maxTokens,
    temperature,
  };
}
function workflowPayloadFromForm(){
  const agentIds=[...document.querySelectorAll('#f-wf-agents select')].map(s=>s.value).filter(Boolean);
  const agentNodes=agentIds.map((agentId,index)=>({id:'agent-'+(index+1),type:'agent',agent_id:agentId,label:agentById(agentId)?.name||'Agent '+(index+1)}));
  const edges=agentNodes.slice(1).map((node,index)=>({id:'edge-'+(index+1),source:agentNodes[index].id,target:node.id,condition:'next'}));
  return {
    name:document.getElementById('f-wf-name').value.trim(),
    description:document.getElementById('f-wf-desc').value,
    nodes:[
      {id:'metadata',type:'metadata',ui:{icon:document.getElementById('f-wf-icon').value||'workflow',trigger:document.getElementById('f-wf-trigger').value,retries:+document.getElementById('f-wf-retries').value||0,notes:document.getElementById('f-wf-notes').value}},
      ...agentNodes,
    ],
    edges,
    is_template:false,
  };
}
async function loadBackendData(){
  try{
    const [agents,workflows,runs,messages,tools]=await Promise.all([
      apiFetch('/agents/'),
      apiFetch('/workflows/'),
      apiFetch('/runs/'),
      apiFetch('/messages/'),
      apiFetch('/tools/'),
    ]);
    DB.agents=agents.map(apiAgentToUi);
    DB.workflows=workflows.map(apiWorkflowToUi);
    DB.runs=runs.map(apiRunToUi);
    DB.messages=messages.map(apiMessageToUi);
    DB.tools=tools.map(apiToolToUi);
    TOOL_REGISTRY=DB.tools;
    DB.agents.forEach(agent=>{agent.runs=DB.runs.filter(run=>workflowAgentIds({nodes:DB.workflows.find(w=>w.id===run.workflow)?.nodes||[]}).includes(agent.id)).length;});
    updatePills();
    renderPage(currentPage());
    if(currentPage()==='workflows') renderWorkflowsPage();
    if(currentPage()==='telegram') renderTelegram();
    notify('Backend data loaded ✓');
  }catch(error){
    notify('Using demo data. Backend unavailable: '+error.message,false);
  }
}
async function showRunDetail(id){
  const r=DB.runs.find(x=>x.id===id);if(!r)return;
  const wf=wfById(r.workflow);
  let logs=r.logs||[];
  try{
    const events=await apiFetch('/runs/'+id+'/events');
    logs=events.map(apiEventToLog);
    r.logs=logs;
    r.tokens=events.reduce((sum,event)=>sum+(event.tokens_used||0),0) || r.tokens || 0;
    r.cost=events.reduce((sum,event)=>sum+(event.cost_usd||0),0) || r.cost || 0;
  }catch(error){
    logs=r.logs||[{type:'err',agent:'runtime',msg:'Could not load backend events: '+error.message}];
  }
  const totalEventTokens=logs.reduce((sum,l)=>sum+(l.tokens||0),0);
  const totalEventCost=logs.reduce((sum,l)=>sum+(l.cost||0),0);
  const logHtml=logs.length
    ? logs.map(l=>'<div class="run-log-line"><span class="t-ts">'+(l.created||'——')+'</span><span class="'+({info:'t-info',tool:'t-tool',ok:'t-ok',err:'t-err',sub:'t-sub'}[l.type]||'t-dim')+'">['+l.agent+']</span><span>'+l.msg+'</span><span class="t-dim" style="margin-left:auto;white-space:nowrap">'+(l.tokens?l.tokens+' tok':'')+(l.cost?(' · $'+Number(l.cost).toFixed(4)):'')+'</span></div>').join('')
    : '<div class="run-log-line"><span class="t-dim">No persisted events yet.</span></div>';
  document.getElementById('runDetailBody').innerHTML=\`
    <div class="kv-grid">
      <div class="kv"><div class="kv-label">Run ID</div><div class="kv-val mono" style="font-size:12px">\${r.id}</div></div>
      <div class="kv"><div class="kv-label">Status</div><div class="kv-val"><span class="badge \${statusClass(r.status)}"><div class="badge-dot"></div>\${r.status}</span></div></div>
      <div class="kv"><div class="kv-label">Tokens</div><div class="kv-val">\${r.tokens.toLocaleString()}</div></div>
      <div class="kv"><div class="kv-label">Cost</div><div class="kv-val">\${Number(r.cost||0).toFixed(4)}</div></div>
      <div class="kv"><div class="kv-label">Duration</div><div class="kv-val">\${r.duration}</div></div>
      <div class="kv"><div class="kv-label">Workflow</div><div class="kv-val">\${wf?.name||'—'}</div></div>
      <div class="kv"><div class="kv-label">Started</div><div class="kv-val">\${r.started}</div></div>
      <div class="kv"><div class="kv-label">Event Totals</div><div class="kv-val">\${totalEventTokens.toLocaleString()} tok · \${totalEventCost.toFixed(4)}</div></div>
    </div>
    <div class="form-group">
      <label class="form-label">Input Message</label>
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:12px;font-size:13px">\${r.msg}</div>
    </div>
    \${r.output?'<div class="form-group"><label class="form-label">Output</label><div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:12px;font-size:13px">'+r.output+'</div></div>':''}
    <div class="form-group">
      <label class="form-label">Persisted Run Events</label>
      <div class="term-body" style="background:#060810;border:1px solid var(--border);border-radius:var(--radius);max-height:300px;padding:12px">\${logHtml}</div>
    </div>
  \`;
  openModal('runDetailModal');
}
function renderTelegram(){
  const sel=document.getElementById('tg-wf');
  if(sel) sel.innerHTML=DB.workflows.map(w=>\`<option value="\${w.id}">\${iconLabel(w.icon)} - \${w.name}</option>\`).join('');
  const page=document.getElementById('page-telegram');
  const content=page?.querySelector('.content');
  if(!content)return;
  const messages=(DB.messages||[]).filter(m=>m.channel==='telegram').slice(0,30);
  const rows=messages.length?messages.map(m=>\`
    <tr>
      <td><span class="badge \${m.direction==='inbound'?'b-blue':m.direction==='outbound'?'b-green':'b-purple'}"><div class="badge-dot"></div>\${m.direction||'message'}</span></td>
      <td style="max-width:420px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">\${m.content}</td>
      <td class="mono" style="font-size:11px;color:var(--muted)">\${m.sender||'—'}</td>
      <td class="mono" style="font-size:11px;color:var(--muted)">\${m.run||'—'}</td>
      <td style="color:var(--muted)">\${m.created}</td>
    </tr>\`).join(''):'<tr><td colspan="5"><div class="empty"><div class="empty-title">No Telegram messages yet</div></div></td></tr>';
  content.innerHTML=\`
    <div class="panel">
      <div class="panel-hd"><span class="panel-title">Telegram Messages</span><span class="badge b-muted">\${messages.length} loaded</span></div>
      <table class="tbl"><thead><tr><th>Direction</th><th>Content</th><th>Sender</th><th>Run</th><th>Created</th></tr></thead><tbody>\${rows}</tbody></table>
    </div>
  \`;
}
async function saveAgent(){
  const payload=agentPayloadFromForm();
  if(!payload.name){notify('Agent name is required',false);return;}
  if(!payload.system_prompt){notify('System prompt is required',false);return;}
  try{
    if(editingAgentId) await apiFetch('/agents/'+editingAgentId,{method:'PATCH',body:JSON.stringify(payload)});
    else await apiFetch('/agents/',{method:'POST',body:JSON.stringify(payload)});
    closeModal('agentModal');
    editingAgentId=null;
    await loadBackendData();
    notify('Agent saved to backend ✓');
  }catch(error){notify(error.message,false);}
}
async function saveWorkflow(){
  const payload=workflowPayloadFromForm();
  if(!payload.name){notify('Workflow name is required',false);return;}
  if(payload.nodes.filter(n=>n.type==='agent').length===0){notify('Select at least one agent',false);return;}
  try{
    let workflow;
    if(editingWfId) workflow=await apiFetch('/workflows/'+editingWfId,{method:'PATCH',body:JSON.stringify(payload)});
    else workflow=await apiFetch('/workflows/',{method:'POST',body:JSON.stringify(payload)});
    window.__selectedWorkflowId=workflow.id;
    closeModal('workflowModal');
    editingWfId=null;
    wfNodes=[];wfConnections=[];
    await loadBackendData();
    notify('Workflow saved to backend ✓');
  }catch(error){notify(error.message,false);}
}
async function triggerRun(){
  const wfId=document.getElementById('f-run-wf').value;
  if(!wfId){notify('Create a workflow before starting a run',false);return;}
  const msg=document.getElementById('f-run-msg').value.trim();
  if(!msg){notify('Input message is required',false);return;}
  try{
    const run=await apiFetch('/workflows/'+wfId+'/runs',{method:'POST',body:JSON.stringify({input:msg,execute:true})});
    closeModal('runModal');
    await loadBackendData();
    notify('Run started in backend ✓');
    subscribeRunEvents(run.id);
  }catch(error){notify(error.message,false);}
}
async function deleteAgent(id){
  try{
    await apiFetch('/agents/'+id,{method:'DELETE'});
    DB.agents=DB.agents.filter(a=>a.id!==id);
    DB.workflows=DB.workflows.map(w=>({...w,agents:(w.agents||[]).filter(agentId=>agentId!==id)}));
    if(editingAgentId===id) editingAgentId=null;
    updatePills();
    renderPage(currentPage());
    notify('Agent deleted from backend');
  }catch(error){notify(error.message,false);}
}
async function deleteWorkflow(id){
  try{
    await apiFetch('/workflows/'+id,{method:'DELETE'});
    DB.workflows=DB.workflows.filter(w=>w.id!==id);
    DB.runs=DB.runs.filter(r=>r.workflow!==id);
    if(window.__selectedWorkflowId===id) window.__selectedWorkflowId=DB.workflows[0]?.id||'';
    if(editingWfId===id) editingWfId=null;
    wfNodes=[];wfConnections=[];
    updatePills();
    renderPage(currentPage());
    notify('Workflow deleted from backend');
  }catch(error){notify(error.message,false);}
}
function subscribeRunEvents(runId){
  if(!runId||window.__nxflowRunSocket?.readyState===WebSocket.OPEN) return;
  const wsBase=API_BASE.replace(/^http/,'ws');
  try{
    const socket=new WebSocket(wsBase+'/ws/runs/'+runId);
    window.__nxflowRunSocket=socket;
    socket.onmessage=(event)=>{
      try{
        const payload=JSON.parse(event.data);
        const run=DB.runs.find(r=>r.id===runId);
        if(run){
          run.logs=run.logs||[];
          const eventType=payload.type||'runtime_event';
          const message=payload.content||eventType;
          if(eventType==='run_completed'){
            run.status='completed';
            run.output=payload.content||run.output;
          }
          if(eventType==='run_failed'){
            run.status='failed';
            run.output=payload.content||run.output;
          }
          if(eventType!=='text_delta'&&!run.logs.some(log=>log.eventType===eventType&&log.msg===message)){
            run.logs.push({type:eventType==='run_failed'?'err':eventType==='run_completed'||eventType==='agent_completed'?'ok':eventType.includes('tool')?'tool':'info',agent:payload.agent_name||'runtime',msg:message,eventType,created:new Date().toLocaleTimeString()});
          }
          if(eventType==='run_completed'||eventType==='run_failed') loadBackendData();
          else if(currentPage()==='runs') renderRunsTable();
          renderTerminalFromLogs();
        }
      }catch{}
    };
  }catch{}
}
window.nxflowRefresh=loadBackendData;
loadBackendData();
`;

export default function PlatformConsole({ initialPage = "dashboard" }: { initialPage?: ConsolePage }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    rootRef.current.innerHTML = markup;
    rootRef.current.querySelector("#runs-stream-panel .runs-log-panel")?.remove();
    const settingsWrap = rootRef.current.querySelector("#page-settings .settings-wrap");
    if (settingsWrap) {
      settingsWrap.className = "settings-wrap";
      settingsWrap.innerHTML = settingsMarkup;
    }
    const mcpContent = rootRef.current.querySelector("#page-mcp .content");
    if (mcpContent) {
      mcpContent.innerHTML = mcpPlaceholderMarkup;
    }
    const agentsContent = rootRef.current.querySelector("#page-agents .content");
    if (agentsContent) {
      agentsContent.innerHTML = agentsWorkspaceMarkup;
    }
    const workflowsContent = rootRef.current.querySelector("#page-workflows .content");
    if (workflowsContent) {
      workflowsContent.innerHTML = workflowWorkspaceMarkup;
    }
    const agentModelSelect = rootRef.current.querySelector<HTMLSelectElement>("#f-agent-model");
    const agentGroqGroup = Array.from(agentModelSelect?.querySelectorAll<HTMLOptGroupElement>("optgroup") ?? [])
      .find((group) => group.label === "Groq");
    if (agentModelSelect && agentGroqGroup && agentModelSelect.firstElementChild !== agentGroqGroup) {
      agentModelSelect.insertBefore(agentGroqGroup, agentModelSelect.firstElementChild);
      agentModelSelect.value = "openai/gpt-oss-20b";
    }
    const settingsPage = rootRef.current.querySelector("#page-settings");
    settingsPage?.querySelectorAll(".model-check span").forEach((modelName) => {
      modelName.setAttribute("title", modelName.textContent?.trim() ?? "");
    });
    const readSavedSettings = () => {
      try {
        return JSON.parse(localStorage.getItem("nxflow.settings") ?? "{}") as Record<string, unknown>;
      } catch {
        return {};
      }
    };
    const setFieldValue = (id: string, value: unknown) => {
      const field = settingsPage?.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`);
      if (field && typeof value === "string") field.value = value;
    };
    const setCheckboxValue = (id: string, value: unknown) => {
      const field = settingsPage?.querySelector<HTMLInputElement>(`#${id}`);
      if (field && typeof value === "boolean") field.checked = value;
    };
    const updateSettingsSummary = () => {
      if (!settingsPage) return;
      const modelCards = Array.from(settingsPage.querySelectorAll<HTMLElement>(".model-provider-card"));
      const modelLabels = modelCards.flatMap((card) => Array.from(card.querySelectorAll<HTMLLabelElement>(".model-check")));
      const enabledModels = modelLabels.filter((label) => label.querySelector<HTMLInputElement>("input")?.checked).length;
      const modelWord = enabledModels === 1 ? "model" : "models";
      const summaryModels = settingsPage.querySelector<HTMLElement>("#s-summary-models");
      const modelCountBadge = settingsPage.querySelector<HTMLElement>("#s-model-enabled-count");
      if (summaryModels) summaryModels.textContent = `${enabledModels} ${modelWord} enabled`;
      if (modelCountBadge) modelCountBadge.textContent = `${enabledModels} enabled`;
      modelCards.forEach((card) => {
        const checks = Array.from(card.querySelectorAll<HTMLInputElement>(".model-check input"));
        const enabled = checks.filter((input) => input.checked).length;
        const count = card.querySelector<HTMLElement>(".model-count");
        if (count) count.textContent = `${enabled} of ${checks.length} enabled`;
      });
      const concurrentRuns = settingsPage.querySelector<HTMLInputElement>("#s-concurrent")?.value.trim();
      const runTimeout = settingsPage.querySelector<HTMLInputElement>("#s-timeout")?.value.trim();
      const summaryRuns = settingsPage.querySelector<HTMLElement>("#s-summary-runs");
      const summaryTimeout = settingsPage.querySelector<HTMLElement>("#s-summary-timeout");
      if (summaryRuns) summaryRuns.textContent = concurrentRuns ? `${concurrentRuns} concurrent` : "No run limit";
      if (summaryTimeout) summaryTimeout.textContent = runTimeout
        ? `Default timeout is ${runTimeout} seconds.`
        : "No default timeout set.";
    };
    const applySavedSettings = () => {
      const saved = readSavedSettings();
      setCheckboxValue("s-mask-logs", saved.maskLogs);
      setCheckboxValue("s-tool-approval", saved.toolApproval);
      setCheckboxValue("s-retention", saved.shortRetention);
      setFieldValue("s-pg", saved.postgresUrl);
      setFieldValue("s-concurrent", saved.maxConcurrentRuns);
      setFieldValue("s-timeout", saved.runTimeoutSeconds);
      const enabledModels = Array.isArray(saved.enabledModels) ? saved.enabledModels : [];
      if (enabledModels.length) {
        settingsPage?.querySelectorAll<HTMLLabelElement>(".model-check").forEach((label) => {
          const name = label.querySelector("span")?.textContent?.trim();
          const checkbox = label.querySelector<HTMLInputElement>("input");
          if (name && checkbox) checkbox.checked = enabledModels.includes(name);
        });
      }
      updateSettingsSummary();
    };
    applySavedSettings();
    const summaryFields = Array.from(
      settingsPage?.querySelectorAll<HTMLInputElement>(".model-check input, #s-concurrent, #s-timeout") ?? [],
    );
    summaryFields.forEach((field) => {
      field.addEventListener("change", updateSettingsSummary);
      field.addEventListener("input", updateSettingsSummary);
    });

    const scriptTag = document.createElement("script");
    scriptTag.text = inlineScript
      .replace(
        "const TOOL_REGISTRY = [",
        "let TOOL_REGISTRY = window.__toolCatalog && window.__toolCatalog.length ? window.__toolCatalog : [",
      )
      .replace(
        "{id:'calculator',name:'Calculator',source:'Built-in',category:'Compute',provider:'NxFlow'",
        "{id:'calculator',name:'Calculator',source:'Strands',category:'Compute',provider:'Runtime'",
      )
      .replace(
        "{id:'current_time',name:'Current Time',source:'Built-in',category:'Utility',provider:'NxFlow'",
        "{id:'current_time',name:'Current Time',source:'Strands',category:'Utility',provider:'Runtime'",
      )
      .replace(
        "a?.model||'gpt-4o'",
        "a?.model||'openai/gpt-oss-20b'",
      )
      .replace(
        "{id:'http_batch_request',name:'HTTP Batch Request',source:'Built-in',category:'Actions',provider:'NxFlow'",
        "{id:'http_batch_request',name:'HTTP Batch Request',source:'Strands',category:'Actions',provider:'Runtime'",
      )
      .replace(
        "{id:'memory_lookup',name:'Memory Lookup',source:'Built-in',category:'Memory',provider:'NxFlow'",
        "{id:'memory_lookup',name:'Memory Lookup',source:'Strands',category:'Memory',provider:'Runtime'",
      )
      .replace(
        "{id:'code_exec',name:'Code Exec',source:'Built-in'",
        "{id:'code_exec',name:'Code Exec',source:'Strands'",
      )
      .replace(
        "return {'Built-in':'NxFlow platform tools', Integration:'Provider-backed tools', MCP:'Tools exposed by MCP servers'}[source]||'Tools';",
        "return {Strands:'Runtime-native tools', 'Built-in':'NxFlow platform tools', Integration:'Provider-backed tools', MCP:'Tools exposed by MCP servers'}[source]||'Tools';",
      )
      .replace(
        "return {'Built-in':'b-blue',Integration:'b-amber',MCP:'b-green'}[source]||'b-muted';",
        "return {Strands:'b-purple','Built-in':'b-blue',Integration:'b-amber',MCP:'b-green'}[source]||'b-muted';",
      )
      .replace(/\n  \{id:'mcp\.github\.search'.*?\},\n  \{id:'mcp\.filesystem\.read'.*?\},/s, "")
      .replace("  const mcpTools=TOOL_REGISTRY.filter(t=>t.source==='MCP').length;\n", "  const mcpTools=0;\n")
      .replace(
        "  const sources=[...new Set(visibleTools.map(t=>t.source))];",
        "  const sourceOrder={Strands:0,'Built-in':1,Integration:2,MCP:3};\n  const sources=[...new Set(visibleTools.map(t=>t.source))].sort((a,b)=>(sourceOrder[a]??99)-(sourceOrder[b]??99));",
      )
      .replace(
        "  const visibleTools=TOOL_REGISTRY.filter(t=>t.status==='connected'||t.status==='available');\n",
        "  const visibleTools=(DB.tools?.length?DB.tools:TOOL_REGISTRY).filter(t=>t.status==='connected'||t.status==='available');\n",
      )
      .replace(
        "const PAGE_ACTIONS={",
        'const PAGE_ACTIONS={\n  settings:`<button class="btn btn-primary" onclick="saveSettings()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Save Settings</button>`,',
      )
      .replace(/dashboard:`<button class="btn btn-primary".*?New Run<\/button>`/, "dashboard:``")
      .replace(
        'agents:`<button class="btn btn-primary"',
        'agents:`<label class="collection-search topbar-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input class="form-input" id="agent-search" type="search" placeholder="Search agents" aria-label="Search agents" oninput="filterAgents(this.value)"></label><button class="btn btn-primary"',
      )
      .replace(
        'workflows:`<button class="btn btn-primary"',
        'workflows:`<label class="collection-search topbar-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input class="form-input" id="workflow-search" type="search" placeholder="Search workflows" aria-label="Search workflows" oninput="filterWorkflows(this.value)"></label><button class="btn btn-primary"',
      )
      .replace(/function renderAgentsGrid\(\)\{.*?\n\}\n\nfunction openAgentModal/s, `${agentsRenderScript.trim()}\n\nfunction openAgentModal`)
      .replace(/function renderWorkflowsPage\(\)\{.*?\n\}\n\nfunction resetWfForm/s, `${workflowRenderScript}\n\nfunction resetWfForm`)
      .replace(/function clearCanvas\(\)\{.*?\n\}\nfunction setWfAgent\(\)\{.*?\n\}/s, workflowCanvasActionsScript.trim())
      .replace(/function addWfAgentRow\(agentId=''\)\{.*?\n\}/s, workflowAgentRowScript.trim())
      .replace(/function startTerminal\(\)\{.*?\n\}\n\n\/\/ ══════════════════════════════════════════\n\/\/ AGENTS/s, `${liveTerminalScript.trim()}\n\n// ══════════════════════════════════════════\n// AGENTS`)
      .replace(
        "const w=DB.workflows[0];",
        "const w=wfById(window.__selectedWorkflowId)||DB.workflows[0];",
      )
      .replace(
        "function saveSettings(){notify('Settings saved ✓')}",
        `async function saveSettings(){
	  const enabledModels=[...document.querySelectorAll('.model-check')].filter(label=>label.querySelector('input')?.checked).map(label=>label.querySelector('span')?.textContent?.trim()).filter(Boolean);
	  const savedSettings={
	    enabledModels,
	    maskLogs:!!document.getElementById('s-mask-logs')?.checked,
	    toolApproval:!!document.getElementById('s-tool-approval')?.checked,
	    shortRetention:!!document.getElementById('s-retention')?.checked,
	    postgresUrl:document.getElementById('s-pg')?.value||'',
	    maxConcurrentRuns:document.getElementById('s-concurrent')?.value||'',
	    runTimeoutSeconds:document.getElementById('s-timeout')?.value||'',
	  };
	  localStorage.setItem('nxflow.settings',JSON.stringify(savedSettings));
	  notify('Settings saved locally. Provider keys stay on the backend.');
	}`,
      )
      .replace(
        "nav('dashboard',document.querySelector('.nav-btn.active'));",
        `nav('${initialPage}',document.querySelectorAll('.nav-btn')[${navButtonIndex[initialPage]}]);`,
      )
      .replace(
        "document.getElementById('topbar-actions').innerHTML=PAGE_ACTIONS['dashboard'];",
        "",
      )
      .concat(`\n${workflowAgentRowScript.trim()}\n${workflowCanvasActionsScript.trim()}\n${workflowCanvasRenderScript.trim()}\n${workflowSaveScript.trim()}\n${apiWiringScript.trim()}\nif(currentPage()==='workflows') renderWorkflowsPage();`);
    document.body.appendChild(scriptTag);

    return () => {
      summaryFields.forEach((field) => {
        field.removeEventListener("change", updateSettingsSummary);
        field.removeEventListener("input", updateSettingsSummary);
      });
      scriptTag.remove();
      if (rootRef.current) rootRef.current.innerHTML = "";
    };
  }, [initialPage]);

  return <div ref={rootRef} />;
}
