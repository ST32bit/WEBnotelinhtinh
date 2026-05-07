import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activationLink, setActivationLink] = useState('');

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
      const response = await apiCall('/auth/register.php', {
        method: 'POST',
        body: JSON.stringify({
          email: formData.email,
          displayName: formData.displayName,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        })
      });
      
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
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-100 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-center text-3xl font-bold text-gray-800 select-none">Đăng Ký</h2>
        
        {error && <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">{error}</div>}

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