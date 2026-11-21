import React, { useState, useEffect } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import colors from '../../../themes/colors';
import { FontFamily, FontSize } from '../../../themes/typography';

import AppLayout from '../../../components/AppLayout/AppLayout';
import BackHeader from '../../../components/BackHeader/BackHeader';
import {
  getExecutiveMembers,
  getOfficeBearers,
  getLocalSecretaries,
  uploadImage,
  sendMessage,
} from '../../../api/communication';

const PRIORITIES = ['normal', 'urgent', 'critical'];
const TYPES = ['outbound', 'inbound'];

// Priority dropdown component
const PriorityDropdown = ({ value, onSelect }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={styles.select}
        activeOpacity={0.8}
        onPress={() => setOpen(true)}
      >
        <Text style={value ? styles.selectText : styles.selectPlaceholder}>
          {value || 'Select priority'}
        </Text>
        <Icon name="chevron-down" size={22} color="#374151" />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.sheet}>
            {PRIORITIES.map(p => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.sheetItem,
                  value === p && styles.sheetItemActive,
                ]}
                onPress={() => {
                  onSelect(p);
                  setOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.sheetText,
                    value === p && styles.sheetTextActive,
                  ]}
                >
                  {p}
                </Text>
                {value === p && (
                  <Icon name="check" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

// Type dropdown component
const TypeDropdown = ({ value, onSelect }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={styles.select}
        activeOpacity={0.8}
        onPress={() => setOpen(true)}
      >
        <Text style={value ? styles.selectText : styles.selectPlaceholder}>
          {value || 'Select type'}
        </Text>
        <Icon name="chevron-down" size={22} color="#374151" />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.sheet}>
            {TYPES.map(t => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.sheetItem,
                  value === t && styles.sheetItemActive,
                ]}
                onPress={() => {
                  onSelect(t);
                  setOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.sheetText,
                    value === t && styles.sheetTextActive,
                  ]}
                >
                  {t}
                </Text>
                {value === t && (
                  <Icon name="check" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const RADIO_OPTIONS = [
  {
    key: 'all',
    label: 'All Office Bearer, Executive Member & Local Secretary',
  },
  { key: 'office', label: 'All Office Bearer' },
  { key: 'executive', label: 'All Executive Member' },
  { key: 'local', label: 'All Local Secretary' },
];

// ---------------------------------------------------------------
// Dropdown Component
// ---------------------------------------------------------------
const Dropdown = ({ value, placeholder, options, onSelect, disabled }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = search.trim()
    ? options.filter(o => o.name?.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <>
      <TouchableOpacity
        style={[styles.select, disabled && styles.selectDisabled]}
        activeOpacity={0.8}
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
      >
        <Text
          style={value ? styles.selectText : styles.selectPlaceholder}
          numberOfLines={1}
        >
          {value?.name || placeholder}
        </Text>
        <Icon name="chevron-down" size={22} color="#374151" />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.sheet}>
            {/* Search */}
            <View style={styles.searchBox}>
              <Icon name="magnify" size={20} color="#6B7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                placeholderTextColor="#9CA3AF"
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {/* Options */}
            <ScrollView
              style={styles.optionsList}
              keyboardShouldPersistTaps="handled"
            >
              {filteredOptions.length === 0 ? (
                <Text style={styles.noResults}>No results</Text>
              ) : (
                filteredOptions.map(o => (
                  <TouchableOpacity
                    key={o.id}
                    style={[
                      styles.sheetItem,
                      value?.id === o.id && styles.sheetItemActive,
                    ]}
                    onPress={() => {
                      onSelect(o);
                      setOpen(false);
                      setSearch('');
                    }}
                  >
                    <View>
                      <Text
                        style={[
                          styles.sheetText,
                          value?.id === o.id && styles.sheetTextActive,
                        ]}
                      >
                        {o.name}
                      </Text>
                      <Text style={styles.sheetSubText}>{o.memberType}</Text>
                    </View>
                    {value?.id === o.id && (
                      <Icon name="check" size={18} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

// ---------------------------------------------------------------
// Screen
// ---------------------------------------------------------------
const ComposeMessageScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('');
  const [type, setType] = useState('outbound');
  const [target, setTarget] = useState('all');
  const [specific, setSpecific] = useState([]);
  const [sending, setSending] = useState(false);

  // Recipients dropdown state
  const [allRecipients, setAllRecipients] = useState([]);
  const [recipientsByType, setRecipientsByType] = useState({
    office: [],
    executive: [],
    local: [],
  });
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  // Image state
  const [attachedFile, setAttachedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');

  // Specific recipient selections
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [selectedExecutive, setSelectedExecutive] = useState(null);
  const [selectedLocal, setSelectedLocal] = useState(null);

  // Fetch recipients on mount
  useEffect(() => {
    fetchRecipients();
  }, []);

  const fetchRecipients = async () => {
    setLoadingRecipients(true);
    try {
      const [executiveResult, bearerResult, secretaryResult] =
        await Promise.all([
          getExecutiveMembers(),
          getOfficeBearers(),
          getLocalSecretaries(),
        ]);

      let allRec = [];
      let byType = { office: [], executive: [], local: [] };

      if (executiveResult.success) {
        byType.executive = executiveResult.members;
        allRec = [...allRec, ...executiveResult.members];
      }
      if (bearerResult.success) {
        byType.office = bearerResult.bearers;
        allRec = [...allRec, ...bearerResult.bearers];
      }
      if (secretaryResult.success) {
        byType.local = secretaryResult.secretaries;
        allRec = [...allRec, ...secretaryResult.secretaries];
      }

      setAllRecipients(allRec);
      setRecipientsByType(byType);
    } catch (error) {
      console.error('Error fetching recipients:', error);
      Alert.alert('Error', 'Failed to load recipients');
    } finally {
      setLoadingRecipients(false);
    }
  };

  // Image upload handlers
  const handleCameraLaunch = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      cameraType: 'back',
    };

    launchCamera(options, response => {
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.errorCode) {
        Alert.alert(
          'Camera Error',
          response.errorMessage || 'Failed to open camera',
        );
      } else if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        const imageFile = {
          uri:
            Platform.OS === 'android'
              ? asset.uri
              : asset.uri.replace('file://', ''),
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `camera_${Date.now()}.jpg`,
        };
        setAttachedFile(imageFile);
        uploadImageFile(imageFile);
      }
    });
  };

  const handleGalleryLaunch = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxWidth: 1920,
      maxHeight: 1080,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled gallery');
      } else if (response.errorCode) {
        Alert.alert(
          'Gallery Error',
          response.errorMessage || 'Failed to open gallery',
        );
      } else if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        const imageFile = {
          uri:
            Platform.OS === 'android'
              ? asset.uri
              : asset.uri.replace('file://', ''),
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `gallery_${Date.now()}.jpg`,
        };
        setAttachedFile(imageFile);
        uploadImageFile(imageFile);
      }
    });
  };

  const uploadImageFile = async imageFile => {
    try {
      setUploading(true);
      console.log('📤 Starting image upload...');

      const formData = new FormData();
      formData.append('file', {
        uri: imageFile.uri,
        type: imageFile.type,
        name: imageFile.name,
      });

      const uploadResult = await uploadImage(formData);
      setUploading(false);

      if (uploadResult.success) {
        setUploadedUrl(uploadResult.imageUrl);
        console.log('✅ Image uploaded:', uploadResult.imageUrl);
      } else {
        console.error('❌ Upload failed:', uploadResult.message);
        Alert.alert('Upload Error', uploadResult.message);
        setAttachedFile(null);
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      Alert.alert('Error', 'Failed to upload image');
      setAttachedFile(null);
    }
  };

  const handleAttachFile = () => {
    Alert.alert('Attach Image', 'Choose image source', [
      {
        text: 'Camera',
        onPress: () => handleCameraLaunch(),
      },
      {
        text: 'Gallery',
        onPress: () => handleGalleryLaunch(),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const selectRadio = key => {
    setTarget(key);
    setSpecific([]);
  };

  const toggleSpecific = key => {
    setTarget(null);
    setSpecific(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key],
    );
  };

  const handleSend = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter message title');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Required', 'Please enter message description');
      return;
    }

    if (!target && specific.length === 0) {
      Alert.alert('Required', 'Please select who to send to');
      return;
    }

    setSending(true);

    try {
      // Build recipients array
      let recipientsArray = [];

      if (target === 'all') {
        recipientsArray = allRecipients.map(r => ({
          recipientId: r.id,
          recipientModel: r.memberType,
        }));
      } else if (target === 'office') {
        recipientsArray = recipientsByType.office.map(r => ({
          recipientId: r.id,
          recipientModel: r.memberType,
        }));
      } else if (target === 'executive') {
        recipientsArray = recipientsByType.executive.map(r => ({
          recipientId: r.id,
          recipientModel: r.memberType,
        }));
      } else if (target === 'local') {
        recipientsArray = recipientsByType.local.map(r => ({
          recipientId: r.id,
          recipientModel: r.memberType,
        }));
      }

      // Handle specific selections
      if (specific.includes('specificOffice') && selectedOffice) {
        recipientsArray.push({
          recipientId: selectedOffice.id,
          recipientModel: selectedOffice.memberType,
        });
      }
      if (specific.includes('specificExecutive') && selectedExecutive) {
        recipientsArray.push({
          recipientId: selectedExecutive.id,
          recipientModel: selectedExecutive.memberType,
        });
      }
      if (specific.includes('specificLocal') && selectedLocal) {
        recipientsArray.push({
          recipientId: selectedLocal.id,
          recipientModel: selectedLocal.memberType,
        });
      }

      // Remove duplicates by recipientId
      const uniqueRecipients = Array.from(
        new Map(recipientsArray.map(r => [r.recipientId, r])).values(),
      );

      console.log('📨 Sending message...');
      console.log('   - Title:', title);
      console.log('   - Recipients:', uniqueRecipients.length);
      console.log('   - Priority:', priority || 'normal');

      // Call API to send message
      const sendResult = await sendMessage({
        title,
        description,
        attachment: uploadedUrl, // Already uploaded URL
        priority: priority || 'normal',
        type,
        recipientType: 'selected',
        recipients: uniqueRecipients,
        recipientRoles: [],
        taggedUsers: [],
      });

      if (sendResult.success) {
        console.log('✅ Message sent successfully!');
        
        // Reset form IMMEDIATELY (not waiting for alert dismiss)
        setTitle('');
        setDescription('');
        setPriority('');
        setType('outbound');
        setTarget('all');
        setSpecific([]);
        setAttachedFile(null);
        setUploadedUrl('');
        setSelectedOffice(null);
        setSelectedExecutive(null);
        setSelectedLocal(null);
        
        // Show alert and navigate after user dismisses it
        Alert.alert('Success', 'Message sent successfully!', [
          {
            text: 'OK',
            onPress: () => {
              navigation && navigation.goBack();
            },
          },
        ]);
      } else {
        console.error('❌ Send failed:', sendResult.message_info);
        Alert.alert('Error', sendResult.message_info);
      }
    } catch (err) {
      console.error('❌ Error in handleSend:', err);
      Alert.alert('Error', err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Compose Message"
          onBack={() => navigation && navigation.goBack()}
        />

        <KeyboardAvoidingView
          style={styles.body}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Title */}
            <Text style={styles.label}>
              Title <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Message title"
              placeholderTextColor={colors.placeHolderColor}
              value={title}
              onChangeText={setTitle}
              editable={!sending}
            />

            {/* Description */}
            <Text style={[styles.label, styles.labelGap]}>
              Description <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter message description..."
              placeholderTextColor={colors.placeHolderColor}
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              editable={!sending}
            />

            {/* Attach Image */}
            <TouchableOpacity
              style={styles.attach}
              activeOpacity={0.8}
              onPress={handleAttachFile}
              disabled={uploading}
            >
              {attachedFile && uploadedUrl ? (
                <>
                  <Image
                    source={{ uri: attachedFile.uri }}
                    style={styles.attachPreview}
                    resizeMode="cover"
                  />
                  {uploading && (
                    <View style={styles.uploadingOverlay}>
                      <ActivityIndicator size="small" color={colors.white} />
                    </View>
                  )}
                  <View style={styles.attachInfo}>
                    <Text style={styles.attachText} numberOfLines={1}>
                      {attachedFile.name}
                    </Text>
                    <Text style={styles.attachSubText}>
                      {uploading ? 'Uploading...' : 'Uploaded ✓'}
                    </Text>
                  </View>
                  {!uploading && (
                    <TouchableOpacity
                      onPress={() => {
                        setAttachedFile(null);
                        setUploadedUrl('');
                      }}
                    >
                      <Icon name="close-circle" size={20} color="#DC2626" />
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <>
                  <Icon name="upload-outline" size={24} color="#2E8B3E" />
                  <Text style={styles.attachText}>
                    {uploading ? 'Uploading...' : 'Click to attach image'}
                  </Text>
                  <Text style={styles.attachSubText}>Camera • Gallery</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Priority & Type */}
            <View style={styles.twoCol}>
              <View style={styles.colLeft}>
                <Text style={styles.label}>Priority</Text>
                <PriorityDropdown value={priority} onSelect={setPriority} />
              </View>

              <View style={styles.colRight}>
                <Text style={styles.label}>Type</Text>
                <TypeDropdown value={type} onSelect={setType} />
              </View>
            </View>

            {/* Send To */}
            <Text style={[styles.label, styles.labelGap]}>
              Send To <Text style={styles.required}>*</Text>
            </Text>

            {RADIO_OPTIONS.map(o => {
              const selected = target === o.key;

              return (
                <TouchableOpacity
                  key={o.key}
                  style={styles.optionRow}
                  activeOpacity={0.7}
                  onPress={() => selectRadio(o.key)}
                >
                  <View style={[styles.radio, selected && styles.radioActive]}>
                    {selected && <View style={styles.radioDot} />}
                  </View>
                  <Text style={styles.optionText}>{o.label}</Text>
                </TouchableOpacity>
              );
            })}

            <View style={styles.optionGap} />

            {/* Specific Dropdowns */}
            <TouchableOpacity
              style={styles.optionRow}
              activeOpacity={0.7}
              onPress={() => toggleSpecific('specificOffice')}
            >
              <View
                style={[
                  styles.checkbox,
                  specific.includes('specificOffice') && styles.checkboxActive,
                ]}
              >
                {specific.includes('specificOffice') && (
                  <Icon name="check" size={16} color={colors.white} />
                )}
              </View>
              <Text style={styles.optionText}>Specific Office Bearer</Text>
            </TouchableOpacity>

            {specific.includes('specificOffice') && (
              <View style={styles.dropdownContainer}>
                <Dropdown
                  value={selectedOffice}
                  placeholder="Select Office Bearer"
                  options={recipientsByType.office}
                  onSelect={setSelectedOffice}
                  disabled={loadingRecipients}
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.optionRow}
              activeOpacity={0.7}
              onPress={() => toggleSpecific('specificExecutive')}
            >
              <View
                style={[
                  styles.checkbox,
                  specific.includes('specificExecutive') &&
                    styles.checkboxActive,
                ]}
              >
                {specific.includes('specificExecutive') && (
                  <Icon name="check" size={16} color={colors.white} />
                )}
              </View>
              <Text style={styles.optionText}>Specific Executive Member</Text>
            </TouchableOpacity>

            {specific.includes('specificExecutive') && (
              <View style={styles.dropdownContainer}>
                <Dropdown
                  value={selectedExecutive}
                  placeholder="Select Executive Member"
                  options={recipientsByType.executive}
                  onSelect={setSelectedExecutive}
                  disabled={loadingRecipients}
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.optionRow}
              activeOpacity={0.7}
              onPress={() => toggleSpecific('specificLocal')}
            >
              <View
                style={[
                  styles.checkbox,
                  specific.includes('specificLocal') && styles.checkboxActive,
                ]}
              >
                {specific.includes('specificLocal') && (
                  <Icon name="check" size={16} color={colors.white} />
                )}
              </View>
              <Text style={styles.optionText}>Specific Local Secretary</Text>
            </TouchableOpacity>

            {specific.includes('specificLocal') && (
              <View style={styles.dropdownContainer}>
                <Dropdown
                  value={selectedLocal}
                  placeholder="Select Local Secretary"
                  options={recipientsByType.local}
                  onSelect={setSelectedLocal}
                  disabled={loadingRecipients}
                />
              </View>
            )}
          </ScrollView>

          {/* Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              activeOpacity={0.8}
              onPress={() => navigation && navigation.goBack()}
              disabled={sending}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sendButton, sending && styles.sendButtonDisabled]}
              activeOpacity={0.85}
              onPress={handleSend}
              disabled={sending}
            >
              <Icon name="send" size={20} color={colors.white} />
              <Text style={styles.sendText}>
                {sending ? 'Sending...' : 'Send Message'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F6F3',
  },
  body: {
    flex: 1,
    marginTop: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: wp('5%'),
    paddingTop: 22,
    paddingBottom: 16,
  },

  label: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semiBold,
    color: colors.TitleColor,
    marginBottom: 8,
  },

  labelGap: {
    marginTop: 18,
  },

  required: {
    color: colors.requiredColor,
  },

  input: {
    height: 52,
    backgroundColor: '#FBFCFB',
    borderWidth: 1,
    borderColor: '#E2E8E4',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: colors.SecondTitleColor,
  },

  textArea: {
    height: 120,
    paddingTop: 12,
  },

  // Attach
  attach: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 70,
    marginTop: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#5DBB6E',
    borderRadius: 12,
    backgroundColor: '#F6FCF8',
    paddingHorizontal: 12,
  },

  attachPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#E5E7EB',
  },

  uploadingOverlay: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  attachInfo: {
    flex: 1,
  },

  attachText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: '#2E8B3E',
  },

  attachSubText: {
    fontSize: 10,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
  },

  // Priority & Type
  twoCol: {
    flexDirection: 'row',
    marginTop: 18,
  },

  colLeft: {
    flex: 1,
    marginRight: 12,
  },

  colRight: {
    flex: 1,
  },

  select: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FBFCFB',
    borderWidth: 1,
    borderColor: '#E2E8E4',
    borderRadius: 12,
    paddingHorizontal: 14,
  },

  selectDisabled: {
    opacity: 0.6,
  },

  selectText: {
    flex: 1,
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    color: '#111827',
  },

  selectPlaceholder: {
    flex: 1,
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
  },

  // Send to
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },

  optionText: {
    flex: 1,
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: '#1F2937',
    marginLeft: 12,
  },

  optionGap: {
    height: 6,
  },

  radio: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },

  radioActive: {
    borderColor: '#2E8B3E',
  },

  radioDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#2E8B3E',
  },

  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#4B5563',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 1,
  },

  checkboxActive: {
    backgroundColor: '#2E8B3E',
    borderColor: '#2E8B3E',
  },

  // Dropdown Container
  dropdownContainer: {
    marginLeft: 40,
    marginBottom: 12,
    marginTop: 8,
  },

  // Dropdown styles
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  sheet: {
    width: wp('70%'),
    maxHeight: '60%',
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: '#1F2937',
  },

  optionsList: {
    maxHeight: 300,
  },

  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  sheetItemActive: {
    backgroundColor: '#F0F9FF',
  },

  sheetText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: '#1F2937',
  },

  sheetTextActive: {
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },

  sheetSubText: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 2,
  },

  noResults: {
    textAlign: 'center',
    paddingVertical: 16,
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    paddingHorizontal: wp('5%'),
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    borderTopWidth: 1,
    borderTopColor: '#EEF1EF',
    backgroundColor: colors.white,
  },

  cancelButton: {
    flex: 0.8,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#F1F3F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  cancelText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semiBold,
    color: '#1F2937',
  },

  sendButton: {
    flex: 1.5,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#2E8B3E',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },

  sendButtonDisabled: {
    opacity: 0.6,
  },

  sendText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: colors.white,
    marginLeft: 8,
  },
});

export default ComposeMessageScreen;
