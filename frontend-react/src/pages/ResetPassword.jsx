import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setErr('Token không hợp lệ hoặc đã hết hạn.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(''); setMsg('');
    if (password.length < 6) {
      setErr('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setErr('Mật khẩu nhập lại không khớp.');
      return;
    }

    setIsLoading(true);
    try {
      const { apiCall } = await import('../api');
      const res = await apiCall('/auth/reset.php', {
        method: 'POST',
        body: JSON.stringify({ token, password })
      });
      if (res.success) {
        setMsg('✅ Đặt lại mật khẩu thành công! Chuyển về trang đăng nhập...');
        setTimeout(() => navigate('/login'), 2500);
      }
    } catch (error) {
      setErr(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-100">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-center text-3xl font-bold text-gray-800">Tạo Mật Khẩu Mới</h2>
        
        {err && <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">{err}</div>}
        {msg && <div className="mb-4 rounded-lg bg-emerald-100 p-3 text-sm text-emerald-700 font-semibold">{msg}</div>}

        {token && !msg && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Mật khẩu mới</label>
              <input 
                type="password" required placeholder="Nhập mật khẩu mới"
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Xác nhận mật khẩu</label>
              <input 
                type="password" required placeholder="Nhập lại mật khẩu"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button 
              type="submit" disabled={isLoading}
              className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Đang xử lý...' : 'Lưu mật khẩu mới'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <button onClick={() => navigate('/login')} className="text-sm font-semibold text-blue-600 hover:underline">
            Quay lại đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
