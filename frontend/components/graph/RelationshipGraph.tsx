"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { GraphNode, GraphEdge } from "../../types";

interface RelationshipGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  height?: number;
}

export default function RelationshipGraph({
  nodes,
  edges,
  height = 440,
}: RelationshipGraphProps) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(
    nodes[0] || null
  );

  useEffect(() => {
    if (nodes.length > 0 && (!selectedNode || !nodes.some((n) => n.id === selectedNode.id))) {
      setSelectedNode(nodes.find((n) => n.type === "Provider") || nodes[0]);
    }
  }, [nodes, selectedNode]);

  const width = 840;
  const cx = width / 2;
  const cy = height / 2;

  const positions: Record<string, { x: number; y: number }> = {};
  const centerNode =
    nodes.find((n) => n.type === "Provider") || nodes[0];

  if (centerNode) {
    positions[centerNode.id] = { x: cx, y: cy };
  }

  const otherNodes = nodes.filter((n) => n.id !== centerNode?.id);
  otherNodes.forEach((n, idx) => {
    const angle = (2 * Math.PI * idx) / Math.max(1, otherNodes.length) - Math.PI / 2;
    const radius =
      n.type === "Claim"
        ? 118
        : n.type === "Facility" || n.type === "ReferralProvider"
        ? 170
        : 150;
    positions[n.id] = {
      x: cx + Math.cos(angle) * radius * 1.35,
      y: cy + Math.sin(angle) * radius * 0.92,
    };
  });

  const getNodeColor = (node: GraphNode) => {
    switch (node.type) {
      case "Provider":
        return { fill: "#fee2e2", stroke: "#b91c1c", text: "#042126" };
      case "ReferralProvider":
        return { fill: "#005f68", stroke: "#042126", text: "#ffffff" };
      case "Facility":
        return { fill: "#209b47", stroke: "#042126", text: "#ffffff" };
      case "Member":
        return { fill: "#acf2e5", stroke: "#005f68", text: "#042126" };
      default:
        return { fill: "#ffffff", stroke: "#15497e", text: "#042126" };
    }
  };

  const connectedEdges = selectedNode
    ? edges.filter(
        (e) => e.source === selectedNode.id || e.target === selectedNode.id
      )
    : [];
  const facilityCount = connectedEdges.filter((e) =>
    e.label.includes("FACILITY")
  ).length;
  const referralCount = connectedEdges.filter((e) =>
    e.label.includes("REFERRAL")
  ).length;
  const claimCount = connectedEdges.filter(
    (e) =>
      e.source.startsWith("CLM-") ||
      e.target.startsWith("CLM-") ||
      e.label.includes("CLAIM")
  ).length;
  const suspiciousEdgeCount = connectedEdges.filter((e) => e.suspicious).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3 nexus-glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#042126]/10 flex flex-wrap items-center justify-between gap-2 text-xs bg-[#042126] text-[#f2fcff]">
          <span className="font-mono text-[11px] text-[#acf2e5] font-semibold">
            ENTITY TOPOLOGY GRAPH // CLICK ANY NODE TO INSPECT RELATIONSHIPS
          </span>
          <div className="flex flex-wrap items-center gap-3 text-[#f2fcff]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#b91c1c] inline-block" /> Provider (Flagged)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#005f68] inline-block" /> Referral
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#209b47] inline-block" /> Facility
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#acf2e5] inline-block" /> Member
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#15497e] inline-block" /> Claim
            </span>
          </div>
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none bg-[#f2fcff]"
          style={{ maxHeight: `${height}px` }}
        >
          {/* Edges */}
          {edges.map((edge) => {
            const s = positions[edge.source];
            const t = positions[edge.target];
            if (!s || !t) return null;
            const midX = (s.x + t.x) / 2;
            const midY = (s.y + t.y) / 2;
            return (
              <g key={edge.id}>
                <line
                  x1={s.x}
                  y1={s.y}
                  x2={t.x}
                  y2={t.y}
                  stroke={edge.suspicious ? "#b91c1c" : "rgba(4, 33, 38, 0.18)"}
                  strokeWidth={edge.suspicious ? 2 : 1.5}
                  strokeDasharray={edge.suspicious ? "5,3" : undefined}
                />
                <text
                  x={midX}
                  y={midY - 4}
                  textAnchor="middle"
                  fill={edge.suspicious ? "#b91c1c" : "#005f68"}
                  fontSize="9"
                  fontWeight={edge.suspicious ? "bold" : "normal"}
                >
                  {edge.label}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const pos = positions[node.id];
            if (!pos) return null;
            const colors = getNodeColor(node);
            const isSelected = selectedNode?.id === node.id;
            const r = node.type === "Provider" ? 25 : node.type === "Claim" ? 16 : 20;

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => setSelectedNode(node)}
                className="cursor-pointer"
              >
                {isSelected && (
                  <circle
                    r={r + 5}
                    fill="none"
                    stroke="#209b47"
                    strokeWidth="2"
                  />
                )}
                <circle
                  r={r}
                  fill={colors.fill}
                  stroke={isSelected ? "#209b47" : colors.stroke}
                  strokeWidth={isSelected ? 2.5 : 1.75}
                />
                <text
                  y={3.5}
                  textAnchor="middle"
                  fill={colors.text}
                  fontSize="9.5"
                  fontWeight="bold"
                >
                  {node.id.split("-")[0]}
                </text>
                <text
                  y={r + 14}
                  textAnchor="middle"
                  fill="#042126"
                  fontSize="10"
                  fontWeight={isSelected ? "bold" : "normal"}
                >
                  {node.id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Node Inspector Panel (Requirement 7) */}
      <div className="nexus-glass-card rounded-2xl p-5 flex flex-col justify-between">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-[#005f68] font-semibold mb-3">
            Selected Node Intelligence
          </div>
          {selectedNode ? (
            <div className="space-y-3">
              <div>
                <span className="inline-block text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded bg-[#acf2e5] text-[#042126] mb-1">
                  {selectedNode.type}
                </span>
                <div className="text-sm font-bold text-[#042126] break-words">
                  {selectedNode.label}
                </div>
              </div>

              {/* Structured Node Fields (Provider, Risk, Claims, Facilities, Referrals, Network Signals) */}
              <div className="p-3 rounded-xl bg-[#f2fcff] border border-[#042126]/10 text-xs text-[#042126] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#042126]/70">Risk Level:</span>
                  <span className="uppercase font-mono font-bold text-[#b91c1c]">
                    {selectedNode.risk}{" "}
                    {selectedNode.risk_score ? `(${selectedNode.risk_score}/100)` : ""}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#042126]/70">Facilities Linked:</span>
                  <span className="font-mono font-semibold">{facilityCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#042126]/70">Referral Connections:</span>
                  <span className="font-mono font-semibold">{referralCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#042126]/70">Connected Claims:</span>
                  <span className="font-mono font-semibold">{claimCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#042126]/70">Network Signals:</span>
                  <span className="font-mono font-bold text-[#b91c1c]">
                    {suspiciousEdgeCount} flagged ties
                  </span>
                </div>
                <div className="pt-1.5 border-t border-[#042126]/10 text-[11px] text-[#042126]/80">
                  {selectedNode.details}
                </div>
              </div>

              {/* Contextual Action Links */}
              {selectedNode.id.startsWith("PROV-") && (
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/providers/${selectedNode.id}`}
                    className="flex-1 text-center px-3 py-1.5 rounded-full bg-[#209b47] hover:bg-[#1b843c] text-white text-xs font-semibold transition-colors"
                  >
                    Open Provider ({selectedNode.id})
                  </Link>
                </div>
              )}

              <div>
                <div className="text-xs font-mono text-[#005f68] font-semibold uppercase mb-1.5">
                  Connected Relationships ({connectedEdges.length})
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {connectedEdges.map((e) => {
                    const other =
                      e.source === selectedNode.id ? e.target : e.source;
                    return (
                      <div
                        key={e.id}
                        className="text-xs px-3 py-1.5 rounded-lg bg-[#f2fcff] border border-[#042126]/10 flex items-center justify-between"
                      >
                        <span className="text-[#042126] font-mono font-semibold">
                          {other}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                            e.suspicious
                              ? "bg-[#fee2e2] text-[#b91c1c]"
                              : "bg-[#acf2e5] text-[#042126]"
                          }`}
                        >
                          {e.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#042126]/70">
              Select a node in the graph to inspect synthetic relationships and risk indicators.
            </p>
          )}
        </div>

        <div className="pt-3 border-t border-[#042126]/10 text-[11px] text-[#042126]/70">
          Dashed brick-red links indicate flagged referral concentration, cross-facility anomalies, or high-risk claims.
        </div>
      </div>
    </div>
  );
}
