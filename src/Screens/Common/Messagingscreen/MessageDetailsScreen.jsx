import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import colors from '../../../themes/colors';
import { FontFamily, FontSize } from '../../../themes/typography';

import AppLayout from '../../../components/AppLayout/AppLayout';
import BackHeader from '../../../components/BackHeader/BackHeader';
import {
  Body,
  Label,
  TextField,
  Dropdown,
  GreenButton,
  GrayButton,
  Badge,
} from '../../../components/Formparts';

// Import API functions
import {
  getMessagingDetail,
  markMessageAsRead,
  uploadImage,
  sendMessageReply,
  getExecutiveMembers,
  getOfficeBearers,
  getLocalSecretaries,
} from '../../../api/communication';

const MessageDetailsScreen = ({ navigation, route }) => {
  const messageId = route?.params?.message?.id;

  // Message detail state
  const [loading, setLoading] = useState(true);
  const [messageDetail, setMessageDetail] = useState(null);
  const [tagOptions, setTagOptions] = useState([]);

  // Expandable message state
  const [isExpanded, setIsExpanded] = useState(false);

  // Reply form state
  const [replyText, setReplyText] = useState('');
  const [taggedUser, setTaggedUser] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);

  // Fetch message detail and mark as read on mount
  useEffect(() => {
    const loadMessage = async () => {
      if (messageId) {
        await fetchMessageDetail();
      }
    };
    loadMessage();
  }, [messageId]);

  const fetchMessageDetail = async () => {
    setLoading(true);
    try {
      const detail = await getMessagingDetail(messageId);

      if (detail.success) {
        setMessageDetail(detail.message);

        const [executiveResult, bearerResult, secretaryResult] =
          await Promise.all([
            getExecutiveMembers(),
            getOfficeBearers(),
            getLocalSecretaries(),
          ]);

        let allRecipients = [];
        if (executiveResult.success) {
          allRecipients = [
            ...allRecipients,
            ...executiveResult.members.map(m => ({
              id: m.id,
              name: m.name,
              memberType: 'ExecutiveMember',
            })),
          ];
        }
        if (bearerResult.success) {
          allRecipients = [
            ...allRecipients,
            ...bearerResult.bearers.map(b => ({
              id: b.id,
              name: b.name,
              memberType: 'OfficeBearer',
            })),
          ];
        }
        if (secretaryResult.success) {
          allRecipients = [
            ...allRecipients,
            ...secretaryResult.secretaries.map(s => ({
              id: s.id,
              name: s.name,
              memberType: 'LocalSecretary',
            })),
          ];
        }

        const userMap = {};
        allRecipients.forEach(user => {
          userMap[user.name] = user;
        });

        setTagOptions({
          users: allRecipients.sort((a, b) => a.name.localeCompare(b.name)),
          userMap: userMap,
        });

        await markMessageAsRead(messageId);
      } else {
        console.warn('Failed to fetch message:', detail.messageInfo);
        Alert.alert('Error', detail.messageInfo);
      }
    } catch (error) {
      console.error('Error fetching message:', error);
      Alert.alert('Error', 'Failed to load message details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <View style={styles.container}>
          <BackHeader
            navigation={navigation}
            title="Message Details"
            onBack={() => navigation && navigation.goBack()}
          />
          <View style={[styles.body, styles.loadingContainer]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading message...</Text>
          </View>
        </View>
      </AppLayout>
    );
  }

  if (!messageDetail) {
    return (
      <AppLayout>
        <View style={styles.container}>
          <BackHeader
            navigation={navigation}
            title="Message Details"
            onBack={() => navigation && navigation.goBack()}
          />
          <View style={[styles.body, styles.loadingContainer]}>
            <Text style={styles.errorText}>Message not found</Text>
            <TouchableOpacity
              onPress={() => navigation && navigation.goBack()}
              style={styles.retryBtn}
            >
              <Text style={styles.retryText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </AppLayout>
    );
  }

  const handleAttachFile = () => {
    Alert.alert('Attach Image', 'Choose image source', [
      { text: 'Camera', onPress: () => handleCameraLaunch() },
      { text: 'Gallery', onPress: () => handleGalleryLaunch() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleCameraLaunch = () => {
    const options = { mediaType: 'photo', includeBase64: false, cameraType: 'back' };
    launchCamera(options, response => {
      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        const imageFile = {
          uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `camera_${Date.now()}.jpg`,
        };
        setAttachedFile(imageFile);
        uploadImageFile(imageFile);
      }
    });
  };

  const handleGalleryLaunch = () => {
    const options = { mediaType: 'photo', includeBase64: false, maxWidth: 1920, maxHeight: 1080 };
    launchImageLibrary(options, response => {
      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        const imageFile = {
          uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
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
      const formData = new FormData();
      formData.append('file', {
        uri: imageFile.uri,
        type: imageFile.type,
        name: imageFile.name,
      });

      const uploadResult = await uploadImage(formData);
      setUploading(false);

      if (uploadResult.success) {
        setAttachedFile(prevFile => ({
          ...prevFile,
          uploadedUrl: uploadResult.imageUrl,
        }));
      } else {
        Alert.alert('Upload Error', uploadResult.message);
        setAttachedFile(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image');
      setAttachedFile(null);
    }
  };

  const handleSend = async () => {
    if (!replyText.trim() && !attachedFile) {
      Alert.alert('Validation Error', 'Please write a reply or attach a file.');
      return;
    }

    setSending(true);
    try {
      const attachmentUrl = attachedFile?.uploadedUrl || '';
      let taggedUsersArray = [];
      if (taggedUser && tagOptions?.userMap) {
        const selectedUser = tagOptions.userMap[taggedUser];
        if (selectedUser) {
          taggedUsersArray = [
            { taggedId: selectedUser.id, taggedModel: selectedUser.memberType },
          ];
        }
      }

      const replyResult = await sendMessageReply(messageId, {
        title: `Re: ${messageDetail.title}`,
        description: replyText,
        attachment: attachmentUrl,
        priority: 'normal',
        recipientType: 'selected',
        recipients:
          messageDetail.recipients?.map(r => ({
            recipientId: r.recipientId,
            recipientModel: r.model,
          })) || [],
        taggedUsers: taggedUsersArray,
        parentTitle: messageDetail.title,
      });

      if (replyResult.success) {
        Alert.alert('Success', 'Reply sent successfully!', [
          {
            text: 'OK',
            onPress: () => {
              setReplyText('');
              setTaggedUser('');
              setAttachedFile(null);
              fetchMessageDetail();
            },
          },
        ]);
      } else {
        Alert.alert('Error', replyResult.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleDiscard = () => {
    setReplyText('');
    setTaggedUser('');
    setAttachedFile(null);
    Alert.alert('Discarded', 'Draft reply has been discarded.');
  };

  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Message Details"
          onBack={() => navigation && navigation.goBack()}
        />

        <View style={styles.body}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <Body>
                {/* Message Header Card */}
                <View style={styles.mainMessageCard}>
                  <View style={styles.messageTopHeader}>
                    <Text style={styles.messageTitle}>
                      {messageDetail.title}
                    </Text>
                    <Badge text={messageDetail.priority || 'Normal'} />
                  </View>

                  <View style={styles.senderInfoRow}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>
                        {messageDetail.title?.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.senderName}>
                        {messageDetail.type === 'outbound' ? 'System' : 'Sender'}
                      </Text>
                      <Text style={styles.timestampText}>
                        {formatDate(messageDetail.createdAt)}
                      </Text>
                    </View>
                    <Icon
                      name="information-outline"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </View>

                  {/* Expandable Message Description */}
                  <Text
                    style={styles.messageContentText}
                    numberOfLines={isExpanded ? undefined : 4}
                  >
                    {messageDetail.description}
                  </Text>

                  {/* Read More / Read Less Toggle Button */}
                  {messageDetail.description &&
                    messageDetail.description.length > 150 && (
                      <TouchableOpacity
                        onPress={() => setIsExpanded(!isExpanded)}
                        style={styles.readMoreBtn}
                      >
                        <Text style={styles.readMoreText}>
                          {isExpanded ? 'Read Less ▲' : 'Read More ▼'}
                        </Text>
                      </TouchableOpacity>
                    )}

                  {/* Recipients */}
                  {messageDetail.recipients?.length > 0 && (
                    <View style={styles.recipientsBox}>
                      <Text style={styles.recipientsLabel}>
                        Recipients ({messageDetail.recipients.length}):
                      </Text>
                      {messageDetail.recipients.map((r, idx) => (
                        <View key={idx} style={styles.recipientChip}>
                          <Text style={styles.recipientName}>{r.name}</Text>
                          <Text style={styles.recipientModel}> ({r.model})</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Read By Status */}
                  {messageDetail.readBy?.length > 0 && (
                    <View style={styles.readByBox}>
                      <Text style={styles.readByLabel}>
                        Read by ({messageDetail.readBy.length}):
                      </Text>
                      {messageDetail.readBy.map((r, idx) => (
                        <View key={idx} style={styles.readByItem}>
                          <Icon
                            name="check-circle"
                            size={14}
                            color="#10B981"
                            style={{ marginRight: 4 }}
                          />
                          <Text style={styles.readByName}>
                            {r.userName || 'Anonymous'}
                          </Text>
                          <Text style={styles.readByTime}>
                            {formatDate(r.readAt)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* Reply Section Card */}
                <View style={styles.replyCard}>
                  <Text style={styles.replyCardHeading}>To: Sender</Text>

                  <Label text="Tag users... (optional)" />
                  <Dropdown
                    value={taggedUser}
                    placeholder="Select users to tag..."
                    options={
                      Array.isArray(tagOptions?.users)
                        ? tagOptions.users.map(u => u.name)
                        : []
                    }
                    onSelect={setTaggedUser}
                    style={styles.mb}
                  />

                  <Label text="Write your reply..." />
                  <TextField
                    placeholder="Type your message here..."
                    value={replyText}
                    onChangeText={setReplyText}
                    style={[styles.mb, styles.textAreaField]}
                    multiline
                  />

                  {/* Previous Thread Snippet */}
                  <View style={styles.threadSnippetBox}>
                    <Text style={styles.snippetMeta}>
                      Sender · 07 Jul 2026, 05:21 pm
                    </Text>
                    <Text style={styles.snippetTitle}>West and Fowler</Text>
                    <Text style={styles.snippetDesc} numberOfLines={3}>
                      The main aim of data models is to support the development
                      of information systems by providing the definition and
                      format of data...
                    </Text>
                  </View>

                  {/* Attachment Box */}
                  <TouchableOpacity
                    style={styles.attachBox}
                    activeOpacity={0.8}
                    onPress={uploading ? undefined : handleAttachFile}
                    disabled={uploading}
                  >
                    {attachedFile && attachedFile.uri ? (
                      <>
                        <View style={styles.attachPreviewContainer}>
                          <Image
                            source={{ uri: attachedFile.uri }}
                            style={styles.attachPreview}
                            resizeMode="cover"
                          />
                          {uploading && (
                            <View style={styles.uploadingOverlay}>
                              <ActivityIndicator
                                size="large"
                                color={colors.white}
                              />
                              <Text style={styles.uploadingText}>
                                Uploading...
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.attachInfoContainer}>
                          <Text style={styles.attachText} numberOfLines={1}>
                            {attachedFile.name || 'Image attached'}
                          </Text>
                          <Text style={styles.attachSubText}>
                            {uploading ? 'Uploading...' : attachedFile.type || 'image/jpeg'}
                          </Text>
                        </View>
                        {!uploading && (
                          <TouchableOpacity
                            onPress={() => setAttachedFile(null)}
                            style={styles.removeAttachBtn}
                          >
                            <Icon
                              name="close-circle"
                              size={22}
                              color="#DC2626"
                            />
                          </TouchableOpacity>
                        )}
                      </>
                    ) : (
                      <>
                        <Icon
                          name="upload-outline"
                          size={22}
                          color={colors.primary}
                          style={{ marginRight: 8 }}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.attachText}>
                            Click to attach image
                          </Text>
                          <Text style={styles.attachSubText}>
                            Camera • Gallery
                          </Text>
                        </View>
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Action Buttons */}
                  <View style={styles.actionRow}>
                    <GreenButton
                      title={
                        uploading
                          ? 'Uploading...'
                          : sending
                          ? 'Sending...'
                          : 'Send'
                      }
                      icon={uploading ? 'cloud-upload' : 'send'}
                      onPress={handleSend}
                      style={styles.sendBtn}
                      disabled={uploading || sending}
                    />
                    <GrayButton
                      title="Discard"
                      onPress={handleDiscard}
                      style={styles.discardBtn}
                      disabled={uploading || sending}
                    />
                  </View>
                </View>
              </Body>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
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
    paddingBottom: 30,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: FontSize.base,
    fontFamily: FontFamily.semiBold,
    color: colors.primary,
  },
  errorText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: '#DC2626',
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: colors.white,
  },
  recipientsBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  recipientsLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  recipientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  recipientName: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: '#0369A1',
  },
  recipientModel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#64748B',
  },
  readByBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  readByLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  readByItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingVertical: 2,
  },
  readByName: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: '#1F2937',
    flex: 1,
  },
  readByTime: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#9CA3AF',
  },
  flex: { flex: 1 },
  mb: { marginBottom: 12 },

  mainMessageCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    marginTop: 20,
  },
  messageTopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  messageTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
  },
  senderInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: colors.white,
  },
  senderName: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
  },
  timestampText: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
  },
  messageContentText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#374151',
    lineHeight: 20,
  },
  readMoreBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  readMoreText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },

  replyCard: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 14,
    padding: 14,
  },
  replyCardHeading: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    marginBottom: 10,
  },
  textAreaField: {
    height: 90,
    paddingTop: 10,
    alignItems: 'flex-start',
  },
  threadSnippetBox: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  snippetMeta: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  snippetTitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    marginBottom: 4,
  },
  snippetDesc: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#4B5563',
  },
  attachBox: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  attachPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#E5E7EB',
  },
  attachPreviewContainer: {
    position: 'relative',
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  uploadingText: {
    marginTop: 8,
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: colors.white,
  },
  attachInfoContainer: {
    flex: 1,
    marginRight: 8,
  },
  attachText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },
  attachSubText: {
    fontSize: 10,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
  },
  removeAttachBtn: {
    padding: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sendBtn: {
    flex: 2,
    height: 48,
  },
  discardBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#FEE2E2',
  },
});

export default MessageDetailsScreen;