'use client'

import { useRef, useMemo, type ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import * as THREE from 'three'

interface SpectrumSceneProps {
  children: ReactNode
  cameraPosition?: [number, number, number]
  cameraFov?: number
  className?: string
  style?: React.CSSProperties
}

function CameraController({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null!)

  useFrame(({ camera }, delta) => {
    // Subtle auto-orbit for dynamism
    if (ref.current) {
      ref.current.rotation.y += delta * 0.02
    }
  })

  return (
    <group ref={ref} position={position}>
      {/* Empty group that orbits — children render inside it */}
    </group>
  )
}

function SceneLights() {
  return (
    <>
      {/* Ambient fill */}
      <ambientLight intensity={0.3} />
      {/* Key light */}
      <directionalLight
        position={[5, 5, 5]}
        intensity={1.2}
        color="#ffffff"
      />
      {/* Fill light */}
      <directionalLight
        position={[-3, 2, -3]}
        intensity={0.5}
        color="#4466ff"
      />
      {/* Rim light */}
      <directionalLight
        position={[0, -4, 0]}
        intensity={0.3}
        color="#ff4466"
      />
      {/* Subtle point light near center */}
      <pointLight position={[0, 0, 0]} intensity={0.2} color="#ffffff" />
    </>
  )
}

export default function SpectrumScene({
  children,
  cameraPosition = [0, 0.8, 5.5],
  cameraFov = 55,
  className,
  style,
}: SpectrumSceneProps) {
  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      <Canvas
        camera={{
          position: cameraPosition,
          fov: cameraFov,
          near: 0.1,
          far: 50,
        }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <SceneLights />
        {children}
      </Canvas>
    </div>
  )
}
