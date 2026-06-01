import * as THREE from "three";
import { ZONES, getZone } from "@/data/zones";
import type { PlayerState, Scale } from "@/types/game";

const SCALE_COLORS: Record<Scale, number> = {
  continent: 0x44aa88,
  planet: 0x4488cc,
  system: 0xaa6644,
};

export class SceneManager {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private stars: THREE.Points;
  private zoneMeshes = new Map<string, THREE.Mesh>();
  private playerMarker: THREE.Mesh;
  private clock = new THREE.Clock();
  private targetLook = new THREE.Vector3();

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x050810);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x050810, 0.002);

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 2000);
    this.camera.position.set(0, 80, 140);

    const ambient = new THREE.AmbientLight(0x404060, 0.8);
    this.scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(50, 100, 30);
    this.scene.add(dir);

    const starGeo = new THREE.BufferGeometry();
    const count = 3000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 800;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 400;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 800;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0x8899bb, size: 0.8 })
    );
    this.scene.add(this.stars);

    for (const zone of ZONES) {
      const size =
        zone.scale === "system" ? 6 : zone.scale === "planet" ? 3.5 : 2;
      const geo = new THREE.SphereGeometry(size, 16, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: SCALE_COLORS[zone.scale],
        emissive: SCALE_COLORS[zone.scale],
        emissiveIntensity: 0.15,
        metalness: 0.4,
        roughness: 0.6,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...zone.position);
      mesh.userData.zoneId = zone.id;
      this.zoneMeshes.set(zone.id, mesh);
      this.scene.add(mesh);

      for (const connId of zone.connections) {
        const other = ZONES.find((z) => z.id === connId);
        if (!other) continue;
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(...zone.position),
          new THREE.Vector3(...other.position),
        ]);
        const line = new THREE.Line(
          lineGeo,
          new THREE.LineBasicMaterial({
            color: 0x334455,
            transparent: true,
            opacity: 0.35,
          })
        );
        this.scene.add(line);
      }
    }

    const markerGeo = new THREE.ConeGeometry(2, 5, 8);
    const markerMat = new THREE.MeshStandardMaterial({
      color: 0xffdd44,
      emissive: 0xffaa00,
      emissiveIntensity: 0.5,
    });
    this.playerMarker = new THREE.Mesh(markerGeo, markerMat);
    this.scene.add(this.playerMarker);

    window.addEventListener("resize", () => this.resize());
    this.resize();
  }

  resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  syncPlayer(state: PlayerState): void {
    const zone = getZone(state.currentZoneId);
    const pos = new THREE.Vector3(...zone.position);
    this.playerMarker.position.copy(pos.clone().add(new THREE.Vector3(0, 8, 0)));
    this.targetLook.copy(pos);

    for (const [id, mesh] of this.zoneMeshes) {
      const discovered = state.discoveredZones.includes(id);
      mesh.visible = discovered || id === state.currentZoneId;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (id === state.currentZoneId) {
        mat.emissiveIntensity = 0.6;
        mesh.scale.setScalar(1.2);
      } else {
        mat.emissiveIntensity = 0.15;
        mesh.scale.setScalar(1);
      }
    }
  }

  render(): void {
    const t = this.clock.getElapsedTime();
    this.stars.rotation.y = t * 0.02;
    this.playerMarker.rotation.y = t * 2;

    this.camera.position.x += (0 - this.camera.position.x) * 0.02;
    this.camera.position.z += (140 - this.camera.position.z) * 0.02;
    this.camera.lookAt(this.targetLook);

    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.renderer.dispose();
  }
}
