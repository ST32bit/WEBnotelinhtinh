import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../api';

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
  const [showPassword,  setShowPassword]  = useState(false);
  const [successMsg,    setSuccessMsg]    = useState('');
  const [errorMsg,      setErrorMsg]      = useState('');
  const [activeTab,     setActiveTab]     = useState('profile');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    apiCall('/user/profile.php')
      .then(res => {
        if (res.success && res.user) {
          setDisplayName(res.user.display_name || currentName);
          setAvatar(res.user.avatar || currentAvatar);
          setAccentCls(res.user.accent_color || currentAccent);
          setEmail(res.user.email);
        }
      })
      .catch(err => console.error('Failed to fetch profile', err));
  }, []);

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

  const handleSave = async (e) => {
    e.preventDefault();
    if (activeTab === 'security') {
      if (!currentPassword || !newPassword) {
        setErrorMsg('⚠️ Vui lòng nhập đủ mật khẩu cũ và mới!');
        setTimeout(() => setErrorMsg(''), 3000);
        return;
      }
      try {
        const res = await apiCall('/user/password.php', {
          method: 'PUT',
          body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
        });
        if (res.success) {
          setSuccessMsg('✅ ' + res.message);
          setCurrentPassword(''); setNewPassword('');
        }
      } catch (err) {
        setErrorMsg('⚠️ ' + err.message);
      }
      setTimeout(() => { setErrorMsg(''); setSuccessMsg(''); }, 3000);
      return;
    }

    if (!displayName.trim()) {
      setErrorMsg('⚠️ Tên hiển thị không được để trống!');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    try {
      const res = await apiCall('/user/profile.php', {
        method: 'PUT',
        body: JSON.stringify({ display_name: displayName.trim(), avatar, accent_color: accentCls })
      });
      if (res.success) {
        localStorage.setItem('displayName', displayName.trim());
        localStorage.setItem('avatar', avatar);
        localStorage.setItem('accentColor', accentCls);
        setSuccessMsg('✅ Lưu thay đổi thành công!');
      }
    } catch (err) {
      setErrorMsg('⚠️ ' + err.message);
    }
    setTimeout(() => { setErrorMsg(''); setSuccessMsg(''); }, 3000);
  };

  const handleDeleteAccount = () => {
    if (window.confirm('⚠️ Hành động này không thể hoàn tác! Bạn có chắc chắn muốn xóa tài khoản không?')) {
      localStorage.clear();
      sessionStorage.clear();
      navigate('/login');
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

        {/* Back button */}
        <button onClick={() => navigate('/home')}
          className="mb-6 flex items-center gap-2 font-black text-gray-500 hover:text-indigo-600 transition-all group">
          <span className="w-9 h-9 rounded-xl bg-white shadow-sm border border-gray-200 flex items-center justify-center group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-all">←</span>
          Về trang chủ
        </button>

        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white overflow-hidden fade-up">

          {/* ── HERO HEADER ── */}
          <div className={`bg-gradient-to-r ${accentCls} p-10 relative overflow-hidden`}>
            {/* Decorative blobs */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10"></div>
            <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/10"></div>

            <div className="relative flex flex-col items-center">
              {/* Avatar */}
              <div className="relative group mb-4">
                <div className="w-28 h-28 rounded-3xl border-4 border-white shadow-xl overflow-hidden bg-white">
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <button type="button"
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  className="absolute -bottom-2 -right-2 w-9 h-9 bg-white rounded-xl shadow-lg flex items-center justify-center text-lg border-2 border-white hover:scale-110 transition-transform">
                  📷
                </button>
              </div>

              {/* Avatar picker popup */}
              {showAvatarPicker && (
                <div className="absolute top-36 z-50 bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-4 border border-white bounce-in w-72">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Chọn Avatar</p>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {AVATAR_PRESETS.map(p => (
                      <img key={p.seed} src={p.url} alt={p.seed}
                        onClick={() => { setAvatar(p.url); setShowAvatarPicker(false); }}
                        className={`avatar-preset ${avatar === p.url ? 'selected' : ''}`} />
                    ))}
                  </div>
                  <button type="button"
                    onClick={() => { setShowAvatarPicker(false); fileInputRef.current.click(); }}
                    className="w-full py-2.5 rounded-2xl bg-indigo-50 text-indigo-700 font-black text-sm hover:bg-indigo-100 transition border border-indigo-100">
                    📁 Tải ảnh từ máy tính
                  </button>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                </div>
              )}

              <h1 className="text-3xl font-black text-white drop-shadow-sm">{displayName}</h1>
              <p className="text-white/80 font-bold mt-1 text-sm">🎓 {email}</p>
            </div>
          </div>

          {/* ── TABS ── */}
          <div className="flex gap-2 p-4 bg-gray-50/80 border-b border-gray-100">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}>
                <span>{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>

          {/* ── TAB CONTENT ── */}
          <form onSubmit={handleSave} className="p-6 sm:p-8">

            {/* Alerts */}
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

            {/* ── PROFILE TAB ── */}
            {activeTab === 'profile' && (
              <div className="space-y-5 fade-up">
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
              </div>
            )}

            {/* ── SECURITY TAB ── */}
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

                  {/* Strength bar */}
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
                    className="field-input" />
                </div>
              </div>
            )}

            {/* ── APPEARANCE TAB ── */}
            {activeTab === 'appearance' && (
              <div className="space-y-6 fade-up">

                {/* Accent color */}
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

                {/* Avatar presets */}
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

                {/* Upload custom */}
                <div>
                  <label className="field-label">Hoặc tải ảnh từ máy tính</label>
                  <button type="button" onClick={() => fileInputRef.current.click()}
                    className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 font-black hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-3">
                    <span className="text-2xl">📁</span> Chọn ảnh (tối đa 5MB)
                  </button>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                </div>

                {/* Preview */}
                <div className={`rounded-3xl p-6 bg-gradient-to-r ${accentCls} flex items-center gap-4`}>
                  <div className="w-16 h-16 rounded-2xl border-3 border-white shadow-lg overflow-hidden bg-white flex-shrink-0">
                    <img src={avatar} alt="preview" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-white font-black text-xl">{displayName || 'Tên của bạn'}</p>
                    <p className="text-white/70 text-sm font-bold">🎓 {email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── ACTION BUTTONS ── */}
            <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-100">
              <button type="button" onClick={handleLogout}
                className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-600 font-black hover:bg-gray-200 transition-all">
                🚪 Đăng xuất
              </button>
              <button type="button" onClick={handleDeleteAccount}
                className="flex-1 py-4 rounded-2xl bg-red-50 text-red-600 font-black hover:bg-red-500 hover:text-white transition-all border border-red-200">
                🗑️ Xóa tài khoản
              </button>
              <button type="submit"
                className={`flex-[2] py-4 rounded-2xl bg-gradient-to-r ${accentCls} text-white font-black text-lg shadow-xl hover:opacity-90 hover:-translate-y-0.5 transition-all`}>
                💾 Lưu thay đổi
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default User;