import { useMemo, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { Mesh } from '@/ff7/mapfile';
import { WorldMapTexture } from '@/ff7/texfile';
import { MapType, RenderingMode, TriangleWithVertices } from '../../types';
import { LOCATION_COLORS, MESH_SIZE, REGION_COLORS, SCALE, SCRIPT_COLORS, SELECTION_Y_OFFSET, ATLAS_SIZE } from '../../constants';
import { createTextureAtlas } from './utils';
import { calcUV } from '@/lib/utils';

export function useTextureAtlas(textures: WorldMapTexture[], mapType: MapType) {
  // Check if all textures are loaded
  const loadedTextures = useMemo(() => {
    const loaded = textures.filter(t => t.tex !== null);
    console.log(`[MapViewer] ${loaded.length}/${textures.length} textures loaded for ${mapType}`);
    return loaded;
  }, [textures, mapType]);

  // Only create texture atlas when all textures are loaded
  return useMemo(() => {
    if (loadedTextures.length === 0) {
      console.log('[MapViewer] No textures loaded yet, skipping atlas creation');
      return { texture: null, canvas: null, texturePositions: new Map<number, { x: number, y: number, name: string }>() };
    }
    console.log(`[MapViewer] Creating texture atlas for ${mapType}...`);
    return createTextureAtlas(loadedTextures);
  }, [loadedTextures, mapType]);
}

export function useGeometry(
  worldmap: Mesh[][], 
  mapType: MapType, 
  renderingMode: RenderingMode,
  textures: WorldMapTexture[],
  texturePositions: Map<number, { x: number, y: number, name: string }>
) {
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);
  const triangleMapRef = useRef<TriangleWithVertices[] | null>(null);

  const result = useMemo(() => {
    if (!worldmap || !worldmap.length) return { geometry: null, triangleMap: null };

    console.log(`[MapViewer] Creating geometry for ${worldmap.length}x${worldmap[0].length} worldmap`);

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

          function setPosColor(v: { x: number, y: number, z: number }, vertexIndex: 0 | 1 | 2) {
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

          // Add UV coordinates for textured mode
          const texture = textures[tri.texture];

          const isUnderwaterOutside = texture?.name.includes("cltr") && tri.uVertex0 === 254;
          if (texture && texturePositions.has(tri.texture) && !isUnderwaterOutside) {
            const pos = texturePositions.get(tri.texture)!;

            // Calculate UVs based on texture position in atlas
            const u0 = (pos.x + calcUV(tri.uVertex0, texture.uOffset, texture.width)) / ATLAS_SIZE;
            const v0 = (pos.y + calcUV(tri.vVertex0, texture.vOffset, texture.height)) / ATLAS_SIZE;
            const u1 = (pos.x + calcUV(tri.uVertex1, texture.uOffset, texture.width)) / ATLAS_SIZE;
            const v1 = (pos.y + calcUV(tri.vVertex1, texture.vOffset, texture.height)) / ATLAS_SIZE;
            const u2 = (pos.x + calcUV(tri.uVertex2, texture.uOffset, texture.width)) / ATLAS_SIZE;
            const v2 = (pos.y + calcUV(tri.vVertex2, texture.vOffset, texture.height)) / ATLAS_SIZE;

            uvs[uvOffset] = u0;
            uvs[uvOffset + 1] = v0;
            uvs[uvOffset + 2] = u1;
            uvs[uvOffset + 3] = v1;
            uvs[uvOffset + 4] = u2;
            uvs[uvOffset + 5] = v2;
          }
          uvOffset += 6;

          triangleMap.push({ 
            ...tri, 
            transformedVertices,
            meshOffsetX: offsetX,
            meshOffsetZ: offsetZ
          });
        }
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.computeVertexNormals();

    geometryRef.current = geom;
    triangleMapRef.current = triangleMap;

    return { geometry: geom, triangleMap };
  }, [worldmap, mapType, renderingMode, textures, texturePositions]);

  const updateTriangleUVs = useCallback((
    triangle: TriangleWithVertices,
    uVertex0: number,
    vVertex0: number,
    uVertex1: number,
    vVertex1: number,
    uVertex2: number,
    vVertex2: number
  ) => {
    if (!geometryRef.current || !triangleMapRef.current) return;

    const triangleId = triangleMapRef.current.findIndex(t => t === triangle);
    if (triangleId === -1) return;

    const texture = textures[triangle.texture];
    const pos = texturePositions.get(triangle.texture);
    
    if (!texture || !pos) return;

    const uvAttribute = geometryRef.current.getAttribute('uv') as THREE.BufferAttribute;
    const uvs = uvAttribute.array as Float32Array;

    // Calculate UVs based on texture position in atlas
    const u0 = (pos.x + calcUV(uVertex0, texture.uOffset, texture.width)) / ATLAS_SIZE;
    const v0 = (pos.y + calcUV(vVertex0, texture.vOffset, texture.height)) / ATLAS_SIZE;
    const u1 = (pos.x + calcUV(uVertex1, texture.uOffset, texture.width)) / ATLAS_SIZE;
    const v1 = (pos.y + calcUV(vVertex1, texture.vOffset, texture.height)) / ATLAS_SIZE;
    const u2 = (pos.x + calcUV(uVertex2, texture.uOffset, texture.width)) / ATLAS_SIZE;
    const v2 = (pos.y + calcUV(vVertex2, texture.vOffset, texture.height)) / ATLAS_SIZE;

    // Each triangle takes up 6 UV coordinates (2 per vertex)
    const uvOffset = triangleId * 6;

    uvs[uvOffset] = u0;
    uvs[uvOffset + 1] = v0;
    uvs[uvOffset + 2] = u1;
    uvs[uvOffset + 3] = v1;
    uvs[uvOffset + 4] = u2;
    uvs[uvOffset + 5] = v2;

    uvAttribute.needsUpdate = true;
  }, [textures, texturePositions]);

  const updateTrianglePosition = useCallback((
    triangle: TriangleWithVertices,
    vertex0: [number, number, number],
    vertex1: [number, number, number],
    vertex2: [number, number, number]
  ) => {
    if (!geometryRef.current || !triangleMapRef.current) return;

    const triangleId = triangleMapRef.current.findIndex(t => t === triangle);
    if (triangleId === -1) return;

    const positionAttribute = geometryRef.current.getAttribute('position') as THREE.BufferAttribute;
    const positions = positionAttribute.array as Float32Array;

    // Each triangle takes up 9 position values (3 vertices * 3 coordinates)
    const posOffset = triangleId * 9;

    // Calculate positions using the same logic as setPosColor
    const [x0, y0, z0] = vertex0;
    const [x1, y1, z1] = vertex1;
    const [x2, y2, z2] = vertex2;

    // Update positions with mesh offsets
    positions[posOffset] = (x0 + triangle.meshOffsetX) * SCALE;
    positions[posOffset + 1] = y0 * SCALE;
    positions[posOffset + 2] = (z0 + triangle.meshOffsetZ) * SCALE;
    positions[posOffset + 3] = (x1 + triangle.meshOffsetX) * SCALE;
    positions[posOffset + 4] = y1 * SCALE;
    positions[posOffset + 5] = (z1 + triangle.meshOffsetZ) * SCALE;
    positions[posOffset + 6] = (x2 + triangle.meshOffsetX) * SCALE;
    positions[posOffset + 7] = y2 * SCALE;
    positions[posOffset + 8] = (z2 + triangle.meshOffsetZ) * SCALE;

    // Update the transformed vertices in the triangle map
    triangle.transformedVertices = {
      v0: [(x0 + triangle.meshOffsetX) * SCALE, y0 * SCALE, (z0 + triangle.meshOffsetZ) * SCALE],
      v1: [(x1 + triangle.meshOffsetX) * SCALE, y1 * SCALE, (z1 + triangle.meshOffsetZ) * SCALE],
      v2: [(x2 + triangle.meshOffsetX) * SCALE, y2 * SCALE, (z2 + triangle.meshOffsetZ) * SCALE]
    };

    positionAttribute.needsUpdate = true;
    geometryRef.current.computeVertexNormals();
  }, []);

  return { ...result, updateTriangleUVs, updateTrianglePosition };
}

