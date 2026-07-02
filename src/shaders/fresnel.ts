// Fresnel rim glow — brightness peaks where the surface silhouettes against
// the camera, giving the core its atmospheric halo without any textures.
export const fresnelVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const fresnelFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uPower;
  uniform float uTime;

  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), uPower);
    // Slow breathing so the halo feels alive rather than static.
    float pulse = 0.85 + 0.15 * sin(uTime * 1.6);
    gl_FragColor = vec4(uColor, fresnel * uIntensity * pulse);
  }
`;
