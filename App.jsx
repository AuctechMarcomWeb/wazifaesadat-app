import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import store from './src/redux/store';
import RootNavigation from './src/navigation/RootNavigation';

function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#1B5E3F" />
        <RootNavigation />
      </SafeAreaProvider>
    </Provider>
  );
}

export default App;
