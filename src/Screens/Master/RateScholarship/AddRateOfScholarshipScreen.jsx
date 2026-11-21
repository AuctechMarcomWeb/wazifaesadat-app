import React, { useState, useEffect, useMemo } from 'react';

import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';

import colors from '../../../themes/colors';
import AppLayout from '../../../components/AppLayout/AppLayout';
import BackHeader from '../../../components/BackHeader/BackHeader';

import {
  Body,
  Label,
  TextField,
  Dropdown,
  GreenButton,
  GrayButton,
} from '../../../components/Formparts';

import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import {
  createScholarshipRate,
  updateScholarshipRate,
  getTenureYears,
  getScholarshipRates,
} from '../../../api/masters';

const COURSE_TYPE_OPTIONS = ['Junior', 'Senior'];
const STATUS_OPTIONS = ['Active', 'Inactive'];

const INITIAL_FORM = {
  courseType: '',
  name: '',
  ratePerMonth: '',
  amountPerYear: '',
  session: '',
  isActive: true,
};

// Handles both Axios response and already-unwrapped API response.
const extractArray = response => {
  let current = response;

  for (let i = 0; i < 6; i++) {
    if (Array.isArray(current)) {
      return current;
    }

    if (!current || typeof current !== 'object') {
      break;
    }

    if (Array.isArray(current.data)) {
      return current.data;
    }

    current = current.data;
  }

  return [];
};

const extractTotalPages = response => {
  let current = response;

  for (let i = 0; i < 6; i++) {
    if (!current || typeof current !== 'object') {
      break;
    }

    if (current.totalPages != null) {
      return Number(current.totalPages) || 1;
    }

    current = current.data;
  }

  return 1;
};

