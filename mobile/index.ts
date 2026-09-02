import { registerGlobals } from '@livekit/react-native';
import { registerRootComponent } from 'expo';

import App from './App';

// Must run before any LiveKit/WebRTC API is touched — sets up the
// navigator.mediaDevices/RTCPeerConnection globals the native module provides.
registerGlobals();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
