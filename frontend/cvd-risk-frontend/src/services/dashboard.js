import api from './api';

export const getDashboardData = async (userRole) => {
  try {
    // CRITICAL FIX: Always ensure fresh data by adding cache-busting parameter
    const timestamp = Date.now();
    const userId = localStorage.getItem('current_user_id');
    
    console.log(`📊 Fetching fresh dashboard data for user ${userId}, role: ${userRole}`);
    
    // Try the specific role endpoint first with cache-busting
    const primaryEndpoint = userRole === 'doctor' ? '/dashboard/doctor' : '/dashboard/patient';
    
    console.log(`📊 Trying primary dashboard endpoint: ${primaryEndpoint}`);
    const response = await api.get(primaryEndpoint, {
      params: { 
        _t: timestamp, // Cache-busting parameter
        user_id: userId // Explicit user context
      }
    });
    
    console.log('✅ Dashboard API response:', response.data);
    
    // CRITICAL FIX: Validate that data belongs to current user
    if (response.data.user_info && userId) {
      const responseUserId = response.data.user_info.id?.toString();
      if (responseUserId && responseUserId !== userId) {
        console.error('🚨 SECURITY ALERT: Response data belongs to different user!');
        throw new Error('Data mismatch - please refresh and try again');
      }
    }
    
    // Validate response structure
    if (!response.data) {
      throw new Error('No data received from server');
    }

    // Ensure required fields exist with user context validation
    const data = {
      user_info: response.data.user_info || {},
      statistics: response.data.statistics || {
        total_predictions: 0,
        recent_predictions: 0,
        recent_activity: 0,
        total_patients: userRole === 'doctor' ? 0 : null,
        risk_distribution: { High: 0, Moderate: 0, Low: 0 }
      },
      latest_prediction: response.data.latest_prediction || null,
      recent_predictions: response.data.recent_predictions || [],
      recent_activities: response.data.recent_activities || [],
      _fetched_at: new Date().toISOString(), // Track when data was fetched
      _user_id: userId // Track which user this data belongs to
    };

    return data;
    
  } catch (error) {
    console.error('Primary dashboard endpoint failed:', error);
    
    // CRITICAL FIX: Don't try fallbacks if it's a user data mismatch
    if (error.message.includes('Data mismatch')) {
      throw error;
    }
    
    // Try fallback endpoints with same cache-busting and user validation
    const fallbackEndpoints = [
      '/dashboard',
      '/api/dashboard',
      `/api/dashboard/${userRole}`
    ];

    const timestamp = Date.now();
    const userId = localStorage.getItem('current_user_id');

    for (const endpoint of fallbackEndpoints) {
      try {
        console.log(`📊 Trying fallback endpoint: ${endpoint}`);
        const response = await api.get(endpoint, {
          params: { 
            _t: timestamp,
            user_id: userId
          }
        });
        console.log(`✅ Success with fallback endpoint: ${endpoint}`);
        
        // Validate user data again
        if (response.data.user_info && userId) {
          const responseUserId = response.data.user_info.id?.toString();
          if (responseUserId && responseUserId !== userId) {
            console.error('🚨 SECURITY ALERT: Fallback response data belongs to different user!');
            continue; // Try next endpoint
          }
        }
        
        const data = {
          user_info: response.data.user_info || {},
          statistics: response.data.statistics || {
            total_predictions: 0,
            recent_predictions: 0,
            recent_activity: 0,
            total_patients: userRole === 'doctor' ? 0 : null,
            risk_distribution: { High: 0, Moderate: 0, Low: 0 }
          },
          latest_prediction: response.data.latest_prediction || null,
          recent_predictions: response.data.recent_predictions || [],
          recent_activities: response.data.recent_activities || [],
          _fetched_at: new Date().toISOString(),
          _user_id: userId
        };
        
        return data;
      } catch (fallbackError) {
        console.log(`❌ Fallback endpoint ${endpoint} failed:`, fallbackError.response?.status);
        continue;
      }
    }

    // If all endpoints fail, try to construct from other APIs with user validation
    console.log('📊 All dashboard endpoints failed, trying to construct from other APIs...');
    return await constructDashboardFromOtherAPIs(userRole);
  }
};

