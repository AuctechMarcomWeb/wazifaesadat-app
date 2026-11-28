/**
 * screens/scholarship/HigherEducationForm.js
 * AWSM Brand Theme + Multi-Step Wizard + FormPart + Action Sheet (Camera/Gallery/Cancel) + Permission
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  PermissionsAndroid,
  Modal,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

import colors from '../../themes/colors';
import { FontFamily, FontSize } from '../../themes/typography';
import AppLayout from '../../components/AppLayout/AppLayout';
import BackHeader from '../../components/BackHeader/BackHeader';
import {
  Label,
  Section,
  TextField,
  Dropdown,
  DateField,
} from '../../components/Formparts';
import {
  getScholarshipDatesByCategory,
  getScholarshipRates,
  getTenureYears,
  createScholarshipForm,
  renewScholarshipForm,
  uploadImage,
} from '../../api/scholarship';

const STEPS = [
  { id: 1, title: 'Student & Course', short: 'Student' },
  { id: 2, title: 'Family & Address', short: 'Family' },
  { id: 3, title: 'Bank Details', short: 'Bank' },
  { id: 4, title: 'Education & Siblings', short: 'Academic' },
  { id: 5, title: 'Declaration & Submit', short: 'Submit' },
];

const DURATION_OPTIONS = ['1 Year', '2 Year', '3 Year', '4 Year'];
const SEMESTER_OPTIONS = [
  '1st',
  '2nd',
  '3rd',
  '4th',
  '5th',
  '6th',
  '7th',
  '8th',
];
const WAZIFA_OPTIONS = ['Yes', 'No'];

// ── Helpers for ISO / Date conversion ────────────────────────────
const parseIsoToDate = isoStr => {
  if (!isoStr) return null;
  const parts = String(isoStr).split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
};

const formatDateToIso = dateObj => {
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// ── Reusable Field Components ─────────────────────────────────────
const FieldInput = ({ locked, editable = true, style, ...props }) => {
  const disabled = locked || !editable;
  return (
    <TextField
      {...props}
      editable={!disabled}
      style={[disabled && styles.lockedField, style]}
    />
  );
};

const FieldTextarea = ({ locked, editable = true, style, ...props }) => {
  const disabled = locked || !editable;
  return (
    <View
      style={[
        styles.textareaBox,
        disabled ? styles.lockedTextarea : styles.activeTextarea,
        style,
      ]}
    >
      <TextInput
        {...props}
        multiline
        textAlignVertical="top"
        editable={!disabled}
        placeholderTextColor={colors.placeHolderColor}
        selectionColor={colors.cursorColor}
        style={styles.textareaInput}
      />
    </View>
  );
};

// ── File Upload Trigger Button ────────────────────────────────────
const FilePickerButton = ({ uploadedUrl, uploading, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.75}
    disabled={uploading}
    onPress={onPress}
    style={[styles.fileCard, uploading && styles.disabledBtn]}
  >
    <View style={styles.fileIconBox}>
      {uploading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Icon
          name={uploadedUrl ? 'check' : 'upload-outline'}
          size={18}
          color={uploadedUrl ? colors.success : colors.primary}
        />
      )}
    </View>

    <View style={styles.fileInfo}>
      <Text style={styles.fileBtnText}>
        {uploading
          ? 'Uploading...'
          : uploadedUrl
          ? 'Change File / Photo'
          : 'Upload File / Photo'}
      </Text>
      {uploadedUrl ? <Text style={styles.uploadedTag}>Uploaded</Text> : null}
    </View>

    <Icon name="chevron-right" size={20} color={colors.textMuted} />
  </TouchableOpacity>
);

// ── Initial dynamic row states ────────────────────────────────────
const newEduRow = () => ({
  board: '',
  exam: '',
  year: '',
  division: '',
  percentage: '',
});
const newSibRow = () => ({ name: '', cls: '', institute: '', wazifa: '' });

// ══ MAIN COMPONENT ════════════════════════════════════════════════
const HigherEducationForm = ({ navigation, route }) => {
  const scrollRef = useRef(null);

  // Route params
  const courseType = route?.params?.courseType ?? 'Senior'; // "Junior" | "Senior"
  const formType = route?.params?.formType ?? 'New'; // "New" | "Renewal"
  const wazifaRecord = route?.params?.wazifaRecord ?? null;

  const isRenewal = formType === 'Renewal';
  const isJunior = courseType === 'Junior';

  // ── Step Wizard State ──────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(1);

  // ── Session, Dates & Courses State ─────────────────────────────
  const [sessionName, setSessionName] = useState('2026-2027');
  const [scholarshipDate, setScholarshipDate] = useState(null);
  const [loadingDates, setLoadingDates] = useState(true);

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  // ── Modal State for Media Choice (Camera / Gallery / Cancel) ────
  const [pickerModalVisible, setPickerModalVisible] = useState(false);
  const [activePickerField, setActivePickerField] = useState(null);

  // ── Load Active Tenure Session ─────────────────────────────────
  useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await getTenureYears(1, 10, '', true);
        const list = Array.isArray(res)
          ? res
          : res?.tenureYears || res?.data || [];
        if (list.length > 0) {
          const active = list[0];
          setSessionName(
            active.sessionName || active.year || active.name || '2026-2027',
          );
        }
      } catch (err) {
        console.log('Tenure session fallback:', err?.message);
      }
    };
    loadSession();
  }, []);

  // ── Load Scholarship Dates by Category ─────────────────────────
  useEffect(() => {
    const loadScholarshipDates = async () => {
      try {
        setLoadingDates(true);
        const category = isJunior ? 'Junior' : 'Senior';
        const res = await getScholarshipDatesByCategory(category, true);
        const dates = Array.isArray(res)
          ? res
          : res?.scholarshipDates || res?.data || [];
        if (dates.length > 0) {
          setScholarshipDate(dates[0]);
        }
      } catch (err) {
        console.error('Error loading scholarship dates:', err);
      } finally {
        setLoadingDates(false);
      }
    };
    loadScholarshipDates();
  }, [isJunior]);

  const formatDisplayDate = dateString => {
    if (!dateString) return '30 September 2026';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '30 September 2026';
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // ── Load Courses with Rates ────────────────────────────────────
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setCoursesLoading(true);
        const res = await getScholarshipRates(1, 100, '', true);
        const all = Array.isArray(res)
          ? res
          : res?.courses || res?.courseWithRates || res?.data || [];
        setCourses(
          all.filter(c => c.courseType === courseType && c.isActive !== false),
        );
      } catch (err) {
        console.error('Error loading courses:', err);
        setCourses([]);
      } finally {
        setCoursesLoading(false);
      }
    };
    loadCourses();
  }, [courseType]);

  // ── Form State ─────────────────────────────────────────────────
  const [f, setF] = useState({
    student_photo: wazifaRecord?.student_photo ?? null,
    student_name: wazifaRecord?.studentName ?? '',
    dob: wazifaRecord?.dateOfBirth
      ? new Date(wazifaRecord.dateOfBirth).toISOString().split('T')[0]
      : '',
    present_class: wazifaRecord?.presentClass ?? '',
    course: wazifaRecord?.courseOfStudy ?? '',
    course_duration: wazifaRecord?.courseDuration ?? '',
    semester: wazifaRecord?.semester ?? '',
    admission_fees:
      wazifaRecord?.admissionFees !== undefined
        ? String(wazifaRecord.admissionFees)
        : '',
    annual_fees:
      wazifaRecord?.totalAnnualFees !== undefined
        ? String(wazifaRecord.totalAnnualFees)
        : '',
    institute: wazifaRecord?.institutionName ?? '',
    father_name: wazifaRecord?.fatherName ?? '',
    father_income:
      wazifaRecord?.fatherIncome !== undefined
        ? String(wazifaRecord.fatherIncome)
        : '',
    mother_name: wazifaRecord?.motherName ?? '',
    mother_income:
      wazifaRecord?.motherIncome !== undefined
        ? String(wazifaRecord.motherIncome)
        : '',
    guardian_name: wazifaRecord?.guardianName ?? '',
    guardian_relationship: wazifaRecord?.guardianRelationship ?? '',
    permanent_address: wazifaRecord?.permanentAddress ?? '',
    pincode: wazifaRecord?.pinCode ? String(wazifaRecord.pinCode) : '',
    aadhaar: wazifaRecord?.aadhaarNo ? String(wazifaRecord.aadhaarNo) : '',
    present_address: wazifaRecord?.presentAddress ?? '',
    contact: wazifaRecord?.contactNo ? String(wazifaRecord.contactNo) : '',
    email: wazifaRecord?.email ?? '',
    bank_account_name: wazifaRecord?.bankAcName ?? '',
    bank_account_no: wazifaRecord?.bankAcNo
      ? String(wazifaRecord.bankAcNo)
      : '',
    confirm_bank_account_no: wazifaRecord?.bankAcNo
      ? String(wazifaRecord.bankAcNo)
      : '',
    ifsc_code: wazifaRecord?.ifsc ?? '',
    bank_details: wazifaRecord?.bankDetails ?? '',
    parent_sign: wazifaRecord?.parent_sign ?? null,
    student_sign: wazifaRecord?.student_sign ?? null,
  });

  const [uploading, setUploading] = useState({
    student_photo: false,
    parent_sign: false,
    student_sign: false,
  });

  // ── Open Modal Choice for Field ────────────────────────────────
  const openMediaPicker = fieldName => {
    setActivePickerField(fieldName);
    setPickerModalVisible(true);
  };

  // ── Request Android Camera Permission ─────────────────────────
  const showCameraSettingsAlert = () => {
    Alert.alert(
      'Camera Permission Required',
      'Please allow Camera access from Settings to capture photos.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ],
    );
  };

  const requestCameraPermission = async () => {
    if (Platform.OS !== 'android') return true; // iOS khud permission maangta hai
    try {
      const permission = PermissionsAndroid.PERMISSIONS.CAMERA;
      if (await PermissionsAndroid.check(permission)) return true;

      const result = await PermissionsAndroid.request(permission, {
        title: 'Camera Permission Required',
        message:
          'This application needs Camera access to capture student photo or signatures.',
        buttonPositive: 'Allow',
        buttonNegative: 'Cancel',
      });

      if (result === PermissionsAndroid.RESULTS.GRANTED) return true;
      if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        showCameraSettingsAlert();
      }
      return false;
    } catch (err) {
      console.warn('Camera Permission Error:', err);
      return false;
    }
  };

  // ── Core Upload Handler ────────────────────────────────────────
  const uploadAsset = async (fieldName, asset) => {
    setUploading(p => ({ ...p, [fieldName]: true }));
    try {
      const uploadRes = await uploadImage({
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || `${fieldName}_${Date.now()}.jpg`,
      });

      if (uploadRes.success && uploadRes.imageUrl) {
        setF(p => ({ ...p, [fieldName]: uploadRes.imageUrl }));
      } else {
        Alert.alert(
          'Upload Failed',
          uploadRes.message || 'File upload failed. Please try again.',
        );
      }
    } catch (err) {
      Alert.alert('Upload Failed', 'File upload failed. Please try again.');
    } finally {
      setUploading(p => ({ ...p, [fieldName]: false }));
    }
  };

  // ── Launch Gallery ─────────────────────────────────────────────
  const chooseFromGallery = async () => {
    const fieldName = activePickerField;
    setPickerModalVisible(false);
    if (!fieldName) return;

    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
      });

      if (result.didCancel || !result.assets?.length) return;
      await uploadAsset(fieldName, result.assets[0]);
    } catch (err) {
      Alert.alert('Gallery Error', 'Could not open gallery. Please try again.');
    }
  };

  // ── Launch Camera ──────────────────────────────────────────────
  const takeFromCamera = async () => {
    const fieldName = activePickerField;
    setPickerModalVisible(false);
    if (!fieldName) return;

    // Modal poora band hone ke baad hi permission / camera kholein
    await new Promise(resolve => setTimeout(resolve, 400));

    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: false,
      });

      if (result.didCancel) return;

      if (result.errorCode) {
        if (result.errorCode === 'permission') {
          showCameraSettingsAlert();
        } else {
          Alert.alert(
            'Camera Error',
            result.errorMessage || 'Could not open camera. Please try again.',
          );
        }
        return;
      }

      if (!result.assets?.length) return;
      await uploadAsset(fieldName, result.assets[0]);
    } catch (err) {
      Alert.alert('Camera Error', 'Could not open camera. Please try again.');
    }
  };

  // ── Checkbox States ────────────────────────────────────────────
  const [sameAddress, setSameAddress] = useState(false);
  const [sameName, setSameName] = useState(false);
  const [decl1, setDecl1] = useState(false);
  const [decl2, setDecl2] = useState(false);

  // ── Validation Errors ──────────────────────────────────────────
  const [bankErr1, setBankErr1] = useState('');
  const [bankErr2, setBankErr2] = useState('');

  // ── Dynamic Rows ───────────────────────────────────────────────
  const [eduRows, setEduRows] = useState(() => {
    if (isRenewal && wazifaRecord?.educationDetails?.length) {
      return wazifaRecord.educationDetails.map(e => ({
        board: e.board ?? '',
        exam: e.classOrCourse ?? '',
        year: e.passingYear ?? '',
        division: e.division ?? '',
        percentage: e.percentage ?? '',
      }));
    }
    return [newEduRow()];
  });

  const [sibRows, setSibRows] = useState(() => {
    if (isRenewal && wazifaRecord?.siblingsDetails?.length) {
      return wazifaRecord.siblingsDetails.map(s => ({
        name: s.name ?? '',
        cls: s.class ?? '',
        institute: s.institute ?? '',
        wazifa: s.wazifaGranted ?? '',
      }));
    }
    return [newSibRow()];
  });

  // ── Submission State ───────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  // ── Checkbox & Bank Handlers ───────────────────────────────────
  const handleSameAddress = checked => {
    setSameAddress(checked);
    if (checked) {
      setF(p => ({ ...p, present_address: p.permanent_address }));
    } else {
      setF(p => ({ ...p, present_address: '' }));
    }
  };

  const handleSameName = checked => {
    setSameName(checked);
    if (checked) {
      setF(p => ({ ...p, bank_account_name: p.student_name }));
    } else {
      setF(p => ({ ...p, bank_account_name: '' }));
    }
  };

  const handleBankChange = (field, rawVal) => {
    const val = rawVal.replace(/\D/g, '');
    setF(p => ({ ...p, [field]: val }));
    const acc1 = field === 'bank_account_no' ? val : f.bank_account_no;
    const acc2 =
      field === 'confirm_bank_account_no' ? val : f.confirm_bank_account_no;

    if (!acc1) setBankErr1('Please enter account number');
    else setBankErr1('');

    if (acc2 && acc1 !== acc2) setBankErr2('Account number does not match');
    else setBankErr2('');
  };

  // ── Dynamic Row Handlers ───────────────────────────────────────
  const addEdu = () => setEduRows(p => [...p, newEduRow()]);
  const removeEdu = i => setEduRows(p => p.filter((_, idx) => idx !== i));
  const chgEdu = (i, k, v) =>
    setEduRows(p => p.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));

  const addSib = () => setSibRows(p => [...p, newSibRow()]);
  const removeSib = i => setSibRows(p => p.filter((_, idx) => idx !== i));
  const chgSib = (i, k, v) =>
    setSibRows(p => p.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  // ── Step Validation ────────────────────────────────────────────
  const validateStep = step => {
    setFormError('');

    if (isRenewal) {
      if (step === 1) {
        if (
          !f.present_class.trim() ||
          !f.course_duration ||
          (!isJunior && !f.semester)
        ) {
          setFormError(
            'Please fill Present Class, Duration of Course, and Semester.',
          );
          return false;
        }
      }
      return true;
    }

    if (step === 1) {
      if (!f.student_photo) {
        setFormError('Please upload Student Photo.');
        return false;
      }
      if (!f.student_name.trim() || !f.dob || !f.present_class.trim()) {
        setFormError(
          'Please fill Student Name, Date of Birth, and Present Class.',
        );
        return false;
      }
      if (!f.course || !f.course_duration || (!isJunior && !f.semester)) {
        setFormError('Please select Course, Duration, and Semester.');
        return false;
      }
      if (!f.admission_fees || !f.annual_fees || !f.institute.trim()) {
        setFormError(
          'Please enter Admission Fees, Annual Fees, and Institution Name.',
        );
        return false;
      }
    }

    if (step === 2) {
      if (
        !f.father_name.trim() ||
        !f.mother_name.trim() ||
        !f.guardian_name.trim() ||
        !f.guardian_relationship.trim()
      ) {
        setFormError('Please fill Father, Mother, and Guardian details.');
        return false;
      }
      if (
        !f.permanent_address.trim() ||
        !f.pincode.trim() ||
        !f.aadhaar.trim() ||
        !f.present_address.trim()
      ) {
        setFormError(
          'Please fill Permanent Address, Pin Code, Aadhaar No., and Present Address.',
        );
        return false;
      }
      if (!f.contact || f.contact.length !== 10) {
        setFormError('Please enter a valid 10-digit Contact Number.');
        return false;
      }
      if (!f.email.trim()) {
        setFormError('Please enter your Email address.');
        return false;
      }
    }

    if (step === 3) {
      if (
        !f.bank_account_name.trim() ||
        !f.bank_account_no ||
        !f.confirm_bank_account_no ||
        !f.ifsc_code.trim() ||
        !f.bank_details.trim()
      ) {
        setFormError('Please fill all required Bank Details.');
        return false;
      }
      if (
        bankErr1 ||
        bankErr2 ||
        f.bank_account_no !== f.confirm_bank_account_no
      ) {
        setFormError(
          'Bank Account Number and Confirm Account Number must match.',
        );
        return false;
      }
    }

    if (step === 4) {
      const firstEdu = eduRows[0];
      if (
        !firstEdu?.board.trim() ||
        !firstEdu?.exam.trim() ||
        !firstEdu?.year.trim() ||
        !firstEdu?.division.trim() ||
        !firstEdu?.percentage.trim()
      ) {
        setFormError(
          'Please fill at least one complete Previous Education row.',
        );
        return false;
      }
    }

    if (step === 5) {
      if (!decl1 || !decl2) {
        setFormError('Please accept both declaration checkboxes.');
        return false;
      }
      if (!f.parent_sign || !f.student_sign) {
        setFormError(
          'Please upload both Parent/Guardian Signature and Student Signature.',
        );
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    scrollToTop();
  };

  const handlePrev = () => {
    setFormError('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
    scrollToTop();
  };

  // ── Submit Form Handler ────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    if (isRenewal) {
      try {
        setSubmitting(true);
        const renewPayload = {
          presentClass: f.present_class,
          courseDuration: f.course_duration,
          ...(!isJunior && f.semester ? { semester: f.semester } : {}),
        };
        await renewScholarshipForm(wazifaRecord.wazifaNo, renewPayload);
        setSuccess(true);
      } catch (err) {
        setFormError(
          err?.response?.data?.message ??
            'Renewal submission failed. Please try again.',
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        studentName: f.student_name,
        dateOfBirth: f.dob,
        courseOfStudy: f.course,
        courseType,
        courseDuration: f.course_duration,
        ...(courseType === 'Senior' && f.semester
          ? { semester: f.semester }
          : {}),
        presentClass: f.present_class,
        admissionFees: f.admission_fees ? Number(f.admission_fees) : undefined,
        totalAnnualFees: f.annual_fees ? Number(f.annual_fees) : undefined,
        institutionName: f.institute,
        fatherName: f.father_name,
        fatherIncome: f.father_income ? Number(f.father_income) : undefined,
        motherName: f.mother_name,
        motherIncome: f.mother_income ? Number(f.mother_income) : 0,
        guardianName: f.guardian_name,
        guardianRelationship: f.guardian_relationship,
        contactNo: f.contact,
        email: f.email,
        aadhaarNo: f.aadhaar,
        pinCode: f.pincode,
        permanentAddress: f.permanent_address,
        presentAddress: f.present_address,
        bankAcName: f.bank_account_name,
        bankAcNo: f.bank_account_no,
        ifsc: f.ifsc_code,
        bankDetails: f.bank_details,
        student_photo: f.student_photo ?? '',
        parent_sign: f.parent_sign ?? '',
        student_sign: f.student_sign ?? '',
        educationDetails: eduRows.map(r => ({
          board: r.board,
          classOrCourse: r.exam,
          passingYear: r.year,
          division: r.division,
          percentage: r.percentage,
        })),
        siblingsDetails: sibRows
          .filter(r => r.name || r.cls || r.institute || r.wazifa)
          .map(r => ({
            name: r.name,
            class: r.cls,
            institute: r.institute,
            wazifaGranted: r.wazifa || 'No',
          })),
        decl1,
        decl2,
      };

      await createScholarshipForm(payload);
      setSuccess(true);
    } catch (err) {
      setFormError(
        err?.response?.data?.message ?? 'Submission failed. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success View ───────────────────────────────────────────────
  if (success) {
    return (
      <AppLayout>
        <View style={styles.successContainer}>
          <View style={styles.successCard}>
            <View style={styles.successIconWrap}>
              <Icon name="check-circle" size={48} color={colors.success} />
            </View>
            <Text style={styles.successTitle}>Application Submitted!</Text>
            <Text style={styles.successSub}>
              Your application has been submitted successfully. You will be
              contacted on your registered mobile number.
            </Text>
            <TouchableOpacity
              style={styles.successBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.successBtnText}>Back to Scholarships</Text>
            </TouchableOpacity>
          </View>
        </View>
      </AppLayout>
    );
  }

  const courseNameById = Object.fromEntries(courses.map(c => [c._id, c.name]));
  const courseNames = courses.map(c => c.name);
  const selectedCourseName = courseNameById[f.course] || '';

  // ══ RENDER ════════════════════════════════════════════════════
  return (
    <AppLayout>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <BackHeader
            navigation={navigation}
            title={
              isJunior ? 'Class 9–12 Application Form' : 'Higher Education Form'
            }
            onBack={() => {
              if (currentStep > 1) {
                handlePrev();
              } else {
                navigation.goBack();
              }
            }}
          />

          {/* ══ STEPPER BAR ═══════════════════════════════════════ */}
          <View style={styles.stepperContainer}>
            <View style={styles.stepperRow}>
              {STEPS.map((step, index) => {
                const isCompleted = currentStep > step.id;
                const isActive = currentStep === step.id;
                return (
                  <React.Fragment key={step.id}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        if (step.id < currentStep) {
                          setFormError('');
                          setCurrentStep(step.id);
                          scrollToTop();
                        }
                      }}
                      style={styles.stepItem}
                    >
                      <View
                        style={[
                          styles.stepCircle,
                          isCompleted && styles.stepCircleCompleted,
                          isActive && styles.stepCircleActive,
                        ]}
                      >
                        {isCompleted ? (
                          <Icon name="check" size={14} color={colors.white} />
                        ) : (
                          <Text
                            style={[
                              styles.stepNumber,
                              isActive && styles.stepNumberActive,
                            ]}
                          >
                            {step.id}
                          </Text>
                        )}
                      </View>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.stepLabel,
                          (isActive || isCompleted) && styles.stepLabelActive,
                        ]}
                      >
                        {step.short}
                      </Text>
                    </TouchableOpacity>

                    {index < STEPS.length - 1 && (
                      <View
                        style={[
                          styles.stepLine,
                          isCompleted && styles.stepLineCompleted,
                        ]}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </View>

            <View style={styles.stepStatusRow}>
              <Text style={styles.stepHeadingText}>
                Step {currentStep} of {STEPS.length}:{' '}
                {STEPS[currentStep - 1].title}
              </Text>
              <View style={styles.lastDatePill}>
                <Text style={styles.lastDatePillText}>
                  Last Date:{' '}
                  {loadingDates
                    ? '...'
                    : scholarshipDate?.endDate
                    ? formatDisplayDate(scholarshipDate.endDate)
                    : '30 Sep 2026'}
                </Text>
              </View>
            </View>
          </View>

          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Header Banner (Step 1) ── */}

            {/* ── Renewal Banner ── */}
            {isRenewal && (
              <View style={styles.renewalBanner}>
                <Icon name="alert-outline" size={20} color={colors.warning} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.renewalTitle}>
                    Tajdeed (Renewal) Form
                  </Text>
                  <Text style={styles.renewalSub}>
                    Pre-filled records are{' '}
                    <Text style={{ fontFamily: FontFamily.bold }}>locked</Text>.
                    Only{' '}
                    <Text style={{ fontFamily: FontFamily.bold }}>
                      Present Class, Duration of Course, and Semester
                    </Text>{' '}
                    can be updated.
                  </Text>
                </View>
              </View>
            )}

            {/* ════════════════════════════════════════════════════════ */}
            {/* STEP 1: STUDENT & COURSE DETAILS                        */}
            {/* ════════════════════════════════════════════════════════ */}
            {currentStep === 1 && (
              <Section title="Student & Course Details">
                <View style={styles.fieldGap}>
                  <View>
                    <Label text="Student Photo" required />
                    {isRenewal ? (
                      <Text style={styles.lockedItalic}>
                        Locked — not required for renewal.
                      </Text>
                    ) : (
                      <FilePickerButton
                        uploadedUrl={f.student_photo}
                        uploading={uploading.student_photo}
                        onPress={() => openMediaPicker('student_photo')}
                      />
                    )}
                  </View>

                  <View>
                    <Label text="Name of the Student" required />
                    <FieldInput
                      value={f.student_name}
                      locked={isRenewal}
                      placeholder="Enter full name"
                      onChangeText={val => {
                        if (!isRenewal) {
                          setF(p => ({
                            ...p,
                            student_name: val,
                            ...(sameName ? { bank_account_name: val } : {}),
                          }));
                        }
                      }}
                    />
                  </View>

                  <View>
                    <Label text="Date of Birth" required />
                    {isRenewal ? (
                      <FieldInput value={f.dob || '—'} locked />
                    ) : (
                      <DateField
                        value={parseIsoToDate(f.dob)}
                        placeholder="dd/mm/yyyy"
                        onChange={dateObj =>
                          setF(p => ({ ...p, dob: formatDateToIso(dateObj) }))
                        }
                      />
                    )}
                  </View>

                  <View>
                    <Label text="Present Class" required />
                    <FieldInput
                      value={f.present_class}
                      placeholder="e.g. B.Tech 2nd Year / Class 11"
                      onChangeText={val =>
                        setF(p => ({ ...p, present_class: val }))
                      }
                    />
                  </View>

                  <View>
                    <Label text="Course of Study" required />
                    {isRenewal ? (
                      <FieldInput
                        value={
                          wazifaRecord?.courseOfStudyName ??
                          wazifaRecord?.courseOfStudy ??
                          '—'
                        }
                        locked
                      />
                    ) : (
                      <Dropdown
                        value={selectedCourseName}
                        placeholder={
                          coursesLoading
                            ? 'Loading courses...'
                            : 'Select Course'
                        }
                        options={courseNames}
                        searchable
                        onSelect={name => {
                          const found = courses.find(c => c.name === name);
                          setF(p => ({ ...p, course: found?._id ?? '' }));
                        }}
                      />
                    )}
                  </View>

                  <View style={styles.twoColRow}>
                    <View style={{ flex: 1 }}>
                      <Label text="Duration of Course" required />
                      <Dropdown
                        value={f.course_duration}
                        placeholder="Select Duration"
                        options={DURATION_OPTIONS}
                        onSelect={val =>
                          setF(p => ({ ...p, course_duration: val }))
                        }
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Label text="Semester" required={!isJunior} />
                      <View style={isJunior && styles.disabledBlock}>
                        <Dropdown
                          value={f.semester}
                          placeholder="Select Semester"
                          options={SEMESTER_OPTIONS}
                          onSelect={val => {
                            if (!isJunior) {
                              setF(p => ({ ...p, semester: val }));
                            }
                          }}
                        />
                      </View>
                      {isJunior && (
                        <Text style={styles.helperHint}>
                          Not applicable for Class 9–12
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.twoColRow}>
                    <View style={{ flex: 1 }}>
                      <Label text="Admission Fees (Rs)" required />
                      <FieldInput
                        keyboardType="numeric"
                        value={f.admission_fees}
                        locked={isRenewal}
                        placeholder="0"
                        onChangeText={val =>
                          setF(p => ({ ...p, admission_fees: val }))
                        }
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Label text="Total Annual Fees (Rs)" required />
                      <FieldInput
                        keyboardType="numeric"
                        value={f.annual_fees}
                        locked={isRenewal}
                        placeholder="0"
                        onChangeText={val =>
                          setF(p => ({ ...p, annual_fees: val }))
                        }
                      />
                    </View>
                  </View>

                  <View>
                    <Label text="Institution Name & Address" required />
                    <FieldInput
                      value={f.institute}
                      locked={isRenewal}
                      placeholder="Enter school/college name & city"
                      onChangeText={val =>
                        setF(p => ({ ...p, institute: val }))
                      }
                    />
                  </View>
                </View>
              </Section>
            )}

            {/* ════════════════════════════════════════════════════════ */}
            {/* STEP 2: FAMILY & ADDRESS DETAILS                        */}
            {/* ════════════════════════════════════════════════════════ */}
            {currentStep === 2 && (
              <Section title="Family & Address Details">
                <View style={styles.fieldGap}>
                  <View style={styles.twoColRow}>
                    <View style={{ flex: 1 }}>
                      <Label text="Father's Name" required />
                      <FieldInput
                        value={f.father_name}
                        locked={isRenewal}
                        onChangeText={val =>
                          setF(p => ({ ...p, father_name: val }))
                        }
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Label text="Father/Guardian Income (Rs)" />
                      <FieldInput
                        keyboardType="numeric"
                        value={f.father_income}
                        locked={isRenewal}
                        onChangeText={val =>
                          setF(p => ({ ...p, father_income: val }))
                        }
                      />
                    </View>
                  </View>

                  <View style={styles.twoColRow}>
                    <View style={{ flex: 1 }}>
                      <Label text="Mother's Name" required />
                      <FieldInput
                        value={f.mother_name}
                        locked={isRenewal}
                        onChangeText={val =>
                          setF(p => ({ ...p, mother_name: val }))
                        }
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Label text="Mother's Annual Income (Rs)" />
                      <FieldInput
                        keyboardType="numeric"
                        value={f.mother_income}
                        locked={isRenewal}
                        onChangeText={val =>
                          setF(p => ({ ...p, mother_income: val }))
                        }
                      />
                    </View>
                  </View>

                  <View style={styles.twoColRow}>
                    <View style={{ flex: 1 }}>
                      <Label text="Guardian Name" required />
                      <FieldInput
                        value={f.guardian_name}
                        locked={isRenewal}
                        onChangeText={val =>
                          setF(p => ({ ...p, guardian_name: val }))
                        }
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Label text="Guardian Relationship" required />
                      <FieldInput
                        value={f.guardian_relationship}
                        locked={isRenewal}
                        placeholder="e.g. Father, Uncle"
                        onChangeText={val =>
                          setF(p => ({ ...p, guardian_relationship: val }))
                        }
                      />
                    </View>
                  </View>

                  <View>
                    <Label text="Permanent Address" required />
                    <FieldTextarea
                      value={f.permanent_address}
                      locked={isRenewal}
                      placeholder="Enter permanent address"
                      onChangeText={val => {
                        setF(p => ({
                          ...p,
                          permanent_address: val,
                          ...(sameAddress ? { present_address: val } : {}),
                        }));
                      }}
                    />
                  </View>

                  <View style={styles.twoColRow}>
                    <View style={{ flex: 1 }}>
                      <Label text="Pin Code" required />
                      <FieldInput
                        keyboardType="numeric"
                        maxLength={6}
                        value={f.pincode}
                        locked={isRenewal}
                        onChangeText={val =>
                          setF(p => ({
                            ...p,
                            pincode: val.replace(/\D/g, ''),
                          }))
                        }
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Label text="Aadhaar No." required />
                      <FieldInput
                        keyboardType="numeric"
                        maxLength={12}
                        value={f.aadhaar}
                        locked={isRenewal}
                        onChangeText={val =>
                          setF(p => ({
                            ...p,
                            aadhaar: val.replace(/\D/g, ''),
                          }))
                        }
                      />
                    </View>
                  </View>

                  <View>
                    <View style={styles.inlineLabelRow}>
                      <Label text="Present Address" required />
                      {!isRenewal && (
                        <TouchableOpacity
                          style={styles.miniCheckRow}
                          onPress={() => handleSameAddress(!sameAddress)}
                        >
                          <Icon
                            name={
                              sameAddress
                                ? 'checkbox-marked'
                                : 'checkbox-blank-outline'
                            }
                            size={16}
                            color={colors.primary}
                          />
                          <Text style={styles.miniCheckText}>
                            Same as Permanent
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <FieldTextarea
                      value={f.present_address}
                      locked={isRenewal || sameAddress}
                      placeholder="Enter present address"
                      onChangeText={val =>
                        setF(p => ({ ...p, present_address: val }))
                      }
                    />
                  </View>

                  <View>
                    <Label text="Contact No." required />
                    {isRenewal ? (
                      <FieldInput value={f.contact} locked />
                    ) : (
                      <>
                        <View style={styles.phoneInputWrap}>
                          <View style={styles.phonePrefix}>
                            <Text style={styles.phonePrefixText}>+91</Text>
                          </View>
                          <TextInput
                            keyboardType="phone-pad"
                            maxLength={10}
                            placeholder="10-digit number"
                            placeholderTextColor={colors.placeHolderColor}
                            selectionColor={colors.cursorColor}
                            value={f.contact}
                            onChangeText={val =>
                              setF(p => ({
                                ...p,
                                contact: val.replace(/\D/g, ''),
                              }))
                            }
                            style={styles.phoneInput}
                          />
                        </View>
                        <Text style={styles.helperHint}>
                          Do not include +91 — it is already added.
                        </Text>
                      </>
                    )}
                  </View>

                  <View>
                    <Label text="Email" required />
                    <FieldInput
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={f.email}
                      locked={isRenewal}
                      placeholder="example@email.com"
                      onChangeText={val => setF(p => ({ ...p, email: val }))}
                    />
                  </View>
                </View>
              </Section>
            )}

            {/* ════════════════════════════════════════════════════════ */}
            {/* STEP 3: BANK ACCOUNT DETAILS                            */}
            {/* ════════════════════════════════════════════════════════ */}
            {currentStep === 3 && (
              <Section title="Bank Account Details">
                <View style={styles.fieldGap}>
                  <View>
                    <View style={styles.inlineLabelRow}>
                      <Label text="Bank A/C Name" required />
                      {!isRenewal && (
                        <TouchableOpacity
                          style={styles.miniCheckRow}
                          onPress={() => handleSameName(!sameName)}
                        >
                          <Icon
                            name={
                              sameName
                                ? 'checkbox-marked'
                                : 'checkbox-blank-outline'
                            }
                            size={16}
                            color={colors.primary}
                          />
                          <Text style={styles.miniCheckText}>
                            Same as Student Name
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <FieldInput
                      value={f.bank_account_name}
                      locked={isRenewal || sameName}
                      onChangeText={val =>
                        setF(p => ({ ...p, bank_account_name: val }))
                      }
                    />
                  </View>

                  <View>
                    <Label text="Bank A/C No." required />
                    <FieldInput
                      keyboardType="number-pad"
                      maxLength={18}
                      contextMenuHidden={true}
                      placeholder={isRenewal ? '' : 'Enter Bank Account Number'}
                      value={f.bank_account_no}
                      locked={isRenewal}
                      onChangeText={val =>
                        handleBankChange('bank_account_no', val)
                      }
                    />
                    {bankErr1 ? (
                      <Text style={styles.fieldError}>{bankErr1}</Text>
                    ) : null}
                  </View>

                  <View>
                    <Label text="Confirm A/C No." required />
                    <FieldInput
                      keyboardType="number-pad"
                      maxLength={18}
                      contextMenuHidden={true}
                      placeholder={isRenewal ? '' : 'Re-enter Account Number'}
                      value={f.confirm_bank_account_no}
                      locked={isRenewal}
                      onChangeText={val =>
                        handleBankChange('confirm_bank_account_no', val)
                      }
                    />
                    {bankErr2 ? (
                      <Text style={styles.fieldError}>{bankErr2}</Text>
                    ) : null}
                  </View>

                  <View>
                    <Label text="IFSC Code" required />
                    <FieldInput
                      autoCapitalize="characters"
                      placeholder="e.g. SBIN0001234"
                      value={f.ifsc_code}
                      locked={isRenewal}
                      onChangeText={val =>
                        setF(p => ({ ...p, ifsc_code: val.toUpperCase() }))
                      }
                    />
                  </View>

                  <View>
                    <Label text="Bank Name, Branch & City" required />
                    <FieldInput
                      placeholder="e.g. State Bank of India, Main Branch, Azamgarh"
                      value={f.bank_details}
                      locked={isRenewal}
                      onChangeText={val =>
                        setF(p => ({ ...p, bank_details: val }))
                      }
                    />
                  </View>

                  <View style={styles.bankNoteBox}>
                    <Text style={styles.bankNoteTitle}>Note:</Text>
                    {[
                      "Please enclose a photocopy of the Bank Passbook or Cancelled Cheque of the student's bank account, attested by the Local Secretary.",
                      'Students should submit only their active bank passbook copy.',
                      'The bank account must have recently updated KYC.',
                    ].map((note, idx) => (
                      <Text key={idx} style={styles.bankNoteItem}>
                        <Text style={{ color: colors.danger }}>→ </Text>
                        {note}
                      </Text>
                    ))}
                  </View>
                </View>
              </Section>
            )}

            {/* ════════════════════════════════════════════════════════ */}
            {/* STEP 4: PREVIOUS EDUCATION & SIBLINGS                   */}
            {/* ════════════════════════════════════════════════════════ */}
            {currentStep === 4 && (
              <>
                {!isRenewal && (
                  <Section title="Previous Education Details">
                    <View style={{ gap: 12 }}>
                      {eduRows.map((row, i) => (
                        <View
                          key={i}
                          style={[
                            styles.dynamicRow,
                            i > 0 && styles.dynamicRowDivider,
                          ]}
                        >
                          {i > 0 && (
                            <TouchableOpacity
                              onPress={() => removeEdu(i)}
                              style={styles.removeRowBtn}
                            >
                              <Icon
                                name="close-circle"
                                size={20}
                                color={colors.danger}
                              />
                            </TouchableOpacity>
                          )}

                          <View style={styles.fieldGap}>
                            <View>
                              <Label
                                text="Board / University Name"
                                required={i === 0}
                              />
                              <FieldInput
                                placeholder="e.g. CBSE, UP Board"
                                value={row.board}
                                onChangeText={val => chgEdu(i, 'board', val)}
                              />
                            </View>

                            <View style={styles.twoColRow}>
                              <View style={{ flex: 1 }}>
                                <Label
                                  text="Passed Class / Course"
                                  required={i === 0}
                                />
                                <FieldInput
                                  placeholder="e.g. 10th, B.A"
                                  value={row.exam}
                                  onChangeText={val => chgEdu(i, 'exam', val)}
                                />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Label text="Passing Year" required={i === 0} />
                                <FieldInput
                                  keyboardType="numeric"
                                  placeholder="e.g. 2025"
                                  value={row.year}
                                  onChangeText={val => chgEdu(i, 'year', val)}
                                />
                              </View>
                            </View>

                            <View style={styles.twoColRow}>
                              <View style={{ flex: 1 }}>
                                <Label
                                  text="Division / Grade"
                                  required={i === 0}
                                />
                                <FieldInput
                                  placeholder="e.g. First Division"
                                  value={row.division}
                                  onChangeText={val =>
                                    chgEdu(i, 'division', val)
                                  }
                                />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Label
                                  text="Percentage / CGPA"
                                  required={i === 0}
                                />
                                <FieldInput
                                  placeholder="e.g. 85%"
                                  value={row.percentage}
                                  onChangeText={val =>
                                    chgEdu(i, 'percentage', val)
                                  }
                                />
                              </View>
                            </View>
                          </View>
                        </View>
                      ))}

                      <TouchableOpacity
                        style={styles.addRowBtn}
                        onPress={addEdu}
                        activeOpacity={0.8}
                      >
                        <Icon name="plus" size={16} color={colors.white} />
                        <Text style={styles.addRowBtnText}>
                          Add More Qualification
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </Section>
                )}

                <Section title="Studying Brothers & Sisters">
                  <View style={{ gap: 12 }}>
                    {sibRows.map((row, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dynamicRow,
                          i > 0 && styles.dynamicRowDivider,
                        ]}
                      >
                        {i > 0 && !isRenewal && (
                          <TouchableOpacity
                            onPress={() => removeSib(i)}
                            style={styles.removeRowBtn}
                          >
                            <Icon
                              name="close-circle"
                              size={20}
                              color={colors.danger}
                            />
                          </TouchableOpacity>
                        )}

                        <View style={styles.fieldGap}>
                          <View style={styles.twoColRow}>
                            <View style={{ flex: 1 }}>
                              <Label text="Name" />
                              <FieldInput
                                value={row.name}
                                locked={isRenewal}
                                onChangeText={val => chgSib(i, 'name', val)}
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Label text="Class" />
                              <FieldInput
                                value={row.cls}
                                locked={isRenewal}
                                onChangeText={val => chgSib(i, 'cls', val)}
                              />
                            </View>
                          </View>

                          <View style={styles.twoColRow}>
                            <View style={{ flex: 1 }}>
                              <Label text="Name of the Institute" />
                              <FieldInput
                                value={row.institute}
                                locked={isRenewal}
                                onChangeText={val =>
                                  chgSib(i, 'institute', val)
                                }
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Label text="Wazifa granted?" />
                              <View style={isRenewal && styles.disabledBlock}>
                                <Dropdown
                                  value={row.wazifa}
                                  placeholder="Select"
                                  options={WAZIFA_OPTIONS}
                                  onSelect={val => {
                                    if (!isRenewal) {
                                      chgSib(i, 'wazifa', val);
                                    }
                                  }}
                                />
                              </View>
                            </View>
                          </View>
                        </View>
                      </View>
                    ))}

                    {!isRenewal && (
                      <TouchableOpacity
                        style={styles.addRowBtn}
                        onPress={addSib}
                        activeOpacity={0.8}
                      >
                        <Icon name="plus" size={16} color={colors.white} />
                        <Text style={styles.addRowBtnText}>Add Sibling</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </Section>
              </>
            )}

            {/* ════════════════════════════════════════════════════════ */}
            {/* STEP 5: DECLARATION, SIGNATURES & SUBMIT                */}
            {/* ════════════════════════════════════════════════════════ */}
            {currentStep === 5 && (
              <>
                <Section title="Declaration & Signatures">
                  <TouchableOpacity
                    disabled={isRenewal}
                    onPress={() => setDecl1(p => !p)}
                    style={styles.declCheckRow}
                    activeOpacity={0.75}
                  >
                    <Icon
                      name={
                        (isRenewal ? true : decl1)
                          ? 'checkbox-marked'
                          : 'checkbox-blank-outline'
                      }
                      size={20}
                      color={isRenewal ? colors.textMuted : colors.primary}
                    />
                    <Text
                      style={[
                        styles.declText,
                        isRenewal && { color: colors.textMuted },
                      ]}
                    >
                      I also declare &amp; Promise as to my moral &amp; social
                      obligation to help needy &amp; promising students by
                      refunding/paying the total amount of Wazifa received by me
                      immediately on getting any employment or starting to earn
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={isRenewal}
                    onPress={() => setDecl2(p => !p)}
                    style={styles.declCheckRow}
                    activeOpacity={0.75}
                  >
                    <Icon
                      name={
                        (isRenewal ? true : decl2)
                          ? 'checkbox-marked'
                          : 'checkbox-blank-outline'
                      }
                      size={20}
                      color={isRenewal ? colors.textMuted : colors.primary}
                    />
                    <Text
                      style={[
                        styles.declText,
                        isRenewal && { color: colors.textMuted },
                      ]}
                    >
                      I, hereby declare that all the information given above are
                      true and correct. If any information is found to be false
                      or incorrect at any stage, application will be at once
                      REJECTED &amp; the Wazifa will be discontinued, the
                      beneficiary will have to refund the entire amount
                      received.
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.fieldGap}>
                    <View>
                      <Label
                        text="Signature of Parent/Guardian"
                        required={!isRenewal}
                      />
                      {isRenewal ? (
                        <Text style={styles.lockedItalic}>
                          Locked — not required for renewal.
                        </Text>
                      ) : (
                        <FilePickerButton
                          uploadedUrl={f.parent_sign}
                          uploading={uploading.parent_sign}
                          onPress={() => openMediaPicker('parent_sign')}
                        />
                      )}
                    </View>

                    <View>
                      <Label
                        text="Signature of Student"
                        required={!isRenewal}
                      />
                      {isRenewal ? (
                        <Text style={styles.lockedItalic}>
                          Locked — not required for renewal.
                        </Text>
                      ) : (
                        <FilePickerButton
                          uploadedUrl={f.student_sign}
                          uploading={uploading.student_sign}
                          onPress={() => openMediaPicker('student_sign')}
                        />
                      )}
                    </View>
                  </View>
                </Section>

                <View style={styles.noteBox}>
                  <Text style={styles.noteBold}>
                    NOTE: Students are advised to keep a photocopy of the
                    filled-in application form for future record.
                  </Text>
                  <Text style={styles.noteSubBold}>
                    Please ensure that the following documents are enclosed with
                    this form:
                  </Text>
                  {[
                    'Aadhaar Card Copy',
                    'Active Bank Passbook Copy with Updated KYC',
                    'Latest Fee Receipt / School or College Fee Slip',
                    'Previous Class Marksheet / Result Copy',
                    'Passport Size Photograph',
                    '(Orphan [Yateem] Students are requested to submit death certificate of his/her Father)',
                    'Student ID Card / Bonafide Certificate (if available)',
                  ].map((item, idx) => (
                    <Text key={idx} style={styles.noteBullet}>
                      • {item}
                    </Text>
                  ))}
                  <Text style={[styles.noteBullet, { marginTop: 4 }]}>
                    Please double-check your{' '}
                    <Text style={{ fontFamily: FontFamily.bold }}>
                      Bank Account Details, Date of Birth and Contact Number.
                    </Text>{' '}
                    You will need to enter the same details to view or download
                    your form.
                  </Text>
                </View>
              </>
            )}

            {/* ── Error Banner ── */}
            {formError ? (
              <View style={styles.errorBanner}>
                <Icon
                  name="alert-circle-outline"
                  size={16}
                  color={colors.danger}
                />
                <Text style={styles.formErrorText}>{formError}</Text>
              </View>
            ) : null}
          </ScrollView>

          {/* ══ BOTTOM STEP NAVIGATION BAR ════════════════════════ */}
          <View style={styles.bottomNavBar}>
            {currentStep > 1 ? (
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={submitting}
                onPress={handlePrev}
                style={styles.prevBtn}
              >
                <Icon
                  name="arrow-left"
                  size={18}
                  color={colors.SecondTitleColor}
                />
                <Text style={styles.prevBtnText}>Previous</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            {currentStep < STEPS.length ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleNext}
                style={styles.nextBtn}
              >
                <Text style={styles.nextBtnText}>Next Step</Text>
                <Icon name="arrow-right" size={18} color={colors.white} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={submitting}
                onPress={handleSubmit}
                style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Icon
                    name="check-circle-outline"
                    size={18}
                    color={colors.white}
                  />
                )}
                <Text style={styles.submitBtnText}>
                  {submitting
                    ? 'Submitting...'
                    : isRenewal
                    ? 'Submit Renewal'
                    : 'Submit Form'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ══ CAMERA / GALLERY / CANCEL ACTION SHEET MODAL ═══════ */}
          <Modal
            visible={pickerModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setPickerModalVisible(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={styles.actionSheetOverlay}
              onPress={() => setPickerModalVisible(false)}
            >
              <View
                style={styles.actionSheetContainer}
                onStartShouldSetResponder={() => true}
              >
                <Text style={styles.actionSheetTitle}>
                  Select Attachment Option
                </Text>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.actionSheetItem}
                  onPress={takeFromCamera}
                >
                  <Icon name="camera" size={22} color={colors.primary} />
                  <Text style={styles.actionSheetItemText}>
                    Take Photo (Camera)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.actionSheetItem}
                  onPress={chooseFromGallery}
                >
                  <Icon
                    name="image-multiple"
                    size={22}
                    color={colors.primary}
                  />
                  <Text style={styles.actionSheetItemText}>
                    Choose from Gallery
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.75}
                  style={styles.actionSheetCancelBtn}
                  onPress={() => setPickerModalVisible(false)}
                >
                  <Text style={styles.actionSheetCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        </View>
      </KeyboardAvoidingView>
    </AppLayout>
  );
};

// ══ STYLES (AWSM BRAND THEME) ═════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 24,
  },

  // Stepper Header
  stepperContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    width: 48,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.backgroundDark,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  stepCircleCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepNumber: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: colors.textSecondary,
  },
  stepNumberActive: {
    color: colors.primaryDark,
  },
  stepLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  stepLabelActive: {
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.neutral.border,
    marginBottom: 14,
  },
  stepLineCompleted: {
    backgroundColor: colors.primary,
  },
  stepStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
  stepHeadingText: {
    fontFamily: FontFamily.bold,
    fontSize: 12.5,
    color: colors.TitleColor,
  },
  lastDatePill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  lastDatePillText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 10,
    color: colors.primaryDark,
  },

  // Header Banner
  headerCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 8,
    marginBottom: 12,
    paddingBottom: 8,
    overflow: 'hidden',
  },
  headImg: {
    width: '100%',
    height: 68,
  },
  formTitleBar: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.neutral.border,
    backgroundColor: colors.surface,
  },
  formTitleText: {
    fontFamily: FontFamily.bold,
    fontSize: 12.5,
    color: colors.TitleColor,
    textAlign: 'center',
  },
  rejectWarnText: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: colors.SecondTitleColor,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 10,
  },

  // Renewal Banner
  renewalBanner: {
    backgroundColor: colors.warningBg,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    flexDirection: 'row',
    gap: 8,
  },
  renewalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: colors.TitleColor,
  },
  renewalSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },

  // Form Controls
  fieldGap: {
    gap: 11,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  lockedField: {
    backgroundColor: colors.backgroundDark,
    opacity: 0.85,
  },
  disabledBlock: {
    opacity: 0.5,
  },
  textareaBox: {
    minHeight: 64,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  activeTextarea: {
    backgroundColor: colors.white,
    borderColor: '#D5DDD8',
  },
  lockedTextarea: {
    backgroundColor: colors.backgroundDark,
    borderColor: '#D5DDD8',
    opacity: 0.85,
  },
  textareaInput: {
    minHeight: 48,
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: '#111827',
    paddingVertical: 0,
  },

  // File Picker Trigger
  fileCard: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  fileIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  fileBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: colors.TitleColor,
  },
  uploadedTag: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: colors.success,
    marginTop: 2,
  },
  lockedItalic: {
    fontFamily: FontFamily.regular,
    fontStyle: 'italic',
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Inline Checkboxes & Phone
  inlineLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  miniCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  miniCheckText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: colors.textSecondary,
  },
  phoneInputWrap: {
    height: 46,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#D5DDD8',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  phonePrefix: {
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: '#D5DDD8',
    justifyContent: 'center',
  },
  phonePrefixText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: colors.primaryDark,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: '#111827',
  },
  helperHint: {
    fontFamily: FontFamily.regular,
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 3,
  },
  fieldError: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: colors.danger,
    marginTop: 3,
  },

  // Bank Note
  bankNoteBox: {
    marginTop: 4,
    padding: 10,
    backgroundColor: colors.dangerBg,
    borderRadius: 8,
  },
  bankNoteTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: colors.danger,
    marginBottom: 3,
  },
  bankNoteItem: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: colors.SecondTitleColor,
    lineHeight: 15,
    marginBottom: 2,
  },

  // Dynamic Rows
  dynamicRow: {
    position: 'relative',
  },
  dynamicRowDivider: {
    borderTopWidth: 1,
    borderTopColor: '#E1E8E3',
    paddingTop: 14,
  },
  removeRowBtn: {
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  addRowBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  addRowBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    color: colors.white,
  },

  // Declaration
  declCheckRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  declText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 18,
  },

  // Note Box
  noteBox: {
    borderLeftWidth: 4,
    borderLeftColor: colors.gold,
    backgroundColor: colors.warningBg,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  noteBold: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: colors.TitleColor,
    marginBottom: 6,
  },
  noteSubBold: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11.5,
    color: colors.SecondTitleColor,
    marginBottom: 4,
  },
  noteBullet: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 2,
  },

  // Error Banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerBg,
    padding: 10,
    borderRadius: 8,
    gap: 6,
    marginTop: 4,
  },
  formErrorText: {
    flex: 1,
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    color: colors.danger,
  },

  // Bottom Navigation Bar
  bottomNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
    gap: 12,
  },
  prevBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.backgroundDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  prevBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13.5,
    color: colors.SecondTitleColor,
  },
  nextBtn: {
    flex: 1.4,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  nextBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: colors.white,
  },
  submitBtn: {
    flex: 1.5,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  submitBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: colors.white,
  },

  // Action Sheet Modal Styles
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  actionSheetContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  actionSheetTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: colors.TitleColor,
    marginBottom: 16,
    textAlign: 'center',
  },
  actionSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1EF',
  },
  actionSheetItemText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: '#111827',
  },
  actionSheetCancelBtn: {
    marginTop: 14,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionSheetCancelText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: colors.SecondTitleColor,
  },

  // Success Screen
  successContainer: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: colors.neutral.border,
    elevation: 4,
  },
  successIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  successTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: colors.primary,
    marginBottom: 8,
  },
  successSub: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  successBtn: {
    backgroundColor: colors.backgroundbtn,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 8,
  },
  successBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13.5,
    color: colors.textInverse,
  },
});

export default HigherEducationForm;
