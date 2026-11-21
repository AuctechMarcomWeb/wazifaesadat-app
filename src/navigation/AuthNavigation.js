import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Sidebar from '../components/Sidebar/Sidebar';
import { MENU_CONFIG } from '../config/menuConfig';
import CommunityPost from '../Screens/CommunityPost/CommunityPost';

// Dashboard screens
import SuperAdminDashboard from '../Screens/Dashboard/SuperAdmin/Dashboardscreen/Dashboardscreen';
import AdminDashboard from '../Screens/Dashboard/Admin/Dashboardscreen/Dashboardscreen';
import ExecutiveMemberDashboard from '../Screens/Dashboard/ExecutiveMember/Dashboardscreen/Dashboardscreen';
import OfficeBearerDashboard from '../Screens/Dashboard/OfficeBearer/Dashboardscreen/Dashboardscreen';
import OfficeBearersPluralDashboard from '../Screens/Dashboard/Office Bearers/Dashboardscreen/Dashboardscreen';
import OfficeStaffDashboard from '../Screens/Dashboard/OfficeStaff/Dashboardscreen/Dashboardscreen';
import LocalSecretaryDashboard from '../Screens/Dashboard/LocalSecretary/Dashboardscreen/Dashboardscreen';
import MembershipDashboard from '../Screens/Dashboard/Membership/Dashboardscreen/Dashboardscreen';
import WazifaUserDashboard from '../Screens/Dashboard/WazifaUser/Dashboardscreen/Dashboardscreen';

// Common screens
import ProfileScreen from '../Screens/Common/Profile/Profile';
import SettingsScreen from '../Screens/Common/SettingScreen/SettingScreen';
import PrivacyPolicyScreen from '../Screens/Common/SettingScreen/PrivacyPolicyScreen';
import TermsConditionsScreen from '../Screens/Common/SettingScreen/TermsConditionsScreen';
import AboutAppScreen from '../Screens/Common/SettingScreen/AboutAppScreen';
import MasterRegisterScreen from '../Screens/Common/MasterRegister/MasterRegister';
import MemberProfileScreen from '../Screens/Common/MasterRegister/MemberProfile';
import LetterRecordScreen from '../Screens/Common/Letterrecordscreen/Letterrecordscreen';
import MessagingScreen from '../Screens/Common/Messagingscreen/Messagingscreen';
import ComposeMessageScreen from '../Screens/Common/Composemessagescreen/Composemessagescreen';
import ExpenditureScreen from '../Screens/Common/Expenditurescreen/Expenditurescreen';
import AddExpenditureScreen from '../Screens/Common/Expenditurescreen/Addexpenditurescreen';
import ExpenditureDetail from '../Screens/Common/Expenditurescreen/ExpenditureDetail';
import ReceivePaymentScreen from '../Screens/Common/Collection/Receivepaymentscreen/Receivepaymentscreen';
import TransactionsScreen from '../Screens/Common/Collection/Transactionsscreen/Transactionsscreen';
import CollectionReportScreen from '../Screens/Common/Collection/Collectionreportscreen/Collectionreportscreen';
import LedgerScreen from '../Screens/Common/Collection/Ledgerscreen/Ledgerscreen';
import ReferralLinkScreen from '../Screens/Common/Collection/Referrallinkscreen/Referrallinkscreen';
import PaymentListScreen from '../Screens/Common/Collection/Paymentlistscreen/Paymentlistscreen';
import FardeHisaabScreen from '../Screens/Common/Collection/Fardehisaabscreen/Fardehisaabscreen';
import Addfardehisaabscreen from '../Screens/Common/Collection/Fardehisaabscreen/Addfardehisaabscreen';
import IncomeExpenditureSummaryScreen from '../Screens/Common/Collection/Fardehisaabscreen/IncomeExpenditureSummaryScreen/IncomeExpenditureSummaryScreen';
import AddIncomeExpenditureSummaryScreen from '../Screens/Common/Collection/Fardehisaabscreen/IncomeExpenditureSummaryScreen/IncomeExpenditureModal';
import PostsScreen from '../Screens/Common/PostsScreen/MainScreen/MainScreen';
import WazifaApplicationsScreen from '../Screens/Common/Wafizedar/WazifaApplicationsScreen/WazifaApplicationsScreen/WazifaApplicationsScreen';
import WazifaApplicationSubmittedScreen from '../Screens/Common/Wafizedar/WazifaApplicationsScreen/WazifaApplicationSubmittedScreen/WazifaApplicationSubmittedScreen';
import AddWazifaApplicationScreen from '../Screens/Common/Wafizedar/WazifaApplicationsScreen/EditWazifaApplicationScreen/EditWazifaApplicationScreen';
import VerifyWazifaListScreen from '../Screens/Common/Wafizedar/VerifyWazifaListScreen/VerifyWazifaListScreen';
import RecentTransactionsScreen from '../Screens/Common/Wafizedar/RecentTransactionsScreen/RecentTransactionsScreen';
import WazifaDueReportScreen from '../Screens/Common/Wafizedar/WazifaDueReportScreen/WazifaDueReportScreen';
import LedgerOfWazifadarScreen from '../Screens/Common/Wafizedar/LedgerOfWazifadarScreen/LedgerOfWazifadarScreen';
import EditProfileScreen from '../Screens/Common/EditProfileScreen/EditProfileScreen';
import MembershipScreen from '../Screens/Common/MembersList/MembershipScreen/MembershipScreen';
import AddMembershipApplicationScreen from '../Screens/Common/MembersList/MembershipScreen/AddMembershipApplicationScreen';
import UserManagementScreen from '../Screens/Common/UserManagementScreen/UserManagementScreen';
import AddUserScreen from '../Screens/Common/UserManagementScreen/AddUserScreen';
// import AddStaffScreen from '../Screens/Common/UserManagementScreen/UserManagementScreen';
import MembershipListScreen from '../Screens/Common/MembersList/MembersListScreen/MemberListScreen';
import OfficeBearerMasterScreen from '../Screens/Common/OrganizationStructure/OfficeBearerMasterScreen/OfficeBearerMasterScreen';
import AddOfficeBearerScreen from '../Screens/Common/OrganizationStructure/OfficeBearerMasterScreen/AddOfficeBearerScreen';
import ExecutiveMembersScreen from '../Screens/Common/OrganizationStructure/ExecutiveMembersScreen/ExecutiveMembersScreen';
import AddExecutiveMembersScreen from '../Screens/Common/OrganizationStructure/ExecutiveMembersScreen/AddExecutiveMembersScreen';
import LocalSecretariesScreen from '../Screens/Common/OrganizationStructure/LocalSecretariesScreen/LocalSecretariesScreen';
import AddLocalSecretaryScreen from '../Screens/Common/OrganizationStructure/LocalSecretariesScreen/AddLocalSecretaryScreen';
import UserAccessManagementScreen from '../Screens/Common/UserAccessManagementScreen/UserAccessManagementScreen';
import ActivityLogsScreen from '../Screens/Common/ActivityLogsScreen/ActivityLogsScreen';
import UnderDevelopmentScreen from '../Screens/UnderDevelopmentScreen/UnderDevelopmentScreen';
import SelectMemberScreen from '../Screens/Common/Collection/Receivepaymentscreen/Selectmemberscreen';

