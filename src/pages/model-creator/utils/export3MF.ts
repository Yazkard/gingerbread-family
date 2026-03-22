import * as THREE from 'three';
import JSZip from 'jszip';

/**
 * Counts triangles in a single geometry (indexed or non-indexed).
 */
function countTriangles(geometry: THREE.BufferGeometry): number {
  const posAttr = geometry.attributes.position;
  if (!posAttr || posAttr.count === 0) return 0;
  const index = geometry.index;
  return index ? index.count / 3 : posAttr.count / 3;
}

/**
 * Merges an array of BufferGeometry into a single non-indexed geometry.
 * Returns positions and per-triangle material index (0=base, 1=detail).
 */
function mergeGeometries(
  geometries: THREE.BufferGeometry[],
  detailStartIndex: number
): { positions: number[], triangleMaterials: number[], triangleCount: number } {
  const allPositions: number[] = [];
  const triangleMaterials: number[] = [];

  for (let gi = 0; gi < geometries.length; gi++) {
    const geometry = geometries[gi];
    const posAttr = geometry.attributes.position;
    if (!posAttr || posAttr.count === 0) continue;

    const materialIndex = gi >= detailStartIndex ? 1 : 0;
    const triCount = countTriangles(geometry);
    const index = geometry.index;

    if (index) {
      for (let i = 0; i < index.count; i++) {
        const vi = index.getX(i);
        allPositions.push(posAttr.getX(vi), posAttr.getY(vi), posAttr.getZ(vi));
      }
    } else {
      for (let i = 0; i < posAttr.count; i++) {
        allPositions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
      }
    }

    for (let t = 0; t < triCount; t++) {
      triangleMaterials.push(materialIndex);
    }
  }

  return { positions: allPositions, triangleMaterials, triangleCount: allPositions.length / 9 };
}

/**
 * Converts a CSS hex color (#RRGGBB) to 3MF format (#RRGGBBFF).
 */
function to3MFColor(hex: string): string {
  const clean = hex.replace('#', '').toUpperCase();
  return `#${clean.padEnd(6, '0')}FF`;
}

/**
 * Builds a 3MF model XML string with per-triangle colors.
 */
function build3MFModelXML(
  geometries: THREE.BufferGeometry[],
  detailStartIndex: number,
  baseColor: string,
  detailColor: string
): string | null {
  const { positions, triangleMaterials, triangleCount } = mergeGeometries(geometries, detailStartIndex);
  if (triangleCount === 0) return null;

  // De-duplicate vertices
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

  // Build triangles XML with per-triangle material reference
  const hasDetails = triangleMaterials.some(m => m === 1);
  let trianglesXML = '';
  for (let i = 0; i < triangleIndices.length; i += 3) {
    const triIdx = i / 3;
    const matIdx = triangleMaterials[triIdx] ?? 0;
    if (hasDetails) {
      trianglesXML += `        <triangle v1="${triangleIndices[i]}" v2="${triangleIndices[i + 1]}" v3="${triangleIndices[i + 2]}" pid="2" p1="${matIdx}" />\n`;
    } else {
      trianglesXML += `        <triangle v1="${triangleIndices[i]}" v2="${triangleIndices[i + 1]}" v3="${triangleIndices[i + 2]}" />\n`;
    }
  }

  const baseMaterialsXML = hasDetails
    ? `    <basematerials id="2">
      <base name="Base" displaycolor="${to3MFColor(baseColor)}" />
      <base name="Detail" displaycolor="${to3MFColor(detailColor)}" />
    </basematerials>\n`
    : '';

  const objectAttrs = hasDetails ? ' pid="2" pindex="0"' : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${baseMaterialsXML}    <object id="1" type="model"${objectAttrs}>
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
}

function build3MFZip(modelXML: string): JSZip {
  const contentTypesXML = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;

  const relsXML = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;

  const zip = new JSZip();
  zip.file('[Content_Types].xml', contentTypesXML);
  zip.file('_rels/.rels', relsXML);
  zip.file('3D/3dmodel.model', modelXML);
  return zip;
}

/**
 * Exports Three.js geometries to a valid 3MF file with per-triangle colors.
 * Base geometry gets baseColor, detail decorations get white.
 */
export async function exportTo3MF(
  geometries: THREE.BufferGeometry[],
  filename: string = 'model.3mf',
  detailStartIndex: number = 0,
  baseColor: string = '#d2691e'
): Promise<void> {
  if (geometries.length === 0) {
    console.warn('[3MF Export] No geometries to export');
    return;
  }

  const modelXML = build3MFModelXML(geometries, detailStartIndex, baseColor, '#FFFFFF');
  if (!modelXML) {
    console.warn('[3MF Export] Merged geometry has 0 triangles');
    return;
  }

  console.log(`[3MF Export] Exporting ${geometries.length} geometries`);

  const zip = build3MFZip(modelXML);
  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.3mf') ? filename : `${filename}.3mf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function generate3MFBlob(
  geometries: THREE.BufferGeometry[],
  detailStartIndex: number = 0,
  baseColor: string = '#d2691e'
): Promise<Blob | null> {
  if (geometries.length === 0) return null;

  const modelXML = build3MFModelXML(geometries, detailStartIndex, baseColor, '#FFFFFF');
  if (!modelXML) return null;

  const zip = build3MFZip(modelXML);
  return await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
}

import { buildGeometries } from './geometryBuilder';
import { type Game } from '../../../lib/firebase';

export async function exportAllToZip(game: Game, gameName: string): Promise<void> {
  const zip = new JSZip();
  let addedFiles = 0;

  for (const [memberName, project] of Object.entries(game.projects || {})) {
    if (project.strokes && project.strokes.length > 0) {
      const color = project.color || '#d2691e';
      const { geometries, detailStartIndex } = buildGeometries(project.strokes, {
        color,
        extrusionDepth: 4,
        strokeWidth: 1,
        outerExpansion: 3,
        innerGap: 2
      });

      const blob = await generate3MFBlob(geometries, detailStartIndex, color);
      if (blob) {
        zip.file(`${memberName}_gingerbread.3mf`, blob);
        addedFiles++;
      }
    }
  }

  if (addedFiles === 0) {
    alert("No models found to export.");
    return;
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${gameName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_all_models.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
