import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Linking,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import colors from '../../themes/colors';
import { FontFamily, FontSize } from '../../themes/typography';
import { getScholarshipFormLookup } from '../../api/scholarship';

/* ─── Contact-not-found panel ─────────────────────────────── */
const NotFoundPanel = ({ wazifaNo }) => (
  <View style={styles.notFoundBox}>
    <View style={styles.notFoundHeader}>
      <Icon name="alert-circle" size={15} color="#DC2626" />
      <Text style={styles.notFoundTitle}>
        Wazifa No. <Text style={styles.monoText}>{wazifaNo}</Text> not found in
        our records.
      </Text>
    </View>

    <Text style={styles.notFoundDesc}>
      If you believe this is an error or your record hasn&apos;t been updated
      yet, please contact the{' '}
      <Text style={styles.boldText}>Anjuman Head Office</Text> directly:
    </Text>

    <View style={styles.contactList}>
      <TouchableOpacity
        onPress={() => Linking.openURL('mailto:headoffice@anjumanaligarh.org')}
        activeOpacity={0.7}
      >
        <Text style={styles.contactItem}>
          📧 <Text style={styles.boldText}>Email: </Text>
          <Text style={styles.linkText}>headoffice@anjumanaligarh.org</Text>
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => Linking.openURL('tel:+919997019772')}
        activeOpacity={0.7}
      >
        <Text style={styles.contactItem}>
          📞 <Text style={styles.boldText}>Phone / WhatsApp: </Text>
          <Text style={styles.linkText}>+91 99970 19772</Text>
        </Text>
      </TouchableOpacity>

      <Text style={styles.contactItem}>
        🏢 <Text style={styles.boldText}>Address: </Text>
        Wazifa Manzil, Ahmad Nagar, Aligarh – 202002, Uttar Pradesh, India
      </Text>
    </View>

    <Text style={styles.officeHoursText}>
      Office hours: Mon – Sat, 10:00 AM – 5:00 PM IST. Please quote your full
      name and previous institution while contacting us.
    </Text>
  </View>
);

