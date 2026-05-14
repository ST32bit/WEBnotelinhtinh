import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

const Activate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');
  const calledRef = useRef(false);

  useEffect(() => {
    if (!token) {
      // Auth guard: redirect to /home if already logged in and no token
      const authToken = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (authToken) { navigate('/home', { replace: true }); return; }
      setStatus('error');
      setMessage('Link kích hoạt không hợp lệ. Không tìm thấy token.');
      return;
    }

    // Prevent React StrictMode double-call
    if (calledRef.current) return;
    calledRef.current = true;

    const activateAccount = async () => {
      try {
        const { apiCall } = await import('../api');
        const res = await apiCall('/auth/activate', {
          method: 'POST',
          body: JSON.stringify({ token })
        });

        if (res.success) {
          setStatus('success');
          setMessage(res.message || 'Kích hoạt tài khoản thành công!');
          // Update isActive in storage if user is logged in
          localStorage.setItem('isActive', '1');
          sessionStorage.setItem('isActive', '1');
        }
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Kích hoạt thất bại. Token không hợp lệ hoặc đã hết hạn.');
      }
    };

    activateAccount();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-100 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
        
        {/* Loading */}
        {status === 'loading' && (
          <>
            <div className="text-6xl mb-4 animate-bounce">⏳</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Đang kích hoạt...</h2>
            <p className="text-sm text-gray-500">Vui lòng chờ trong giây lát.</p>
          </>
        )}

        {/* Success */}
        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-emerald-700 mb-3">Kích hoạt thành công!</h2>
            <div className="mb-5 rounded-lg bg-emerald-50 border border-emerald-200 p-4">
              <p className="text-sm text-emerald-700 font-semibold">{message}</p>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Tài khoản của bạn đã được kích hoạt. Bạn có thể đăng nhập ngay bây giờ.
            </p>
            <button 
              onClick={() => navigate('/login')} 
              className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white transition hover:translate-y-[-3px] hover:bg-blue-700"
            >
              Đăng nhập ngay
            </button>
          </>
        )}

        {/* Error */}
        {status === 'error' && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-700 mb-3">Kích hoạt thất bại</h2>
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-700 font-semibold">{message}</p>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Token có thể đã hết hạn hoặc đã được sử dụng. Vui lòng đăng ký lại.
            </p>
            <div className="flex gap-3">
              <Link to="/register" 
                className="flex-1 rounded-lg bg-gray-100 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-200 text-center no-underline">
                Đăng ký lại
              </Link>
              <Link to="/login" 
                className="flex-1 rounded-lg bg-blue-600 py-2.5 font-semibold text-white transition hover:bg-blue-700 text-center no-underline">
                Đăng nhập
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Activate;
