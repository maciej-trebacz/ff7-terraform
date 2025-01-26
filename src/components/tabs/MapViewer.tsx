import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Canvas, ThreeEvent, useThree } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';
import * as THREE from 'three';
import { Coords, Mesh, Triangle } from '@/ff7/mapfile';
import { useMapState } from '@/hooks/useMapState';
import { WorldMapTexture } from '@/ff7/texfile';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { PerspectiveCamera } from 'three';

const SHOW_DEBUG = false;

type MapType = "overworld" | "underwater" | "glacier";
type RenderingMode = "terrain" | "textured" | "region" | "scripts";

const CAMERA_HEIGHT: Record<MapType, number> = {
  overworld: 10200,
  underwater: 5800,
  glacier: 2900
};

const LOCATION_COLORS: Record<MapType, Record<number, string>> = {
  overworld: {
    0: '#4c3', 1: '#3a3', 2: '#977', 3: '#00a', 4: '#00c', 5: '#00d', 6: '#14f', 7: '#898',
    8: '#ee7', 9: '#aa5', 10: '#eee', 11: '#ff0', 12: '#aa0', 13: '#0d0', 14: '#0e0', 15: '#0f0',
    16: '#6a5', 17: '#ffa', 18: '#668', 19: '#aa7', 20: '#bba', 21: '#a88', 22: '#0af', 23: '#000',
    24: '#ee7', 25: '#282', 26: '#008', 27: '#fbb', 28: '#ffc', 29: '#b99', 30: '#c99'
  },
  underwater: {
    0: '#258',
    3: '#69a',
    15: '#479'
  },
  glacier: {
    1: '#aaa',
    2: '#cce',
    9: '#eee',
    10: '#fff'
  }
};

const REGION_COLORS: Record<MapType, Record<number, string>> = {
  overworld: {
    0: '#605a5a', 1: '#5c3', 2: '#69c', 3: '#988', 4: '#d0a040', 5: '#492', 6: '#aa6039', 7: '#809080',
    8: '#6a7', 9: '#e65', 10: '#5e5', 11: '#fff', 12: '#a86', 13: '#c97', 14: '#0d0', 15: '#8f0',
    16: '#f9a', 17: '#00a'
  },
  underwater: {
     0: '#258',
     18: '#69a'
  },
  glacier: {
    11: '#fff',
  }
};

const SCRIPT_COLORS = {
  none: '#6a6a6a',      // Gray for no script
  chocobo: '#ffff00',   // Yellow for chocobo areas
  script: {
    1: '#555555',       // Light gray
    2: '#000000',       // Unused
    3: '#ff4a00',       // Light red
    4: '#ff0000',       // Red-orange
    5: '#ff5500',       // Bright red
    6: '#ff8800',       // Pure red
    7: '#ffaa00',       // Dark red
    8: '#cc0000'        // Darker red
  }
} as const;

const MESH_SIZE = 8192;
const SCALE = 0.05;
const ATLAS_SIZE = 2048;

interface TriangleWithVertices extends Triangle {
  transformedVertices: {
    v0: [number, number, number];
    v1: [number, number, number];
    v2: [number, number, number];
  };
}