/* ─── Prefill preview table ───────────────────────────────── */
const PrefillTable = ({ record }) => {
  const formattedDob = record?.dateOfBirth
    ? new Date(record.dateOfBirth).toLocaleDateString('en-IN')
    : '—';

  const classSemester =
    [record?.presentClass, record?.semester].filter(Boolean).join(' / ') || '—';

  const headers = [
    '#',
    'Wazifa No.',
    'Name',
    'Date of Birth',
    "Father's Name",
    'Class / Semester',
  ];

  const colWidths = [44, 110, 150, 110, 150, 140];

  return (
    <View style={styles.prefillWrap}>
      <View style={styles.foundHeader}>
        <Icon name="check-circle" size={14} color="#15803D" />
        <Text style={styles.foundTitle}>
          Record found — please verify your details below.
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        style={styles.tableScroll}
      >
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeaderRow}>
            {headers.map((h, i) => (
              <View
                key={h}
                style={[
                  styles.tableHeaderCell,
                  { width: colWidths[i] },
                  i === 0 && styles.centerCell,
                ]}
              >
                <Text style={styles.tableHeaderText}>{h}</Text>
              </View>
            ))}
          </View>

          {/* Table Body Row */}
          <View style={styles.tableBodyRow}>
            <View
              style={[
                styles.tableCell,
                styles.centerCell,
                { width: colWidths[0] },
              ]}
            >
              <Icon name="check-circle" size={16} color="#16A34A" />
            </View>
            <View style={[styles.tableCell, { width: colWidths[1] }]}>
              <Text style={styles.tableCellText}>
                {record?.wazifaNo || '—'}
              </Text>
            </View>
            <View style={[styles.tableCell, { width: colWidths[2] }]}>
              <Text style={styles.tableCellText}>
                {record?.studentName || '—'}
              </Text>
            </View>
            <View style={[styles.tableCell, { width: colWidths[3] }]}>
              <Text style={styles.tableCellText}>{formattedDob}</Text>
            </View>
            <View style={[styles.tableCell, { width: colWidths[4] }]}>
              <Text style={styles.tableCellText}>
                {record?.fatherName || '—'}
              </Text>
            </View>
            <View style={[styles.tableCell, { width: colWidths[5] }]}>
              <Text style={styles.tableCellText}>{classSemester}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
const InstructionsModal = ({ visible = true, onClose, onProceed }) => {
  const [agreed, setAgreed] = useState(false);
  const [applicantType, setApplicantType] = useState(''); // "New" | "Renewal"

  /* ── Renewal-specific state ── */
  const [wazifaNo, setWazifaNo] = useState('');
  const [lookupStatus, setLookupStatus] = useState('idle'); // "idle" | "loading" | "found" | "notfound"
  const [wazifaRecord, setWazifaRecord] = useState(null);

  /* ── Reset state when modal opens ── */
  React.useEffect(() => {
    if (visible) {
      setAgreed(false);
      setApplicantType('');
      setWazifaNo('');
      setLookupStatus('idle');
      setWazifaRecord(null);
    }
  }, [visible]);

  /* ── API Lookup ── */
  const handleLookup = async () => {
    const trimmed = wazifaNo.trim();

    if (!trimmed) return;

    setLookupStatus('loading');
    setWazifaRecord(null);
    setAgreed(false);

    try {
      const response = await getScholarshipFormLookup(trimmed);

      if (response?.success && response?.data) {
        setWazifaRecord(response.data);
        setLookupStatus('found');
      } else {
        setLookupStatus('notfound');
      }
    } catch (error) {
      console.log(
        'Wazifa Lookup Error:',
        error?.response?.data || error.message,
      );

      setLookupStatus('notfound');
    }
  };

  /* ── Reset renewal state when switching type ── */
  const handleTypeChange = type => {
    setApplicantType(type);
    setWazifaNo('');
    setLookupStatus('idle');
    setWazifaRecord(null);
    setAgreed(false);
  };

  /* ── Proceed gate ── */
  const canProceed =
    agreed &&
    applicantType !== '' &&
    (applicantType === 'New' || lookupStatus === 'found');

  const handleProceed = () => {
    if (!canProceed) return;
    onProceed?.(applicantType, wazifaRecord);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* ── Modal Box ── */}
        <View style={styles.modalBox}>
          {/* ── Blue Header ── */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>NOTE / INSTRUCTIONS</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="x" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* ── Scrollable Body ── */}
          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {/* Instruction 1 (Red Highlighted) */}
            <View style={styles.listItem}>
              <Text style={styles.listNumberRed}>1.</Text>
              <View style={styles.listTextWrap}>
                <Text style={styles.redBoldText}>
                  *After successfully submitting the online form, applicants
                  must take a printout of the application form and attach the
                  following documents:
                </Text>

                <View style={styles.subList}>
                  <Text style={styles.redSemiBoldText}>1. Aadhaar Card</Text>
                  <Text style={styles.redSemiBoldText}>2. Bank Passbook</Text>
                  <Text style={styles.redSemiBoldText}>
                    3. Last Year Marksheet
                  </Text>
                  <Text style={styles.redSemiBoldText}>
                    4. Bonafide Certificate / Fee Slip
                  </Text>
                </View>

                <Text style={[styles.redSemiBoldText, { marginTop: 4 }]}>
                  All attached documents must be duly attested and signed by: •
                  Local Secretary. Thereafter, the complete application form
                  along with all required documents must be sent by post/courier
                  to the Anjuman Head Office, Wazifa Manzil, Ahmad Nagar,
                  Aligarh – 202002. Mob.: 9997019772
                </Text>
              </View>
            </View>

            {/* Instruction 2 */}
            <View style={styles.listItem}>
              <Text style={styles.listNumber}>2.</Text>
              <Text style={styles.listText}>
                <Text style={styles.boldText}>Jadeed (New) Applicants</Text> are
                those who are applying wazifa for the first time or applying for
                a new course, for example first year of B.A./B.Sc./B.Com etc.{' '}
                <Text style={styles.boldText}>Tajdeed (Old) Applicants</Text>{' '}
                are those who have received wazifa for a particular course
                during last session and applying for 2nd &amp; 3rd year of the
                same course during the current academic session.
              </Text>
            </View>

            {/* Instruction 3 */}
            <View style={styles.listItem}>
              <Text style={styles.listNumber}>3.</Text>
              <Text style={styles.listText}>
                Normally scholarships are granted for students studying in class
                XI, graduate &amp; post-graduate courses. However applications
                from financially weak students may be considered under special
                conditions.
              </Text>
            </View>

            {/* Instruction 4 */}
            <View style={styles.listItem}>
              <Text style={styles.listNumber}>4.</Text>
              <Text style={styles.listText}>
                Percentage of marks obtained in the last examination shall be
                the criteria for award of scholarship in each category. However,
                cases of orphans shall be considered on priority basis.
              </Text>
            </View>

            {/* Instruction 5 */}
            <View style={styles.listItem}>
              <Text style={styles.listNumber}>5.</Text>
              <Text style={styles.listText}>
                Use capital letters while filling columns numbers 1-11.
              </Text>
            </View>

            {/* Instruction 6 */}
            <View style={styles.listItem}>
              <Text style={styles.listNumber}>6.</Text>
              <Text style={styles.listText}>
                Photocopy of high school mark sheet &amp; last examination
                passed should be duly attested by Local Secretary of Anjuman or
                a Gazetted Officer.
              </Text>
            </View>

            {/* Instruction 7 */}
            <View style={styles.listItem}>
              <Text style={styles.listNumber}>7.</Text>
              <Text style={styles.listText}>
                Bonafide certificate from the present Institution/fee receipt or
                any document ensuring admission of the student during the
                current session should be enclosed.
              </Text>
            </View>

            {/* Instruction 8 */}
            <View style={styles.listItem}>
              <Text style={styles.listNumber}>8.</Text>
              <Text style={styles.listText}>
                Applicants are required to keep a photocopy of the filled
                application form as file proof.
              </Text>
            </View>

            {/* Instruction 9 */}
            <View style={styles.listItem}>
              <Text style={styles.listNumber}>9.</Text>
              <Text style={styles.listText}>
                Applications belonging to cities where no Local Secretary of
                Anjuman is appointed must attach an application stating that
                there is no Local Secretary available in their city; therefore,
                Local Secretary signature could not be obtained.
              </Text>
            </View>
          </ScrollView>

          {/* ── Footer Section ── */}
          <View style={styles.footer}>
            {/* Radio Buttons */}
            <View>
              <Text style={styles.sectionLabel}>
                Select Applicant Type:{' '}
                <Text style={styles.requiredStar}>*</Text>
              </Text>

              <View style={styles.radioGroup}>
                {/* Jadeed — New */}
                <TouchableOpacity
                  style={styles.radioOption}
                  activeOpacity={0.7}
                  onPress={() => handleTypeChange('New')}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      applicantType === 'New' && styles.radioCircleSelected,
                    ]}
                  >
                    {applicantType === 'New' && (
                      <View style={styles.radioDot} />
                    )}
                  </View>
                  <Text style={styles.radioLabel}>
                    Jadeed{' '}
                    <Text style={styles.radioSubLabel}>(New Applicant)</Text>
                  </Text>
                </TouchableOpacity>

                {/* Tajdeed — Renewal */}
                <TouchableOpacity
                  style={styles.radioOption}
                  activeOpacity={0.7}
                  onPress={() => handleTypeChange('Renewal')}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      applicantType === 'Renewal' && styles.radioCircleSelected,
                    ]}
                  >
                    {applicantType === 'Renewal' && (
                      <View style={styles.radioDot} />
                    )}
                  </View>
                  <Text style={styles.radioLabel}>
                    Tajdeed{' '}
                    <Text style={styles.radioSubLabel}>(Old Applicant)</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Renewal: Wazifa No. Lookup */}
            {applicantType === 'Renewal' && (
              <View style={styles.lookupSection}>
                <Text style={styles.sectionLabel}>
                  Enter your Wazifa No.:{' '}
                  <Text style={styles.requiredStar}>*</Text>
                </Text>

                <View style={styles.searchRow}>
                  <TextInput
                    value={wazifaNo}
                    onChangeText={text => {
                      setWazifaNo(text);
                      setLookupStatus('idle');
                      setWazifaRecord(null);
                      setAgreed(false);
                    }}
                    onSubmitEditing={handleLookup}
                    returnKeyType="search"
                    placeholder="e.g. WZ-2024-00123"
                    placeholderTextColor="#9CA3AF"
                    style={styles.searchInput}
                  />

                  <TouchableOpacity
                    onPress={handleLookup}
                    disabled={!wazifaNo.trim() || lookupStatus === 'loading'}
                    activeOpacity={0.8}
                    style={[
                      styles.searchBtn,
                      (!wazifaNo.trim() || lookupStatus === 'loading') &&
                        styles.searchBtnDisabled,
                    ]}
                  >
                    {lookupStatus === 'loading' ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Icon name="search" size={14} color="#FFFFFF" />
                    )}
                    <Text style={styles.searchBtnText}>
                      {lookupStatus === 'loading' ? 'Searching…' : 'Search'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Not Found */}
                {lookupStatus === 'notfound' && (
                  <NotFoundPanel wazifaNo={wazifaNo.trim()} />
                )}

                {/* Found — Prefill Table */}
                {lookupStatus === 'found' && wazifaRecord && (
                  <PrefillTable record={wazifaRecord} />
                )}
              </View>
            )}

            {/* Agreement Checkbox */}
            {(applicantType === 'New' || lookupStatus === 'found') && (
              <TouchableOpacity
                style={styles.checkboxRow}
                activeOpacity={0.7}
                onPress={() => setAgreed(prev => !prev)}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    agreed && styles.checkboxBoxChecked,
                  ]}
                >
                  {agreed && <Icon name="check" size={13} color="#FFFFFF" />}
                </View>
                <Text style={styles.checkboxText}>
                  Yes, I have read and understood all the instructions mentioned
                  above.
                </Text>
              </TouchableOpacity>
            )}

            {/* Proceed Button */}
            <TouchableOpacity
              disabled={!canProceed}
              onPress={handleProceed}
              activeOpacity={0.85}
              style={[
                styles.proceedBtn,
                !canProceed && styles.proceedBtnDisabled,
              ]}
            >
              <Text style={styles.proceedBtnText}>Proceed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