// CRITICAL FIX: Enhanced fallback with user validation
const constructDashboardFromOtherAPIs = async (userRole) => {
  try {
    console.log('📊 Constructing dashboard from available APIs...');
    
    const timestamp = Date.now();
    const userId = localStorage.getItem('current_user_id');
    
    const dashboardData = {
      user_info: {},
      statistics: {
        total_predictions: 0,
        recent_predictions: 0,
        recent_activity: 0,
        total_patients: userRole === 'doctor' ? 0 : null,
        risk_distribution: { High: 0, Moderate: 0, Low: 0 }
      },
      latest_prediction: null,
      recent_predictions: [],
      recent_activities: [],
      _fetched_at: new Date().toISOString(),
      _user_id: userId
    };

    // Try to get user info with cache-busting
    try {
      const userResponse = await api.get('/user/profile', {
        params: { _t: timestamp }
      });
      
      // Validate user data
      if (userResponse.data.id?.toString() === userId) {
        dashboardData.user_info = userResponse.data;
        console.log('✅ Got user info from /user/profile');
      } else {
        console.warn('⚠️ User profile data mismatch, skipping');
      }
    } catch (error) {
      console.log('❌ /user/profile not available');
      try {
        const authResponse = await api.get('/auth/me', {
          params: { _t: timestamp }
        });
        
        // Validate user data
        if (authResponse.data.id?.toString() === userId) {
          dashboardData.user_info = authResponse.data;
          console.log('✅ Got user info from /auth/me');
        } else {
          console.warn('⚠️ Auth user data mismatch, skipping');
        }
      } catch (error) {
        console.log('❌ /auth/me not available');
      }
    }

    // Try to get prediction history with user validation
    try {
      const predictionsResponse = await api.get('/predict/history', {
        params: { _t: timestamp }
      });
      const predictions = predictionsResponse.data;
      
      if (Array.isArray(predictions)) {
        // CRITICAL FIX: Validate predictions belong to current user
        const validPredictions = predictions.filter(p => {
          if (p.user_id) {
            return p.user_id.toString() === userId;
          }
          return true; // Keep if no user_id field (for backward compatibility)
        });
        
        dashboardData.recent_predictions = validPredictions.slice(0, 5);
        dashboardData.latest_prediction = validPredictions[0] || null;
        dashboardData.statistics.total_predictions = validPredictions.length;
        dashboardData.statistics.recent_predictions = validPredictions.filter(p => {
          const daysDiff = (new Date() - new Date(p.created_at)) / (1000 * 60 * 60 * 24);
          return daysDiff <= 7;
        }).length;

        // Calculate risk distribution from validated predictions
        const riskCounts = { High: 0, Moderate: 0, Low: 0 };
        validPredictions.forEach(p => {
          if (p.risk_category && riskCounts.hasOwnProperty(p.risk_category)) {
            riskCounts[p.risk_category]++;
          }
        });
        dashboardData.statistics.risk_distribution = riskCounts;
        
        console.log(`✅ Got ${validPredictions.length} validated predictions from /predict/history`);
      }
    } catch (error) {
      console.log('❌ /predict/history not available');
    }

    // Try to get patient list (for doctors) with user validation
    if (userRole === 'doctor') {
      try {
        const patientsResponse = await api.get('/patients', {
          params: { _t: timestamp }
        });
        if (Array.isArray(patientsResponse.data)) {
          // CRITICAL FIX: Validate patients belong to current doctor
          const validPatients = patientsResponse.data.filter(patient => {
            if (patient.doctor_id) {
              return patient.doctor_id.toString() === userId;
            }
            return true; // Keep if no doctor_id field (for backward compatibility)
          });
          
          dashboardData.statistics.total_patients = validPatients.length;
          console.log(`✅ Got ${validPatients.length} validated patients from /patients`);
        }
      } catch (error) {
        console.log('❌ /patients not available');
      }
    }

    // Create some recent activities based on available data
    dashboardData.recent_activities = generateActivitiesFromData(dashboardData, userRole);
    dashboardData.statistics.recent_activity = dashboardData.recent_activities.length;

    console.log('📊 Constructed dashboard data:', dashboardData);
    return dashboardData;

  } catch (error) {
    console.error('Failed to construct dashboard data:', error);
    
    // Create a more specific error message
    let errorMessage = 'No dashboard or related endpoints available';
    if (error.response?.status === 500) {
      errorMessage = 'Server error - please check backend';
    } else if (error.response?.status === 401) {
      errorMessage = 'Authentication required - please login';
    } else if (!error.response) {
      errorMessage = 'Backend server not reachable - check if it\'s running';
    }

    const enhancedError = new Error(errorMessage);
    enhancedError.originalError = error;
    enhancedError.status = error.response?.status;
    throw enhancedError;
  }
};

const generateActivitiesFromData = (data, userRole) => {
  const activities = [];
  
  if (data.latest_prediction) {
    activities.push({
      id: 1,
      description: userRole === 'doctor' ? 'Patient risk assessment completed' : 'CVD risk prediction completed',
      target: `${data.latest_prediction.risk_percentage}% risk level`,
      date: data.latest_prediction.created_at || new Date().toISOString()
    });
  }

  if (data.recent_predictions && data.recent_predictions.length > 1) {
    activities.push({
      id: 2,
      description: 'Previous prediction reviewed',
      target: 'Historical data accessed',
      date: data.recent_predictions[1].created_at || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    });
  }

  // Add profile activity
  activities.push({
    id: 3,
    description: 'Profile accessed',
    target: 'Dashboard viewed',
    date: new Date().toISOString()
  });

  return activities;
};