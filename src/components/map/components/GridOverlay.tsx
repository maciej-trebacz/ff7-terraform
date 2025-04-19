import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { MESH_SIZE, SCALE } from '../constants';
import { useGridSelection } from '@/contexts/GridSelectionContext';
import { useMapState } from '@/hooks/useMapState';

interface GridOverlayProps {
  worldmapLength: number;
  worldmapWidth: number;
}

export function GridOverlay({ worldmapLength, worldmapWidth }: GridOverlayProps) {
  const [hoveredCell, setHoveredCell] = useState<{ x: number, z: number } | null>(null);
  const { selectCell, selectedCell } = useGridSelection();
  const { mode } = useMapState();
  const cellSize = MESH_SIZE * SCALE;
  const yOffset = 0;
  const SECTION_SIZE = 4; // 4x4 meshes per section

  const gridGeometry = useMemo(() => {
    const points: number[] = [];
    
    // Vertical lines
    for (let x = 0; x <= worldmapWidth; x++) {
      const xPos = x * cellSize;
      points.push(xPos, yOffset, 0);
      points.push(xPos, yOffset, worldmapLength * cellSize);
    }
    
    // Horizontal lines
    for (let z = 0; z <= worldmapLength; z++) {
      const zPos = z * cellSize;
      points.push(0, yOffset, zPos);
      points.push(worldmapWidth * cellSize, yOffset, zPos);
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    return geometry;
  }, [worldmapLength, worldmapWidth, cellSize, yOffset]);

  const sectionGridGeometry = useMemo(() => {
    const points: number[] = [];
    const sectionCellSize = cellSize * SECTION_SIZE;
    
    // Vertical lines for sections
    for (let x = 0; x <= Math.ceil(worldmapWidth / SECTION_SIZE); x++) {
      const xPos = x * sectionCellSize;
      points.push(xPos, yOffset, 0);
      points.push(xPos, yOffset, worldmapLength * cellSize);
    }
    
    // Horizontal lines for sections
    for (let z = 0; z <= Math.ceil(worldmapLength / SECTION_SIZE); z++) {
      const zPos = z * sectionCellSize;
      points.push(0, yOffset, zPos);
      points.push(worldmapWidth * cellSize, yOffset, zPos);
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    return geometry;
  }, [worldmapLength, worldmapWidth, cellSize, yOffset]);

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (mode !== "export") return;
    
    // Get the intersection point in world coordinates
    const x = Math.floor(event.point.x / cellSize);
    const z = Math.floor(event.point.z / cellSize);
    
    // Check if we're within grid bounds
    if (x >= 0 && x < worldmapWidth && z >= 0 && z < worldmapLength) {
      setHoveredCell({ x, z });
    } else {
      setHoveredCell(null);
    }
  };

  const handlePointerOut = () => {
    if (mode !== "export") return;
    setHoveredCell(null);
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (mode !== "export") return;
    const x = Math.floor(event.point.x / cellSize);
    const z = Math.floor(event.point.z / cellSize);
    console.debug(`Clicked on cell at ${z}, ${x}`);
    selectCell(z, x); // z is row, x is column
  };

  return (
    <group>
      {/* Invisible plane for pointer events */}
      <mesh
        position={[
          (worldmapWidth * cellSize) / 2,
          yOffset,
          (worldmapLength * cellSize) / 2
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <planeGeometry args={[worldmapWidth * cellSize, worldmapLength * cellSize]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Regular grid lines */}
      <lineSegments geometry={gridGeometry} renderOrder={12}>
        <lineBasicMaterial 
          color="#ffffff" 
          opacity={0.6} 
          transparent
          depthWrite={false}
          depthTest={false}
        />
      </lineSegments>

      {/* Section grid lines */}
      <lineSegments geometry={sectionGridGeometry} renderOrder={13}>
        <lineBasicMaterial 
          color="#ffff00" 
          opacity={1} 
          transparent
          depthWrite={false}
          depthTest={false}
        />
      </lineSegments>

      {/* Hover highlight */}
      {hoveredCell && mode === "export" && (
        <mesh
          position={[
            hoveredCell.x * cellSize + cellSize / 2,
            yOffset + 0.1,
            hoveredCell.z * cellSize + cellSize / 2
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
          renderOrder={11}
        >
          <planeGeometry args={[cellSize, cellSize]} />
          <meshBasicMaterial color="#ffffff" opacity={0.5} transparent depthTest={false} />
        </mesh>
      )}

      {/* Selected cell highlight */}
      {selectedCell && mode === "export" && (
        <mesh
          position={[
            selectedCell.column * cellSize + cellSize / 2,
            yOffset + 0.05,
            selectedCell.row * cellSize + cellSize / 2
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
          renderOrder={10}
        >
          <planeGeometry args={[cellSize, cellSize]} />
          <meshBasicMaterial color="#ffff00" opacity={0.3} transparent depthTest={false} />
        </mesh>
      )}
    </group>
  );
}
