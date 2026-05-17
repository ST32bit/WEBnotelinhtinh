const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  const isFormData = options.body instanceof FormData;
  
  const defaultHeaders = isFormData ? {
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  } : {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    // Handle 401 Unauthorized — token expired or invalid
    if (response.status === 401) {
      const noLogoutEndpoints = [
        '/auth/login',
        '/auth/change-password',
        '/auth/forgot-password',
        '/auth/reset-password',
        '/auth/activate'
      ];

      if (!noLogoutEndpoints.includes(endpoint)) {
        // Clear stored auth data
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('displayName');
        localStorage.removeItem('isActive');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('displayName');
        sessionStorage.removeItem('isActive');

        // Only redirect if not already on auth pages
        const authPages = ['/login', '/register', '/activate', '/reset-password', '/shared'];
        if (!authPages.some(p => window.location.pathname.includes(p))) {
          window.location.href = '/login';
          return;
        }
      }

      // For auth pages or safe endpoints, just parse and throw the error normally
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || data.message || 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
    }

    // Safely parse response - handle non-JSON responses
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      throw new Error('Máy chủ trả về lỗi không mong muốn. Kiểm tra lại backend.');
    }

    if (!response.ok) {
      // Handle Laravel validation errors (422)
      if (data.errors) {
        const firstError = Object.values(data.errors)[0];
        throw new Error(Array.isArray(firstError) ? firstError[0] : firstError);
      }
      throw new Error(data.error || data.message || 'Có lỗi xảy ra từ máy chủ');
    }

    return data;
  } catch (error) {
    // Handle offline/network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.warn('Offline mode - request failed');
      throw new Error('Không có kết nối internet. Dữ liệu sẽ được lưu cục bộ.');
    }
    throw error;
  }
};

// Check if online
export const isOnline = () => navigator.onLine;

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Back online!');
    if (window.toast) window.toast('✅ Đã kết nối internet', 'success');
  });
  window.addEventListener('offline', () => {
    console.log('Went offline');
    if (window.toast) window.toast('⚠️ Mất kết nối internet - Chế độ offline', 'error');
  });
}