/* ══════════════════════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 24,
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },

  modalBox: {
    width: '100%',
    maxWidth: 680,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },

  /* Header */
  header: {
    backgroundColor: '#087A43',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
    fontSize: 14.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  closeBtn: {
    padding: 2,
  },

  /* Scrollable Instructions */
  bodyScroll: {
    flexGrow: 0,
  },

  bodyContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 11,
  },

  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  listNumber: {
    width: 20,
    fontFamily: FontFamily.semiBold,
    fontSize: 12.5,
    color: '#1F2937',
    lineHeight: 19,
  },

  listNumberRed: {
    width: 20,
    fontFamily: FontFamily.bold,
    fontSize: 12.5,
    color: '#e74c3c',
    lineHeight: 19,
  },

  listTextWrap: {
    flex: 1,
  },

  listText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 12.5,
    color: '#1F2937',
    lineHeight: 19,
  },

  boldText: {
    fontFamily: FontFamily.bold,
    color: '#111827',
  },

  redBoldText: {
    fontFamily: FontFamily.bold,
    fontSize: 12.5,
    color: '#e74c3c',
    lineHeight: 19,
  },

  redSemiBoldText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12.5,
    color: '#e74c3c',
    lineHeight: 19,
  },

  subList: {
    paddingLeft: 12,
    marginTop: 3,
    gap: 2,
  },

  /* Footer */
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },

  sectionLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    color: '#374151',
    marginBottom: 6,
  },

  requiredStar: {
    color: '#e74c3c',
  },

  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 20,
  },

  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.8,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  radioCircleSelected: {
    borderColor: '#1565c0',
  },

  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#1565c0',
  },

  radioLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12.5,
    color: '#1F2937',
  },

  radioSubLabel: {
    fontFamily: FontFamily.regular,
    color: '#6B7280',
  },

  /* Lookup Section */
  lookupSection: {
    marginTop: 2,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 12,
    fontFamily: FontFamily.regular,
    fontSize: 12.5,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },

  searchBtn: {
    height: 40,
    backgroundColor: '#087A43',
    paddingHorizontal: 14,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  searchBtnDisabled: {
    backgroundColor: '#087A43',
  },

  searchBtnText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.semiBold,
    fontSize: 12.5,
  },

  /* Not Found Panel */
  notFoundBox: {
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    padding: 12,
  },

  notFoundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },

  notFoundTitle: {
    flex: 1,
    color: '#DC2626',
    fontFamily: FontFamily.bold,
    fontSize: 12,
  },

  monoText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  notFoundDesc: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
    marginBottom: 8,
  },

  contactList: {
    gap: 4,
  },

  contactItem: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
  },

  linkText: {
    color: '#2563EB',
    textDecorationLine: 'underline',
  },

  officeHoursText: {
    marginTop: 8,
    fontFamily: FontFamily.regular,
    fontStyle: 'italic',
    fontSize: 11.5,
    color: '#6B7280',
  },

  /* Prefill Table */
  prefillWrap: {
    marginTop: 10,
  },

  foundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },

  foundTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    color: '#15803D',
  },

  tableScroll: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  tableContainer: {
    backgroundColor: '#FFFFFF',
  },

  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#087A43',
  },

  tableHeaderCell: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.2)',
  },

  tableHeaderText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.semiBold,
    fontSize: 11.5,
  },

  tableBodyRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
  },

  tableCell: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRightWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
  },

  centerCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  tableCellText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#374151',
  },

  /* Checkbox */
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },

  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.8,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    backgroundColor: '#FFFFFF',
  },

  checkboxBoxChecked: {
    backgroundColor: '#1565c0',
    borderColor: '#1565c0',
  },

  checkboxText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
  },

  /* Proceed Button */
  proceedBtn: {
    width: '100%',
    paddingVertical: 11,
    borderRadius: 6,
    backgroundColor: '#087A43',
    alignItems: 'center',
    justifyContent: 'center',
  },

  proceedBtnDisabled: {
    backgroundColor: '#a5d6a7',
  },

  proceedBtnText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.semiBold,
    fontSize: 13.5,
  },
});

export default InstructionsModal;
