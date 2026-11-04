/** A font file bundled by Metro; expo-font takes the asset reference it resolves to. */
declare module '*.ttf' {
  const asset: number;
  export default asset;
}