function createTextureAtlas(textures: WorldMapTexture[]) {
  // Create a texture atlas of 1024x1024 pixels
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_SIZE;
  canvas.height = ATLAS_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, ATLAS_SIZE, ATLAS_SIZE);

  // Keep track of texture positions in the atlas
  const texturePositions = new Map<number, { x: number, y: number, name: string }>();
  
  // Current position in the atlas
  let currentX = 0;
  let currentY = 0;
  let rowHeight = 0;

  // Add 1px padding between textures
  const PADDING = 1;

  // For each texture that has been loaded
  let loadedCount = 0;
  textures.forEach((texture) => {
    if (!texture.tex) return;
    loadedCount++;

    // If this texture won't fit in current row, move to next row
    if (currentX + texture.width + PADDING * 2 > ATLAS_SIZE) {
      currentX = 0;
      currentY += rowHeight + PADDING;
      rowHeight = 0;
    }

    // Store the position where this texture will be placed (including padding)
    texturePositions.set(texture.id, { 
      x: currentX + PADDING, 
      y: currentY + PADDING, 
      name: texture.name 
    });

    // Get the raw pixel data
    const pixels = texture.tex.getPixels();
    
    // Create an ImageData object
    const imageData = new ImageData(
      new Uint8ClampedArray(pixels.buffer),
      texture.width,
      texture.height
    );

    // Create a temporary canvas to draw the texture
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = texture.width + PADDING * 2;
    tempCanvas.height = texture.height + PADDING * 2;
    const tempCtx = tempCanvas.getContext('2d')!;

    // Draw the main texture
    tempCtx.putImageData(imageData, PADDING, PADDING);

    // Extend edge pixels to prevent seams
    // Top edge
    tempCtx.drawImage(tempCanvas, 
      PADDING, PADDING, texture.width, 1,  // source
      PADDING, 0, texture.width, PADDING   // destination
    );
    // Bottom edge
    tempCtx.drawImage(tempCanvas,
      PADDING, texture.height + PADDING - 1, texture.width, 1,  // source
      PADDING, texture.height + PADDING, texture.width, PADDING // destination
    );
    // Left edge
    tempCtx.drawImage(tempCanvas,
      PADDING, PADDING, 1, texture.height,  // source
      0, PADDING, PADDING, texture.height   // destination
    );
    // Right edge
    tempCtx.drawImage(tempCanvas,
      texture.width + PADDING - 1, PADDING, 1, texture.height,  // source
      texture.width + PADDING, PADDING, PADDING, texture.height // destination
    );
    // Corners
    tempCtx.drawImage(tempCanvas,
      PADDING, PADDING, 1, 1,  // source
      0, 0, PADDING, PADDING   // top-left
    );
    tempCtx.drawImage(tempCanvas,
      texture.width + PADDING - 1, PADDING, 1, 1,  // source
      texture.width + PADDING, 0, PADDING, PADDING // top-right
    );
    tempCtx.drawImage(tempCanvas,
      PADDING, texture.height + PADDING - 1, 1, 1,  // source
      0, texture.height + PADDING, PADDING, PADDING // bottom-left
    );
    tempCtx.drawImage(tempCanvas,
      texture.width + PADDING - 1, texture.height + PADDING - 1, 1, 1,  // source
      texture.width + PADDING, texture.height + PADDING, PADDING, PADDING // bottom-right
    );

    // Draw the padded texture onto the atlas
    ctx.drawImage(
      tempCanvas,
      currentX,
      currentY,
      texture.width + PADDING * 2,
      texture.height + PADDING * 2
    );

    // Update position tracking
    currentX += texture.width + PADDING * 2;
    rowHeight = Math.max(rowHeight, texture.height + PADDING * 2);
  });
  console.log(`[MapViewer] Loaded ${loadedCount} textures into atlas`);
  console.log(`[MapViewer] Texture positions:`, texturePositions);

  // Create a Three.js texture from the atlas
  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  return { texture, canvas, texturePositions };
}

// Debug component to show camera info
function CameraDebugOverlay({ debugInfo }: { debugInfo: string }) {
  return (
    <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg font-mono text-sm whitespace-pre">
      {debugInfo}
    </div>
  );
}

function CameraDebugInfo({ onDebugInfo }: { onDebugInfo: (info: string) => void }) {
  const { camera, scene } = useThree();

  useEffect(() => {
    const updateDebugInfo = () => {
      const pos = camera.position;
      const euler = new THREE.Euler().setFromQuaternion(camera.quaternion);
      
      const info = `
Camera:
  Position: ${pos.x.toFixed(0)}, ${pos.y.toFixed(0)}, ${pos.z.toFixed(0)}
  Rotation: ${(euler.x * 180/Math.PI).toFixed(1)}°, ${(euler.y * 180/Math.PI).toFixed(1)}°, ${(euler.z * 180/Math.PI).toFixed(1)}°
  Up: ${camera.up.x.toFixed(2)}, ${camera.up.y.toFixed(2)}, ${camera.up.z.toFixed(2)}
Scene:
  Children: ${scene.children.length}
`.trim();
      onDebugInfo(info);
    };

    // Update every frame
    const interval = setInterval(updateDebugInfo, 100);
    return () => clearInterval(interval);
  }, [camera, scene, onDebugInfo]);

  return null;
}

