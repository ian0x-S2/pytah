import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  BoxGeometry,
  EdgesGeometry,
  MathUtils,
  PlaneGeometry,
  Vector3,
} from "three";
import type {
  Group,
  LineBasicMaterial,
  MeshBasicMaterial,
  OrthographicCamera as OrthographicCameraType,
  Texture,
} from "three";

import type { HeroLayerId, HeroPalette } from "./hero-layer-content";
import type { HeroTextures } from "./hero-layer-textures";

type HoverHandler = (id: HeroLayerId | null) => void;

interface LayerPlaneProps {
  children?: React.ReactNode;
  hovered: boolean;
  hoverShiftX: number;
  id: HeroLayerId;
  onHover: HoverHandler;
  palette: HeroPalette;
  position: [number, number, number];
  reducedMotion: boolean;
  size: number;
  texture: Texture;
}

const HOVER_LIFT = 0.12;
const EDGE_REST_OPACITY = 0.5;
const EDGE_HOVER_OPACITY = 0.95;
const SLAB_THICKNESS = 0.12;

/**
 * One floating tile of the stack: an SVG-textured face, crisp edge lines and
 * an optional 3D extra (slab, caret, connector) that rides along. Hovering
 * slides the tile out of the stack along `hoverShiftX` — the top tile pulls
 * left, the ones below pull right — with a slight lift and brighter edges;
 * the motion is damped so it settles instead of snapping.
 */
function LayerPlane({
  children,
  hovered,
  hoverShiftX,
  id,
  onHover,
  palette,
  position,
  reducedMotion,
  size,
  texture,
}: LayerPlaneProps) {
  const groupRef = useRef<Group | null>(null);
  const edgeMaterialRef = useRef<LineBasicMaterial | null>(null);

  const faceGeometry = useMemo(() => new PlaneGeometry(size, size), [size]);
  const edgesGeometry = useMemo(
    () => new EdgesGeometry(new PlaneGeometry(size, size)),
    [size]
  );

  useEffect(
    () => () => {
      faceGeometry.dispose();
      edgesGeometry.dispose();
    },
    [edgesGeometry, faceGeometry]
  );

  useFrame((state, delta) => {
    const group = groupRef.current;
    const edgeMaterial = edgeMaterialRef.current;
    if (!group || !edgeMaterial) {
      return;
    }

    const microBob =
      reducedMotion || hovered
        ? 0
        : Math.sin(state.clock.elapsedTime * 1.1 + position[1] * 2.4) * 0.02;
    const targetX = position[0] + (hovered ? hoverShiftX : 0);
    const targetY = position[1] + microBob + (hovered ? HOVER_LIFT : 0);
    if (reducedMotion) {
      group.position.x = targetX;
      group.position.y = targetY;
    } else {
      group.position.x = MathUtils.damp(group.position.x, targetX, 8, delta);
      group.position.y = MathUtils.damp(group.position.y, targetY, 8, delta);
    }

    const targetOpacity = hovered ? EDGE_HOVER_OPACITY : EDGE_REST_OPACITY;
    edgeMaterial.opacity = reducedMotion
      ? targetOpacity
      : MathUtils.damp(edgeMaterial.opacity, targetOpacity, 10, delta);
  });

  return (
    <group
      onPointerOut={() => onHover(null)}
      onPointerOver={(event) => {
        event.stopPropagation();
        onHover(id);
      }}
      position={position}
      ref={groupRef}
    >
      <mesh geometry={faceGeometry} rotation-x={-Math.PI / 2}>
        <meshBasicMaterial map={texture} transparent />
      </mesh>
      {/* Edges never take pointer hits — only faces drive hover. */}
      <lineSegments
        geometry={edgesGeometry}
        raycast={() => null}
        rotation-x={-Math.PI / 2}
      >
        <lineBasicMaterial
          color={palette.glyph}
          opacity={EDGE_REST_OPACITY}
          ref={edgeMaterialRef}
          transparent
        />
      </lineSegments>
      {children}
    </group>
  );
}

