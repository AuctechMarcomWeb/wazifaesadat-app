import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';

import { useSelector, useDispatch } from 'react-redux';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'react-native-image-picker';

import AppLayout from '../../../components/AppLayout/AppLayout';
import BackHeader from '../../../components/BackHeader/BackHeader';
import BottomNav from '../../../components/BottomNav/BottomNav';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import Colors from '../../../themes/colors';
import { FontFamily, FontSize } from '../../../themes/typography';

import {
  updateUserById,
  updatePassword,
  getProfile,
  uploadImage,
} from '../../../api/auth';
import { setUser } from '../../../redux/slice/userSlice';

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

const FormField = ({
  label,
  icon,
  value,
  field,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  editable = true,
  onChangeText,
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>

    <View
      style={[
        styles.inputWrapper,
        multiline && styles.multilineWrapper,
        !editable && styles.disabledInput,
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={20}
        color={Colors.primary}
        style={styles.inputIcon}
      />

      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.placeHolderColor}
        keyboardType={keyboardType}
        multiline={multiline}
        editable={editable}
        textAlignVertical={multiline ? 'top' : 'center'}
        autoCapitalize={field === 'Email' ? 'none' : 'words'}
      />

      {!editable && (
        <MaterialCommunityIcons
          name="lock-outline"
          size={18}
          color={Colors.placeHolderColor}
        />
      )}
    </View>
  </View>
);

const EditProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const userState = useSelector(state => state.user);
  const { loginData, profile, associateDetails } = useSelector(
    state => state.user,
  );

  const currentUserObj =
    userState?.user && typeof userState.user === 'object'
      ? userState.user
      : profile && typeof profile === 'object'
      ? profile
      : loginData && typeof loginData === 'object'
      ? loginData
      : {};

  const userId =
    currentUserObj?._id ||
    currentUserObj?.id ||
    profile?._id ||
    profile?.id ||
    loginData?._id ||
    loginData?.id;

  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(false);

  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const [imageSourceModal, setImageSourceModal] = useState(false);

  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [form, setForm] = useState({
    FullName: '',
    Email: '',
    MobileNo: '',
    Gender: '',
    Designation: '',
    Address: '',
  });

  const handleTabPress = key => {
    if (key === 'EditProfile') return;
    navigation?.navigate(key);
  };

  useEffect(() => {
    let isActive = true;

    const loadProfileData = async () => {
      try {
        setFetchingProfile(true);
        const result = await getProfile();
        const userData = result?.data?.user || result?.user;

        if (isActive && result?.success && userData) {
          setImageError(false);
          setForm({
            FullName: userData.name || userData.FullName || '',
            Email: userData.email || userData.Email || '',
            MobileNo:
              userData.phone || userData.MobileNo || userData.Phone || '',
            Gender: userData.gender || userData.Gender || '',
            Designation: userData.designation || userData.Designation || '',
            Address: userData.address || userData.Address || '',
          });

          if (userData.profilePic) {
            setProfilePicUrl(userData.profilePic);
          }

          dispatch(setUser(userData));
        } else if (isActive) {
          applyFallbackData();
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        if (isActive) {
          applyFallbackData();
        }
      } finally {
        if (isActive) {
          setFetchingProfile(false);
        }
      }
    };

    const applyFallbackData = () => {
      setForm({
        FullName:
          profile?.name ||
          profile?.FullName ||
          associateDetails?.FullName ||
          loginData?.Name ||
          '',
        Email:
          profile?.email ||
          profile?.Email ||
          associateDetails?.Email ||
          loginData?.Email ||
          '',
        MobileNo:
          profile?.phone ||
          profile?.MobileNo ||
          profile?.Phone ||
          associateDetails?.MobileNo ||
          loginData?.MobileNo ||
          loginData?.Phone ||
          '',
        Gender: profile?.gender || profile?.Gender || loginData?.gender || '',
        Designation:
          associateDetails?.Designation ||
          profile?.designation ||
          profile?.Designation ||
          loginData?.Designation ||
          '',
        Address:
          profile?.address ||
          profile?.Address ||
          associateDetails?.Address ||
          loginData?.Address ||
          '',
      });

      const fallbackPic =
        profile?.profilePic ||
        profile?.ProfilePhoto ||
        associateDetails?.ProfilePhoto ||
        loginData?.profilePic ||
        loginData?.ProfilePhoto;

      if (fallbackPic) {
        setProfilePicUrl(fallbackPic);
      }
    };

    loadProfileData();

    return () => {
      isActive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const updateField = (key, value) => {
    setForm(previous => ({
      ...previous,
      [key]: value,
    }));
  };

  const validateForm = () => {
    if (!form.FullName.trim()) {
      Alert.alert('Validation', 'Please enter your full name.');
      return false;
    }

    if (!form.Email.trim()) {
      Alert.alert('Validation', 'Please enter your email address.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.Email.trim())) {
      Alert.alert('Validation', 'Please enter a valid email address.');
      return false;
    }

    if (form.MobileNo.trim() && !/^\d{10}$/.test(form.MobileNo.trim())) {
      Alert.alert('Validation', 'Mobile number must be 10 digits.');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    if (!userId) {
      Alert.alert('Error', 'User ID not found. Please login again.');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: form.FullName.trim(),
        FullName: form.FullName.trim(),
        email: form.Email.trim(),
        Email: form.Email.trim(),
        phone: form.MobileNo.trim(),
        MobileNo: form.MobileNo.trim(),
        gender: form.Gender || undefined,
        designation: form.Designation.trim(),
        Designation: form.Designation.trim(),
        address: form.Address.trim(),
        Address: form.Address.trim(),
      };

      if (profilePicUrl) {
        payload.profilePic = profilePicUrl;
      }

      const result = await updateUserById(userId, payload);

      if (result?.success) {
        const updatedServerUser = result?.data?.user || result?.user || {};
        dispatch(
          setUser({
            ...currentUserObj,
            ...payload,
            ...updatedServerUser,
          }),
        );

        Alert.alert('Success', 'Your profile has been updated successfully.', [
          {
            text: 'OK',
            onPress: () => navigation?.goBack(),
          },
        ]);
      } else {
        Alert.alert('Error', result?.message || 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', error?.message || 'Unable to update your profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword.trim()) {
      Alert.alert('Validation', 'Please enter your current password');
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert('Validation', 'Please enter your new password');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Validation', 'Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        'Validation',
        'New password and confirm password do not match',
      );
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'User ID not found. Please login again.');
      return;
    }

    try {
      setPasswordLoading(true);
      const result = await updatePassword(userId, currentPassword, newPassword);

      if (result?.success) {
        Alert.alert('Success', 'Password changed successfully', [
          {
            text: 'OK',
            onPress: () => {
              setChangePasswordModal(false);
              setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
              });
            },
          },
        ]);
      } else {
        Alert.alert('Error', result?.message || 'Failed to change password');
      }
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const pickFromCamera = () => {
    setImageSourceModal(false);
    ImagePicker.launchCamera(
      {
        mediaType: 'photo',
        maxWidth: 600,
        maxHeight: 600,
        quality: 0.85,
      },
      async response => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Error', `Camera error: ${response.errorMessage}`);
          return;
        }
        if (response.assets?.length > 0) {
          await uploadProfilePicture(response.assets[0]);
        }
      },
    );
  };

  const pickFromGallery = () => {
    setImageSourceModal(false);
    ImagePicker.launchImageLibrary(
      {
        mediaType: 'photo',
        maxWidth: 600,
        maxHeight: 600,
        quality: 0.85,
      },
      async response => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Error', `Gallery error: ${response.errorMessage}`);
          return;
        }
        if (response.assets?.length > 0) {
          await uploadProfilePicture(response.assets[0]);
        }
      },
    );
  };

  const uploadProfilePicture = async file => {
    try {
      setUploadingImage(true);
      const result = await uploadImage({
        uri: file.uri,
        type: file.type,
        name: file.fileName || file.filename || `profile-${Date.now()}.jpg`,
      });

      const uploadedUrl =
        result?.imageUrl || result?.url || result?.data?.imageUrl;

      if (result?.success && uploadedUrl) {
        setImageError(false);
        setProfilePicUrl(uploadedUrl);
        Alert.alert('Success', 'Profile picture updated');
      } else {
        Alert.alert('Error', result?.message || 'Failed to upload image');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error?.message || 'Failed to upload profile picture',
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const rawPhoto =
    profilePicUrl ||
    associateDetails?.ProfilePhoto ||
    profile?.ProfilePhoto ||
    profile?.profilePic ||
    loginData?.ProfilePhoto ||
    loginData?.profilePic;

  let resolvedPhoto = null;
  if (typeof rawPhoto === 'string' && rawPhoto.trim()) {
    resolvedPhoto =
      rawPhoto.startsWith('http') || rawPhoto.startsWith('data:image')
        ? rawPhoto
        : `https://crm.spstates.com/${rawPhoto
            .replace(/^(\.\.\/)+/, '')
            .replace(/^\/+/, '')
            .split(' ')
            .join('%20')}`;
  }

  const displayName =
    form.FullName || currentUserObj?.name || currentUserObj?.userId || 'Member';
  const displayRole =
    currentUserObj?.role || userState?.role || loginData?.role || '';

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Edit Profile"
          onBack={() => navigation?.goBack()}
        />

        {fetchingProfile && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading your profile...</Text>
            </View>
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Photo Card */}
          <View style={styles.photoCard}>
            <TouchableOpacity
              style={styles.avatarWrapper}
              activeOpacity={0.85}
              onPress={() => setImageSourceModal(true)}
              disabled={uploadingImage}
            >
              {resolvedPhoto && !imageError ? (
                <Image
                  source={{ uri: resolvedPhoto }}
                  style={styles.avatar}
                  resizeMode="cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <MaterialCommunityIcons
                  name="account"
                  size={wp('15%')}
                  color={Colors.primary}
                />
              )}

              <View style={styles.cameraButton}>
                {uploadingImage ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <MaterialCommunityIcons
                    name="camera"
                    size={16}
                    color={Colors.white}
                  />
                )}
              </View>
            </TouchableOpacity>

            <Text style={styles.photoName} numberOfLines={1}>
              {displayName}
            </Text>

            {displayRole ? (
              <View style={styles.rolePill}>
                <Text style={styles.rolePillText}>{displayRole}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.changePhotoChip}
              onPress={() => setImageSourceModal(true)}
              disabled={uploadingImage}
            >
              <MaterialCommunityIcons
                name="image-edit-outline"
                size={15}
                color={Colors.primary}
              />
              <Text style={styles.changePhotoChipText}>
                {uploadingImage ? 'Uploading...' : 'Change Photo'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Basic Details Card */}
          <View style={styles.formCard}>
            <View style={styles.sectionHeading}>
              <MaterialCommunityIcons
                name="account-edit-outline"
                size={21}
                color={Colors.primary}
              />
              <Text style={styles.sectionTitle}>Basic Details</Text>
            </View>

            <FormField
              label="Full Name"
              icon="account-outline"
              field="FullName"
              value={form.FullName}
              placeholder="Enter your full name"
              onChangeText={text => updateField('FullName', text)}
            />

            <FormField
              label="Email Address"
              icon="email-outline"
              field="Email"
              value={form.Email}
              placeholder="Enter your email"
              keyboardType="email-address"
              onChangeText={text => updateField('Email', text)}
            />

            <FormField
              label="Mobile Number"
              icon="phone-outline"
              field="MobileNo"
              value={form.MobileNo}
              placeholder="Enter 10 digit mobile number"
              keyboardType="phone-pad"
              onChangeText={text => updateField('MobileNo', text)}
            />

            {/* Gender Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderRow}>
                {GENDER_OPTIONS.map(option => {
                  const selected =
                    form.Gender?.toLowerCase() === option.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={option}
                      activeOpacity={0.8}
                      style={[
                        styles.genderChip,
                        selected && styles.genderChipActive,
                      ]}
                      onPress={() => updateField('Gender', option)}
                    >
                      <Text
                        style={[
                          styles.genderChipText,
                          selected && styles.genderChipTextActive,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* <FormField
              label="Designation"
              icon="badge-account-outline"
              field="Designation"
              value={form.Designation}
              placeholder="Enter designation"
              onChangeText={text => updateField('Designation', text)}
            /> */}
{/* 
            <FormField
              label="Address"
              icon="map-marker-outline"
              field="Address"
              value={form.Address}
              placeholder="Enter your complete address"
              multiline
              onChangeText={text => updateField('Address', text)}
            /> */}
          </View>

          {/* Primary Actions */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.saveButton, loading && styles.disabledButton]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <MaterialCommunityIcons
                name="content-save-outline"
                size={20}
                color={Colors.white}
              />
            )}
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving Changes...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.changePasswordButton}
            onPress={() => setChangePasswordModal(true)}
          >
            <MaterialCommunityIcons
              name="lock-reset"
              size={20}
              color={Colors.primary}
            />
            <Text style={styles.changePasswordButtonText}>Change Password</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.cancelButton}
            onPress={() => navigation?.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Image Source Selection Modal */}
        <Modal
          visible={imageSourceModal}
          transparent
          animationType="fade"
          onRequestClose={() => setImageSourceModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setImageSourceModal(false)}
          >
            <View
              style={styles.imageSourceModal}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.sheetHandle} />
              <Text style={styles.imageSourceTitle}>Update Profile Photo</Text>

              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.imageSourceButton}
                onPress={pickFromCamera}
              >
                <View style={styles.sheetIconCircle}>
                  <MaterialCommunityIcons
                    name="camera"
                    size={22}
                    color={Colors.primary}
                  />
                </View>
                <Text style={styles.imageSourceButtonText}>Take Photo</Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.imageSourceButton}
                onPress={pickFromGallery}
              >
                <View style={styles.sheetIconCircle}>
                  <MaterialCommunityIcons
                    name="image-multiple"
                    size={22}
                    color={Colors.primary}
                  />
                </View>
                <Text style={styles.imageSourceButtonText}>
                  Choose from Gallery
                </Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.imageSourceCancel}
                onPress={() => setImageSourceModal(false)}
              >
                <Text style={styles.imageSourceCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Change Password Modal */}
        <Modal
          visible={changePasswordModal}
          transparent
          animationType="slide"
          onRequestClose={() => setChangePasswordModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setChangePasswordModal(false)}
          >
            <View
              style={styles.passwordModalContent}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.sheetHandle} />

              <View style={styles.passwordModalHeader}>
                <Text style={styles.passwordModalTitle}>Change Password</Text>
                <View style={styles.headerRightActions}>
                  <TouchableOpacity
                    onPress={() => setShowPasswords(prev => !prev)}
                    style={styles.eyeToggleBtn}
                  >
                    <MaterialCommunityIcons
                      name={showPasswords ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={Colors.primary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setChangePasswordModal(false)}
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={24}
                      color={Colors.textSecondary || Colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.passwordFormCard}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Current Password</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons
                      name="lock-outline"
                      size={20}
                      color={Colors.primary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      value={passwordForm.currentPassword}
                      onChangeText={text =>
                        setPasswordForm(prev => ({
                          ...prev,
                          currentPassword: text,
                        }))
                      }
                      placeholder="Enter current password"
                      placeholderTextColor={Colors.placeHolderColor}
                      secureTextEntry={!showPasswords}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>New Password</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons
                      name="lock-plus-outline"
                      size={20}
                      color={Colors.primary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      value={passwordForm.newPassword}
                      onChangeText={text =>
                        setPasswordForm(prev => ({
                          ...prev,
                          newPassword: text,
                        }))
                      }
                      placeholder="Minimum 6 characters"
                      placeholderTextColor={Colors.placeHolderColor}
                      secureTextEntry={!showPasswords}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons
                      name="lock-check-outline"
                      size={20}
                      color={Colors.primary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      value={passwordForm.confirmPassword}
                      onChangeText={text =>
                        setPasswordForm(prev => ({
                          ...prev,
                          confirmPassword: text,
                        }))
                      }
                      placeholder="Re-enter new password"
                      placeholderTextColor={Colors.placeHolderColor}
                      secureTextEntry={!showPasswords}
                    />
                  </View>
                </View>

                <View style={styles.passwordModalActions}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[
                      styles.passwordUpdateButton,
                      passwordLoading && styles.disabledButton,
                    ]}
                    onPress={handleChangePassword}
                    disabled={passwordLoading}
                  >
                    <Text style={styles.passwordUpdateButtonText}>
                      {passwordLoading ? 'Updating...' : 'Update Password'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.passwordCancelButton}
                    onPress={() => setChangePasswordModal(false)}
                  >
                    <Text style={styles.passwordCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        <BottomNav active="EditProfile" onPress={handleTabPress} />
      </View>
    </AppLayout>
  );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F1F6F3',
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: wp('4%'),
    paddingTop: hp('1.8%'),
    paddingBottom: hp('3.5%'),
  },

  photoCard: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: hp('2.4%'),
    paddingHorizontal: wp('4%'),
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    marginBottom: hp('1.8%'),
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },

  avatarWrapper: {
    width: wp('24%'),
    height: wp('24%'),
    borderRadius: wp('12%'),
    backgroundColor: Colors.primaryLight || Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: Colors.primary,
  },

  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: wp('12%'),
  },

  cameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: wp('7.8%'),
    height: wp('7.8%'),
    borderRadius: wp('3.9%'),
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },

  photoName: {
    fontSize: FontSize.lg || FontSize.md,
    fontFamily: FontFamily.bold,
    color: Colors.TitleColor,
    marginTop: hp('1.2%'),
  },

  rolePill: {
    marginTop: 4,
    backgroundColor: Colors.primaryLight || Colors.primaryBg,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 999,
  },

  rolePillText: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
  },

  changePhotoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: hp('1.2%'),
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },

  changePhotoChipText: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
  },

  formCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    padding: wp('4%'),
    marginBottom: hp('1.8%'),
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },

  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.8%'),
    paddingBottom: hp('1%'),
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.border,
    gap: wp('2%'),
  },

  sectionTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: Colors.TitleColor,
  },

  inputGroup: {
    marginBottom: hp('1.8%'),
  },

  label: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: Colors.TitleColor,
    marginBottom: hp('0.7%'),
  },

  inputWrapper: {
    width: '100%',
    minHeight: hp('6%'),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryBg || '#F8FAF9',
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: 12,
    paddingHorizontal: wp('3%'),
  },

  inputIcon: {
    marginRight: wp('2.5%'),
  },

  input: {
    flex: 1,
    minHeight: hp('5.8%'),
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textPrimary || Colors.TitleColor,
    paddingVertical: hp('0.9%'),
  },

  multilineWrapper: {
    minHeight: hp('11.5%'),
    alignItems: 'flex-start',
    paddingTop: hp('1%'),
  },

  multilineInput: {
    minHeight: hp('9%'),
  },

  disabledInput: {
    opacity: 0.65,
  },

  genderRow: {
    flexDirection: 'row',
    gap: wp('2.5%'),
  },

  genderChip: {
    flex: 1,
    paddingVertical: hp('1.1%'),
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    backgroundColor: Colors.primaryBg || '#F8FAF9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  genderChipActive: {
    backgroundColor: Colors.primaryLight || Colors.primaryBg,
    borderColor: Colors.primary,
  },

  genderChipText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary || Colors.textMuted,
  },

  genderChipTextActive: {
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
  },

  saveButton: {
    width: '100%',
    minHeight: hp('6.2%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    gap: wp('2%'),
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  saveButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semiBold,
    color: Colors.white,
  },

  changePasswordButton: {
    width: '100%',
    minHeight: hp('6%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    gap: wp('2%'),
    marginTop: hp('1.2%'),
  },

  changePasswordButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
  },

  disabledButton: {
    opacity: 0.6,
  },

  cancelButton: {
    width: '100%',
    minHeight: hp('5.5%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp('0.8%'),
  },

  cancelButtonText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: Colors.textSecondary || Colors.textMuted,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },

  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.neutral.border,
    alignSelf: 'center',
    marginBottom: hp('1.2%'),
  },

  passwordModalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: wp('4%'),
    paddingTop: hp('1.4%'),
    paddingBottom: hp('3%'),
    maxHeight: '85%',
  },

  passwordModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1.6%'),
    paddingBottom: hp('1.2%'),
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.border,
  },

  passwordModalTitle: {
    fontSize: FontSize.lg || FontSize.md,
    fontFamily: FontFamily.bold,
    color: Colors.TitleColor,
  },

  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  eyeToggleBtn: {
    padding: 4,
  },

  passwordFormCard: {
    backgroundColor: Colors.primaryBg || '#F8FAF9',
    borderRadius: 14,
    padding: wp('3.5%'),
  },

  passwordModalActions: {
    marginTop: hp('1.2%'),
    gap: wp('2%'),
  },

  passwordUpdateButton: {
    width: '100%',
    minHeight: hp('5.8%'),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },

  passwordUpdateButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semiBold,
    color: Colors.white,
  },

  passwordCancelButton: {
    width: '100%',
    minHeight: hp('5.5%'),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
  },

  passwordCancelButtonText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: Colors.textSecondary || Colors.textMuted,
  },

  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },

  loadingCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: hp('2.8%'),
    paddingHorizontal: wp('7%'),
    alignItems: 'center',
    elevation: 4,
  },

  loadingText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: Colors.TitleColor,
    marginTop: hp('1.2%'),
    textAlign: 'center',
  },

  imageSourceModal: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: wp('4%'),
    paddingTop: hp('1.4%'),
    paddingBottom: hp('3%'),
    gap: hp('1.2%'),
  },

  imageSourceTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: Colors.TitleColor,
    marginBottom: hp('0.6%'),
    textAlign: 'center',
  },

  sheetIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryLight || Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  imageSourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryBg || '#F8FAF9',
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: 12,
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1.2%'),
    gap: wp('3%'),
  },

  imageSourceButtonText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: Colors.TitleColor,
    flex: 1,
  },

  imageSourceCancel: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1.2%'),
    marginTop: hp('0.2%'),
  },

  imageSourceCancelText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: Colors.textSecondary || Colors.textMuted,
  },
});