function MapViewer({ worldmap, mapType, renderingMode = "terrain", onTriangleSelect }: { 
  worldmap: Mesh[][] | null, 
  mapType: MapType,
  renderingMode?: RenderingMode,
  onTriangleSelect?: (triangle: Triangle | null) => void
}) {
  const [selectedFaceIndex, setSelectedFaceIndex] = useState<number | null>(null);
  const [debugInfo, setDebugInfo] = useState('');
  const debugCanvasRef = useRef<HTMLCanvasElement>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const cameraRef = useRef<PerspectiveCamera>();

  const handleTriangleSelect = (triangle: Triangle | null, faceIndex: number | null) => {
    setSelectedFaceIndex(faceIndex);
    if (onTriangleSelect) {
      onTriangleSelect(triangle);
    }
  };

  // Calculate map center and size
  const mapCenter = useMemo(() => {
    if (!worldmap || !worldmap.length) return { x: 0, y: 0, z: 0 };
    const sizeZ = worldmap.length * MESH_SIZE * SCALE;
    const sizeX = worldmap[0].length * MESH_SIZE * SCALE;
    return {
      x: sizeX / 2,
      y: 0,
      z: sizeZ / 2
    };
  }, [worldmap]);

  // Recenter camera when map type changes
  useEffect(() => {
    if (controlsRef.current && mapCenter) {
      controlsRef.current.target.set(mapCenter.x, mapCenter.y, mapCenter.z);
      controlsRef.current.update();
    }
  }, [mapType, mapCenter]);

  // Update camera position when mapCenter changes
  useEffect(() => {
    if (cameraRef.current && mapCenter) {
      const camera = cameraRef.current as PerspectiveCamera;
      camera.position.set(mapCenter.x, CAMERA_HEIGHT[mapType], mapCenter.z);
      camera.lookAt(mapCenter.x, mapCenter.y, mapCenter.z);
      camera.updateProjectionMatrix();
    }
  }, [mapType, mapCenter]);

  return (
    <div className="relative w-full h-full">
      <Canvas
        style={{ width: '100%', height: '100%' }}
        camera={{
          position: [0, CAMERA_HEIGHT[mapType], 0],
          fov: 60,
          near: 0.1,
          far: 1000000,
          up: [0, 0, -1]
        }}
        onCreated={({ camera }) => {
          cameraRef.current = camera as PerspectiveCamera;
          if (mapCenter) {
            camera.position.set(mapCenter.x, CAMERA_HEIGHT[mapType], mapCenter.z);
            camera.lookAt(mapCenter.x, mapCenter.y, mapCenter.z);
            camera.updateProjectionMatrix();
          }
        }}
      >
        {SHOW_DEBUG && <Stats />}
        {SHOW_DEBUG && <CameraDebugInfo onDebugInfo={setDebugInfo} />}
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[20000, 40000, 20000]}
          intensity={renderingMode === "textured" ? 4.0 : 1.0}
          castShadow
        />
        {worldmap && (
          <WorldmapMesh 
            worldmap={worldmap} 
            mapType={mapType} 
            renderingMode={renderingMode} 
            onTriangleSelect={handleTriangleSelect}
            selectedFaceIndex={selectedFaceIndex}
            debugCanvasRef={debugCanvasRef}
            controlsRef={controlsRef}
            mapCenter={mapCenter}
          />
        )}
      </Canvas>
      {SHOW_DEBUG && <CameraDebugOverlay debugInfo={debugInfo} />}
    </div>
  );
}

