"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { scrollState } from "@/lib/scrollState";

// The heart of the "Complexity → Intelligence" story. Every node starts as a
// random particle in a chaotic cloud and, as the scroll progresses, migrates
// into an ordered neural shell. Nearby nodes link into a glowing web and data
// pulses stream along the links. All motion is CPU-driven (a few hundred
// nodes/edges — trivial) so nodes and their connecting lines stay perfectly in
// sync frame to frame.

const nodeVertex = /* glsl */ `
  attribute float aBright;
  attribute float aSize;
  varying float vBright;
  void main() {
    vBright = aBright;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = min(aSize * (300.0 / -mv.z), 26.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const nodeFragment = /* glsl */ `
  varying float vBright;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.0, d);
    float core = smoothstep(0.18, 0.0, d);
    vec3 col = mix(uColorA, uColorB, clamp(vBright, 0.0, 1.0));
    // hottest nodes ignite toward white as they finish assembling
    col = mix(col, vec3(1.0), smoothstep(0.72, 1.0, vBright) * 0.6);
    float intensity = (soft * 0.6 + core * 0.9) * vBright;
    gl_FragColor = vec4(col * intensity, 1.0);
  }
`;

const lineVertex = /* glsl */ `
  attribute float aBright;
  varying float vBright;
  void main() {
    vBright = aBright;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const lineFragment = /* glsl */ `
  varying float vBright;
  uniform vec3 uColor;
  void main() {
    gl_FragColor = vec4(uColor * vBright, 1.0);
  }
`;

const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

export default function NeuralNetwork() {
  const group = useRef<THREE.Group>(null);
  const nodesGeo = useRef<THREE.BufferGeometry>(null);
  const linesGeo = useRef<THREE.BufferGeometry>(null);
  const pulsesGeo = useRef<THREE.BufferGeometry>(null);
  const smooth = useRef(0);

  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 768;
  const N = isMobile ? 120 : 240;
  const K = 3; // links per node
  const PULSES = isMobile ? 40 : 80;

  const data = useMemo(() => {
    // Ordered target: a Fibonacci sphere shell (the "intelligent web")
    const target = new Float32Array(N * 3);
    const chaos = new Float32Array(N * 3);
    const delay = new Float32Array(N);
    const size = new Float32Array(N);
    const R = 5.2;
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const rad = Math.sqrt(1 - y * y);
      const theta = golden * i;
      const jitter = 0.85 + Math.random() * 0.3;
      target[i * 3] = Math.cos(theta) * rad * R * jitter;
      target[i * 3 + 1] = y * R * jitter;
      target[i * 3 + 2] = Math.sin(theta) * rad * R * jitter;

      // Chaotic origin: scattered through a wide volume
      chaos[i * 3] = (Math.random() - 0.5) * 34;
      chaos[i * 3 + 1] = (Math.random() - 0.5) * 22;
      chaos[i * 3 + 2] = (Math.random() - 0.5) * 20;

      delay[i] = Math.random() * 0.4;
      size[i] = 0.7 + Math.random() * 0.9;
    }

    // Build edges: each node links to its K nearest neighbours (deduped)
    const edgeSet = new Set<string>();
    const edges: number[] = [];
    for (let i = 0; i < N; i++) {
      const dists: { j: number; d: number }[] = [];
      for (let j = 0; j < N; j++) {
        if (j === i) continue;
        const dx = target[i * 3] - target[j * 3];
        const dy = target[i * 3 + 1] - target[j * 3 + 1];
        const dz = target[i * 3 + 2] - target[j * 3 + 2];
        dists.push({ j, d: dx * dx + dy * dy + dz * dz });
      }
      dists.sort((a, b) => a.d - b.d);
      for (let k = 0; k < K; k++) {
        const j = dists[k].j;
        const key = i < j ? `${i}_${j}` : `${j}_${i}`;
        if (edgeSet.has(key)) continue;
        edgeSet.add(key);
        edges.push(i, j);
      }
    }
    const E = edges.length / 2;

    // Pulses ride a subset of edges
    const pulseEdge = new Int32Array(PULSES);
    const pulsePhase = new Float32Array(PULSES);
    const pulseSpeed = new Float32Array(PULSES);
    for (let p = 0; p < PULSES; p++) {
      pulseEdge[p] = Math.floor((p / PULSES) * E);
      pulsePhase[p] = Math.random();
      pulseSpeed[p] = 0.22 + Math.random() * 0.35;
    }

    return {
      target,
      chaos,
      delay,
      size,
      edges: new Int32Array(edges),
      E,
      pulseEdge,
      pulsePhase,
      pulseSpeed,
      assemble: new Float32Array(N),
    };
  }, [N, K, PULSES]);

  // Dynamic buffers
  const buffers = useMemo(() => {
    return {
      nodePos: new Float32Array(N * 3),
      nodeBright: new Float32Array(N),
      nodeSize: data.size,
      linePos: new Float32Array(data.E * 2 * 3),
      lineBright: new Float32Array(data.E * 2),
      pulsePos: new Float32Array(PULSES * 3),
      pulseBright: new Float32Array(PULSES),
      pulseSize: new Float32Array(PULSES).fill(2.4),
    };
  }, [N, PULSES, data]);

  const uniformsNode = useMemo(
    () => ({
      // heat-ignition ramp mapped to assembly brightness: cool violet while a
      // node is chaotic/dim ("complexity") -> warm gold as it assembles and
      // brightens ("intelligence"); the hottest cores bloom to white in-shader
      uColorA: { value: new THREE.Color("#5B3A9E") }, // violet, forming
      uColorB: { value: new THREE.Color("#FFD56A") }, // gold, alive
    }),
    []
  );
  const uniformsPulse = useMemo(
    () => ({
      uColorA: { value: new THREE.Color("#FFD56A") }, // gold
      uColorB: { value: new THREE.Color("#FFF6E5") }, // bright-node warm white
    }),
    []
  );
  const uniformsLine = useMemo(
    // connection orange, matched to the globe's network arcs (#3 pushes these
    // dimmer than the nodes so structure recedes and energy advances)
    () => ({ uColor: { value: new THREE.Color("#F57C22") } }),
    []
  );

  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();
    const damp = 1 - Math.exp(-4 * delta);
    smooth.current += (scrollState.progress - smooth.current) * damp;
    scrollState.smooth = smooth.current;
    const s = smooth.current;

    // Assembly runs across the box's scroll: chaos until ~0.1, fully ordered
    // by ~0.85. The web stays fully lit throughout the box.
    const a = smoothstep(0.1, 0.85, s);
    const dim = 1;

    const { target, chaos, delay, assemble } = data;
    const { nodePos, nodeBright } = buffers;

    for (let i = 0; i < N; i++) {
      const t = Math.min(1, Math.max(0, (a - delay[i]) / 0.55));
      const te = t * t * (3 - 2 * t);
      assemble[i] = te;

      const drift = (1 - te) * 1.0; // chaos wanders, order is calm
      const sx = Math.sin(time * 0.4 + i * 1.3) * 0.12 * (1 + drift);
      const sy = Math.cos(time * 0.35 + i * 2.1) * 0.12 * (1 + drift);

      const i3 = i * 3;
      nodePos[i3] = chaos[i3] + (target[i3] - chaos[i3]) * te + sx;
      nodePos[i3 + 1] =
        chaos[i3 + 1] + (target[i3 + 1] - chaos[i3 + 1]) * te + sy;
      nodePos[i3 + 2] =
        chaos[i3 + 2] + (target[i3 + 2] - chaos[i3 + 2]) * te;

      const shimmer = 0.75 + 0.25 * Math.sin(time * 2.0 + i);
      nodeBright[i] = (0.12 + te * 0.88) * shimmer * dim;
    }

    // Edges follow their endpoint nodes; brightness = weakest endpoint
    const { edges, E } = data;
    const { linePos, lineBright } = buffers;
    for (let e = 0; e < E; e++) {
      const a0 = edges[e * 2];
      const b0 = edges[e * 2 + 1];
      const vb = Math.min(assemble[a0], assemble[b0]) * 0.3 * dim;
      const o = e * 6;
      linePos[o] = nodePos[a0 * 3];
      linePos[o + 1] = nodePos[a0 * 3 + 1];
      linePos[o + 2] = nodePos[a0 * 3 + 2];
      linePos[o + 3] = nodePos[b0 * 3];
      linePos[o + 4] = nodePos[b0 * 3 + 1];
      linePos[o + 5] = nodePos[b0 * 3 + 2];
      lineBright[e * 2] = vb;
      lineBright[e * 2 + 1] = vb;
    }

    // Data pulses travelling along assembled edges
    const { pulseEdge, pulsePhase, pulseSpeed } = data;
    const { pulsePos, pulseBright } = buffers;
    for (let p = 0; p < PULSES; p++) {
      const e = pulseEdge[p];
      const a0 = edges[e * 2];
      const b0 = edges[e * 2 + 1];
      const live = Math.min(assemble[a0], assemble[b0]);
      const prog = (time * pulseSpeed[p] + pulsePhase[p]) % 1;
      const p3 = p * 3;
      const ax = nodePos[a0 * 3];
      const ay = nodePos[a0 * 3 + 1];
      const az = nodePos[a0 * 3 + 2];
      pulsePos[p3] = ax + (nodePos[b0 * 3] - ax) * prog;
      pulsePos[p3 + 1] = ay + (nodePos[b0 * 3 + 1] - ay) * prog;
      pulsePos[p3 + 2] = az + (nodePos[b0 * 3 + 2] - az) * prog;
      // Fade in/out at the ends so pulses don't pop
      const ends = Math.sin(prog * Math.PI);
      pulseBright[p] = live > 0.6 ? ends * live * dim : 0;
    }

    if (nodesGeo.current) {
      nodesGeo.current.attributes.position.needsUpdate = true;
      nodesGeo.current.attributes.aBright.needsUpdate = true;
    }
    if (linesGeo.current) {
      linesGeo.current.attributes.position.needsUpdate = true;
      linesGeo.current.attributes.aBright.needsUpdate = true;
    }
    if (pulsesGeo.current) {
      pulsesGeo.current.attributes.position.needsUpdate = true;
      pulsesGeo.current.attributes.aBright.needsUpdate = true;
    }

    // Slow life rotation for the whole web
    if (group.current) group.current.rotation.y = time * 0.02;
  });

  return (
    <group ref={group}>
      {/* Connections */}
      <lineSegments renderOrder={1} frustumCulled={false}>
        <bufferGeometry ref={linesGeo}>
          <bufferAttribute
            attach="attributes-position"
            args={[buffers.linePos, 3]}
          />
          <bufferAttribute
            attach="attributes-aBright"
            args={[buffers.lineBright, 1]}
          />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={lineVertex}
          fragmentShader={lineFragment}
          uniforms={uniformsLine}
          transparent
          depthTest={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* Nodes */}
      <points renderOrder={2} frustumCulled={false}>
        <bufferGeometry ref={nodesGeo}>
          <bufferAttribute
            attach="attributes-position"
            args={[buffers.nodePos, 3]}
          />
          <bufferAttribute
            attach="attributes-aBright"
            args={[buffers.nodeBright, 1]}
          />
          <bufferAttribute
            attach="attributes-aSize"
            args={[buffers.nodeSize, 1]}
          />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={nodeVertex}
          fragmentShader={nodeFragment}
          uniforms={uniformsNode}
          transparent
          depthTest={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Data pulses */}
      <points renderOrder={3} frustumCulled={false}>
        <bufferGeometry ref={pulsesGeo}>
          <bufferAttribute
            attach="attributes-position"
            args={[buffers.pulsePos, 3]}
          />
          <bufferAttribute
            attach="attributes-aBright"
            args={[buffers.pulseBright, 1]}
          />
          <bufferAttribute
            attach="attributes-aSize"
            args={[buffers.pulseSize, 1]}
          />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={nodeVertex}
          fragmentShader={nodeFragment}
          uniforms={uniformsPulse}
          transparent
          depthTest={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
