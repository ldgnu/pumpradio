'use client'

import { useRef, useMemo, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Equalizer3DProps {
  frequencyData: Uint8Array | null
  beatDetected: boolean
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
}

const BAND_COUNT = 10
const PARTICLE_COUNT_PER_BAR = 6
const TOTAL_PARTICLES = BAND_COUNT * PARTICLE_COUNT_PER_BAR

const Equalizer3D = memo(function Equalizer3D({
  frequencyData,
  beatDetected,
  primaryColor = '#ff2200',
  secondaryColor = '#00ddff',
  accentColor = '#ff6600',
}: Equalizer3DProps) {
  const barMeshRef = useRef<THREE.InstancedMesh>(null!)
  const particleMeshRef = useRef<THREE.Points>(null!)
  const barHeights = useRef(new Float32Array(BAND_COUNT).fill(0))
  const barTargets = useRef(new Float32Array(BAND_COUNT).fill(0))
  const particlePositions = useRef(new Float32Array(TOTAL_PARTICLES * 3))
  const particleVelocities = useRef(new Float32Array(TOTAL_PARTICLES * 3))
  const particleLifetimes = useRef(new Float32Array(TOTAL_PARTICLES))
  const beatFlash = useRef(0)
  const time = useRef(0)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Bar positions: floated in an arc
  const barPositions = useMemo(() => {
    const pos = new Float32Array(BAND_COUNT * 3)
    const spread = 4.5
    for (let i = 0; i < BAND_COUNT; i++) {
      const t = i / (BAND_COUNT - 1) - 0.5
      pos[i * 3] = t * spread
      pos[i * 3 + 1] = -0.3
      pos[i * 3 + 2] = -(Math.abs(t) * 1.5)
    }
    return pos
  }, [])

  const barColors = useMemo(() => {
    const prim = new THREE.Color(primaryColor)
    const sec = new THREE.Color(secondaryColor)
    const acc = new THREE.Color(accentColor)
    const colors: THREE.Color[] = []
    for (let i = 0; i < BAND_COUNT; i++) {
      const t = i / (BAND_COUNT - 1)
      colors.push(prim.clone().lerp(sec, t).lerp(acc, t * 0.5))
    }
    return colors
  }, [primaryColor, secondaryColor, accentColor])

  // Initialize particles
  const particleGeo = useMemo(() => {
    const positions = new Float32Array(TOTAL_PARTICLES * 3)
    for (let i = 0; i < TOTAL_PARTICLES; i++) {
      const barIdx = Math.floor(i / PARTICLE_COUNT_PER_BAR)
      positions[i * 3] = barPositions[barIdx * 3] + (Math.random() - 0.5) * 0.2
      positions[i * 3 + 1] = -0.3
      positions[i * 3 + 2] = barPositions[barIdx * 3 + 2] + (Math.random() - 0.5) * 0.2
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [barPositions])

  // Particle trail data refs
  const particleData = useMemo(() => {
    const trailPos = new Float32Array(TOTAL_PARTICLES * 3)
    const trailAlpha = new Float32Array(TOTAL_PARTICLES)
    for (let i = 0; i < TOTAL_PARTICLES; i++) {
      const barIdx = Math.floor(i / PARTICLE_COUNT_PER_BAR)
      trailPos[i * 3] = barPositions[barIdx * 3]
      trailPos[i * 3 + 1] = -0.3
      trailPos[i * 3 + 2] = barPositions[barIdx * 3 + 2]
      trailAlpha[i] = 0
      particleLifetimes.current[i] = Math.random()
      particleVelocities.current[i * 3] = (Math.random() - 0.5) * 0.5
      particleVelocities.current[i * 3 + 1] = -(0.3 + Math.random() * 0.5)
      particleVelocities.current[i * 3 + 2] = (Math.random() - 0.5) * 0.5
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3))
    geo.setAttribute('alpha', new THREE.BufferAttribute(trailAlpha, 1))
    return geo
  }, [barPositions])

  useFrame((_, delta) => {
    const speed = Math.min(1, delta * 7)
    time.current += delta
    beatFlash.current *= 0.9
    if (beatDetected) beatFlash.current = 1

    // Update bar targets from frequency data
    if (frequencyData) {
      const binStep = Math.floor(frequencyData.length / BAND_COUNT)
      for (let i = 0; i < BAND_COUNT; i++) {
        let avg = 0
        for (let j = 0; j < binStep; j++) {
          avg += frequencyData[Math.min(i * binStep + j, frequencyData.length - 1)] ?? 0
        }
        avg /= binStep * 255
        barTargets.current[i] = Math.max(0.02, avg * 1.5)
      }
    } else {
      for (let i = 0; i < BAND_COUNT; i++) {
        barTargets.current[i] = 0.05 + Math.sin(time.current * 2 + i * 0.5) * 0.05
      }
    }

    // Animate bars (InstancedMesh)
    const pulse = 1 + beatFlash.current * 0.25
    for (let i = 0; i < BAND_COUNT; i++) {
      barHeights.current[i] += (barTargets.current[i] - barHeights.current[i]) * speed
      const height = barHeights.current[i] * 1.8
      const floatOffset = Math.sin(time.current * 0.5 + i * 0.7) * 0.1

      dummy.position.set(
        barPositions[i * 3],
        barPositions[i * 3 + 1] + height / 2 + floatOffset,
        barPositions[i * 3 + 2]
      )
      dummy.scale.set(0.15, Math.max(0.01, height), 0.15)
      dummy.rotation.x = Math.sin(time.current * 0.3 + i) * 0.05
      dummy.rotation.z = Math.cos(time.current * 0.4 + i) * 0.05
      dummy.updateMatrix()
      barMeshRef.current.setMatrixAt(i, dummy.matrix)

      const instanceColor = new THREE.Color(barColors[i])
      instanceColor.multiplyScalar(pulse)
      barMeshRef.current.setColorAt(i, instanceColor)
    }
    barMeshRef.current.instanceMatrix.needsUpdate = true
    if (barMeshRef.current.instanceColor) {
      barMeshRef.current.instanceColor.needsUpdate = true
    }

    // Animate particle trails
    const pos = particleData.attributes.position.array as Float32Array
    const alpha = particleData.attributes.alpha.array as Float32Array

    for (let i = 0; i < TOTAL_PARTICLES; i++) {
      const barIdx = Math.floor(i / PARTICLE_COUNT_PER_BAR)
      const barH = barHeights.current[barIdx] * 1.8

      particleLifetimes.current[i] -= delta * (1.5 + barH * 2)

      if (particleLifetimes.current[i] <= 0) {
        // Reset particle at top of bar
        pos[i * 3] = barPositions[barIdx * 3] + (Math.random() - 0.5) * 0.15
        pos[i * 3 + 1] = barPositions[barIdx * 3 + 1] + barH + 0.05
        pos[i * 3 + 2] = barPositions[barIdx * 3 + 2] + (Math.random() - 0.5) * 0.15
        particleLifetimes.current[i] = 0.5 + Math.random() * 0.8
        particleVelocities.current[i * 3] = (Math.random() - 0.5) * 0.4
        particleVelocities.current[i * 3 + 1] = -(0.5 + Math.random() * 0.8)
        particleVelocities.current[i * 3 + 2] = (Math.random() - 0.5) * 0.4
      } else {
        pos[i * 3] += particleVelocities.current[i * 3] * delta
        pos[i * 3 + 1] += particleVelocities.current[i * 3 + 1] * delta
        pos[i * 3 + 2] += particleVelocities.current[i * 3 + 2] * delta

        // Friction
        particleVelocities.current[i * 3] *= 0.995
        particleVelocities.current[i * 3 + 2] *= 0.995
      }

      alpha[i] = Math.min(1, particleLifetimes.current[i] * 3)
    }

    particleData.attributes.position.needsUpdate = true
    particleData.attributes.alpha.needsUpdate = true

    if (particleMeshRef.current) {
      particleMeshRef.current.position.y =
        Math.sin(time.current * 0.3) * 0.05
    }
  })

  return (
    <group>
      <instancedMesh
        ref={barMeshRef}
        args={[undefined, undefined, BAND_COUNT]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          metalness={0.5}
          roughness={0.3}
          emissive={new THREE.Color(accentColor)}
          emissiveIntensity={0.1}
        />
      </instancedMesh>

      <points ref={particleMeshRef} geometry={particleData}>
        <pointsMaterial
          size={0.04}
          color={secondaryColor}
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  )
})

export default Equalizer3D
