

// ============================================================
// EXAMPLE 1: Simple Dashboard Data Fetch
// ============================================================
export const exampleSimpleFetch = async (year = 2026) => {
  try {
    const response = await getAdminDashboard(year);
    
    if (response.success) {
      console.log('Dashboard data:', response.data);
      return response.data;
    } else {
      console.error('Failed to fetch dashboard:', response.message);
      return null;
    }
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
};

// ============================================================
// EXAMPLE 2: Extract Only Members Data
// ============================================================
export const exampleGetMembers = async (year = 2026) => {
  try {
    const response = await getDashboardMembers(year);
    
    if (response.success) {
      const { total, memberTypeStats } = response.members;
      
      // Log summary
      console.log(`Total Members: ${total.totalMembers}`);
      console.log(`Active: ${total.activeMembers}`);
      console.log(`Member Types: ${memberTypeStats.length}`);
      
      return response.members;
    }
  } catch (error) {
    console.error('Members fetch error:', error);
  }
};

// ============================================================
// EXAMPLE 3: Extract Collections/Funds
// ============================================================
export const exampleGetFunds = async (year = 2026) => {
  try {
    const response = await getDashboardFundSummary(year);
    
    if (response.success) {
      const { totalCollection1, corpusFund, reserveFund } = response.fundSummary;
      
      console.log(`Total: ${totalCollection1}`);
      console.log(`Corpus: ${corpusFund}`);
      console.log(`Reserve: ${reserveFund}`);
      
      return response.fundSummary;
    }
  } catch (error) {
    console.error('Fund fetch error:', error);
  }
};

// ============================================================
// EXAMPLE 4: Extract Scholarship Data
// ============================================================
export const exampleGetScholarships = async (year = 2026) => {
  try {
    const response = await getDashboardScholarships(year);
    
    if (response.success) {
      const {
        totalScholarships,
        pendingScholarships,
        approvedScholarships,
        rejectedScholarships,
      } = response.scholarships;
      
      console.log(`Total Applications: ${totalScholarships}`);
      console.log(`Pending: ${pendingScholarships}`);
      console.log(`Approved: ${approvedScholarships}`);
      console.log(`Rejected: ${rejectedScholarships}`);
      
      return response.scholarships;
    }
  } catch (error) {
    console.error('Scholarship fetch error:', error);
  }
};

// ============================================================
// EXAMPLE 5: Get Monthly Collection Data for Charts
// ============================================================
export const exampleGetMonthlyCollection = async (year = 2026) => {
  try {
    const response = await getDashboardCollection(year);
    
    if (response.success) {
      const { monthlyGraph } = response.collection;
      
      // Transform for charting library (e.g., Victory, React Native Chart Kit)
      const chartData = monthlyGraph.map(item => ({
        name: item.month,
        amount: item.amount,
        x: item.month,
        y: item.amount,
      }));
      
      console.log('Chart data:', chartData);
      return chartData;
    }
  } catch (error) {
    console.error('Collection fetch error:', error);
  }
};

// ============================================================
// EXAMPLE 6: Get Disbursement Status
// ============================================================
export const exampleGetDisbursementStatus = async (year = 2026) => {
  try {
    const response = await getDashboardDisbursedStatus(year);
    
    if (response.success) {
      const { pending, disbursed, returned, resend } = response.disbursedStatus;
      
      console.log(`Pending: ${pending}`);
      console.log(`Disbursed: ${disbursed}`);
      console.log(`Returned: ${returned}`);
      console.log(`Resend: ${resend}`);
      
      return response.disbursedStatus;
    }
  } catch (error) {
    console.error('Disbursement status error:', error);
  }
};

// ============================================================
// EXAMPLE 7: Multi-Section Dashboard (React Hooks Pattern)
// ============================================================
export const useMultiSectionDashboard = (year) => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [data, setData] = React.useState({
    members: null,
    scholarships: null,
    funds: null,
    collection: null,
  });

  React.useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);

      try {
        const [membersRes, scholRes, fundsRes, collRes] = await Promise.all([
          getDashboardMembers(year),
          getDashboardScholarships(year),
          getDashboardFundSummary(year),
          getDashboardCollection(year),
        ]);

        if (
          membersRes.success &&
          scholRes.success &&
          fundsRes.success &&
          collRes.success
        ) {
          setData({
            members: membersRes.members,
            scholarships: scholRes.scholarships,
            funds: fundsRes.fundSummary,
            collection: collRes.collection,
          });
        } else {
          setError('Failed to fetch dashboard data');
        }
      } catch (err) {
        setError(err.message);
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [year]);

  return { loading, error, data };
};

// ============================================================
// EXAMPLE 8: Format Data for Display
// ============================================================
export const formatDashboardDisplay = (dashboardData) => {
  if (!dashboardData) return null;

  return {
    memberStats: {
      total: dashboardData.members?.total?.totalMembers || 0,
      active: dashboardData.members?.total?.activeMembers || 0,
      suspended: dashboardData.members?.total?.suspendedMembers || 0,
      expired: dashboardData.members?.total?.expiredMembers || 0,
    },
    memberTypes: dashboardData.members?.memberTypeStats?.map(m => ({
      type: m.memberType || 'Unclassified',
      total: m.totalMembers,
      active: m.activeMembers,
    })) || [],
    scholarshipStats: {
      total: dashboardData.scholarships?.totalScholarships || 0,
      pending: dashboardData.scholarships?.pendingScholarships || 0,
      approved: dashboardData.scholarships?.approvedScholarships || 0,
      rejected: dashboardData.scholarships?.rejectedScholarships || 0,
    },
    fundStats: {
      totalCollection: dashboardData.fundSummary?.totalCollection1 || 0,
      corpus: dashboardData.fundSummary?.corpusFund || 0,
      reserve: dashboardData.fundSummary?.reserveFund || 0,
      membership: dashboardData.fundSummary?.membershipDonation || 0,
      others: dashboardData.fundSummary?.others || 0,
    },
    collectionMonthly: dashboardData.collection?.monthlyGraph || [],
  };
};

// ============================================================
// EXAMPLE 9: Export Data as CSV/Report
// ============================================================
export const generateDashboardReport = (dashboardData) => {
  const formatted = formatDashboardDisplay(dashboardData);

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalMembers: formatted.memberStats.total,
      totalScholarships: formatted.scholarshipStats.total,
      totalCollection: formatted.fundStats.totalCollection,
    },
    memberDetails: formatted.memberTypes,
    collectionMonthly: formatted.collectionMonthly,
  };

  return report;
};

// ============================================================
// EXAMPLE 10: Conditional Dashboard Based on Role
// ============================================================
export const getDashboardByRole = async (userRole, year = 2026) => {
  try {
    let response;

    if (userRole === 'super_admin') {
      response = await getSuperAdminDashboard(year);
    } else if (userRole === 'admin') {
      response = await getAdminDashboard(year);
    } else {
      throw new Error('Unsupported role');
    }

    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    console.error(`Dashboard error for role ${userRole}:`, error);
    throw error;
  }
};

/**
 * HOW TO USE THESE EXAMPLES:
 * 
 * 1. Simple fetch in a screen:
 *    const data = await exampleSimpleFetch(2026);
 * 
 * 2. Extract specific section:
 *    const members = await exampleGetMembers(2026);
 * 
 * 3. For React components, use the hook:
 *    const { loading, error, data } = useMultiSectionDashboard(2026);
 * 
 * 4. Format data for display:
 *    const display = formatDashboardDisplay(data);
 * 
 * 5. Generate reports:
 *    const report = generateDashboardReport(data);
 */
