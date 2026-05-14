import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../api';

//Các hàm tính âm lịch
function INT(d) { return Math.floor(d); }
function jdFromDate(dd, mm, yy) {
  const a = INT((14 - mm) / 12), y = yy + 4800 - a, m = mm + 12 * a - 3;
  let jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
  if (jd < 2299161) jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
  return jd;
}
function getNewMoonDay(k, tz) {
  const T = k / 1236.85, T2 = T * T, T3 = T2 * T;
  let Jde = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jde += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * Math.PI / 180);
  const M = 357.52910 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * Math.PI / 180) + 0.0021 * Math.sin(2 * M * Math.PI / 180);
  C1 -= 0.4068 * Math.sin(Mpr * Math.PI / 180) + 0.0161 * Math.sin(2 * Mpr * Math.PI / 180) + 0.0004 * Math.sin(3 * Mpr * Math.PI / 180);
  C1 += 0.0104 * Math.sin(2 * F * Math.PI / 180) - 0.0051 * Math.sin((M + Mpr) * Math.PI / 180) - 0.0074 * Math.sin((M - Mpr) * Math.PI / 180);
  C1 += 0.0004 * Math.sin((2 * F + M) * Math.PI / 180) - 0.0004 * Math.sin((2 * F - M) * Math.PI / 180) - 0.0006 * Math.sin((2 * F + Mpr) * Math.PI / 180);
  C1 += 0.0010 * Math.sin((2 * F - Mpr) * Math.PI / 180) + 0.0005 * Math.sin((M + 2 * Mpr) * Math.PI / 180);
  const deltat = T < -11 ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3 : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return INT(Jde + C1 - deltat + 0.5 + tz / 24);
}
function getSunLongitude(jdn, tz) {
  const T = (jdn - 2451545.5 - tz / 24) / 36525, T2 = T * T, dr = Math.PI / 180;
  const M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M) + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let L = L0 + DL; L -= 360 * INT(L / 360); return INT(L / 30);
}
function getLunarMonth11(yy, tz) {
  const off = jdFromDate(31, 12, yy) - 2415021, k = INT(off / 29.530588853);
  let nm = getNewMoonDay(k, tz);
  if (getSunLongitude(nm, tz) >= 9) nm = getNewMoonDay(k - 1, tz);
  return nm;
}
function getLeapMonthOffset(a11, tz) {
  const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last = 0, i = 1, arc = getSunLongitude(getNewMoonDay(k + i, tz), tz);
  do { last = arc; i++; arc = getSunLongitude(getNewMoonDay(k + i, tz), tz); } while (arc !== last && i < 14);
  return i - 1;
}
function solarToLunar(dd, mm, yy) {
  const tz = 7, dayNumber = jdFromDate(dd, mm, yy), k = INT((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1, tz);
  if (monthStart > dayNumber) monthStart = getNewMoonDay(k, tz);
  let a11 = getLunarMonth11(yy, tz), b11 = a11, lunarYear;
  if (a11 >= monthStart) { lunarYear = yy; a11 = getLunarMonth11(yy - 1, tz); }
  else { lunarYear = yy + 1; b11 = getLunarMonth11(yy + 1, tz); }
  const lunarDay = dayNumber - monthStart + 1, diff = INT((monthStart - a11) / 29);
  let lunarLeap = false, lunarMonth = diff + 11;
  if (b11 - a11 > 365) {
    const lmd = getLeapMonthOffset(a11, tz);
    if (diff >= lmd) { lunarMonth = diff + 10; if (diff === lmd) lunarLeap = true; }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
  return { day: lunarDay, month: lunarMonth, year: lunarYear, leap: lunarLeap };
}

//các hằng số cho ngày lễ và tùy chọn giao diện
const SOLAR_HOLIDAYS = [
  { month: 1, day: 1, name: 'Tết Dương Lịch', emoji: '🎆', type: 'holiday', color: '#fde68a' },
  { month: 2, day: 14, name: "Valentine's Day", emoji: '💝', type: 'intl', color: '#fca5a5' },
  { month: 3, day: 8, name: 'Quốc tế Phụ nữ', emoji: '🌸', type: 'holiday', color: '#f9a8d4' },
  { month: 4, day: 30, name: 'Giải phóng miền Nam', emoji: '🎉', type: 'holiday', color: '#86efac' },
  { month: 5, day: 1, name: 'Quốc tế Lao động', emoji: '⚒️', type: 'holiday', color: '#6ee7b7' },
  { month: 5, day: 19, name: 'Sinh nhật Bác Hồ', emoji: '⭐', type: 'holiday', color: '#fcd34d' },
  { month: 6, day: 1, name: 'Quốc tế Thiếu nhi', emoji: '🎈', type: 'holiday', color: '#c4b5fd' },
  { month: 9, day: 2, name: 'Quốc khánh', emoji: '🇻🇳', type: 'holiday', color: '#fca5a5' },
  { month: 10, day: 20, name: 'Phụ nữ Việt Nam', emoji: '🌺', type: 'holiday', color: '#f9a8d4' },
  { month: 10, day: 31, name: 'Halloween', emoji: '🎃', type: 'intl', color: '#fb923c' },
  { month: 11, day: 20, name: 'Ngày Nhà giáo', emoji: '📚', type: 'holiday', color: '#7dd3fc' },
  { month: 12, day: 25, name: 'Giáng Sinh', emoji: '🎄', type: 'intl', color: '#86efac' },
];
const LUNAR_HOLIDAYS = [
  { lm: 1, ld: 1, name: 'Tết Nguyên Đán', emoji: '🧧', type: 'tet', color: '#fca5a5' },
  { lm: 1, ld: 2, name: 'Mùng 2 Tết', emoji: '🧧', type: 'tet', color: '#fca5a5' },
  { lm: 1, ld: 3, name: 'Mùng 3 Tết', emoji: '🧧', type: 'tet', color: '#fca5a5' },
  { lm: 1, ld: 15, name: 'Rằm tháng Giêng', emoji: '🌕', type: 'lunar', color: '#fde68a' },
  { lm: 3, ld: 10, name: 'Giỗ Tổ Hùng Vương', emoji: '🏛️', type: 'holiday', color: '#bbf7d0' },
  { lm: 4, ld: 15, name: 'Phật Đản', emoji: '🪷', type: 'lunar', color: '#c4b5fd' },
  { lm: 7, ld: 7, name: 'Thất Tịch', emoji: '⭐', type: 'lunar', color: '#bfdbfe' },
  { lm: 7, ld: 15, name: 'Lễ Vu Lan', emoji: '🕯️', type: 'lunar', color: '#e9d5ff' },
  { lm: 8, ld: 15, name: 'Tết Trung Thu', emoji: '🥮', type: 'lunar', color: '#fde68a' },
  { lm: 12, ld: 23, name: 'Ông Táo về Trời', emoji: '🐟', type: 'tet', color: '#fde68a' },
  { lm: 12, ld: 30, name: 'Giao Thừa', emoji: '🎆', type: 'tet', color: '#fca5a5' },
];

const NOTE_BG_COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fca5a5', '#e9d5ff', '#fed7aa', '#f0fdf4', '#fdf4ff', '#f1f5f9', '#fce7f3'];
const FONT_OPTIONS = [
  { id: 'Nunito', label: 'Nunito (mặc định)' },
  { id: 'Georgia', label: 'Georgia' },
  { id: 'Times New Roman', label: 'Times New Roman' },
  { id: 'Courier New', label: 'Courier New' },
  { id: 'Verdana', label: 'Verdana' },
  { id: 'Trebuchet MS', label: 'Trebuchet MS' },
  { id: 'Comic Sans MS', label: 'Comic Sans MS' },
  { id: 'Tahoma', label: 'Tahoma' },
];
const TEXT_COLORS = ['#1f2937', '#dc2626', '#d97706', '#16a34a', '#2563eb', '#7c3aed', '#db2777', '#0891b2', '#ffffff', '#6b7280'];
const FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả', icon: '📋' },
  { value: 'pinned', label: 'Đã ghim', icon: '📌' },
  { value: 'locked', label: 'Có khóa', icon: '🔒' },
  { value: 'shared', label: 'Đã chia sẻ', icon: '🔗' },
];
const LABEL_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b', '#78716c'];

//Theme
function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('appTheme') || 'light');
  useEffect(() => {
    localStorage.setItem('appTheme', theme);
    // Tailwind dark mode via class on <html>
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);
  return [theme, setTheme];
}

//Các lớp Tailwind dùng lại nhiều lần
// Overlay backdrop
const CLS_OVERLAY = 'fixed inset-0 z-[200] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4';
// Modal box
const CLS_BOX = 'bg-white dark:bg-slate-800 rounded-[22px] p-6 w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700';
// Primary button
const CLS_BTN_PRI = 'bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl px-4 py-2.5 font-black text-sm cursor-pointer transition-all hover:-translate-y-px active:translate-y-0 border-0';
// Secondary button
const CLS_BTN_SEC = 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 font-extrabold text-sm cursor-pointer transition-all hover:border-indigo-400 hover:text-indigo-500';
// Icon button (square)
const CLS_ICON_BTN = 'w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 cursor-pointer text-sm text-slate-500 dark:text-slate-400 transition-all hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex-shrink-0';
// Small icon button (on cards)
const CLS_IBTN_SM = 'w-7 h-7 flex items-center justify-center rounded-lg border-0 bg-white/55 cursor-pointer text-[13px] transition-all hover:bg-white/90 hover:scale-110 flex-shrink-0';
// Input
const CLS_INPUT = 'bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2 text-sm font-semibold w-full transition-colors outline-none focus:border-indigo-400 placeholder:text-slate-400';
// Label text
const CLS_LABEL = 'text-[11px] font-black text-slate-400 uppercase tracking-wide mb-1.5 block';
// Card
const CLS_CARD = 'rounded-2xl p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl overflow-hidden';