// Master screens
import DesignationScreen from '../Screens/Master/Designation/Designation';
import AddDesignationScreen from '../Screens/Master/Designation/AddDesignationScreen';
import TenureYearScreen from '../Screens/Master/TenureYear/TenureYear';
import AddTenureYearScreen from '../Screens/Master/TenureYear/AddTenureYearScreen';
import CollectedByScreen from '../Screens/Master/CollectedByMaster/CollectedByMaster';
import PaymentModeScreen from '../Screens/Master/PaymentMode/PaymentMode';
import AddPaymentModeScreen from '../Screens/Master/PaymentMode/AddPaymentModeScreen';
import BankScreen from '../Screens/Master/Bank/Bank';
import AddBankScreen from '../Screens/Master/Bank/AddBankScreen';
import FundTypeScreen from '../Screens/Master/FundType/FundTypeMasterScreen';
import AddFundTypeScreen from '../Screens/Master/FundType/AddFundTypeScreen';
import RateOfScholarshipScreen from '../Screens/Master/RateScholarship/RateOfScholarshipMasterScreen';
import AddRateOfScholarshipScreen from '../Screens/Master/RateScholarship/AddRateOfScholarshipScreen';
import ScholarshipDateScreen from '../Screens/Master/ScholarshipDate/ScholarshipDateMasterScreen';
import AddScholarshipDateScreen from '../Screens/Master/ScholarshipDate/AddScholarshipDateScreen';
import ExpenseScreen from '../Screens/Master/Expense/ExpenseMasterScreen';
import AddExpenseScreen from '../Screens/Master/Expense/AddExpenseScreen';

