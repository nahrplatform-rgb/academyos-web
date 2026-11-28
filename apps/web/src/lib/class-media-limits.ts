export const classMediaLimits = {
  sourceBytes: 40_000_000,
  sourcePixels: 24_000_000,
  sourceAxis: 8192,
  storedBytes: 10_000_000,
  hostedPartBytes: 4_000_000,
  mainAxis: 2560,
  thumbnailAxis: 384,
  thumbnailBytes: 262_144,
  batchFiles: 10,
  concurrentDecoders: 1,
} as const;
