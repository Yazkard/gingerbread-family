import * as THREE from 'three';
import JSZip from 'jszip';

/**
 * Merges an array of BufferGeometry into a single non-indexed geometry.
 * Handles both indexed and non-indexed input geometries.
 */
function mergeGeometries(geometries: THREE.BufferGeometry[]): { positions: number[], triangleCount: number } {
  const allPositions: number[] = [];

  for (const geometry of geometries) {
    const posAttr = geometry.attributes.position;
    if (!posAttr || posAttr.count === 0) continue;

    const index = geometry.index;

    if (index) {
      // Indexed geometry — expand to flat triangle list
      for (let i = 0; i < index.count; i++) {
        const vi = index.getX(i);
        allPositions.push(posAttr.getX(vi), posAttr.getY(vi), posAttr.getZ(vi));
      }
    } else {
      // Non-indexed geometry — positions are already flat triangles
      for (let i = 0; i < posAttr.count; i++) {
        allPositions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
      }
    }
  }

  return { positions: allPositions, triangleCount: allPositions.length / 9 };
}

/**
 * Exports Three.js geometries to a valid 3MF file (ZIP archive with OPC structure).
 * All geometries are merged into a single mesh object for maximum compatibility.
 * 3MF spec: https://3mf.io/specification/
 */
export async function exportTo3MF(geometries: THREE.BufferGeometry[], filename: string = 'model.3mf'): Promise<void> {
  if (geometries.length === 0) {
    console.warn('[3MF Export] No geometries to export');
    return;
  }

  const { positions, triangleCount } = mergeGeometries(geometries);

  if (triangleCount === 0) {
    console.warn('[3MF Export] Merged geometry has 0 triangles');
    return;
  }

  console.log(`[3MF Export] Exporting ${triangleCount} triangles from ${geometries.length} geometries`);

  // Build a single merged mesh with re-indexed vertices
  // De-duplicate vertices for a cleaner mesh
  const vertexMap = new Map<string, number>();
  const uniqueVertices: number[] = [];
  const triangleIndices: number[] = [];

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    const key = `${x.toFixed(6)},${y.toFixed(6)},${z.toFixed(6)}`;

    let vertexIndex = vertexMap.get(key);
    if (vertexIndex === undefined) {
      vertexIndex = uniqueVertices.length / 3;
      vertexMap.set(key, vertexIndex);
      uniqueVertices.push(x, y, z);
    }
    triangleIndices.push(vertexIndex);
  }

  console.log(`[3MF Export] ${uniqueVertices.length / 3} unique vertices, ${triangleIndices.length / 3} triangles`);

  // Build vertices XML
  let verticesXML = '';
  for (let i = 0; i < uniqueVertices.length; i += 3) {
    verticesXML += `        <vertex x="${uniqueVertices[i].toFixed(6)}" y="${uniqueVertices[i + 1].toFixed(6)}" z="${uniqueVertices[i + 2].toFixed(6)}" />\n`;
  }

  // Build triangles XML
  let trianglesXML = '';
  for (let i = 0; i < triangleIndices.length; i += 3) {
    trianglesXML += `        <triangle v1="${triangleIndices[i]}" v2="${triangleIndices[i + 1]}" v3="${triangleIndices[i + 2]}" />\n`;
  }

  // 3D model XML — single object with id="1"
  const modelXML = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <object id="1" type="model">
      <mesh>
        <vertices>
${verticesXML}        </vertices>
        <triangles>
${trianglesXML}        </triangles>
      </mesh>
    </object>
  </resources>
  <build>
    <item objectid="1" />
  </build>
</model>`;

  // OPC Content Types (required by 3MF/OPC spec)
  const contentTypesXML = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;

  // OPC Relationships (required by 3MF/OPC spec)
  const relsXML = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;

  // Create ZIP archive
  const zip = new JSZip();
  zip.file('[Content_Types].xml', contentTypesXML);
  zip.file('_rels/.rels', relsXML);
  zip.file('3D/3dmodel.model', modelXML);

  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });

  // Trigger download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.3mf') ? filename : `${filename}.3mf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
