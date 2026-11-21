import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Box3, Color, Group, Mesh, MeshStandardMaterial, Scene, Vector3 } from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { BRAIN_MESH_REGIONS } from "../src/workspaces/Brain/brainVisualizationData.ts";

const archivePath = process.argv[2];
if (!archivePath) {
  throw new Error("Provide the official isa_BP3D_4.0_obj_99.zip archive as the first argument.");
}

globalThis.FileReader = class {
  result = null;
  onloadend = null;
  onerror = null;

  readAsArrayBuffer(blob) {
    blob.arrayBuffer()
      .then((result) => {
        this.result = result;
        this.onloadend?.();
      })
      .catch((error) => this.onerror?.(error));
  }
};

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(scriptDirectory, "../public/models/brain/bodyparts3d-atlas.glb");
const loader = new OBJLoader();
const scene = new Scene();
const atlasRoot = new Group();
atlasRoot.name = "bodyparts3d-atlas";
atlasRoot.rotation.x = -Math.PI / 2;
scene.add(atlasRoot);

for (const region of BRAIN_MESH_REGIONS) {
  const regionGroup = new Group();
  regionGroup.name = region.id;
  atlasRoot.add(regionGroup);
  const material = new MeshStandardMaterial({
    color: region.color,
    emissive: new Color(region.color).multiplyScalar(0.025),
    roughness: 0.62,
    metalness: 0.02,
  });

  for (const meshId of region.meshIds) {
    const sourcePath = `isa_BP3D_4.0_obj_99/${meshId}.obj`;
    const source = execFileSync("unzip", ["-p", archivePath, sourcePath], {
      maxBuffer: 20 * 1024 * 1024,
    }).toString("utf8");
    const object = loader.parse(source);
    object.name = meshId;
    object.traverse((child) => {
      if (!(child instanceof Mesh)) return;
      child.geometry.computeVertexNormals();
      child.material = material;
      child.castShadow = true;
      child.receiveShadow = true;
    });
    regionGroup.add(object);
  }
}

atlasRoot.updateMatrixWorld(true);
const bounds = new Box3().setFromObject(atlasRoot);
const center = bounds.getCenter(new Vector3());
const size = bounds.getSize(new Vector3());
const scale = 3.2 / Math.max(size.x, size.y, size.z);
atlasRoot.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
atlasRoot.scale.setScalar(scale);
atlasRoot.updateMatrixWorld(true);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

await new Promise((resolve, reject) => {
  new GLTFExporter().parse(
    scene,
    (result) => {
      fs.writeFileSync(outputPath, Buffer.from(result));
      resolve();
    },
    reject,
    {
      binary: true,
      copyright: "BodyParts3D, © The Database Center for Life Science, licensed under CC BY 4.0",
    },
  );
});

console.log(`Wrote ${outputPath} from ${BRAIN_MESH_REGIONS.length} region groups.`);
