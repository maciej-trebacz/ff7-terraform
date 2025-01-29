import React, { useState } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { useMapState } from '@/hooks/useMapState';
import { WorldMeshProps } from '../../types';
import { useGeometry, useSelectedTriangleGeometry, useTextureAtlas } from './hooks';

export function WorldMesh({ 
  worldmap, 
  mapType, 
  renderingMode, 
  onTriangleSelect, 
  selectedFaceIndex,
  debugCanvasRef,
  mapCenter,
  rotation
}: WorldMeshProps) {
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null);
  const { textures } = useMapState();
  
  const { texture, canvas, texturePositions } = useTextureAtlas(textures, mapType);
  const { geometry, triangleMap, updateTriangleUVs, updateTrianglePosition } = useGeometry(worldmap, mapType, renderingMode, textures, texturePositions);
  const selectedTriangleGeometry = useSelectedTriangleGeometry(triangleMap, selectedFaceIndex);

  const selectedTriangle = triangleMap?.[selectedFaceIndex];

  // Set up global update functions when selected triangle changes
  React.useEffect(() => {
    if (window && selectedTriangle && updateTriangleUVs && updateTrianglePosition) {
      (window as any).updateTriangleUVs = function(u0: number, v0: number, u1: number, v1: number, u2: number, v2: number) {
        updateTriangleUVs(selectedTriangle, u0, v0, u1, v1, u2, v2);
      };
      (window as any).updateTrianglePosition = function(
        v0: [number, number, number],
        v1: [number, number, number],
        v2: [number, number, number]
      ) {
        updateTrianglePosition(selectedTriangle, v0, v1, v2);
      }
    }
    
    // Clean up functions when no triangle is selected or functions aren't available
    return () => {
      delete (window as any).updateTriangleUVs;
      delete (window as any).updateTrianglePosition;
    }
  }, [selectedTriangle, updateTriangleUVs, updateTrianglePosition]);

  // Copy the texture atlas to the debug canvas
  React.useEffect(() => {
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

  if (!geometry || !triangleMap) return null;

  return (
    <group>
      <group 
        position={[mapCenter.x, 0, mapCenter.z]}
        rotation={[0, rotation, 0]}
      >
        <group position={[-mapCenter.x, 0, -mapCenter.z]}>
          <mesh 
            geometry={geometry} 
            onClick={handleClick}
            onPointerDown={handlePointerDown}
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
          {selectedTriangleGeometry && (
            <lineSegments>
              <edgesGeometry attach="geometry" args={[selectedTriangleGeometry]} />
              <lineBasicMaterial color="#ff00ff" linewidth={2} />
            </lineSegments>
          )}
        </group>
      </group>
    </group>
  );
} 