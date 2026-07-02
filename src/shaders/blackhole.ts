// Real-time raymarched black hole. Rays are integrated through a
// pseudo-Schwarzschild field (a = -1.5 h² r̂/r⁴, the standard null-geodesic
// approximation with rs = 1), which produces genuine gravitational lensing:
// the photon ring and the accretion disk appearing above/below the shadow
// fall out of the physics rather than being painted on.
export const blackHoleVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const blackHoleFragment = /* glsl */ `
  precision highp float;

  uniform vec3 uCamPos;
  uniform mat3 uCamBasis;
  uniform float uTanHalfFov;
  uniform float uAspect;
  uniform float uTime;
  uniform float uScroll;   // smoothed 0..1 page progress
  uniform float uPulse;    // gentle light pulse
  uniform float uSteps;    // quality: max march steps
  uniform vec2 uParallax;  // small mouse offset

  varying vec2 vUv;

  #define PI 3.14159265359
  #define TWO_PI 6.28318530718
  #define HORIZON 1.0
  #define DISK_IN 3.0
  #define DISK_OUT 8.2
  #define ESCAPE_R 42.0

  // --- noise -----------------------------------------------------------
  float hash21(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
      mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.55;
    for (int i = 0; i < 5; i++) {
      v += a * vnoise(p);
      p = p * 2.1 + vec2(13.7, 7.3);
      a *= 0.5;
    }
    return v;
  }

  mat3 rotY(float a) {
    float c = cos(a), s = sin(a);
    return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c);
  }

  mat3 rotX(float a) {
    float c = cos(a), s = sin(a);
    return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c);
  }

  // Angle-periodic fbm: blends two samples across the seam so streaks tile
  float diskNoise(float r, float ang) {
    float sa = fract((ang + PI) / TWO_PI);
    const float REP = 12.0;
    vec2 a = vec2(r * 2.6 - uTime * 0.25, sa * REP);
    vec2 b = vec2(a.x, (sa - 1.0) * REP);
    return mix(fbm(a), fbm(b), smoothstep(0.85, 1.0, sa));
  }

  // Blue -> violet temperature ramp, hottest at the inner edge
  vec3 diskPalette(float t) {
    vec3 hot  = vec3(0.55, 0.78, 1.35);  // blue-white
    vec3 mid  = vec3(0.22, 0.45, 1.25);  // electric blue
    vec3 cool = vec3(0.48, 0.22, 1.05);  // violet
    return t < 0.5
      ? mix(hot, mid, t * 2.0)
      : mix(mid, cool, (t - 0.5) * 2.0);
  }

  void main() {
    vec2 ndc = vUv * 2.0 - 1.0;
    vec3 rd = normalize(uCamBasis * vec3(
      ndc.x * uTanHalfFov * uAspect,
      ndc.y * uTanHalfFov,
      -1.0
    ));
    vec3 ro = uCamPos + uCamBasis * vec3(uParallax * 0.4, 0.0);

    // World -> hole space: scroll spins the system (half a turn across the
    // page), fixed tilt sets the near-edge-on Interstellar framing.
    mat3 m = rotX(0.24) * rotY(uScroll * PI);
    ro = m * ro;
    rd = m * rd;

    vec3 pos = ro;
    vec3 vel = rd;
    vec3 hVec = cross(pos, vel);
    float h2 = dot(hVec, hVec);

    vec3 color = vec3(0.0);
    float alpha = 0.0;
    float minR = 1e5;

    for (int i = 0; i < 300; i++) {
      if (float(i) >= uSteps) break;

      float r = length(pos);
      minR = min(minR, r);

      // Adaptive step: coarse far away, fine near the photon sphere
      float dt = clamp(r * 0.055, 0.03, 0.5);

      vec3 acc = -1.5 * h2 * pos / pow(dot(pos, pos), 2.5);
      vel += acc * dt;
      vec3 next = pos + vel * dt;

      // Accretion disk lives in the y=0 plane of hole space
      if (next.y * pos.y < 0.0) {
        float t = pos.y / (pos.y - next.y);
        vec3 hit = mix(pos, next, t);
        float hr = length(hit.xz);

        if (hr > DISK_IN && hr < DISK_OUT) {
          float ang = atan(hit.z, hit.x);

          // Keplerian shear: inner material laps the outer
          float spin = uTime * 3.2 / pow(hr * 0.42, 1.5);
          float n = diskNoise(hr, ang + spin);
          n = 0.3 + 1.1 * pow(n, 1.6); // contrasty streaks

          float radial = (hr - DISK_IN) / (DISK_OUT - DISK_IN);
          float fade = smoothstep(1.0, 0.45, radial)      // outer feather
                     * smoothstep(0.0, 0.08, radial);     // inner edge snap
          float heat = 1.0 / (0.4 + radial * radial * 4.5);

          // Doppler beaming: the side rotating toward the camera flares
          vec3 tangent = normalize(vec3(-hit.z, 0.0, hit.x));
          float beam = clamp(
            pow(1.0 + 0.5 * dot(tangent, -normalize(vel)), 2.2), 0.4, 2.4);

          vec3 c = diskPalette(radial) * n * heat * beam * uPulse * 0.95;
          float a = clamp(fade * (0.22 + 0.55 * n), 0.0, 1.0);

          // Front-to-back compositing (multiple crossings = lensed images)
          color += (1.0 - alpha) * c * a;
          alpha += (1.0 - alpha) * a;
          if (alpha > 0.99) break;
        }
      }

      if (r < HORIZON) {
        // Captured: whatever transparency remains becomes the shadow
        alpha = 1.0;
        break;
      }
      if (r > ESCAPE_R && dot(pos, vel) > 0.0) break;

      pos = next;
    }

    // Faint volumetric halo hugging the photon sphere — kept tight so the
    // ring and disk edges stay crisp
    float halo = exp(-(minR - HORIZON) * 1.5) * 0.17;
    color += vec3(0.35, 0.45, 1.0) * halo * uPulse * (1.0 - alpha);
    alpha = clamp(alpha + halo * 0.3, 0.0, 1.0);

    // Filmic-ish soft rolloff keeps the disk blue/violet instead of
    // clipping to white before bloom, with a cool grade on top
    color = 1.0 - exp(-color * vec3(0.85, 0.95, 1.15));

    gl_FragColor = vec4(color, alpha);
  }
`;