/** Live caret riding the slash plane; blinks on the 1.2s product cadence. */
function CaretBlink({
  palette,
  reducedMotion,
}: {
  palette: HeroPalette;
  reducedMotion: boolean;
}) {
  const materialRef = useRef<MeshBasicMaterial | null>(null);
  const geometry = useMemo(() => new PlaneGeometry(0.055, 0.3), []);

  useEffect(
    () => () => {
      geometry.dispose();
    },
    [geometry]
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.opacity =
        reducedMotion || state.clock.elapsedTime % 1.2 < 0.65 ? 1 : 0;
    }
  });

  return (
    <mesh
      geometry={geometry}
      position={[0.44, 0.004, 0.02]}
      raycast={() => null}
      rotation-x={-Math.PI / 2}
    >
      <meshBasicMaterial color={palette.glyph} ref={materialRef} transparent />
    </mesh>
  );
}

/** Isometric camera with responsive zoom, gentle pointer parallax and a fixed look-at. */
function CameraRig({ reducedMotion }: { reducedMotion: boolean }) {
  const target = useMemo(() => new Vector3(), []);

  useFrame((state, delta) => {
    const camera = state.camera as unknown as OrthographicCameraType;

    const targetZoom = state.size.height / 4.7;
    camera.zoom = reducedMotion
      ? targetZoom
      : MathUtils.damp(camera.zoom, targetZoom, 6, delta);
    camera.updateProjectionMatrix();

    target.set(
      5 + (reducedMotion ? 0 : state.pointer.x * 0.45),
      4.3 + (reducedMotion ? 0 : state.pointer.y * 0.35),
      5
    );
    const step = reducedMotion ? 1 : Math.min(1, delta * 3);
    camera.position.x += (target.x - camera.position.x) * step;
    camera.position.y += (target.y - camera.position.y) * step;
    camera.position.z += (target.z - camera.position.z) * step;
    camera.lookAt(0, 0.75, 0);
  });

  return null;
}

/** Slow whole-stack float on the 8s product cadence. */
function FloatGroup({
  children,
  reducedMotion,
}: {
  children: React.ReactNode;
  reducedMotion: boolean;
}) {
  const groupRef = useRef<Group | null>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = reducedMotion
        ? 0
        : Math.sin((state.clock.elapsedTime * Math.PI * 2) / 8) * 0.06;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

export interface HeroLayersSceneProps {
  hoveredId: HeroLayerId | null;
  onHover: HoverHandler;
  palette: HeroPalette;
  reducedMotion: boolean;
  textures: HeroTextures;
}

export function HeroLayersScene({
  hoveredId,
  onHover,
  palette,
  reducedMotion,
  textures,
}: HeroLayersSceneProps) {
  const slabGeometry = useMemo(
    () => new BoxGeometry(1.7, SLAB_THICKNESS, 1.7),
    []
  );

  useEffect(
    () => () => {
      slabGeometry.dispose();
    },
    [slabGeometry]
  );

  return (
    <>
      <CameraRig reducedMotion={reducedMotion} />
      <FloatGroup reducedMotion={reducedMotion}>
        {/* Top plane — pulls left on hover */}
        <LayerPlane
          hovered={hoveredId === "slash"}
          hoverShiftX={-0.55}
          id="slash"
          onHover={onHover}
          palette={palette}
          position={[0, 1.56, 0]}
          reducedMotion={reducedMotion}
          size={1.7}
          texture={textures.slash}
        >
          <mesh geometry={slabGeometry} position={[0, -0.07, 0]}>
            <meshBasicMaterial color={palette.extrusion} />
          </mesh>
          <CaretBlink palette={palette} reducedMotion={reducedMotion} />
        </LayerPlane>

        {/* Middle plane — pulls right on hover */}
        <LayerPlane
          hovered={hoveredId === "markdown"}
          hoverShiftX={0.55}
          id="markdown"
          onHover={onHover}
          palette={palette}
          position={[0, 0.78, 0]}
          reducedMotion={reducedMotion}
          size={1.7}
          texture={textures.markdown}
        >
          <mesh geometry={slabGeometry} position={[0, -0.07, 0]}>
            <meshBasicMaterial color={palette.extrusion} />
          </mesh>
        </LayerPlane>

        {/* Base plane — pulls right on hover */}
        <LayerPlane
          hovered={hoveredId === "mdx"}
          hoverShiftX={0.55}
          id="mdx"
          onHover={onHover}
          palette={palette}
          position={[0, 0, 0]}
          reducedMotion={reducedMotion}
          size={1.7}
          texture={textures.mdx}
        >
          <mesh geometry={slabGeometry} position={[0, -0.07, 0]}>
            <meshBasicMaterial color={palette.extrusion} />
          </mesh>
        </LayerPlane>
      </FloatGroup>
    </>
  );
}
