import {
  Webhook, Clock, Hand, Bot, GitBranch, Globe, Code2, Mail,
  MessageSquare, Database, FileText, Sparkles, Filter, Repeat,
  Send, ListTree, type LucideIcon,
} from "lucide-react";

export type NodeKind =
  | "trigger.manual" | "trigger.webhook" | "trigger.schedule"
  | "ai.agent" | "ai.completion" | "ai.classify" | "ai.extract"
  | "logic.condition" | "logic.loop" | "logic.filter"
  | "action.http" | "action.email" | "action.slack" | "action.database"
  | "action.transform" | "action.document" | "action.output";

export type NodeCategory = "Triggers" | "AI" | "Logic" | "Actions";

export type NodeDef = {
  kind: NodeKind;
  label: string;
  description: string;
  category: NodeCategory;
  icon: LucideIcon;
  accent: string;
  defaultConfig: Record<string, unknown>;
  fields: Array<{
    key: string;
    label: string;
    type: "text" | "textarea" | "select" | "number" | "boolean";
    options?: string[];
    placeholder?: string;
  }>;
};

export const NODE_CATALOG: NodeDef[] = [
  // Triggers
  { kind: "trigger.manual", label: "Manual trigger", description: "Run on demand from the UI.", category: "Triggers", icon: Hand, accent: "#64748b", defaultConfig: {}, fields: [] },
  { kind: "trigger.webhook", label: "Webhook", description: "Listen for an incoming HTTP request.", category: "Triggers", icon: Webhook, accent: "#0ea5e9",
    defaultConfig: { method: "POST", path: "/hook" },
    fields: [
      { key: "method", label: "Method", type: "select", options: ["GET","POST","PUT","DELETE"] },
      { key: "path", label: "Path", type: "text", placeholder: "/hook" },
    ] },
  { kind: "trigger.schedule", label: "Schedule", description: "Run on a cron schedule.", category: "Triggers", icon: Clock, accent: "#8b5cf6",
    defaultConfig: { cron: "0 9 * * 1-5" },
    fields: [{ key: "cron", label: "Cron expression", type: "text", placeholder: "0 9 * * 1-5" }] },

  // AI
  { kind: "ai.agent", label: "AI Agent", description: "Autonomous agent with tools and memory.", category: "AI", icon: Bot, accent: "#f97316",
    defaultConfig: { model: "google/gemini-3-flash-preview", system: "You are a helpful agent.", goal: "" },
    fields: [
      { key: "model", label: "Model", type: "select", options: ["google/gemini-3-flash-preview","google/gemini-2.5-pro","google/gemini-2.5-flash","openai/gpt-5","openai/gpt-5-mini"] },
      { key: "system", label: "System prompt", type: "textarea", placeholder: "You are…" },
      { key: "goal", label: "Goal", type: "textarea", placeholder: "What should the agent achieve?" },
    ] },
  { kind: "ai.completion", label: "AI Completion", description: "Generate text from a prompt.", category: "AI", icon: Sparkles, accent: "#f59e0b",
    defaultConfig: { model: "google/gemini-3-flash-preview", prompt: "" },
    fields: [
      { key: "model", label: "Model", type: "select", options: ["google/gemini-3-flash-preview","google/gemini-2.5-flash","openai/gpt-5-mini"] },
      { key: "prompt", label: "Prompt", type: "textarea", placeholder: "Summarize…" },
    ] },
  { kind: "ai.classify", label: "AI Classify", description: "Categorize input into labels.", category: "AI", icon: ListTree, accent: "#ec4899",
    defaultConfig: { labels: "urgent, normal, low" },
    fields: [{ key: "labels", label: "Labels (comma-separated)", type: "text" }] },
  { kind: "ai.extract", label: "AI Extract", description: "Pull structured fields from text.", category: "AI", icon: FileText, accent: "#d946ef",
    defaultConfig: { fields: "name, email, company" },
    fields: [{ key: "fields", label: "Fields", type: "text", placeholder: "name, email" }] },

  // Logic
  { kind: "logic.condition", label: "Condition (If/Else)", description: "Branch by expression.", category: "Logic", icon: GitBranch, accent: "#10b981",
    defaultConfig: { expression: "input.amount > 100" },
    fields: [{ key: "expression", label: "Expression", type: "text" }] },
  { kind: "logic.loop", label: "Loop", description: "Iterate over a list.", category: "Logic", icon: Repeat, accent: "#14b8a6",
    defaultConfig: { source: "input.items" },
    fields: [{ key: "source", label: "Iterable", type: "text" }] },
  { kind: "logic.filter", label: "Filter", description: "Keep items matching a predicate.", category: "Logic", icon: Filter, accent: "#06b6d4",
    defaultConfig: { predicate: "item.active === true" },
    fields: [{ key: "predicate", label: "Predicate", type: "text" }] },

  // Actions
  { kind: "action.http", label: "HTTP Request", description: "Call any REST API.", category: "Actions", icon: Globe, accent: "#3b82f6",
    defaultConfig: { method: "GET", url: "https://" },
    fields: [
      { key: "method", label: "Method", type: "select", options: ["GET","POST","PUT","PATCH","DELETE"] },
      { key: "url", label: "URL", type: "text", placeholder: "https://api…" },
    ] },
  { kind: "action.email", label: "Send Email", description: "Send a transactional email.", category: "Actions", icon: Mail, accent: "#ef4444",
    defaultConfig: { to: "", subject: "", body: "" },
    fields: [
      { key: "to", label: "To", type: "text" },
      { key: "subject", label: "Subject", type: "text" },
      { key: "body", label: "Body", type: "textarea" },
    ] },
  { kind: "action.slack", label: "Slack Message", description: "Post to a Slack channel.", category: "Actions", icon: MessageSquare, accent: "#7c3aed",
    defaultConfig: { channel: "#general", text: "" },
    fields: [
      { key: "channel", label: "Channel", type: "text" },
      { key: "text", label: "Message", type: "textarea" },
    ] },
  { kind: "action.database", label: "Database Query", description: "Read/write to a database.", category: "Actions", icon: Database, accent: "#6366f1",
    defaultConfig: { table: "", op: "select" },
    fields: [
      { key: "table", label: "Table", type: "text" },
      { key: "op", label: "Operation", type: "select", options: ["select","insert","update","delete"] },
    ] },
  { kind: "action.transform", label: "Transform", description: "Map/reshape data with JS.", category: "Actions", icon: Code2, accent: "#0891b2",
    defaultConfig: { code: "return { ...input };" },
    fields: [{ key: "code", label: "JavaScript", type: "textarea" }] },
  { kind: "action.document", label: "Process Document", description: "Parse PDFs and OCR images.", category: "Actions", icon: FileText, accent: "#0d9488",
    defaultConfig: { source: "input.fileUrl" },
    fields: [{ key: "source", label: "File source", type: "text" }] },
  { kind: "action.output", label: "Output", description: "Return result to caller.", category: "Actions", icon: Send, accent: "#475569",
    defaultConfig: {},
    fields: [] },
];

export const NODE_BY_KIND: Record<string, NodeDef> = Object.fromEntries(
  NODE_CATALOG.map((n) => [n.kind, n]),
);

export const CATEGORIES: NodeCategory[] = ["Triggers", "AI", "Logic", "Actions"];
