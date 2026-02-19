import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.routeit.routeit',
  appName: 'RouteIt',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    CapacitorUpdater: {
      autoUpdate: false,
      defaultChannel: 'production',
      resetWhenUpdate: true,
    },
  },
};

export default config;
