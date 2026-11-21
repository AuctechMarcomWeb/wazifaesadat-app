import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  StyleSheet,
  FlatList,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import colors from '../themes/colors';
import { FontFamily, FontSize } from '../themes/typography';

const GREEN = '#2E8B3E';
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
const pad = n => String(n).padStart(2, '0');

export const formatDate = d =>
  d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : '';

export const formatNumber = n =>
  String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export const formatRs = n => `₹ ${formatNumber(n)}`;

// 'YYYY-MM-DD' -> Date (no timezone shift)
export const toDateObj = iso => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// 'YYYY-MM-DD' -> '20 Aug 2026'
export const longDate = iso => {
  const d = toDateObj(iso);
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const monthShort = iso => MONTHS[toDateObj(iso).getMonth()];

export const startOfDay = d =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

// ---------------------------------------------------------------
// Layout
// ---------------------------------------------------------------
export const Body = ({ children, style }) => (
  <View style={[styles.body, style]}>{children}</View>
);

export const Label = ({ text, required, style }) => (
  <Text style={[styles.label, style]}>
    {text}
    {required && <Text style={styles.required}> *</Text>}
  </Text>
);

export const Section = ({ title, right, children, style }) => (
  <View style={[styles.sectionWrap, style]}>
    <View style={styles.sectionBar}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {right}
    </View>
    <View style={styles.sectionBody}>{children}</View>
  </View>
);

// ---------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------
export const TextField = ({ icon, style, inputStyle, ...props }) => (
  <View style={[styles.field, style]}>
    {!!icon && (
      <Icon name={icon} size={20} color="#4B5563" style={styles.fieldIcon} />
    )}
    <TextInput
      style={[styles.input, inputStyle]}
      placeholderTextColor={colors.placeHolderColor}
      {...props}
    />
  </View>
);

export const SearchField = ({ style, ...props }) => (
  <TextField icon="magnify" style={style} autoCorrect={false} {...props} />
);

export const Dropdown = ({
  value,
  placeholder = 'Select',
  options = [],
  onSelect,
  icon,
  searchable = false,
  style,
}) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const list =
    searchable && q.trim()
      ? options.filter(o =>
          String(o).toLowerCase().includes(q.trim().toLowerCase()),
        )
      : options;

  const close = () => {
    setOpen(false);
    setQ('');
  };

  const renderItem = ({ item }) => {
    const isSelected = item === value;

    return (
      <TouchableOpacity
        style={[styles.sheetItem, isSelected && styles.sheetItemActive]}
        activeOpacity={0.7}
        onPress={() => {
          onSelect(item);
          close();
        }}
      >
        <Text style={[styles.sheetText, isSelected && styles.sheetTextActive]}>
          {item}
        </Text>

        {isSelected && <Icon name="check" size={18} color={colors.primary} />}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.field, style]}
        activeOpacity={0.8}
        onPress={() => setOpen(true)}
      >
        {!!icon && (
          <Icon
            name={icon}
            size={20}
            color="#4B5563"
            style={styles.fieldIcon}
          />
        )}

        <Text
          style={[styles.fieldText, !value && styles.placeholderText]}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>

        <Icon name="chevron-down" size={20} color="#111827" />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={close}
        >
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            {searchable && (
              <View style={styles.sheetSearch}>
                <Icon name="magnify" size={20} color="#6B7280" />

                <TextInput
                  style={styles.sheetSearchInput}
                  placeholder="Search..."
                  placeholderTextColor={colors.placeHolderColor}
                  value={q}
                  onChangeText={setQ}
                  autoCorrect={false}
                />
              </View>
            )}

            {list.length === 0 ? (
              <Text style={styles.sheetEmpty}>No results</Text>
            ) : (
              <FlatList
                data={list}
                keyExtractor={(item, index) => `${index}-${item}`}
                renderItem={renderItem}
                style={styles.sheetList}
                keyboardShouldPersistTaps="handled"
                initialNumToRender={15}
                maxToRenderPerBatch={15}
                windowSize={7}
                removeClippedSubviews={Platform.OS === 'android'}
                getItemLayout={(data, index) => ({
                  length: 46,
                  offset: 46 * index,
                  index,
                })}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export const DateField = ({
  value,
  onChange,
  placeholder = 'dd/mm/yyyy',
  style,
}) => {
  const [show, setShow] = useState(false);

  const handleChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShow(false);
      if (event.type === 'dismissed' || !date) return;
    }

    if (date) onChange(date);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.field, style]}
        activeOpacity={0.8}
        onPress={() => setShow(true)}
      >
        <Text
          style={[styles.fieldText, !value && styles.placeholderText]}
          numberOfLines={1}
        >
          {value ? formatDate(value) : placeholder}
        </Text>
        <Icon name="calendar-month-outline" size={20} color="#111827" />
      </TouchableOpacity>

      {show && Platform.OS === 'android' && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display="default"
          onChange={handleChange}
        />
      )}

      {show && Platform.OS === 'ios' && (
        <Modal
          transparent
          animationType="slide"
          onRequestClose={() => setShow(false)}
        >
          <View style={styles.iosOverlay}>
            <View style={styles.iosSheet}>
              <TouchableOpacity
                style={styles.iosDone}
                onPress={() => setShow(false)}
              >
                <Text style={styles.iosDoneText}>Done</Text>
              </TouchableOpacity>

              <DateTimePicker
                value={value || new Date()}
                mode="date"
                display="spinner"
                onChange={handleChange}
              />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};

// ---------------------------------------------------------------
// Buttons & badges
// ---------------------------------------------------------------
export const GreenButton = ({ title, onPress, icon, style, disabled }) => (
  <TouchableOpacity
    style={[styles.greenButton, disabled && styles.disabled, style]}
    activeOpacity={0.85}
    onPress={onPress}
    disabled={disabled}
  >
    {!!icon && (
      <Icon name={icon} size={20} color={colors.white} style={styles.btnIcon} />
    )}
    <Text style={styles.greenButtonText}>{title}</Text>
  </TouchableOpacity>
);

export const GrayButton = ({ title, onPress, style, disabled }) => (
  <TouchableOpacity
    style={[styles.grayButton, style]}
    activeOpacity={0.8}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={styles.grayButtonText}>{title}</Text>
  </TouchableOpacity>
);

const BADGE_TONES = {
  Cash: { bg: '#DCEBFA', text: '#1D6FD6' },
  Cheque: { bg: '#D7EAFB', text: '#1D6FD6' },
  UPI: { bg: '#EBDDFB', text: '#7C3AED' },
  Success: { bg: '#DDF3E4', text: '#15803D' },
  Draft: { bg: '#E3EAF2', text: '#4B5F78' },
  Pending: { bg: '#FCEBB6', text: '#B7791F' },
  Failed: { bg: '#FDE2E2', text: '#C81E2D' },
};

export const Badge = ({ text }) => {
  const tone = BADGE_TONES[text] || BADGE_TONES.Cash;

  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.badgeText, { color: tone.text }]}>{text}</Text>
    </View>
  );
};

