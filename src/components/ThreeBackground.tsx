import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeBackgroundProps {
  reducedMotion?: boolean;
  intensity?: 'ambient' | 'immersive';
  interactive?: boolean;
}

export const ThreeBackground: React.FC<ThreeBackgroundProps> = ({
  reducedMotion = false,
  intensity = 'ambient',
  interactive = true,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      54,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 18;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // Color materials extracted from logo: Crimson Red, Royal Violet, Muted Gold, Deep Navy
    const materials = [
      new THREE.MeshStandardMaterial({
        color: 0xc41230, // Logo Crimson
        roughness: 0.3,
        metalness: 0.7,
      }),
      new THREE.MeshStandardMaterial({
        color: 0x672288, // Logo Purple
        roughness: 0.25,
        metalness: 0.8,
      }),
      new THREE.MeshStandardMaterial({
        color: 0xdfb15b, // Muted Gold
        roughness: 0.2,
        metalness: 0.85,
      }),
      new THREE.MeshPhysicalMaterial({
        color: 0x242265, // Royal Indigo
        metalness: 0.3,
        roughness: 0.15,
        transmission: 0.8,
        transparent: true,
        opacity: 0.7,
      }),
      new THREE.MeshBasicMaterial({
        color: 0xdfb15b,
        wireframe: true,
        transparent: true,
        opacity: 0.2,
      }),
    ];

    interface FloatingItem {
      mesh: THREE.Object3D;
      rotSpeedX: number;
      rotSpeedY: number;
      rotSpeedZ: number;
      floatSpeed: number;
      floatOffset: number;
      initialY: number;
    }

    const floatingItems: FloatingItem[] = [];

    // Polyhedral proportional geometries
    const geometries = [
      new THREE.IcosahedronGeometry(1.4, 0),
      new THREE.TorusGeometry(1.3, 0.25, 16, 40),
      new THREE.OctahedronGeometry(1.3, 0),
      new THREE.DodecahedronGeometry(1.2),
      new THREE.RingGeometry(1.1, 1.4, 32),
    ];

    const itemCount = intensity === 'immersive' ? 18 : 10;
    for (let i = 0; i < itemCount; i++) {
      const geom = geometries[i % geometries.length];
      const mat = materials[i % materials.length];
      const mesh = new THREE.Mesh(geom, mat);

      const spreadX = intensity === 'immersive' ? 24 : 20;
      const spreadY = intensity === 'immersive' ? 16 : 12;
      const spreadZ = 12;

      mesh.position.x = (Math.random() - 0.5) * spreadX;
      mesh.position.y = (Math.random() - 0.5) * spreadY;
      mesh.position.z = (Math.random() - 0.5) * spreadZ - 2;

      mesh.rotation.x = Math.random() * Math.PI;
      mesh.rotation.y = Math.random() * Math.PI;
      mesh.rotation.z = Math.random() * Math.PI;

      const scale = 0.5 + Math.random() * 0.6;
      mesh.scale.set(scale, scale, scale);

      worldGroup.add(mesh);
      floatingItems.push({
        mesh,
        rotSpeedX: (Math.random() - 0.5) * 0.01,
        rotSpeedY: (Math.random() - 0.5) * 0.012,
        rotSpeedZ: (Math.random() - 0.5) * 0.008,
        floatSpeed: 0.6 + Math.random() * 0.6,
        floatOffset: Math.random() * Math.PI * 2,
        initialY: mesh.position.y,
      });
    }

    // Gentle particle field
    const particleCount = intensity === 'immersive' ? 240 : 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const c1 = new THREE.Color(0xc41230);
    const c2 = new THREE.Color(0x672288);
    const c3 = new THREE.Color(0xdfb15b);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 32;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 22;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 18 - 4;

      const chosen = Math.random() > 0.6 ? c3 : Math.random() > 0.3 ? c2 : c1;
      particleColors[i * 3] = chosen.r;
      particleColors[i * 3 + 1] = chosen.g;
      particleColors[i * 3 + 2] = chosen.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    worldGroup.add(particles);

    // Subtle lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const pLight1 = new THREE.PointLight(0xdfb15b, 2.0, 28);
    pLight1.position.set(8, 8, 8);
    scene.add(pLight1);

    const pLight2 = new THREE.PointLight(0xc41230, 1.8, 28);
    pLight2.position.set(-8, -6, 6);
    scene.add(pLight2);

    let targetTiltX = 0;
    let targetTiltY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!interactive || reducedMotion) return;
      let clientX = 0;
      let clientY = 0;
      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      const normX = (clientX / window.innerWidth) * 2 - 1;
      const normY = -(clientY / window.innerHeight) * 2 + 1;
      targetTiltX = normX * 0.2;
      targetTiltY = normY * 0.15;
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (!reducedMotion) {
        currentTiltX += (targetTiltX - currentTiltX) * 0.035;
        currentTiltY += (targetTiltY - currentTiltY) * 0.035;
        worldGroup.rotation.y = currentTiltX;
        worldGroup.rotation.x = -currentTiltY;

        for (let i = 0; i < floatingItems.length; i++) {
          const item = floatingItems[i];
          item.mesh.rotation.x += item.rotSpeedX;
          item.mesh.rotation.y += item.rotSpeedY;
          item.mesh.rotation.z += item.rotSpeedZ;
          item.mesh.position.y =
            item.initialY + Math.sin(elapsedTime * item.floatSpeed + item.floatOffset) * 0.45;
        }

        particles.rotation.y = elapsedTime * 0.015;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      resizeObserver.disconnect();
      geometries.forEach(g => g.dispose());
      materials.forEach(m => m.dispose());
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [reducedMotion, intensity, interactive]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none -z-10"
      aria-hidden="true"
    />
  );
};
