import type { Config } from '@react-router/dev/config';

/**
 * Minimal React Router dev config.
 * Ensure `build.prerender` is an array (empty while debugging).
 */
const config: Config = {
  appDirectory: './src/app',
  ssr: true,
  build: {
    prerender: []
  }
};

export default config;