//PASSWORD MODAL
const PasswordModal = ({ mode, onSubmit, onCancel, error }) => {
  const [pass, setPass] = useState('');
  const [passConfirm, setPassConfirm] = useState('');
  const [currentPass, setCurrentPass] = useState('');
  const [localError, setLocalError] = useState('');

  const displayError = error || localError;

  const handleSubmit = () => {
    setLocalError('');
    if (mode === 'set') {
      if (!pass || pass.length < 4) { setLocalError('Mật khẩu ít nhất 4 ký tự'); return; }
      if (pass !== passConfirm) { setLocalError('Xác nhận mật khẩu không khớp'); return; }
      onSubmit({ action: 'set', password: pass, password_confirm: passConfirm });
    } else if (mode === 'change') {
      if (!currentPass) { setLocalError('Nhập mật khẩu hiện tại'); return; }
      if (!pass || pass.length < 4) { setLocalError('Mật khẩu mới ít nhất 4 ký tự'); return; }
      if (pass !== passConfirm) { setLocalError('Xác nhận mật khẩu mới không khớp'); return; }
      onSubmit({ action: 'change', current_password: currentPass, password: pass, password_confirm: passConfirm });
    } else if (mode === 'remove') {
      if (!currentPass) { setLocalError('Nhập mật khẩu để xác nhận gỡ'); return; }
      onSubmit({ action: 'remove', current_password: currentPass });
    } else {
      // verify
      if (!pass) { setLocalError('Nhập mật khẩu'); return; }
      onSubmit({ action: 'verify', password: pass });
    }
  };

  const titles = { set: 'Đặt mật khẩu', change: 'Đổi mật khẩu', remove: 'Gỡ mật khẩu', verify: 'Nhập mật khẩu' };
  const subtitles = { set: 'Nhập mật khẩu 2 lần để xác nhận', change: 'Nhập MK hiện tại + MK mới', remove: 'Nhập MK hiện tại để xác nhận', verify: 'Note này được bảo vệ' };

  return (
    <div className={CLS_OVERLAY} onClick={onCancel}>
      <div className={`${CLS_BOX} max-w-sm`} onClick={e => e.stopPropagation()}>
        <div className="text-center mb-5">
          <div className="text-5xl mb-2">{mode === 'remove' ? '🔓' : '🔒'}</div>
          <h3 className="text-lg font-black m-0">{titles[mode] || 'Mật khẩu'}</h3>
          <p className="text-xs text-slate-400 mt-1">{subtitles[mode]}</p>
        </div>
        {displayError && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-xl px-4 py-2.5 font-extrabold text-xs text-center mb-3">
            {displayError}
          </div>
        )}

        {/* Current password field — for change/remove modes */}
        {(mode === 'change' || mode === 'remove') && (
          <input type="password" placeholder="Mật khẩu hiện tại..." value={currentPass}
            onChange={e => setCurrentPass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (mode === 'remove' ? handleSubmit() : null)}
            autoFocus className={`${CLS_INPUT} text-center font-bold tracking-[2px] mb-2.5`} />
        )}

        {/* New password field — for set/change/verify */}
        {mode !== 'remove' && (
          <input type="password" placeholder={mode === 'verify' ? 'Mật khẩu...' : 'Mật khẩu mới...'} value={pass}
            onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (mode === 'verify' ? handleSubmit() : null)}
            autoFocus={mode !== 'change'}
            className={`${CLS_INPUT} text-center font-bold tracking-[2px] mb-2.5`} />
        )}

        {/* Confirm password field — for set/change */}
        {(mode === 'set' || mode === 'change') && (
          <input type="password" placeholder="Xác nhận mật khẩu..." value={passConfirm}
            onChange={e => setPassConfirm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className={`${CLS_INPUT} text-center font-bold tracking-[2px] mb-3`} />
        )}

        <div className="flex gap-2.5">
          <button onClick={onCancel} className={`${CLS_BTN_SEC} flex-1`}>Hủy</button>
          <button onClick={handleSubmit} className={`${CLS_BTN_PRI} flex-1`}>
            {mode === 'remove' ? '🔓 Gỡ mật khẩu' : '✅ Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   SHARE MODAL — Better Approach: Email notify, Permission, Copy link, Status
════════════════════════════════════════════════════════════ */
const ShareModal = ({ note, onClose, onSave }) => {
  const [shareList, setShareList] = useState([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [visibility, setVisibility] = useState(note.visibility || 'private');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [removing, setRemoving] = useState(null); // track which share is being removed

  // Load existing shares from the note object
  useEffect(() => {
    if (note?.shareList?.length) {
      setShareList(note.shareList.map(s => ({
        id: s.id,
        email: s.email || '',
        display_name: s.display_name || '',
        role: s.role,
        shared_with: s.shared_with,
      })));
    }
  }, [note?.id]);

  // Auto-clear success message
  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); }
  }, [success]);

  // Auto-clear error message  
  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(''), 5000); return () => clearTimeout(t); }
  }, [error]);

  const addShare = async () => {
    const e2 = email.trim().toLowerCase();
    if (!e2 || !/\S+@\S+\.\S+/.test(e2)) { setError('⚠️ Email không hợp lệ! Vui lòng nhập đúng định dạng.'); return; }
    if (shareList.find(s => s.email === e2)) { setError('⚠️ Đã chia sẻ với email này rồi!'); return; }
    setError(''); setSuccess(''); setLoading(true);
    try {
      const res = await apiCall('/shares', {
        method: 'POST',
        body: JSON.stringify({ note_id: note.id, email: e2, role })
      });
      if (res.success && res.share) {
        setShareList(prev => [...prev, {
          id: res.share.id,
          email: res.share.email,
          display_name: res.share.display_name || '',
          role: res.share.role,
          shared_with: res.share.shared_with,
        }]);
        setEmail('');
        setSuccess(`✅ Đã chia sẻ với ${res.share.email}! Email thông báo đã được gửi.`);
      }
    } catch (err) {
      setError(`❌ ${err.message || 'Lỗi khi chia sẻ. Email có thể chưa đăng ký tài khoản.'}`);
    }
    finally { setLoading(false); }
  };

  const updateRole = async (shareId, newRole) => {
    try {
      await apiCall('/shares/role', {
        method: 'PUT',
        body: JSON.stringify({ share_id: shareId, role: newRole })
      });
      setShareList(prev => prev.map(s => s.id === shareId ? { ...s, role: newRole } : s));
      setSuccess(`✅ Đã cập nhật quyền thành ${newRole === 'editor' ? 'Chỉnh sửa' : 'Chỉ xem'}`);
    } catch (err) { setError(`❌ ${err.message || 'Lỗi khi cập nhật quyền'}`); }
  };

  const removeShare = async (s) => {
    if (!window.confirm(`Bạn chắc chắn muốn xóa quyền truy cập của ${s.email}?`)) return;
    setRemoving(s.id);
    try {
      await apiCall('/shares', {
        method: 'DELETE',
        body: JSON.stringify({ note_id: note.id, shared_with: s.shared_with || s.id })
      });
      setShareList(prev => prev.filter(x => x.id !== s.id));
      setSuccess(`✅ Đã xóa quyền truy cập của ${s.email}`);
    } catch (err) { setError(`❌ ${err.message || 'Lỗi khi hủy chia sẻ'}`); }
    finally { setRemoving(null); }
  };

  const copyShareLink = () => {
    const link = `${window.location.origin}/shared/${note.id}`;
    navigator.clipboard.writeText(link).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }).catch(() => setError('Không thể copy link'));
  };

  const visOptions = [
    { v: 'private', icon: '🔒', label: 'Riêng tư', desc: 'Chỉ người được mời' },
    { v: 'public', icon: '🌍', label: 'Công khai', desc: 'Ai có link đều xem được (chỉ xem)' },
  ];

  return (
    <div className={CLS_OVERLAY} onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-[22px] p-0 w-full max-w-lg shadow-2xl max-h-[92vh] overflow-hidden text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="m-0 font-black text-lg">🔗 Chia sẻ note</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-semibold truncate max-w-[280px]">"{note.title}"</p>
            </div>
            <button onClick={onClose} className={CLS_ICON_BTN}>✕</button>
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">

          {/* Toast Messages */}
          {success && (
            <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-xl px-4 py-2.5 font-bold text-xs text-center border border-emerald-200 dark:border-emerald-800 animate-[fadeIn_0.3s]">
              {success}
            </div>
          )}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-xl px-4 py-2.5 font-bold text-xs text-center border border-red-200 dark:border-red-800 animate-[fadeIn_0.3s]">
              {error}
            </div>
          )}

          {/* ── Section 1: Visibility ── */}
          <div>
            <span className={CLS_LABEL}>🛡️ Chế độ hiển thị</span>
            <div className="grid grid-cols-2 gap-2">
              {visOptions.map(o => (
                <button key={o.v} type="button" onClick={() => setVisibility(o.v)}
                  className={`p-2.5 rounded-xl border-2 text-center cursor-pointer transition-all font-[inherit] group ${visibility === o.v ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-md shadow-indigo-500/10' : 'border-slate-200 dark:border-slate-600 bg-transparent hover:border-indigo-300'}`}>
                  <div className="text-xl mb-1 transition-transform group-hover:scale-110">{o.icon}</div>
                  <div className="text-[11px] font-extrabold">{o.label}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">{o.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Section 2: Copy Link (visible when not private) ── */}
          {visibility !== 'private' && (
            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
              <span className="text-sm">🔗</span>
              <code className="flex-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate select-all">
                {window.location.origin}/shared/{note.id}
              </code>
              <button onClick={copyShareLink}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold border-0 cursor-pointer transition-all font-[inherit] ${linkCopied ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300 hover:bg-indigo-200'}`}>
                {linkCopied ? '✅ Đã copy!' : '📋 Copy link'}
              </button>
            </div>
          )}

          {/* ── Section 3: Add People ── */}
          <div>
            <span className={CLS_LABEL}>👥 Thêm người (nhập email đã đăng ký)</span>
            {/* Row 1: Email input — full width */}
            <div className="relative mb-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none opacity-40">✉️</span>
              <input type="email" placeholder="Nhập email người nhận..." value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && addShare()}
                style={{ width: '100%', boxSizing: 'border-box' }}
                className={`${CLS_INPUT} pl-9`} />
            </div>
            {/* Row 2: Role select + Add button */}
            <div className="flex gap-2 mb-1">
              <select value={role} onChange={e => setRole(e.target.value)}
                className={`${CLS_INPUT} text-xs`} style={{ flex: 1 }}>
                <option value="viewer">👁️ Chỉ xem</option>
                <option value="editor">✏️ Chỉnh sửa</option>
              </select>
              <button onClick={addShare} disabled={loading}
                className={`${CLS_BTN_PRI} px-4`} style={{ minWidth: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : '➕'}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold mt-1 ml-0.5">
              💡 Người nhận sẽ được thông báo qua email khi bạn chia sẻ
            </p>
          </div>

          {/* ── Section 4: Shared People List ── */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className={`${CLS_LABEL} m-0`}>
                👤 Danh sách người được chia sẻ ({shareList.length})
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5">
              {shareList.map(s => (
                <div key={s.id || s.email}
                  className={`flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 dark:bg-slate-700/60 rounded-xl border border-transparent hover:border-slate-300 dark:hover:border-slate-500 transition-all group ${removing === s.id ? 'opacity-50 pointer-events-none' : ''}`}>
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center font-black text-sm text-white flex-shrink-0 shadow-sm">
                    {s.email[0].toUpperCase()}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold truncate text-slate-800 dark:text-slate-100">{s.email}</div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {s.display_name || (s.role === 'editor' ? '✏️ Có quyền chỉnh sửa' : '👁️ Chỉ có quyền xem')}
                    </div>
                  </div>
                  {/* Role dropdown */}
                  <select value={s.role}
                    onChange={e => updateRole(s.id, e.target.value)}
                    className="text-[11px] font-extrabold border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer font-[inherit] rounded-lg px-2 py-1 outline-none focus:border-indigo-400 transition-colors">
                    <option value="viewer">👁️ Xem</option>
                    <option value="editor">✏️ Sửa</option>
                  </select>
                  {/* Remove button */}
                  <button onClick={() => removeShare(s)}
                    className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 text-red-500 dark:text-red-400 cursor-pointer font-black text-xs font-[inherit] transition-all hover:bg-red-100 dark:hover:bg-red-900/60 hover:scale-105 flex items-center justify-center opacity-60 group-hover:opacity-100"
                    title={`Xóa quyền của ${s.email}`}>
                    🗑️
                  </button>
                </div>
              ))}
              {shareList.length === 0 && (
                <div className="text-center py-6 px-4">
                  <div className="text-3xl opacity-30 mb-2">📭</div>
                  <p className="text-slate-400 text-[13px] font-bold m-0">Chưa chia sẻ với ai</p>
                  <p className="text-slate-300 dark:text-slate-500 text-[11px] mt-0.5">Nhập email ở trên để bắt đầu chia sẻ</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex gap-2.5">
            <button onClick={onClose} className={`${CLS_BTN_SEC} flex-1`}>
              Hủy
            </button>
            <button onClick={() => onSave({ shareList, visibility })} className={`${CLS_BTN_PRI} flex-1 py-3`}>
              💾 Lưu cài đặt chia sẻ
            </button>
          </div>
          {shareList.length > 0 && (
            <p className="text-[10px] text-center text-slate-400 mt-2 font-semibold">
              📧 {shareList.length} người đã được mời · Thay đổi quyền có hiệu lực ngay lập tức
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   VIEW NOTE MODAL
════════════════════════════════════════════════════════════ */
const ViewNoteModal = ({ note, onClose, onEdit, onRevokeShare, onUpdateShareRole, currentUserEmail }) => {
  // If note has password, force view-only for shared users (regardless of original role)
  const effectiveRole = (note.has_password || note.password) && note.owner_email ? 'viewer' : note.role;
  const isSharedViewOnly = effectiveRole === 'viewer' || (note.owner_email && effectiveRole !== 'editor' && effectiveRole !== 'owner');
  const isSharedNote = !!note.owner_email; // has owner_email means it's from sharedWithMe
  return (
  <div className={CLS_OVERLAY} onClick={onClose}>
    <div
      className="rounded-[22px] p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col border border-black/10"
      style={{ backgroundColor: note.color || '#fef9c3' }}
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4 pb-3.5 border-b border-black/10">
        <div className="flex-1 pr-3">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {note.isPinned && <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">📌 Đã ghim</span>}
            {(note.password || note.has_password) && <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">🔒 Có mật khẩu</span>}
            {(note.shareList?.length > 0 || note.visibility !== 'private') && (
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">🔗 Đã chia sẻ</span>
            )}
            {(note.labels || []).map(lb => (
              <span key={lb.id} className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full"
                style={{ background: lb.color + '30', color: lb.color, border: `1px solid ${lb.color}50` }}>
                {lb.name}
              </span>
            ))}
          </div>
          <h2 className="text-2xl font-black m-0 leading-snug text-slate-800">{note.title}</h2>
          {note.createdAt && (
            <div className="text-[11px] text-black/45 mt-1.5 font-semibold">
              Tạo: {new Date(note.createdAt).toLocaleString('vi-VN')}
              {note.updatedAt && note.updatedAt !== note.createdAt && ` · Sửa: ${new Date(note.updatedAt).toLocaleString('vi-VN')}`}
            </div>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {!isSharedViewOnly && (
            <button onClick={onEdit} className={`${CLS_BTN_SEC} text-xs py-1.5 px-3.5`}>✏️ Sửa</button>
          )}
          {isSharedViewOnly && isSharedNote && (
            <span className="text-[11px] font-extrabold px-2.5 py-1.5 rounded-xl bg-amber-100 text-amber-700 self-center">👁️ Chỉ xem</span>
          )}
          <button onClick={onClose} className={CLS_ICON_BTN}>✕</button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div
          className="rich-text-content leading-relaxed text-slate-800"
          style={{ fontFamily: note.fontFamily || 'Nunito', fontSize: note.fontSize || 14 }}
          dangerouslySetInnerHTML={{ __html: note.content || '<p style="color:#9ca3af;font-style:italic">Chưa có nội dung</p>' }}
        />

        {/* Attachments */}
        {note.attachments?.length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-black/10">
            <span className={CLS_LABEL}>📎 Tệp đính kèm ({note.attachments.length})</span>
            <div className="flex flex-wrap gap-2.5">
              {note.attachments.map((att, i) => att.type?.startsWith('image/') ? (
                <a key={i} href={att.data} target="_blank" rel="noreferrer" download={att.name}>
                  <img src={att.data} alt={att.name} className="w-20 h-20 object-cover rounded-xl border-2 border-white/70 shadow-md" />
                </a>
              ) : (
                <a key={i} href={att.data} download={att.name}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/70 rounded-xl border border-black/10 text-xs font-bold text-slate-700 no-underline">
                  📄 <span className="max-w-[100px] truncate">{att.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Sharing detail */}
        {(note.shareList?.length > 0 || note.visibility === 'public') && (
          <div className="mt-4 pt-3.5 border-t border-black/10">
            <span className={CLS_LABEL}>🔗 Chi tiết chia sẻ</span>
            {note.visibility === 'public' && (
              <div className="flex items-center gap-2 px-3 py-2 bg-white/60 rounded-xl mb-2 text-sm font-bold text-slate-700">
                🌍 Công khai — ai có link đều xem được
              </div>
            )}
            {(note.shareList || []).map(s => (
              <div key={s.email} className="flex items-center gap-2.5 px-3 py-2 bg-white/60 rounded-xl mb-1.5 group">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center font-black text-sm text-indigo-600 flex-shrink-0">
                  {s.email[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-bold text-slate-800">{s.email}</div>
                  <div className="text-[11px] text-black/45 font-semibold">
                    {s.role === 'editor' ? '✏️ Có thể chỉnh sửa' : '👁️ Chỉ xem'}
                  </div>
                </div>
                <div className="flex gap-1">
                  <select
                    value={s.role}
                    onChange={(e) => onUpdateShareRole(note.id, s.email, e.target.value)}
                    className="text-[11px] font-extrabold border-0 bg-transparent text-slate-700 cursor-pointer p-1"
                  >
                    <option value="viewer">👁️ Xem</option>
                    <option value="editor">✏️ Sửa</option>
                  </select>
                  <button onClick={() => onRevokeShare(note.id, s.email)}
                    className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 border-0 text-red-600 cursor-pointer font-[inherit] transition-colors">
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
  );
};

/* ════════════════════════════════════════════════════════════
   LABEL MANAGER MODAL
════════════════════════════════════════════════════════════ */
const LabelManagerModal = ({ allLabels, noteLabels, onClose, onSave, onManageGlobal }) => {
  const [selected, setSelected] = useState(new Set((noteLabels || []).map(l => l.id)));
  return (
    <div className={CLS_OVERLAY} onClick={onClose}>
      <div className={`${CLS_BOX} max-w-sm`} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="m-0 font-black">🏷️ Gán nhãn</h3>
          <button onClick={onClose} className={CLS_ICON_BTN}>✕</button>
        </div>
        {allLabels.length === 0 && (
          <div className="text-center text-slate-400 py-5 text-sm">Chưa có nhãn nào. Tạo nhãn trong Cài đặt!</div>
        )}
        <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto mb-3.5">
          {allLabels.map(lb => {
            const sel = selected.has(lb.id);
            return (
              <div key={lb.id}
                onClick={() => { const s = new Set(selected); sel ? s.delete(lb.id) : s.add(lb.id); setSelected(s); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all border-2 ${sel ? '' : 'border-transparent bg-slate-50 dark:bg-slate-700'}`}
                style={sel ? { background: lb.color + '20', borderColor: lb.color } : {}}>
                <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ background: lb.color }} />
                <span className="flex-1 font-bold text-sm">{lb.name}</span>
                <span className="text-base">{sel ? '✅' : '⬜'}</span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2">
          <button onClick={onManageGlobal} className={`${CLS_BTN_SEC} flex-1 text-xs`}>⚙️ Quản lý nhãn</button>
          <button onClick={() => onSave([...selected])} className={`${CLS_BTN_PRI} flex-1`}>✅ Áp dụng</button>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   GLOBAL LABEL EDITOR
════════════════════════════════════════════════════════════ */
const LabelEditor = ({ labels, onClose, onSave }) => {
  const [list, setList] = useState(labels.map(l => ({ ...l })));
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(LABEL_COLORS[0]);

  const addLabel = () => {
    const n = newName.trim(); if (!n) return;
    setList([...list, { id: Date.now(), name: n, color: newColor }]); setNewName('');
  };

  return (
    <div className={CLS_OVERLAY} onClick={onClose}>
      <div className={`${CLS_BOX} max-w-sm`} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="m-0 font-black">⚙️ Quản lý nhãn</h3>
          <button onClick={onClose} className={CLS_ICON_BTN}>✕</button>
        </div>
        <div className="max-h-56 overflow-y-auto mb-3 flex flex-col gap-1.5">
          {list.map(lb => (
            <div key={lb.id} className="flex items-center gap-2">
              <input type="color" value={lb.color}
                onChange={e => setList(list.map(l => l.id === lb.id ? { ...l, color: e.target.value } : l))}
                className="w-8 h-8 rounded-lg border-0 p-0.5 cursor-pointer bg-none" />
              <input value={lb.name}
                onChange={e => setList(list.map(l => l.id === lb.id ? { ...l, name: e.target.value } : l))}
                className={`${CLS_INPUT} flex-1`} />
              <button onClick={() => setList(list.filter(l => l.id !== lb.id))}
                className="w-7 h-7 rounded-lg bg-red-100 border-0 text-red-600 cursor-pointer font-black font-[inherit]">✕</button>
            </div>
          ))}
          {list.length === 0 && <div className="text-center text-slate-400 text-sm">Chưa có nhãn nào</div>}
        </div>
        <div className="flex gap-2 mb-3.5 p-2.5 bg-slate-50 dark:bg-slate-700 rounded-xl">
          <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)}
            className="w-8 h-8 rounded-lg border-0 p-0.5 cursor-pointer bg-none" />
          <input placeholder="Tên nhãn mới..." value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addLabel()}
            className={`${CLS_INPUT} flex-1`} />
          <button onClick={addLabel} className={`${CLS_BTN_PRI} px-3`}>+ Thêm</button>
        </div>
        <button onClick={() => onSave(list)} className={`${CLS_BTN_PRI} w-full py-3`}>💾 Lưu nhãn</button>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   CONFIRM DIALOG
════════════════════════════════════════════════════════════ */
const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
  <div className={CLS_OVERLAY} onClick={onCancel}>
    <div className={`${CLS_BOX} max-w-sm`} onClick={e => e.stopPropagation()}>
      <div className="text-center mb-5">
        <div className="text-4xl mb-2.5">🗑️</div>
        <p className="font-extrabold text-[15px] m-0">{message}</p>
      </div>
      <div className="flex gap-2.5">
        <button onClick={onCancel} className={`${CLS_BTN_SEC} flex-1`}>Hủy</button>
        <button onClick={onConfirm}
          className="flex-1 py-2.5 rounded-xl bg-red-500 text-white border-0 font-black cursor-pointer text-sm font-[inherit] hover:bg-red-600 transition-colors">
          🗑️ Xóa
        </button>
      </div>
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════
   MAIN HOME COMPONENT
════════════════════════════════════════════════════════════ */
const Home = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useTheme();

  const currentUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
  const displayName = localStorage.getItem('displayName') || sessionStorage.getItem('displayName') || (currentUser ? currentUser.split('@')[0] : 'Khách');
  const avatar = localStorage.getItem('avatar') || sessionStorage.getItem('avatar') || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix';
  const isActive = localStorage.getItem('isActive') || sessionStorage.getItem('isActive');

  const [notes, setNotes] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeView, setActiveView] = useState('calendar');
  const [showModal, setShowModal] = useState(false);
  const [selectedDayNotes, setSelectedDayNotes] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeLabel, setActiveLabel] = useState(null); // Label toggle filter
  const [isFlipping, setIsFlipping] = useState(false);
  const [savingOverlay, setSavingOverlay] = useState(false); // Loading overlay

  const [searchQuery, setSearchQuery] = useState('');
  const [displayQuery, setDisplayQuery] = useState('');
  const searchTimer = useRef(null);

  const [allLabels, setAllLabels] = useState(() => JSON.parse(localStorage.getItem('allLabels') || '[]'));
  const [labelModal, setLabelModal] = useState(null);
  const [labelEditor, setLabelEditor] = useState(false);

  const [viewingNote, setViewingNote] = useState(null);
  const [shareModal, setShareModal] = useState(null);
  const [passwordModal, setPasswordModal] = useState(null);
  const [passwordError, setPasswordError] = useState('');
  const [unlockedNotes, setUnlockedNotes] = useState(new Set());
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [sharedSubTab, setSharedSubTab] = useState('by-me');
  const [sharedWithMe, setSharedWithMe] = useState([]);

  const [prefs, setPrefs] = useState(() =>
    JSON.parse(localStorage.getItem('userPrefs') || JSON.stringify({ fontSize: 14, fontFamily: 'Nunito', defaultColor: '#fef08a' })));
  const [settings, setSettings] = useState(() =>
    JSON.parse(localStorage.getItem('appSettings') || JSON.stringify({ showVietnameseHolidays: true, showInternationalHolidays: true, showLunarHolidays: true, showTet: true })));

  const editorRef = useRef(null);
  const autoSaveTimer = useRef(null);
  const pollingTimer = useRef(null); // Tiêu chí 24: real-time polling
  const isSaving = useRef(false); // Lock to prevent duplicate saves

  const defaultNote = {
    id: null, title: '', content: '', color: prefs.defaultColor, isPinned: false,
    password: null, shareList: [], visibility: 'private', fontFamily: prefs.fontFamily,
    fontSize: prefs.fontSize, attachments: [], labels: [], createdAt: null, updatedAt: null, pinnedAt: null,
  };

  // Helper: normalize note fields from API (snake_case → camelCase)
  const normalizeNote = (n) => ({
    ...n,
    createdAt: n.createdAt || n.created_at || null,
    updatedAt: n.updatedAt || n.updated_at || null,
    isPinned: n.isPinned ?? n.is_pinned ?? false,
    shareList: n.shareList || [],
    visibility: n.visibility || 'private',
    attachments: n.attachments || [],
    labels: n.labels || [],
    has_password: n.has_password ?? !!n.note_password ?? false,
  });
  const normalizeNotes = (arr) => (arr || []).map(normalizeNote);
  const [formData, setFormData] = useState(defaultNote);
  const [editorFont, setEditorFont] = useState(prefs.fontFamily);
  const [editorColor, setEditorColor] = useState('#1f2937');

  /* ── Effects ── */
  useEffect(() => {
    if (currentUser) {
      // Load profile preferences
      apiCall('/users/me').then(res => {
        if (res.success && res.user) {
          if (res.user.preferences) {
            const prefData = res.user.preferences;
            if (prefData.settings) setSettings(prefData.settings);
            if (prefData.prefs) setPrefs(prefData.prefs);
          }
          if (res.user.avatar) localStorage.setItem('avatar', res.user.avatar);
          if (res.user.display_name) localStorage.setItem('displayName', res.user.display_name);
        }
      }).catch(e => console.error(e));

      // Load Labels from dedicated API (Tiêu chí 15, 19)
      apiCall('/labels')
        .then(res => { if (res.success) setAllLabels(res.labels || []); })
        .catch(e => console.error('Failed to load labels', e));

      // Load Notes
      apiCall('/notes')
        .then(res => { if (res.success) setNotes(normalizeNotes(res.notes)); })
        .catch(err => console.error('Failed to load notes', err));
    }
  }, [currentUser]);

  const prefSyncTimer = useRef(null);
  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    localStorage.setItem('userPrefs', JSON.stringify(prefs));

    if (prefSyncTimer.current) clearTimeout(prefSyncTimer.current);
    prefSyncTimer.current = setTimeout(() => {
      apiCall('/users/me', {
        method: 'PUT',
        body: JSON.stringify({ preferences: { settings, prefs } })
      }).catch(e => console.error('Failed to sync prefs', e));
    }, 1000);
  }, [settings, prefs]);
  // Tiêu chí 24: Polling real-time collaboration — refresh notes every 5s when editing a shared note
  useEffect(() => {
    if (!showModal || !formData.id) {
      if (pollingTimer.current) clearInterval(pollingTimer.current);
      return;
    }
    // Only poll if this note is shared with others
    const isShared = (formData.shareList || []).length > 0;
    if (!isShared) return;

    pollingTimer.current = setInterval(() => {
      apiCall(`/notes/${formData.id}`)
        .then(res => {
          if (res.success && res.note) {
            const fresh = normalizeNote(res.note);
            // Only update if server version is newer
            if (fresh.updatedAt > (formData.updatedAt || '')) {
              setFormData(prev => ({ ...prev, content: fresh.content, title: fresh.title, updatedAt: fresh.updatedAt }));
              setNotes(prev => prev.map(n => n.id === fresh.id ? fresh : n));
              if (editorRef.current && document.activeElement !== editorRef.current) {
                editorRef.current.innerHTML = fresh.content || '';
              }
            }
          }
        }).catch(() => { });
    }, 5000);

    return () => { if (pollingTimer.current) clearInterval(pollingTimer.current); };
  }, [showModal, formData.id, formData.shareList]);

  useEffect(() => {
    if (showModal && editorRef.current) {
      const t = setTimeout(() => { if (editorRef.current) editorRef.current.innerHTML = formData.content || ''; }, 60);
      return () => clearTimeout(t);
    }
  }, [showModal, formData.id]);
  /* ── Load shared-with-me notes ── */
  useEffect(() => {
    apiCall('/shares').then(res => {
      if (res.success && res.notes) setSharedWithMe(res.notes.map(n => normalizeNote(n)));
    }).catch(() => { });

    // Check if redirected from public share link
    if (sessionStorage.getItem('goToSharedTab')) {
      sessionStorage.removeItem('goToSharedTab');
      setActiveView('shared');
      setSharedSubTab('with-me');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Helpers ── */
  const handleSearchInput = val => {
    setDisplayQuery(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearchQuery(val);
      // Tiêu chí 14: Debounced server-side search
      const qs = val.trim() ? `?q=${encodeURIComponent(val.trim())}` : '';
      apiCall(`/notes${qs}`)
        .then(res => { if (res.success) setNotes(normalizeNotes(res.notes)); })
        .catch(e => console.error(e));
    }, 400);
  };

  const saveNotes = updated => { setNotes(updated); };

  // Helper: build API-safe payload from note data
  const buildApiPayload = (note, opts = {}) => {
    const payload = {
      title: note.title,
      content: opts.content ?? note.content ?? '',
      label_ids: (note.labels || []).map(lb => lb.id).filter(Boolean),
    };
    // Include created_at for calendar-based creation
    if (note.createdAt) payload.created_at = note.createdAt;
    // Include password for new note creation
    if (note.password) payload.password = note.password;
    return payload;
  };

  const syncUpdateNote = (note) => {
    apiCall(`/notes/${note.id}`, { method: 'PUT', body: JSON.stringify(buildApiPayload(note)) }).catch(e => console.error(e));
  };
  const syncCreateNote = async (note) => {
    return await apiCall('/notes', { method: 'POST', body: JSON.stringify(buildApiPayload(note)) });
  };
  const syncDeleteNote = (id) => {
    apiCall(`/notes/${id}`, { method: 'DELETE' }).catch(e => console.error(e));
  };

  const triggerAutoSave = useCallback((data, content) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      if (!data.title?.trim() && !content?.trim()) return;
      const now = new Date().toISOString();
      const noteToSave = { ...data, content, updatedAt: now };
      if (data.id) {
        // Existing note — just update
        setNotes(prev => prev.map(n => n.id === data.id ? noteToSave : n));
        apiCall(`/notes/${data.id}`, { method: 'PUT', body: JSON.stringify({ title: data.title, content: content || '' }) }).catch(e => console.error(e));
      }
      // NOTE: Do NOT auto-create new notes here to prevent duplicates.
      // New notes are only created via handleSaveNote (explicit save button).
    }, 600);
  }, []);

  const getHolidaysForDate = useCallback(dateStr => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const holidays = [];
    SOLAR_HOLIDAYS.forEach(h => {
      if (h.month === m && h.day === d) {
        if (h.type === 'holiday' && settings.showVietnameseHolidays) holidays.push(h);
        if (h.type === 'intl' && settings.showInternationalHolidays) holidays.push(h);
      }
    });
    if (settings.showLunarHolidays || settings.showTet) {
      const lunar = solarToLunar(d, m, y);
      LUNAR_HOLIDAYS.forEach(h => {
        if (h.lm === lunar.month && h.ld === lunar.day) {
          const show = h.type === 'tet' ? settings.showTet : settings.showLunarHolidays;
          if (show) holidays.push(h);
        }
      });
    }
    return holidays;
  }, [settings]);

  const getLunarDay = useCallback((d, m, y) => { const l = solarToLunar(d, m, y); return `${l.day}/${l.month}${l.leap ? '*' : ''}`; }, []);

  const getSortedNotes = useCallback(list => {
    const pinned = list.filter(n => n.isPinned).sort((a, b) => new Date(b.pinnedAt || 0) - new Date(a.pinnedAt || 0));
    const unpinned = list.filter(n => !n.isPinned).sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
    return [...pinned, ...unpinned];
  }, []);

  const applySearch = useCallback(list => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(n => (n.title || '').toLowerCase().includes(q) || (n.content || '').replace(/<[^>]+>/g, '').toLowerCase().includes(q) || (n.labels || []).some(lb => lb.name.toLowerCase().includes(q)));
  }, [searchQuery]);

  // Notes shared with me where I have editor role AND note is NOT locked — show in All Notes too
  const editorSharedNotes = sharedWithMe.filter(n => n.role === 'editor' && !n.has_password).map(n => ({
    ...n,
    _isSharedEditor: true,
    _ownerInfo: `📤 ${n.owner_name || n.owner_email || 'Người khác'}`,
  }));

  const getFilteredNotes = useCallback(() => {
    // Merge own notes + editor-shared notes for all-notes view
    let result = [...notes, ...editorSharedNotes];
    if (activeFilter === 'pinned') result = result.filter(n => n.isPinned);
    else if (activeFilter === 'locked') result = result.filter(n => n.password || n.has_password);
    else if (activeFilter === 'shared') result = result.filter(n => (n.shareList && n.shareList.length > 0) || n.visibility === 'public');
    // Label toggle filter
    if (activeLabel) result = result.filter(n => (n.labels || []).some(lb => lb.id === activeLabel));
    return getSortedNotes(applySearch(result));
  }, [notes, editorSharedNotes, activeFilter, activeLabel, searchQuery, applySearch, getSortedNotes]);

  /* ── Actions ── */
  const handleCancel = () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); setShowModal(false); setFormData(defaultNote); if (editorRef.current) editorRef.current.innerHTML = ''; };

  const handleSaveNote = async () => {
    if (!formData.title.trim()) return;
    // Prevent double-click duplicate creation
    if (isSaving.current) return;
    isSaving.current = true;
    setSavingOverlay(true);

    // Cancel any pending auto-save
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

    // Read content BEFORE closing modal (editorRef may unmount after)
    const content = editorRef.current ? editorRef.current.innerHTML : formData.content;
    const now = new Date().toISOString();

    // Close modal immediately to prevent further clicks
    setShowModal(false);

    // Build API payload (includes created_at, password, label_ids)
    const apiPayload = buildApiPayload(formData, { content });

    // Local note representation (for UI state)
    const noteForUI = { ...formData, content, updatedAt: now, createdAt: formData.createdAt || now };

    try {
      if (formData.id) {
        setNotes(prev => prev.map(n => n.id === formData.id ? noteForUI : n));
        // Also update sharedWithMe list if this is a shared editor note
        setSharedWithMe(prev => prev.map(n => n.id === formData.id ? { ...n, title: noteForUI.title, content: noteForUI.content, updatedAt: noteForUI.updatedAt } : n));
        await apiCall(`/notes/${formData.id}`, { method: 'PUT', body: JSON.stringify(apiPayload) });
      } else {
        const res = await apiCall('/notes', { method: 'POST', body: JSON.stringify(apiPayload) });
        if (res.success && res.note) {
          const normalized = normalizeNote(res.note);
          setNotes(prev => [normalized, ...prev]);

          // Toggle pin after creation if user set isPinned
          if (formData.isPinned && res.note.id) {
            apiCall('/notes/toggle-pin', {
              method: 'PUT',
              body: JSON.stringify({ note_id: res.note.id })
            }).catch(e => console.error(e));
          }
        }
      }
    } catch (e) { console.error(e); }
    finally { isSaving.current = false; setSavingOverlay(false); }

    setFormData(defaultNote);
    if (editorRef.current) editorRef.current.innerHTML = '';
  };

  const handleEditNote = note => {
    const base = note._isRepeat ? notes.find(n => n.id === note._originalId) : note;
    const r = base || note;
    setFormData({ ...defaultNote, ...r, attachments: r.attachments || [], labels: r.labels || [] });
    setEditorFont(r.fontFamily || prefs.fontFamily); setEditorColor('#1f2937'); setShowModal(true);
  };

  const handleViewNote = note => {
    if ((note.password || note.has_password) && !unlockedNotes.has(note.id)) {
      setPasswordError('');
      setPasswordModal({ mode: 'verify', noteId: note.id, onSuccess: () => { setUnlockedNotes(prev => new Set([...prev, note.id])); setPasswordModal(null); setViewingNote(note); } });
    } else setViewingNote(note);
  };

  const handleDeleteNote = id => setConfirmDelete({ id });
  const confirmDeleteNote = () => {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    saveNotes(notes.filter(n => n.id !== id));
    if (selectedDayNotes) setSelectedDayNotes(prev => ({ ...prev, notes: prev.notes.filter(n => n.id !== id) }));
    setConfirmDelete(null);
    syncDeleteNote(id);
  };

  const togglePin = id => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    const updatedNote = { ...note, isPinned: !note.isPinned, pinnedAt: !note.isPinned ? new Date().toISOString() : null };
    saveNotes(notes.map(n => n.id === id ? updatedNote : n));
    syncUpdateNote(updatedNote);
  };

  const handleNoteAccess = (note, action) => {
    if (!(note.password || note.has_password) || unlockedNotes.has(note.id)) { action(note); return; }
    setPasswordError('');
    setPasswordModal({ mode: 'verify', noteId: note.id, onSuccess: () => { setUnlockedNotes(prev => new Set([...prev, note.id])); setPasswordModal(null); action(note); } });
  };

  const handlePasswordSubmit = async (payload) => {
    if (!passwordModal) return;
    const noteId = passwordModal.noteId;
    setPasswordError('');

    // For new notes (not yet saved), just store password locally
    if (noteId === 'new' || !noteId) {
      if (payload.action === 'set') {
        setFormData(p => ({ ...p, password: payload.password }));
      }
      setPasswordModal(null);
      return;
    }

    try {
      const res = await apiCall('/notes/lock', {
        method: 'POST',
        body: JSON.stringify({ note_id: noteId, ...payload })
      });
      if (res.success) {
        if (payload.action === 'verify') {
          // Unlock note
          setUnlockedNotes(prev => new Set([...prev, noteId]));
          if (passwordModal.onSuccess) passwordModal.onSuccess();
        } else if (payload.action === 'set' || payload.action === 'change') {
          // Update local note to show it has a password
          setNotes(prev => prev.map(n => n.id === noteId ? { ...n, password: true, has_password: true } : n));
        } else if (payload.action === 'remove') {
          // Remove password indicator
          setNotes(prev => prev.map(n => n.id === noteId ? { ...n, password: null, has_password: false } : n));
          setUnlockedNotes(prev => { const s = new Set(prev); s.delete(noteId); return s; });
        }
        setPasswordModal(null);
      }
    } catch (e) {
      setPasswordError(e.message || 'Có lỗi xảy ra');
    }
  };

  const handleSaveShare = (noteId, { shareList, visibility }) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    // ShareModal already calls share API — just update local state + visibility
    const updatedNote = { ...note, shareList, visibility, updatedAt: new Date().toISOString() };
    saveNotes(notes.map(n => n.id === noteId ? updatedNote : n));
    // Update visibility via notes API
    apiCall(`/notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify({ title: note.title, content: note.content || '', visibility })
    }).catch(e => console.error(e));
    setShareModal(null);
  };
  const handleRevokeShare = (noteId, email) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const share = (note.shareList || []).find(s => s.email === email);
    if (!share) return;

    apiCall('/shares', {
      method: 'DELETE',
      body: JSON.stringify({ note_id: noteId, shared_with: share.shared_with || share.id })
    }).catch(e => console.error(e));

    const updatedNote = { ...note, shareList: (note.shareList || []).filter(s => s.email !== email), updatedAt: new Date().toISOString() };
    saveNotes(notes.map(n => n.id === noteId ? updatedNote : n));
    syncUpdateNote(updatedNote);
    if (viewingNote?.id === noteId) setViewingNote(prev => ({ ...prev, shareList: (prev.shareList || []).filter(s => s.email !== email) }));
  };

  const handleUpdateShareRole = async (noteId, email, newRole) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const share = (note.shareList || []).find(s => s.email === email);
    if (!share) return;

    try {
      await apiCall('/shares/role', {
        method: 'PUT',
        body: JSON.stringify({ share_id: share.id, role: newRole })
      });
      const updatedShareList = (note.shareList || []).map(s => s.email === email ? { ...s, role: newRole } : s);
      const updatedNote = { ...note, shareList: updatedShareList, updatedAt: new Date().toISOString() };
      saveNotes(notes.map(n => n.id === noteId ? updatedNote : n));
      syncUpdateNote(updatedNote);
      if (viewingNote?.id === noteId) setViewingNote(prev => ({ ...prev, shareList: updatedShareList }));
    } catch (e) {
      console.error(e);
      alert('Lỗi khi cập nhật quyền: ' + e.message);
    }
  };

  const handleMarkSeen = async (shareId) => {
    try {
      await apiCall('/shares/mark-as-seen', {
        method: 'POST',
        body: JSON.stringify({ share_id: shareId })
      });
      setSharedWithMe(prev => prev.map(n => n.share_id === shareId ? { ...n, is_seen: true } : n));
    } catch (e) {
      console.error('Lỗi khi đánh dấu đã xem:', e);
    }
  };
  const handleSaveLabels = (noteId, selectedIds) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const selectedLabels = allLabels.filter(l => selectedIds.includes(l.id));
    const updatedNote = { ...note, labels: selectedLabels, updatedAt: new Date().toISOString() };
    saveNotes(notes.map(n => n.id === noteId ? updatedNote : n));
    syncUpdateNote(updatedNote);
    if (formData.id === noteId) setFormData(prev => ({ ...prev, labels: selectedLabels }));
    setLabelModal(null);
  };
  const handleSaveGlobalLabels = async (newLabels) => {
    const existingIds = new Set(allLabels.map(l => l.id));
    const newIds = new Set(newLabels.map(l => l.id));
    const deletedIds = new Set(allLabels.filter(l => !newIds.has(l.id)).map(l => l.id));

    // Delete removed labels from API
    for (const id of deletedIds) {
      apiCall(`/labels/${id}`, { method: 'DELETE' }).catch(e => console.error(e));
    }

    // Create new labels / update existing
    const resolvedLabels = [];
    for (const lb of newLabels) {
      if (!existingIds.has(lb.id)) {
        // New label — create via API
        try {
          const res = await apiCall('/labels', { method: 'POST', body: JSON.stringify({ name: lb.name, color: lb.color }) });
          if (res.success) resolvedLabels.push(res.label);
          else resolvedLabels.push(lb);
        } catch (e) { resolvedLabels.push(lb); }
      } else {
        // Check if renamed/recolored
        const orig = allLabels.find(l => l.id === lb.id);
        if (orig && (orig.name !== lb.name || orig.color !== lb.color)) {
          apiCall(`/labels/${lb.id}`, { method: 'PUT', body: JSON.stringify(lb) }).catch(e => console.error(e));
        }
        resolvedLabels.push(lb);
      }
    }

    setAllLabels(resolvedLabels);

    // Remove deleted labels from affected notes
    if (deletedIds.size > 0) {
      const updatedNotes = notes.map(n => {
        const remainingLabels = (n.labels || []).filter(l => !deletedIds.has(l.id));
        if (remainingLabels.length !== (n.labels || []).length) {
          const updatedNote = { ...n, labels: remainingLabels };
          syncUpdateNote(updatedNote);
          return updatedNote;
        }
        return n;
      });
      saveNotes(updatedNotes);
    }
    setLabelEditor(false);
  };

  const handleFormat = cmd => { document.execCommand(cmd, false, null); editorRef.current?.focus(); };
  const applyFontToEditor = font => { setEditorFont(font); setFormData(prev => ({ ...prev, fontFamily: font })); if (editorRef.current) editorRef.current.style.fontFamily = font; };
  const applyColorToEditor = color => {
    if (!editorRef.current) return; setEditorColor(color); editorRef.current.focus();
    const sel = window.getSelection(), range = document.createRange();
    range.selectNodeContents(editorRef.current); sel.removeAllRanges(); sel.addRange(range);
    document.execCommand('foreColor', false, color); sel.removeAllRanges(); editorRef.current.focus();
  };
  const handleAttachmentAdd = e => {
    const files = Array.from(e.target.files); if (!files.length) return;
    Promise.all(files.map(f => new Promise(res => { const r = new FileReader(); r.onloadend = () => res({ name: f.name, type: f.type, size: f.size, data: r.result }); r.readAsDataURL(f); })))
      .then(results => setFormData(prev => ({ ...prev, attachments: [...(prev.attachments || []), ...results] })));
    e.target.value = '';
  };

  const navigateMonth = dir => {
    setIsFlipping(true);
    setTimeout(() => { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + (dir === 'next' ? 1 : -1), 1)); setIsFlipping(false); }, 300);
  };

  /* ── Calendar vars ── */
  const year = currentDate.getFullYear(), month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
  const getDateStr = d => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const vnMonths = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
  const expandedNotes = getSortedNotes(notes);

  if (!currentUser) return null;

  /* ── Sub-components ── */
  const StatusIcons = ({ note }) => (
    <div className="flex items-center gap-1 flex-shrink-0 flex-wrap">
      {note._isSharedEditor && <span title="Được chia sẻ (có quyền sửa)" className="text-[11px] bg-blue-100 text-blue-700 rounded-full px-1.5 py-px font-black">✏️ {note._ownerInfo}</span>}
      {note.isPinned && <span title="Đã ghim" className="text-[13px]">📌</span>}
      {(note.password || note.has_password) && <span title="Có mật khẩu" className="text-[13px]">🔒</span>}
      {(note.shareList?.length > 0 || note.visibility === 'public') && <span title="Đã chia sẻ" className="text-[13px]">🔗</span>}
      {(note.labels || []).slice(0, 3).map(lb => (
        <div key={lb.id} title={lb.name} className="w-2 h-2 rounded-full border border-white/60 flex-shrink-0" style={{ background: lb.color }} />
      ))}
      {(note.shareList?.length || 0) > 0 && (
        <span className="text-[10px] bg-indigo-100 text-indigo-700 rounded-full px-1.5 py-px font-black">{note.shareList.length}</span>
      )}
    </div>
  );

  const NoteCard = ({ note }) => {
    const locked = (note.password || note.has_password) && !unlockedNotes.has(note.id);
    const bg = note.color || prefs.defaultColor;
    const fontFam = note.fontFamily || prefs.fontFamily;
    const stripped = (note.content || '').replace(/<[^>]+>/g, '');
    const borderL = note.isPinned ? '#6366f1' : note.isImportant ? '#ef4444' : 'rgba(0,0,0,0.1)';

    if (viewMode === 'list') return (
      <div className={`${CLS_CARD} flex items-start gap-3`}
        style={{ background: bg, borderLeft: `4px solid ${borderL}` }}
        onClick={() => handleViewNote(note)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-black text-[15px] flex-1 leading-snug">{note.title}</h3>
            <StatusIcons note={note} />
          </div>
          {!locked && <p className="text-[13px] text-black/60 m-0 line-clamp-2" style={{ fontFamily: fontFam }}>{stripped}</p>}
          {locked && <p className="text-[13px] text-black/40 italic m-0">🔒 Nội dung được bảo vệ</p>}
          {(note.labels || []).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {note.labels.map(lb => <span key={lb.id} className="text-[11px] font-extrabold px-2 py-px rounded-full" style={{ background: lb.color + '25', color: lb.color, border: `1px solid ${lb.color}50` }}>{lb.name}</span>)}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
          {note._isSharedEditor ? (
            /* Shared editor note: only View + Edit */
            <>
              <button onClick={() => handleNoteAccess(note, handleEditNote)} className={CLS_IBTN_SM} title="Sửa">✏️</button>
            </>
          ) : (
            /* Own note: full controls */
            <>
              <button onClick={() => togglePin(note.id)} className={CLS_IBTN_SM} title={note.isPinned ? 'Bỏ ghim' : 'Ghim'}>{note.isPinned ? '📌' : '📍'}</button>
              <button onClick={() => handleNoteAccess(note, handleEditNote)} className={CLS_IBTN_SM} title="Sửa">✏️</button>
              <button onClick={() => setLabelModal({ noteId: note.id })} className={CLS_IBTN_SM} title="Nhãn">🏷️</button>
              {!(note.password || note.has_password) && (
                <button onClick={() => setShareModal(note)} className={CLS_IBTN_SM} title="Chia sẻ">🔗</button>
              )}
              <button onClick={() => {
                const hasPw = note.password || note.has_password;
                if (hasPw && !unlockedNotes.has(note.id)) {
                  setPasswordModal({ mode: 'verify', noteId: note.id, onSuccess: () => { setUnlockedNotes(prev => new Set([...prev, note.id])); setPasswordModal(null); setPasswordModal({ mode: 'change', noteId: note.id }); } });
                } else if (hasPw) {
                  setPasswordModal({ mode: 'change', noteId: note.id });
                } else {
                  setPasswordModal({ mode: 'set', noteId: note.id });
                }
              }} className={CLS_IBTN_SM} title={note.password || note.has_password ? 'Đổi/Gỡ MK' : 'Đặt MK'} style={{ background: (note.password || note.has_password) ? '#fef3c7' : undefined }}>{(note.password || note.has_password) ? '🔒' : '🔓'}</button>
              <button onClick={() => handleDeleteNote(note.id)} className={`${CLS_IBTN_SM} hover:!bg-red-100`} title="Xóa">🗑️</button>
            </>
          )}
        </div>
      </div>
    );

    return (
      <div className={`${CLS_CARD} flex flex-col relative`}
        style={{ background: bg, borderLeft: `4px solid ${borderL}` }}>
        {note.isPinned && <div className="absolute -top-2 -right-2 text-lg">📌</div>}
        <div className="flex-1 cursor-pointer" onClick={() => handleViewNote(note)}>
          <div className="flex justify-between items-start mb-2 gap-2">
            <h3 className="font-black text-[15px] flex-1 leading-snug"
              style={{ textDecoration: note.isDone ? 'line-through' : 'none', opacity: note.isDone ? 0.55 : 1 }}>
              {note.title}
            </h3>
            <StatusIcons note={note} />
          </div>
          {locked
            ? <p className="text-[13px] text-black/40 italic mb-2">🔒 Nội dung được bảo vệ</p>
            : <div className="rich-text-content text-[13px] text-black/65 line-clamp-3 mb-2"
              style={{ fontFamily: fontFam }}
              dangerouslySetInnerHTML={{ __html: note.content || '' }} />
          }
          {!locked && note.attachments?.some(a => a.type?.startsWith('image/')) && (
            <div className="flex gap-1.5 mb-2 flex-wrap">
              {note.attachments.filter(a => a.type?.startsWith('image/')).slice(0, 3).map((att, i) => (
                <img key={i} src={att.data} alt={att.name} className="w-12 h-12 object-cover rounded-lg border-2 border-white/60" />
              ))}
            </div>
          )}
          {(note.labels || []).length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {note.labels.map(lb => <span key={lb.id} className="text-[11px] font-extrabold px-2 py-px rounded-full" style={{ background: lb.color + '25', color: lb.color, border: `1px solid ${lb.color}50` }}>{lb.name}</span>)}
            </div>
          )}
        </div>
        <div className="pt-2.5 border-t border-black/[.08] flex justify-between items-center mt-2">
          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
            <button onClick={() => handleViewNote(note)} className={CLS_IBTN_SM} title="Xem">👁️</button>
            {note._isSharedEditor ? (
              /* Shared editor note: only View + Edit */
              <button onClick={() => handleNoteAccess(note, handleEditNote)} className={CLS_IBTN_SM} title="Sửa">✏️</button>
            ) : (
              /* Own note: full controls */
              <>
                <button onClick={() => togglePin(note.id)} className={CLS_IBTN_SM} title={note.isPinned ? 'Bỏ ghim' : 'Ghim'}>{note.isPinned ? '📌' : '📍'}</button>
                <button onClick={() => setLabelModal({ noteId: note.id })} className={CLS_IBTN_SM} title="Nhãn">🏷️</button>
                {!(note.password || note.has_password) && (
                  <button onClick={() => setShareModal(note)} className={CLS_IBTN_SM} title="Chia sẻ">🔗</button>
                )}
                <button onClick={() => {
                  const hasPw = note.password || note.has_password;
                  if (hasPw && !unlockedNotes.has(note.id)) {
                    setPasswordModal({ mode: 'verify', noteId: note.id, onSuccess: () => { setUnlockedNotes(prev => new Set([...prev, note.id])); setPasswordModal(null); setPasswordModal({ mode: 'change', noteId: note.id }); } });
                  } else if (hasPw) {
                    setPasswordModal({ mode: 'change', noteId: note.id });
                  } else {
                    setPasswordModal({ mode: 'set', noteId: note.id });
                  }
                }} className={CLS_IBTN_SM} style={{ background: (note.password || note.has_password) ? '#fef3c7' : undefined }} title={(note.password || note.has_password) ? 'Đổi/Gỡ MK' : 'Đặt MK'}>{(note.password || note.has_password) ? '🔒' : '🔓'}</button>
                <button onClick={() => handleNoteAccess(note, handleEditNote)} className={CLS_IBTN_SM} title="Sửa">✏️</button>
                <button onClick={() => handleDeleteNote(note.id)} className={`${CLS_IBTN_SM} hover:!bg-red-100`} title="Xóa">🗑️</button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const NoteGrid = ({ noteList }) => (
    <div className={viewMode === 'grid'
      ? 'grid gap-4 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]'
      : 'flex flex-col gap-4'}>
      {noteList.map(note => <NoteCard key={note.id} note={note} />)}
      {noteList.length === 0 && (
        <div className="col-span-full text-center py-16 px-5 text-slate-400">
          <div className="text-5xl opacity-35 mb-3">{searchQuery ? '🔍' : '🗒️'}</div>
          <p className="font-black text-lg m-0">{searchQuery ? `Không tìm thấy "${searchQuery}"` : 'Không có ghi chú nào'}</p>
          {!searchQuery && <p className="text-sm mt-1.5 text-slate-400">Nhấn ✍️ để tạo note đầu tiên!</p>}
        </div>
      )}
    </div>
  );

  const sharedByMe = getSortedNotes(notes.filter(n => n.shareList?.length > 0 || n.visibility === 'public'));

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="flex min-h-screen items-start overflow-x-hidden bg-indigo-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">

      {/* ═══ Saving Overlay ═══ */}
      {savingOverlay && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl px-8 py-6 shadow-2xl flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
            <span className="text-sm font-black text-slate-600 dark:text-slate-300">Đang lưu...</span>
          </div>
        </div>
      )}

      {/* ── Global styles (minimal — only what Tailwind can't do) ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        * { font-family: 'Nunito', sans-serif; box-sizing: border-box; }
        .rich-text-content ul { list-style-type: disc; margin-left: 1.5rem; }
        .rich-text-content ol { list-style-type: decimal; margin-left: 1.5rem; }
        .rich-text-content a  { color: #2563eb; text-decoration: underline; }
        .rich-text-content    { word-wrap: break-word; }
        [contenteditable]:focus { outline: none; }
        [contenteditable]:empty:before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 100px; }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes flipIn  { 0%{transform:rotateX(-90deg) scale(0.95);opacity:0}100%{transform:rotateX(0) scale(1);opacity:1} }
        .fade-up  { animation: fadeUp  0.3s ease forwards; }
        .cal-flip { animation: flipIn  0.3s cubic-bezier(0.23,1,0.32,1) forwards; }
      `}</style>

      {/* ── HAMBURGER ── */}
      <button
        onClick={() => setIsSidebarOpen(v => !v)}
        className="fixed top-3 left-3 z-[100] w-10 h-10 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 cursor-pointer flex flex-col items-center justify-center gap-1 transition-transform"
        style={{ transform: isSidebarOpen ? 'translateX(256px)' : 'none' }}>
        {[
          { transform: isSidebarOpen ? 'rotate(45deg) translateY(6px)' : 'none', width: 20 },
          { transform: 'none', width: isSidebarOpen ? 0 : 16, opacity: isSidebarOpen ? 0 : 1 },
          { transform: isSidebarOpen ? 'rotate(-45deg) translateY(-6px)' : 'none', width: 20 },
        ].map((s, i) => (
          <span key={i} className="block h-0.5 bg-slate-500 rounded transition-all duration-300" style={s} />
        ))}
      </button>

      {/* ── SIDEBAR ── */}
      <nav className={`w-64 bg-white dark:bg-slate-800 shadow-2xl flex flex-col fixed h-screen z-[90] border-r border-slate-200 dark:border-slate-700 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Avatar */}
        <div className="p-4 text-center border-b border-slate-200 dark:border-slate-700">
          <div className="relative inline-block mb-2">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 mx-auto">
              <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-slate-800" />
          </div>
          <p className="font-black text-sm truncate">{displayName}</p>
        </div>

        {/* Nav items */}
        <div className="p-2 flex-1 overflow-y-auto flex flex-col gap-0.5">
          {[
            { view: 'calendar', icon: '📅', label: 'Lịch Cá Nhân' },
            { view: 'all-notes', icon: '📂', label: 'Tất cả Ghi chú' },
            {
              view: 'shared',
              icon: '🔗',
              label: 'Đã chia sẻ',
              badge: sharedByMe.length,
              hasNew: sharedWithMe.some(n => !n.is_seen)
            },
            { view: 'settings', icon: '⚙️', label: 'Cài đặt' },
          ].map(item => (
            <button key={item.view}
              onClick={() => { setActiveView(item.view); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
              className={`relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all font-extrabold text-sm border-0 cursor-pointer text-left font-[inherit] ${activeView === item.view ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-transparent text-slate-400 dark:text-slate-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-500'}`}>
              <span className="text-base">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-px rounded-full ${activeView === item.view ? 'bg-white/25 text-white' : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300'}`}>
                  {item.badge}
                </span>
              )}
              {item.hasNew && (
                <span className="absolute left-6 top-3 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-800" />
              )}
            </button>
          ))}

          <div className="my-1.5 border-t border-slate-200 dark:border-slate-700" />

          <button
            onClick={() => { setFormData({ ...defaultNote }); setEditorFont(prefs.fontFamily); setEditorColor('#1f2937'); setShowModal(true); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 text-white border-0 cursor-pointer font-black text-sm font-[inherit] shadow-lg shadow-green-500/25 transition-all hover:opacity-90">
            <span className="text-base">✍️</span><span>Tạo Note Mới</span>
          </button>
        </div>

        {/* Stats */}
        <div className="p-2.5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <div className="grid grid-cols-2 gap-1.5">
            {[{ val: notes.length, label: 'Tổng', c: '#6366f1' }, { val: notes.filter(n => n.isPinned).length, label: 'Ghim', c: '#f59e0b' }].map(s => (
              <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl p-1.5 text-center border border-slate-200 dark:border-slate-700">
                <div className="text-lg font-black" style={{ color: s.c }}>{s.val}</div>
                <div className="text-[10px] font-bold text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* Sidebar overlay (mobile) */}
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 z-[80] bg-black/20" />}

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 min-w-0 min-h-screen px-5 pb-8 pt-[68px] transition-[margin] duration-300"
        style={{ marginLeft: isSidebarOpen ? 256 : 0 }}>

        {/* Unverified Banner */}
        {isActive === '0' && (
          <div className={`mb-4 bg-amber-100 border-l-4 border-amber-500 text-amber-800 p-4 rounded-r-xl shadow-sm ${isSidebarOpen ? '' : 'ml-11'}`} role="alert">
            <p className="font-black m-0 text-[15px]">⚠️ Tài khoản chưa được xác thực!</p>
            <p className="m-0 text-sm mt-1">Vui lòng kiểm tra hộp thư email của bạn để kích hoạt tài khoản.</p>
          </div>
        )}

        {/* ════ CALENDAR ════ */}
        {activeView === 'calendar' && (
          <div className="fade-up">
            <div className={`flex justify-between items-center mb-4 flex-wrap gap-2.5 ${isSidebarOpen ? '' : 'pl-11'}`}>
              <div>
                <h1 className="text-[26px] font-black">{vnMonths[month]}</h1>
                <p className="text-[13px] text-slate-400 font-bold">{year}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigateMonth('prev')} className={CLS_ICON_BTN}>◀</button>
                <button onClick={() => setCurrentDate(new Date())} className={`${CLS_BTN_PRI} text-xs px-3.5 py-2`}>Hôm nay</button>
                <button onClick={() => navigateMonth('next')} className={CLS_ICON_BTN}>▶</button>
              </div>
            </div>

            <div className={`bg-white dark:bg-slate-800 rounded-[18px] shadow-md p-3.5 border border-slate-200 dark:border-slate-700 ${isFlipping ? 'cal-flip' : ''}`}>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1.5">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d, i) => (
                  <div key={d} className={`text-center font-black text-[11px] py-0.5 ${i === 6 ? 'text-red-500' : 'text-slate-400'}`}>{d}</div>
                ))}
              </div>
              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startDayIndex }).map((_, i) => <div key={`e${i}`} className="min-h-[78px]" />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1, dateStr = getDateStr(day);
                  const notesToday = expandedNotes.filter(n => (n.createdAt || n.created_at || n.updatedAt || n.updated_at || '').slice(0, 10) === dateStr);
                  const holidays = getHolidaysForDate(dateStr);
                  const isToday = new Date().toISOString().slice(0, 10) === dateStr;
                  const isSun = new Date(year, month, day).getDay() === 0;
                  return (
                    <div key={day}
                      onClick={() => setSelectedDayNotes({ day, dateStr, notes: notesToday, holidays })}
                      className={`min-h-[78px] p-1.5 rounded-xl border cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-400 ${isToday ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                      <div className="flex justify-between items-start">
                        <div className={`w-5.5 h-5.5 flex items-center justify-center rounded-lg text-xs font-black ${isToday ? 'bg-indigo-500 text-white' : isSun ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}
                          style={{ width: 22, height: 22 }}>{day}</div>
                        <span className="text-[9px] text-slate-400 font-semibold">{getLunarDay(day, month + 1, year)}</span>
                      </div>
                      <div className="mt-1 flex flex-col gap-0.5">
                        {holidays.slice(0, 1).map((h, idx) => (
                          <div key={idx} className="text-[8px] px-1 py-px rounded font-extrabold truncate text-slate-700"
                            style={{ background: h.color + '90' }}>{h.emoji} {h.name}</div>
                        ))}
                        {notesToday.slice(0, 2).map(n => (
                          <div key={n.id} className="text-[8px] px-1 py-px rounded font-extrabold truncate text-slate-700"
                            style={{ background: n.color || prefs.defaultColor }}>
                            {n.isPinned ? '📌' : ''}{n.title}
                          </div>
                        ))}
                        {notesToday.length > 2 && <div className="text-[8px] text-slate-400 font-bold">+{notesToday.length - 2}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ════ ALL NOTES ════ */}
        {activeView === 'all-notes' && (
          <div className="fade-up">
            <div className={`flex items-center justify-between mb-3.5 flex-wrap gap-2.5 ${isSidebarOpen ? '' : 'pl-11'}`}>
              <h1 className="text-[26px] font-black">📂 Ghi chú</h1>
              <div className="flex gap-2">
                <button onClick={() => { setFormData({ ...defaultNote }); setEditorFont(prefs.fontFamily); setShowModal(true); }} className={`${CLS_BTN_PRI} text-xs px-4 py-2.5`}>✍️ Tạo mới</button>
                <button onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')} className={`${CLS_BTN_SEC} text-xs px-3.5 py-2.5`}>{viewMode === 'grid' ? '☰' : '⊞'}</button>
                <button onClick={() => setLabelEditor(true)} className={`${CLS_BTN_SEC} text-xs px-3 py-2.5`} title="Quản lý nhãn">🏷️</button>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-3.5">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base pointer-events-none opacity-45">🔍</span>
              <input type="text" placeholder="Tìm kiếm theo tiêu đề, nội dung, nhãn..."
                value={displayQuery} onChange={e => handleSearchInput(e.target.value)}
                className={`${CLS_INPUT} pl-10 ${displayQuery ? 'pr-10' : ''} rounded-xl`} />
              {displayQuery && (
                <button onClick={() => { setDisplayQuery(''); setSearchQuery(''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-none border-0 cursor-pointer text-sm opacity-45 font-[inherit]">✕</button>
              )}
            </div>
            {searchQuery && (
              <div className="mb-2.5 text-sm font-bold text-slate-400">
                Kết quả cho "<strong className="text-indigo-500">{searchQuery}</strong>" — {getFilteredNotes().length} note
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-1.5 mb-4 overflow-x-auto pb-1">
              {FILTER_OPTIONS.map(f => (
                <button key={f.value} onClick={() => setActiveFilter(f.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold cursor-pointer transition-all border whitespace-nowrap font-[inherit] ${activeFilter === f.value ? 'bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/25' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-500'}`}>
                  <span>{f.icon}</span><span>{f.label}</span>
                  {activeFilter === f.value && (
                    <span className="bg-white/25 rounded-full px-1.5 py-px text-[10px] font-black">{getFilteredNotes().length}</span>
                  )}
                </button>
              ))}
              {allLabels.map(lb => {
                const isActive = activeLabel === lb.id;
                return (
                  <button key={`lb-${lb.id}`}
                    onClick={() => setActiveLabel(isActive ? null : lb.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold cursor-pointer transition-all border whitespace-nowrap font-[inherit] ${isActive ? 'shadow-md ring-2 ring-offset-1' : ''}`}
                    style={{ borderColor: lb.color + (isActive ? 'ff' : '60'), background: lb.color + (isActive ? '40' : '15'), color: lb.color, ringColor: isActive ? lb.color : undefined }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: lb.color }} />{lb.name}
                    {isActive && <span className="ml-1 text-[10px]">✕</span>}
                  </button>
                );
              })}
            </div>

            <NoteGrid noteList={getFilteredNotes()} />
          </div>
        )}

        {/* ════ SHARED ════ */}
        {activeView === 'shared' && (
          <div className="fade-up">
            <h1 className={`text-[26px] font-black mb-4 ${isSidebarOpen ? '' : 'pl-11'}`}>🔗 Đã chia sẻ</h1>
            <div className="flex gap-1.5 mb-4 bg-white dark:bg-slate-800 p-1 rounded-xl w-fit border border-slate-200 dark:border-slate-700">
              {[
                { key: 'by-me', label: 'Tôi chia sẻ', icon: '📤', count: sharedByMe.length },
                { key: 'with-me', label: 'Được chia sẻ', icon: '📥', count: sharedWithMe.length, hasUnseen: sharedWithMe.some(n => !n.is_seen) }
              ].map(tab => (
                <button key={tab.key} onClick={() => setSharedSubTab(tab.key)}
                  className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg border-0 cursor-pointer font-extrabold text-sm transition-all font-[inherit] ${sharedSubTab === tab.key ? 'bg-indigo-500 text-white' : 'bg-transparent text-slate-400 hover:text-indigo-500'}`}>
                  <span>{tab.icon}</span><span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-px rounded-full font-[inherit] ${sharedSubTab === tab.key ? 'bg-white/25' : 'bg-slate-100 dark:bg-slate-700'}`}>{tab.count}</span>
                  {tab.hasUnseen && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-800" />
                  )}
                </button>
              ))}
            </div>

            {sharedSubTab === 'by-me' && (
              sharedByMe.length === 0
                ? <div className="text-center py-16 px-5 text-slate-400">
                  <div className="text-5xl opacity-35 mb-3">🔗</div>
                  <p className="font-black text-lg m-0">Chưa chia sẻ note nào</p>
                  <p className="text-sm mt-1.5">Mở note và nhấn 🔗 để chia sẻ!</p>
                </div>
                : <NoteGrid noteList={sharedByMe} />
            )}

            {sharedSubTab === 'with-me' && (
              sharedWithMe.length === 0
                ? <div className="text-center py-16 px-5 text-slate-400">
                  <div className="text-5xl opacity-35 mb-3">📥</div>
                  <p className="font-black text-lg m-0">Chưa có note nào được chia sẻ với bạn</p>
                  <p className="text-sm mt-1.5">Khi ai đó chia sẻ note, nó sẽ xuất hiện ở đây</p>
                </div>
                : <div className={viewMode === 'grid' ? 'grid gap-4 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]' : 'flex flex-col gap-4'}>
                  {sharedWithMe.map(note => (
                    <div key={note.share_id || note.id}
                      className={`relative rounded-[18px] p-4 border transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer ${!note.is_seen ? 'border-indigo-400 shadow-indigo-100' : 'border-black/10'}`}
                      style={{ background: note.color || prefs.defaultColor }}
                      onClick={() => {
                        setViewingNote(note);
                        if (!note.is_seen) handleMarkSeen(note.share_id);
                      }}>
                      {!note.is_seen && (
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-indigo-500 text-white text-[9px] font-black rounded-lg shadow-sm">MỚI</div>
                      )}
                      <div className="flex items-center gap-2 mb-2 flex-wrap pr-10">
                        <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          {(note.has_password && note.role === 'editor')
                            ? '🔒 Chỉ xem (note bị khóa)'
                            : note.role === 'editor' ? '✏️ Có thể sửa' : '👁️ Chỉ xem'
                          }
                        </span>
                        <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                          📤 {note.owner_name || note.owner_email}
                        </span>
                      </div>
                      <h3 className="font-black text-base mb-1 text-slate-800">{note.title}</h3>
                      <p className="text-xs text-black/55 line-clamp-3" style={{ fontFamily: note.fontFamily || prefs.fontFamily }}>
                        {(note.content || '').replace(/<[^>]+>/g, '')}
                      </p>
                      {note.shared_at && (
                        <div className="text-[10px] text-black/40 mt-2 font-semibold">Chia sẻ: {new Date(note.shared_at).toLocaleString('vi-VN')}</div>
                      )}
                      {/* Action buttons for shared notes */}
                      <div className="flex gap-1.5 mt-2 pt-2 border-t border-black/[.08]" onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setViewingNote(note); if (!note.is_seen) handleMarkSeen(note.share_id); }}
                          className={`${CLS_IBTN_SM} text-[10px]`} title="Xem">👁️ Xem</button>
                        {note.role === 'editor' && !(note.has_password) && (
                          <button onClick={() => handleEditNote(note)}
                            className={`${CLS_IBTN_SM} text-[10px]`} title="Sửa">✏️ Sửa</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
            )}
          </div>
        )}

        {/* ════ SETTINGS ════ */}
        {activeView === 'settings' && (
          <div className="fade-up">
            <h1 className={`text-[26px] font-black mb-5 ${isSidebarOpen ? '' : 'pl-11'}`}>⚙️ Cài đặt</h1>
            <div className="flex flex-col gap-3.5 max-w-2xl">

              {/* Giao diện */}
              <div className="bg-white dark:bg-slate-800 rounded-[18px] p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                <span className={CLS_LABEL}>🎨 Giao diện</span>
                <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-700">
                  <div>
                    <div className="font-extrabold text-sm">Chế độ tối</div>
                    <div className="text-xs text-slate-400 mt-0.5">Bảo vệ mắt khi dùng ban đêm</div>
                  </div>
                  <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                    className={`relative w-11 h-6 rounded-full cursor-pointer border-0 transition-all flex-shrink-0 ${theme === 'dark' ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${theme === 'dark' ? 'left-[23px]' : 'left-0.5'}`} />
                  </button>
                </div>
                <div className="pt-3">
                  <div className="font-extrabold text-sm mb-2">Màu note mặc định</div>
                  <div className="flex gap-2 flex-wrap">
                    {NOTE_BG_COLORS.map(c => (
                      <button key={c} onClick={() => setPrefs(p => ({ ...p, defaultColor: c }))}
                        className="w-8 h-8 rounded-xl border-2 cursor-pointer transition-transform hover:scale-110"
                        style={{ background: c, borderColor: prefs.defaultColor === c ? '#6366f1' : '#e2e8f0' }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Font */}
              <div className="bg-white dark:bg-slate-800 rounded-[18px] p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                <span className={CLS_LABEL}>✍️ Văn bản mặc định</span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <div className="font-extrabold text-sm mb-1.5">Font chữ</div>
                    <select value={prefs.fontFamily} onChange={e => setPrefs(p => ({ ...p, fontFamily: e.target.value }))} className={CLS_INPUT}>
                      {FONT_OPTIONS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="font-extrabold text-sm mb-1.5">Cỡ chữ: {prefs.fontSize}px</div>
                    <input type="range" min={11} max={22} value={prefs.fontSize}
                      onChange={e => setPrefs(p => ({ ...p, fontSize: +e.target.value }))}
                      className="w-full accent-indigo-500" />
                  </div>
                </div>
                <div className="mt-2.5 p-2.5 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-500 dark:text-slate-300 font-semibold"
                  style={{ fontFamily: prefs.fontFamily, fontSize: prefs.fontSize }}>
                  Đây là ví dụ văn bản với font "{prefs.fontFamily}" cỡ {prefs.fontSize}px
                </div>
              </div>

              {/* Holidays */}
              <div className="bg-white dark:bg-slate-800 rounded-[18px] p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                <span className={CLS_LABEL}>📅 Hiển thị ngày lễ trên lịch</span>
                {[
                  { key: 'showVietnameseHolidays', label: 'Ngày lễ Việt Nam', desc: 'Quốc khánh, 30/4, 1/5…', icon: '🇻🇳' },
                  { key: 'showInternationalHolidays', label: 'Ngày lễ quốc tế', desc: 'Valentine, Halloween, Giáng Sinh…', icon: '🌍' },
                  { key: 'showLunarHolidays', label: 'Lễ âm lịch', desc: 'Rằm, Vu Lan, Trung Thu…', icon: '🌕' },
                  { key: 'showTet', label: 'Tết Nguyên Đán', desc: 'Mùng 1, 2, 3, Giao Thừa, Ông Táo', icon: '🧧' },
                ].map(s => (
                  <div key={s.key} className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{s.icon}</span>
                      <div>
                        <div className="font-extrabold text-sm">{s.label}</div>
                        <div className="text-[11px] text-slate-400 mt-px">{s.desc}</div>
                      </div>
                    </div>
                    <button onClick={() => setSettings(prev => ({ ...prev, [s.key]: !prev[s.key] }))}
                      className={`relative w-11 h-6 rounded-full cursor-pointer border-0 transition-all flex-shrink-0 ${settings[s.key] ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${settings[s.key] ? 'left-[23px]' : 'left-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Labels */}
              <div className="bg-white dark:bg-slate-800 rounded-[18px] p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-3">
                  <span className={`${CLS_LABEL} m-0`}>🏷️ Quản lý nhãn ({allLabels.length})</span>
                  <button onClick={() => setLabelEditor(true)} className={`${CLS_BTN_PRI} text-xs py-1.5 px-3.5`}>+ Tạo nhãn</button>
                </div>
                {allLabels.length === 0
                  ? <div className="text-slate-400 text-sm text-center py-3.5">Chưa có nhãn nào</div>
                  : <div className="flex flex-wrap gap-1.5">
                    {allLabels.map(lb => (
                      <span key={lb.id} className="text-xs font-extrabold px-3 py-1 rounded-full"
                        style={{ background: lb.color + '25', color: lb.color, border: `1px solid ${lb.color}50` }}>
                        {lb.name}
                      </span>
                    ))}
                  </div>
                }
              </div>

              {/* Account */}
              <div className="bg-white dark:bg-slate-800 rounded-[18px] p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                <span className={CLS_LABEL}>👤 Tài khoản</span>
                <div className="flex items-center gap-3.5 mb-3.5">
                  <div className="w-13 h-13 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 flex-shrink-0" style={{ width: 52, height: 52 }}>
                    <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-black text-[15px]">{displayName}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{currentUser}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigate('/user')} className={`${CLS_BTN_SEC} flex-1 text-xs`}>✏️ Chỉnh hồ sơ</button>
                  <button onClick={() => { localStorage.removeItem('currentUser'); sessionStorage.removeItem('currentUser'); localStorage.removeItem('displayName'); localStorage.removeItem('avatar'); navigate('/login'); }}
                    className="flex-1 py-2.5 rounded-xl bg-red-50 border-0 text-red-600 font-black cursor-pointer text-xs font-[inherit] hover:bg-red-100 transition-colors">
                    🚪 Đăng xuất
                  </button>
                </div>
              </div>

              {/* Data */}
              <div className="bg-white dark:bg-slate-800 rounded-[18px] p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                <span className={CLS_LABEL}>💾 Dữ liệu</span>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => {
                    const data = JSON.stringify({ notes, labels: allLabels, prefs, settings, exportedAt: new Date().toISOString() }, null, 2);
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = `notes_backup_${Date.now()}.json`; a.click();
                    URL.revokeObjectURL(url);
                  }} className={`${CLS_BTN_SEC} text-xs`}>📤 Xuất dữ liệu (JSON)</button>
                  <label className={`${CLS_BTN_SEC} text-xs cursor-pointer inline-flex items-center gap-1.5`}>
                    📥 Nhập dữ liệu
                    <input type="file" accept=".json" className="hidden" onChange={e => {
                      const f = e.target.files[0]; if (!f) return;
                      const r = new FileReader(); r.onload = ev => {
                        try {
                          const d = JSON.parse(ev.target.result);
                          if (d.notes) saveNotes(d.notes);
                          if (d.labels) setAllLabels(d.labels);
                          if (d.prefs) setPrefs(d.prefs);
                          alert('✅ Nhập dữ liệu thành công!');
                        } catch { alert('❌ File không hợp lệ!'); }
                      }; r.readAsText(f); e.target.value = '';
                    }} />
                  </label>
                  <button onClick={() => { if (window.confirm('⚠️ Xóa toàn bộ ghi chú? Không thể hoàn tác!')) saveNotes([]); }}
                    className="text-xs py-2.5 px-4 rounded-xl bg-red-50 border-0 text-red-600 font-black cursor-pointer font-[inherit] hover:bg-red-100 transition-colors">
                    🗑️ Xóa tất cả note
                  </button>
                </div>
                <div className="mt-2.5 text-xs text-slate-400 font-semibold">
                  Đang lưu {notes.length} ghi chú · Dữ liệu lưu cục bộ trên trình duyệt
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ════ DAY DETAIL MODAL ════ */}
      {selectedDayNotes && (
        <div className={CLS_OVERLAY} onClick={() => setSelectedDayNotes(null)}>
          <div className={`${CLS_BOX} max-w-xl max-h-[88vh] flex flex-col`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="m-0 font-black text-lg">📅 Ngày {selectedDayNotes.day}/{month + 1}/{year}</h3>
                <div className="text-xs text-slate-400 font-semibold mt-0.5">{getLunarDay(selectedDayNotes.day, month + 1, year)} (Âm lịch)</div>
              </div>
              <button onClick={() => setSelectedDayNotes(null)} className={CLS_ICON_BTN}>✕</button>
            </div>

            {selectedDayNotes.holidays.length > 0 && (
              <div className="mb-3.5 flex flex-col gap-1.5">
                {selectedDayNotes.holidays.map((h, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border"
                    style={{ background: h.color + '40', borderColor: h.color + '60' }}>
                    <span className="text-2xl">{h.emoji}</span>
                    <span className="font-black text-sm text-slate-800">{h.name}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="overflow-y-auto flex-1">
              {selectedDayNotes.notes.length === 0 ? (
                <div className="text-center py-10 px-5 text-slate-400">
                  <div className="text-4xl opacity-35 mb-2.5">🗒️</div>
                  <p className="font-extrabold text-[15px]">Không có ghi chú nào hôm nay</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {selectedDayNotes.notes.map(note => {
                    const locked = (note.password || note.has_password) && !unlockedNotes.has(note.id);
                    return (
                      <div key={note.id}
                        className="rounded-2xl px-3.5 py-3 flex items-start gap-2.5 cursor-pointer"
                        style={{ background: note.color || prefs.defaultColor }}
                        onClick={() => { setSelectedDayNotes(null); setTimeout(() => handleViewNote(note), 80); }}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-black text-sm" style={{ textDecoration: note.isDone ? 'line-through' : 'none', opacity: note.isDone ? 0.55 : 1 }}>{note.title}</h4>
                            <StatusIcons note={note} />
                          </div>
                          {!locked && (
                            <p className="text-xs text-black/55 mt-1 line-clamp-2" style={{ fontFamily: note.fontFamily || prefs.fontFamily }}>
                              {(note.content || '').replace(/<[^>]+>/g, '')}
                            </p>
                          )}
                          {locked && <p className="text-xs text-black/40 italic mt-1">🔒 Nội dung được bảo vệ</p>}
                          {(note.labels || []).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {note.labels.map(lb => <span key={lb.id} className="text-[11px] font-extrabold px-2 py-px rounded-full" style={{ background: lb.color + '25', color: lb.color, border: `1px solid ${lb.color}50` }}>{lb.name}</span>)}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                          <button onClick={() => { handleNoteAccess(note, handleEditNote); setSelectedDayNotes(null); }} className={CLS_IBTN_SM} title="Sửa">✏️</button>
                          <button onClick={() => { handleDeleteNote(note.id); setSelectedDayNotes(prev => ({ ...prev, notes: prev.notes.filter(n => n.id !== note.id) })); }} className={`${CLS_IBTN_SM} hover:!bg-red-100`} title="Xóa">🗑️</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3.5 border-t border-slate-200 dark:border-slate-700 mt-3">
              <button className={`${CLS_BTN_PRI} w-full py-3`} onClick={() => {
                const dayDate = selectedDayNotes.dateStr + 'T12:00:00.000Z';
                setSelectedDayNotes(null);
                setTimeout(() => { setFormData({ ...defaultNote, createdAt: dayDate }); setEditorFont(prefs.fontFamily); setEditorColor('#1f2937'); setShowModal(true); }, 80);
              }}>✍️ Tạo ghi chú cho ngày này</button>
            </div>
          </div>
        </div>
      )}

      {/* ════ CREATE / EDIT NOTE MODAL ════ */}
      {showModal && (
        <div className={CLS_OVERLAY} onClick={handleCancel}>
          <div className="bg-white dark:bg-slate-800 rounded-[22px] w-full max-w-2xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
            onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2.5 flex-shrink-0">
              <div className="flex-1">
                <input type="text" placeholder="📝 Tiêu đề ghi chú..." value={formData.title}
                  onChange={e => { setFormData(p => ({ ...p, title: e.target.value })); triggerAutoSave({ ...formData, title: e.target.value }, editorRef.current?.innerHTML || ''); }}
                  className="text-lg font-black border-0 bg-transparent p-0 rounded-none w-full text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
                  autoFocus />
              </div>
              {formData.id && <span className="text-[11px] text-slate-400 font-bold whitespace-nowrap">💾 Tự lưu</span>}
              <button onClick={handleCancel} className={CLS_ICON_BTN}>✕</button>
            </div>

            {/* Toolbar */}
            <div className="px-3.5 py-2 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-1.5 bg-slate-50 dark:bg-slate-900/50 flex-shrink-0">
              {[['B', 'bold'], ['I', 'italic'], ['U', 'underline'], ['S', 'strikeThrough']].map(([label, cmd]) => (
                <button key={cmd} onMouseDown={e => { e.preventDefault(); handleFormat(cmd); }}
                  className={`${CLS_ICON_BTN} w-7 h-7 text-[13px]`}
                  style={{ fontWeight: label === 'B' ? 900 : 600, fontStyle: label === 'I' ? 'italic' : 'normal', textDecoration: label === 'U' ? 'underline' : label === 'S' ? 'line-through' : 'none' }}>
                  {label}
                </button>
              ))}
              <div className="w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />
              {[['•≡', 'insertUnorderedList'], ['1≡', 'insertOrderedList']].map(([label, cmd]) => (
                <button key={cmd} onMouseDown={e => { e.preventDefault(); handleFormat(cmd); }} className={`${CLS_ICON_BTN} w-7 h-7 text-xs`}>{label}</button>
              ))}
              <div className="w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />
              <select value={editorFont} onChange={e => applyFontToEditor(e.target.value)}
                className={`${CLS_INPUT} text-[11px] py-0 px-1.5 w-auto min-w-[100px]`}>
                {FONT_OPTIONS.map(f => <option key={f.id} value={f.id}>{f.label.split(' ')[0]}</option>)}
              </select>
              <select onChange={e => { document.execCommand('fontSize', false, e.target.value); editorRef.current?.focus(); }} defaultValue="3"
                className={`${CLS_INPUT} text-[11px] py-0 px-1 w-14`}>
                {[1, 2, 3, 4, 5, 6, 7].map(s => <option key={s} value={s}>{[9, 10, 12, 14, 18, 24, 36][s - 1]}px</option>)}
              </select>
              <div className="flex gap-1 items-center">
                {TEXT_COLORS.map(c => (
                  <button key={c} onMouseDown={e => { e.preventDefault(); applyColorToEditor(c); }}
                    className="w-[18px] h-[18px] rounded-md border cursor-pointer transition-transform hover:scale-110"
                    style={{ background: c, borderColor: editorColor === c ? '#6366f1' : '#e2e8f0', borderWidth: editorColor === c ? 2 : 1.5 }} />
                ))}
              </div>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-auto px-5 py-3.5">
              <div ref={editorRef} contentEditable suppressContentEditableWarning
                data-placeholder="Nhập nội dung ghi chú..."
                style={{ fontFamily: editorFont || prefs.fontFamily, fontSize: formData.fontSize || prefs.fontSize }}
                className="min-h-48 outline-none leading-relaxed text-slate-800 dark:text-slate-200 break-words"
                onInput={() => triggerAutoSave(formData, editorRef.current?.innerHTML || '')}
              />
            </div>

            {/* Attachment previews */}
            {formData.attachments?.length > 0 && (
              <div className="px-5 py-2 border-t border-slate-200 dark:border-slate-700 flex gap-2 flex-wrap flex-shrink-0">
                {formData.attachments.map((att, i) => (
                  <div key={i} className="relative inline-block">
                    {att.type?.startsWith('image/')
                      ? <img src={att.data} alt={att.name} className="w-13 h-13 object-cover rounded-xl border-2 border-slate-200" style={{ width: 52, height: 52 }} />
                      : <div className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 text-[11px] font-bold max-w-[100px] truncate">📄 {att.name}</div>
                    }
                    <button onClick={() => setFormData(p => ({ ...p, attachments: p.attachments.filter((_, j) => j !== i) }))}
                      className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-red-500 border-0 text-white cursor-pointer text-[10px] flex items-center justify-center font-black font-[inherit]">✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom bar */}
            <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 flex-wrap flex-shrink-0 bg-slate-50 dark:bg-slate-900/50">
              {/* Color swatches */}
              <div className="flex gap-1.5 items-center">
                {NOTE_BG_COLORS.slice(0, 6).map(c => (
                  <button key={c} onClick={() => setFormData(p => ({ ...p, color: c }))}
                    className="w-5 h-5 rounded-lg border-2 cursor-pointer transition-transform hover:scale-110"
                    style={{ background: c, borderColor: formData.color === c ? '#6366f1' : '#e2e8f0' }} />
                ))}
                <input type="color" value={formData.color || prefs.defaultColor}
                  onChange={e => setFormData(p => ({ ...p, color: e.target.value }))}
                  className="w-6 h-6 rounded-lg border border-slate-200 p-0.5 cursor-pointer bg-none" title="Màu tùy chỉnh" />
              </div>

              <div className="flex-1" />

              <div className="flex gap-1.5 flex-wrap">
                <button onClick={() => setFormData(p => ({ ...p, isPinned: !p.isPinned }))}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border-0 cursor-pointer text-xs font-extrabold font-[inherit] transition-colors ${formData.isPinned ? 'bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100' : 'bg-white dark:bg-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                  📌 Ghim
                </button>
                <button onClick={() => setLabelModal({ noteId: formData.id })}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border-0 cursor-pointer text-xs font-extrabold font-[inherit] transition-colors ${formData.labels?.length ? 'bg-violet-100 text-violet-800 dark:bg-violet-800 dark:text-violet-100' : 'bg-white dark:bg-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                  🏷️ {formData.labels?.length > 0 ? `${formData.labels.length} nhãn` : 'Nhãn'}
                </button>
                <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg cursor-pointer text-xs font-extrabold bg-white dark:bg-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-[inherit]">
                  📎 Đính kèm
                  <input type="file" multiple className="hidden" onChange={handleAttachmentAdd} accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt" />
                </label>
                <button onClick={() => {
                  if (formData.password || formData.has_password) {
                    setPasswordModal({ mode: 'change', noteId: formData.id || 'new' });
                  } else {
                    setPasswordModal({ mode: 'set', noteId: formData.id || 'new' });
                  }
                }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border-0 cursor-pointer text-xs font-extrabold font-[inherit] transition-colors ${(formData.password || formData.has_password) ? 'bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100' : 'bg-white dark:bg-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                  {(formData.password || formData.has_password) ? '🔒 Đổi MK' : '🔓 Đặt MK'}
                </button>
                {(formData.password || formData.has_password) && formData.id && (
                  <button onClick={() => setPasswordModal({ mode: 'remove', noteId: formData.id })}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border-0 cursor-pointer text-xs font-extrabold font-[inherit] transition-colors bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-300 hover:bg-red-100">
                    🔓 Gỡ MK
                  </button>
                )}
                <button onClick={handleSaveNote} disabled={isSaving.current} className={`${CLS_BTN_PRI} text-xs px-4 py-1.5`}>
                  {isSaving.current ? '⏳ Đang lưu...' : '💾 Lưu'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ OTHER MODALS ════ */}
      {viewingNote && (
        <ViewNoteModal note={viewingNote} onClose={() => setViewingNote(null)}
          onEdit={() => { setViewingNote(null); handleEditNote(viewingNote); }}
          onRevokeShare={handleRevokeShare}
          onUpdateShareRole={handleUpdateShareRole}
          currentUserEmail={currentUser} />
      )}

      {shareModal && (
        <ShareModal note={shareModal} onClose={() => setShareModal(null)}
          onSave={({ shareList, visibility }) => handleSaveShare(shareModal.id, { shareList, visibility })} />
      )}

      {passwordModal && (
        <PasswordModal mode={passwordModal.mode} error={passwordError}
          onSubmit={payload => handlePasswordSubmit(payload)}
          onCancel={() => { setPasswordModal(null); setPasswordError(''); }} />
      )}

      {labelModal && (
        <LabelManagerModal
          allLabels={allLabels}
          noteLabels={labelModal.noteId ? (notes.find(n => n.id === labelModal.noteId) || formData)?.labels || [] : formData.labels || []}
          onClose={() => setLabelModal(null)}
          onSave={selectedIds => {
            if (labelModal.noteId && labelModal.noteId !== formData.id) { handleSaveLabels(labelModal.noteId, selectedIds); }
            else {
              const selectedLabels = allLabels.filter(l => selectedIds.includes(l.id));
              triggerAutoSave({ ...formData, labels: selectedLabels }, editorRef.current?.innerHTML || '');
              setFormData(p => ({ ...p, labels: selectedLabels }));
              setLabelModal(null);
            }
          }}
          onManageGlobal={() => { setLabelModal(null); setLabelEditor(true); }} />
      )}

      {labelEditor && (
        <LabelEditor labels={allLabels} onClose={() => setLabelEditor(false)} onSave={handleSaveGlobalLabels} />
      )}

      {confirmDelete && (
        <ConfirmDialog message="Xóa ghi chú này? Hành động không thể hoàn tác."
          onConfirm={confirmDeleteNote}
          onCancel={() => setConfirmDelete(null)} />
      )}
    </div>
  );
};

export default Home;