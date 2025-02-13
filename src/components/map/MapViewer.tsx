import { useEffect, useMemo, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats, PerspectiveCamera, OrthographicCamera } from '@react-three/drei';
import { Triangle } from '@/ff7/mapfile';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { PerspectiveCamera as ThreePerspectiveCamera, OrthographicCamera as ThreeOrthographicCamera } from 'three';
import { RenderingMode } from './types';
import { CAMERA_HEIGHT, MESH_SIZE, SCALE, SHOW_DEBUG } from './constants';
import { CameraDebugInfo, CameraDebugOverlay } from './components/DebugOverlay';
import { MapControls } from './components/MapControls';
import { WorldMesh } from './components/WorldMesh';
import { useMapState, MapMode } from '@/hooks/useMapState';

interface MapViewerProps { 
  renderingMode?: RenderingMode,
  onTriangleSelect?: (triangle: Triangle | null) => void,
  isLoading?: boolean,
  showGrid?: boolean,
  cameraType?: 'perspective' | 'orthographic',
  wireframe?: boolean
}

function MapViewer({ 
  renderingMode = "terrain", 
  onTriangleSelect, 
  isLoading: externalIsLoading,
  showGrid = false,
  cameraType = "perspective",
  wireframe = false
}: MapViewerProps) {
  const [selectedFaceIndex, setSelectedFaceIndex] = useState<number | null>(null);
  const [debugInfo, setDebugInfo] = useState('');
  const [rotation, setRotation] = useState(0);
  const debugCanvasRef = useRef<HTMLCanvasElement>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const perspectiveCameraRef = useRef<ThreePerspectiveCamera>(null);
  const orthographicCameraRef = useRef<ThreeOrthographicCamera>(null);
  const { worldmap, mapType, mode } = useMapState();

  useEffect(() => {
    if (!onTriangleSelect) {
      setSelectedFaceIndex(null);
    }
  }, [onTriangleSelect]);

  const handleTriangleSelect = (triangle: Triangle | null, faceIndex: number | null) => {
    if (onTriangleSelect) {
      setSelectedFaceIndex(faceIndex);
      onTriangleSelect(triangle);
    }
  };

  const handleRotate = (direction: 'left' | 'right') => {
    const rotationAngle = (Math.PI / 8) * (direction === 'left' ? 1 : -1);
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

  // Camera configuration
  const cameraConfig = useMemo(() => {
    const margin = 50;
    const position = [
      mapDimensions.center.x,
      CAMERA_HEIGHT[mapType],
      mapDimensions.center.z
    ] as [number, number, number];

    if (cameraType === 'orthographic') {
      const halfWidth = mapDimensions.width / 2 + margin;
      const halfHeight = mapDimensions.height / 2 + margin;
      return {
        position,
        left: -halfWidth,
        right: halfWidth,
        top: halfHeight,
        bottom: -halfHeight,
        near: -1000,
        far: 100000,
        up: [0, 0, -1] as [number, number, number],
        zoom: 1
      };
    }

    return {
      position,
      fov: 60,
      near: 0.1,
      far: 1000000,
      up: [0, 0, -1] as [number, number, number]
    };
  }, [mapDimensions, mapType, cameraType]);

  // New helper function to reset camera and controls
  const resetCameraAndControls = () => {
    const camera = cameraType === 'perspective' ? perspectiveCameraRef.current : orthographicCameraRef.current;
    if (!camera || !mapDimensions.width) return;
    // Reset rotation
    setRotation(0);
    // Reset camera position and orientation
    camera.position.set(mapDimensions.center.x, CAMERA_HEIGHT[mapType], mapDimensions.center.z);
    camera.lookAt(mapDimensions.center.x, 0, mapDimensions.center.z);
    if (cameraType === 'orthographic' && camera instanceof ThreeOrthographicCamera) {
      const margin = 50;
      const halfWidth = mapDimensions.width / 2 + margin;
      const halfHeight = mapDimensions.height / 2 + margin;
      camera.left = -halfWidth;
      camera.right = halfWidth;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
    }
    camera.updateProjectionMatrix();

    // Reset controls
    if (controlsRef.current) {
      controlsRef.current.object = camera;
      controlsRef.current.target.set(mapDimensions.center.x, 0, mapDimensions.center.z);
      controlsRef.current.update();
    }
  };

  // New resetView handler that wraps the helper and sets view centered
  const resetView = () => {
    resetCameraAndControls();
  };

  // Replace the useEffect that resets view on map or camera type change with a unified one
  useEffect(() => {
    if (mapDimensions.width) {
      const timer = setTimeout(() => {
        console.debug('[MapViewer] Reset view on map/type change');
        resetView();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [mapType, cameraType, mapDimensions]);

  const isLoading = externalIsLoading;

  return (
    <div className="relative w-full h-full">
      <MapControls onRotate={handleRotate} onReset={resetView} />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="text-lg text-muted-foreground">Loading map...</div>
        </div>
      )}

      <Canvas style={{ width: '100%', height: '100%' }}>
        {cameraType === 'perspective' ? (
          <PerspectiveCamera makeDefault {...cameraConfig} ref={perspectiveCameraRef} />
        ) : (
          <OrthographicCamera makeDefault {...cameraConfig} ref={orthographicCameraRef} />
        )}
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
          enableRotate={!['export', 'painting'].includes(mode)}
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
            wireframe={wireframe}
          />
        )}
      </Canvas>
      {SHOW_DEBUG && <CameraDebugOverlay debugInfo={debugInfo} />}
    </div>
  );
}

export default MapViewer; 
