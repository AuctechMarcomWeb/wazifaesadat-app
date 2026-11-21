import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import colors from '../../../../themes/colors';
import { FontFamily, FontSize } from '../../../../themes/typography';
import AppLayout from '../../../../components/AppLayout/AppLayout';
import BackHeader from '../../../../components/BackHeader/BackHeader';
import { getMembers } from '../../../../api/collection';

const SelectMemberScreen = ({ navigation, route }) => {
  const { onSelect, selectedId } = route?.params || {};

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const res = await getMembers({ limit: 100 });
      if (res.success && res.members) {
        setMembers(res.members);
      }
    } catch (error) {
      console.error('❌ Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(m => {
      const code = String(m.memberId || m.uniqueId || '').toLowerCase();
      const name = String(m.fullName || m.memberName || '').toLowerCase();
      return code.includes(q) || name.includes(q);
    });
  }, [members, search]);

  const handleSelect = item => {
    onSelect && onSelect(item);
    navigation.goBack();
  };

  const renderItem = ({ item }) => {
    const code = item.memberId || item.uniqueId || 'N/A';
    const name = item.fullName || item.memberName || '';
    const isSelected = selectedId && String(selectedId) === String(code);

    return (
      <TouchableOpacity
        style={[styles.item, isSelected && styles.itemSelected]}
        activeOpacity={0.7}
        onPress={() => handleSelect(item)}
      >
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.itemSub} numberOfLines={1}>
            ID: {code}
            {item.city ? `  •  ${item.city}` : ''}
          </Text>
        </View>
        {isSelected && <Icon name="check-circle" size={22} color="#2E8B3E" />}
      </TouchableOpacity>
    );
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Select Member"
          onBack={() => navigation.goBack()}
        />

        <View style={styles.body}>
          <View style={styles.searchBox}>
            <Icon name="magnify" size={22} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by Member ID or Name..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
            {loading && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
            {!loading && search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Icon name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.centerText}>Loading members...</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item, index) =>
                String(item._id || item.memberId || item.uniqueId || index)
              }
              renderItem={renderItem}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <View style={styles.center}>
                  <Text style={styles.centerText}>No members found</Text>
                </View>
              }
            />
          )}
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
    marginTop: 15,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchBox: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: '#111827',
    paddingVertical: 0,
  },
  list: {
    paddingBottom: 24,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF3F0',
  },
  itemSelected: {
    backgroundColor: '#EEF7F0',
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semiBold,
    color: '#111827',
  },
  itemSub: {
    marginTop: 2,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  centerText: {
    marginTop: 12,
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
  },
});

export default SelectMemberScreen;