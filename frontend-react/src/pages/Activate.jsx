import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { apiCall } from '../api';

const Activate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');
  const calledRef = useRef(false);

  const activateAccount = async () => {
    if (!token) {
      setStatus('error');
      setMessage('Link kích hoạt không hợp lệ. Không tìm thấy token.');
      return;
    }

    setStatus('loading');
    try {
      const res = await apiCall('/auth/activate', {
        method: 'POST',
        body: JSON.stringify({ token })
      });

      if (res.success) {
        setStatus('success');
        setMessage(res.message || 'Kích hoạt tài khoản thành công!');
        localStorage.setItem('isActive', '1');
        sessionStorage.setItem('isActive', '1');
      } else {
        setStatus('error');
        setMessage(res.message || 'Kích hoạt thất bại. Token không hợp lệ hoặc đã hết hạn.');
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Kích hoạt thất bại. Token không hợp lệ hoặc đã hết hạn.');
    }
  };

  useEffect(() => {
    if (!token) {
      const authToken = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (authToken) { navigate('/home', { replace: true }); return; }
      setStatus('error');
      setMessage('Link kích hoạt không hợp lệ. Không tìm thấy token.');
      return;
    }

    if (calledRef.current) return;
    calledRef.current = true;
    activateAccount();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-100 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
        
        <div className="text-6xl mb-4">
          {status === 'success' ? '🎉' : status === 'error' ? '❌' : '✉️'}
        </div>
        <h2 className={`text-2xl font-bold mb-3 ${status === 'success' ? 'text-emerald-700' : status === 'error' ? 'text-red-700' : 'text-gray-800'}`}>
          {status === 'success'
            ? 'Kích hoạt thành công!'
            : status === 'error'
              ? 'Kích hoạt thất bại'
              : 'Xác nhận kích hoạt'}
        </h2>

        {message && (
          <div className={`mb-5 rounded-lg p-4 ${status === 'error' ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-200'}`}>
            <p className={`text-sm font-semibold ${status === 'error' ? 'text-red-700' : 'text-emerald-700'}`}>{message}</p>
          </div>
        )}

        {status === 'loading' && (
          <p className="text-sm text-gray-500 mb-5">Đang kích hoạt... vui lòng chờ.</p>
        )}

        {status === 'idle' && (
          <p className="text-sm text-gray-500 mb-5">Nhấn nút bên dưới để xác nhận kích hoạt.</p>
        )}

        {status === 'error' && (
          <p className="text-sm text-gray-500 mb-5">Token có thể đã hết hạn hoặc đã được sử dụng.</p>
        )}

        {status !== 'success' && (
          <button
            onClick={activateAccount}
            disabled={status === 'loading'}
            className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white transition hover:translate-y-[-3px] hover:bg-blue-700 disabled:opacity-60"
          >
            {status === 'loading' ? 'Đang kích hoạt...' : 'Xác nhận kích hoạt'}
          </button>
        )}

        {status === 'success' && (
          <button
            onClick={() => navigate('/login')}
            className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white transition hover:translate-y-[-3px] hover:bg-blue-700"
          >
            Đăng nhập ngay
          </button>
        )}

        {status === 'error' && (
          <div className="flex gap-3 mt-4">
            <Link
              to="/register"
              className="flex-1 rounded-lg bg-gray-100 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-200 text-center no-underline"
            >
              Đăng ký lại
            </Link>
            <Link
              to="/login"
              className="flex-1 rounded-lg bg-blue-600 py-2.5 font-semibold text-white transition hover:bg-blue-700 text-center no-underline"
            >
              Đăng nhập
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Activate;
