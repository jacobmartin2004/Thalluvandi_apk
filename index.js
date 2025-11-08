/**
 * @format
 */
if (__DEV__) {
  console.warn = () => {};
//   console.error = () => {};
//   console.log = () => {};
}
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
