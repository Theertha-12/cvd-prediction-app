import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import DashboardLayout from '../layouts/DashboardLayout';
import StatsCard from '../components/dashboard/StatsCard';
import RiskGauge from '../components/dashboard/RiskGauge';
import PredictionHistory from '../components/dashboard/PredictionHistory';
import ActivityTimeline from '../components/dashboard/ActivityTimeline';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { getDashboardData } from '../services/dashboard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { AlertTriangle, RefreshCw, TrendingUp, Activity, Heart, Server, FileText, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const { 
    dashboardData, 
    setDashboardData,
    batchResults,
    batchFileName,
    clearBatchResults
  } = useAppContext();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatsDetail, setSelectedStatsDetail] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);
  const navigate = useNavigate();

  // CRITICAL FIX: Monitor user changes and clear stale data
  useEffect(() => {
    const userId = user?.id?.toString();
    const storedUserId = localStorage.getItem('current_user_id');
    
    if (userId && userId !== currentUserId) {
      console.log(`🔄 User changed from ${currentUserId} to ${userId}, clearing dashboard data...`);
      
      // Clear dashboard data when user changes
      setDashboardData(null);
      setError(null);
      setCurrentUserId(userId);
      
      // Force refetch by incrementing retry count
      setRetryCount(prev => prev + 1);
    }
  }, [user?.id, currentUserId, setDashboardData]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.role || !user?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const userId = user.id.toString();
        
        // CRITICAL FIX: Check if we have cached data for different user
        if (dashboardData && dashboardData._user_id && dashboardData._user_id !== userId) {
          console.log('🗑️ Clearing cached data from different user...');
          setDashboardData(null);
        }
        
        // CRITICAL FIX: Only use cached data if it belongs to current user and is recent
        const canUseCachedData = dashboardData && 
          dashboardData._user_id === userId &&
          dashboardData._fetched_at &&
          (Date.now() - new Date(dashboardData._fetched_at).getTime()) < 5 * 60 * 1000; // 5 minutes
        
        if (canUseCachedData && retryCount === 0) {
          console.log('📊 Using valid cached dashboard data for current user');
          setLoading(false);
          return;
        }
        
        console.log(`📊 Fetching FRESH dashboard data for user ${userId} via service...`);
        const data = await getDashboardData(user.role);
        console.log("📊 Real dashboardData received:", data);
        
        // CRITICAL FIX: Final validation that data belongs to current user
        if (data._user_id && data._user_id !== userId) {
          throw new Error('Security error: Dashboard data belongs to different user');
        }
        
        setDashboardData(data);
        setRetryCount(0);
        
      } catch (error) {
        console.error('Failed to fetch dashboard data:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
          userId: user?.id
        });
        
        // CRITICAL FIX: Handle security errors differently
        if (error.message.includes('Security error') || error.message.includes('Data mismatch')) {
          setError({
            message: 'Data security error. Please logout and login again.',
            canRetry: false,
            details: 'User data validation failed',
            isSecurityError: true
          });
        } else {
          setError({
            message: `Failed to load dashboard data: ${error.message}`,
            canRetry: true,
            details: error.response?.status ? `HTTP ${error.response.status}` : 'Network Error'
          });
        }
        
        setDashboardData(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user?.role, user?.id, setDashboardData, retryCount]);

  const handleRetry = () => {
    if (error?.isSecurityError) {
      // For security errors, force logout
      navigate('/logout');
      return;
    }
    setRetryCount(prev => prev + 1);
  };

  // CRITICAL FIX: Validate data belongs to current user before rendering
  const isDataValid = React.useMemo(() => {
    if (!dashboardData || !user?.id) return false;
    
    const userId = user.id.toString();
    const dataUserId = dashboardData._user_id;
    
    // If data has user ID, it must match current user
    if (dataUserId && dataUserId !== userId) {
      console.error('🚨 Dashboard data validation failed: data belongs to different user');
      return false;
    }
    
    // If user_info exists, validate it matches current user
    if (dashboardData.user_info?.id && dashboardData.user_info.id.toString() !== userId) {
      console.error('🚨 Dashboard user_info validation failed: belongs to different user');
      return false;
    }
    
    return true;
  }, [dashboardData, user?.id]);

  // Calculate batch results summary
  const batchSummary = React.useMemo(() => {
    if (!batchResults || !Array.isArray(batchResults)) return null;
    
    return {
      total: batchResults.length,
      high: batchResults.filter(r => r.risk?.toLowerCase() === 'high').length,
      medium: batchResults.filter(r => r.risk?.toLowerCase() === 'medium').length,
      low: batchResults.filter(r => r.risk?.toLowerCase() === 'low').length,
      avgScore: batchResults.reduce((sum, r) => sum + (r.score || 0), 0) / batchResults.length
    };
  }, [batchResults]);

  // ENHANCED: Merge dashboard stats with batch results (only if data is valid)
  const enhancedStats = React.useMemo(() => {
    if (!dashboardData?.statistics || !isDataValid) return null;
    
    const baseStats = dashboardData.statistics;
    
    // If we have batch results, merge them into the stats
    if (batchSummary && user?.role === 'doctor') {
      return {
        ...baseStats,
        // Add batch results to existing totals
        total_predictions: (baseStats.total_predictions || 0) + batchSummary.total,
        total_patients: (baseStats.total_patients || 0) + batchSummary.total,
        recent_activity: (baseStats.recent_activity || 0) + 1, // Batch upload counts as activity
        
        // Merge risk distributions
        risk_distribution: {
          High: (baseStats.risk_distribution?.High || 0) + batchSummary.high,
          Moderate: (baseStats.risk_distribution?.Moderate || 0) + batchSummary.medium,
          Low: (baseStats.risk_distribution?.Low || 0) + batchSummary.low
        }
      };
    }
    
    return baseStats;
  }, [dashboardData?.statistics, batchSummary, user?.role, isDataValid]);

  const renderStatsModalContent = () => {
    if (!selectedStatsDetail || !enhancedStats) return null;

    const stats = enhancedStats;
    
    switch (selectedStatsDetail) {
      case 'totalPredictions':
        return (
          <>
            <h3 className="text-lg font-semibold mb-4">Total Predictions Details</h3>
            <div className="space-y-2">
              <p className="flex justify-between">
                <span>Individual predictions:</span>
                <strong>{dashboardData?.statistics?.total_predictions || 0}</strong>
              </p>
              {batchSummary && (
                <p className="flex justify-between">
                  <span>Batch predictions:</span>
                  <strong>{batchSummary.total}</strong>
                </p>
              )}
              <div className="border-t pt-2">
                <p className="flex justify-between">
                  <span>Total predictions made:</span>
                  <strong>{stats.total_predictions || 0}</strong>
                </p>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                This includes all cardiovascular risk assessments performed {user?.role === 'doctor' ? 'for your patients' : 'for your health'}.
              </p>
            </div>
          </>
        );
      case 'recentActivity':
        return (
          <>
            <h3 className="text-lg font-semibold mb-4">Recent Activity Details</h3>
            <div className="space-y-2">
              <p className="flex justify-between">
                <span>Recent predictions (7 days):</span>
                <strong>{dashboardData?.statistics?.recent_predictions || 0}</strong>
              </p>
              {batchSummary && (
                <p className="flex justify-between">
                  <span>Batch analysis completed:</span>
                  <strong>1</strong>
                </p>
              )}
              <div className="border-t pt-2">
                <p className="flex justify-between">
                  <span>Total recent activity:</span>
                  <strong>{stats.recent_activity || 0}</strong>
                </p>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Activity includes predictions, profile updates, batch operations, and system interactions{user?.role === 'doctor' ? ', patient management' : ''}.
              </p>
            </div>
          </>
        );
      case 'totalPatients':
        return (
          <>
            <h3 className="text-lg font-semibold mb-4">Total Patients Details</h3>
            <div className="space-y-2">
              <p className="flex justify-between">
                <span>Individual patients:</span>
                <strong>{dashboardData?.statistics?.total_patients || 0}</strong>
              </p>
              {batchSummary && (
                <p className="flex justify-between">
                  <span>Batch patients:</span>
                  <strong>{batchSummary.total}</strong>
                </p>
              )}
              <div className="border-t pt-2">
                <p className="flex justify-between">
                  <span>Total patients under care:</span>
                  <strong>{stats.total_patients || 0}</strong>
                </p>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                All patients who have received cardiovascular risk assessments.
              </p>
            </div>
          </>
        );
      case 'highRisk':
        return (
          <>
            <h3 className="text-lg font-semibold mb-4">Risk Distribution Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  High Risk:
                </span>
                <strong className="text-red-600">{stats.risk_distribution?.High || 0}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  Moderate Risk:
                </span>
                <strong className="text-yellow-600">{stats.risk_distribution?.Moderate || 0}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  Low Risk:
                </span>
                <strong className="text-green-600">{stats.risk_distribution?.Low || 0}</strong>
              </div>
              {batchSummary && (
                <div className="bg-blue-50 p-3 rounded-lg mt-3">
                  <p className="text-sm text-blue-800 font-medium">Batch Contribution:</p>
                  <p className="text-xs text-blue-700">
                    High: {batchSummary.high}, Moderate: {batchSummary.medium}, Low: {batchSummary.low}
                  </p>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Risk categories based on cardiovascular risk assessment scores{user?.role === 'doctor' ? ' across all your patients' : ' from your assessments'}.
              </p>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <LoadingSpinner />
          <p className="text-gray-600">Loading your dashboard data...</p>
          {user?.id && (
            <p className="text-xs text-gray-400">User ID: {user.id}</p>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // CRITICAL FIX: Show data validation error
  if (!isDataValid && dashboardData) {
    return (
      <DashboardLayout>
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <AlertTriangle className="w-16 h-16 text-red-500" />
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Data Security Error</h3>
            <p className="text-gray-600 mb-4">
              Dashboard data validation failed. Please logout and login again.
            </p>
            <button
              onClick={() => navigate('/logout')}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout and Login Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !dashboardData) {
    return (
      <DashboardLayout>
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <Server className="w-16 h-16 text-red-500" />
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Unavailable</h3>
            <p className="text-gray-600 mb-1">
              {error?.message || "Unable to load dashboard data"}
            </p>
            {error?.details && (
              <p className="text-sm text-gray-500 mb-4">{error.details}</p>
            )}
            <div className="space-y-2">
              <button
                onClick={handleRetry}
                className={`px-6 py-2 text-white rounded-lg transition-colors flex items-center space-x-2 mx-auto ${
                  error?.isSecurityError 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>{error?.isSecurityError ? 'Logout' : 'Retry Loading'}</span>
              </button>
              <p className="text-xs text-gray-400">
                {error?.isSecurityError ? 'Security validation failed' : `Attempt #${retryCount + 1}`}
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate risk distribution for patient (using enhanced stats)
  const patientRiskDistribution = enhancedStats?.risk_distribution || {};
  const totalRiskCases = Object.values(patientRiskDistribution).reduce((a, b) => a + b, 0);
  const highRiskPercentage = totalRiskCases > 0 
    ? Math.round((patientRiskDistribution.High || 0) / totalRiskCases * 100) 
    : 0;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 w-full">
        {/* Success Banner - showing real data with user validation */}
        <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Server className="w-5 h-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800">
                ✅ Showing validated dashboard data for user {user?.id}
                {batchSummary && ` (including ${batchSummary.total} batch results)`}
              </p>
              {dashboardData._fetched_at && (
                <p className="text-xs text-green-600 mt-1">
                  Last updated: {new Date(dashboardData._fetched_at).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Batch Results Alert for Doctor */}
        {user?.role === 'doctor' && batchSummary && (
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <FileText className="w-5 h-5 text-blue-400 mt-0.5 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Batch Analysis Results Integrated</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    <strong>{batchFileName}</strong> - {batchSummary.total} patients analyzed 
                    ({batchSummary.high} high risk, {batchSummary.medium} moderate, {batchSummary.low} low)
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    📊 Statistics above include batch results
                  </p>
                </div>
              </div>
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => navigate('/batch-predict')}
                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  View Details
                </button>
                <button
                  onClick={clearBatchResults}
                  className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        <DashboardHeader user={dashboardData.user_info} />

        {/* Stats Cards - Responsive Grid with Enhanced Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 sm:mb-8">
          <StatsCard
            title="Total Predictions"
            value={enhancedStats?.total_predictions || 0}
            trend={12}
            icon="chartBar"
            onViewDetails={() => setSelectedStatsDetail('totalPredictions')}
          />
          
          <StatsCard
            title={user?.role === 'doctor' ? "Recent Activity" : "Recent Predictions"}
            value={
              user?.role === 'doctor' 
                ? enhancedStats?.recent_activity || 0 
                : enhancedStats?.recent_predictions || 0
            }
            trend={5}
            icon="clock"
            onViewDetails={() => setSelectedStatsDetail('recentActivity')}
          />
          
          {user?.role === 'doctor' ? (
            <StatsCard
              title="Total Patients"
              value={enhancedStats?.total_patients || 0}
              trend={3}
              icon="userGroup"
              onViewDetails={() => setSelectedStatsDetail('totalPatients')}
            />
          ) : (
            <StatsCard
              title="High Risk %"
              value={highRiskPercentage}
              trend={-2}
              icon="exclamation"
              isRisk={true}
              valueSuffix="%"
              onViewDetails={() => setSelectedStatsDetail('highRisk')}
            />
          )}
          
          <StatsCard
            title={user?.role === 'doctor' ? "High Risk Patients" : "High Risk Cases"}
            value={enhancedStats?.risk_distribution?.High || 0}
            trend={8}
            icon="shieldExclamation"
            isRisk={true}
            onViewDetails={() => setSelectedStatsDetail('highRisk')}
          />
        </div>

        {/* Main Content - Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 sm:mb-8">
          {/* Risk Gauge */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Heart className="w-5 h-5 mr-2 text-red-500" />
              {user?.role === 'doctor' ? 'Latest Patient Assessment' : 'Your CVD Risk Level'}
            </h2>
            <RiskGauge
              value={dashboardData.latest_prediction?.risk_percentage || 0}
              category={dashboardData.latest_prediction?.risk_category || 'Low'}
            />
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                {dashboardData.latest_prediction?.risk_category === 'High' ? (
                  <span className="text-red-600 font-medium">
                    ⚠️ High risk detected. {user?.role === 'doctor' ? 'Schedule patient consultation.' : 'Immediate consultation recommended.'}
                  </span>
                ) : dashboardData.latest_prediction?.risk_category === 'Moderate' ? (
                  <span className="text-yellow-600 font-medium">
                    ⚡ Moderate risk. {user?.role === 'doctor' ? 'Monitor patient closely.' : 'Consider lifestyle improvements.'}
                  </span>
                ) : (
                  <span className="text-green-600 font-medium">
                    ✅ Low risk. {user?.role === 'doctor' ? 'Continue regular monitoring.' : 'Maintain healthy habits.'}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Prediction History */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
              {user?.role === 'doctor' ? 'Recent Patient Assessments' : 'Your Prediction History'}
            </h2>
            <div className="min-h-[200px]">
              <PredictionHistory predictions={dashboardData.recent_predictions || []} />
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-green-500" />
            Recent Activity
          </h2>
          <div className="min-h-[150px]">
            <ActivityTimeline 
              activities={dashboardData.recent_activities || []} 
              userRole={user?.role}
            />
          </div>
        </div>

        {/* Stats Detail Modal */}
        {selectedStatsDetail && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
            onClick={() => setSelectedStatsDetail(null)}
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {renderStatsModalContent()}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedStatsDetail(null)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;