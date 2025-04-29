import { useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { useTextureAtlas } from './hooks';
import { useGeometry } from './hooks';
import { useSelectedTriangleGeometry } from './hooks';
import { RenderingMode, TriangleWithVertices } from '../../types';
import { Triangle } from '@/ff7/mapfile';
import { useMapState } from '@/hooks/useMapState';
import { MESH_SIZE, SCALE } from '../../constants';
import { GridOverlay } from '../GridOverlay';
import { SELECTION_Y_OFFSET } from '../../constants';

interface WorldMeshProps {
  renderingMode: RenderingMode;
  onTriangleSelect: (triangle: Triangle | null, faceIndex: number | null) => void;
  selectedFaceIndex: number | null;
  debugCanvasRef: React.RefObject<HTMLCanvasElement>;
  mapCenter: { x: number; y: number; z: number };
  rotation: number;
  showGrid?: boolean;
  disablePainting?: boolean;
  wireframe?: boolean;
  showNormals?: boolean;
  cameraHeight?: number;
}

export function WorldMesh({ 
  renderingMode, 
  onTriangleSelect, 
  selectedFaceIndex,
  debugCanvasRef,
  mapCenter,
  rotation,
  showGrid = false,
  disablePainting,
  wireframe,
  showNormals = false,
  cameraHeight,
}: WorldMeshProps) {
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null);
  const [paintingMouseDownPos, setPaintingMouseDownPos] = useState<{ x: number; y: number } | null>(null);
  const [paintingDragActive, setPaintingDragActive] = useState(false);
  const [paintingDragStartMode, setPaintingDragStartMode] = useState<boolean | null>(null);
  const [paintingHasToggled, setPaintingHasToggled] = useState(false);
  const { textures, worldmap, mapType, addChangedMesh, mode, paintingSelectedTriangles, togglePaintingSelectedTriangle, setTriangleMap } = useMapState();
  
  const { texture, canvas, texturePositions } = useTextureAtlas(textures, mapType);
  const { geometry, triangleMap, updateTriangleUVs, updateTrianglePosition, updateColors, updateTriangleTexture } = useGeometry(worldmap, mapType, renderingMode, textures, texturePositions);
  const selectedTriangleGeometry = useSelectedTriangleGeometry(triangleMap, selectedFaceIndex);

  const selectedTriangle = triangleMap?.[selectedFaceIndex];

  // Update triangleMap in global state whenever it changes
  useEffect(() => {
    if (triangleMap) {
      setTriangleMap(triangleMap, updateColors, updateTriangleTexture);
    }
  }, [triangleMap, setTriangleMap]);

  // Set up global update functions when selected triangle changes
  useEffect(() => {
    if (window && selectedTriangle && updateTriangleUVs && updateTrianglePosition) {
      (window as any).updateTrianglePosition = function(
        v0: [number, number, number],
        v1: [number, number, number],
        v2: [number, number, number]
      ) {
        updateTrianglePosition(selectedTriangle, v0, v1, v2);
        addChangedMesh(selectedTriangle.meshOffsetZ / MESH_SIZE, selectedTriangle.meshOffsetX / MESH_SIZE);
      }
    }
    
    // Clean up functions when no triangle is selected or functions aren't available
    return () => {
      delete (window as any).updateTrianglePosition;
    }
  }, [selectedTriangle, updateTrianglePosition]);

  // Copy the texture atlas to the debug canvas
  useEffect(() => {
    if (debugCanvasRef.current && canvas) {
      const ctx = debugCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 512, 512);
        ctx.drawImage(canvas, 0, 0, 512, 512);
      }
    }
  }, [canvas, debugCanvasRef]);

  // Create normal visualization geometry
  const normalLinesGeometry = useMemo(() => {
    if (!geometry || !showNormals || !worldmap || !triangleMap) return null;

    // Count total vertices to allocate buffer
    let totalVertices = 0;
    for (let row = 0; row < worldmap.length; row++) {
      for (let col = 0; col < worldmap[row].length; col++) {
        totalVertices += worldmap[row][col].vertices.length;
      }
    }

    const linePositions = new Float32Array(totalVertices * 6); // 2 points per normal line (start and end)
    let offset = 0;

    // Process each mesh in the worldmap
    for (let row = 0; row < worldmap.length; row++) {
      for (let col = 0; col < worldmap[row].length; col++) {
        const mesh = worldmap[row][col];
        const offsetX = col * MESH_SIZE;
        const offsetZ = row * MESH_SIZE;

        // For each vertex in the mesh
        for (let i = 0; i < mesh.vertices.length; i++) {
          const vertex = mesh.vertices[i];
          const normal = mesh.normals[i];

          // Scale factor for normal visualization
          const normalScale = 500;

          // Start point of the line (vertex position)
          const startX = (vertex.x + offsetX) * SCALE;
          const startY = vertex.y * SCALE;
          const startZ = (vertex.z + offsetZ) * SCALE;

          // End point of the line (vertex + scaled normal)
          const endX = startX + normal.x * SCALE * normalScale / 4096;
          const endY = startY - normal.y * SCALE * normalScale / 4096;
          const endZ = startZ - normal.z * SCALE * normalScale / 4096;

          // Add line segment
          linePositions[offset] = startX;
          linePositions[offset + 1] = startY;
          linePositions[offset + 2] = startZ;
          linePositions[offset + 3] = endX;
          linePositions[offset + 4] = endY;
          linePositions[offset + 5] = endZ;

          offset += 6;
        }
      }
    }

    const normalGeometry = new THREE.BufferGeometry();
    normalGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    return normalGeometry;
  }, [geometry, showNormals, worldmap, triangleMap]);

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (showGrid) return;
    setMouseDownPos({ x: event.clientX, y: event.clientY });
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (showGrid || !mouseDownPos || !onTriangleSelect) return;

    // Check if mouse moved more than 5 pixels in any direction
    const dx = Math.abs(event.clientX - mouseDownPos.x);
    const dy = Math.abs(event.clientY - mouseDownPos.y);
    const isDrag = dx > 5 || dy > 5;

    setMouseDownPos(null);

    if (!isDrag && triangleMap && event.faceIndex !== undefined) {
      const selectedTriangle = triangleMap[event.faceIndex];
      (window as any).selectedTriangle = selectedTriangle;
      onTriangleSelect(selectedTriangle, event.faceIndex);
    }
  };

  const handlePaintingPointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (event.button !== 0 || disablePainting) return;
    setPaintingMouseDownPos({ x: event.clientX, y: event.clientY });
    if (mode === 'painting' && typeof event.faceIndex === 'number') {
      const alreadySelected = paintingSelectedTriangles.has(event.faceIndex);
      setPaintingDragStartMode(alreadySelected);
      togglePaintingSelectedTriangle(event.faceIndex, !alreadySelected);
      setPaintingHasToggled(true);
    }
  };

  const handlePaintingPointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (disablePainting) return;
    if (!paintingMouseDownPos) return;
    const dx = Math.abs(event.clientX - paintingMouseDownPos.x);
    const dy = Math.abs(event.clientY - paintingMouseDownPos.y);
    if (dx > 5 || dy > 5) {
      setPaintingDragActive(true);
      if (mode === 'painting' && typeof event.faceIndex === 'number' && paintingDragStartMode !== null) {
        const shouldAdd = !paintingDragStartMode;
        togglePaintingSelectedTriangle(event.faceIndex, shouldAdd);
      }
    }
  };

  const handlePaintingClick = (event: ThreeEvent<MouseEvent>) => {
    if (event.button !== 0 || disablePainting) return;
    if (mode === 'painting' && typeof event.faceIndex === 'number') {
      if (!paintingDragActive && !paintingHasToggled) {
        const isSelected = paintingSelectedTriangles.has(event.faceIndex);
        togglePaintingSelectedTriangle(event.faceIndex, !isSelected);
      }
    }
    setPaintingDragActive(false);
    setPaintingDragStartMode(null);
    setPaintingMouseDownPos(null);
    setPaintingHasToggled(false);
  };

  if (!geometry || !triangleMap) return null;

  const wireframeOpacity = cameraHeight 
    ? Math.max(0, 0.3 * (1 - Math.max(0, (cameraHeight - 1000) / 5000)))
    : 0.2;

  return (
    <group>
      <group 
        position={[mapCenter.x, 0, mapCenter.z]}
        rotation={[0, rotation, 0]}
      >
        <group position={[-mapCenter.x, 0, -mapCenter.z]}>
          <mesh 
            geometry={geometry}
            onPointerDown={mode === 'painting' ? handlePaintingPointerDown : handlePointerDown}
            onPointerMove={mode === 'painting' ? handlePaintingPointerMove : undefined}
            onClick={mode === 'painting' ? handlePaintingClick : handleClick}
            renderOrder={0}
          >
            {renderingMode === "textured" && texture ? (
              <meshBasicMaterial 
                map={texture} 
                side={THREE.DoubleSide}
                transparent={true}
                alphaTest={0.5}
                toneMapped={false}
              />
            ) : (
              <meshPhongMaterial vertexColors side={THREE.DoubleSide} />
            )}
          </mesh>
          {wireframe && (
            <mesh geometry={geometry} renderOrder={10}>
              <meshBasicMaterial 
                color="#000000"
                wireframe={true}
                transparent={true}
                opacity={wireframeOpacity}
                depthTest={true}
                depthWrite={true}
              />
            </mesh>
          )}
          {showNormals && normalLinesGeometry && (
            <lineSegments geometry={normalLinesGeometry} renderOrder={11}>
              <lineBasicMaterial 
                color="#00ff00" 
                linewidth={1}
                transparent={true}
                opacity={0.5}
                depthTest={true}
                depthWrite={true}
              />
            </lineSegments>
          )}
          {!showGrid && onTriangleSelect && selectedTriangleGeometry && mode !== 'painting' && (
            <lineSegments renderOrder={10}>
              <edgesGeometry attach="geometry" args={[selectedTriangleGeometry]} />
              <lineBasicMaterial 
                color="#ff00ff" 
                linewidth={2} 
                depthTest={false} 
                depthWrite={false}
                transparent
              />
            </lineSegments>
          )}
          {showGrid && (
            <GridOverlay 
              worldmapLength={worldmap.length} 
              worldmapWidth={worldmap[0].length} 
            />
          )}
          {mode === 'painting' && paintingSelectedTriangles.size > 0 && triangleMap && (
            Array.from(paintingSelectedTriangles).map(faceIndex => {
              const tri = triangleMap[faceIndex];
              if (!tri) return null;
              const highlightPositions = new Float32Array(9);
              highlightPositions.set([
                tri.transformedVertices.v0[0], tri.transformedVertices.v0[1] + SELECTION_Y_OFFSET, tri.transformedVertices.v0[2],
                tri.transformedVertices.v1[0], tri.transformedVertices.v1[1] + SELECTION_Y_OFFSET, tri.transformedVertices.v1[2],
                tri.transformedVertices.v2[0], tri.transformedVertices.v2[1] + SELECTION_Y_OFFSET, tri.transformedVertices.v2[2]
              ], 0);
              const selectedGeometry = new THREE.BufferGeometry();
              selectedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(highlightPositions, 3));
              selectedGeometry.computeVertexNormals();
              return (
                <group key={faceIndex}>
                  {/* White semi-transparent fill */}
                  <mesh geometry={selectedGeometry} renderOrder={9}>
                    <meshBasicMaterial 
                      color="#ffffff" 
                      transparent={true}
                      opacity={0.33}
                      side={THREE.DoubleSide}
                      depthTest={false}
                      depthWrite={false}
                    />
                  </mesh>
                  {/* Magenta outline */}
                  <lineSegments renderOrder={10}>
                    <edgesGeometry attach="geometry" args={[selectedGeometry]} />
                    <lineBasicMaterial 
                      color="#000" 
                      opacity={0.33}
                      depthTest={false} 
                      depthWrite={false}
                      transparent
                    />
                  </lineSegments>
                </group>
              );
            })
          )}
        </group>
      </group>
    </group>
  );
} 