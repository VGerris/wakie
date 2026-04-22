<h1 align="center">👀 CALarM</h1>

<p align="center">CALarM is a cross platform (Android & iOS) experimental alarm clock built in <a href="https://reactnative.dev">React Native</a>, bootstrapped with <a href="https://expo.io/">Expo</a></p>

![CALarM Mockups](./assets/screenshots/Mockup.png)

## Usage

clone the project

```bash
git clone https://github.com/VGerris/calarm.git
```

cd into directory and install dependencies

```bash
cd calarm && yarn

or

cd calarm && npm install
```

Start the expo cli

```bash
expo start
```

This will open `localhost:19002` on your default browser.

The quickest way to get started is to install the expo mobile app. After installing, open the app and scan the barcode. You should be set already.

![Expo Browser Page](./assets/screenshots/expo-cli.jpg)

If you have your emulator setup, you can start it, click on `Run on iOS simulator` / `Run on Android device`. This will launch the app on your emulator.

> You must have expo-cli installed before any of this would work

For more extensive documentation, see the [expo documentation](https://docs.expo.io/)

## Todo

- [ ] Ship v1.0 with basic alarm features
- [ ] Add dark mode 😍

![Prototype](./assets/screenshots/wakie-prototype.gif)

## Issues

- If you discover any issues, please create a PR with a fix or an explanation of the issue.

## Expo upgrade

yarn global add @expo/cli

npx expo upgrade

## Update yarn

corepack use yarn@4.9.4

## Running mobile 

npx expo run:ios
npx expo run:android

### Clean mobile and rebuild

// rm -rf android ios
npx expo prebuild --clean

## Thorough clean

rm -rf node_modules yarn.lock android ios .expo
yarn install
