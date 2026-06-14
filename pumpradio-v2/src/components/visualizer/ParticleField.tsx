'use client'

import { useRef, useMemo, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ParticleFieldProps {
  frequencyData: Uint8Array | null
  beatDetected: boolean
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
}

const PARTICLE_COUNT = 200
const FIELD_RADIUS = 3.5

const ParticleField = memo(function ParticleField({
  frequencyData,
  beatDetected,
  primaryColor = '#ff2200',
  secondaryColor = '#00ddff',
  accentColor = '#ff6600',
}: ParticleFieldProps) {
  const meshRef = useRef<THREE.Points>(null!)
  const time = useRef(0)
  const beatFlash = useRef(0)
  const energy = useRef(0)

  // Particle initial states
  const particleData = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const sizes = new Float32Array(PARTICLE_COUNT)
    const phases = new Float32Array(PARTICLE_COUNT)
    const velocities = new Float32Array(PARTICLE_COUNT * 3)
    const basePositions = new Float32Array(PARTICLE_COUNT * 3)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Spherical distribution
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = Math.pow(Math.random(), 0.5) * FIELD_RADIUS

      basePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      basePositions[i * 3 + 1] = r * Math.cos(phi)
      basePositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)

      positions[i * 3] = basePositions[i * 3]
      positions[i * 3 + 1] = basePositions[i * 3 + 1]
      positions[i * 3 + 2] = basePositions[i * 3 + 2]

      sizes[i] = 0.02 + Math.random() * 0.06
      phases[i] = Math.random() * Math.PI * 2
      velocities[i * 3] = (Math.random() - 0.5) * 0.5
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.5
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('phase', new THREE.BufferAttribute(phases, 1))

    return { geo, basePositions, velocities, phases, sizes }
  }, [])

  // Colors derived from station config
  const colorPalette = useMemo(() => {
    const prim = new THREE.Color(primaryColor)
    const sec = new THREE.Color(secondaryColor)
    const acc = new THREE.Color(accentColor)
    return [prim, sec, acc]
  }, [primaryColor, secondaryColor, accentColor])

  useFrame((_, delta) => {
    time.current += delta
    beatFlash.current *= 0.88
    if (beatDetected) beatFlash.current = 1

    // Compute energy from frequency data
    if (frequencyData) {
      let sum = 0
      const bassEnd = Math.floor(frequencyData.length * 0.15)
      for (let i = 0; i < bassEnd; i++) {
        sum += frequencyData[i]
      }
      const newEnergy = sum / bassEnd / 255
      energy.current += (newEnergy - energy.current) * Math.min(1, delta * 5)
    } else {
      energy.current += (0.3 - energy.current) * Math.min(1, delta * 2)
    }

    const pos = particleData.geo.attributes.position.array as Float32Array
    const impulse = 1 + beatFlash.current * 2.5
    const energyScale = 0.4 + energy.current * 1.2

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      const phase = particleData.phases[i]
      const t = time.current

      // Orbital drift: particles orbit slowly around center
      const orbitSpeed = 0.15 + energy.current * 0.3
      const orbitAngle = t * orbitSpeed + phase
      const dist = Math.sqrt(
        particleData.basePositions[i3] ** 2 +
        particleData.basePositions[i3 + 1] ** 2 +
        particleData.basePositions[i3 + 2] ** 2
      )

      // Radial pulse: particles breathe with energy
      const breathe = 1 + Math.sin(t * 0.8 + phase) * 0.15 * energyScale
      const beatBurst = 1 + beatFlash.current * 2 * Math.exp(-dist / FIELD_RADIUS)

      // Position = base * breathe * beatBurst with orbital component
      pos[i3] = particleData.basePositions[i3] * breathe * beatBurst
      pos[i3 + 1] =
        particleData.basePositions[i3 + 1] * breathe * beatBurst +
        Math.sin(t * 0.5 + phase) * 0.2 * energyScale
      pos[i3 + 2] = particleData.basePositions[i3 + 2] * breathe * beatBurst +
        Math.cos(t * 0.7 + phase * 1.3) * 0.2 * energyScale

      // Beat impulse: burst particles outward
      if (beatDetected) {
        pos[i3] += particleData.velocities[i3] * beatFlash.current * 0.5
        pos[i3 + 1] += particleData.velocities[i3 + 1] * beatFlash.current * 0.5
        pos[i3 + 2] += particleData.velocities[i3 + 2] * beatFlash.current * 0.5
      }
    }

    particleData.geo.attributes.position.needsUpdate = true

    // Update material color/opacity based on beat
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.PointsMaterial
      const beatColor = colorPalette[
        Math.floor(beatFlash.current * colorPalette.length) % colorPalette.length
      ]
      mat.color.lerp(beatColor, delta * 3)
      mat.size = 0.03 + energy.current * 0.08 + beatFlash.current * 0.05
    }
  })

  return (
    <points ref={meshRef} geometry={particleData.geo}>
      <pointsMaterial
        size={0.05}
        color={primaryColor}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
})

export default ParticleField
