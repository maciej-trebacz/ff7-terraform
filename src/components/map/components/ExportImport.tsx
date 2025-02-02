import { useGridSelection } from '@/contexts/GridSelectionContext';
import { Button } from '@/components/ui/button';
import { useMapState } from '@/hooks/useMapState';
import { Mesh } from '@/ff7/mapfile';
import { useTextureAtlas } from './WorldMesh/hooks';
import { calcUV } from '@/lib/utils';
import { ATLAS_SIZE, MESH_SIZE } from '../constants';

export function ExportImport() {
  const { selectedCell } = useGridSelection();
  const { worldmap, textures, mapType } = useMapState();
  const { texturePositions, canvas } = useTextureAtlas(textures, mapType);

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
          variant="outline" 
          size="sm" 
          onClick={handleExportFullMap}
          className="w-full"
        >
          Export full map
        </Button>
      </div>
    </div>
  );
}
