// import React from 'react';
// import { StatusBar, StyleSheet } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';

// const AppLayout = ({ children }) => {
//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar backgroundColor="#087A43" barStyle="light-content" />
//       {children}
//     </SafeAreaView>
//   );
// };

// export default AppLayout;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#087A43',
//   },
// });

import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AppLayout = ({ children }) => {
  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <StatusBar backgroundColor="#087A43" barStyle="light-content" />

      {children}
    </SafeAreaView>
  );
};

export default AppLayout;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#087A43',
  },
});
