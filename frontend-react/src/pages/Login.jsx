import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiCall } from '../api';

const Login = () => { // Component đăng nhập sử dụng useState để quản lý trạng thái của email, password và rememberMe. Khi người dùng nhấn nút đăng nhập, hàm handleLogin sẽ được gọi để lưu thông tin người dùng vào localStorage hoặc sessionStorage tùy thuộc vào lựa chọn "Ghi nhớ đăng nhập". Sau đó, người dùng sẽ được điều hướng đến trang chủ (/home).
  const navigate = useNavigate(); // Sử dụng useNavigate để điều hướng người dùng sau khi đăng nhập thành công
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false); // Mặc định không ghi nhớ đăng nhập
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setIsLoading(true);

    try {
      const res = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('token', res.token);
      storage.setItem('currentUser', res.user?.email || email);
      storage.setItem('displayName', res.user?.display_name || res.user?.displayName || email.split('@')[0]);
      if (res.user?.avatar) storage.setItem('avatar', res.user.avatar);

      navigate('/home');
    } catch (err) {
      setErrorMsg(err.message || 'Đăng nhập thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    if (!resetEmail.trim()) {
      setErrorMsg('Vui lòng nhập email.');
      return;
    }

    setIsSendingReset(true);
    try {
      const res = await apiCall('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: resetEmail.trim() })
      });
      setInfoMsg(res.message || 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu.');
      setShowForgot(false);
    } catch (err) {
      setErrorMsg(err.message || 'Không thể gửi email đặt lại mật khẩu');
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-100">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-center text-3xl font-bold text-gray-800 select-none">Đăng Nhập</h2>
  
        {errorMsg && (
          <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">{errorMsg}</div>
        )}
        {infoMsg && (
          <div className="mb-4 rounded-lg bg-emerald-100 p-3 text-sm text-emerald-700 font-semibold">{infoMsg}</div>
        )}
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
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Quên mật khẩu?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white transition hover:translate-y-[-3px] hover:bg-blue-700 disabled:opacity-60 select-none"
          >
            {isLoading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 select-none">
          Chưa có tài khoản? <Link to="/register" className="font-semibold text-blue-600 hover:underline">Đăng ký ngay</Link>
        </p>

        {showForgot && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-bold mb-3">Quên mật khẩu</h3>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Nhập email đã đăng ký"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    className="flex-1 rounded-lg bg-gray-100 py-2.5 font-semibold text-gray-700 hover:bg-gray-200"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingReset}
                    className="flex-1 rounded-lg bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {isSendingReset ? 'Đang gửi...' : 'Gửi link'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login; 
