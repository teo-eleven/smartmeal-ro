/**
 * A font file bundled by Metro: a number on the phones. Jest maps it to a stub, so the web
 * value is proven by e2e/titleFont.spec.ts, which checks the browser really loaded the face.
 */
declare module '*.ttf' {
  const asset: number;
  export default asset;
}
