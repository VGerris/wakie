//const { withAppBuildGradle } = require('@expo/config-plugins');    
//import { ExpoConfig, ConfigContext, ConfigPlugin } from 'expo/config-plugins';


const { withGradleProperties } = require('@expo/config-plugins');
// import { withGradleProperties } from '@expo/config-plugins'

module.exports = (config) => {
  const newGraddleProperties = [
    {
      type: 'property',
      key: 'org.gradle.java.home',
      value: '/opt/homebrew/Cellar/openjdk@17/17.0.18/libexec/openjdk.jdk/Contents/Home'
    },
    // Added this to demostrate multiple gradle properties change
    // {
    //   type: 'property',
    //   key: 'FLIPPER_VERSION',
    //  value: '0.144.0', // Fix app names with accented and diacritics characters
    // },
  ];

  return withGradleProperties(config, (config) => {
    newGraddleProperties.map((gradleProperty) => config.modResults.push(gradleProperty));

    return config;
  });
};