const AddRateOfScholarshipScreen = ({ navigation, route }) => {
  const scholarshipRateData = route?.params?.scholarshipRateData || null;

  const isEdit = !!scholarshipRateData;

  const [form, setForm] = useState({ ...INITIAL_FORM });

  const [tenureYears, setTenureYears] = useState([]);
  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(false);
  const [fetchingDropdowns, setFetchingDropdowns] = useState(true);

  // Fetch Session and Course data
  useEffect(() => {
    let isMounted = true;

    const loadDropdownData = async () => {
      try {
        setFetchingDropdowns(true);

        const [tenureResult, firstCourseResult] = await Promise.all([
          getTenureYears(),
          getScholarshipRates(1, 50),
        ]);

        const tenureList = extractArray(tenureResult);

        let courseList = extractArray(firstCourseResult);

        const totalPages = extractTotalPages(firstCourseResult);

        // Fetch remaining pages if available
        if (totalPages > 1) {
          const remainingRequests = [];

          for (let page = 2; page <= totalPages; page++) {
            remainingRequests.push(getScholarshipRates(page, 50));
          }

          const remainingResults = await Promise.all(remainingRequests);

          remainingResults.forEach(result => {
            const pageData = extractArray(result);
            courseList = [...courseList, ...pageData];
          });
        }

        if (isMounted) {
          setTenureYears(tenureList);
          setCourses(courseList);
        }
      } catch (error) {
        console.error(
          'Scholarship Dropdown API Error:',
          error?.response?.data || error,
        );

        if (isMounted) {
          Alert.alert('Error', 'Failed to load Course and Session options.');
        }
      } finally {
        if (isMounted) {
          setFetchingDropdowns(false);
        }
      }
    };

    loadDropdownData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Add / Edit Form Initialization
  useEffect(() => {
    if (isEdit && scholarshipRateData) {
      setForm({
        courseType: scholarshipRateData.courseType || '',
        name: scholarshipRateData.name || '',
        ratePerMonth:
          scholarshipRateData.ratePerMonth != null
            ? String(scholarshipRateData.ratePerMonth)
            : '',
        amountPerYear:
          scholarshipRateData.amountPerYear != null
            ? String(scholarshipRateData.amountPerYear)
            : '',
        session: scholarshipRateData.session || '',
        isActive: scholarshipRateData.isActive !== false,
      });
    } else {
      setForm({ ...INITIAL_FORM });
    }
  }, [isEdit, scholarshipRateData]);

  // Fixed Course Type Options: Junior and Senior
  const courseTypeOptions = COURSE_TYPE_OPTIONS;

  // Filter courses based on selected Course Type and Session
  const filteredCourses = useMemo(() => {
    return courses.filter(item => {
      const matchesCourseType = item.courseType === form.courseType;

      const matchesSession = item.session === form.session;

      return matchesCourseType && matchesSession;
    });
  }, [courses, form.courseType, form.session]);

  // Dynamic Class Options
  const classOptions = useMemo(() => {
    return [...new Set(filteredCourses.map(item => item.name).filter(Boolean))];
  }, [filteredCourses]);

  // Update Form Fields
  const updateField = (key, value) => {
    setForm(prev => ({
      ...prev,
      [key]: key === 'isActive' ? value === 'Active' : value,
    }));
  };

  // Course Type Change
  const handleCourseTypeChange = value => {
    setForm(prev => ({
      ...prev,
      courseType: value,
      name: '',
      ratePerMonth: '',
      amountPerYear: '',
    }));
  };

  // Session Change
  const handleSessionChange = value => {
    setForm(prev => ({
      ...prev,
      session: value,
      name: '',
      ratePerMonth: '',
      amountPerYear: '',
    }));
  };

  // Class Selection - Auto Fill Rates
  const handleClassChange = value => {
    const selectedCourse = filteredCourses.find(item => item.name === value);

    setForm(prev => ({
      ...prev,
      name: value,
      ratePerMonth:
        selectedCourse?.ratePerMonth != null
          ? String(selectedCourse.ratePerMonth)
          : '',
      amountPerYear:
        selectedCourse?.amountPerYear != null
          ? String(selectedCourse.amountPerYear)
          : '',
    }));
  };

  // Save / Update Scholarship Rate
  const handleSave = async () => {
    if (loading) {
      return;
    }

    if (!form.courseType) {
      Alert.alert('Validation Error', 'Please select Course Type.');
      return;
    }

    if (!form.name.trim()) {
      Alert.alert('Validation Error', 'Please select Name of Class.');
      return;
    }

    if (form.ratePerMonth.trim() === '') {
      Alert.alert('Validation Error', 'Please enter Rate Per Month.');
      return;
    }

    if (form.amountPerYear.trim() === '') {
      Alert.alert('Validation Error', 'Please enter Amount Per Year.');
      return;
    }

    if (
      !Number.isFinite(Number(form.ratePerMonth)) ||
      Number(form.ratePerMonth) < 0
    ) {
      Alert.alert('Validation Error', 'Please enter a valid monthly rate.');
      return;
    }

    if (
      !Number.isFinite(Number(form.amountPerYear)) ||
      Number(form.amountPerYear) < 0
    ) {
      Alert.alert('Validation Error', 'Please enter a valid yearly amount.');
      return;
    }

    if (!form.session) {
      Alert.alert('Validation Error', 'Please select Session.');
      return;
    }

    const payload = {
      courseType: form.courseType,
      name: form.name.trim(),
      ratePerMonth: Number(form.ratePerMonth),
      amountPerYear: Number(form.amountPerYear),
      session: form.session,
      isActive: form.isActive,
    };

    setLoading(true);

    try {
      if (isEdit) {
        const id = scholarshipRateData?._id || scholarshipRateData?.id;

        if (!id) {
          throw new Error('Scholarship Rate ID not found.');
        }

        await updateScholarshipRate(id, payload);
      } else {
        await createScholarshipRate(payload);
      }

      Alert.alert(
        'Success',
        isEdit
          ? 'Scholarship Rate updated successfully!'
          : 'Scholarship Rate added successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error) {
      console.error(
        'Scholarship Rate Save Error:',
        error?.response?.data || error,
      );

      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          error?.message ||
          'Failed to save Scholarship Rate. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title={
            isEdit ? 'Edit Rate of Scholarship' : 'Add Rate of Scholarship'
          }
          onBack={() => navigation.goBack()}
        />

        <View style={styles.body}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <Body>
                {/* Course Type */}
                <Label text="Course Type *" />

                <Dropdown
                  value={form.courseType}
                  options={courseTypeOptions}
                  onSelect={handleCourseTypeChange}
                  style={styles.mb}
                  enabled={!loading && !fetchingDropdowns}
                />

                {/* Name of Class */}
                {/* <Label text="Name of Class *" />

                <Dropdown
                  value={form.name}
                  options={classOptions}
                  onSelect={handleClassChange}
                  style={styles.mb}
                  enabled={
                    !loading &&
                    !fetchingDropdowns &&
                    !!form.courseType &&
                    !!form.session
                  }
                /> */}
                <Label text="Name of Class *" />

                <TextField
                  placeholder="Enter Name of Class"
                  value={form.name}
                  onChangeText={val => updateField('name', val)}
                  style={styles.mb}
                  editable={!loading}
                />

                {/* Rate Per Month */}
                <Label text="Rate Per Month *" />

                <TextField
                  placeholder="Enter Rate Per Month"
                  value={form.ratePerMonth}
                  onChangeText={val => updateField('ratePerMonth', val)}
                  keyboardType="numeric"
                  style={styles.mb}
                  editable={!loading}
                />

                {/* Amount Per Year */}
                <Label text="Amount Per Year (Rs.) *" />

                <TextField
                  placeholder="Enter Amount Per Year"
                  value={form.amountPerYear}
                  onChangeText={val => updateField('amountPerYear', val)}
                  keyboardType="numeric"
                  style={styles.mb}
                  editable={!loading}
                />

                {/* Session */}
                <Label text="Session *" />

                <Dropdown
                  value={form.session}
                  options={tenureYears.map(item => item.name)}
                  onSelect={handleSessionChange}
                  style={styles.mb}
                  enabled={!loading && !fetchingDropdowns}
                />

                {/* Status */}
                <Label text="Status" />

                <Dropdown
                  value={form.isActive ? 'Active' : 'Inactive'}
                  options={STATUS_OPTIONS}
                  onSelect={val => updateField('isActive', val)}
                  style={styles.mb}
                  enabled={!loading}
                />

                {fetchingDropdowns && (
                  <ActivityIndicator
                    size="small"
                    color={colors.appGreen}
                    style={{ marginVertical: 12 }}
                  />
                )}

                {/* Action Buttons */}
                <View style={[styles.btnRow, { marginTop: 20 }]}>
                  <GrayButton
                    title="Cancel"
                    onPress={() => navigation.goBack()}
                    style={styles.cancelBtn}
                    disabled={loading}
                  />

                  <GreenButton
                    title={
                      loading
                        ? 'Saving...'
                        : isEdit
                        ? 'Update Scholarship Rate'
                        : 'Save Scholarship Rate'
                    }
                    icon="check"
                    onPress={handleSave}
                    style={styles.saveBtn}
                    disabled={loading || fetchingDropdowns}
                  />

                  {loading && (
                    <ActivityIndicator
                      size="small"
                      color={colors.appGreen}
                      style={styles.loader}
                    />
                  )}
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
    paddingHorizontal: wp('4%'),
    paddingTop: 16,
    paddingBottom: 30,
    marginTop: 25,
  },

  mb: {
    marginBottom: 12,
  },

  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },

  cancelBtn: {
    flex: 1,
    height: 50,
  },

  saveBtn: {
    flex: 1,
    height: 50,
  },

  loader: {
    position: 'absolute',
    right: wp('5%'),
  },
});

export default AddRateOfScholarshipScreen;
