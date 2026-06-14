'use client'

import { useRef, useMemo, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { backgroundReactive } from '@/lib/shaders'

interface BackgroundReactiveProps {
  frequencyData: Uint8Array | null
  beatDetected: boolean
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
}

const BackgroundReactive = memo(function BackgroundReactive({
  frequencyData,
  beatDetected,
  primaryColor = '#111122',
  secondaryColor = '#220022',
  accentColor = '#ff4400',
}: BackgroundReactiveProps) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const time = useRef(0)
  const beatIntensity = useRef(0)
  const energy = useRef(0)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBeat: { value: 0 },
      uEnergy: { value: 0.3 },
      uPrimary: { value: new THREE.Color(primaryColor) },
      uSecondary: { value: new THREE.Color(secondaryColor) },
      uAccent: { value: new THREE.Color(accentColor) },
    }),
    []
  )

  const shaderMaterial = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: backgroundReactive.vertexShader,
      fragmentShader: backgroundReactive.fragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.NormalBlending,
    })
    return mat
  }, [uniforms])

  // Update uniforms when colors change
  useMemo(() => {
    uniforms.uPrimary.value.set(primaryColor)
    uniforms.uSecondary.value.set(secondaryColor)
    uniforms.uAccent.value.set(accentColor)
  }, [uniforms, primaryColor, secondaryColor, accentColor])

  useFrame((_, delta) => {
    time.current += delta
    beatIntensity.current *= 0.92
    if (beatDetected) beatIntensity.current = 1

    // Compute energy from frequency data
    if (frequencyData) {
      let sum = 0
      const bassEnd = Math.floor(frequencyData.length * 0.2)
      for (let i = 0; i < bassEnd; i++) {
        sum += frequencyData[i]
      }
      const bassAvg = sum / Math.max(1, bassEnd) / 255
      // Also compute total energy
      let totalSum = 0
      for (let i = 0; i < frequencyData.length; i++) {
        totalSum += frequencyData[i]
      }
      const totalAvg = totalSum / frequencyData.length / 255
      energy.current += ((bassAvg * 0.7 + totalAvg * 0.3) - energy.current) * Math.min(1, delta * 3)
    } else {
      energy.current += (0.3 - energy.current) * Math.min(1, delta * 2)
    }

    // Update shader uniforms
    uniforms.uTime.value = time.current
    uniforms.uBeat.value = beatIntensity.current
    uniforms.uEnergy.value = energy.current
  })

  return (
    <mesh ref={meshRef} material={shaderMaterial} scale={[1, 1, 1]}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  )
})

export default BackgroundReactive