// Message details screen
import MessageDetailsScreen from '../Screens/Common/Messagingscreen/MessageDetailsScreen';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

const dashboardScreens = {
  SuperAdmin: SuperAdminDashboard,
  Admin: AdminDashboard,
  ExecutiveMember: ExecutiveMemberDashboard,
  OfficeBearer: OfficeBearerDashboard,
  'Office Bearers': OfficeBearersPluralDashboard,
  OfficeStaff: OfficeStaffDashboard,
  LocalSecretary: LocalSecretaryDashboard,
  Membership: MembershipDashboard,
  WazifaUser: WazifaUserDashboard,
};

const MainDrawer = () => {
  const { role } = useSelector(state => state.user);
  const DashboardComponent = dashboardScreens[role] || SuperAdminDashboard;

  return (
    <Drawer.Navigator
      backBehavior="history"
      screenOptions={{ headerShown: false }}
      drawerContent={props => <Sidebar {...props} role={role} />}
    >
      <Drawer.Screen
        name="CommunityPost"
        component={CommunityPost}
        options={{
          title: 'Home',
          drawerIcon: ({ color }) => (
            <Icon name="view-dashboard-outline" size={20} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Dashboard"
        component={DashboardComponent}
        options={{
          title: 'Dashboard',
          drawerIcon: ({ color }) => (
            <Icon
              name={MENU_CONFIG.Dashboard?.icon || 'home'}
              size={20}
              color={color}
            />
          ),
        }}
      />

      <Drawer.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          drawerIcon: ({ color }) => (
            <Icon name="account-circle" size={20} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="SettingScreen"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          drawerIcon: ({ color }) => (
            <Icon name="cog" size={20} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Posts"
        component={PostsScreen}
        options={{
          title: 'Posts',
          drawerIcon: ({ color }) => (
            <Icon name="newspaper" size={20} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="MemberProfile"
        component={MemberProfileScreen}
        options={{
          title: 'Member Profile',
          drawerIcon: ({ color }) => (
            <Icon name="account-card-details" size={20} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="LetterRecord"
        component={LetterRecordScreen}
        options={{
          title: 'Letter Record',
          drawerIcon: ({ color }) => (
            <Icon name="email" size={20} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Messaging"
        component={MessagingScreen}
        options={{
          title: 'Messaging',
          drawerIcon: ({ color }) => (
            <Icon name="message" size={20} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="ComposeMessage"
        component={ComposeMessageScreen}
        options={{
          title: 'Compose Message',
          drawerIcon: ({ color }) => (
            <Icon name="pencil" size={20} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Expenditure"
        component={ExpenditureScreen}
        options={{
          title: 'Expenditure',
          drawerIcon: ({ color }) => (
            <Icon name="cash-minus" size={20} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="AddExpenditure"
        component={AddExpenditureScreen}
        options={{
          title: 'Add Expenditure',
          drawerIcon: ({ color }) => (
            <Icon name="plus-circle" size={20} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Payment"
        component={ReceivePaymentScreen}
        options={{
          title: 'Payment',
          drawerIcon: ({ color }) => (
            <Icon name="cash-plus" size={20} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          title: 'Transactions',
          drawerIcon: ({ color }) => (
            <Icon name="swap-horizontal" size={20} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Reports"
        component={CollectionReportScreen}
        options={{
          title: 'Reports',
          drawerIcon: ({ color }) => (
            <Icon name="chart-line" size={20} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="LedgerMembers"
        component={LedgerScreen}
        options={{
          title: 'Ledger Members',
          drawerIcon: ({ color }) => (
            <Icon name="book" size={20} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="EditProfileScreen"
        component={EditProfileScreen}
        options={{
          title: 'EditProfileScreen',
          drawerIcon: ({ color }) => (
            <Icon name="book" size={20} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="ReferralLink"
        component={ReferralLinkScreen}
        options={{
          title: 'Referral Link',
          drawerIcon: ({ color }) => (
            <Icon name="link" size={20} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="PaymentList"
        component={PaymentListScreen}
        options={{
          title: 'Payment List',
          drawerIcon: ({ color }) => (
            <Icon name="list" size={20} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="UnderDevelopmentScreen"
        component={UnderDevelopmentScreen}
        options={{
          title: 'UnderDevelopmentScreen',
          drawerIcon: ({ color }) => (
            <Icon name="list" size={20} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="FardeHisaab"
        component={FardeHisaabScreen}
        options={{
          title: 'Farde Hisaab',
          drawerIcon: ({ color }) => (
            <Icon name="notebook" size={20} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="AddFardeHisaab"
        component={Addfardehisaabscreen}
        options={{
          title: 'Add Farde Hisaab',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="IncomeExpenditure"
        component={IncomeExpenditureSummaryScreen}
        options={{
          title: 'Income & Expenditure',
          drawerIcon: ({ color }) => (
            <Icon name="chart-box" size={20} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="AddIncomeExpenditure"
        component={AddIncomeExpenditureSummaryScreen}
        options={{
          title: 'Add Income & Expenditure',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="WazifaApplicationsScreen"
        component={WazifaApplicationsScreen}
        options={{
          title: 'WazifaApplications Screen',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="WazifaApplicationSubmittedScreen"
        component={WazifaApplicationSubmittedScreen}
        options={{
          title: 'WazifaApplicationSubmitted Screen',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="AddWazifaApplicationScreen"
        component={AddWazifaApplicationScreen}
        options={{
          title: 'AddWazifaApplication Screen',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="VerifyWazifaListScreen"
        component={VerifyWazifaListScreen}
        options={{
          title: 'VerifyWazifaList Screen',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="RecentTransactionsScreen"
        component={RecentTransactionsScreen}
        options={{
          title: 'RecentTransactions Screen',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="LedgerOfWazifadarScreen"
        component={LedgerOfWazifadarScreen}
        options={{
          title: 'LedgerOfWazifadar Screen',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="WazifaDueReportScreen"
        component={WazifaDueReportScreen}
        options={{
          title: 'WazifaDueReport Screen',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="MembershipScreen"
        component={MembershipScreen}
        options={{
          title: 'Membership Screen',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="AddMembershipApplicationScreen"
        component={AddMembershipApplicationScreen}
        options={{
          title: 'AddMembershipApplication Screen',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="MembershipListScreen"
        component={MembershipListScreen}
        options={{
          title: 'MembershipList Screen',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="OfficeBearerMasterScreen"
        component={OfficeBearerMasterScreen}
        options={{
          title: 'OfficeBearerMaster Screen',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="AddOfficeBearerScreen"
        component={AddOfficeBearerScreen}
        options={{
          title: 'AddOfficeBearer Screen',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="ExecutiveMembersScreen"
        component={ExecutiveMembersScreen}
        options={{
          title: 'ExecutiveMembers Screen',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="LocalSecretariesScreen"
        component={LocalSecretariesScreen}
        options={{
          title: 'LocalSecretaries Screen',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="AddLocalSecretaryScreen"
        component={AddLocalSecretaryScreen}
        options={{
          title: 'AddLocalSecretary Screen',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="UserManagementScreen"
        component={UserManagementScreen}
        options={{
          title: 'UserManagement Screen',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="AddUserScreen"
        component={AddUserScreen}
        options={{
          title: 'AddUser Screen',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="UserAccessManagementScreen"
        component={UserAccessManagementScreen}
        options={{
          title: 'UserAccessManagement Screen',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="ActivityLogsScreen"
        component={ActivityLogsScreen}
        options={{
          title: 'ActivityLogs Screen',
          drawerItemStyle: { display: 'none' },
        }}
      />

      {/* Dynamic MENU_CONFIG screens */}
      {Object.entries(MENU_CONFIG)
        .filter(
          ([menuKey]) =>
            ![
              'Dashboard',
              'ProfileScreen',
              'SettingScreen',
              'MemberProfile',
              'LetterRecord',
              'Messaging',
              'ComposeMessage',
              'Expenditure',
              'AddExpenditure',
              'Payment',
              'Transactions',
              'Reports',
              'LedgerMembers',
              'ReferralLink',
              'PaymentList',
              'FardeHisaab',
              'IncomeExpenditure',
              'UserManagementScreen',
              'MenuAccessControl',
              'ActivityLogs',
              'Masters',
            ].includes(menuKey),
        )
        .map(([menuKey, menuConfig]) => {
          let ScreenComponent;

          if (menuKey === 'MasterRegister') {
            ScreenComponent = MasterRegisterScreen;
          } else if (menuKey === 'Wazifedaar') {
            ScreenComponent = VerifyWazifaListScreen;
          } else {
            ScreenComponent = () => (
              <View style={styles.screenContainer}>
                <View style={styles.card}>
                  <Icon
                    name={menuConfig.icon}
                    size={48}
                    color="#007A43"
                    style={styles.icon}
                  />
                  <Text style={styles.title}>{menuConfig.label}</Text>
                  <Text style={styles.subtitle}>Coming Soon</Text>
                </View>
              </View>
            );
          }

          return (
            <Drawer.Screen
              key={menuKey}
              name={menuKey}
              component={ScreenComponent}
              options={{
                title: menuConfig.label,
                drawerIcon: ({ color }) => (
                  <Icon name={menuConfig.icon} size={20} color={color} />
                ),
              }}
            />
          );
        })}

      {/* Master screens */}
      <Drawer.Screen
        name="DesignationScreen"
        component={DesignationScreen}
        options={{
          title: 'Designation',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="AddDesignationScreen"
        component={AddDesignationScreen}
        options={{
          title: 'Add Designation',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="TenureYearScreen"
        component={TenureYearScreen}
        options={{
          title: 'Tenure Year',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="AddTenureYearScreen"
        component={AddTenureYearScreen}
        options={{
          title: 'Add Tenure Year',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="CollectedByScreen"
        component={CollectedByScreen}
        options={{
          title: 'Collected By',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="PaymentModeScreen"
        component={PaymentModeScreen}
        options={{
          title: 'Payment Mode',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="AddPaymentModeScreen"
        component={AddPaymentModeScreen}
        options={{
          title: 'Add Payment Mode',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="BankScreen"
        component={BankScreen}
        options={{
          title: 'Bank',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="AddBankScreen"
        component={AddBankScreen}
        options={{
          title: 'Add Bank',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="FundTypeScreen"
        component={FundTypeScreen}
        options={{
          title: 'Fund Type',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="AddFundTypeScreen"
        component={AddFundTypeScreen}
        options={{
          title: 'Add Fund Type',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="RateOfScholarshipScreen"
        component={RateOfScholarshipScreen}
        options={{
          title: 'Rate of Scholarship',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="AddRateOfScholarshipScreen"
        component={AddRateOfScholarshipScreen}
        options={{
          title: 'Add Rate of Scholarship',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="ScholarshipDateScreen"
        component={ScholarshipDateScreen}
        options={{
          title: 'Scholarship Date',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="AddScholarshipDateScreen"
        component={AddScholarshipDateScreen}
        options={{
          title: 'Add Scholarship Date',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="ExpenseScreen"
        component={ExpenseScreen}
        options={{
          title: 'Expense',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="AddExpenseScreen"
        component={AddExpenseScreen}
        options={{
          title: 'Add Expense',
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F5F7F6',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#123F2A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#7A8C82',
  },
});

// Root Stack Navigator
// Root Stack Navigator
const AuthNavigation = () => {
  return (
    <Stack.Navigator
      initialRouteName="MainDrawer"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      {/* Main Drawer */}
      <Stack.Screen name="MainDrawer" component={MainDrawer} />

      {/* Common Screens */}
      <Stack.Screen name="CommunityPost" component={CommunityPost} />

      <Stack.Screen name="Dashboard" component={SuperAdminDashboard} />

      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />

      <Stack.Screen name="SettingScreen" component={SettingsScreen} />

      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
      <Stack.Screen name="AboutApp" component={AboutAppScreen} />

      <Stack.Screen name="Messaging" component={MessagingScreen} />

      <Stack.Screen
        name="MessageDetailsScreen"
        component={MessageDetailsScreen}
      />

      <Stack.Screen name="ComposeMessage" component={ComposeMessageScreen} />

      <Stack.Screen name="MemberProfile" component={MemberProfileScreen} />

      <Stack.Screen name="LetterRecord" component={LetterRecordScreen} />

      {/* Collection Screens */}
      <Stack.Screen name="Payment" component={ReceivePaymentScreen} />
      <Stack.Screen name="SelectMemberScreen" component={SelectMemberScreen} />

      <Stack.Screen name="Transactions" component={TransactionsScreen} />
      <Stack.Screen name="Reports" component={CollectionReportScreen} />
      <Stack.Screen name="LedgerMembers" component={LedgerScreen} />
      <Stack.Screen name="ReferralLink" component={ReferralLinkScreen} />
      <Stack.Screen name="PaymentList" component={PaymentListScreen} />
      <Stack.Screen name="FardeHisaab" component={FardeHisaabScreen} />
      <Stack.Screen name="AddFardeHisaab" component={Addfardehisaabscreen} />
      <Stack.Screen
        name="IncomeExpenditure"
        component={IncomeExpenditureSummaryScreen}
      />
      <Stack.Screen
        name="AddIncomeExpenditure"
        component={AddIncomeExpenditureSummaryScreen}
      />

      {/* Expenditure */}
      <Stack.Screen name="Expenditure" component={ExpenditureScreen} />
      <Stack.Screen name="AddExpenditure" component={AddExpenditureScreen} />
      <Stack.Screen name="ExpenditureDetail" component={ExpenditureDetail} />

      {/* Wazifa Screens */}
      <Stack.Screen
        name="WazifaApplicationsScreen"
        component={WazifaApplicationsScreen}
      />
      <Stack.Screen
        name="WazifaApplicationSubmittedScreen"
        component={WazifaApplicationSubmittedScreen}
      />
      <Stack.Screen
        name="AddWazifaApplicationScreen"
        component={AddWazifaApplicationScreen}
      />
      <Stack.Screen
        name="VerifyWazifaListScreen"
        component={VerifyWazifaListScreen}
      />
      <Stack.Screen
        name="RecentTransactionsScreen"
        component={RecentTransactionsScreen}
      />
      <Stack.Screen
        name="WazifaDueReportScreen"
        component={WazifaDueReportScreen}
      />
      <Stack.Screen
        name="LedgerOfWazifadarScreen"
        component={LedgerOfWazifadarScreen}
      />

      {/* Membership */}
      <Stack.Screen name="MembershipScreen" component={MembershipScreen} />
      <Stack.Screen
        name="AddMembershipApplicationScreen"
        component={AddMembershipApplicationScreen}
      />
      <Stack.Screen
        name="MembershipListScreen"
        component={MembershipListScreen}
      />

      {/* Organization */}
      <Stack.Screen
        name="OfficeBearerMasterScreen"
        component={OfficeBearerMasterScreen}
      />
      <Stack.Screen
        name="AddOfficeBearerScreen"
        component={AddOfficeBearerScreen}
      />
      <Stack.Screen
        name="ExecutiveMembersScreen"
        component={ExecutiveMembersScreen}
      />
      <Stack.Screen
        name="AddExecutiveMembersScreen"
        component={AddExecutiveMembersScreen}
      />
      <Stack.Screen
        name="LocalSecretariesScreen"
        component={LocalSecretariesScreen}
      />
      <Stack.Screen
        name="AddLocalSecretaryScreen"
        component={AddLocalSecretaryScreen}
      />

      {/* User Management */}
      <Stack.Screen
        name="UserManagementScreen"
        component={UserManagementScreen}
      />
      <Stack.Screen name="AddUserScreen" component={AddUserScreen} />
      {/* <Stack.Screen name="AddStaffScreen" component={AddStaffScreen} /> */}
      <Stack.Screen
        name="UserAccessManagementScreen"
        component={UserAccessManagementScreen}
      />
      <Stack.Screen name="ActivityLogsScreen" component={ActivityLogsScreen} />

      {/* Master Screens */}
      <Stack.Screen name="DesignationScreen" component={DesignationScreen} />
      <Stack.Screen
        name="AddDesignationScreen"
        component={AddDesignationScreen}
      />
      <Stack.Screen name="TenureYearScreen" component={TenureYearScreen} />
      <Stack.Screen
        name="AddTenureYearScreen"
        component={AddTenureYearScreen}
      />
      <Stack.Screen name="CollectedByScreen" component={CollectedByScreen} />
      <Stack.Screen name="PaymentModeScreen" component={PaymentModeScreen} />
      <Stack.Screen
        name="AddPaymentModeScreen"
        component={AddPaymentModeScreen}
      />
      <Stack.Screen name="BankScreen" component={BankScreen} />
      <Stack.Screen name="AddBankScreen" component={AddBankScreen} />
      <Stack.Screen name="FundTypeScreen" component={FundTypeScreen} />
      <Stack.Screen name="AddFundTypeScreen" component={AddFundTypeScreen} />
      <Stack.Screen
        name="RateOfScholarshipScreen"
        component={RateOfScholarshipScreen}
      />
      <Stack.Screen
        name="AddRateOfScholarshipScreen"
        component={AddRateOfScholarshipScreen}
      />
      <Stack.Screen
        name="ScholarshipDateScreen"
        component={ScholarshipDateScreen}
      />
      <Stack.Screen
        name="AddScholarshipDateScreen"
        component={AddScholarshipDateScreen}
      />
      <Stack.Screen name="ExpenseScreen" component={ExpenseScreen} />
      <Stack.Screen name="AddExpenseScreen" component={AddExpenseScreen} />

      <Stack.Screen
        name="UnderDevelopmentScreen"
        component={UnderDevelopmentScreen}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigation;
