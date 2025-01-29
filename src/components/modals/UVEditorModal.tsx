import { Modal } from "@/components/Modal";
import { Triangle } from "@/ff7/mapfile";
import { useMapState } from "@/hooks/useMapState";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calcUV } from "@/lib/utils";

interface UVEditorModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  triangle: Triangle | null;
  onSave: (uvCoords: { u: number, v: number }[]) => void;
}

const CANVAS_SIZE = 384;

function createImageFromTexture(pixels: Uint8Array, width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const imageData = ctx.createImageData(width, height);
  for (let i = 0; i < pixels.length; i += 4) {
    imageData.data[i] = pixels[i];     // Red
    imageData.data[i + 1] = pixels[i + 1]; // Green
    imageData.data[i + 2] = pixels[i + 2]; // Blue
    imageData.data[i + 3] = 255;           // Alpha
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
}

export function UVEditorModal({ isOpen, setIsOpen, triangle, onSave }: UVEditorModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { textures } = useMapState();
  const [selectedVertex, setSelectedVertex] = useState<number | null>(null);
  const [uvCoords, setUvCoords] = useState<{ u: number, v: number }[]>([]);
  const [textureImage, setTextureImage] = useState<HTMLImageElement | null>(null);
  const [copiedUVs, setCopiedUVs] = useState<{ u: number, v: number }[] | null>(null);

  useEffect(() => {
    if (!isOpen || !triangle) {
      setTextureImage(null);
      setSelectedVertex(null);
      return;
    }
    setUvCoords([
      { u: triangle.uVertex0, v: triangle.vVertex0 },
      { u: triangle.uVertex1, v: triangle.vVertex1 },
      { u: triangle.uVertex2, v: triangle.vVertex2 }
    ]);

    const texture = textures[triangle.texture];
    if (!texture?.tex) return;

    const img = new Image();
    img.src = createImageFromTexture(texture.tex.getPixels(), texture.width, texture.height);
    img.onload = () => {
      setTextureImage(img);
    };
  }, [isOpen, triangle, textures]);

  useEffect(() => {
    if (!isOpen || !triangle || !canvasRef.current || !textureImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const texture = textures[triangle.texture];
    if (!texture) return;

    // Calculate scale factor for small textures
    const scaleFactor = (texture.width <= 64 && texture.height <= 64) ? 2 : 1;
    const scaledWidth = texture.width * scaleFactor;
    const scaledHeight = texture.height * scaleFactor;

    const centerX = (CANVAS_SIZE - scaledWidth) / 2;
    const centerY = (CANVAS_SIZE - scaledHeight) / 2;

    for (let row = -1; row <= 1; row++) {
      for (let col = -1; col <= 1; col++) {
        const x = centerX + col * scaledWidth;
        const y = centerY + row * scaledHeight;

        ctx.globalAlpha = (row === 0 && col === 0) ? 1.0 : 0.5;
        ctx.drawImage(textureImage, x, y, scaledWidth, scaledHeight);
      }
    }
    ctx.globalAlpha = 1.0;

    const wrapUV = (u: number, v: number) => {
      const relU = calcUV(u, texture.uOffset, texture.width);
      const relV = calcUV(v, texture.vOffset, texture.height);
      const gridX = Math.floor(relU / texture.width);
      const gridY = Math.floor(relV / texture.height);
      const wrappedU = ((relU % texture.width) + texture.width) % texture.width;
      const wrappedV = ((relV % texture.height) + texture.height) % texture.height;
      return {
        u: centerX + wrappedU * scaleFactor + gridX * scaledWidth,
        v: centerY + wrappedV * scaleFactor + gridY * scaledHeight
      };
    };

    ctx.beginPath();
    const v0 = wrapUV(uvCoords[0].u, uvCoords[0].v);
    const v1 = wrapUV(uvCoords[1].u, uvCoords[1].v);
    const v2 = wrapUV(uvCoords[2].u, uvCoords[2].v);

    console.debug(`v0 - U: ${v0.u}, V: ${v0.v}`);
    console.debug(`v1 - U: ${v1.u}, V: ${v1.v}`);
    console.debug(`v2 - U: ${v2.u}, V: ${v2.v}`);

    ctx.moveTo(v0.u, v0.v);
    ctx.lineTo(v1.u, v1.v);
    ctx.lineTo(v2.u, v2.v);
    ctx.closePath();

    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.stroke();

    uvCoords.forEach(({ u, v }, i) => {
      const isSelected = selectedVertex === i;
      const wrapped = wrapUV(u, v);
      ctx.beginPath();
      ctx.arc(wrapped.u, wrapped.v, isSelected ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#ff0000' : '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#ff0000';
      ctx.stroke();
    });
  }, [isOpen, triangle, textures, selectedVertex, uvCoords, textureImage]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !triangle) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const texture = textures[triangle.texture];
    if (!texture) return;

    const scaleFactor = (texture.width <= 64 && texture.height <= 64) ? 2 : 1;
    const scaledWidth = texture.width * scaleFactor;
    const scaledHeight = texture.height * scaleFactor;

    const centerX = (CANVAS_SIZE - scaledWidth) / 2;
    const centerY = (CANVAS_SIZE - scaledHeight) / 2;

    const wrapUV = (u: number, v: number) => {
      const relU = u - texture.uOffset;
      const relV = v - texture.vOffset;
      const gridX = Math.floor(relU / texture.width);
      const gridY = Math.floor(relV / texture.height);
      const wrappedU = ((relU % texture.width) + texture.width) % texture.width;
      const wrappedV = ((relV % texture.height) + texture.height) % texture.height;
      return {
        u: centerX + wrappedU * scaleFactor + gridX * scaledWidth,
        v: centerY + wrappedV * scaleFactor + gridY * scaledHeight
      };
    };

    const vertices = uvCoords.map((vertex, i) => {
      const wrapped = wrapUV(vertex.u, vertex.v);
      return {
        index: i,
        x: wrapped.u,
        y: wrapped.v
      };
    });

    const closest = vertices.reduce((prev, curr) => {
      const prevDist = Math.hypot(prev.x - x, prev.y - y);
      const currDist = Math.hypot(curr.x - x, curr.y - y);
      return currDist < prevDist ? curr : prev;
    });

    if (Math.hypot(closest.x - x, closest.y - y) < 10) {
      setSelectedVertex(closest.index);
    } else {
      setSelectedVertex(null);
    }
  };

  const handleUVChange = (index: number, coord: 'u' | 'v', value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue)) return;

    setUvCoords(prev => prev.map((uv, i) => 
      i === index ? { ...uv, [coord]: numValue } : uv
    ));
  };

  return (
    <Modal
      open={isOpen}
      setIsOpen={setIsOpen}
      title="UV Editor"
      size="xl"
      callback={() => {}}
    >
      <div className="space-y-4">
        <div className="flex space-x-4">
          <div>
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="border border-border bg-black"
              onClick={handleCanvasClick}
            />
          </div>
          <div className="space-y-4 flex-1">
            <div>
              <Label>UV Coordinates</Label>
              <div className="space-y-2 mt-2">
                {uvCoords.map((coords, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">U{i}</Label>
                      <Input
                        type="number"
                        value={coords.u}
                        onChange={(e) => handleUVChange(i, 'u', e.target.value)}
                        className={selectedVertex === i ? 'border-red-500' : ''}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">V{i}</Label>
                      <Input
                        type="number"
                        value={coords.v}
                        onChange={(e) => handleUVChange(i, 'v', e.target.value)}
                        className={selectedVertex === i ? 'border-red-500' : ''}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-stretch space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setCopiedUVs(uvCoords)}
              >
                Copy UVs
              </Button>
              <Button 
                variant="outline" 
                onClick={() => copiedUVs && setUvCoords(copiedUVs)}
                disabled={!copiedUVs}
              >
                Paste UVs
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button onClick={() => {
                onSave(uvCoords);
                setIsOpen(false);
              }}>Apply Changes</Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
} 