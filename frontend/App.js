import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, ActivityIndicator, StyleSheet, LogBox, Platform } from 'react-native';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Auth screens
import Login from './screens/Login';
import Registration from './screens/Registration';
import ForgotPassword from './screens/ForgotPassword';
import ResetPassword from './screens/ResetPassword';

// Student screens
import StudentDashboard from './screens/students/StudentDashboard';
import EditProfileScreen from './screens/students/EditProfileScreen';
import ResumeScreen from './screens/students/ResumeScreen';
import AttendanceScreen from './screens/students/AttendanceScreen';

// Chat screens
import ChatListScreen from './screens/ChatListScreen';
import ChatScreen from './screens/ChatScreen';

// Faculty and Admin screens
import FacultyDashboard from './screens/faculty/FacultyDashboard';
import AdminDashboard from './screens/admin/AdminDashboard';
import FacultyTickets from './screens/faculty/FacultyTickets';
import FacultyProfileScreen from './screens/faculty/FacultyProfileScreen';

// Placeholder screens for navigation that will be implemented later
const TasksScreen = () => (
  <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
    <Text>Tasks Screen - Coming Soon</Text>
  </View>
);
const TicketsScreen = () => (
  <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
    <Text>Tickets Screen - Coming Soon</Text>
  </View>
);
const ProfileScreen = () => (
  <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
    <Text>Profile Screen - Coming Soon</Text>
  </View>
);

// Create the main stack navigator
const MainStack = createStackNavigator();
const StudentStack = createStackNavigator();
const FacultyStack = createStackNavigator();
const AdminStack = createStackNavigator();

// Student Stack Navigator
const StudentStackScreen = () => {
  return (
    <StudentStack.Navigator screenOptions={{ headerShown: false }}>
      <StudentStack.Screen name="Dashboard" component={StudentDashboard} />
      <StudentStack.Screen name="EditProfile" component={EditProfileScreen} />
      <StudentStack.Screen name="ViewResume" component={ResumeScreen} />
      <StudentStack.Screen name="Tasks" component={TasksScreen} />
      <StudentStack.Screen name="Tickets" component={TicketsScreen} />
      <StudentStack.Screen name="Profile" component={ProfileScreen} />
      <StudentStack.Screen name="Attendance" component={AttendanceScreen} />
      <StudentStack.Screen name="ChatListScreen" component={ChatListScreen} />
      <StudentStack.Screen name="ChatScreen" component={ChatScreen} />
    </StudentStack.Navigator>
  );
};

// Faculty Stack Navigator
const FacultyStackScreen = () => {
  return (
    <FacultyStack.Navigator screenOptions={{ headerShown: false }}>
      <FacultyStack.Screen name="Dashboard" component={FacultyDashboard} />
      <FacultyStack.Screen name="Tickets" component={FacultyTickets} />
      <FacultyStack.Screen name="Profile" component={FacultyProfileScreen} />
      <FacultyStack.Screen name="ChatListScreen" component={ChatListScreen} />
      <FacultyStack.Screen name="ChatScreen" component={ChatScreen} />
    </FacultyStack.Navigator>
  );
};

// Admin Stack Navigator
const AdminStackScreen = () => {
  return (
    <AdminStack.Navigator screenOptions={{ headerShown: false }}>
      <AdminStack.Screen name="Dashboard" component={AdminDashboard} />
      <AdminStack.Screen name="StudentEditProfile" component={EditProfileScreen} />
    </AdminStack.Navigator>
  );
};

// Suppress the warning in both Metro and the device/emulator console
LogBox.ignoreLogs([
  'Warning: Text strings must be rendered within a <Text> component',
  'Reduced motion setting is enabled on this device',
  'Error fetching resume: [AxiosError: Request failed with status code 404]',
  'Request failed with status code 404',
  'Registration error: [AxiosError: Request failed with status code 400]',
  'Network request failed',
  'Password reset error:',
]);
if (typeof console !== 'undefined' && console.error) {
  const suppressed = [
    'Warning: Text strings must be rendered within a <Text> component',
    'Reduced motion setting is enabled on this device',
    'Error fetching resume: [AxiosError: Request failed with status code 404]',
    'Request failed with status code 404',
    'Registration error: [AxiosError: Request failed with status code 400]',
    'Network request failed',
    'Password reset error:',
  ];
  const origConsoleError = console.error;
  console.error = (...args) => {
    if (typeof args[0] === 'string' && suppressed.some(w => args[0].includes(w))) {
      return;
    }
    origConsoleError.apply(console, args);
  };
}

export default function App() {
  return (
    <NavigationContainer>
      <MainStack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerShown: false
        }}
      >
        <MainStack.Screen name="Login" component={Login} />
        <MainStack.Screen name="Registration" component={Registration} />
        <MainStack.Screen name="ForgotPassword" component={ForgotPassword} />
        <MainStack.Screen name="ResetPassword" component={ResetPassword} />
        <MainStack.Screen name="StudentDashboard" component={StudentStackScreen} />
        <MainStack.Screen name="FacultyDashboard" component={FacultyStackScreen} />
        <MainStack.Screen name="AdminDashboard" component={AdminStackScreen} />
      </MainStack.Navigator>
    </NavigationContainer>
  );
}