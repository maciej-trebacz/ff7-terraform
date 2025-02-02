import { useEffect, useMemo, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';
import { Triangle } from '@/ff7/mapfile';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { PerspectiveCamera } from 'three';
import { RenderingMode } from './types';
import { CAMERA_HEIGHT, MESH_SIZE, SCALE, SHOW_DEBUG } from './constants';
import { CameraDebugInfo, CameraDebugOverlay } from './components/DebugOverlay';
import { MapControls } from './components/MapControls';
import { WorldMesh } from './components/WorldMesh';
import { useMapState } from '@/hooks/useMapState';

interface MapViewerProps { 
  renderingMode?: RenderingMode,
  onTriangleSelect?: (triangle: Triangle | null) => void,
  isLoading?: boolean,
  showGrid?: boolean
}

function MapViewer({ 
  renderingMode = "terrain", 
  onTriangleSelect, 
  isLoading: externalIsLoading,
  showGrid = false 
}: MapViewerProps) {
  const [selectedFaceIndex, setSelectedFaceIndex] = useState<number | null>(null);
  const [debugInfo, setDebugInfo] = useState('');
  const [rotation, setRotation] = useState(0);
  const [isViewCentered, setIsViewCentered] = useState(false);
  const debugCanvasRef = useRef<HTMLCanvasElement>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const cameraRef = useRef<PerspectiveCamera>();
  const { worldmap, mapType } = useMapState();

  // Reset centered state when map or type changes
  useEffect(() => {
    setIsViewCentered(false);
  }, [worldmap, mapType]);

  const handleTriangleSelect = (triangle: Triangle | null, faceIndex: number | null) => {
    setSelectedFaceIndex(faceIndex);
    if (onTriangleSelect) {
      onTriangleSelect(triangle);
    }
  };

  const handleRotate = (direction: 'left' | 'right') => {
    const rotationAngle = (Math.PI / 4) * (direction === 'left' ? 1 : -1);
    setRotation(prev => prev + rotationAngle);
  };

  // Calculate map dimensions and center
  const mapDimensions = useMemo(() => {
    if (!worldmap || !worldmap.length) return { width: 0, height: 0, center: { x: 0, y: 0, z: 0 } };
    
    const sizeZ = worldmap.length * MESH_SIZE * SCALE;
    const sizeX = worldmap[0].length * MESH_SIZE * SCALE;
    
    return {
      width: sizeX,
      height: sizeZ,
      center: {
        x: sizeX / 2,
        y: 0,
        z: sizeZ / 2
      }
    };
  }, [worldmap]);

  // Initial camera setup
  const initialCameraPosition = useMemo(() => {
    return [
      mapDimensions.center.x, 
      CAMERA_HEIGHT[mapType], 
      mapDimensions.center.z
    ] as [number, number, number];
  }, [mapDimensions, mapType]);

  const resetView = () => {
    if (!controlsRef.current || !cameraRef.current) return;

    // Reset rotation
    setRotation(0);

    // Reset camera position and target
    const camera = cameraRef.current;
    camera.position.set(
      mapDimensions.center.x,
      CAMERA_HEIGHT[mapType],
      mapDimensions.center.z
    );
    camera.lookAt(mapDimensions.center.x, 0, mapDimensions.center.z);
    camera.updateProjectionMatrix();

    // Reset controls
    const controls = controlsRef.current;
    controls.target.set(mapDimensions.center.x, 0, mapDimensions.center.z);
    controls.update();
  };

  useEffect(() => {
    if (controlsRef.current && cameraRef.current && mapDimensions.center && worldmap) {
      // Add a small delay to ensure dimensions are properly calculated
      const timeoutId = setTimeout(() => {
        console.debug('[MapViewer] Reset view on map/type change');
        resetView();
        setIsViewCentered(true);
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [mapType, worldmap]);

  // Combine loading states - we're loading if external loading is true OR view isn't centered yet
  const isLoading = externalIsLoading || !isViewCentered;

  return (
    <div className="relative w-full h-full">
      <MapControls onRotate={handleRotate} onReset={resetView} />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="text-lg text-muted-foreground">Loading map...</div>
        </div>
      )}

      <Canvas
        style={{ width: '100%', height: '100%' }}
        camera={{
          position: initialCameraPosition,
          fov: 60,
          near: 0.1,
          far: 1000000,
          up: [0, 0, -1]
        }}
        onCreated={({ camera }) => {
          cameraRef.current = camera as PerspectiveCamera;
          if (mapDimensions.center) {
            camera.position.set(mapDimensions.center.x, CAMERA_HEIGHT[mapType], mapDimensions.center.z);
            camera.lookAt(mapDimensions.center.x, 0, mapDimensions.center.z);
            camera.updateProjectionMatrix();
          }
        }}
      >
        {SHOW_DEBUG && <Stats />}
        {SHOW_DEBUG && <CameraDebugInfo onDebugInfo={setDebugInfo} />}
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[20000, 40000, 20000]}
          intensity={1.0}
          castShadow
        />
        <OrbitControls 
          ref={controlsRef}
          target={[mapDimensions.center.x, 0, mapDimensions.center.z]}
          enableDamping={false}
          makeDefault
        />
        {worldmap && !isLoading && (
          <WorldMesh 
            renderingMode={renderingMode} 
            onTriangleSelect={handleTriangleSelect}
            selectedFaceIndex={selectedFaceIndex}
            debugCanvasRef={debugCanvasRef}
            mapCenter={mapDimensions.center}
            rotation={rotation}
            showGrid={showGrid}
          />
        )}
      </Canvas>
      {SHOW_DEBUG && <CameraDebugOverlay debugInfo={debugInfo} />}
    </div>
  );
}

export default MapViewer; 
