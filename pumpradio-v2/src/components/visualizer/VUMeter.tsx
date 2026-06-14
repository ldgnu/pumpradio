'use client'

import { useRef, useMemo, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface VUMeterProps {
  frequencyData: Uint8Array | null
  beatDetected: boolean
  volume?: number
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
}

const SEGMENTS = 48
const ARC_RADIUS = 2.2
const ARC_START = -Math.PI * 0.85
const ARC_END = Math.PI * 0.85
const TUBE_RADIUS = 0.04
const GLOW_RADIUS = 0.08

const VUMeter = memo(function VUMeter({
  frequencyData,
  beatDetected,
  volume = 0,
  primaryColor = '#ff2200',
  secondaryColor = '#00ddff',
  accentColor = '#ff6600',
}: VUMeterProps) {
  const glowRef = useRef<THREE.Mesh>(null!)
  const arcRef = useRef<THREE.Mesh>(null!)
  const targetLevel = useRef(0)
  const currentLevel = useRef(0)
  const beatFlash = useRef(0)
  const glowIntensity = useRef(0)

  // Compute volume from frequencyData if no explicit volume prop
  const derivedVolume = useMemo(() => {
    if (volume !== undefined && volume > 0) return volume
    if (!frequencyData) return 0
    let sum = 0
    for (let i = 0; i < frequencyData.length; i++) {
      sum += frequencyData[i]
    }
    return sum / frequencyData.length / 255
  }, [frequencyData, volume])

  const arcGeometry = useMemo(() => {
    const curve = new THREE.CurvePath<THREE.Vector3>()
    const points: THREE.Vector3[] = []
    for (let i = 0; i <= SEGMENTS; i++) {
      const t = i / SEGMENTS
      const angle = ARC_START + t * (ARC_END - ARC_START)
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * ARC_RADIUS,
          Math.sin(angle) * ARC_RADIUS,
          0
        )
      )
    }
    const catmull = new THREE.CatmullRomCurve3(points)
    return new THREE.TubeGeometry(catmull, SEGMENTS, TUBE_RADIUS, 6, false)
  }, [])

  const glowGeometry = useMemo(() => {
    const curve = new THREE.CurvePath<THREE.Vector3>()
    const points: THREE.Vector3[] = []
    for (let i = 0; i <= SEGMENTS; i++) {
      const t = i / SEGMENTS
      const angle = ARC_START + t * (ARC_END - ARC_START)
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * ARC_RADIUS,
          Math.sin(angle) * ARC_RADIUS,
          0
        )
      )
    }
    const catmull = new THREE.CatmullRomCurve3(points)
    return new THREE.TubeGeometry(catmull, SEGMENTS, GLOW_RADIUS, 6, false)
  }, [])

  const colorCache = useMemo(() => {
    const prim = new THREE.Color(primaryColor)
    const sec = new THREE.Color(secondaryColor)
    const acc = new THREE.Color(accentColor)
    const colors: THREE.Color[] = []
    for (let i = 0; i <= SEGMENTS; i++) {
      const t = i / SEGMENTS
      if (t < 0.5) {
        colors.push(prim.clone().lerp(new THREE.Color('#ffcc00'), t * 2))
      } else if (t < 0.8) {
        colors.push(new THREE.Color('#ffcc00').lerp(new THREE.Color('#ff6600'), (t - 0.5) * 3.33))
      } else {
        colors.push(new THREE.Color('#ff6600').lerp(acc, (t - 0.8) * 5))
      }
    }
    return colors
  }, [primaryColor, secondaryColor, accentColor])

  useFrame((_, delta) => {
    const speed = Math.min(1, delta * 6)
    targetLevel.current = derivedVolume
    currentLevel.current += (targetLevel.current - currentLevel.current) * speed

    beatFlash.current *= 0.9
    if (beatDetected) {
      beatFlash.current = 1
    }

    glowIntensity.current += ((beatDetected ? 2 : currentLevel.current * 1.5) - glowIntensity.current) * speed

    // Update arc mesh scale to show level
    if (arcRef.current) {
      const fillAmount = Math.max(0.01, Math.min(1, currentLevel.current * 1.2))
      arcRef.current.scale.x = fillAmount
    }

    // Update glow opacity/scale
    if (glowRef.current) {
      const glowScale = 1 + glowIntensity.current * 0.3
      glowRef.current.scale.set(glowScale, glowScale, glowScale)

      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = Math.min(0.5, glowIntensity.current * 0.3)
    }
  })

  return (
    <group>
      {/* Background ring */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[ARC_RADIUS, TUBE_RADIUS * 0.5, 8, SEGMENTS]} />
        <meshBasicMaterial color="#222222" transparent opacity={0.3} />
      </mesh>

      {/* Glow layer */}
      <mesh
        ref={glowRef}
        geometry={glowGeometry}
        rotation={[0, 0, Math.PI / 2]}
      >
        <meshBasicMaterial
          color={primaryColor}
          transparent
          opacity={0.2}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Active arc */}
      <mesh
        ref={arcRef}
        geometry={arcGeometry}
        rotation={[0, 0, Math.PI / 2]}
      >
        <meshBasicMaterial
          color={accentColor}
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Center indicator dot */}
      <mesh position={[0, 0, 0.05]}>
        <circleGeometry args={[0.06, 16]} />
        <meshBasicMaterial
          color={primaryColor}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
})

export default VUMeter
