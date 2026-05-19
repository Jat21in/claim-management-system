import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  OnDestroy
} from '@angular/core';

import * as THREE from 'three';
import ThreeGlobe from 'three-globe';

@Component({
  selector: 'app-globe',
  templateUrl: './globe.component.html',
  styleUrls: ['./globe.component.scss'],
  standalone: true
})
export class GlobeComponent implements AfterViewInit, OnDestroy {

  @ViewChild('globeContainer', { static: true })
  globeContainer!: ElementRef;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private globe!: any;
  private animationId!: number;

  async ngAfterViewInit(): Promise<void> {
    await this.initGlobe();
    this.animate();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationId);
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  private async initGlobe() {
    const container = this.globeContainer.nativeElement;

    // ✅ WAIT for Angular layout to stabilize
    await new Promise(r => setTimeout(r, 150));

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    console.log("Globe size:", width, height); // ✅ DEBUG

    // ✅ Scene
    this.scene = new THREE.Scene();

    // ✅ Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    );
    this.camera.position.z = 300;

    // ✅ Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);

    container.appendChild(this.renderer.domElement);

    // ✅ Globe
    this.globe = new ThreeGlobe()
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png');

    // ✅ GeoJSON load
    const res = await fetch('/data/globe.json');
    const countries = await res.json();

    this.globe
      .polygonsData(countries.features)
      .polygonCapColor(() => 'rgba(59,130,246,0.4)')
      .polygonSideColor(() => 'rgba(0,0,0,0.05)')
      .polygonStrokeColor(() => '#111');

    // ✅ IMPORTANT SCALE FIX
    this.globe.scale.set(200, 200, 200);

    this.scene.add(this.globe);

    // ✅ Lighting
    const ambientLight = new THREE.AmbientLight(0x3b82f6, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 100);
    this.scene.add(directionalLight);

    // ✅ Resize handling
    window.addEventListener('resize', () => {
      const newWidth = container.clientWidth || 500;
      const newHeight = container.clientHeight || 500;

      this.camera.aspect = newWidth / newHeight;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(newWidth, newHeight);
    });
  }

  private animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    if (this.globe) {
      this.globe.rotation.y += 0.002;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
