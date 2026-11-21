import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import colors from '../../themes/colors';
import typography from '../../themes/typography';
import DashboardHeader from '../../components/DashboardHeader/DashboardHeader';

const { width } = Dimensions.get('window');

const UnderDevelopmentScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* 1. Header */}

      {/* 2. Main Body Content */}
      <View style={styles.body}>
        <View style={styles.card}>
          {/* Animated / Icon Container with Glowing Background */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <MaterialIcons
                name="engineering"
                size={54}
                color={colors.primary}
              />
            </View>
            <View style={styles.badgePulse}>
              <MaterialIcons name="schedule" size={16} color={colors.gold} />
            </View>
          </View>

          {/* Title and Subtitle */}
          <Text style={[typography.heading, styles.title]}>
            Under Development
          </Text>
          <Text style={[typography.body, styles.subtitle]}>
            We are working hard to bring this feature to you very soon. Stay
            tuned for updates!
          </Text>

          {/* Status Chip */}
          <View style={styles.statusChip}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Estimated Release: Soon</Text>
          </View>

          {/* Go Back / Home Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation?.goBack()}
          >
            <MaterialIcons
              name="arrow-back"
              size={18}
              color={colors.white}
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F6F3',
  },
  body: {
    flex: 1,
    marginTop: -22,
    backgroundColor: colors.backgroundDark,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.cardColor,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  iconBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePulse: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.cardColor,
    padding: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.TitleColor,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 24,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary2,
  },
  backButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  buttonIcon: {
    marginRight: 8,
  },
});

export default UnderDevelopmentScreen;
