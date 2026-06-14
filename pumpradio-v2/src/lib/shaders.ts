/**
 * GLSL Shader strings for PumpRadio v2 visualizers.
 * Each shader is either a vertex + fragment pair or a standalone fragment shader.
 */

// ─── Spectrum Bars ───────────────────────────────────────────────────────────
// Vertical bars shader — gradient from primary to secondary color, pulse on beat

export const spectrumBars = {
  name: 'spectrumBars' as const,
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uBars[64];
    uniform float uBeat;
    uniform vec3 uPrimary;
    uniform vec3 uSecondary;
    uniform float uTime;

    varying vec2 vUv;

    void main() {
      float barCount = 64.0;
      float barWidth = 1.0 / barCount;
      float barIndex = floor(vUv.x / barWidth);
      float barHeight = uBars[int(barIndex)];

      float y = vUv.y;
      float barAlpha = step(1.0 - barHeight, y);

      // Gradient from primary (bottom) to secondary (top)
      vec3 color = mix(uPrimary, uSecondary, y);

      // Beat pulse: brighten on beat
      float pulse = 1.0 + uBeat * 0.5;
      color *= pulse;

      // Glow effect — fade edges of each bar
      float xPos = mod(vUv.x, barWidth) / barWidth;
      float glow = smoothstep(0.0, 0.3, xPos) * (1.0 - smoothstep(0.7, 1.0, xPos));
      color *= 0.7 + 0.3 * glow;

      // Horizontal smoothing between adjacent bars
      float neighborAvg = (
        uBars[int(max(barIndex - 1.0, 0.0))] +
        uBars[int(barIndex)] +
        uBars[int(min(barIndex + 1.0, barCount - 1.0))]
      ) / 3.0;
      float smoothHeight = mix(barHeight, neighborAvg, 0.15);
      float smoothAlpha = step(1.0 - smoothHeight, y);

      float finalAlpha = max(barAlpha, smoothAlpha * 0.3);
      gl_FragColor = vec4(color, finalAlpha);
    }
  `,
}

// ─── VU Meter ────────────────────────────────────────────────────────────────
// Circular glow meter — pulsing ring with radial gradient

export const vuMeter = {
  name: 'vuMeter' as const,
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uLevel;
    uniform float uBeat;
    uniform vec3 uPrimary;
    uniform vec3 uSecondary;
    uniform float uTime;

    varying vec2 vUv;

    void main() {
      // Center the coordinate system
      vec2 center = vUv - 0.5;
      float dist = length(center);

      // Circular ring parameters
      float radius = 0.4;
      float ringWidth = 0.06;
      float ringOuter = radius + ringWidth;
      float ringInner = radius - ringWidth;

      // Level fills the ring from bottom (6 o'clock) clockwise
      float angle = atan(center.y, center.x);
      float normalizedAngle = (angle + 3.14159) / (2.0 * 3.14159);
      float filled = step(normalizedAngle, uLevel);

      // Ring mask
      float ring = smoothstep(ringOuter, radius, dist) * (1.0 - smoothstep(radius, ringInner, dist));

      // Glow around the ring
      float glow = exp(-dist * 8.0) * 0.3;

      // Color: primary hue, brighten with level
      vec3 color = mix(uSecondary, uPrimary, uLevel);
      float intensity = 0.6 + 0.4 * uLevel;

      // Beat flash
      float flash = 1.0 + uBeat * 0.8;
      color *= flash;

      // Composite: ring + glow
      float alpha = max(ring * filled * intensity, glow);
      gl_FragColor = vec4(color, alpha);
    }
  `,
}

// ─── Particle Field ──────────────────────────────────────────────────────────
// Spark particles reacting to audio — point sprite vertex/fragment

export const particleField = {
  name: 'particleField' as const,
  vertexShader: `
    uniform float uTime;
    uniform float uBeat;
    uniform float uEnergy;
    uniform vec3 uPrimary;

    attribute float aSize;
    attribute vec3 aVelocity;
    attribute float aPhase;

    varying float vAlpha;

    void main() {
      vec3 pos = position;

      // Orbital drift
      float t = uTime * 0.2 + aPhase;
      pos.x += sin(t) * 0.3;
      pos.y += cos(t * 0.7) * 0.3;
      pos.z += sin(t * 1.3) * 0.2;

      // Beat impulse — particles burst outward
      float impulse = 1.0 + uBeat * 2.0;
      pos += aVelocity * impulse * 0.1;

      // Energy scale — particles swell with volume
      float scale = 0.5 + uEnergy * 1.5;
      float size = aSize * scale;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = size * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;

      // Alpha: fade based on energy and distance from center
      float dist = length(pos);
      vAlpha = (1.0 - smoothstep(0.0, 2.0, dist)) * (0.3 + 0.7 * uEnergy);
    }
  `,
  fragmentShader: `
    uniform vec3 uPrimary;
    uniform vec3 uSecondary;
    uniform float uBeat;

    varying float vAlpha;

    void main() {
      // Circular point sprite with soft edge
      vec2 center = gl_PointCoord - 0.5;
      float dist = length(center);
      if (dist > 0.5) discard;

      float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;

      // Hot center, cool edges
      vec3 color = mix(uSecondary, uPrimary, 1.0 - dist * 2.0);

      // Beat flash
      color *= 1.0 + uBeat * 0.6;

      gl_FragColor = vec4(color, alpha);
    }
  `,
}

// ─── Background Reactive ─────────────────────────────────────────────────────
// Fullscreen gradient that pulses with audio

export const backgroundReactive = {
  name: 'backgroundReactive' as const,
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform float uBeat;
    uniform float uEnergy;
    uniform vec3 uPrimary;
    uniform vec3 uSecondary;
    uniform vec3 uAccent;

    varying vec2 vUv;

    void main() {
      // Slow organic movement
      vec2 uv = vUv;
      float wave1 = sin(uv.x * 3.0 + uTime * 0.2) * 0.1;
      float wave2 = cos(uv.y * 4.0 + uTime * 0.15) * 0.1;
      float wave3 = sin((uv.x + uv.y) * 5.0 + uTime * 0.3) * 0.05;
      float distortion = wave1 + wave2 + wave3;

      // Radial gradient from primary center to secondary edges
      vec2 center = uv - 0.5;
      float dist = length(center) + distortion;
      vec3 color = mix(uPrimary, uSecondary, dist * 1.2);

      // Energy pulse — brightens center on beat
      float pulse = 1.0 + uBeat * 0.4 * (1.0 - dist);
      color *= pulse;

      // Accent swirls
      float swirl = sin(uv.x * 10.0 + uv.y * 8.0 + uTime * 0.1 + uBeat * 3.0) * 0.5 + 0.5;
      color += uAccent * swirl * 0.08 * (1.0 - dist);

      // Energy glow ring
      float ring = exp(-abs(dist - 0.3) * 20.0) * uEnergy * 0.3;
      color += uPrimary * ring;

      // Subtle vignette
      float vignette = 1.0 - dist * 0.5;
      color *= vignette;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
}

// Shader lookup by name
export const shaders = {
  spectrumBars,
  vuMeter,
  particleField,
  backgroundReactive,
} as const

export type ShaderKey = keyof typeof shaders
