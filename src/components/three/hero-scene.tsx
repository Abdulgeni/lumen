"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { type RefObject, useMemo, useRef } from "react";
import {
  BoxGeometry,
  type Group,
  type InstancedMesh,
  type Mesh,
  Object3D,
  OctahedronGeometry,
} from "three";

export type Quality = "high" | "low";
export type Pointer = { x: number; y: number };

/** Deterministic particles, so renders are reproducible. */
function createParticles(count: number) {
  let seed = 42;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  return Array.from({ length: count }, () => ({
    radius: 2.5 + next() * 6.5,
    angle: next() * Math.PI * 2,
    y: (next() - 0.5) * 6,
    speed: 0.2 + next() * 0.4,
    scale: 0.02 + next() * 0.05,
  }));
}

const CRYSTAL = new OctahedronGeometry(1.6, 1);
const BOX = new BoxGeometry(1, 1, 1);

function Scene({
  quality,
  progress,
  pointer,
}: {
  quality: Quality;
  progress: RefObject<number>;
  pointer: RefObject<Pointer>;
}) {
  const particles = useMemo(() => createParticles(quality === "high" ? 600 : 220), [quality]);
  const prism = useRef<Group>(null);
  const core = useRef<Mesh>(null);
  const swarm = useRef<InstancedMesh>(null);
  const beams = useRef<Group>(null);
  const dummy = useMemo(() => new Object3D(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const scroll = progress.current;
    const tiltX = (pointer.current.x * Math.PI) / 8;
    const tiltY = (pointer.current.y * Math.PI) / 8;

    if (prism.current) {
      prism.current.rotation.y = t * 0.15 + scroll * Math.PI * 2;
      prism.current.rotation.x = Math.sin(t * 0.1) * 0.2 + tiltY * 0.3;
      prism.current.rotation.z = Math.cos(t * 0.12) * 0.15 + tiltX * 0.3;
      prism.current.position.y = Math.sin(t * 0.7) * 0.15;
    }
    if (core.current) core.current.rotation.y = -t * 0.25;

    if (swarm.current) {
      const pull = Math.sin(scroll * Math.PI) * 1.5;
      particles.forEach((p, i) => {
        const angle = p.angle + t * p.speed;
        const radius = Math.max(0.8, p.radius - pull);
        dummy.position.set(
          Math.cos(angle) * radius,
          p.y + Math.sin(t + i) * 0.2,
          Math.sin(angle) * radius,
        );
        dummy.scale.setScalar(p.scale);
        dummy.rotation.set(t * 0.2 + i, t * 0.3, 0);
        dummy.updateMatrix();
        swarm.current?.setMatrixAt(i, dummy.matrix);
      });
      swarm.current.instanceMatrix.needsUpdate = true;
    }

    if (beams.current) {
      beams.current.rotation.z = Math.sin(t * 0.3) * 0.05;
      beams.current.position.x = 1.4 + Math.sin(t * 0.5) * 0.1;
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={1.8} color="#FFE6B3" />
      <directionalLight position={[-5, -4, -3]} intensity={0.8} color="#C8A96A" />
      <pointLight position={[0, 0, 3]} intensity={2.5} color="#E6D3A3" distance={8} />

      <group ref={prism}>
        <mesh geometry={CRYSTAL}>
          {quality === "high" ? (
            <meshPhysicalMaterial
              roughness={0.06}
              metalness={0.15}
              transmission={0.88}
              ior={1.62}
              thickness={1.5}
              clearcoat={1}
              clearcoatRoughness={0.05}
              color="#E6D3A3"
              emissive="#2A2010"
              emissiveIntensity={0.2}
              transparent
              opacity={0.85}
            />
          ) : (
            <meshPhysicalMaterial
              roughness={0.1}
              metalness={0.3}
              clearcoat={1}
              color="#E6D3A3"
              emissive="#C8A96A"
              emissiveIntensity={0.25}
              transparent
              opacity={0.55}
            />
          )}
        </mesh>

        <mesh ref={core} scale={0.55}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color="#C8A96A"
            metalness={0.85}
            roughness={0.2}
            emissive="#C8A96A"
            emissiveIntensity={0.4}
            wireframe
          />
        </mesh>

        <group ref={beams} position={[1.4, 0, 0]}>
          {[-0.6, -0.2, 0.2, 0.6].map((offset, index) => (
            <mesh key={offset} position={[1.2, offset, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.015, 0.04, 3, 8]} />
              <meshBasicMaterial
                color={index % 2 === 0 ? "#E6D3A3" : "#C8A96A"}
                transparent
                opacity={0.45}
              />
            </mesh>
          ))}
        </group>
      </group>

      <instancedMesh key={particles.length} ref={swarm} args={[BOX, undefined, particles.length]}>
        <meshStandardMaterial
          color="#E6D3A3"
          emissive="#C8A96A"
          emissiveIntensity={0.6}
          roughness={0.3}
          metalness={0.7}
        />
      </instancedMesh>
    </>
  );
}

export function HeroScene({
  quality,
  active,
  progress,
  pointer,
  onFail,
}: {
  quality: Quality;
  active: boolean;
  progress: RefObject<number>;
  pointer: RefObject<Pointer>;
  onFail: () => void;
}) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 0, 5], fov: 45 }}
      dpr={quality === "high" ? [1, 1.75] : [1, 1.25]}
      gl={{
        antialias: quality === "high",
        alpha: true,
        powerPreference: quality === "high" ? "high-performance" : "default",
      }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener(
          "webglcontextlost",
          (event) => {
            event.preventDefault();
            onFail();
          },
          { once: true },
        );
      }}
    >
      <Scene quality={quality} progress={progress} pointer={pointer} />
    </Canvas>
  );
}
