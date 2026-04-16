import React from 'react';
import type { Activity, ComponentMap } from '../utils/types';
import { friendlyTopicName } from '../utils/componentMap';

interface FlowPanelProps {
  activities: Activity[];
  componentMap: ComponentMap;
}

interface FlowNode {
  id: string;
  label: string;
  type: 'user' | 'plan' | 'step' | 'bot' | 'search';
  x: number;
  y: number;
}

interface FlowEdge {
  from: string;
  to: string;
}

export default function FlowPanel({ activities, componentMap }: FlowPanelProps) {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  const nodeIds = new Set<string>();
  let yOffset = 30;
  const STEP = 55;

  const addNode = (id: string, label: string, type: FlowNode['type'], x: number) => {
    if (nodeIds.has(id)) return;
    nodeIds.add(id);
    nodes.push({ id, label: label.substring(0, 24), type, x, y: yOffset });
    yOffset += STEP;
  };

  let prevId: string | null = null;

  const addEdge = (from: string, to: string) => {
    edges.push({ from, to });
  };

  for (let i = 0; i < activities.length; i++) {
    const act = activities[i];
    const vt = act.valueType || '';

    if (act.type === 'message' && act.from?.role === 'user' && act.text) {
      const id = `user_${i}`;
      const label = (act.text as string).substring(0, 20);
      addNode(id, `User: ${label}`, 'user', 60);
      if (prevId) addEdge(prevId, id);
      prevId = id;
    }

    if (vt === 'DynamicPlanReceived') {
      const v = (act.value || {}) as Record<string, unknown>;
      const planId = (v.planId as string) || `plan_${i}`;
      addNode(planId, 'Plan', 'plan', 120);
      if (prevId) addEdge(prevId, planId);
      prevId = planId;
    }

    if (vt === 'DynamicPlanStepTriggered') {
      const v = (act.value || {}) as Record<string, unknown>;
      const tid = (v.taskDialogId as string) || `step_${i}`;
      const name = friendlyTopicName(tid, componentMap) || tid;
      const id = `step_${i}`;
      addNode(id, name, 'step', 180);
      if (prevId) addEdge(prevId, id);
      prevId = id;
    }

    if (vt === 'UniversalSearchToolTraceData') {
      const id = `search_${i}`;
      addNode(id, 'Search', 'search', 180);
      if (prevId) addEdge(prevId, id);
      prevId = id;
    }

    if (act.type === 'message' && act.from?.role === 'bot' && act.text) {
      const id = `bot_${i}`;
      const label = (act.text as string).substring(0, 20);
      addNode(id, `Bot: ${label}`, 'bot', 60);
      if (prevId) addEdge(prevId, id);
      prevId = id;
    }
  }

  if (nodes.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500 text-center">
        No flow data available.
      </div>
    );
  }

  const svgHeight = Math.max(200, yOffset + 30);
  const svgWidth = 350;

  const typeColors: Record<string, string> = {
    user: '#7c3aed',
    plan: '#1d4ed8',
    step: '#d97706',
    bot: '#065f46',
    search: '#0e7490',
  };

  const getNodeById = (id: string) => nodes.find(n => n.id === id);

  return (
    <div className="p-4 overflow-auto">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Conversation Flow</h3>
      <svg width={svgWidth} height={svgHeight} className="text-xs">
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#4b5563" />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map((e, i) => {
          const from = getNodeById(e.from);
          const to = getNodeById(e.to);
          if (!from || !to) return null;
          return (
            <line
              key={i}
              x1={from.x + 60}
              y1={from.y + 12}
              x2={to.x + 60}
              y2={to.y}
              stroke="#374151"
              strokeWidth="1.5"
              markerEnd="url(#arrowhead)"
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((n, i) => (
          <g key={i}>
            <rect
              x={n.x}
              y={n.y - 4}
              width={120}
              height={26}
              rx={5}
              fill={typeColors[n.type] + '33'}
              stroke={typeColors[n.type]}
              strokeWidth="1"
            />
            <text
              x={n.x + 60}
              y={n.y + 12}
              textAnchor="middle"
              fill="#e2e8f0"
              fontSize="10"
              fontFamily="system-ui, sans-serif"
            >
              {n.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