export const PillTabs = ({ tabs, active, onChange }) => (
  <View style={styles.pillRow}>
    {tabs.map(t => {
      const isActive = t === active;

      return (
        <TouchableOpacity
          key={t}
          style={[styles.pill, isActive && styles.pillActive]}
          activeOpacity={0.85}
          onPress={() => onChange(t)}
        >
          <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
            {t}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

// ---------------------------------------------------------------
// Table
// columns: [{ key, label, flex, align, render(row, index) }]
// ---------------------------------------------------------------
export const DataTable = ({ columns, rows, footer }) => (
  <View style={styles.table}>
    <View style={styles.tableHead}>
      {columns.map(c => (
        <Text
          key={c.key}
          style={[
            styles.tableHeadText,
            { flex: c.flex || 1, textAlign: c.align || 'left' },
          ]}
        >
          {c.label}
        </Text>
      ))}
    </View>

    {rows.map((row, i) => (
      <View key={row.id || i} style={styles.tableRow}>
        {columns.map(c => (
          <View
            key={c.key}
            style={[
              styles.tableCell,
              {
                flex: c.flex || 1,
                alignItems: c.align === 'right' ? 'flex-end' : 'flex-start',
              },
            ]}
          >
            {c.render ? (
              c.render(row, i)
            ) : (
              <Text style={styles.tableCellText}>{String(row[c.key])}</Text>
            )}
          </View>
        ))}
      </View>
    ))}

    {footer}
  </View>
);

// ---------------------------------------------------------------
// Shared screen styles
// ---------------------------------------------------------------
export const shared = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary2,
  },

  scroll: {
    paddingHorizontal: wp('4%'),
    paddingTop: 18,
    paddingBottom: 24,
  },

  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },

  colL: {
    flex: 1,
    marginRight: 10,
  },

  col: {
    flex: 1,
  },

  card: {
    backgroundColor: '#FBFCFB',
    borderWidth: 1,
    borderColor: '#E9EEEB',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },

  footer: {
    flexDirection: 'row',
    paddingHorizontal: wp('4%'),
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    borderTopWidth: 1,
    borderTopColor: '#EEF1EF',
    backgroundColor: colors.white,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },

  emptyText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
    marginTop: 8,
  },
});

