import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';

import colors from '../../../../themes/colors';

// Import all 4 screens
import PostsScreen from '../PostsScreen/PostsScreen';
import BlogsScreen from '../BlogsScreen/BlogsScreen';
import JobsScreen from '../JobsScreen/JobsScreen';
import AppealsScreen from '../AppealsScreen/AppealsScreen';

const MainCommunityScreen = ({ navigation }) => {
  // State to manage active screen tab
  const [currentTab, setCurrentTab] = useState('Posts');

  const renderActiveScreen = () => {
    switch (currentTab) {
      case 'Posts':
        return (
          <PostsScreen navigation={navigation} onTabChange={setCurrentTab} />
        );
      case 'Blogs':
        return (
          <BlogsScreen navigation={navigation} onTabChange={setCurrentTab} />
        );
      case 'Jobs':
        return (
          <JobsScreen navigation={navigation} onTabChange={setCurrentTab} />
        );
      case 'Appeals':
        return (
          <AppealsScreen navigation={navigation} onTabChange={setCurrentTab} />
        );
      default:
        return (
          <PostsScreen navigation={navigation} onTabChange={setCurrentTab} />
        );
    }
  };

  return <View style={styles.container}>{renderActiveScreen()}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
});

export default MainCommunityScreen;
