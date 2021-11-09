import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.devterm.hello",
  appName: "Hello DT",
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    cleartext: true,
  },
};

export default config;
