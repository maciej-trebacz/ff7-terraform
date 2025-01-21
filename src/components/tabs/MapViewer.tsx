import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Coords, Mesh } from '@/ff7/mapfile';

const LOCATION_COLORS = [
  '#4c3', '#3a3', '#977', '#00a', '#00c', '#00d', '#14f', '#653', 
  '#ee7', '#aa5', '#eee', '#ff0', '#aa0', '#0d0', '#0e0', '#0f0', 
  '#6a5', '#ffa', '#668', '#aa7', '#bba', '#a88', '#0af', '#000', 
  '#ee7', '#282', '#008', '#fbb', '#ffc', '#b99', '#c99'
];

const MESH_SIZE = 8192;
const SCALE = 0.05;

function MapViewer({ worldmap }: { worldmap: Mesh[][] | null }) {
  return (
    <Canvas
      style={{ width: '100%', height: '100%' }}
      camera={{
        position: [10000, 30000, 0],
        fov: 60,
        near: 0.1,
        far: 1000000,
      }}
      onCreated={({ camera }) => {
        camera.lookAt(0, 0, 0);
      }}
    >
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[20000, 40000, 20000]}
        intensity={1.0}
        castShadow
      />
      <OrbitControls target={[0, 0, 0]} />
      {worldmap && <WorldmapMesh worldmap={worldmap} />}
    </Canvas>
  );
}

function WorldmapMesh({ worldmap }: { worldmap: Mesh[][] }) {
  const { geometry, edgesGeometry } = useMemo(() => {
    if (!worldmap || !worldmap.length) return { geometry: null, edgesGeometry: null };

    let totalTris = 0;
    for (const row of worldmap) {
      for (const mesh of row) {
        totalTris += mesh.numTriangles;
      }
    }

    const positions = new Float32Array(totalTris * 3 * 3);
    const colors = new Float32Array(totalTris * 3 * 3);

    let offset = 0;

    for (let row = 0; row < worldmap.length; row++) {
      for (let col = 0; col < worldmap[row].length; col++) {
        const mesh = worldmap[row][col];
        const offsetX = col * MESH_SIZE;
        const offsetZ = row * MESH_SIZE;

        for (const tri of mesh.triangles) {
          const colorIdx = (tri.locationId + 18) % LOCATION_COLORS.length;
          // const color = new THREE.Color(LOCATION_COLORS[colorIdx]);
          const color = new THREE.Color(LOCATION_COLORS[tri.type]);

          function setPosColor(v: Coords) {
            positions[offset] = (v.x + offsetX) * SCALE;
            positions[offset+1] = v.y * SCALE;
            positions[offset+2] = (v.z + offsetZ) * SCALE;

            colors[offset] = color.r;
            colors[offset + 1] = color.g;
            colors[offset + 2] = color.b;

            offset += 3;
          }

          setPosColor(tri.vertex0);
          setPosColor(tri.vertex1);
          setPosColor(tri.vertex2);
        }
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geom.computeVertexNormals();

    // Create edges geometry with a threshold angle
    const edges = new THREE.EdgesGeometry(geom, 0); // 30 degrees threshold

    return { geometry: geom, edgesGeometry: edges };
  }, [worldmap]);

  if (!geometry || !edgesGeometry) return null;

  return (
    <group>
      {/* Colored mesh */}
      <mesh geometry={geometry}>
        <meshPhongMaterial vertexColors side={THREE.DoubleSide} />
      </mesh>

    </group>
  );
}

export default MapViewer;