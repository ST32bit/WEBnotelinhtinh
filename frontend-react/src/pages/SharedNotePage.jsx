import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiCall } from '../api';

/**
 * SharedNotePage — handles public share links: /shared/:noteId
 * When user visits this URL:
 *   - If logged in → auto-join the note (adds to their shared list) → redirect to /home with shared tab
 *   - If not logged in → redirect to /login
 */
const SharedNotePage = () => {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  const isLoggedIn = !!(localStorage.getItem('token') || sessionStorage.getItem('token'));

  useEffect(() => {
    if (!isLoggedIn) {
      // Save the intended URL and redirect to login
      sessionStorage.setItem('redirectAfterLogin', `/shared/${noteId}`);
      navigate('/login', { replace: true });
      return;
    }

    // Auto-join the public note
    apiCall(`/shares/public-join/${noteId}`, { method: 'POST' })
      .then(res => {
        if (res.success) {
          if (res.is_owner) {
            // Owner visiting their own public link — just go home
            navigate('/home', { replace: true });
          } else {
            // Successfully joined — redirect to shared tab
            sessionStorage.setItem('goToSharedTab', 'true');
            navigate('/home', { replace: true });
          }
        }
      })
      .catch(err => {
        setStatus('error');
        setError(err.message || 'Không thể truy cập note này');
      });
  }, [noteId, isLoggedIn, navigate]);

  if (status === 'error') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0f172a', color: '#e2e8f0', fontFamily: 'Nunito, sans-serif'
      }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
          <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>Không thể truy cập</h2>
          <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>{error}</p>
          <button onClick={() => navigate('/home')}
            style={{
              background: '#6366f1', color: 'white', border: 'none', borderRadius: 12,
              padding: '10px 24px', fontSize: 14, fontWeight: 800, cursor: 'pointer'
            }}>
            ← Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0f172a', color: '#e2e8f0', fontFamily: 'Nunito, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, border: '4px solid #818cf8', borderTopColor: '#6366f1',
          borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px'
        }} />
        <p style={{ fontWeight: 800, fontSize: 15 }}>Đang tham gia note được chia sẻ...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
};

export default SharedNotePage;
