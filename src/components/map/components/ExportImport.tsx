import { useGridSelection } from '@/contexts/GridSelectionContext';
import { Button } from '@/components/ui/button';
import { useMapState } from '@/hooks/useMapState';
import { Mesh } from '@/ff7/mapfile';
import { useTextureAtlas } from './WorldMesh/hooks';
import { calcUV } from '@/lib/utils';
import { ATLAS_SIZE, MESH_SIZE, TEXTURE_PADDING } from '../constants';
import { useRef } from 'react';
import { WorldMapTexture } from '@/ff7/texfile';

// Helper functions for texture UV conversion
function findTextureForUV(u: number, v: number, texturePositions: Map<number, { x: number, y: number, name: string }>, textures: WorldMapTexture[]): { textureId: number, texture: WorldMapTexture } | null {
  const atlasU = u * ATLAS_SIZE;
  // Flip V coordinate from Blender's space to our space
  const atlasV = (1 - v) * ATLAS_SIZE;

  for (const [id, pos] of texturePositions.entries()) {
    const texture = textures[id];
    if (!texture) continue;

    // Check if the UV point falls within this texture's bounds (including padding)
    if (atlasU >= pos.x - TEXTURE_PADDING && 
        atlasU <= pos.x + texture.width + TEXTURE_PADDING &&
        atlasV >= pos.y - TEXTURE_PADDING && 
        atlasV <= pos.y + texture.height + TEXTURE_PADDING) {
      return { textureId: id, texture };
    }
  }
  return null;
}

function convertAtlasToTextureUV(atlasU: number, atlasV: number, texturePos: { x: number, y: number }, texture: WorldMapTexture): { u: number, v: number } {
  // Convert normalized atlas UV to atlas pixel coordinates
  const atlasPixelU = atlasU * ATLAS_SIZE;
  const atlasPixelV = (1 - atlasV) * ATLAS_SIZE;
  // Compute the local pixel offset within the texture in the atlas
  const deltaU = atlasPixelU - texturePos.x;
  const deltaV = atlasPixelV - texturePos.y;
  // Recover the original editor UV values by adding the texture offset
  const u = texture.uOffset + Math.round(deltaU);
  const v = texture.vOffset + Math.round(deltaV);
  return { u, v };
}

