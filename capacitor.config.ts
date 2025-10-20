import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cedricroberge.sweatstreak',
  appName: 'SweatStreak',
  webDir: 'out', // ✅ use the Next.js static export folder
  bundledWebRuntime: false, // ✅ helps prevent runtime issues
};

export default config;