export function useSelectedTriangleGeometry(triangleMap: TriangleWithVertices[] | null, selectedFaceIndex: number | null) {
  return useMemo(() => {
    if (!triangleMap || selectedFaceIndex === null) return null;

    const tri = triangleMap[selectedFaceIndex];
    if (!tri) return null;

    const highlightPositions = new Float32Array(9);
    
    // Copy the transformed vertices and add Y offset
    highlightPositions.set([...tri.transformedVertices.v0.slice(0, 1), tri.transformedVertices.v0[1] + SELECTION_Y_OFFSET, ...tri.transformedVertices.v0.slice(2)], 0);
    highlightPositions.set([...tri.transformedVertices.v1.slice(0, 1), tri.transformedVertices.v1[1] + SELECTION_Y_OFFSET, ...tri.transformedVertices.v1.slice(2)], 3);
    highlightPositions.set([...tri.transformedVertices.v2.slice(0, 1), tri.transformedVertices.v2[1] + SELECTION_Y_OFFSET, ...tri.transformedVertices.v2.slice(2)], 6);

    const selectedGeometry = new THREE.BufferGeometry();
    selectedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(highlightPositions, 3));
    selectedGeometry.computeVertexNormals();

    return selectedGeometry;
  }, [triangleMap, selectedFaceIndex]);
} 