const styles = StyleSheet.create({
  // body: {
  //   flex: 1,
  //   marginTop: -24,
  //   backgroundColor: colors.white,
  //   borderTopLeftRadius: 28,
  //   borderTopRightRadius: 28,
  //   overflow: 'hidden',
  // },
  body: {
    flex: 1,
    marginTop: -25,
    backgroundColor: colors.white,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: 'visible',
  },

  label: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semiBold,
    color: '#123B28',
    marginBottom: 6,
  },

  required: {
    color: colors.requiredColor,
  },

  // Section
  sectionWrap: {
    marginBottom: 14,
  },

  sectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2E7D32',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },

  sectionTitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bold,
    color: colors.white,
  },

  sectionBody: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#E1E8E3',
    padding: 12,
    backgroundColor: colors.white,
  },

  // Field
  field: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#D5DDD8',
    borderRadius: 10,
    paddingHorizontal: 12,
  },

  fieldIcon: {
    marginRight: 8,
  },

  fieldText: {
    flex: 1,
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: '#111827',
  },

  placeholderText: {
    color: '#6B7280',
  },

  input: {
    flex: 1,
    height: '100%',
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: '#111827',
    paddingVertical: 0,
  },

  // Dropdown sheet
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  sheet: {
    width: wp('78%'),
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 8,
    elevation: 8,
  },

  sheetSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 6,
    paddingHorizontal: 10,
    height: 44,
    backgroundColor: '#F4F7F5',
    borderRadius: 10,
  },

  sheetSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: '#111827',
    paddingVertical: 0,
  },

  sheetList: {
    height: 320,
    maxHeight: 320,
  },

  sheetEmpty: {
    textAlign: 'center',
    padding: 16,
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
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
    flex: 1,
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

  // Buttons
  greenButton: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    borderRadius: 10,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  disabled: {
    opacity: 0.6,
  },

  btnIcon: {
    marginRight: 6,
  },

  greenButtonText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bold,
    color: colors.white,
  },

  grayButton: {
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF0F3',
    borderRadius: 10,
    paddingHorizontal: 16,
  },

  grayButtonText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semiBold,
    color: '#111827',
  },

  // Badge
  badge: {
    minWidth: 54,
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 10,
  },

  badgeText: {
    fontSize: 11,
    fontFamily: FontFamily.semiBold,
  },

  // Pill tabs
  pillRow: {
    marginTop: 20,
    flexDirection: 'row',
    backgroundColor: '#F4F7F5',
    borderRadius: 12,
    padding: 4,
  },

  pill: {
    flex: 1,
    height: 38,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pillActive: {
    backgroundColor: GREEN,
  },

  pillText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: '#1F2937',
  },

  pillTextActive: {
    color: colors.white,
    fontFamily: FontFamily.semiBold,
  },

  // Table
  table: {
    borderWidth: 1,
    borderColor: '#E1E8E3',
    backgroundColor: colors.white,
  },

  tableHead: {
    flexDirection: 'row',
    backgroundColor: '#EEF3F0',
    paddingVertical: 9,
    paddingHorizontal: 10,
  },

  tableHeadText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: '#374151',
  },

  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEF1EF',
  },

  tableCell: {
    paddingRight: 4,
  },

  tableCellText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#111827',
  },
});
