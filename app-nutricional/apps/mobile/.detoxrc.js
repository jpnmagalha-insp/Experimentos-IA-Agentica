/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      // Run 'expo prebuild --platform android' before building
      build:
        'npx expo prebuild --platform android --no-install && cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [3000, 8081],
    },
    'ios.debug': {
      type: 'ios.app',
      // Adjust path after running 'expo prebuild --platform ios'
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/nutri-ia.app',
      build:
        'npx expo prebuild --platform ios --no-install && xcodebuild -workspace ios/nutri-ia.xcworkspace -scheme nutri-ia -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: { type: 'iPhone 15' },
    },
    emulator: {
      type: 'android.emulator',
      device: { avdName: 'Pixel_4_API_30' },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
  },
}
