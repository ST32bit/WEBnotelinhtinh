const BASE_URL = 'http://localhost:8000/api';

export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    
    // Handle 401 Unauthorized — token expired or invalid
    if (response.status === 401) {
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

      // For auth pages, just parse and throw the error normally
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
    throw error;
  }
};
