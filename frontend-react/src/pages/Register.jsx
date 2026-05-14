<<<<<<< HEAD
import { useState, useEffect } from 'react';
=======
import { useState } from 'react';
>>>>>>> a518c7f15ee7892eb351a53417168a339bed928d
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
<<<<<<< HEAD
    username: '',
=======
>>>>>>> a518c7f15ee7892eb351a53417168a339bed928d
    displayName: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
<<<<<<< HEAD
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [countdown, setCountdown] = useState(5);

  // Auth guard: redirect to /home if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) navigate('/home', { replace: true });
  }, [navigate]);
=======
  const [activationLink, setActivationLink] = useState('');
>>>>>>> a518c7f15ee7892eb351a53417168a339bed928d

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu nhập lại không khớp!');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      const { apiCall } = await import('../api');
<<<<<<< HEAD
      const response = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
=======
      const response = await apiCall('/auth/register.php', {
        method: 'POST',
        body: JSON.stringify({
          email: formData.email,
>>>>>>> a518c7f15ee7892eb351a53417168a339bed928d
          displayName: formData.displayName,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        })
      });
      
<<<<<<< HEAD
      // Do NOT store token — user must activate account first
      // Show success message - user needs to activate via email
      setRegisterSuccess(true);
      setSuccessMessage(response.message || 'Đăng ký thành công! Kiểm tra email để kích hoạt tài khoản.');
=======
      // Auto-login success
      localStorage.setItem('token', response.token);
      localStorage.setItem('currentUser', response.user.email);
      localStorage.setItem('displayName', response.user.display_name);
      localStorage.setItem('isActive', response.user.is_active);

      if (response.activation_link) {
        // Local demo: show activation link instead of auto-navigate
        setActivationLink(response.activation_link);
      } else {
        navigate('/home');
      }
>>>>>>> a518c7f15ee7892eb351a53417168a339bed928d
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

<<<<<<< HEAD
  // Auto-redirect countdown after registration success
  useEffect(() => {
    if (!registerSuccess) return;
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [registerSuccess, navigate]);

  // Success screen after registration
  if (registerSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sky-100 py-10">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
          <div className="text-6xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Kiểm tra Email!</h2>
          
          <div className="mb-6 rounded-lg bg-emerald-50 border border-emerald-200 p-4">
            <p className="text-sm text-emerald-700 font-semibold">{successMessage}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-5 text-left">
            <p className="text-sm text-gray-600 mb-2">📌 <strong>Hướng dẫn:</strong></p>
            <ol className="text-sm text-gray-600 space-y-1.5 list-decimal list-inside">
              <li>Mở hộp thư email <strong>{formData.email}</strong></li>
              <li>Tìm email từ <strong>NoteApp</strong></li>
              <li>Nhấn vào link kích hoạt trong email</li>
              <li>Tài khoản sẽ được kích hoạt tự động</li>
            </ol>
          </div>

          <p className="text-xs text-gray-400 mb-4">
            Không nhận được email? Kiểm tra thư mục Spam/Junk.
          </p>

          <p className="text-sm text-gray-500 mb-3">
            Tự động chuyển về trang đăng nhập sau <strong className="text-blue-600">{countdown}s</strong>
          </p>

          <button 
            onClick={() => navigate('/login')} 
            className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white transition hover:translate-y-[-3px] hover:bg-blue-700"
          >
            Đi tới trang Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

=======
>>>>>>> a518c7f15ee7892eb351a53417168a339bed928d
  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-100 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-center text-3xl font-bold text-gray-800 select-none">Đăng Ký</h2>
        
        {error && <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">{error}</div>}

<<<<<<< HEAD
=======
        {activationLink && (
          <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-4">
            <p className="text-sm font-bold text-emerald-700 mb-2">✅ Đăng ký thành công! Kích hoạt tài khoản:</p>
            <a href={activationLink} target="_blank" rel="noreferrer"
              className="text-xs text-blue-600 underline break-all">
              {activationLink}
            </a>
            <button onClick={() => navigate('/login')} className="mt-3 w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Vào trang đăng nhập
            </button>
          </div>
        )}

>>>>>>> a518c7f15ee7892eb351a53417168a339bed928d
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 select-none">Tên hiển thị (Display Name)</label>
            <input 
              type="text" name="displayName" required onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 transition hover:translate-y-[-3px] transition-transform duration-100 active:scale-95 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Nhập tên của bạn"
            />
          </div>

          <div>
<<<<<<< HEAD
            <label className="mb-1 block text-sm font-medium text-gray-700 select-none">Username</label>
            <input 
              type="text" name="username" required minLength={3} onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 transition hover:translate-y-[-3px] transition-transform duration-100 active:scale-95 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Nhập username (ít nhất 3 ký tự)"
            />
          </div>

          <div>
=======
>>>>>>> a518c7f15ee7892eb351a53417168a339bed928d
            <label className="mb-1 block text-sm font-medium text-gray-700 select-none">Email</label>
            <input 
              type="email" name="email" required onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 transition hover:translate-y-[-3px] transition-transform duration-100 active:scale-95 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Nhập email"
            />
          </div>
          
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 select-none">Mật khẩu</label>
            <input 
              type="password" name="password" required minLength={6} onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 transition hover:translate-y-[-3px] transition-transform duration-100 active:scale-95 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Nhập mật khẩu (Ít nhất 6 ký tự)"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 select-none">Xác nhận Mật khẩu</label>
            <input 
              type="password" name="confirmPassword" required minLength={6} onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 transition hover:translate-y-[-3px] transition-transform duration-100 active:scale-95 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Nhập lại mật khẩu"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="mt-4 w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white transition hover:translate-y-[-3px] hover:bg-blue-700 select-none disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {isLoading ? 'Đang xử lý...' : 'Tạo Tài Khoản'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 select-none">
          Đã có tài khoản? <Link to="/login" className="font-semibold text-blue-600 hover:underline">Đăng nhập ngay</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;