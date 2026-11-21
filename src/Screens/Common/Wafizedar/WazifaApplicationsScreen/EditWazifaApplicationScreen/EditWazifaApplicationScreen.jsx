import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../../../../../themes/colors';
import { FontFamily, FontSize } from '../../../../../themes/typography';

import AppLayout from '../../../../../components/AppLayout/AppLayout';
import BackHeader from '../../../../../components/BackHeader/BackHeader';
import {
  Body,
  Label,
  TextField,
  DateField,
  Dropdown,
  GreenButton,
  GrayButton,
  shared,
} from '../../../../../components/Formparts';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import {
  fetchCoursesWithRates,
  fetchSessions,
  createWazifaApplication,
} from '../../../../../api/wazifa';
import { Alert } from 'react-native';

const STEPS = [
  { no: 1, title: 'Personal Info' },
  { no: 2, title: 'Academic Info' },
  { no: 3, title: 'Family Info' },
  { no: 4, title: 'Bank Details' },
  { no: 5, title: 'Education History' },
  { no: 6, title: 'Siblings' },
  { no: 7, title: 'Declarations' },
];

const AddWazifaApplicationScreen = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [courseOptions, setCourseOptions] = useState(['-- Select Course --']);
  const [courseMap, setCourseMap] = useState({}); // Map course name -> ID
  const [sessions, setSessions] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 1. Personal Info State
  const [studentName, setStudentName] = useState('');
  const [dob, setDob] = useState(null);
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [pincode, setPincode] = useState('');
  const [permAddress, setPermAddress] = useState('');
  const [presAddress, setPresAddress] = useState('');

  // 2. Academic Info State
  const [courseOfStudy, setCourseOfStudy] = useState('-- Select Course --');
  const [courseType, setCourseType] = useState(''); // Junior/Senior from course data
  const [courseDuration, setCourseDuration] = useState('');
  const [semesterYear, setSemesterYear] = useState('');
  const [presentClass, setPresentClass] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [admissionFees, setAdmissionFees] = useState('');
  const [annualFees, setAnnualFees] = useState('');
  const [formType, setFormType] = useState('New'); // New or Renewal

  // Load courses and sessions
  useEffect(() => {
    const loadData = async () => {
      setLoadingCourses(true);
      try {
        // Fetch sessions first
        const sessionResult = await fetchSessions();
        if (sessionResult.success && sessionResult.sessions) {
          setSessions(sessionResult.sessions);
        }

        // Fetch courses - using current session
        const courseResult = await fetchCoursesWithRates();
        if (courseResult.success && courseResult.courses) {
          const courseNames = ['-- Select Course --'];
          const map = {};

          courseResult.courses.forEach(course => {
            courseNames.push(course.name);
            map[course.name] = course._id; // Store name -> ID mapping
          });

          setCourseOptions(courseNames);
          setCourseMap(map);
        }
      } catch (error) {
        console.error('Error loading courses/sessions:', error);
      } finally {
        setLoadingCourses(false);
      }
    };
    loadData();
  }, []);

  // 3. Family Info State
  const [fatherName, setFatherName] = useState('');
  const [fatherIncome, setFatherIncome] = useState('');
  const [motherName, setMotherName] = useState('');
  const [motherIncome, setMotherIncome] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelation, setGuardianRelation] = useState('');

  // 4. Bank Details State
  const [accHolderName, setAccHolderName] = useState('');
  const [accNumber, setAccNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankBranch, setBankBranch] = useState('');

  // 5. Education History State
  const [eduRecords, setEduRecords] = useState([
    {
      id: '1',
      board: '',
      course: '',
      passingYear: '',
      division: '',
      percentage: '',
    },
  ]);

  const addEduRecord = () => {
    setEduRecords(prev => [
      ...prev,
      {
        id: String(Date.now()),
        board: '',
        course: '',
        passingYear: '',
        division: '',
        percentage: '',
      },
    ]);
  };

  const updateEduRecord = (id, field, value) => {
    setEduRecords(prev =>
      prev.map(r => (r.id === id ? { ...r, [field]: value } : r)),
    );
  };

  // 6. Siblings State
  const [siblings, setSiblings] = useState([
    { id: '1', name: '', classCourse: '', institute: '', wazifaGranted: 'No' },
  ]);

  const addSibling = () => {
    setSiblings(prev => [
      ...prev,
      {
        id: String(Date.now()),
        name: '',
        classCourse: '',
        institute: '',
        wazifaGranted: 'No',
      },
    ]);
  };

  const updateSibling = (id, field, value) => {
    setSiblings(prev =>
      prev.map(s => (s.id === id ? { ...s, [field]: value } : s)),
    );
  };

  // 7. Declarations State
  const [decl1, setDecl1] = useState(false); // I certify all information is correct
  const [decl2, setDecl2] = useState(false); // I understand false info will result in cancellation

  const handleNext = () => {
    if (currentStep < 7) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Final Submit (Step 7)
      handleSubmitApplication();
    }
  };

  const handleSubmitApplication = async () => {
    // Validate required fields
    if (!studentName.trim()) {
      Alert.alert('Validation Error', 'Student name is required');
      setCurrentStep(1);
      return;
    }
    if (!contact.trim()) {
      Alert.alert('Validation Error', 'Contact number is required');
      setCurrentStep(1);
      return;
    }
    if (courseOfStudy === '-- Select Course --') {
      Alert.alert('Validation Error', 'Course of study is required');
      setCurrentStep(2);
      return;
    }
    if (!courseDuration.trim()) {
      Alert.alert('Validation Error', 'Course duration is required');
      setCurrentStep(2);
      return;
    }
    if (!presentClass.trim()) {
      Alert.alert('Validation Error', 'Present class is required');
      setCurrentStep(2);
      return;
    }
    if (!institutionName.trim()) {
      Alert.alert('Validation Error', 'Institution name is required');
      setCurrentStep(2);
      return;
    }
    if (!fatherName.trim()) {
      Alert.alert('Validation Error', 'Father name is required');
      setCurrentStep(3);
      return;
    }
    if (!permAddress.trim()) {
      Alert.alert('Validation Error', 'Permanent address is required');
      setCurrentStep(1);
      return;
    }
    if (!presAddress.trim()) {
      Alert.alert('Validation Error', 'Present address is required');
      setCurrentStep(1);
      return;
    }
    if (!accHolderName.trim()) {
      Alert.alert('Validation Error', 'Account holder name is required');
      setCurrentStep(4);
      return;
    }
    if (!accNumber.trim()) {
      Alert.alert('Validation Error', 'Account number is required');
      setCurrentStep(4);
      return;
    }
    if (!ifscCode.trim()) {
      Alert.alert('Validation Error', 'IFSC code is required');
      setCurrentStep(4);
      return;
    }
    if (!decl1 || !decl2) {
      Alert.alert('Validation Error', 'Please accept both declarations');
      setCurrentStep(7);
      return;
    }

    // Find the course ID from courseMap
    const selectedCourseId = courseMap[courseOfStudy] || null;

    if (!selectedCourseId) {
      Alert.alert('Error', 'Invalid course selected');
      return;
    }

    // Build payload with EXACT field names from backend
    const payload = {
      // Required fields (from backend validation)
      studentName: studentName.trim(),
      dateOfBirth: dob, // Backend expects this exact field name
      courseOfStudy: selectedCourseId, // Must be course ID
      courseDuration: courseDuration.trim(),
      presentClass: presentClass.trim(),
      institutionName: institutionName.trim(),
      fatherName: fatherName.trim(),
      contactNo: contact.trim(), // Backend expects this field name
      permanentAddress: permAddress.trim(),
      presentAddress: presAddress.trim(),
      bankAcName: accHolderName.trim(),
      bankAcNo: accNumber.trim(),
      ifsc: ifscCode.trim(),
      decl1: decl1, // Boolean
      decl2: decl2, // Boolean
      courseType: courseType || 'Senior', // Backend requires this

      // Optional fields
      formType: formType,
      semester: semesterYear.trim() || null,
      email: email.trim() || null,
      aadhaarNo: aadhaar.trim() || null,
      pinCode: pincode.trim() || null,

      // Financial fields
      admissionFees: admissionFees ? parseInt(admissionFees) : 0,
      totalAnnualFees: annualFees ? parseInt(annualFees) : 0,

      // Family info
      motherName: motherName.trim() || null,
      fatherIncome: fatherIncome ? parseInt(fatherIncome) : 0,
      motherIncome: motherIncome ? parseInt(motherIncome) : 0,
      guardianName: guardianName.trim() || null,
      guardianRelationship: guardianRelation.trim() || null,

      // Bank details
      bankDetails: bankBranch.trim() || null,

      // Additional details
      educationDetails:
        eduRecords.map(rec => ({
          board: rec.board.trim() || null,
          classOrCourse: rec.course.trim() || null,
          passingYear: rec.passingYear.trim() || null,
          division: rec.division.trim() || null,
          percentage: rec.percentage.trim() || null,
        })) || [],
      siblingsDetails:
        siblings.map(sib => ({
          name: sib.name.trim() || null,
          class: sib.classCourse.trim() || null,
          institute: sib.institute.trim() || null,
          wazifaGranted: sib.wazifaGranted,
        })) || [],
    };

    setSubmitting(true);
    try {
      console.log(
        '📤 Submitting wazifa application...',
        JSON.stringify(payload, null, 2),
      );

      const result = await createWazifaApplication(payload);

      if (result.success) {
        Alert.alert(
          'Success! ✅',
          'Wazifa application submitted successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation &&
                  navigation.navigate('WazifaApplicationSubmittedScreen', {
                    applicationId: result.application?._id,
                  });
              },
            },
          ],
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('❌ Error submitting application:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to submit application. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      navigation && navigation.goBack();
    }
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Add Wazifa "
          onBack={() => navigation && navigation.goBack()}
        />

        <View style={styles.body}>
          <Body>
            <KeyboardAvoidingView
              style={styles.flex}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {/* Multi-step Header Indicator */}
                <View style={styles.stepperRow}>
                  {STEPS.map(s => {
                    const isActive = currentStep === s.no;
                    const isPassed = currentStep > s.no;
                    return (
                      <View key={s.no} style={styles.stepItem}>
                        <View
                          style={[
                            styles.stepCircle,
                            isActive && styles.stepCircleActive,
                            isPassed && styles.stepCirclePassed,
                          ]}
                        >
                          {isPassed ? (
                            <Icon name="check" size={14} color={colors.white} />
                          ) : (
                            <Text
                              style={[
                                styles.stepNoText,
                                (isActive || isPassed) &&
                                  styles.stepNoTextActive,
                              ]}
                            >
                              {s.no}
                            </Text>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.stepTitleText,
                            isActive && styles.stepTitleTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {s.title}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* ================= STEP 1: PERSONAL INFO ================= */}
                {currentStep === 1 && (
                  <View>
                    <Text style={styles.sectionHeading}>Student Details</Text>

                    <View style={shared.row}>
                      <View style={shared.colL}>
                        <Label text="Student Name *" />
                        <TextField
                          placeholder="Enter student name"
                          value={studentName}
                          onChangeText={setStudentName}
                        />
                      </View>
                      <View style={shared.col}>
                        <Label text="Date of Birth" />
                        <DateField
                          value={dob}
                          onChange={setDob}
                          leftIcon="calendar-month-outline"
                          hideRightIcon
                        />
                      </View>
                    </View>

                    <View style={shared.row}>
                      <View style={shared.colL}>
                        <Label text="Contact Number *" />
                        <TextField
                          placeholder="10 digits number"
                          value={contact}
                          onChangeText={setContact}
                          keyboardPhone
                        />
                      </View>
                      <View style={shared.col}>
                        <Label text="Email" />
                        <TextField
                          placeholder="Enter email address"
                          value={email}
                          onChangeText={setEmail}
                          keyboardType="email-address"
                        />
                      </View>
                    </View>

                    <View style={shared.row}>
                      <View style={shared.colL}>
                        <Label text="Aadhaar Number" />
                        <TextField
                          placeholder="12 digits number"
                          value={aadhaar}
                          onChangeText={setAadhaar}
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={shared.col}>
                        <Label text="Pin Code" />
                        <TextField
                          placeholder="6 digits pin code"
                          value={pincode}
                          onChangeText={setPincode}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>

                    <Label text="Permanent Address" />
                    <TextField
                      placeholder="E.g. House No., Street, Area, City, State"
                      value={permAddress}
                      onChangeText={setPermAddress}
                      multiline
                      style={styles.textArea}
                    />

                    <Label text="Present Address" />
                    <TextField
                      placeholder="E.g. House No., Street, Area, City, State"
                      value={presAddress}
                      onChangeText={setPresAddress}
                      multiline
                      style={styles.textArea}
                    />
                  </View>
                )}

                {/* ================= STEP 2: ACADEMIC INFO ================= */}
                {currentStep === 2 && (
                  <View>
                    <Text style={styles.sectionHeading}>Academic Details</Text>

                    <View style={shared.row}>
                      <View style={shared.colL}>
                        <Label text="Form Type *" />
                        <Dropdown
                          value={formType}
                          options={['New', 'Renewal']}
                          onSelect={setFormType}
                        />
                      </View>
                      <View style={shared.col}>
                        <Label text="Course of Study *" />
                        <Dropdown
                          value={courseOfStudy}
                          options={courseOptions}
                          onSelect={setCourseOfStudy}
                        />
                      </View>
                    </View>

                    {loadingCourses && (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator
                          size="small"
                          color={colors.primary}
                        />
                        <Text style={styles.loadingText}>
                          Loading courses...
                        </Text>
                      </View>
                    )}

                    <View style={shared.row}>
                      <View style={shared.colL}>
                        <Label text="Course Duration" />
                        <TextField
                          placeholder="e.g. 4 Years"
                          value={courseDuration}
                          onChangeText={setCourseDuration}
                        />
                      </View>
                      <View style={shared.col}>
                        <Label text="Semester / Year" />
                        <TextField
                          placeholder="e.g. 3rd Semester"
                          value={semesterYear}
                          onChangeText={setSemesterYear}
                        />
                      </View>
                    </View>

                    <View style={shared.row}>
                      <View style={shared.colL}>
                        <Label text="Present Class" />
                        <TextField
                          placeholder="e.g. 2nd Year"
                          value={presentClass}
                          onChangeText={setPresentClass}
                        />
                      </View>
                      <View style={shared.col}>
                        <Label text="Institution Name *" />
                        <TextField
                          placeholder="Name of institution"
                          value={institutionName}
                          onChangeText={setInstitutionName}
                        />
                      </View>
                    </View>

                    <View style={shared.row}>
                      <View style={shared.colL}>
                        <Label text="Admission Fees (Rs.)" />
                        <TextField
                          placeholder="e.g. 25000"
                          value={admissionFees}
                          onChangeText={setAdmissionFees}
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={shared.col}>
                        <Label text="Total Annual Fees (₹)" />
                        <TextField
                          placeholder="e.g. 85000"
                          value={annualFees}
                          onChangeText={setAnnualFees}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  </View>
                )}

                {/* ================= STEP 3: FAMILY INFO ================= */}
                {currentStep === 3 && (
                  <View>
                    <Text style={styles.sectionHeading}>Family Details</Text>

                    <View style={shared.row}>
                      <View style={shared.colL}>
                        <Label text="Father Name" />
                        <TextField
                          placeholder="Enter father's name"
                          value={fatherName}
                          onChangeText={setFatherName}
                        />
                      </View>
                      <View style={shared.col}>
                        <Label text="Father Annual Income (Rs)" />
                        <TextField
                          placeholder="Enter annual income"
                          value={fatherIncome}
                          onChangeText={setFatherIncome}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>

                    <View style={shared.row}>
                      <View style={shared.colL}>
                        <Label text="Mother Name" />
                        <TextField
                          placeholder="Enter mother's name"
                          value={motherName}
                          onChangeText={setMotherName}
                        />
                      </View>
                      <View style={shared.col}>
                        <Label text="Mother Annual Income (Rs)" />
                        <TextField
                          placeholder="Enter annual income"
                          value={motherIncome}
                          onChangeText={setMotherIncome}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>

                    <View style={shared.row}>
                      <View style={shared.colL}>
                        <Label text="Guardian Name" />
                        <TextField
                          placeholder="Enter guardian's name"
                          value={guardianName}
                          onChangeText={setGuardianName}
                        />
                      </View>
                      <View style={shared.col}>
                        <Label text="Guardian Relationship" />
                        <TextField
                          placeholder="Relationship"
                          value={guardianRelation}
                          onChangeText={setGuardianRelation}
                        />
                      </View>
                    </View>
                  </View>
                )}

                {/* ================= STEP 4: BANK DETAILS ================= */}
                {currentStep === 4 && (
                  <View>
                    <Text style={styles.sectionHeading}>
                      Bank Account Details
                    </Text>

                    <Label text="Account Holder Name" />
                    <TextField
                      placeholder="Enter account holder's name"
                      value={accHolderName}
                      onChangeText={setAccHolderName}
                      style={styles.inputGap}
                    />

                    <Label text="Account Number" />
                    <TextField
                      placeholder="Enter bank account number"
                      value={accNumber}
                      onChangeText={setAccNumber}
                      keyboardType="numeric"
                      style={styles.inputGap}
                    />

                    <Label text="IFSC Code" />
                    <TextField
                      placeholder="Enter IFSC code"
                      value={ifscCode}
                      onChangeText={setIfscCode}
                      style={styles.inputGap}
                    />

                    <Label text="Bank Name & Branch" />
                    <TextField
                      placeholder="Enter bank name and branch"
                      value={bankBranch}
                      onChangeText={setBankBranch}
                      style={styles.inputGap}
                    />
                  </View>
                )}

                {/* ================= STEP 5: EDUCATION HISTORY ================= */}
                {currentStep === 5 && (
                  <View>
                    <View style={styles.subHeaderRow}>
                      <Text style={styles.sectionHeading}>
                        Education History
                      </Text>
                      <TouchableOpacity
                        style={styles.addRecordBtn}
                        onPress={addEduRecord}
                      >
                        <Icon name="plus" size={16} color={colors.white} />
                        <Text style={styles.addRecordText}>Add Record</Text>
                      </TouchableOpacity>
                    </View>

                    {eduRecords.map((rec, index) => (
                      <View key={rec.id} style={styles.dynamicCard}>
                        <Text style={styles.cardIndexTitle}>
                          Record {index + 1}
                        </Text>

                        <Label text="Board / University" />
                        <TextField
                          placeholder="Enter board or university name"
                          value={rec.board}
                          onChangeText={v =>
                            updateEduRecord(rec.id, 'board', v)
                          }
                          style={styles.inputGap}
                        />

                        <Label text="Class / Course" />
                        <TextField
                          placeholder="Enter class or course name"
                          value={rec.course}
                          onChangeText={v =>
                            updateEduRecord(rec.id, 'course', v)
                          }
                          style={styles.inputGap}
                        />

                        <View style={shared.row}>
                          <View style={shared.colL}>
                            <Label text="Passing Year" />
                            <TextField
                              placeholder="Passing year"
                              value={rec.passingYear}
                              onChangeText={v =>
                                updateEduRecord(rec.id, 'passingYear', v)
                              }
                              keyboardType="numeric"
                            />
                          </View>
                          <View style={shared.col}>
                            <Label text="Division" />
                            <TextField
                              placeholder="Division"
                              value={rec.division}
                              onChangeText={v =>
                                updateEduRecord(rec.id, 'division', v)
                              }
                            />
                          </View>
                        </View>

                        <Label text="Percentage / CGPA" />
                        <TextField
                          placeholder="Enter percentage or CGPA"
                          value={rec.percentage}
                          onChangeText={v =>
                            updateEduRecord(rec.id, 'percentage', v)
                          }
                          style={styles.inputGap}
                        />
                      </View>
                    ))}
                  </View>
                )}

                {/* ================= STEP 6: SIBLINGS / STRINGS ================= */}
                {currentStep === 6 && (
                  <View>
                    <View style={styles.subHeaderRow}>
                      <Text style={styles.sectionHeading}>
                        Siblings Details
                      </Text>
                      <TouchableOpacity
                        style={styles.addRecordBtn}
                        onPress={addSibling}
                      >
                        <Icon name="plus" size={16} color={colors.white} />
                        <Text style={styles.addRecordText}>Add Sibling</Text>
                      </TouchableOpacity>
                    </View>

                    {siblings.map((sib, index) => (
                      <View key={sib.id} style={styles.dynamicCard}>
                        <Text style={styles.cardIndexTitle}>
                          Sibling {index + 1}
                        </Text>

                        <Label text="Name" />
                        <TextField
                          placeholder="Enter sibling's name"
                          value={sib.name}
                          onChangeText={v => updateSibling(sib.id, 'name', v)}
                          style={styles.inputGap}
                        />

                        <Label text="Class" />
                        <TextField
                          placeholder="Enter class or course"
                          value={sib.classCourse}
                          onChangeText={v =>
                            updateSibling(sib.id, 'classCourse', v)
                          }
                          style={styles.inputGap}
                        />

                        <Label text="Institute" />
                        <TextField
                          placeholder="Institute name"
                          value={sib.institute}
                          onChangeText={v =>
                            updateSibling(sib.id, 'institute', v)
                          }
                          style={styles.inputGap}
                        />

                        <Label text="Wazifa Granted?" />
                        <Dropdown
                          value={sib.wazifaGranted}
                          options={['No', 'Yes']}
                          onSelect={v =>
                            updateSibling(sib.id, 'wazifaGranted', v)
                          }
                        />
                      </View>
                    ))}
                  </View>
                )}

                {/* ================= STEP 7: DECLARATIONS ================= */}
                {currentStep === 7 && (
                  <View>
                    <Text style={styles.sectionHeading}>Declarations</Text>

                    <View style={styles.declarationBox}>
                      <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => setDecl1(!decl1)}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            decl1 && styles.checkboxChecked,
                          ]}
                        >
                          {decl1 && (
                            <Icon name="check" size={14} color={colors.white} />
                          )}
                        </View>
                        <Text style={styles.checkboxLabel}>
                          I certify that all the information provided is true
                          and correct to the best of my knowledge.
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.declarationBox}>
                      <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => setDecl2(!decl2)}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            decl2 && styles.checkboxChecked,
                          ]}
                        >
                          {decl2 && (
                            <Icon name="check" size={14} color={colors.white} />
                          )}
                        </View>
                        <Text style={styles.checkboxLabel}>
                          I understand that providing false information will
                          result in cancellation of my application and legal
                          action.
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.alertBox}>
                      <Icon
                        name="information-outline"
                        size={20}
                        color={colors.primary}
                        style={styles.alertIcon}
                      />
                      <Text style={styles.alertText}>
                        Please review all your information before submitting.
                        You can go back to correct any mistakes.
                      </Text>
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Footer Buttons */}
              <View style={shared.footer}>
                <GrayButton
                  title={currentStep === 1 ? 'Cancel' : '← Back'}
                  onPress={handleBackStep}
                  disabled={submitting}
                  style={styles.cancelBtn}
                />
                <GreenButton
                  title={
                    submitting
                      ? 'Submitting...'
                      : currentStep === 7
                      ? 'Submit Application'
                      : 'Next →'
                  }
                  onPress={handleNext}
                  disabled={submitting}
                  style={styles.nextBtn}
                />
              </View>
            </KeyboardAvoidingView>
          </Body>
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
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: wp('4%'),
    paddingTop: 14,
    paddingBottom: 24,
    marginTop: 30,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  stepItem: { alignItems: 'center', flex: 1 },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleActive: { backgroundColor: colors.primary },
  stepCirclePassed: { backgroundColor: colors.success },
  stepNoText: { fontSize: 10, fontFamily: FontFamily.bold, color: '#6B7280' },
  stepNoTextActive: { color: colors.white },
  stepTitleText: {
    fontSize: 9,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
    textAlign: 'center',
  },
  stepTitleTextActive: { fontFamily: FontFamily.bold, color: colors.primary },
  sectionHeading: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bold,
    color: colors.TitleColor,
    marginBottom: 10,
  },
  textArea: { height: 72, paddingTop: 8, alignItems: 'flex-start' },
  inputGap: { marginBottom: 12 },
  subHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addRecordText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: colors.white,
    marginLeft: 4,
  },
  dynamicCard: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  cardIndexTitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: colors.primary,
    marginBottom: 8,
  },
  cancelBtn: { flex: 1, marginRight: 10 },
  nextBtn: { flex: 1.5 },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    marginBottom: 12,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
  },
  declarationBox: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
    backgroundColor: colors.white,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: colors.TitleColor,
    lineHeight: 20,
  },
  alertBox: {
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  alertText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});

export default AddWazifaApplicationScreen;
