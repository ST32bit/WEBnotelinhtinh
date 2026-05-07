import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => { // Component đăng nhập sử dụng useState để quản lý trạng thái của email, password và rememberMe. Khi người dùng nhấn nút đăng nhập, hàm handleLogin sẽ được gọi để lưu thông tin người dùng vào localStorage hoặc sessionStorage tùy thuộc vào lựa chọn "Ghi nhớ đăng nhập". Sau đó, người dùng sẽ được điều hướng đến trang chủ (/home).
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotErr, setForgotErr] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { apiCall } = await import('../api');
      const response = await apiCall('/auth/login.php', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      if (rememberMe) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('currentUser', response.user.email);
        localStorage.setItem('displayName', response.user.display_name);
        localStorage.setItem('isActive', response.user.is_active);
      } else {
        sessionStorage.setItem('token', response.token);
        sessionStorage.setItem('currentUser', response.user.email);
        sessionStorage.setItem('displayName', response.user.display_name);
        sessionStorage.setItem('isActive', response.user.is_active);
      }

      navigate('/home');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotErr(''); setForgotMsg('');
    if (!forgotEmail) return;
    try {
      const { apiCall } = await import('../api');
      const res = await apiCall('/auth/forgot.php', { method: 'POST', body: JSON.stringify({ email: forgotEmail }) });
      if (res.success) {
        setForgotMsg(res.message + (res.reset_link ? ` (Test link: ${res.reset_link})` : ''));
      }
    } catch (err) {
      setForgotErr(err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-100">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-center text-3xl font-bold text-gray-800 select-none">Đăng Nhập</h2>
        
        {error && <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">{error}</div>}
  
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 select-none">Email</label>
            <input 
              type="email" required placeholder="Nhập email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 transition hover:translate-y-[-3px] transition-transform duration-100 active:scale-95 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 select-none">Mật khẩu</label>
            <input 
              type="password" required placeholder="Mật khẩu"
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 transition hover:translate-y-[-3px] transition-transform duration-100 active:scale-95 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer select-none"> 
                Ghi nhớ đăng nhập
              </label>
            </div>

            <div className="text-sm">
              <button type="button" onClick={() => setShowForgot(true)} className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                Quên mật khẩu?
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white transition hover:translate-y-[-3px] hover:bg-blue-700 select-none disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {isLoading ? 'Đang xử lý...' : 'Đăng Nhập'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 select-none">
          Chưa có tài khoản? <Link to="/register" className="font-semibold text-blue-600 hover:underline">Đăng ký ngay</Link>
        </p>

        {/* Forgot Password Modal */}
        {showForgot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
              <button onClick={() => setShowForgot(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-bold">✕</button>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Khôi phục mật khẩu</h3>
              {forgotMsg && <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-lg text-sm break-all">{forgotMsg}</div>}
              {forgotErr && <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm">{forgotErr}</div>}
              <form onSubmit={handleForgot} className="space-y-4">
                <input type="email" required placeholder="Nhập email của bạn" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <button type="submit" className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700">Gửi Link Khôi Phục</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login; 
