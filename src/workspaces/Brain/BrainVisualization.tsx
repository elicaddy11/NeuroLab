import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Color, Mesh, MeshStandardMaterial, type Object3D } from "three";
import type { RefObject } from "react";
import { findBrainRegion, type BrainRegion } from "./brainData";
import {
  BRAIN_MESH_REGIONS,
  BRAIN_MODEL_URL,
  type BrainMeshRegion,
} from "./brainVisualizationData";

interface BrainVisualizationProps {
  selectedRegionId: string | null;
  revealDeepStructures: boolean;
  onSelectRegion: (region: BrainRegion) => void;
  onHoverRegion: (label: string | null) => void;
  onZoomChange: (distance: number) => void;
  controlsRef: RefObject<OrbitControlsImpl>;
}

function RegionMeshes({
  region,
  object,
  selected,
  revealDeepStructures,
  onSelect,
  onHover,
}: {
  region: BrainMeshRegion;
  object: Object3D;
  selected: boolean;
  revealDeepStructures: boolean;
  onSelect: () => void;
  onHover: (label: string | null) => void;
}) {
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    object.traverse((child) => {
      if (!(child instanceof Mesh)) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        if (!(material instanceof MeshStandardMaterial)) continue;
        const color = new Color(region.color);
        if (selected) color.lerp(new Color("#ffffff"), 0.32);
        else if (hovered) color.lerp(new Color("#ffffff"), 0.16);
        material.color.copy(color);
        material.emissive.set(region.color);
        material.emissiveIntensity = selected ? 0.42 : hovered ? 0.14 : 0.025;
        material.transparent = region.surface && revealDeepStructures;
        material.opacity = region.surface && revealDeepStructures ? (selected ? 0.58 : 0.16) : 1;
        material.depthWrite = !(region.surface && revealDeepStructures);
        material.needsUpdate = true;
      }
    });
  }, [hovered, object, region.color, region.surface, revealDeepStructures, selected]);

  return (
    <primitive
      object={object}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        onSelect();
      }}
      onPointerOver={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        setHovered(true);
        onHover(region.label);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        onHover(null);
        document.body.style.cursor = "auto";
      }}
    />
  );
}

function ModelLoadingLabel() {
  return (
    <Html center>
      <span className="brainLoadingLabel">LOADING SEGMENTED ATLAS MESH…</span>
    </Html>
  );
}

function BrainScene({
  selectedRegionId,
  revealDeepStructures,
  onSelectRegion,
  onHoverRegion,
  onZoomChange,
  controlsRef,
}: BrainVisualizationProps) {
  const { scene } = useGLTF(BRAIN_MODEL_URL);
  const atlasRoot = scene.getObjectByName("bodyparts3d-atlas");
  if (!atlasRoot) {
    throw new Error("The BodyParts3D atlas asset is missing its expected root node.");
  }

  const regionObjects = useMemo(
    () =>
      BRAIN_MESH_REGIONS.map((region) => {
        const source = atlasRoot.getObjectByName(region.id);
        if (!source) {
          throw new Error(`The BodyParts3D atlas asset is missing the ${region.label} segment.`);
        }
        const object = source.clone(true);
        object.traverse((child) => {
          if (child instanceof Mesh) {
            child.material = Array.isArray(child.material)
              ? child.material.map((material) => material.clone())
              : child.material.clone();
          }
        });
        return { region, object };
      }),
    [atlasRoot],
  );

  return (
    <>
      <fog attach="fog" args={["#090d14", 8, 15]} />
      <ambientLight intensity={0.62} />
      <hemisphereLight args={["#d8f1ff", "#111321", 0.95]} />
      <directionalLight
        position={[3.5, 5, 4]}
        color="#fff4e8"
        intensity={2.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-4, 1, -3]} color="#6e89ff" intensity={1.2} />
      <pointLight position={[0, -2.5, 3]} color="#4fd9d4" intensity={16} distance={8} />

      <group position={atlasRoot.position} rotation={atlasRoot.rotation} scale={atlasRoot.scale}>
        {regionObjects.map(({ region, object }) => {
          const entry = findBrainRegion(region.id)?.region;
          if (!entry?.details) return null;
          return (
            <RegionMeshes
              key={region.id}
              region={region}
              object={object}
              selected={selectedRegionId === region.id}
              revealDeepStructures={revealDeepStructures}
              onSelect={() => onSelectRegion(entry)}
              onHover={onHoverRegion}
            />
          );
        })}
      </group>

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableRotate
        enableZoom
        enablePan
        enableDamping
        dampingFactor={0.075}
        minDistance={2.5}
        maxDistance={8}
        minPolarAngle={0.08}
        maxPolarAngle={Math.PI - 0.08}
        onChange={() => {
          const distance = controlsRef.current?.getDistance();
          if (distance) onZoomChange(distance);
        }}
      />
    </>
  );
}

export function BrainVisualization(props: BrainVisualizationProps) {
  return (
    <Canvas
      className="brainCanvas"
      camera={{ position: [5.2, 0.14, 0], fov: 36 }}
      dpr={[1, 1.25]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      shadows
      aria-label="Interactive BodyParts3D human brain atlas with source-segmented regions."
    >
      <Suspense fallback={<ModelLoadingLabel />}>
        <BrainScene {...props} />
      </Suspense>
    </Canvas>
  );
}
