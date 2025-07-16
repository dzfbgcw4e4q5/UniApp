import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Dimensions,
  FlatList,
  Alert,
  Pressable,
} from 'react-native';
import axios from 'axios';
import { IP } from '../../ip';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut, Layout, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const AttendanceScreen = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ present: 0, absent: 0, percentage: 0, total: 0 });
  const [filterActive, setFilterActive] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const filterHeight = useSharedValue(0);

  const animatedFilterStyle = useAnimatedStyle(() => ({
    height: withTiming(filterHeight.value, { duration: 300 }),
    opacity: withTiming(filterHeight.value > 0 ? 1 : 0, { duration: 300 }),
  }));

  const toggleFilter = () => {
    setIsFilterExpanded(!isFilterExpanded);
    filterHeight.value = isFilterExpanded ? 0 : 200;
  };

  const calculateStats = (data) => {
    if (!data || data.length === 0) return { present: 0, absent: 0, percentage: 0, total: 0 };
    const present = data.filter(item => item.status.toLowerCase() === 'present').length;
    const absent = data.length - present;
    const percentage = Math.round((present / data.length) * 100);
    const trend = percentage >= 75 ? 'good' : percentage >= 60 ? 'warning' : 'critical';
    return { present, absent, percentage, total: data.length, trend };
  };

  const fetchAttendance = async () => {
    try {
      setError(null);
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`http://${IP}:3000/api/student/attendance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAttendance(res.data);
      setStats(calculateStats(res.data));
    } catch (err) {
      setError('Failed to load attendance records');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAttendance();
  }, []);

  const filterByMonth = (month) => {
    if (selectedMonth === month) {
      setSelectedMonth(null);
      setFilterActive(selectedSubject !== null);
    } else {
      setSelectedMonth(month);
      setFilterActive(true);
    }
  };

  const filterBySubject = (subject) => {
    if (selectedSubject === subject) {
      setSelectedSubject(null);
      setFilterActive(selectedMonth !== null);
    } else {
      setSelectedSubject(subject);
      setFilterActive(true);
    }
  };

  const resetFilters = () => {
    setSelectedMonth(null);
    setSelectedSubject(null);
    setFilterActive(false);
  };

  const switchViewMode = (mode) => {
    setViewMode(mode);
  };

  const getMonthsFromData = () => {
    if (!attendance || attendance.length === 0) return [];
    const months = [...new Set(attendance.map(item => {
      const date = new Date(item.date);
      return date.toLocaleString('default', { month: 'short' });
    }))];
    return months;
  };

  const getSubjectsFromData = () => {
    if (!attendance || attendance.length === 0) return [];
    const subjects = [...new Set(attendance.map(item => item.subject))];
    return subjects;
  };

  const getAttendanceBySubject = () => {
    if (!attendance || attendance.length === 0) return [];
    const subjects = getSubjectsFromData();
    return subjects.map(subject => {
      const subjectAttendance = attendance.filter(item => item.subject === subject);
      const stats = calculateStats(subjectAttendance);
      return { subject, ...stats };
    });
  };

  const getCalendarData = () => {
    if (!attendance || attendance.length === 0) return [];
    const groupedByDate = {};
    attendance.forEach(item => {
      const date = new Date(item.date).toLocaleDateString('en-US');
      if (!groupedByDate[date]) groupedByDate[date] = [];
      groupedByDate[date].push(item);
    });
    return Object.keys(groupedByDate).map(date => ({
      date,
      items: groupedByDate[date],
      present: groupedByDate[date].filter(item => item.status.toLowerCase() === 'present').length,
      total: groupedByDate[date].length,
    }));
  };

  const filteredAttendance = attendance.filter(item => {
    if (selectedMonth) {
      const date = new Date(item.date);
      const itemMonth = date.toLocaleString('default', { month: 'short' });
      if (itemMonth !== selectedMonth) return false;
    }
    if (selectedSubject && item.subject !== selectedSubject) return false;
    return true;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading attendance records...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAttendance}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />}
      >
        <Animated.View entering={FadeIn} layout={Layout}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Attendance Dashboard</Text>
          </View>

          <Animated.View style={styles.mainStatsCard} entering={FadeIn.delay(100)}>
            <LinearGradient
              colors={
                stats.percentage >= 75
                  ? ['#34d399', '#10b981']
                  : stats.percentage >= 60
                  ? ['#fcd34d', '#f59e0b']
                  : ['#f87171', '#ef4444']
              }
              style={styles.statsGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.attendanceCircle}>
                <Text style={styles.attendancePercentage}>{stats.percentage}%</Text>
                <Text style={styles.attendanceLabel}>Attendance</Text>
              </View>
              <View style={styles.statsDetailsContainer}>
                {[
                  { icon: 'check-circle', color: '#10b981', value: stats.present, label: 'Present' },
                  { icon: 'cancel', color: '#ef4444', value: stats.absent, label: 'Absent' },
                  { icon: 'event', color: '#3b82f6', value: stats.total, label: 'Total' },
                ].map((stat, index) => (
                  <Animated.View key={stat.label} entering={FadeIn.delay(200 + index * 100)}>
                    <View style={styles.statDetail}>
                      <View style={styles.statIconContainer}>
                        <MaterialIcons name={stat.icon} size={24} color={stat.color} />
                      </View>
                      <View>
                        <Text style={styles.statDetailValue}>{stat.value}</Text>
                        <Text style={styles.statDetailLabel}>{stat.label}</Text>
                      </View>
                    </View>
                  </Animated.View>
                ))}
              </View>
              {stats.percentage < 75 && (
                <Animated.View entering={FadeIn.delay(500)} style={styles.warningContainer}>
                  <MaterialIcons name="warning" size={16} color="#ef4444" />
                  <Text style={styles.warningMessage}>
                    {stats.percentage < 60 ? 'Critical: Below 60%' : 'Warning: Below 75%'}
                  </Text>
                </Animated.View>
              )}
            </LinearGradient>
          </Animated.View>

          <Animated.View style={styles.viewModeContainer} entering={FadeIn.delay(200)}>
            {[
              { mode: 'list', icon: 'list', label: 'List' },
              { mode: 'calendar', icon: 'calendar-today', label: 'Calendar' },
              { mode: 'summary', icon: 'pie-chart', label: 'Summary' },
            ].map((item) => (
              <Pressable
                key={item.mode}
                style={({ pressed }) => [
                  styles.viewModeButton,
                  viewMode === item.mode && styles.activeViewMode,
                  pressed && styles.pressedViewMode,
                ]}
                onPress={() => switchViewMode(item.mode)}
              >
                <MaterialIcons
                  name={item.icon}
                  size={20}
                  color={viewMode === item.mode ? '#3b82f6' : '#6b7280'}
                />
                <Text style={[styles.viewModeText, viewMode === item.mode && styles.activeViewModeText]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </Animated.View>

          <Pressable
            style={({ pressed }) => [styles.filterToggle, pressed && styles.pressedFilterToggle]}
            onPress={toggleFilter}
          >
            <Text style={styles.filterToggleText}>
              {isFilterExpanded ? 'Hide Filters' : 'Show Filters'}
            </Text>
            <MaterialIcons
              name={isFilterExpanded ? 'expand-less' : 'expand-more'}
              size={24}
              color="#3b82f6"
            />
          </Pressable>

          <Animated.View style={[styles.filterSection, animatedFilterStyle]}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filters</Text>
              {filterActive && (
                <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
                  <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
              )}
            </View>
            {attendance.length > 0 && getMonthsFromData().length > 0 && (
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Month</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScrollContent}>
                  {getMonthsFromData().map((month) => (
                    <Pressable
                      key={month}
                      style={({ pressed }) => [
                        styles.filterChip,
                        selectedMonth === month && styles.activeFilterChip,
                        pressed && styles.pressedFilterChip,
                      ]}
                      onPress={() => filterByMonth(month)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedMonth === month && styles.activeFilterChipText,
                        ]}
                      >
                        {month}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
            {attendance.length > 0 && getSubjectsFromData().length > 0 && (
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Subject</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScrollContent}>
                  {getSubjectsFromData().map((subject) => (
                    <Pressable
                      key={subject}
                      style={({ pressed }) => [
                        styles.filterChip,
                        selectedSubject === subject && styles.activeFilterChip,
                        pressed && styles.pressedFilterChip,
                      ]}
                      onPress={() => filterBySubject(subject)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedSubject === subject && styles.activeFilterChipText,
                        ]}
                      >
                        {subject}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </Animated.View>

          <Text style={styles.summary}>
            {filterActive
              ? `Showing ${filteredAttendance.length} records ${selectedMonth ? `for ${selectedMonth}` : ''} ${selectedSubject ? `in ${selectedSubject}` : ''}`
              : `Total Records: ${attendance.length}`}
          </Text>

          {viewMode === 'list' && (
            <Animated.View style={styles.tableOuterContainer} entering={FadeIn.delay(300)} layout={Layout}>
              <View style={styles.tableHeader}>
                {['Date', 'Subject', 'Status', 'Semester'].map((header) => (
                  <View key={header} style={styles.headerCellContainer}>
                    <Text style={styles.headerCellText}>{header}</Text>
                  </View>
                ))}
              </View>
              {filteredAttendance.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="event-busy" size={40} color="#6b7280" />
                  <Text style={styles.emptyText}>
                    {filterActive ? 'No records found with selected filters.' : 'No attendance records available.'}
                  </Text>
                </View>
              ) : (
                filteredAttendance.map((item, index) => (
                  <Animated.View
                    key={item.id}
                    style={[styles.tableRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}
                    entering={FadeIn.delay(index * 50)}
                  >
                    <View style={styles.tableCellContainer}>
                      <Text style={styles.tableCellText}>
                        {item.date
                          ? new Date(item.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.tableCellContainer}>
                      <Text style={styles.tableCellText} numberOfLines={1} ellipsizeMode="tail">
                        {item.subject}
                      </Text>
                    </View>
                    <View style={styles.tableCellContainer}>
                      <View
                        style={[
                          styles.statusBadge,
                          item.status.toLowerCase() === 'present' ? styles.present : styles.absent,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            item.status.toLowerCase() === 'present' ? { color: '#065f46' } : { color: '#b91c1c' },
                          ]}
                        >
                          {item.status}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.tableCellContainer}>
                      <Text style={styles.tableCellText}>{item.semester}</Text>
                    </View>
                  </Animated.View>
                ))
              )}
            </Animated.View>
          )}

          {viewMode === 'calendar' && (
            <Animated.View style={styles.calendarContainer} entering={FadeIn.delay(300)} layout={Layout}>
              {getCalendarData().length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="event-busy" size={40} color="#6b7280" />
                  <Text style={styles.emptyText}>
                    {filterActive ? 'No records found with selected filters.' : 'No attendance records available.'}
                  </Text>
                </View>
              ) : (
                getCalendarData().map((day, index) => (
                  <Animated.View key={day.date} style={styles.calendarDay} entering={FadeIn.delay(index * 50)}>
                    <View style={styles.calendarDateHeader}>
                      <Text style={styles.calendarDateText}>
                        {new Date(day.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                      <View
                        style={[
                          styles.calendarAttendanceIndicator,
                          day.present === day.total
                            ? styles.fullAttendance
                            : day.present > 0
                            ? styles.partialAttendance
                            : styles.noAttendance,
                        ]}
                      >
                        <Text style={styles.calendarAttendanceText}>{day.present}/{day.total}</Text>
                      </View>
                    </View>
                    {day.items.map((item) => (
                      <View key={item.id} style={styles.calendarItem}>
                        <View style={styles.calendarItemSubject}>
                          <Text style={styles.calendarItemSubjectText}>{item.subject}</Text>
                          <Text style={styles.calendarItemTimeText}>{item.time || 'N/A'}</Text>
                        </View>
                        <View
                          style={[
                            styles.calendarItemStatus,
                            item.status.toLowerCase() === 'present' ? styles.calendarPresent : styles.calendarAbsent,
                          ]}
                        >
                          <Text
                            style={[
                              styles.calendarItemStatusText,
                              item.status.toLowerCase() === 'present' ? { color: '#065f46' } : { color: '#b91c1c' },
                            ]}
                          >
                            {item.status}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </Animated.View>
                ))
              )}
            </Animated.View>
          )}

          {viewMode === 'summary' && (
            <Animated.View style={styles.summaryContainer} entering={FadeIn.delay(300)} layout={Layout}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryHeaderText}>Attendance by Subject</Text>
              </View>
              {getAttendanceBySubject().length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="event-busy" size={40} color="#6b7280" />
                  <Text style={styles.emptyText}>No attendance records available.</Text>
                </View>
              ) : (
                getAttendanceBySubject().map((subjectData, index) => (
                  <Animated.View
                    key={subjectData.subject}
                    style={styles.subjectSummaryCard}
                    entering={FadeIn.delay(index * 50)}
                  >
                    <View style={styles.subjectSummaryHeader}>
                      <Text style={styles.subjectSummaryTitle}>{subjectData.subject}</Text>
                      <View
                        style={[
                          styles.subjectSummaryBadge,
                          subjectData.percentage >= 75
                            ? styles.goodBadge
                            : subjectData.percentage >= 60
                            ? styles.warningBadge
                            : styles.criticalBadge,
                        ]}
                      >
                        <Text style={styles.subjectSummaryBadgeText}>{subjectData.percentage}%</Text>
                      </View>
                    </View>
                    <View style={styles.subjectSummaryStats}>
                      {[
                        { value: subjectData.present, label: 'Present' },
                        { value: subjectData.absent, label: 'Absent' },
                        { value: subjectData.total, label: 'Total' },
                      ].map((stat) => (
                        <View key={stat.label} style={styles.subjectStatItem}>
                          <Text style={styles.subjectStatValue}>{stat.value}</Text>
                          <Text style={styles.subjectStatLabel}>{stat.label}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={styles.attendanceProgressContainer}>
                      <View style={styles.attendanceProgressBackground}>
                        <View
                          style={[
                            styles.attendanceProgressFill,
                            { width: `${subjectData.percentage}%` },
                            subjectData.percentage >= 75
                              ? styles.goodProgress
                              : subjectData.percentage >= 60
                              ? styles.warningProgress
                              : styles.criticalProgress,
                          ]}
                        />
                      </View>
                      {subjectData.percentage < 75 && (
                        <Text style={styles.attendanceProgressWarning}>
                          {Math.ceil(((subjectData.total * 0.75) - subjectData.present) / 0.25)} more classes needed to reach 75%
                        </Text>
                      )}
                    </View>
                  </Animated.View>
                ))
              )}
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  header: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  mainStatsCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  statsGradient: {
    padding: 20,
    alignItems: 'center',
  },
  attendanceCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  attendancePercentage: {
    fontSize: 36,
    fontWeight: '800',
    color: '#111827',
  },
  attendanceLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statsDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
  },
  statDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statDetailValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  statDetailLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 8,
  },
  warningMessage: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '600',
    marginLeft: 8,
  },
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 4,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeViewMode: {
    backgroundColor: '#eff6ff',
  },
  pressedViewMode: {
    backgroundColor: '#dbeafe',
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 6,
  },
  activeViewModeText: {
    color: '#3b82f6',
  },
  filterToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pressedFilterToggle: {
    backgroundColor: '#f3f4f6',
  },
  filterToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  filterSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  resetButtonText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  filtersScrollContent: {
    paddingBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: '#dbeafe',
  },
  pressedFilterChip: {
    backgroundColor: '#bfdbfe',
  },
  filterChipText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  activeFilterChipText: {
    color: '#3b82f6',
  },
  summary: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  tableOuterContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerCellContainer: {
    flex: 1,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCellText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    minHeight: 50,
  },
  tableCellContainer: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableCellText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  evenRow: {
    backgroundColor: '#f9fafb',
  },
  oddRow: {
    backgroundColor: '#ffffff',
  },
  statusBadge: {
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  present: {
    backgroundColor: '#d1fae5',
    borderColor: '#6ee7b7',
  },
  absent: {
    backgroundColor: '#fee2e2',
    borderColor: '#f87171',
  },
  statusText: {
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
  },
  calendarContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 16,
  },
  calendarDay: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 12,
  },
  calendarDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  calendarDateText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  calendarAttendanceIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  fullAttendance: {
    backgroundColor: '#d1fae5',
  },
  partialAttendance: {
    backgroundColor: '#fef3c7',
  },
  noAttendance: {
    backgroundColor: '#fee2e2',
  },
  calendarAttendanceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  calendarItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  calendarItemSubject: {
    flex: 1,
  },
  calendarItemSubjectText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  calendarItemTimeText: {
    fontSize: 13,
    color: '#6b7280',
  },
  calendarItemStatus: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  calendarPresent: {
    backgroundColor: '#d1fae5',
  },
  calendarAbsent: {
    backgroundColor: '#fee2e2',
  },
  calendarItemStatusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  summaryContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 16,
  },
  summaryHeader: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 8,
  },
  summaryHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  subjectSummaryCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  subjectSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectSummaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    flex: 1,
  },
  subjectSummaryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  goodBadge: {
    backgroundColor: '#d1fae5',
  },
  warningBadge: {
    backgroundColor: '#fef3c7',
  },
  criticalBadge: {
    backgroundColor: '#fee2e2',
  },
  subjectSummaryBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  subjectSummaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  subjectStatItem: {
    alignItems: 'center',
  },
  subjectStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  subjectStatLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  attendanceProgressContainer: {
    marginTop: 8,
  },
  attendanceProgressBackground: {
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 5,
    overflow: 'hidden',
  },
  attendanceProgressFill: {
    height: '100%',
    borderRadius: 5,
  },
  goodProgress: {
    backgroundColor: '#10b981',
  },
  warningProgress: {
    backgroundColor: '#f59e0b',
  },
  criticalProgress: {
    backgroundColor: '#ef4444',
  },
  attendanceProgressWarning: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '600',
    marginTop: 6,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default AttendanceScreen;