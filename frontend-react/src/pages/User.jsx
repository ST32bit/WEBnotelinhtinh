import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
//biến hằng
const AVATAR_PRESETS = [
  { seed: 'Felix',    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
  { seed: 'Mia',      url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia' },
  { seed: 'Luna',     url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna' },
  { seed: 'Kai',      url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kai' },
  { seed: 'Nova',     url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nova' },
  { seed: 'Pixel',    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pixel' },
  { seed: 'Zara',     url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zara' },
  { seed: 'Blaze',    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Blaze' },
];

const ACCENT_COLORS = [
  { label: 'Indigo',   from: '#6366f1', to: '#8b5cf6', cls: 'from-indigo-500 to-violet-600' },
  { label: 'Rose',     from: '#f43f5e', to: '#ec4899', cls: 'from-rose-500 to-pink-500' },
  { label: 'Sky',      from: '#0ea5e9', to: '#6366f1', cls: 'from-sky-500 to-indigo-500' },
  { label: 'Emerald',  from: '#10b981', to: '#14b8a6', cls: 'from-emerald-500 to-teal-500' },
  { label: 'Amber',    from: '#f59e0b', to: '#ef4444', cls: 'from-amber-500 to-red-500' },
  { label: 'Fuchsia',  from: '#a855f7', to: '#ec4899', cls: 'from-purple-500 to-pink-500' },
];

const User = () => {
  const navigate = useNavigate();

  const currentUser   = localStorage.getItem('currentUser')   || 'sinhvien@gmail.com';
  const currentName   = localStorage.getItem('displayName')   || currentUser.split('@')[0];
  const currentAvatar = localStorage.getItem('avatar')        || AVATAR_PRESETS[0].url;
  const currentAccent = localStorage.getItem('accentColor')   || ACCENT_COLORS[0].cls;

  const [displayName,   setDisplayName]   = useState(currentName);
  const [email,         setEmail]         = useState(currentUser);
  const [avatar,        setAvatar]        = useState(currentAvatar);
  const [accentCls,     setAccentCls]     = useState(currentAccent);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,   setNewPassword]   = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPassword,  setShowPassword]  = useState(false);
  const [successMsg,    setSuccessMsg]    = useState('');
  const [errorMsg,      setErrorMsg]      = useState('');
  const [activeTab,     setActiveTab]     = useState('profile');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('⚠️ Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setAvatar(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMsg('⚠️ Tên hiển thị không được để trống!');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    localStorage.setItem('displayName', displayName.trim());
    localStorage.setItem('avatar', avatar);
    localStorage.setItem('accentColor', accentCls);
    setSuccessMsg('✅ Lưu thay đổi thành công!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleChangePassword = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!currentPassword || !newPassword) {
      setErrorMsg('⚠️ Vui lòng nhập đủ mật khẩu hiện tại và mật khẩu mới.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('⚠️ Mật khẩu mới và xác nhận không khớp.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('⚠️ Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      setErrorMsg('⚠️ Bạn cần đăng nhập để đổi mật khẩu.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { apiCall } = await import('../api');
      const res = await apiCall('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (res.success) {
        setSuccessMsg('✅ Đổi mật khẩu thành công!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setErrorMsg(res.message || '⚠️ Đổi mật khẩu thất bại.');
      }
    } catch (err) {
      setErrorMsg(err.message || '⚠️ Đổi mật khẩu thất bại.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
    setConfirmPhrase('');
    setDeleteError('');
  };

  const handleDeleteAccountConfirm = async () => {
    if (confirmPhrase.trim().toUpperCase() !== 'DELETE ACCOUNT') {
      setDeleteError('⚠️ Vui lòng nhập đúng chữ "DELETE ACCOUNT" để xác nhận.');
      return;
    }
    setIsDeleting(true);
    setDeleteError('');
    try {
      // 1. Delete on server if online
      if (navigator.onLine) {
        const { apiCall } = await import('../api');
        await apiCall('/users/me', { method: 'DELETE' });
      }
      
      // 2. Clear IndexedDB
      const { clearAllLocalData } = await import('../db');
      await clearAllLocalData();
      
      // 3. Clear localStorage / sessionStorage
      localStorage.clear();
      sessionStorage.clear();
      
      // 4. Close modal and navigate
      setShowDeleteModal(false);
      navigate('/login');
    } catch (err) {
      console.error(err);
      setDeleteError(err.message || '⚠️ Không thể xóa tài khoản. Vui lòng thử lại.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
    navigate('/login');
  };

  const tabs = [
    { id: 'profile',   icon: '👤', label: 'Hồ sơ' },
    { id: 'security',  icon: '🔒', label: 'Bảo mật' },
    { id: 'appearance',icon: '🎨', label: 'Giao diện' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-50 py-8 px-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        * { font-family: 'Nunito', sans-serif; }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
        @keyframes bounceIn { 0%{transform:scale(0.85);opacity:0}60%{transform:scale(1.04)}100%{transform:scale(1);opacity:1} }
        .fade-up  { animation: fadeInUp 0.4s ease forwards; }
        .bounce-in{ animation: bounceIn 0.35s ease forwards; }

        .tab-btn { padding:10px 20px; border-radius:14px; font-weight:800; font-size:14px; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; gap:8px; }
        .tab-btn.active { background:white; box-shadow:0 4px 15px rgba(99,102,241,0.18); color:#4f46e5; }
        .tab-btn:not(.active) { color:#9ca3af; }
        .tab-btn:not(.active):hover { color:#6366f1; background:white/50; }

        .field-label { font-size:12px; font-weight:800; color:#9ca3af; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px; display:block; }
        .field-input { width:100%; border-radius:16px; border:2px solid #e5e7eb; padding:14px 16px; font-size:15px; font-weight:700; color:#1f2937; background:#f9fafb; transition:all 0.2s; outline:none; }
        .field-input:focus { border-color:#6366f1; background:white; box-shadow:0 0 0 4px rgba(99,102,241,0.08); }

        .accent-swatch { width:36px; height:36px; border-radius:12px; cursor:pointer; transition:all 0.2s; border:3px solid transparent; }
        .accent-swatch:hover { transform:scale(1.15); }
        .accent-swatch.selected { border-color:white; box-shadow:0 0 0 3px #6366f1; transform:scale(1.1); }

        .avatar-preset { width:56px; height:56px; border-radius:16px; cursor:pointer; border:3px solid transparent; transition:all 0.2s; overflow:hidden; }
        .avatar-preset:hover { transform:scale(1.1); }
        .avatar-preset.selected { border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,0.3); }

        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#d1d5db; border-radius:100px; }
      `}</style>

      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate('/home')}
          className="mb-6 flex items-center gap-2 font-black text-gray-500 hover:text-indigo-600 transition-all group">
          <span className="w-9 h-9 rounded-xl bg-white shadow-sm border border-gray-200 flex items-center justify-center group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-all">←</span>
          Về trang chủ
        </button>

        <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white overflow-hidden fade-up">

          <div className={`bg-gradient-to-r ${accentCls} p-10 relative overflow-visible`}>
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10"></div>
            <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/10"></div>

            <div className="relative flex flex-col items-center">
              <div className="relative mb-4">
                <div className="relative group">
                  <div className="w-28 h-28 rounded-3xl border-4 border-white shadow-xl overflow-hidden bg-white">
                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>

              <h1 className="text-3xl font-black text-white drop-shadow-sm">{displayName}</h1>
              <p className="text-white/80 font-bold mt-1 text-sm">🎓 {email}</p>
            </div>
          </div>

          <div className="flex gap-2 p-4 bg-gray-50/80 border-b border-gray-100">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}>
                <span>{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>

          <div className="p-6 sm:p-8">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />

            {successMsg && (
              <div className="mb-5 bg-emerald-50 text-emerald-700 p-4 rounded-2xl font-bold border border-emerald-200 text-center bounce-in">
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="mb-5 bg-red-50 text-red-600 p-4 rounded-2xl font-bold border border-red-200 text-center bounce-in">
                {errorMsg}
              </div>
            )}

            {activeTab === 'profile' && (
              <form onSubmit={handleSave} className="space-y-5 fade-up">
                <div>
                  <label className="field-label">Tên hiển thị</label>
                  <input type="text" required value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="field-input" placeholder="Tên của bạn..." />
                </div>
                <div>
                  <label className="field-label">Email</label>
                  <input type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="field-input" placeholder="email@example.com" />
                </div>
                <button type="submit"
                  className={`w-full py-4 rounded-2xl bg-gradient-to-r ${accentCls} text-white font-black text-lg shadow-xl hover:opacity-90 hover:-translate-y-0.5 transition-all`}>
                  💾 Lưu thay đổi
                </button>
              </form>
            )}

            {activeTab === 'security' && (
              <div className="space-y-5 fade-up">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                  <span className="text-2xl">🔐</span>
                  <div>
                    <p className="font-black text-amber-800 text-sm">Bảo mật tài khoản</p>
                    <p className="text-xs text-amber-600 font-medium mt-0.5">Đổi mật khẩu thường xuyên để bảo vệ tài khoản nhé!</p>
                  </div>
                </div>

                <div>
                  <label className="field-label">Mật khẩu hiện tại</label>
                  <input type="password" placeholder="Nhập mật khẩu hiện tại..."
                    value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                    className="field-input" />
                </div>

                <div>
                  <label className="field-label">Mật khẩu mới</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'}
                      value={newPassword} onChange={e => setNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới..."
                      className="field-input pr-12" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500 transition text-lg">
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>

                  {newPassword && (
                    <div className="mt-3">
                      <div className="flex gap-1 mb-1">
                        {[1,2,3,4].map(i => {
                          const strength = Math.min(4, Math.floor(
                            (newPassword.length >= 8 ? 1 : 0) +
                            (/[A-Z]/.test(newPassword) ? 1 : 0) +
                            (/[0-9]/.test(newPassword) ? 1 : 0) +
                            (/[^a-zA-Z0-9]/.test(newPassword) ? 1 : 0)
                          ));
                          const colors = ['bg-red-400','bg-orange-400','bg-yellow-400','bg-green-500'];
                          return (
                            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength ? colors[strength-1] : 'bg-gray-200'}`}></div>
                          );
                        })}
                      </div>
                      <p className="text-xs font-bold text-gray-400">
                        {(() => {
                          const s = Math.min(4,
                            (newPassword.length >= 8 ? 1 : 0) +
                            (/[A-Z]/.test(newPassword) ? 1 : 0) +
                            (/[0-9]/.test(newPassword) ? 1 : 0) +
                            (/[^a-zA-Z0-9]/.test(newPassword) ? 1 : 0)
                          );
                          return ['Rất yếu 😬','Yếu 😟','Trung bình 🤔','Mạnh 💪','Rất mạnh 🔒'][s];
                        })()}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="field-label">Xác nhận mật khẩu mới</label>
                  <input type="password" placeholder="Nhập lại mật khẩu mới..."
                    value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)}
                    className="field-input" />
                </div>

                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition disabled:opacity-60">
                  {isChangingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </button>
              </div>
            )}

            {activeTab === 'appearance' && (
              <form onSubmit={handleSave} className="space-y-6 fade-up">
                <div>
                  <label className="field-label">Màu chủ đạo (Header gradient)</label>
                  <div className="flex gap-3 flex-wrap mt-2">
                    {ACCENT_COLORS.map(c => (
                      <button key={c.label} type="button"
                        onClick={() => setAccentCls(c.cls)}
                        title={c.label}
                        className={`accent-swatch bg-gradient-to-br ${c.cls} ${accentCls === c.cls ? 'selected' : ''}`}>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="field-label">Avatar mẫu</label>
                  <div className="flex gap-3 flex-wrap mt-2">
                    {AVATAR_PRESETS.map(p => (
                      <img key={p.seed} src={p.url} alt={p.seed}
                        onClick={() => setAvatar(p.url)}
                        className={`avatar-preset ${avatar === p.url ? 'selected' : ''}`} />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="field-label">Hoặc tải ảnh từ máy tính</label>
                  <button type="button" onClick={() => fileInputRef.current.click()}
                    className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 font-black hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-3">
                    <span className="text-2xl">📁</span> Chọn ảnh (tối đa 5MB)
                  </button>
                </div>

                <div className={`rounded-3xl p-6 bg-gradient-to-r ${accentCls} flex items-center gap-4`}>
                  <div className="w-16 h-16 rounded-2xl border-3 border-white shadow-lg overflow-hidden bg-white flex-shrink-0">
                    <img src={avatar} alt="preview" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-white font-black text-xl">{displayName || 'Tên của bạn'}</p>
                    <p className="text-white/70 text-sm font-bold">🎓 {email}</p>
                  </div>
                </div>
                <button type="submit"
                  className={`w-full py-4 rounded-2xl bg-gradient-to-r ${accentCls} text-white font-black text-lg shadow-xl hover:opacity-90 hover:-translate-y-0.5 transition-all`}>
                  💾 Lưu thay đổi
                </button>
              </form>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-100">
              <button type="button" onClick={handleLogout}
                className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-600 font-black hover:bg-gray-200 transition-all">
                🚪 Đăng xuất
              </button>
              <button type="button" onClick={handleDeleteAccount}
                className="flex-1 py-4 rounded-2xl bg-red-50 text-red-600 font-black hover:bg-red-500 hover:text-white transition-all border border-red-200">
                🗑️ Xóa tài khoản
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl border border-red-100 shadow-2xl overflow-hidden transform transition-all duration-300 scale-100 flex flex-col">
            {/* Top red header warning banner */}
            <div className="bg-red-500 p-6 text-white flex flex-col items-center justify-center gap-2">
              <span className="text-4xl animate-bounce">⚠️</span>
              <h3 className="text-xl font-black text-center tracking-tight">XÓA TÀI KHOẢN VĨNH VIỄN</h3>
            </div>
            
            {/* Body */}
            <div className="p-6 flex-1 flex flex-col gap-4 text-gray-700">
              <p className="text-sm font-bold text-gray-500 leading-relaxed">
                Hành động này <span className="text-red-600 font-black underline">không thể hoàn tác</span>! Tất cả các ghi chú, nhãn dán, tệp đính kèm và dữ liệu liên kết của bạn sẽ bị xóa vĩnh viễn trên máy chủ lẫn thiết bị này.
              </p>
              
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-xs font-semibold text-red-700 flex flex-col gap-1">
                <span>• Mọi thiết bị đồng bộ sẽ mất quyền truy cập.</span>
                <span>• Các ghi chú công khai hoặc riêng tư sẽ bị hủy bỏ hoàn toàn.</span>
              </div>
              
              <div className="flex flex-col gap-2 mt-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Nhập chữ <span className="text-red-600 font-black">DELETE ACCOUNT</span> để tiếp tục:
                </label>
                <input
                  type="text"
                  placeholder="Gõ chữ DELETE ACCOUNT..."
                  value={confirmPhrase}
                  onChange={(e) => setConfirmPhrase(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 text-gray-800 font-bold focus:border-red-500 focus:outline-none transition-all placeholder:text-gray-300 placeholder:font-normal uppercase"
                />
              </div>
              
              {deleteError && (
                <div className="text-xs font-black text-red-600 animate-pulse bg-red-50 border border-red-100 rounded-2xl p-3">
                  {deleteError}
                </div>
              )}
            </div>
            
            {/* Footer buttons */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 py-3.5 rounded-2xl bg-white border-2 border-gray-200 text-gray-500 font-black hover:bg-gray-100 hover:text-gray-700 transition-all focus:outline-none"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteAccountConfirm}
                disabled={confirmPhrase.trim().toUpperCase() !== 'DELETE ACCOUNT' || isDeleting}
                className={`flex-1 py-3.5 rounded-2xl font-black text-white shadow-lg transition-all focus:outline-none flex items-center justify-center gap-2 ${
                  confirmPhrase.trim().toUpperCase() === 'DELETE ACCOUNT' && !isDeleting
                    ? 'bg-red-600 hover:bg-red-700 active:scale-95 shadow-red-200 cursor-pointer'
                    : 'bg-gray-300 cursor-not-allowed shadow-none'
                }`}
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang xóa...
                  </>
                ) : (
                  'Xóa vĩnh viễn'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default User;