function WorldmapMesh({ worldmap, mapType, renderingMode, onTriangleSelect, selectedFaceIndex, debugCanvasRef, controlsRef, mapCenter }: { 
  worldmap: Mesh[][], 
  mapType: MapType,
  renderingMode: RenderingMode,
  onTriangleSelect?: (triangle: Triangle | null, faceIndex: number | null) => void,
  selectedFaceIndex: number | null,
  debugCanvasRef: React.RefObject<HTMLCanvasElement>,
  controlsRef: React.RefObject<OrbitControlsImpl>,
  mapCenter: { x: number, y: number, z: number }
}) {
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null);
  const { textures } = useMapState();
  
  // Check if all textures are loaded
  const loadedTextures = useMemo(() => {
    const loaded = textures.filter(t => t.tex !== null);
    console.log(`[MapViewer] ${loaded.length}/${textures.length} textures loaded`);
    return loaded;
  }, [textures]);

  // Only create texture atlas when all textures are loaded
  const { texture, canvas, texturePositions } = useMemo(() => {
    if (loadedTextures.length === 0) {
      console.log('[MapViewer] No textures loaded yet, skipping atlas creation');
      return { texture: null, canvas: null, texturePositions: new Map<number, { x: number, y: number }>() };
    }
    console.log('[MapViewer] Creating texture atlas...');
    return createTextureAtlas(loadedTextures);
  }, [loadedTextures]);

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

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    setMouseDownPos({ x: event.clientX, y: event.clientY });
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (!mouseDownPos) return;

    // Check if mouse moved more than 5 pixels in any direction
    const dx = Math.abs(event.clientX - mouseDownPos.x);
    const dy = Math.abs(event.clientY - mouseDownPos.y);
    const isDrag = dx > 5 || dy > 5;

    setMouseDownPos(null);

    if (!isDrag && triangleMap && event.faceIndex !== undefined && onTriangleSelect) {
      const selectedTriangle = triangleMap[event.faceIndex];
      onTriangleSelect(selectedTriangle, event.faceIndex);
    }
  };

  const { geometry, triangleMap } = useMemo(() => {
    if (!worldmap || !worldmap.length) return { geometry: null, triangleMap: null };

    console.log(`[MapViewer] Creating geometry for ${worldmap.length}x${worldmap[0].length} worldmap`);
    console.log(worldmap);

    let totalTris = 0;
    for (const row of worldmap) {
      for (const mesh of row) {
        totalTris += mesh.numTriangles;
      }
    }

    const positions = new Float32Array(totalTris * 3 * 3);
    const colors = new Float32Array(totalTris * 3 * 3);
    const uvs = new Float32Array(totalTris * 3 * 2);
    const triangleMap: TriangleWithVertices[] = [];

    let offset = 0;
    let uvOffset = 0;

    const terrainColorMap = LOCATION_COLORS[mapType];
    const regionColorMap = REGION_COLORS[mapType];
    const defaultColor = new THREE.Color('#444');

    for (let row = 0; row < worldmap.length; row++) {
      for (let col = 0; col < worldmap[row].length; col++) {
        const mesh = worldmap[row][col];
        const offsetX = col * MESH_SIZE;
        const offsetZ = row * MESH_SIZE;

        for (const tri of mesh.triangles) {
          const transformedVertices = {
            v0: [0, 0, 0] as [number, number, number],
            v1: [0, 0, 0] as [number, number, number],
            v2: [0, 0, 0] as [number, number, number]
          };

          let color: THREE.Color;
          
          if (renderingMode === "region") {
            const regionIdx = tri.locationId % 32;
            const colorHex = regionColorMap[regionIdx];
            color = colorHex ? new THREE.Color(colorHex) : defaultColor;
          } else if (renderingMode === "terrain") {
            const colorHex = terrainColorMap[tri.type];
            color = colorHex ? new THREE.Color(colorHex) : defaultColor;
          } else if (renderingMode === "scripts") {
            if (tri.isChocobo) {
              color = new THREE.Color(SCRIPT_COLORS.chocobo);
            } else if (tri.script > 0) {
              color = new THREE.Color(SCRIPT_COLORS.script[tri.script as keyof typeof SCRIPT_COLORS.script] || SCRIPT_COLORS.script[8]);
            } else {
              color = new THREE.Color(SCRIPT_COLORS.none);
            }
          } else {
            color = new THREE.Color('#fff');
          }

          function setPosColor(v: Coords, vertexIndex: 0 | 1 | 2) {
            const x = (v.x + offsetX) * SCALE;
            const y = v.y * SCALE;
            const z = (v.z + offsetZ) * SCALE;

            positions[offset] = x;
            positions[offset+1] = y;
            positions[offset+2] = z;

            colors[offset] = color.r;
            colors[offset + 1] = color.g;
            colors[offset + 2] = color.b;

            // Store transformed vertices
            const vertexKey = `v${vertexIndex}` as keyof typeof transformedVertices;
            transformedVertices[vertexKey] = [x, y, z] as [number, number, number];

            offset += 3;
          }

          setPosColor(tri.vertex0, 0);
          setPosColor(tri.vertex1, 1);
          setPosColor(tri.vertex2, 2);

          // Add UV coordinates
          const texture = textures[tri.texture];
          if (texture && texturePositions.has(tri.texture)) {
            const pos = texturePositions.get(tri.texture)!;
            
            // Calculate UVs based on texture position in atlas
            const u0 = (pos.x + Math.abs(tri.uVertex0 - texture.uOffset) % texture.width) / ATLAS_SIZE;
            const v0 = (pos.y + Math.abs(tri.vVertex0 - texture.vOffset) % texture.height) / ATLAS_SIZE;
            const u1 = (pos.x + Math.abs(tri.uVertex1 - texture.uOffset) % texture.width) / ATLAS_SIZE;
            const v1 = (pos.y + Math.abs(tri.vVertex1 - texture.vOffset) % texture.height) / ATLAS_SIZE;
            const u2 = (pos.x + Math.abs(tri.uVertex2 - texture.uOffset) % texture.width) / ATLAS_SIZE;
            const v2 = (pos.y + Math.abs(tri.vVertex2 - texture.vOffset) % texture.height) / ATLAS_SIZE;

            uvs[uvOffset] = u0;
            uvs[uvOffset + 1] = v0;
            uvs[uvOffset + 2] = u1;
            uvs[uvOffset + 3] = v1;
            uvs[uvOffset + 4] = u2;
            uvs[uvOffset + 5] = v2;
          }
          uvOffset += 6;

          triangleMap.push({ ...tri, transformedVertices });
        }
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.computeVertexNormals();

    return { geometry: geom, triangleMap };
  }, [worldmap, mapType, renderingMode, textures, texturePositions]);

  const selectedTriangleGeometry = useMemo(() => {
    if (!triangleMap || selectedFaceIndex === null) return null;

    const tri = triangleMap[selectedFaceIndex];
    if (!tri) return null;

    const highlightPositions = new Float32Array(9);
    
    // Copy the transformed vertices directly
    highlightPositions.set(tri.transformedVertices.v0, 0);
    highlightPositions.set(tri.transformedVertices.v1, 3);
    highlightPositions.set(tri.transformedVertices.v2, 6);

    const selectedGeometry = new THREE.BufferGeometry();
    selectedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(highlightPositions, 3));
    selectedGeometry.computeVertexNormals();

    return selectedGeometry;
  }, [triangleMap, selectedFaceIndex]);

  if (!geometry || !triangleMap) return null;

  return (
    <group>
      <mesh 
        geometry={geometry} 
        onClick={handleClick}
        onPointerDown={handlePointerDown}
      >
        {renderingMode === "textured" && texture ? (
          <meshPhongMaterial 
            map={texture} 
            side={THREE.DoubleSide}
            transparent={true}
            alphaTest={0.5}
          />
        ) : (
          <meshPhongMaterial vertexColors side={THREE.DoubleSide} />
        )}
      </mesh>
      {selectedTriangleGeometry && (
        <lineSegments>
          <edgesGeometry attach="geometry" args={[selectedTriangleGeometry]} />
          <lineBasicMaterial color="#ff00ff" linewidth={2} />
        </lineSegments>
      )}
      <OrbitControls ref={controlsRef} target={[mapCenter.x, mapCenter.y, mapCenter.z]} />
    </group>
  );
}

export default MapViewer;