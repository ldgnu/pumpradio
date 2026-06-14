'use client'

import { useRef, useMemo, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Waveform3DProps {
  frequencyData: Uint8Array | null
  beatDetected: boolean
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
}

const POINTS = 128
const WAVE_RADIUS = 2.8
const TUBE_RADIUS = 0.015
const AMPLITUDE = 0.8

const Waveform3D = memo(function Waveform3D({
  frequencyData,
  beatDetected,
  primaryColor = '#ff2200',
  secondaryColor = '#00ddff',
  accentColor = '#ff6600',
}: Waveform3DProps) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const glowMeshRef = useRef<THREE.Mesh>(null!)
  const currentAmplitude = useRef(new Float32Array(POINTS).fill(0))
  const targetAmplitude = useRef(new Float32Array(POINTS).fill(0))
  const beatFlash = useRef(0)
  const rotation = useRef(0)

  // Generate base circle positions
  const basePositions = useMemo(() => {
    const pos: THREE.Vector3[] = []
    for (let i = 0; i <= POINTS; i++) {
      const t = i / POINTS
      const angle = t * Math.PI * 2
      pos.push(
        new THREE.Vector3(
          Math.cos(angle) * WAVE_RADIUS,
          0,
          Math.sin(angle) * WAVE_RADIUS
        )
      )
    }
    return pos
  }, [])

  // Create a dynamic curve that we update each frame
  const curve = useMemo(() => new THREE.CatmullRomCurve3(
    basePositions.map(() => new THREE.Vector3(0, 0, 0))
  ), [basePositions])

  const tubeGeometry = useMemo(() => {
    const geo = new THREE.TubeGeometry(curve, POINTS, TUBE_RADIUS, 4, true)
    return geo
  }, [curve, POINTS])

  const glowGeometry = useMemo(() => {
    const geo = new THREE.TubeGeometry(curve, POINTS, TUBE_RADIUS * 3, 4, true)
    return geo
  }, [curve, POINTS])

  const colors = useMemo(() => {
    const prim = new THREE.Color(primaryColor)
    const sec = new THREE.Color(secondaryColor)
    const acc = new THREE.Color(accentColor)
    const c = new Float32Array((POINTS + 1) * 3)
    for (let i = 0; i <= POINTS; i++) {
      const t = i / POINTS
      const color = prim.clone().lerp(sec, t).lerp(acc, t * 0.3)
      c[i * 3] = color.r
      c[i * 3 + 1] = color.g
      c[i * 3 + 2] = color.b
    }
    return c
  }, [primaryColor, secondaryColor, accentColor])

  useFrame((_, delta) => {
    const speed = Math.min(1, delta * 10)
    rotation.current += delta * 0.15
    beatFlash.current *= 0.93
    if (beatDetected) beatFlash.current = 1

    // Extract time domain data or synthesize from frequency
    let timeData: Float32Array
    if (frequencyData) {
      // Convert frequency to time-domain-like signal using IFFT-like approach
      // Simpler: just use frequency bins as waveform
      timeData = new Float32Array(POINTS)
      const step = Math.max(1, Math.floor(frequencyData.length / POINTS))
      for (let i = 0; i < POINTS; i++) {
        let sum = 0
        for (let j = 0; j < step; j++) {
          sum += frequencyData[Math.min(i * step + j, frequencyData.length - 1)] ?? 0
        }
        timeData[i] = sum / step / 255
      }
    } else {
      // Idle animation
      timeData = new Float32Array(POINTS)
      for (let i = 0; i < POINTS; i++) {
        const t = i / POINTS
        timeData[i] = 0.5 + Math.sin(t * Math.PI * 2 * 3 + rotation.current * 2) * 0.15
      }
    }

    // Smooth and apply to positions
    const pulse = 1 + beatFlash.current * 0.4
    const points = curve.points

    for (let i = 0; i <= POINTS; i++) {
      const idx = i % POINTS
      const value = (timeData[idx] - 0.5) * 2 * AMPLITUDE * pulse

      targetAmplitude.current[i] = value
      currentAmplitude.current[i] +=
        (targetAmplitude.current[i] - currentAmplitude.current[i]) * speed

      // Apply to curve points — displace along normal direction (radially outward)
      const base = basePositions[i]
      const normalized = new THREE.Vector3(base.x, 0, base.z).normalize()

      points[i].x = base.x + normalized.x * currentAmplitude.current[i] * 0.3
      points[i].y = currentAmplitude.current[i]
      points[i].z = base.z + normalized.z * currentAmplitude.current[i] * 0.3
    }

    // Update geometry
    tubeGeometry.attributes.position.needsUpdate = true
    glowGeometry.attributes.position.needsUpdate = true

    // Rotate the whole group slowly
    if (meshRef.current) {
      meshRef.current.rotation.y = rotation.current
    }
    if (glowMeshRef.current) {
      glowMeshRef.current.rotation.y = rotation.current
    }
  })

  return (
    <group>
      {/* Glow tube */}
      <mesh ref={glowMeshRef} geometry={glowGeometry}>
        <meshBasicMaterial
          color={primaryColor}
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Main waveform tube */}
      <mesh ref={meshRef} geometry={tubeGeometry}>
        <meshBasicMaterial
          color={accentColor}
          transparent
          opacity={0.75}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Center dot */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial
          color={secondaryColor}
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
})

export default Waveform3D
