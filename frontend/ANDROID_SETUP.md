# Android 项目设置指南

## 初始化步骤

### 1. 安装依赖

```bash
cd frontend
npm install
```

### 2. 构建 Web 应用

```bash
npm run build
```

### 3. 初始化 Capacitor（如果尚未初始化）

```bash
npx cap init
```

当提示时，输入：
- App name: `KeyGenie`
- App ID: `com.bryansoft.keygenie`
- Web dir: `dist`

### 4. 添加 Android 平台

```bash
npx cap add android
```

### 5. 同步 Web 资源到 Android 项目

```bash
npx cap sync android
```

### 6. 打开 Android Studio

```bash
npx cap open android
```

## Android 项目配置

### AndroidManifest.xml 配置

在 `android/app/src/main/AndroidManifest.xml` 中添加以下权限和配置：

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- 网络权限 -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- 生物识别权限 -->
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />
    <uses-permission android:name="android.permission.USE_FINGERPRINT" />
    
    <!-- 允许 HTTP 流量（仅开发环境） -->
    <application
        android:usesCleartextTraffic="true"
        ...>
        
        <!-- 允許的網域：請替換成你的 API 主機（與 .env 中 VITE_API_URL 對應） -->
        <domain-config cleartextTrafficPermitted="true">
            <domain includeSubdomains="true">your-api.example.com</domain>
        </domain-config>
        
        <!-- 主 Activity -->
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:theme="@style/AppTheme"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

### build.gradle 配置

在 `android/app/build.gradle` 中确保以下配置：

```gradle
android {
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "com.bryansoft.keygenie"
        minSdkVersion 24  // 支持 Android 7.0+
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
    
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

## 构建 APK

### 调试版本

在 Android Studio 中：
1. 选择 `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`
2. 等待构建完成
3. APK 文件位于 `android/app/build/outputs/apk/debug/app-debug.apk`

### 发布版本

1. 生成签名密钥（如果还没有）：
```bash
keytool -genkey -v -keystore keygenie-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias keygenie
```

2. 在 `android/app/build.gradle` 中配置签名：
```gradle
android {
    signingConfigs {
        release {
            storeFile file('path/to/keygenie-release-key.jks')
            storePassword 'your-store-password'
            keyAlias 'keygenie'
            keyPassword 'your-key-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
        }
    }
}
```

3. 构建发布版本：
```bash
cd android
./gradlew assembleRelease
```

## 常用命令

- `npm run cap:sync` - 同步 Web 资源到 Android
- `npm run cap:open:android` - 在 Android Studio 中打开项目
- `npm run cap:build:android` - 构建并同步 Android 项目

## 注意事项

1. 确保 Android SDK 已正确安装
2. 确保 Java JDK 版本为 11 或更高
3. 首次运行前需要同步 Web 资源：`npx cap sync android`
4. 每次修改 Web 代码后，需要重新构建并同步：
   ```bash
   npm run build
   npx cap sync android
   ```

