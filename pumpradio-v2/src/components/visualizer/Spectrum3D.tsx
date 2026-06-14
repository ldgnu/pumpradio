'use client'

import { useRef, useMemo, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Spectrum3DProps {
  frequencyData: Uint8Array | null
  beatDetected: boolean
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
}

const BAR_COUNT = 32

const Spectrum3D = memo(function Spectrum3D({
  frequencyData,
  beatDetected,
  primaryColor = '#ff2200',
  secondaryColor = '#00ddff',
  accentColor = '#ff6600',
}: Spectrum3DProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dataRef = useRef<Float32Array>(new Float32Array(BAR_COUNT).fill(0))
  const targetRef = useRef<Float32Array>(new Float32Array(BAR_COUNT).fill(0))
  const beatFlash = useRef(0)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const { positions, rotations } = useMemo(() => {
    const pos = new Float32Array(BAR_COUNT * 3)
    const rot = new Float32Array(BAR_COUNT)
    const radius = 3.5
    for (let i = 0; i < BAR_COUNT; i++) {
      const angle = (i / BAR_COUNT) * Math.PI - Math.PI / 2
      pos[i * 3] = Math.cos(angle) * radius
      pos[i * 3 + 1] = -0.5
      pos[i * 3 + 2] = Math.sin(angle) * radius
      rot[i] = -angle + Math.PI / 2
    }
    return { positions: pos, rotations: rot }
  }, [])

  const colors = useMemo(() => {
    const prim = new THREE.Color(primaryColor)
    const sec = new THREE.Color(secondaryColor)
    const acc = new THREE.Color(accentColor)
    const palette: THREE.Color[] = []
    for (let i = 0; i < BAR_COUNT; i++) {
      const t = i / BAR_COUNT
      if (t < 0.33) {
        palette.push(prim.clone().lerp(new THREE.Color('#ff8800'), t * 3))
      } else if (t < 0.66) {
        palette.push(new THREE.Color('#ff8800').lerp(sec, (t - 0.33) * 3))
      } else {
        palette.push(sec.clone().lerp(acc, (t - 0.66) * 3))
      }
    }
    return palette
  }, [primaryColor, secondaryColor, accentColor])

  useFrame((_, delta) => {
    const speed = Math.min(1, delta * 8)
    beatFlash.current *= 0.92
    if (beatDetected) beatFlash.current = 1

    if (frequencyData) {
      const step = Math.floor(frequencyData.length / BAR_COUNT)
      for (let i = 0; i < BAR_COUNT; i++) {
        let avg = 0
        for (let j = 0; j < step; j++) {
          avg += frequencyData[i * step + j] ?? 0
        }
        avg /= step * 255
        targetRef.current[i] = Math.max(0.02, avg * 1.2)
      }
    }

    const instanceColor = new THREE.Color()
    const pulse = 1 + beatFlash.current * 0.3

    for (let i = 0; i < BAR_COUNT; i++) {
      dataRef.current[i] += (targetRef.current[i] - dataRef.current[i]) * speed
      const height = dataRef.current[i] * 2.5

      dummy.position.set(
        positions[i * 3],
        positions[i * 3 + 1] + height / 2,
        positions[i * 3 + 2]
      )
      dummy.scale.set(0.08, Math.max(0.01, height), 0.08)
      dummy.rotation.y = rotations[i]
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      const color = colors[i].clone().multiplyScalar(pulse)
      instanceColor.set(color)
      meshRef.current.setColorAt(i, instanceColor)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true
    }
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, BAR_COUNT]}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        metalness={0.3}
        roughness={0.4}
        emissive={new THREE.Color(primaryColor)}
        emissiveIntensity={0.15}
      />
    </instancedMesh>
  )
})

export default Spectrum3D