export function ExportImport() {
  const { selectedCell } = useGridSelection();
  const { worldmap, textures, mapType, updateSectionMesh } = useMapState();
  const { texturePositions, canvas } = useTextureAtlas(textures, mapType);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parser to reverse generateObjContent from an .obj file
  const parseObjFile = (content: string) => {
    const vertices: Array<{ x: number, y: number, z: number }> = [];
    const normals: Array<{ x: number, y: number, z: number }> = [];
    const texCoords: Array<{ u: number, v: number }> = [];
    const triangles: any[] = [];

    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const parts = trimmed.split(/\s+/);
      if (parts[0] === 'v') {
        // Multiply vertex coordinates by 1024 to reverse the export scaling
        vertices.push({
          x: Math.round(parseFloat(parts[1]) * 1024),
          y: Math.round(parseFloat(parts[2]) * 1024),
          z: Math.round(parseFloat(parts[3]) * 1024)
        });
      } else if (parts[0] === 'vn') {
        normals.push({
          x: parseFloat(parts[1]) * 4096,
          y: parseFloat(parts[2]) * 4096,
          z: parseFloat(parts[3]) * 4096
        });
      } else if (parts[0] === 'vt') {
        texCoords.push({
          u: parseFloat(parts[1]),
          v: parseFloat(parts[2])
        });
      } else if (parts[0] === 'f') {
        if (parts.length < 4) continue;
        const vIdx: number[] = [];
        const vtIdx: number[] = [];
        // Process exactly 3 vertices (assuming triangulated faces)
        for (let i = 1; i <= 3; i++) {
          const indices = parts[i].split('/');
          vIdx.push(parseInt(indices[0]) - 1);
          if (indices.length > 1 && indices[1] !== '') {
            vtIdx.push(parseInt(indices[1]) - 1);
          } else {
            vtIdx.push(-1);
          }
        }

        // Get texture coordinates for all vertices
        const uvs = vtIdx.map(idx => idx >= 0 ? texCoords[idx] : null);
        
        // Try to find the texture this triangle belongs to using the first vertex's UVs
        let textureInfo = uvs[0] ? findTextureForUV(uvs[0].u, uvs[0].v, texturePositions, textures) : null;
        
        // If we found a texture, convert all UVs to texture-local coordinates
        let textureUVs: { u: number, v: number }[] = [];
        if (textureInfo && uvs.every(uv => uv)) {
          const pos = texturePositions.get(textureInfo.textureId)!;
          textureUVs = uvs.map(uv => convertAtlasToTextureUV(uv!.u, uv!.v, pos, textureInfo!.texture));
        }

        triangles.push({
          vertex0: vertices[vIdx[0]],
          vertex1: vertices[vIdx[1]],
          vertex2: vertices[vIdx[2]],
          texture: textureInfo?.textureId ?? 0,
          uVertex0: textureUVs[0]?.u ?? 0,
          vVertex0: textureUVs[0]?.v ?? 0,
          uVertex1: textureUVs[1]?.u ?? 0,
          vVertex1: textureUVs[1]?.v ?? 0,
          uVertex2: textureUVs[2]?.u ?? 0,
          vVertex2: textureUVs[2]?.v ?? 0,
          type: 0,
          locationId: 0,
          script: 0,
          isChocobo: false,
          index: triangles.length
        });
      }
    }

    // Construct a new Mesh object (plain object matching Mesh interface)
    const newMesh = { vertices, normals, triangles, numVertices: vertices.length, numTriangles: triangles.length, severity: 1 };
    return newMesh;
  };

  const handleFileChosen = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const newMesh = parseObjFile(text);
        // Update the worldmap for the selected cell using updateSectionMesh
        updateSectionMesh(selectedCell.row, selectedCell.column, newMesh);
        console.log('Imported mesh', newMesh);
      } catch (err) {
        console.error('Error parsing .obj file', err);
      }
    };
    reader.readAsText(file);
  };

  const handleImportSectionClick = () => {
    fileInputRef.current?.click();
  };

  console.log(`[ExportImport] Selected cell:`, selectedCell);

  if (!selectedCell) {
    return (
      <div className="text-xs text-muted-foreground rounded-md border bg-muted/50 p-2"> 
          Click on a map section to proceed
      </div>
    );
  }

  const generateMtlContent = () => {
    let mtlContent = '# FF7 World Map Material\n\n';
    mtlContent += 'newmtl ff7_terrain\n';
    mtlContent += 'Ka 1.000 1.000 1.000\n';  // Ambient color
    mtlContent += 'Kd 1.000 1.000 1.000\n';  // Diffuse color
    mtlContent += 'Ks 0.000 0.000 0.000\n';  // Specular color
    mtlContent += 'd 1.0\n';                 // Opacity
    mtlContent += 'illum 1\n';               // Illumination model
    mtlContent += 'map_Kd texture_atlas.png\n'; // Diffuse texture map
    return mtlContent;
  };

  const generateObjContent = (mesh: Mesh, offsetX: number = 0, offsetZ: number = 0, baseVertexIndex: number = 0, baseNormalIndex: number = 0, baseTexCoordIndex: number = 0) => {
    let objContent = '';
    let vertexCount = 0;
    let normalCount = 0;
    let texCoordCount = 0;

    // Add vertices with offset
    mesh.vertices.forEach((vertex) => {
      const x = (vertex.x + offsetX) / 1024;
      const y = vertex.y / 1024;
      const z = (vertex.z + offsetZ) / 1024;
      objContent += `v ${x.toFixed(6)} ${y.toFixed(6)} ${z.toFixed(6)}\n`;
      vertexCount++;
    });

    objContent += '\n';

    // Add vertex normals
    mesh.normals.forEach((normal) => {
      objContent += `vn ${normal.x.toFixed(6)} ${normal.y.toFixed(6)} ${normal.z.toFixed(6)}\n`;
      normalCount++;
    });

    objContent += '\n';

    // Add texture coordinates
    mesh.triangles.forEach((triangle) => {
      const texture = textures[triangle.texture];
      const isUnderwaterOutside = texture?.name.includes("cltr") && triangle.uVertex0 === 254;
      if (texture && texturePositions.has(triangle.texture) && !isUnderwaterOutside) {
        const pos = texturePositions.get(triangle.texture)!;
        
        // Calculate UVs using the same method as in WorldMesh
        const u0 = (pos.x + calcUV(triangle.uVertex0, texture.uOffset, texture.width)) / ATLAS_SIZE;
        const v0 = 1 - (pos.y + calcUV(triangle.vVertex0, texture.vOffset, texture.height)) / ATLAS_SIZE;
        const u1 = (pos.x + calcUV(triangle.uVertex1, texture.uOffset, texture.width)) / ATLAS_SIZE;
        const v1 = 1 - (pos.y + calcUV(triangle.vVertex1, texture.vOffset, texture.height)) / ATLAS_SIZE;
        const u2 = (pos.x + calcUV(triangle.uVertex2, texture.uOffset, texture.width)) / ATLAS_SIZE;
        const v2 = 1 - (pos.y + calcUV(triangle.vVertex2, texture.vOffset, texture.height)) / ATLAS_SIZE;

        objContent += `vt ${u0.toFixed(6)} ${v0.toFixed(6)}\n`;
        objContent += `vt ${u1.toFixed(6)} ${v1.toFixed(6)}\n`;
        objContent += `vt ${u2.toFixed(6)} ${v2.toFixed(6)}\n`;
        texCoordCount += 3;
      }
    });

    objContent += '\n';

    // Add faces (triangles)
    let vtIndex = baseTexCoordIndex + 1; // Keep track of texture coordinate indices
    mesh.triangles.forEach((triangle) => {
      const vertexIndex = mesh.vertices.findIndex(v => v === triangle.vertex0);
      const vertex1Index = mesh.vertices.findIndex(v => v === triangle.vertex1);
      const vertex2Index = mesh.vertices.findIndex(v => v === triangle.vertex2);
      
      const texture = textures[triangle.texture];
      const isUnderwaterOutside = texture?.name.includes("cltr") && triangle.uVertex0 === 254;
      if (texture && texturePositions.has(triangle.texture) && !isUnderwaterOutside) {
        // Each vertex in face references vertex/texture/normal indices
        objContent += `f ${vertexIndex + baseVertexIndex + 1}/${vtIndex}/${vertexIndex + baseNormalIndex + 1} ${vertex1Index + baseVertexIndex + 1}/${vtIndex + 1}/${vertex1Index + baseNormalIndex + 1} ${vertex2Index + baseVertexIndex + 1}/${vtIndex + 2}/${vertex2Index + baseNormalIndex + 1}\n`;
        vtIndex += 3;
      } else {
        // If no texture, only use vertex and normal indices
        objContent += `f ${vertexIndex + baseVertexIndex + 1}//${vertexIndex + baseNormalIndex + 1} ${vertex1Index + baseVertexIndex + 1}//${vertex1Index + baseNormalIndex + 1} ${vertex2Index + baseVertexIndex + 1}//${vertex2Index + baseNormalIndex + 1}\n`;
      }
    });

    return {
      content: objContent,
      vertexCount,
      normalCount,
      texCoordCount
    };
  };

  const handleExportSection = () => {
    if (!worldmap || !canvas) return;
    
    const mesh = worldmap[selectedCell.row][selectedCell.column];
    let objContent = '# FF7 World Map Section Export\n';
    objContent += `# Row: ${selectedCell.row}, Column: ${selectedCell.column}\n\n`;
    objContent += 'mtllib section.mtl\n\n';
    objContent += 'usemtl ff7_terrain\n\n';
    objContent += generateObjContent(mesh).content;
    const mtlContent = generateMtlContent();
    
    // Create blobs and trigger downloads
    const objBlob = new Blob([objContent], { type: 'text/plain' });
    const mtlBlob = new Blob([mtlContent], { type: 'text/plain' });
    
    // Export texture atlas as PNG
    canvas.toBlob((textureBlob) => {
      if (textureBlob) {
        const textureUrl = URL.createObjectURL(textureBlob);
        const textureLink = document.createElement('a');
        textureLink.href = textureUrl;
        textureLink.download = 'texture_atlas.png';
        document.body.appendChild(textureLink);
        textureLink.click();
        document.body.removeChild(textureLink);
        URL.revokeObjectURL(textureUrl);
      }
    }, 'image/png');

    // Download OBJ file
    const objUrl = URL.createObjectURL(objBlob);
    const objLink = document.createElement('a');
    objLink.href = objUrl;
    objLink.download = `section_r${selectedCell.row}_c${selectedCell.column}.obj`;
    document.body.appendChild(objLink);
    objLink.click();
    document.body.removeChild(objLink);
    URL.revokeObjectURL(objUrl);

    // Download MTL file
    const mtlUrl = URL.createObjectURL(mtlBlob);
    const mtlLink = document.createElement('a');
    mtlLink.href = mtlUrl;
    mtlLink.download = 'section.mtl';
    document.body.appendChild(mtlLink);
    mtlLink.click();
    document.body.removeChild(mtlLink);
    URL.revokeObjectURL(mtlUrl);
  };

  const handleExportFullMap = () => {
    if (!worldmap || !canvas) return;

    let objContent = '# FF7 World Map Full Export\n\n';
    objContent += 'mtllib worldmap.mtl\n\n';
    objContent += 'usemtl ff7_terrain\n\n';

    let baseVertexIndex = 0;
    let baseNormalIndex = 0;
    let baseTexCoordIndex = 0;

    // Process each section
    for (let row = 0; row < worldmap.length; row++) {
      for (let col = 0; col < worldmap[row].length; col++) {
        const mesh = worldmap[row][col];
        if (!mesh) continue;

        // Calculate offsets based on grid position
        const offsetX = col * MESH_SIZE;
        const offsetZ = row * MESH_SIZE;

        // Generate content for this section
        const result = generateObjContent(mesh, offsetX, offsetZ, baseVertexIndex, baseNormalIndex, baseTexCoordIndex);
        objContent += result.content;

        // Update base indices for the next section
        baseVertexIndex += result.vertexCount;
        baseNormalIndex += result.normalCount;
        baseTexCoordIndex += result.texCoordCount;
      }
    }

    const mtlContent = generateMtlContent();
    
    // Create blobs and trigger downloads
    const objBlob = new Blob([objContent], { type: 'text/plain' });
    const mtlBlob = new Blob([mtlContent], { type: 'text/plain' });
    
    // Export texture atlas as PNG
    canvas.toBlob((textureBlob) => {
      if (textureBlob) {
        const textureUrl = URL.createObjectURL(textureBlob);
        const textureLink = document.createElement('a');
        textureLink.href = textureUrl;
        textureLink.download = 'texture_atlas.png';
        document.body.appendChild(textureLink);
        textureLink.click();
        document.body.removeChild(textureLink);
        URL.revokeObjectURL(textureUrl);
      }
    }, 'image/png');

    // Download OBJ file
    const objUrl = URL.createObjectURL(objBlob);
    const objLink = document.createElement('a');
    objLink.href = objUrl;
    objLink.download = 'worldmap_full.obj';
    document.body.appendChild(objLink);
    objLink.click();
    document.body.removeChild(objLink);
    URL.revokeObjectURL(objUrl);

    // Download MTL file
    const mtlUrl = URL.createObjectURL(mtlBlob);
    const mtlLink = document.createElement('a');
    mtlLink.href = mtlUrl;
    mtlLink.download = 'worldmap.mtl';
    document.body.appendChild(mtlLink);
    mtlLink.click();
    document.body.removeChild(mtlLink);
    URL.revokeObjectURL(mtlUrl);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Selected section: Row {selectedCell.row}, Column {selectedCell.column}
      </p>
      <div className="space-y-1">
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={handleExportSection}
          className="w-full"
        >
          Export section
        </Button>
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={handleImportSectionClick}
          className="w-full"
        >
          Import section
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExportFullMap}
          className="w-full"
        >
          Export full map
        </Button>
      </div>
      {/* Hidden file input for importing .obj files */}
      <input
        type="file"
        accept=".obj"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChosen}
      />
    </div>
  );
}
