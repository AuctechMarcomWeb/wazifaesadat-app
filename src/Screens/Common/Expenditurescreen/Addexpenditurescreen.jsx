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
  ActivityIndicator,
  Image,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { launchImageLibrary } from 'react-native-image-picker';

import colors from '../../../themes/colors';
import { FontFamily, FontSize } from '../../../themes/typography';

import AppLayout from '../../../components/AppLayout/AppLayout';
import BackHeader from '../../../components/BackHeader/BackHeader';
import {
  getExpenses,
  getModeOfPayments,
  uploadImage,
  createExpenditure,
} from '../../../api/expenditure';

const formatDate = d =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(
    2,
    '0',
  )}/${d.getFullYear()}`;

// ---------------------------------------------------------------
// Small reusable pieces
// ---------------------------------------------------------------
const Label = ({ text, required }) => (
  <Text style={styles.label}>
    {text}
    {required && <Text style={styles.required}> *</Text>}
  </Text>
);

const Dropdown = ({ icon, value, placeholder, options, onSelect, loading }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={loading ? styles.fieldLoading : styles.field}
        activeOpacity={0.8}
        onPress={() => !loading && setOpen(true)}
        disabled={loading}
      >
        <Icon name={icon} size={22} color="#1F2937" />
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} style={styles.loadingIcon} />
        ) : (
          <>
            <Text
              style={[styles.fieldText, !value && styles.placeholderText]}
              numberOfLines={1}
            >
              {value?.title || value?.name || placeholder}
            </Text>
            <Icon name="chevron-down" size={20} color="#1F2937" />
          </>
        )}
      </TouchableOpacity>

      <Modal
        visible={open && !loading}
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
            {options.length === 0 ? (
              <Text style={styles.noOptions}>No options available</Text>
            ) : (
              options.map(o => (
                <TouchableOpacity
                  key={o._id || o.id}
                  style={[
                    styles.sheetItem,
                    value?._id === o._id && styles.sheetItemActive,
                  ]}
                  onPress={() => {
                    onSelect(o);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.sheetText,
                      value?._id === o._id && styles.sheetTextActive,
                    ]}
                  >
                    {o.title || o.name}
                  </Text>
                  {value?._id === o._id && (
                    <Icon name="check" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const InputField = ({ icon, ...props }) => (
  <View style={styles.field}>
    <Icon name={icon} size={22} color="#1F2937" />
    <TextInput
      style={styles.fieldInput}
      placeholderTextColor={colors.placeHolderColor}
      {...props}
    />
  </View>
);

// ---------------------------------------------------------------
// Screen
// ---------------------------------------------------------------
const AddExpenditureScreen = ({ navigation }) => {
  const [expenseType, setExpenseType] = useState(null);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [loadingModes, setLoadingModes] = useState(true);

  const [date, setDate] = useState(null);
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState(null);
  const [paidTo, setPaidTo] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [billNo, setBillNo] = useState('');
  const [billImageFile, setBillImageFile] = useState(null);
  const [billImageUrl, setBillImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [remarks, setRemarks] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch expense types and payment modes on mount
  useEffect(() => {
    fetchExpenseTypes();
    fetchPaymentModes();
  }, []);

  const fetchExpenseTypes = async () => {
    setLoadingExpenses(true);
    try {
      const result = await getExpenses();
      if (result.success) {
        setExpenseTypes(result.expenses);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      Alert.alert('Error', 'Failed to load expense types');
    } finally {
      setLoadingExpenses(false);
    }
  };

  const fetchPaymentModes = async () => {
    setLoadingModes(true);
    try {
      const result = await getModeOfPayments();
      if (result.success) {
        setPaymentModes(result.paymentModes);
      }
    } catch (error) {
      console.error('Error fetching payment modes:', error);
      Alert.alert('Error', 'Failed to load payment modes');
    } finally {
      setLoadingModes(false);
    }
  };

  const handleDateChange = (event, selected) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'dismissed' || !selected) return;
    }

    if (selected) setDate(selected);
  };

  const handleUploadBillImage = async () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxWidth: 1920,
      maxHeight: 1080,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        Alert.alert('Gallery Error', response.errorMessage || 'Failed to open gallery');
      } else if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        const imageFile = {
          uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `bill_${Date.now()}.jpg`,
        };
        setBillImageFile(imageFile);
        uploadBillImage(imageFile);
      }
    });
  };

  const uploadBillImage = async (imageFile) => {
    try {
      setUploading(true);
      console.log('📤 Uploading bill image...');

      const formData = new FormData();
      formData.append('file', {
        uri: imageFile.uri,
        type: imageFile.type,
        name: imageFile.name,
      });

      const uploadResult = await uploadImage(formData);
      setUploading(false);

      if (uploadResult.success) {
        setBillImageUrl(uploadResult.imageUrl);
        console.log('✅ Bill image uploaded:', uploadResult.imageUrl);
      } else {
        console.error('❌ Upload failed:', uploadResult.message);
        Alert.alert('Upload Error', uploadResult.message);
        setBillImageFile(null);
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      Alert.alert('Error', 'Failed to upload bill image');
      setBillImageFile(null);
    }
  };

  const handleSave = async () => {
    if (!expenseType) return Alert.alert('Required', 'Please select expense type');
    if (!date) return Alert.alert('Required', 'Please select date');
    if (!amount.trim()) return Alert.alert('Required', 'Please enter amount');
    if (!paymentMode) return Alert.alert('Required', 'Please select payment mode');
    if (!paidTo.trim()) return Alert.alert('Required', 'Please enter payee name');

    setSaving(true);

    try {
      // Format date as YYYY-MM-DD string only
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      const payload = {
        expense: expenseType._id,
        date: dateString,                      // ✅ Just date string like "2026-11-12"
        amount: parseFloat(amount),
        paymentMode: paymentMode.name,         // ✅ Send payment mode NAME not ID
        paidTo,
        transactionId: transactionId || '',
        billNo: billNo || '',
        billImage: billImageUrl || '',
        description: description || '',
        remarks: remarks || '',
      };

      console.log('💾 Saving expenditure...');
      console.log('📦 Payload:', JSON.stringify(payload, null, 2));
      const result = await createExpenditure(payload);

      if (result.success) {
        console.log('✅ Expenditure saved successfully!');
        
        // Reset form immediately
        setExpenseType(null);
        setDate(null);
        setAmount('');
        setPaymentMode(null);
        setPaidTo('');
        setTransactionId('');
        setBillNo('');
        setBillImageFile(null);
        setBillImageUrl('');
        setDescription('');
        setRemarks('');
        
        Alert.alert('Success', 'Expenditure saved successfully!', [
          {
            text: 'OK',
            onPress: () => navigation && navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Error', result.message || 'Failed to save expenditure');
      }
    } catch (error) {
      console.error('❌ Error saving:', error);
      Alert.alert('Error', error.message || 'Failed to save expenditure');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Add Expenditure"
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
            {/* Expense Type & Date */}
            <View style={styles.row}>
              <View style={styles.colLeft}>
                <Label text="Expense Type" required />
                <Dropdown
                  icon="layers-outline"
                  value={expenseType}
                  placeholder="Select Expense Type"
                  options={expenseTypes}
                  onSelect={setExpenseType}
                  loading={loadingExpenses}
                />
              </View>

              <View style={styles.colRight}>
                <Label text="Date" required />
                <TouchableOpacity
                  style={styles.field}
                  activeOpacity={0.8}
                  onPress={() => setShowPicker(true)}
                  disabled={saving}
                >
                  <Icon
                    name="calendar-month-outline"
                    size={22}
                    color="#1F2937"
                  />
                  <Text
                    style={[styles.fieldText, !date && styles.placeholderText]}
                  >
                    {date ? formatDate(date) : 'dd/mm/yyyy'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Amount & Payment Mode */}
            <View style={styles.row}>
              <View style={styles.colLeft}>
                <Label text="Amount (₹)" required />
                <InputField
                  icon="currency-inr"
                  placeholder="Enter amount"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  editable={!saving}
                />
              </View>

              <View style={styles.colRight}>
                <Label text="Payment Mode" required />
                <Dropdown
                  icon="credit-card-outline"
                  value={paymentMode}
                  placeholder="Select Payment Mode"
                  options={paymentModes}
                  onSelect={setPaymentMode}
                  loading={loadingModes}
                />
              </View>
            </View>

            {/* Paid To & Transaction ID */}
            <View style={styles.row}>
              <View style={styles.colLeft}>
                <Label text="Paid To" required />
                <InputField
                  icon="account-outline"
                  placeholder="Enter payee name"
                  value={paidTo}
                  onChangeText={setPaidTo}
                  editable={!saving}
                />
              </View>

              <View style={styles.colRight}>
                <Label text="Transaction ID" />
                <InputField
                  icon="swap-horizontal"
                  placeholder="Enter transaction ID"
                  value={transactionId}
                  onChangeText={setTransactionId}
                  autoCapitalize="characters"
                  editable={!saving}
                />
              </View>
            </View>

            {/* Bill No & Bill Image */}
            <View style={styles.row}>
              <View style={styles.colLeft}>
                <Label text="Bill No." />
                <InputField
                  icon="pound"
                  placeholder="Enter bill number"
                  value={billNo}
                  onChangeText={setBillNo}
                  editable={!saving}
                />
              </View>

              <View style={styles.colRight}>
                <Label text="Bill Image" />
                <TouchableOpacity
                  style={styles.upload}
                  activeOpacity={0.8}
                  onPress={handleUploadBillImage}
                  disabled={uploading}
                >
                  {billImageFile && billImageUrl ? (
                    <>
                      <Image
                        source={{ uri: billImageFile.uri }}
                        style={styles.billPreview}
                        resizeMode="cover"
                      />
                      {uploading && (
                        <View style={styles.uploadingOverlay}>
                          <ActivityIndicator size="small" color={colors.white} />
                        </View>
                      )}
                    </>
                  ) : (
                    <>
                      <Icon
                        name="cloud-upload-outline"
                        size={34}
                        color="#2E8B3E"
                      />
                      <Text style={styles.uploadText} numberOfLines={2}>
                        {uploading ? 'Uploading...' : 'Click to upload bill image'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Description */}
            <View style={styles.block}>
              <Label text="Description" />
              <View style={[styles.field, styles.areaField]}>
                <Icon
                  name="text-box-outline"
                  size={22}
                  color="#1F2937"
                  style={styles.areaIcon}
                />
                <TextInput
                  style={[styles.fieldInput, styles.areaInput]}
                  placeholder="Enter description"
                  placeholderTextColor={colors.placeHolderColor}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  textAlignVertical="top"
                  editable={!saving}
                />
              </View>
            </View>

            {/* Remarks */}
            <View style={styles.block}>
              <Label text="Remarks" />
              <View style={[styles.field, styles.areaField]}>
                <Icon
                  name="comment-outline"
                  size={22}
                  color="#1F2937"
                  style={styles.areaIcon}
                />
                <TextInput
                  style={[styles.fieldInput, styles.areaInput]}
                  placeholder="Enter remarks"
                  placeholderTextColor={colors.placeHolderColor}
                  value={remarks}
                  onChangeText={setRemarks}
                  multiline
                  textAlignVertical="top"
                  editable={!saving}
                />
              </View>
            </View>
          </ScrollView>

          {/* Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              activeOpacity={0.8}
              onPress={() => navigation && navigation.goBack()}
              disabled={saving}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, (saving || uploading) && styles.buttonDisabled]}
              activeOpacity={0.85}
              onPress={handleSave}
              disabled={saving || uploading}
            >
              <Icon
                name="content-save-outline"
                size={24}
                color={colors.white}
              />
              <Text style={styles.saveText}>
                {saving ? 'Saving...' : 'Save Expenditure'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* Date Picker */}
        {showPicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={date || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        {showPicker && Platform.OS === 'ios' && (
          <Modal
            transparent
            animationType="slide"
            onRequestClose={() => setShowPicker(false)}
          >
            <View style={styles.iosOverlay}>
              <View style={styles.iosSheet}>
                <TouchableOpacity
                  style={styles.iosDone}
                  onPress={() => setShowPicker(false)}
                >
                  <Text style={styles.iosDoneText}>Done</Text>
                </TouchableOpacity>

                <DateTimePicker
                  value={date || new Date()}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                />
              </View>
            </View>
          </Modal>
        )}
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
    paddingHorizontal: wp('4.5%'),
    paddingTop: 22,
    paddingBottom: 16,
  },

  row: {
    flexDirection: 'row',
    marginBottom: 14,
  },

  colLeft: {
    flex: 1,
    marginRight: 10,
  },

  colRight: {
    flex: 1,
  },

  block: {
    marginBottom: 14,
  },

  label: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semiBold,
    color: '#123B28',
    marginBottom: 7,
  },

  required: {
    color: colors.requiredColor,
  },

  // Fields
  field: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBFCFB',
    borderWidth: 1,
    borderColor: '#E2E8E4',
    borderRadius: 12,
    paddingHorizontal: 12,
  },

  fieldLoading: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBFCFB',
    borderWidth: 1,
    borderColor: '#E2E8E4',
    borderRadius: 12,
    paddingHorizontal: 12,
    opacity: 0.6,
  },

  loadingIcon: {
    marginLeft: 10,
  },

  fieldText: {
    flex: 1,
    marginLeft: 10,
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: '#111827',
  },

  placeholderText: {
    color: '#6B7280',
  },

  fieldInput: {
    flex: 1,
    height: '100%',
    marginLeft: 10,
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: '#111827',
    paddingVertical: 0,
  },

  areaField: {
    height: 100,
    alignItems: 'flex-start',
    paddingTop: 12,
  },

  areaIcon: {
    marginTop: 1,
  },

  areaInput: {
    height: '100%',
    paddingTop: 0,
  },

  // Upload
  upload: {
    height: 88,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#5DBB6E',
    borderRadius: 12,
    backgroundColor: '#F2FBF5',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },

  uploadText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: '#2E8B3E',
    textAlign: 'center',
    marginTop: 2,
  },

  billPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },

  uploadingOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  noOptions: {
    textAlign: 'center',
    paddingVertical: 16,
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    paddingHorizontal: wp('4.5%'),
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    borderTopWidth: 1,
    borderTopColor: '#EEF1EF',
    backgroundColor: colors.white,
  },

  cancelButton: {
    flex: 0.8,
    height: 54,
    borderRadius: 10,
    backgroundColor: '#EEF0F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  cancelText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semiBold,
    color: '#111827',
  },

  saveButton: {
    flex: 1.5,
    height: 54,
    borderRadius: 10,
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

  saveText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: colors.white,
    marginLeft: 8,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  // Dropdown modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  sheet: {
    width: wp('70%'),
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 8,
    elevation: 8,
  },

  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 13,
  },

  sheetItemActive: {
    backgroundColor: colors.primaryLight,
  },

  sheetText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: colors.SecondTitleColor,
  },

  sheetTextActive: {
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },

  // iOS date picker
  iosOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  iosSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },

  iosDone: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },

  iosDoneText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },
});

export default AddExpenditureScreen;
