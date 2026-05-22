import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow, Background, Controls, MiniMap, ReactFlowProvider,
  addEdge, useEdgesState, useNodesState, useReactFlow, MarkerType,
  type Connection, type Edge, type Node, type NodeChange, type EdgeChange,
  type OnConnect,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { WorkflowNode } from "./WorkflowNode";
import { NodePalette } from "./NodePalette";
import { NodeInspector } from "./NodeInspector";
import { AiGeneratePanel } from "./AiGeneratePanel";
import { NODE_BY_KIND } from "@/lib/workflow-nodes";

const NODE_TYPES = { wfnode: WorkflowNode };

export type Graph = { nodes: Node[]; edges: Edge[] };

type Props = {
  workflowId: string;
  initial: Graph;
  onSave: (g: Graph) => Promise<void> | void;
  onRun: () => Promise<void> | void;
  onRegenerated: () => void;
  saving?: boolean;
  running?: boolean;
};

export function WorkflowCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}

function CanvasInner({ workflowId, initial, onSave, onRun, onRegenerated, saving, running }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initial.nodes ?? []);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initial.edges ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const rf = useReactFlow();
  const idCounter = useRef(initial.nodes?.length ? initial.nodes.length + 1 : 1);

  useEffect(() => {
    setNodes(initial.nodes ?? []);
    setEdges(initial.edges ?? []);
  }, [initial, setNodes, setEdges]);

  const onConnect: OnConnect = useCallback((c: Connection) =>
    setEdges((eds) => addEdge({ ...c, markerEnd: { type: MarkerType.ArrowClosed } }, eds)), [setEdges]);

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const kind = e.dataTransfer.getData("application/node-kind");
    if (!kind || !wrapper.current) return;
    const def = NODE_BY_KIND[kind];
    if (!def) return;
    const pos = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const id = `n${idCounter.current++}`;
    setNodes((nds) => nds.concat({
      id, type: "wfnode", position: pos,
      data: { kind, label: def.label, config: { ...def.defaultConfig } },
    }));
  }, [rf, setNodes]);

  const selected = useMemo(() => nodes.find((n) => n.id === selectedId) ?? null, [nodes, selectedId]);

  const updateSelected = (patch: Partial<{ label: string; config: Record<string, unknown> }>) => {
    if (!selectedId) return;
    setNodes((nds) => nds.map((n) => n.id === selectedId ? {
      ...n, data: { ...n.data, ...patch, config: patch.config ?? (n.data as any).config },
    } : n));
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedId && e.target !== selectedId));
    setSelectedId(null);
  };

  return (
    <div className="flex h-[calc(100vh-180px)] min-h-[520px] border border-border rounded-2xl overflow-hidden bg-card">
      <NodePalette onAiClick={() => setAiOpen(true)} />
      <div ref={wrapper} className="flex-1 relative" onDrop={onDrop} onDragOver={onDragOver}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange as (c: NodeChange[]) => void}
          onEdgesChange={onEdgesChange as (c: EdgeChange[]) => void}
          onConnect={onConnect}
          nodeTypes={NODE_TYPES}
          onNodeClick={(_, n) => setSelectedId(n.id)}
          onPaneClick={() => setSelectedId(null)}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          defaultEdgeOptions={{ markerEnd: { type: MarkerType.ArrowClosed } }}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} size={1} color="hsl(var(--border))" />
          <Controls position="bottom-right" />
          <MiniMap pannable zoomable nodeColor={(n) => NODE_BY_KIND[(n.data as any)?.kind]?.accent ?? "#64748b"} />
        </ReactFlow>
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <button
            onClick={() => onSave({ nodes, edges })}
            disabled={saving}
            className="rounded-full bg-foreground text-background text-xs font-medium px-3 py-1.5 hover:bg-foreground/90 disabled:opacity-50"
          >{saving ? "Saving…" : "Save canvas"}</button>
          <button
            onClick={() => onRun()}
            disabled={running || nodes.length === 0}
            className="rounded-full border border-border bg-background text-xs font-medium px-3 py-1.5 hover:bg-muted disabled:opacity-50"
          >{running ? "Running…" : "▶ Run"}</button>
        </div>
      </div>
      <NodeInspector selected={selected} onChange={updateSelected} onDelete={deleteSelected} />
      {aiOpen && (
        <AiGeneratePanel
          workflowId={workflowId}
          onClose={() => setAiOpen(false)}
          onGenerated={() => { setAiOpen(false); onRegenerated(); }}
        />
      )}
    </div>
  );
}
