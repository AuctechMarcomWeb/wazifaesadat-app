import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Colors from '../../themes/colors';
import { FontFamily, FontSize } from '../../themes/typography';

const BackHeader = ({
  navigation,
  title = '',
  onBack,
  rightIcon,
  onRightPress,
}) => {
  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    if (navigation?.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.iconButton}
        activeOpacity={0.7}
        onPress={handleBack}
      >
        <MaterialCommunityIcons
          name="arrow-left"
          size={25}
          color={Colors.white}
        />
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.iconButton}
        activeOpacity={0.7}
        onPress={onRightPress}
        disabled={!rightIcon}
      >
        {rightIcon ? (
          <MaterialCommunityIcons
            name={rightIcon}
            size={23}
            color={Colors.white}
          />
        ) : null}
      </TouchableOpacity>
    </View>
  );
};

export default BackHeader;

const styles = StyleSheet.create({
  container: {
    height: 58,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semiBold,
    color: Colors.white,
  },
});
