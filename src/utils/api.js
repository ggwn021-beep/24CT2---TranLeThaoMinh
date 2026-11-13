const API_URL = 'http://localhost:3000';

export async function fetchAPI(endpoint, options = {}) {
  // Lấy token từ localStorage
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const token = user?.token;

  // Cấu hình headers
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }), // Gắn Token vào
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);

  // Nếu Token hết hạn hoặc không hợp lệ (Lỗi 401)
  if (response.status === 401) {
    localStorage.removeItem('user');
    alert('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!');
    window.location.href = '/login';
    return null;
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Có lỗi xảy ra');
  }
  return data;
}