import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bryansoft.keygenie',
  appName: 'KeyGenie',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // 开发环境可以配置为本地服务器
    // url: 'http://localhost:3000',
    // cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0F172A',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0F172A',
    },
    // 生物识别配置由 @aparajita/capacitor-biometric-auth 处理
  },
};

export default config;

