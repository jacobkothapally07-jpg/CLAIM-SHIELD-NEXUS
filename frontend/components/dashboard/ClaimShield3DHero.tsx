"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, Sphere, Icosahedron } from "@react-three/drei";
import * as THREE from "three";

const PIPELINE_NODES: {
  id: string;
  label: string;
  pos: [number, number, number];
  color: string;
  isRisk?: boolean;
}[] = [
  { id: "CLAIM", label: "CLAIM", pos: [-3.2, 0.3, 0], color: "#005f68" },
  { id: "ANALYSIS", label: "ANALYSIS", pos: [-1.6, -0.5, 0.4], color: "#209b47" },
  {
    id: "RISK",
    label: "RISK DETECTION",
    pos: [0, 0.2, 0.8],
    color: "#b91c1c",
    isRisk: true,
  },
  { id: "VERIFY", label: "VERIFICATION", pos: [1.6, 0.6, 0.3], color: "#d97706" },
  { id: "DECISION", label: "SIU DECISION", pos: [3.2, -0.2, 0], color: "#209b47" },
];

function ShieldCoreAndPipeline({ activeStage }: { activeStage: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const shieldRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);

  const linePoints = useMemo(
    () => PIPELINE_NODES.map((n) => new THREE.Vector3(...n.pos)),
    []
  );

  // Lightweight floating points
  const particlePositions = useMemo(() => {
    const arr = new Float32Array(36 * 3);
    for (let i = 0; i < 36; i++) {
      arr[i * 3] = ((Math.sin(i * 12.9898) * 43758.5453) % 1) * 8 - 4;
      arr[i * 3 + 1] = ((Math.cos(i * 78.233) * 43758.5453) % 1) * 3.6 - 1.8;
      arr[i * 3 + 2] = ((Math.sin(i * 45.164) * 43758.5453) % 1) * 3 - 1.5;
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      const targetX = state.pointer.x * 0.16;
      const targetY = state.pointer.y * 0.12;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetX,
        0.06
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        -targetY,
        0.06
      );
    }
    if (shieldRef.current) {
      shieldRef.current.rotation.y += delta * 0.18;
      shieldRef.current.rotation.z += delta * 0.08;
    }
    if (pulseRef.current) {
      const t = (state.clock.elapsedTime * 0.35) % 1;
      const idx = Math.floor(t * (PIPELINE_NODES.length - 1));
      const frac = t * (PIPELINE_NODES.length - 1) - idx;
      const p1 = linePoints[idx];
      const p2 = linePoints[Math.min(idx + 1, linePoints.length - 1)];
      pulseRef.current.position.lerpVectors(p1, p2, frac);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central Grounded Acentra Wireframe Lattice */}
      <Icosahedron ref={shieldRef} args={[1.35, 1]} position={[0, 0.1, -0.5]}>
        <meshBasicMaterial
          color="#005f68"
          wireframe
          transparent
          opacity={0.35}
        />
      </Icosahedron>

      {/* Connecting Pipeline Line */}
      <Line
        points={linePoints}
        color="#acf2e5"
        lineWidth={1.5}
        transparent
        opacity={0.5}
      />

      {/* Traveling Data Packet */}
      <Sphere ref={pulseRef} args={[0.085, 12, 12]}>
        <meshBasicMaterial color="#209b47" />
      </Sphere>

      {/* 5 Pipeline Nodes (Low-poly matte clinical for 60fps) */}
      {PIPELINE_NODES.map((node, index) => {
        const isActive = activeStage === index;
        return (
          <group key={node.id} position={node.pos}>
            <Sphere args={[isActive ? 0.23 : 0.16, 16, 16]}>
              <meshStandardMaterial
                color={node.color}
                roughness={0.6}
                metalness={0.2}
              />
            </Sphere>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry
                args={[isActive ? 0.31 : 0.23, isActive ? 0.34 : 0.25, 24]}
              />
              <meshBasicMaterial
                color={isActive ? "#acf2e5" : node.color}
                side={THREE.DoubleSide}
                transparent
                opacity={isActive ? 0.9 : 0.4}
              />
            </mesh>
          </group>
        );
      })}

      {/* Ambient Floating Data Particles */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          color="#acf2e5"
          transparent
          opacity={0.35}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

export default function ClaimShield3DHero({
  activeStage,
  onSelectStage,
}: {
  activeStage: number;
  onSelectStage: (index: number) => void;
}) {
  const stages = [
    {
      step: "01",
      name: "CLAIM INGESTION",
      desc: "10,000+ synthetic claims streamed with procedure & regional telemetry",
    },
    {
      step: "02",
      name: "MULTI-ENGINE ANALYSIS",
      desc: "Rule detectors + Isolation Forest ML + NetworkX topology",
    },
    {
      step: "03",
      name: "RISK DETECTION",
      desc: "Correlates duplicate billing, impossible travel & circular referrals",
    },
    {
      step: "04",
      name: "EVIDENCE VERIFICATION",
      desc: "Synthesizes explainable score contributions & 30/60/90d forecasts",
    },
    {
      step: "05",
      name: "SIU HUMAN DECISION",
      desc: "Prioritizes CASE-1842 for human-in-the-loop SIU investigator action",
    },
  ];

  return (
    <div className="relative rounded-2xl border border-[#acf2e5]/40 bg-[#042126] overflow-hidden shadow-[0_6px_18px_rgba(4,33,38,0.08)]">
      {/* Top Live Telemetry Bar */}
      <div className="px-4 py-2.5 border-b border-[#acf2e5]/20 flex items-center justify-between text-[11px] font-mono text-[#f2fcff]/80 bg-[#042126]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#209b47]" />
          <span>CLINICAL FWA PIPELINE TELEMETRY // SEED=42</span>
        </div>
        <span className="text-[#acf2e5] font-semibold">
          STAGE {stages[activeStage]?.step}: {stages[activeStage]?.name}
        </span>
      </div>

      {/* 3D Canvas (Optimized DPR=1 and low-power WebGL for zero lag) */}
      <div className="h-[290px] sm:h-[330px] w-full relative bg-[#042126]">
        <Canvas
          camera={{ position: [0, 0, 5.4], fov: 45 }}
          dpr={1}
          gl={{ antialias: true, powerPreference: "high-performance" }}
        >
          <ambientLight intensity={0.95} />
          <pointLight position={[5, 5, 5]} intensity={0.9} color="#acf2e5" />
          <ShieldCoreAndPipeline activeStage={activeStage} />
        </Canvas>

        {/* Interactive Overlay Stage Selector */}
        <div className="absolute bottom-3 inset-x-3 grid grid-cols-5 gap-1.5">
          {stages.map((st, idx) => {
            const active = activeStage === idx;
            return (
              <button
                key={st.step}
                type="button"
                onClick={() => onSelectStage(idx)}
                className={`text-left p-2 rounded-lg border transition-colors duration-150 ${
                  active
                    ? "bg-[#209b47] border-[#acf2e5] text-white"
                    : "bg-[#042126]/90 border-[#acf2e5]/25 text-[#f2fcff]/80 hover:border-[#acf2e5]"
                }`}
              >
                <div className="text-[10px] font-mono font-bold opacity-85">
                  {st.step}
                </div>
                <div className="text-[11px] font-bold truncate">
                  {st.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Stage Explanation Footer */}
      <div className="px-4 py-3 border-t border-[#acf2e5]/20 bg-[#005f68]/35 flex items-center justify-between text-xs">
        <span className="text-[#f2fcff]">{stages[activeStage]?.desc}</span>
        <span className="text-[11px] font-mono text-[#acf2e5] hidden sm:inline">
          Click nodes to inspect pipeline
        </span>
      </div>
    </div>
  );
}
