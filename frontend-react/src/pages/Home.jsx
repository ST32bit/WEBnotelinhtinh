import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../api';
import {
  getLocalNotes,
  saveLocalNote,
  saveLocalNotesBulk,
  getLocalLabels,
  saveLocalLabelsBulk,
  addPendingSync,
  getPendingSyncs,
  removePendingSync,
  deleteLocalNote
} from '../db';


//Toast notification helper
const showToast = (message, type = 'info') => {
  const existing = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-[9999] px-4 py-3 rounded-xl shadow-lg font-bold text-sm animate-fade-up ${type === 'success' ? 'bg-green-500 text-white' : type === 'error' ? 'bg-red-500 text-white' : 'bg-indigo-500 text-white'}`;
  toast.textContent = message;
  if (!existing) {
    const container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  document.getElementById('toast-container').appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
};
window.toast = showToast;

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
const CLS_BOX = 'bg-white dark:bg-slate-800 rounded-[22px] p-4 sm:p-6 w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 mx-2 sm:mx-0';
// Primary button
const CLS_BTN_PRI = 'bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl px-4 py-2.5 font-black text-sm cursor-pointer transition-all hover:-translate-y-px active:translate-y-0 border-0';
// Secondary button
const CLS_BTN_SEC = 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 font-extrabold text-sm cursor-pointer transition-all hover:border-indigo-400 hover:text-indigo-500';
// Icon button (square)
const CLS_ICON_BTN = 'w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 cursor-pointer text-sm text-slate-500 dark:text-slate-400 transition-all hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex-shrink-0';
// Small icon button (on cards)
const CLS_IBTN_SM = 'w-7 h-7 flex items-center justify-center rounded-lg border-0 bg-white/55 dark:bg-black/20 cursor-pointer text-[13px] transition-all hover:bg-white/90 dark:hover:bg-black/40 hover:scale-110 flex-shrink-0';
// Input
const CLS_INPUT = 'bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2 text-sm font-semibold w-full transition-colors outline-none focus:border-indigo-400 placeholder:text-slate-400';
// Label text
const CLS_LABEL = 'text-[11px] font-black text-slate-400 uppercase tracking-wide mb-1.5 block';
// Card
const CLS_CARD = 'rounded-2xl p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl overflow-hidden';

const hasPass = (note) => !!(note?.password || note?.has_password);

const getStorageUrl = (filePath) => {
  if (!filePath) return '';
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const baseOrigin = apiUrl.replace(/\/api$/, '');
  return `${baseOrigin}/storage/${filePath}`;
};

const normalizeNote = (n) => {
  if (!n) return n;

  let attachments = [];
  if (Array.isArray(n.attachments)) {
    attachments = n.attachments.map(a => ({
      id: a.id,
      server_id: a.id,
      name: a.file_name || a.name,
      type: a.file_type || a.type,
      data: a.file_path ? getStorageUrl(a.file_path) : a.data,
      size: a.file_size || a.size
    }));
  }

  const shareList = (n.shareList || n.shares || []).map(s => ({
    id: s.id,
    shared_with: s.shared_with,
    role: s.role,
    email: s.email || s.sharedUser?.email || '',
    display_name: s.display_name || s.sharedUser?.display_name || ''
  }));

  return {
    ...n,
    id: n.id,
    server_id: n.id,
    isPinned: n.is_pinned !== undefined ? !!n.is_pinned : !!n.isPinned,
    fontFamily: n.font_family || n.fontFamily,
    fontSize: n.font_size || n.fontSize,
    textColor: n.text_color || n.textColor || '',
    is_shared: n.share_id ? true : (n.is_shared !== undefined ? !!n.is_shared : false),
    my_role: n.role || n.my_role || 'owner',
    createdAt: n.created_at || n.createdAt,
    updatedAt: n.updated_at || n.updatedAt,
    pinnedAt: n.pinned_at || n.pinnedAt,
    attachments,
    shareList
  };
};

const normalizeNotes = (notesArray) => {
  if (!Array.isArray(notesArray)) return [];
  return notesArray.map(normalizeNote);
};

//password mođal, dùng chung cho đặt mật khẩu mới và nhập mật khẩu cũ để mở note
//password mođal, dùng chung cho đặt mật khẩu mới và nhập mật khẩu cũ để mở note
const PasswordModal = ({ mode, onSubmit, onCancel, error, isLoading }) => {
  const [pass, setPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [currentPass, setCurrentPass] = useState('');

  const getTitle = () => {
    if (mode === 'verify') return 'Nhập mật khẩu';
    if (mode === 'change') return 'Đổi mật khẩu';
    if (mode === 'remove') return 'Xác nhận mật khẩu';
    return 'Đặt mật khẩu';
  };

  const handleSubmit = () => {
    if (isLoading) return;
    if (mode === 'set') {
      if (pass !== confirmPass) { onCancel('Mật khẩu không khớp!'); return; }
      if (!pass) { onCancel('Mật khẩu không được để trống!'); return; }
      onSubmit(pass);
    } else if (mode === 'change') {
      if (pass !== confirmPass) { onCancel('Mật khẩu mới không khớp!'); return; }
      if (!pass) { onCancel('Mật khẩu không được để trống!'); return; }
      onSubmit({ currentPass, newPass: pass });
    } else if (mode === 'remove') {
      onSubmit(currentPass);
    } else {
      onSubmit(pass);
    }
  };

  return (
    <div className={CLS_OVERLAY} onClick={isLoading ? null : onCancel}>
      <div className={`${CLS_BOX} max-w-sm`} onClick={e => e.stopPropagation()}>
        <div className="text-center mb-5">
          <div className="text-5xl mb-2">🔒</div>
          <h3 className="text-lg font-black m-0">{getTitle()}</h3>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'set' ? 'Bảo vệ note của bạn' :
              mode === 'verify' ? 'Note này được bảo vệ' :
                mode === 'change' ? 'Nhập mật khẩu cũ và mật khẩu mới 2 lần' :
                  'Nhập mật khẩu hiện tại để xác nhận'}
          </p>
        </div>
        {error && (
          <div className="bg-red-50 text-red-600 rounded-xl px-4 py-2.5 font-extrabold text-xs text-center mb-3">
            {error}
          </div>
        )}
        {(mode === 'change' || mode === 'remove') && (
          <input
            type="password"
            placeholder="Mật khẩu hiện tại..."
            value={currentPass}
            disabled={isLoading}
            onChange={e => setCurrentPass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
            className={`${CLS_INPUT} text-center font-black text-xl tracking-[4px] mb-3`}
          />
        )}
        {(mode === 'set' || mode === 'change') && (
          <>
            <input
              type="password"
              placeholder={mode === 'change' ? 'Mật khẩu mới...' : 'Mật khẩu mới...'}
              value={pass}
              disabled={isLoading}
              onChange={e => setPass(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className={`${CLS_INPUT} text-center font-black text-xl tracking-[4px] mb-3`}
            />
            <input
              type="password"
              placeholder="Nhập lại mật khẩu..."
              value={confirmPass}
              disabled={isLoading}
              onChange={e => setConfirmPass(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              autoFocus={mode === 'set' || mode === 'change'}
              className={`${CLS_INPUT} text-center font-black text-xl tracking-[4px] mb-3`}
            />
          </>
        )}
        {mode === 'verify' && (
          <input
            type="password"
            placeholder="Mật khẩu..."
            value={pass}
            disabled={isLoading}
            onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSubmit(pass)}
            autoFocus
            className={`${CLS_INPUT} text-center font-black text-xl tracking-[4px] mb-3`}
          />
        )}
        <div className="flex gap-2.5">
          <button onClick={onCancel} disabled={isLoading} className={`${CLS_BTN_SEC} flex-1`}>Hủy</button>
          <button onClick={handleSubmit} disabled={isLoading} className={`${CLS_BTN_PRI} flex-1`}>
            {isLoading ? 'Đang xử lý... ⏳' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
};
//lock menu modal - hiển thị khi note đã mở khóa, cho phép đổi mật khẩu hoặc tắt khóa
const LockMenuModal = ({ note, onClose, onChangePassword, onRemovePassword }) => {
  return (
    <div className={CLS_OVERLAY} onClick={onClose}>
      <div className={`${CLS_BOX} max-w-sm`} onClick={e => e.stopPropagation()}>
        <div className="text-center mb-5">
          <div className="text-5xl mb-2">🔓</div>
          <h3 className="text-lg font-black m-0">Quản lý khóa</h3>
          <p className="text-xs text-slate-400 mt-1">Note đang được mở khóa</p>
        </div>
        <div className="flex flex-col gap-2.5">
          <button onClick={onChangePassword} className={`${CLS_BTN_SEC} w-full py-3`}>
            🔐 Đổi mật khẩu
          </button>
          <button onClick={onRemovePassword} className="w-full py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 font-extrabold text-sm cursor-pointer hover:bg-red-100 transition-colors">
            🔓 Tắt khóa (nhập lại mật khẩu để xác nhận)
          </button>
        </div>
        <button onClick={onClose} className={`${CLS_BTN_SEC} w-full mt-3`}>Đóng</button>
      </div>
    </div>
  );
};
//share modal, chia sẻ note với người khác qua email, thiết lập quyền xem/sửa và chế độ hiển thị của note khi chia sẻ
const ShareModal = ({ note, onClose, onSave, error }) => {
  // Chặn note bị khóa mật khẩu
  if (hasPass(note)) {
    return (
      <div className={CLS_OVERLAY} onClick={onClose}>
        <div className={`${CLS_BOX} max-w-sm`} onClick={e => e.stopPropagation()}>
          <div className="text-center mb-5">
            <div className="text-5xl mb-2">🔒</div>
            <h3 className="text-lg font-black m-0">Không thể chia sẻ</h3>
            <p className="text-sm text-slate-400 mt-2">Note có mật khẩu không thể chia sẻ. Hãy xóa mật khẩu trước.</p>
          </div>
          <button onClick={onClose} className={`${CLS_BTN_SEC} w-full`}>Đóng</button>
        </div>
      </div>
    );
  }

  const [shareList, setShareList] = useState(note.shareList || []);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [visibility, setVisibility] = useState(note.visibility || 'private');
  const [copied, setCopied] = useState(false);
  const [validating, setValidating] = useState(false);
  const [localError, setLocalError] = useState('');

  const publicLink = `${window.location.origin}/shared/${note.server_id || note.id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(publicLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const addShare = async () => {
    const e2 = email.trim().toLowerCase();
    if (!e2) return;
    if (!/\S+@\S+\.\S+/.test(e2)) {
      setLocalError('Email không hợp lệ!');
      return;
    }
    if (shareList.find(s => s.email === e2)) {
      setLocalError('Email này đã được thêm vào danh sách!');
      return;
    }

    setValidating(true);
    setLocalError('');
    try {
      // Nếu là note nháp chưa lưu database (chưa có server_id)
      if (!note.server_id) {
        setLocalError('Hãy lưu ghi chú này trước khi chia sẻ.');
        setValidating(false);
        return;
      }

      const res = await apiCall('/shares/validate', {
        method: 'POST',
        body: JSON.stringify({ note_id: note.server_id, email: e2 })
      });

      if (res && res.error) {
        setLocalError(res.error);
      } else {
        setShareList([...shareList, { email: e2, role, status: 'pending' }]);
        setEmail('');
      }
    } catch (err) {
      setLocalError(err.message || 'Lỗi khi kiểm tra email.');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className={CLS_OVERLAY} onClick={onClose}>
      <div className={CLS_BOX} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="m-0 font-black">🔗 Chia sẻ note</h3>
          <button onClick={onClose} className={CLS_ICON_BTN}>✕</button>
        </div>

        {/* 2 nút chế độ */}
        <div className="mb-4">
          <span className={CLS_LABEL}>Chế độ hiển thị</span>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: 'private', icon: '🔒', label: 'Riêng tư', desc: 'Chia sẻ qua email' },
              { v: 'public', icon: '🌍', label: 'Công khai', desc: 'Ai có link đều xem được' },
            ].map(o => (
              <button key={o.v} type="button" onClick={() => setVisibility(o.v)}
                className={`p-3 rounded-xl border-2 text-center cursor-pointer transition-all font-[inherit] ${visibility === o.v ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'border-slate-200 dark:border-slate-600 bg-transparent hover:border-indigo-300'}`}>
                <div className="text-2xl mb-1">{o.icon}</div>
                <div className="text-[12px] font-black">{o.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{o.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Khi chọn Công khai: hiện link */}
        {visibility === 'public' && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
            <div className="text-xs font-black text-green-700 dark:text-green-300 mb-2">🌍 Link công khai</div>
            <div className="flex gap-2 items-center">
              <div className="flex-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-2 text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate">
                {publicLink}
              </div>
              <button onClick={copyLink}
                className={`px-3 py-2 rounded-lg border-0 cursor-pointer text-xs font-black font-[inherit] transition-colors flex-shrink-0 ${copied ? 'bg-green-500 text-white' : 'bg-indigo-500 text-white hover:bg-indigo-600'}`}>
                {copied ? '✅ Đã copy' : '📋 Copy'}
              </button>
            </div>
            <p className="text-[10px] text-green-600 dark:text-green-400 mt-2 font-semibold">
              ⚠️ Bất kỳ ai có link này đều có thể xem note của bạn
            </p>
          </div>
        )}

        {/* Khi chọn Riêng tư: hiện form email */}
        {visibility === 'private' && (
          <div className="mb-4">
            <span className={CLS_LABEL}>Chia sẻ qua email</span>
            <div className="flex gap-2 mb-2">
              <input type="email" placeholder="Email..." value={email}
                disabled={validating}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addShare()}
                className={`${CLS_INPUT} flex-1`} />
              <select value={role} onChange={e => setRole(e.target.value)}
                disabled={validating}
                className={`${CLS_INPUT} w-24 text-xs max-w-24 bg-white dark:bg-slate-700 cursor-pointer`}>
                <option value="viewer">👁️ Xem</option>
                <option value="editor">✏️ Sửa</option>
              </select>
              <button onClick={addShare} disabled={validating} className={`${CLS_BTN_PRI} px-3.5 min-w-[42px]`}>
                {validating ? '⏳' : '+'}
              </button>
            </div>
            {localError && (
              <div className="mb-3.5 p-2.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900/50 text-xs font-bold">
                ⚠️ {localError}
              </div>
            )}
            <div className="max-h-40 overflow-y-auto flex flex-col gap-1.5 pr-1">
              {shareList.map(s => (
                <div key={s.email} className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 dark:bg-slate-700 rounded-xl">
                  <div className="w-7 h-7 shrink-0 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center font-black text-xs text-indigo-600 dark:text-indigo-300">
                    {s.email[0].toUpperCase()}
                  </div>
                  <span className="flex-1 min-w-0 text-[13px] font-bold truncate">{s.email}</span>
                  <select value={s.role}
                    onChange={e => setShareList(shareList.map(x => x.email === s.email ? { ...x, role: e.target.value } : x))}
                    className="shrink-0 text-[11px] font-extrabold border-0 bg-transparent text-slate-700 dark:text-slate-300 cursor-pointer focus:ring-0 outline-none">
                    <option value="viewer">👁️ Xem</option>
                    <option value="editor">✏️ Sửa</option>
                  </select>
                  <button onClick={() => setShareList(shareList.filter(x => x.email !== s.email))}
                    className="w-5 h-5 shrink-0 flex items-center justify-center rounded-md bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 cursor-pointer font-black text-[10px] transition-colors hover:bg-red-200">
                    ✕
                  </button>
                </div>
              ))}
              {shareList.length === 0 && (
                <div className="text-center text-slate-400 text-[13px] py-2.5">Chưa chia sẻ với ai</div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <div className="text-xs font-extrabold text-red-600 dark:text-red-400">⚠️ {error}</div>
          </div>
        )}

        <button onClick={() => onSave({ shareList: visibility === 'private' ? shareList : [], visibility })}
          className={`${CLS_BTN_PRI} w-full py-3`}>
          💾 Lưu cài đặt chia sẻ
        </button>
      </div>
    </div>
  );
};
//modal xem note với đầy đủ thông tin, nội dung, tệp đính kèm và chi tiết chia sẻ, có nút sửa và đóng
const ViewNoteModal = ({ note, onClose, onEdit, onRevokeShare }) => (
  <div className={CLS_OVERLAY} onClick={onClose}>
    <div
      className="rounded-[22px] p-4 sm:p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col border border-black/10 mx-2 sm:mx-0"
      style={{ backgroundColor: note.color || '#fef9c3' }}
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4 pb-3.5 border-b border-black/10">
        <div className="flex-1 pr-3">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {note.isPinned && <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">📌 Đã ghim</span>}
            {hasPass(note) && <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">🔒 Có mật khẩu</span>}
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
          {!(note.is_shared && note.my_role === 'viewer') && (
            <button onClick={onEdit} className={`${CLS_BTN_SEC} text-xs py-1.5 px-3.5`}>✏️ Sửa</button>
          )}
          <button onClick={onClose} className={CLS_ICON_BTN}>✕</button>
        </div>
      </div>

      {/* Nội dung */}
      <div className="flex-1 overflow-y-auto">
        <div
          className="rich-text-content leading-relaxed"
          style={{
            fontFamily: note.fontFamily || 'Nunito',
            fontSize: `${note.fontSize || 14}px`,
            color: note.textColor || undefined
          }}
          dangerouslySetInnerHTML={{ __html: note.content || '<p style="color:#9ca3af;font-style:italic">Chưa có nội dung</p>' }}
        />

        {/* Đính kèm */}
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

        {/* Chi tiết chia sẻ */}
        {(note.shareList?.length > 0 || note.visibility !== 'private') && (
          <div className="mt-4 pt-3.5 border-t border-black/10">
            <span className={CLS_LABEL}>🔗 Chi tiết chia sẻ</span>
            {note.visibility === 'public' && (
              <div className="flex items-center gap-2 px-3 py-2 bg-white/60 rounded-xl mb-2 text-sm font-bold text-slate-700">
                🌍 Công khai với mọi người
              </div>
            )}
            {(note.shareList || []).map(s => (
              <div key={s.email} className="flex items-center gap-2.5 px-3 py-2 bg-white/60 rounded-xl mb-1.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center font-black text-sm text-indigo-600 flex-shrink-0">
                  {s.email[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-bold text-slate-800">{s.email}</div>
                  <div className="text-[11px] text-black/45 font-semibold">
                    {s.role === 'editor' ? '✏️ Có thể chỉnh sửa' : '👁️ Chỉ xem'}
                  </div>
                </div>
                <button onClick={() => onRevokeShare(note.id, s.email)}
                  className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-red-100 border-0 text-red-600 cursor-pointer font-[inherit]">
                  Xóa quyền
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

// Modal gán nhãn cho note, hiển thị danh sách nhãn có sẵn và cho phép chọn nhiều nhãn để gán vào note hiện tại
const LabelManagerModal = ({ allLabels, noteLabels, onClose, onSave, onManageGlobal }) => {
  const [selected, setSelected] = useState(new Set((noteLabels || []).map(l => l.id)));
  // giao diện modal hiển thị danh sách nhãn có sẵn, gán nhãn đã chọn vào note hiện tại, lưu lại nhãn đã chọn và quản lý nhãn toàn cục
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

// Modal quản lý nhãn toàn cục (thêm/sửa/xóa nhãn)
const LabelEditor = ({ labels, onClose, onSave, isSaving }) => {
  const [list, setList] = useState(labels.map(l => ({ ...l })));
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(LABEL_COLORS[0]);

  const addLabel = () => {
    const n = newName.trim(); if (!n) return;
    setList([...list, { id: Date.now(), name: n, color: newColor }]); setNewName('');
  };
  // giao diện quản lý nhãn toàn cục, cho phép thêm/sửa/xóa nhãn và lưu lại danh sách nhãn mới
  return (
    <div className={CLS_OVERLAY} onClick={!isSaving ? onClose : undefined}>
      <div className={`${CLS_BOX} max-w-sm`} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="m-0 font-black">⚙️ Quản lý nhãn</h3>
          {!isSaving && <button onClick={onClose} className={CLS_ICON_BTN}>✕</button>}
        </div>
        <div className="max-h-56 overflow-y-auto mb-3 flex flex-col gap-1.5">
          {list.map(lb => (
            <div key={lb.id} className="flex items-center gap-2">
              <input type="color" value={lb.color} disabled={isSaving}
                onChange={e => setList(list.map(l => l.id === lb.id ? { ...l, color: e.target.value } : l))}
                className="w-8 h-8 rounded-lg border-0 p-0.5 cursor-pointer bg-none disabled:opacity-50" />
              <input value={lb.name} disabled={isSaving}
                onChange={e => setList(list.map(l => l.id === lb.id ? { ...l, name: e.target.value } : l))}
                className={`${CLS_INPUT} flex-1 disabled:opacity-50`} />
              <button onClick={() => setList(list.filter(l => l.id !== lb.id))} disabled={isSaving}
                className="w-7 h-7 rounded-lg bg-red-100 border-0 text-red-600 cursor-pointer font-black font-[inherit] disabled:opacity-50">✕</button>
            </div>
          ))}
          {list.length === 0 && <div className="text-center text-slate-400 text-sm">Chưa có nhãn nào</div>}
        </div>
        <div className="flex gap-2 mb-3.5 p-2.5 bg-slate-50 dark:bg-slate-700 rounded-xl">
          <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} disabled={isSaving}
            className="w-8 h-8 rounded-lg border-0 p-0.5 cursor-pointer bg-none disabled:opacity-50" />
          <input placeholder="Tên nhãn mới..." value={newName} disabled={isSaving}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addLabel()}
            className={`${CLS_INPUT} flex-1 disabled:opacity-50`} />
          <button onClick={addLabel} disabled={isSaving} className={`${CLS_BTN_PRI} px-3 disabled:opacity-50`}>+ Thêm</button>
        </div>
        <button onClick={() => onSave(list)} disabled={isSaving} className={`${CLS_BTN_PRI} w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed`}>
          {isSaving ? <><span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span> Đang lưu...</> : '💾 Lưu nhãn'}
        </button>
      </div>
    </div>
  );
};


//xác nhận xóa note
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

//Phần giao diện chính
const Home = () => {
  // các biến trạng thái
  const navigate = useNavigate();
  const [theme, setTheme] = useTheme();

  const currentUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
  const displayName = localStorage.getItem('displayName') || (currentUser ? currentUser.split('@')[0] : 'Khách');
  const avatar = localStorage.getItem('avatar') || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix';

  const [notes, setNotes] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeView, setActiveView] = useState('calendar');
  const [showModal, setShowModal] = useState(false);
  const [selectedDayNotes, setSelectedDayNotes] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedFilterLabels, setSelectedFilterLabels] = useState([]);
  const [isFlipping, setIsFlipping] = useState(false);

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
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteAllConfirmPhrase, setDeleteAllConfirmPhrase] = useState('');
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deleteAllError, setDeleteAllError] = useState('');
  const [sharedSubTab, setSharedSubTab] = useState('by-me');
  const [unlockedNotes, setUnlockedNotes] = useState(() => new Set());
  const [lockMenu, setLockMenu] = useState(null);
  const [sharedWithMe, setSharedWithMe] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [shareError, setShareError] = useState('');
  const [lastPollTime, setLastPollTime] = useState(() => new Date().toISOString());
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingLabels, setIsSavingLabels] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // '' | 'saving' | 'saved' | 'offline'
  const [isPasswordSubmitLoading, setIsPasswordSubmitLoading] = useState(false);

  const [prefs, setPrefs] = useState(() =>
    JSON.parse(localStorage.getItem('userPrefs') || JSON.stringify({ fontSize: 14, fontFamily: 'Nunito', defaultColor: '#fef08a' })));
  const [settings, setSettings] = useState(() =>
    JSON.parse(localStorage.getItem('appSettings') || JSON.stringify({ showVietnameseHolidays: true, showInternationalHolidays: true, showLunarHolidays: true, showTet: true })));

  const editorRef = useRef(null);
  const autoSaveTimer = useRef(null);

  const defaultNote = {
    id: null, title: '', content: '', color: prefs.defaultColor, isPinned: false,
    password: null, shareList: [], visibility: 'private', fontFamily: prefs.fontFamily,
    fontSize: prefs.fontSize, textColor: '', attachments: [], labels: [], createdAt: null, updatedAt: null, pinnedAt: null,
  };
  const [formData, setFormData] = useState(defaultNote);
  const activeNoteIdRef = useRef(null);
  const activeServerIdRef = useRef(null);

  // Ref to track latest formData to prevent stale state closures
  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Ref to track whether modal is open to prevent post-close state pollution
  const isModalOpenRef = useRef(false);
  useEffect(() => {
    isModalOpenRef.current = showModal;
  }, [showModal]);

  // Serial save queue concurrency locks
  const isSavingRef = useRef(false);
  const pendingSaveRef = useRef(false);

  const [editorFont, setEditorFont] = useState(prefs.fontFamily);
  const [editorColor, setEditorColor] = useState('');
  const [isActive, setIsActive] = useState((localStorage.getItem('isActive') || sessionStorage.getItem('isActive')) === '1');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Hàm đồng bộ dữ liệu ngoại tuyến
  const syncOfflineData = async () => {
    if (!navigator.onLine) return;

    try {
      const pendingSyncs = await getPendingSyncs();
      if (pendingSyncs.length === 0) return;

      if (window.toast) window.toast('🔄 Phát hiện kết nối internet - Bắt đầu đồng bộ dữ liệu ngoại tuyến...', 'info');

      for (const task of pendingSyncs) {
        const payload = {
          title: task.data.title,
          content: task.data.content,
          color: task.data.color,
          is_pinned: task.data.isPinned,
          font_family: task.data.fontFamily,
          font_size: task.data.fontSize,
          text_color: task.data.textColor,
          visibility: task.data.visibility,
          label_ids: (task.data.labels || []).map(l => l.id).filter(id => typeof id === 'number' && id < 1e12),
          password: task.data.password,
        };

        try {
          if (task.server_id) {
            // Cập nhật trên server
            await apiCall(`/notes/${task.server_id}`, {
              method: 'PUT',
              body: JSON.stringify(payload)
            });
          } else {
            // Tạo mới trên server
            const res = await apiCall('/notes', {
              method: 'POST',
              body: JSON.stringify({
                ...payload,
                created_at: task.data.createdAt,
              })
            });
            if (res && res.note) {
              const updatedLocal = { ...task.data, id: res.note.id, server_id: res.note.id, is_offline_modified: false };
              await saveLocalNote(updatedLocal);
              if (task.note_id && task.note_id !== res.note.id) {
                await deleteLocalNote(task.note_id);
              }
              if (activeNoteIdRef.current === task.note_id) {
                activeNoteIdRef.current = res.note.id;
                activeServerIdRef.current = res.note.id;
                setFormData(prev => ({
                  ...prev,
                  id: res.note.id,
                  server_id: res.note.id
                }));
              }
            }
          }
          await removePendingSync(task.sync_id);
        } catch (err) {
          console.error('Lỗi khi đồng bộ note ngoại tuyến:', err);
        }
      }

      if (window.toast) window.toast('✅ Đồng bộ dữ liệu ngoại tuyến thành công!', 'success');
      setRefreshTrigger(prev => prev + 1);
    } catch (e) {
      console.error('Lỗi đồng bộ dữ liệu:', e);
    }
  };

  // Hiệu ứng khởi tạo - LUÔN fetch từ server (có dự phòng cache IndexedDB khi offline)
  useEffect(() => {
    if (!currentUser) return;

    const fetchNotesAndLabels = async () => {
      if (!navigator.onLine) {
        // TẢI TỪ CƠ SỞ DỮ LIỆU CỤC BỘ INDEXEDDB NẾU OFFLINE!
        try {
          const localNotes = await getLocalNotes();
          const localLabels = await getLocalLabels();

          setNotes(localNotes);
          setAllLabels(localLabels);

          if (window.toast) window.toast('📶 Đang hiển thị dữ liệu ngoại tuyến (Offline Mode)', 'info');
        } catch (e) {
          console.error('Lỗi tải dữ liệu local:', e);
        }
        return;
      }

      // Kiểm tra trạng thái kích hoạt tài khoản
      try {
        const userRes = await apiCall('/users/me');
        if (userRes && userRes.user) {
          const activeStatus = userRes.user.is_active ? '1' : '0';
          setIsActive(userRes.user.is_active);
          if (localStorage.getItem('token')) localStorage.setItem('isActive', activeStatus);
          else if (sessionStorage.getItem('token')) sessionStorage.setItem('isActive', activeStatus);
        }
      } catch (err) {
        console.error('Lỗi check active:', err);
      }

      try {
        const data = await apiCall('/notes?limit=100');
        if (data.notes && data.notes.length > 0) {
          const validNotes = data.notes.filter(n => n.id);
          const normalized = normalizeNotes(validNotes);
          setNotes(normalized);
          localStorage.setItem(`notes_${currentUser}`, JSON.stringify(normalized));

          // Lưu dự phòng cục bộ vào IndexedDB để dùng offline
          await saveLocalNotesBulk(normalized);
        } else {
          setNotes([]);
          localStorage.setItem(`notes_${currentUser}`, JSON.stringify([]));
          await saveLocalNotesBulk([]);
        }
      } catch (err) {
        console.error('Lỗi lấy notes, thử tải từ local:', err);
        const localNotes = await getLocalNotes();
        setNotes(localNotes);
      }

      try {
        const labelsData = await apiCall('/labels');
        if (labelsData.labels) {
          setAllLabels(labelsData.labels);
          localStorage.setItem('allLabels', JSON.stringify(labelsData.labels));

          // Lưu dự phòng nhãn dán vào IndexedDB
          await saveLocalLabelsBulk(labelsData.labels);
        }
      } catch (err) {
        console.error('Lỗi lấy labels, thử tải từ local:', err);
        const localLabels = await getLocalLabels();
        setAllLabels(localLabels);
      }
    };

    fetchNotesAndLabels();
  }, [currentUser, refreshTrigger]);

  // Lắng nghe mạng để tự động đồng bộ khi kết nối lại
  useEffect(() => {
    const handleOnline = () => {
      syncOfflineData();
    };
    const handleOffline = () => {
      if (window.toast) window.toast('📶 Đang ngoại tuyến. Dữ liệu mới sẽ được lưu trữ cục bộ.', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine && currentUser) {
      syncOfflineData();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentUser]);

  useEffect(() => { localStorage.setItem('appSettings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('userPrefs', JSON.stringify(prefs)); }, [prefs]);
  useEffect(() => { localStorage.setItem('allLabels', JSON.stringify(allLabels)); }, [allLabels]);
  useEffect(() => {
    const fetchSharedNotes = async () => {
      try {
        const data = await apiCall('/shares');
        const normalized = normalizeNotes(data.notes || []);
        setSharedWithMe(normalized);
        const unseen = normalized.filter(n => !n.is_seen);
        setNotifications(unseen);
      } catch (err) { console.error('Lỗi lấy shared notes:', err); }
    };
    if (currentUser) fetchSharedNotes();
  }, [currentUser, refreshTrigger]);

  // Polling mỗi 10s để kiểm tra note mới được chia sẻ
  useEffect(() => {
    if (!currentUser) return;
    const pollInterval = setInterval(async () => {
      try {
        const data = await apiCall(`/shares/poll?since=${encodeURIComponent(lastPollTime)}`);

        let needsRefresh = false;
        if (data.changed_shared && data.changed_shared.length > 0) {
          needsRefresh = true;
          const newNotes = data.changed_shared.filter(n => !n.is_seen);
          if (newNotes.length > 0) {
            setNotifications(prev => [...newNotes, ...prev]);
            // Toast notification
            if (window.toast) {
              window.toast(`📥 Có ${newNotes.length} note có cập nhật hoặc được chia sẻ mới!`, 'info');
            }
          }
        }

        // Nếu số lượng share thay đổi (ví dụ: bị xóa / thu hồi quyền)
        if (data.total_count !== undefined && data.total_count !== sharedWithMe.length) {
          needsRefresh = true;
        }

        if (needsRefresh) {
          setRefreshTrigger(prev => prev + 1);
        }
        setLastPollTime(data.server_time || new Date().toISOString());
      } catch (err) { /* ignore polling errors */ }
    }, 10000);
    return () => clearInterval(pollInterval);
  }, [currentUser, lastPollTime]);

  // Immediate refresh khi quay lại tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && currentUser) {
        apiCall('/shares').then(data => {
          if (data.notes) {
            const normalized = normalizeNotes(data.notes);
            setSharedWithMe(normalized);
            setNotifications(normalized.filter(n => !n.is_seen));
          }
        }).catch(() => { });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentUser]);

  useEffect(() => {
    const openNoteId = sessionStorage.getItem('openSharedNote');
    if (openNoteId && (notes.length > 0 || sharedWithMe.length > 0)) {
      const n = [...notes, ...sharedWithMe].find(n => (n.id == openNoteId || n.server_id == openNoteId || n.share_id == openNoteId));
      if (n) {
        sessionStorage.removeItem('openSharedNote');
        setActiveView('shared');
        setSharedSubTab('with-me');
        handleViewNote(n);
      }
    }
  }, [notes, sharedWithMe]);

  useEffect(() => {
    if (viewingNote && activeView === 'shared' && sharedSubTab === 'with-me') {
      const stillExists = sharedWithMe.find(n => n.id === viewingNote.id || n.server_id === viewingNote.server_id || n.share_id === viewingNote.share_id);
      if (!stillExists) {
        setViewingNote(null);
        if (window.toast) window.toast('Ghi chú này không còn được chia sẻ với bạn.', 'info');
      }
    }
  }, [sharedWithMe]);

  // Đồng bộ hóa tức thời nội dung của note con khi note cha cập nhật (qua polling / refresh)
  useEffect(() => {
    if (viewingNote && viewingNote.is_shared) {
      const updated = sharedWithMe.find(n => n.id === viewingNote.id || n.server_id === viewingNote.server_id || n.share_id === viewingNote.share_id);
      if (updated) {
        if (updated.title !== viewingNote.title || updated.content !== viewingNote.content || updated.color !== viewingNote.color || updated.fontFamily !== viewingNote.fontFamily || updated.fontSize !== viewingNote.fontSize || updated.textColor !== viewingNote.textColor) {
          setViewingNote(updated);
        }
      }
    }

    if (showModal && formData.is_shared) {
      const updated = sharedWithMe.find(n => n.id === formData.id || n.server_id === formData.server_id || n.share_id === formData.share_id);
      if (!updated) {
        setShowModal(false);
        setFormData(defaultNote);
        if (editorRef.current) editorRef.current.innerHTML = '';
        activeNoteIdRef.current = null;
        activeServerIdRef.current = null;
        if (window.toast) window.toast('Ghi chú này không còn được chia sẻ với bạn.', 'info');
      } else {
        if (updated.title !== formData.title || updated.content !== formData.content || updated.color !== formData.color || updated.fontFamily !== formData.fontFamily || updated.fontSize !== formData.fontSize || updated.textColor !== formData.textColor || updated.role !== formData.role) {
          setFormData(prev => ({ ...prev, ...updated }));
          if (editorRef.current) {
            editorRef.current.innerHTML = updated.content || '';
            editorRef.current.style.fontFamily = updated.fontFamily || prefs.fontFamily;
            editorRef.current.style.fontSize = `${updated.fontSize || 15}px`;
            editorRef.current.style.color = updated.textColor || '';
          }
        }
      }
    }
  }, [sharedWithMe, viewingNote, showModal, formData]);



  //Tìm kiếm với debounce 300ms
  const handleSearchInput = val => {
    setDisplayQuery(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearchQuery(val), 300); // delay 300ms sau khi người dùng ngừng gõ
  };

  const saveNotes = updated => {
    setNotes(updated);
    localStorage.setItem(`notes_${currentUser}`, JSON.stringify(updated));
    saveLocalNotesBulk(updated).catch(e => console.error('Lỗi lưu notes bulk:', e));
  };

  const handleOfflineAutoSave = async () => {
    try {
      const data = formDataRef.current;
      const content = editorRef.current?.innerHTML || '';
      const now = new Date().toISOString();
      const localId = activeNoteIdRef.current || Date.now();
      const currentServerId = activeServerIdRef.current;

      const offlineNote = {
        ...data,
        id: localId,
        server_id: currentServerId,
        content: content || '',
        updatedAt: now,
        createdAt: data.createdAt || now,
        is_offline_modified: true,
      };

      // 1. Save to local IndexedDB notes store
      await saveLocalNote(offlineNote);

      // 2. Save sync task to pendingSyncs
      const syncTask = {
        action: currentServerId ? 'update' : 'create',
        note_id: localId,
        server_id: currentServerId || null,
        data: {
          title: data.title,
          content: content || '',
          color: data.color || '#fef08a',
          isPinned: data.isPinned || false,
          fontFamily: data.fontFamily || prefs.fontFamily,
          fontSize: data.fontSize || prefs.fontSize,
          textColor: data.textColor || '',
          visibility: data.visibility || 'private',
          labels: data.labels || [],
          password: data.password || null,
          createdAt: data.createdAt || now,
        }
      };
      await addPendingSync(syncTask);

      // 3. Update React sidebar list state instantly
      setNotes(prev => {
        const exists = prev.some(n => n.id === localId);
        if (exists) {
          return prev.map(n => n.id === localId ? offlineNote : n);
        } else {
          return [offlineNote, ...prev];
        }
      });

      // 4. Update open modal's formData state only if modal is open
      if (isModalOpenRef.current) {
        activeNoteIdRef.current = localId;
        setFormData(prev => ({
          ...prev,
          id: localId,
          server_id: currentServerId,
        }));
      }

      setSaveStatus('offline');
      setIsSaving(false);
    } catch (e) {
      console.error('Lỗi khi lưu ngoại tuyến:', e);
      setSaveStatus('error');
    }
  };

  const performAutoSave = async () => {
    const data = formDataRef.current;
    if (!data.title?.trim()) return; // Không lưu tiêu đề rỗng
    if (data.is_shared && (data.my_role === 'viewer' || data.role === 'viewer')) {
      return;
    }

    if (isSavingRef.current) {
      pendingSaveRef.current = true;
      return;
    }

    isSavingRef.current = true;
    setSaveStatus('saving');
    setIsSaving(true);

    try {
      const content = editorRef.current?.innerHTML || '';
      const now = new Date().toISOString();
      const validLabelIds = (data.labels || [])
        .map(l => l.id)
        .filter(id => typeof id === 'number' && id < 1e12);

      const payload = {
        title: data.title,
        content: content || '',
        color: data.color || '#fef08a',
        is_pinned: data.isPinned || false,
        font_family: data.fontFamily || prefs.fontFamily,
        font_size: data.fontSize || prefs.fontSize,
        text_color: data.textColor || '',
        visibility: data.visibility || 'private',
        label_ids: validLabelIds,
        password: data.password || null,
      };

      const currentServerId = activeServerIdRef.current;

      if (navigator.onLine) {
        try {
          let savedNote;
          if (currentServerId) {
            // Update
            const res = await apiCall(`/notes/${currentServerId}`, {
              method: 'PUT',
              body: JSON.stringify(payload)
            });
            savedNote = res.note;
          } else {
            // Create
            const res = await apiCall('/notes', {
              method: 'POST',
              body: JSON.stringify({
                ...payload,
                created_at: data.createdAt || now,
              })
            });
            savedNote = res.note;
          }

          if (savedNote) {
            if (data.createdAt) {
              savedNote.created_at = data.createdAt;
            }

            // Upload local attachments if any local files exist
            if (data.attachments && data.attachments.length > 0) {
              const localAttachments = data.attachments.filter(a => a.data && a.data.startsWith('data:'));
              for (const att of localAttachments) {
                try {
                  const response = await fetch(att.data);
                  const blob = await response.blob();
                  const file = new File([blob], att.name, { type: att.type });
                  const formData2 = new FormData();
                  formData2.append('note_id', savedNote.id);
                  formData2.append('files[]', file);
                  await apiCall('/attachments', { method: 'POST', body: formData2 });
                } catch (e) {
                  console.error('Lỗi upload attachment:', e);
                }
              }
            }

            const normalized = normalizeNote(savedNote);

            if (isModalOpenRef.current) {
              activeNoteIdRef.current = normalized.id;
              activeServerIdRef.current = normalized.server_id;
            }

            // Save copy to local IndexedDB
            await saveLocalNote(normalized);

            // Update React states
            setNotes(prev => {
              const targetLocalId = isModalOpenRef.current ? activeNoteIdRef.current : normalized.id;
              const exists = prev.some(n => n.id === normalized.id || (normalized.server_id && n.server_id === normalized.server_id) || (targetLocalId && n.id === targetLocalId));
              if (exists) {
                return prev.map(n => (n.id === normalized.id || (normalized.server_id && n.server_id === normalized.server_id) || (targetLocalId && n.id === targetLocalId)) ? normalized : n);
              } else {
                return [normalized, ...prev];
              }
            });

            // Update open modal's formData state only if modal is open
            if (isModalOpenRef.current) {
              setFormData(prev => ({
                ...prev,
                id: normalized.id,
                server_id: normalized.server_id,
                attachments: normalized.attachments || prev.attachments,
              }));
            }

            setSaveStatus('saved');
            setTimeout(() => setSaveStatus(prev => prev === 'saved' ? '' : prev), 2000);
          }
        } catch (err) {
          console.error('Đang trực tuyến nhưng lưu server thất bại, chuyển sang lưu local offline:', err);
          await handleOfflineAutoSave();
        }
      } else {
        // Offline mode
        await handleOfflineAutoSave();
      }
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        performAutoSave();
      }
    }
  };

  const triggerAutoSave = useCallback(() => {
    setSaveStatus('saving');
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      performAutoSave();
    }, 800); // 800ms debounce
  }, [prefs]);

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

  const getFilteredNotes = useCallback(() => {
    let result = notes;
    if (selectedFilterLabels.length > 0) {
      result = result.filter(n =>
        selectedFilterLabels.every(labelId => (n.labels || []).some(lb => lb.id === labelId))
      );
    } else if (activeFilter === 'pinned') {
      result = result.filter(n => n.isPinned);
    } else if (activeFilter === 'locked') {
      result = result.filter(n => n.password || n.has_password);
    } else if (activeFilter === 'shared') {
      result = result.filter(n => (n.shareList || []).length > 0 || n.visibility !== 'private');
    } else if (activeFilter !== 'all') {
      result = result.filter(n => (n.labels || []).some(lb => lb.id === activeFilter));
    }
    return getSortedNotes(applySearch(result));
  }, [notes, activeFilter, selectedFilterLabels, searchQuery, applySearch, getSortedNotes]);

  const handleLabelFilterToggle = (labelId) => {
    let currentSelected = [...selectedFilterLabels];
    const isSystemFilter = ['all', 'pinned', 'locked', 'shared'].includes(activeFilter);
    if (currentSelected.length === 0 && !isSystemFilter && activeFilter !== 'all') {
      currentSelected = [activeFilter];
    }

    if (currentSelected.includes(labelId)) {
      currentSelected = currentSelected.filter(id => id !== labelId);
    } else {
      currentSelected.push(labelId);
    }

    setSelectedFilterLabels(currentSelected);
    if (currentSelected.length === 1) {
      setActiveFilter(currentSelected[0]);
      setSelectedFilterLabels([]);
    } else if (currentSelected.length === 0) {
      setActiveFilter('all');
    } else {
      setActiveFilter('all');
    }
  };

  const handleSystemFilterClick = (filterValue) => {
    setSelectedFilterLabels([]);
    setActiveFilter(filterValue);
  };

  const handleCancel = () => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    // Tự động lưu phát cuối lập tức nếu có tiêu đề
    const data = formDataRef.current;
    if (data.title?.trim()) {
      performAutoSave();
    }

    setShowModal(false);
    setFormData(defaultNote);
    if (editorRef.current) editorRef.current.innerHTML = '';
    activeNoteIdRef.current = null;
    activeServerIdRef.current = null;
  };

  const handleEditNote = note => {
    const base = note._isRepeat ? notes.find(n => n.id === note._originalId) : note;
    const r = base || note;
    activeNoteIdRef.current = r.id;
    activeServerIdRef.current = r.server_id;
    setFormData({ ...defaultNote, ...r, attachments: r.attachments || [], labels: r.labels || [] });
    setEditorFont(r.fontFamily || prefs.fontFamily); setEditorColor(r.textColor || ''); setShowModal(true);
    setTimeout(() => { if (editorRef.current) editorRef.current.innerHTML = r.content || ''; }, 60);
  };

  const handleViewNote = note => {
    if (hasPass(note) && !unlockedNotes.has(note.id)) {
      setPasswordError('');
      setPasswordModal({ mode: 'verify', noteId: note.id, onSuccess: () => { setUnlockedNotes(prev => new Set([...prev, note.id])); setPasswordModal(null); setViewingNote(note); if (note.share_id) { setNotifications(prev => prev.filter(n => n.share_id !== note.share_id)); apiCall('/shares/mark-as-seen', { method: 'POST', body: JSON.stringify({ share_id: note.share_id }) }).catch(console.error); } } });
    } else {
      setViewingNote(note);
      if (note.share_id && !note.is_seen) {
        setNotifications(prev => prev.filter(n => n.share_id !== note.share_id));
        apiCall('/shares/mark-as-seen', { method: 'POST', body: JSON.stringify({ share_id: note.share_id }) }).catch(console.error);
      }
    }
  };

  const handleDeleteNote = note => setConfirmDelete(note);
  const confirmDeleteNote = async () => {
    if (!confirmDelete) return;
    const noteToDelete = confirmDelete;
    if (!noteToDelete) { setConfirmDelete(null); return; }

    // Xóa từ server nếu đã có ID thực
    const realId = noteToDelete.server_id || noteToDelete.id;
    if (realId && realId < 1000000000000) {
      try {
        await apiCall(`/notes/${realId}`, { method: 'DELETE' });
      } catch (err) {
        console.error('Lỗi xóa note:', err);
      }
    }

    // Xóa theo cả id và server_id
    const updated = notes.filter(n => n.id !== confirmDelete.id && n.server_id !== confirmDelete.id);
    saveNotes(updated);

    // Xóa khỏi danh sách chia sẻ nếu có
    setSharedWithMe(prev => prev.filter(n => n.id !== confirmDelete.id && n.server_id !== confirmDelete.id));

    if (selectedDayNotes) setSelectedDayNotes(prev => ({ ...prev, notes: prev.notes.filter(n => n.id !== confirmDelete.id && n.server_id !== confirmDelete.id) }));
    setConfirmDelete(null);
    setTimeout(() => window.location.reload(), 100);
  };

  const handleDeleteAllNotesConfirm = async () => {
    if (deleteAllConfirmPhrase.trim().toUpperCase() !== 'DELETE ALL') {
      setDeleteAllError('⚠️ Vui lòng nhập đúng chữ "DELETE ALL" để xác nhận.');
      return;
    }
    setIsDeletingAll(true);
    setDeleteAllError('');
    try {
      // 1. Clear local state
      setNotes([]);
      localStorage.removeItem(`notes_${currentUser}`);

      // 2. Clear IndexedDB local notes bulk
      const { saveLocalNotesBulk } = await import('../db');
      await saveLocalNotesBulk([]);

      // 3. Delete all notes on the server if online
      if (navigator.onLine) {
        for (const note of notes) {
          const realId = note.server_id || note.id;
          if (realId && realId < 1000000000000) {
            try {
              await apiCall(`/notes/${realId}`, { method: 'DELETE' });
            } catch (err) {
              console.error('Lỗi khi xóa ghi chú trên server:', err);
            }
          }
        }
      }

      // 4. Close modal and show notification
      setShowDeleteAllModal(false);
      alert('🗑️ Đã xóa toàn bộ ghi chú thành công!');
      setTimeout(() => window.location.reload(), 100);
    } catch (err) {
      console.error(err);
      setDeleteAllError(err.message || '⚠️ Không thể xóa toàn bộ ghi chú. Vui lòng thử lại.');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const togglePin = async id => {
    const note = notes.find(n => n.id === id);
    if (!note?.server_id) {
      saveNotes(notes.map(n => n.id === id ? { ...n, isPinned: !n.isPinned, pinnedAt: !n.isPinned ? new Date().toISOString() : null } : n));
      setTimeout(() => window.location.reload(), 100);
      return;
    }
    try {
      await apiCall('/notes/toggle-pin', {
        method: 'PUT',
        body: JSON.stringify({ note_id: note.server_id })
      });
      saveNotes(notes.map(n => n.id === id ? { ...n, isPinned: !n.isPinned, pinnedAt: !n.isPinned ? new Date().toISOString() : null } : n));
      setTimeout(() => window.location.reload(), 100);
    } catch (err) {
      console.error('Lỗi toggle pin:', err);
    }
  };

  const handleNoteAccess = (note, action) => {
    if (!hasPass(note) || unlockedNotes.has(note.id)) { action(note); return; }
    setPasswordError('');
    setPasswordModal({ mode: 'verify', noteId: note.id, onSuccess: () => { setUnlockedNotes(prev => new Set([...prev, note.id])); setPasswordModal(null); action(note); } });
  };

  const handlePasswordSubmit = async (passOrObj) => {
    if (!passwordModal) return;
    const note = notes.find(n => n.id === passwordModal.noteId);
    const serverId = note?.server_id || note?.id;
    setIsPasswordSubmitLoading(true);
    setPasswordError('');

    try {
      if (passwordModal.mode === 'set' || passwordModal.mode === 'change') {
        const newPassword = passwordModal.mode === 'change' ? passOrObj.newPass : passOrObj;
        if (!newPassword) {
          setPasswordModal(null);
          return;
        }

        if (serverId && serverId < 1000000000000) {
          try {
            if (passwordModal.mode === 'change') {
              await apiCall('/notes/lock', {
                method: 'POST',
                body: JSON.stringify({
                  note_id: serverId,
                  action: 'change',
                  current_password: passOrObj.currentPass,
                  password: newPassword,
                  password_confirm: newPassword
                })
              });
            } else {
              await apiCall('/notes/lock', {
                method: 'POST',
                body: JSON.stringify({
                  note_id: serverId,
                  action: 'set',
                  password: newPassword,
                  password_confirm: newPassword
                })
              });
            }
          } catch (err) {
            setPasswordError(err.message || 'Mật khẩu hiện tại không đúng!');
            return;
          }
        } else {
          if (passwordModal.mode === 'change') {
            if (note && note.password !== passOrObj.currentPass) {
              setPasswordError('Mật khẩu cũ không đúng!');
              return;
            }
          }
        }

        saveNotes(notes.map(n => n.id === passwordModal.noteId ? { ...n, password: newPassword, has_password: true, updatedAt: new Date().toISOString() } : n));
        if (activeNoteIdRef.current === passwordModal.noteId) {
          setFormData(prev => ({ ...prev, password: newPassword, has_password: true }));
        }
        setPasswordModal(null);
        setTimeout(() => window.location.reload(), 100);
        return;
      }

      if (passwordModal.mode === 'remove') {
        if (serverId && serverId < 1000000000000) {
          try {
            await apiCall('/notes/lock', {
              method: 'POST',
              body: JSON.stringify({
                note_id: serverId,
                action: 'remove',
                current_password: passOrObj
              })
            });
          } catch (err) {
            setPasswordError(err.message || 'Mật khẩu không đúng!');
            return;
          }
        } else {
          if (!note || note.password !== passOrObj) {
            setPasswordError('Mật khẩu không đúng!');
            return;
          }
        }
        saveNotes(notes.map(n => n.id === passwordModal.noteId ? { ...n, password: null, has_password: false, updatedAt: new Date().toISOString() } : n));
        if (activeNoteIdRef.current === passwordModal.noteId) {
          setFormData(prev => ({ ...prev, password: null, has_password: false }));
        }
        setUnlockedNotes(prev => { const s = new Set(prev); s.delete(passwordModal.noteId); return s; });
        setPasswordModal(null);
        setTimeout(() => window.location.reload(), 100);
        return;
      }

      // mode === 'verify'
      if (serverId && serverId < 1000000000000) {
        try {
          const res = await apiCall('/notes/lock', {
            method: 'POST',
            body: JSON.stringify({
              note_id: serverId,
              action: 'verify',
              password: passOrObj
            })
          });
          if (res.verified) {
            setPasswordError('');
            passwordModal.onSuccess();
          } else {
            setPasswordError('Mật khẩu không đúng!');
          }
        } catch (err) {
          setPasswordError(err.message || 'Mật khẩu không đúng!');
        }
      } else {
        if (note && note.password === passOrObj) {
          setPasswordError('');
          passwordModal.onSuccess();
        } else {
          setPasswordError('Mật khẩu không đúng!');
        }
      }
    } finally {
      setIsPasswordSubmitLoading(false);
    }
  };

  const handleSaveShare = async (noteId, { shareList, visibility }) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    setShareError('');

    const oldShareList = note.shareList || [];
    const newShareList = shareList || [];

    for (const share of newShareList) {
      if (!oldShareList.find(s => s.email === share.email)) {
        try {
          if (note.server_id) {
            await apiCall('/shares', {
              method: 'POST',
              body: JSON.stringify({ note_id: note.server_id, email: share.email, role: share.role })
            });
          }
        } catch (err) {
          setShareError(err.message || 'Lỗi khi chia sẻ: ' + share.email);
        }
      } else {
        const oldShare = oldShareList.find(s => s.email === share.email);
        if (oldShare && oldShare.role !== share.role) {
          try {
            if (note.server_id) {
              await apiCall('/shares/role', {
                method: 'PUT',
                body: JSON.stringify({ note_id: note.server_id, email: share.email, role: share.role })
              });
            }
          } catch (err) {
            setShareError('Lỗi cập nhật quyền: ' + share.email);
          }
        }
      }
    }

    for (const oldShare of oldShareList) {
      if (!newShareList.find(s => s.email === oldShare.email)) {
        try {
          if (note.server_id) {
            await apiCall('/shares', {
              method: 'DELETE',
              body: JSON.stringify({ note_id: note.server_id, email: oldShare.email })
            });
          }
        } catch (err) {
          console.error('Lỗi xóa share:', err);
        }
      }
    }

    if (note.server_id && note.visibility !== visibility) {
      try {
        await apiCall(`/notes/${note.server_id}`, {
          method: 'PUT',
          body: JSON.stringify({ title: note.title, content: note.content, visibility })
        });
      } catch (err) {
        console.error('Lỗi cập nhật visibility:', err);
      }
    }

    saveNotes(notes.map(n => n.id === noteId ? { ...n, shareList, visibility, updatedAt: new Date().toISOString() } : n));
    setShareModal(null);
  };
  const handleRevokeShare = (noteId, email) => {
    saveNotes(notes.map(n => n.id === noteId ? { ...n, shareList: (n.shareList || []).filter(s => s.email !== email), updatedAt: new Date().toISOString() } : n));
    if (viewingNote?.id === noteId) setViewingNote(prev => ({ ...prev, shareList: (prev.shareList || []).filter(s => s.email !== email) }));
  };
  const handleSaveLabels = async (noteId, selectedIds) => {
    const selectedLabels = allLabels.filter(l => selectedIds.includes(l.id));
    saveNotes(notes.map(n => n.id === noteId ? { ...n, labels: selectedLabels, updatedAt: new Date().toISOString() } : n));
    if (formData.id === noteId) setFormData(prev => ({ ...prev, labels: selectedLabels }));
    setLabelModal(null);

    const note = notes.find(n => n.id === noteId);
    if (note && note.server_id) {
      try {
        const validLabelIds = selectedIds.filter(id => typeof id === 'number' && id < 1e12);
        await apiCall(`/notes/${note.server_id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: note.title,
            content: note.content,
            color: note.color,
            is_pinned: note.isPinned,
            font_family: note.fontFamily,
            font_size: note.fontSize,
            text_color: note.textColor,
            visibility: note.visibility,
            label_ids: validLabelIds,
          })
        });
      } catch (err) {
        console.error('Lỗi khi lưu nhãn dán lên máy chủ:', err);
      }
    }
    setTimeout(() => window.location.reload(), 100);
  };
  const handleSaveGlobalLabels = async newLabels => {
    setIsSavingLabels(true);
    try {
      // 1. Delete labels that were removed
      const deletedIds = allLabels.filter(l => !newLabels.find(nl => nl.id === l.id)).map(l => l.id);
      for (let id of deletedIds) {
        if (typeof id === 'number' && id > 1000000000000) continue;
        try { await apiCall('/labels/' + id, { method: 'DELETE' }); } catch (e) { console.error('Lỗi xóa label', e); }
      }

      // 2. Create or Update labels
      let updatedLabels = [];
      for (let nl of newLabels) {
        const oldLabel = allLabels.find(l => l.id === nl.id);
        if (!oldLabel) {
          // Create
          try {
            const res = await apiCall('/labels', { method: 'POST', body: JSON.stringify({ name: nl.name, color: nl.color }) });
            if (res.label) updatedLabels.push(res.label);
            else updatedLabels.push(nl);
          } catch (e) { console.error('Lỗi tạo label', e); updatedLabels.push(nl); }
        } else if (oldLabel.name !== nl.name || oldLabel.color !== nl.color) {
          // Update
          if (typeof nl.id === 'number' && nl.id > 1000000000000) {
            updatedLabels.push(nl);
          } else {
            try {
              const res = await apiCall('/labels/' + nl.id, { method: 'PUT', body: JSON.stringify({ name: nl.name, color: nl.color }) });
              if (res.label) updatedLabels.push(res.label);
              else updatedLabels.push(nl);
            } catch (e) { console.error('Lỗi cập nhật label', e); updatedLabels.push(nl); }
          }
        } else {
          updatedLabels.push(nl);
        }
      }

      setAllLabels(updatedLabels);
      if (deletedIds.length > 0) saveNotes(notes.map(n => ({ ...n, labels: (n.labels || []).filter(l => !deletedIds.includes(l.id)) })));
      if (window.toast) window.toast('Lưu nhãn thành công!', 'success');
      setTimeout(() => window.location.reload(), 100);
    } catch (e) {
      if (window.toast) window.toast('Lỗi lưu nhãn: ' + e.message, 'error');
    } finally {
      setIsSavingLabels(false);
      setLabelEditor(false);
    }
  };

  const handleFormat = cmd => { document.execCommand(cmd, false, null); editorRef.current?.focus(); };
  const applyFontToEditor = font => { setEditorFont(font); setFormData(prev => ({ ...prev, fontFamily: font })); if (editorRef.current) editorRef.current.style.fontFamily = font; };
  const applyFontSizeToEditor = size => {
    const numericSize = parseInt(size, 10);
    setFormData(prev => ({ ...prev, fontSize: numericSize }));
    if (editorRef.current) {
      editorRef.current.style.fontSize = `${numericSize}px`;
    }
  };
  const applyColorToEditor = color => {
    setEditorColor(color);
    setFormData(prev => ({ ...prev, textColor: color }));
    if (editorRef.current) {
      editorRef.current.style.color = color;
    }
  };
  const handleAttachmentAdd = async e => {
    const files = Array.from(e.target.files); if (!files.length) return;

    // Chỉ upload lên server khi note đã được lưu (có server_id)
    if (formData.server_id) {
      const formData2 = new FormData();
      formData2.append('note_id', formData.server_id);
      files.forEach(f => formData2.append('files[]', f));

      try {
        const data = await apiCall('/attachments', { method: 'POST', body: formData2 });
        if (data.attachments) {
          const newAttachments = data.attachments.map(a => ({
            name: a.file_name,
            type: a.file_type,
            data: getStorageUrl(a.file_path),
            server_id: a.id
          }));
          setFormData(prev => ({ ...prev, attachments: [...(prev.attachments || []), ...newAttachments] }));
        }
      } catch (err) {
        console.error('Lỗi upload attachment:', err);
        alert('Lỗi upload file: ' + err.message);
      }
    } else {
      Promise.all(files.map(f => new Promise(res => { const r = new FileReader(); r.onloadend = () => res({ name: f.name, type: f.type, size: f.size, data: r.result }); r.readAsDataURL(f); })))
        .then(results => setFormData(prev => ({ ...prev, attachments: [...(prev.attachments || []), ...results] })));
    }
    e.target.value = '';
  };

  const navigateMonth = dir => {
    setIsFlipping(true);
    setTimeout(() => { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + (dir === 'next' ? 1 : -1), 1)); setIsFlipping(false); }, 300);
  };
  //các biến ngày tháng năm, số ngày trong tháng, ngày bắt đầu của tháng...
  const year = currentDate.getFullYear(), month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
  const getDateStr = d => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const vnMonths = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
  const expandedNotes = getSortedNotes(notes);

  if (!currentUser) return null;

  // component hiển thị các icon trạng thái
  const StatusIcons = ({ note }) => (
    <div className="flex items-center gap-1 flex-shrink-0 flex-wrap">
      {note.isPinned && <span title="Đã ghim" className="text-[13px]">📌</span>}
      {hasPass(note) && (unlockedNotes.has(note.id)
        ? <span title="Đã mở khóa" className="text-[13px]">🔓</span>
        : <span title="Có mật khẩu" className="text-[13px]">🔒</span>
      )}
      {(note.shareList?.length > 0 || note.visibility !== 'private') && <span title="Đã chia sẻ" className="text-[13px]">🔗</span>}
      {(note.labels || []).slice(0, 3).map(lb => (
        <div key={lb.id} title={lb.name} className="w-2 h-2 rounded-full border border-white/60 flex-shrink-0" style={{ background: lb.color }} />
      ))}
      {(note.shareList?.length || 0) > 0 && (
        <span className="text-[10px] bg-indigo-100 text-indigo-700 rounded-full px-1.5 py-px font-black">{note.shareList.length}</span>
      )}
    </div>
  );
  // component card hiển thị tóm tắt các thông tin
  const NoteCard = ({ note }) => {
    const locked = hasPass(note) && !unlockedNotes.has(note.id);
    const bg = note.color || prefs.defaultColor;
    const fontFam = note.fontFamily || prefs.fontFamily;
    const stripped = (note.content || '').replace(/<[^>]+>/g, '');
    const borderL = note.isPinned ? '#6366f1' : note.isImportant ? '#ef4444' : 'rgba(0,0,0,0.1)';
    //viewMode list
    if (viewMode === 'list') return (
      <div className={`${CLS_CARD} flex items-start gap-3`}
        style={{ background: bg, borderLeft: `4px solid ${borderL}` }}
        onClick={() => handleViewNote(note)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-black text-[15px] flex-1 leading-snug">{note.title}</h3>
            <StatusIcons note={note} />
          </div>
          {!locked && <p className="text-[13px] m-0 line-clamp-2" style={{ fontFamily: fontFam, color: note.textColor || undefined }}>{stripped}</p>}
          {locked && <p className="text-[13px] text-black/40 italic m-0">🔒 Nội dung được bảo vệ</p>}
          {(note.labels || []).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {note.labels.map(lb => <span key={lb.id} className="text-[11px] font-extrabold px-2 py-px rounded-full" style={{ background: lb.color + '25', color: lb.color, border: `1px solid ${lb.color}50` }}>{lb.name}</span>)}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={() => togglePin(note.id)} className={CLS_IBTN_SM} title={note.isPinned ? 'Bỏ ghim' : 'Ghim'}>{note.isPinned ? '📌' : '📍'}</button>
          <button onClick={() => handleNoteAccess(note, handleEditNote)} className={CLS_IBTN_SM} title="Sửa">✏️</button>
          <button onClick={() => setLabelModal({ noteId: note.id })} className={CLS_IBTN_SM} title="Nhãn">🏷️</button>
          <button onClick={() => setShareModal(note)} className={CLS_IBTN_SM} title="Chia sẻ">🔗</button>
          <button onClick={() => {
            if (hasPass(note) && unlockedNotes.has(note.id)) {
              setLockMenu(note);
            } else {
              const sp = () => setPasswordModal({ mode: 'set', noteId: note.id });
              if (hasPass(note) && !unlockedNotes.has(note.id)) setPasswordModal({ mode: 'verify', noteId: note.id, onSuccess: () => { setUnlockedNotes(prev => new Set([...prev, note.id])); setPasswordModal(null); sp(); } }); else sp();
            }
          }} className={CLS_IBTN_SM} title="Mật khẩu" style={{ background: hasPass(note) && unlockedNotes.has(note.id) ? '#dcfce7' : hasPass(note) ? '#fef3c7' : undefined }}>
            {hasPass(note) && unlockedNotes.has(note.id) ? '🔓' : '🔒'}
          </button>
          <button onClick={() => handleDeleteNote(note)} className={`${CLS_IBTN_SM} hover:!bg-red-100`} title="Xóa">🗑️</button>
        </div>
      </div>
    );
    //viewMode grid
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
            : <div className="rich-text-content text-[13px] line-clamp-3 mb-2"
              style={{ fontFamily: fontFam, color: note.textColor || undefined }}
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
            <button onClick={() => togglePin(note.id)} className={CLS_IBTN_SM} title={note.isPinned ? 'Bỏ ghim' : 'Ghim'}>{note.isPinned ? '📌' : '📍'}</button>
            <button onClick={() => setLabelModal({ noteId: note.id })} className={CLS_IBTN_SM} title="Nhãn">🏷️</button>
            <button onClick={() => setShareModal(note)} className={CLS_IBTN_SM} title="Chia sẻ">🔗</button>
            <button onClick={() => {
              if (hasPass(note) && unlockedNotes.has(note.id)) {
                setLockMenu(note);
              } else {
                const sp = () => setPasswordModal({ mode: 'set', noteId: note.id });
                if (hasPass(note) && !unlockedNotes.has(note.id)) setPasswordModal({ mode: 'verify', noteId: note.id, onSuccess: () => { setUnlockedNotes(prev => new Set([...prev, note.id])); setPasswordModal(null); sp(); } }); else sp();
              }
            }} className={CLS_IBTN_SM} style={{ background: hasPass(note) && unlockedNotes.has(note.id) ? '#dcfce7' : hasPass(note) ? '#fef3c7' : undefined }} title="Mật khẩu">
              {hasPass(note) && unlockedNotes.has(note.id) ? '🔓' : '🔒'}
            </button>
            <button onClick={() => handleNoteAccess(note, handleEditNote)} className={CLS_IBTN_SM} title="Sửa">✏️</button>
            <button onClick={() => handleDeleteNote(note)} className={`${CLS_IBTN_SM} hover:!bg-red-100`} title="Xóa">🗑️</button>
          </div>
        </div>
      </div>
    );
  };
  // component hiển thị danh sách note theo dạng grid hoặc list tùy theo viewMode
  const NoteGrid = ({ noteList }) => (
    <div className={viewMode === 'grid'
      ? 'grid gap-3 sm:gap-4 grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))]'
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

  const sharedByMe = getSortedNotes(notes.filter(n => n.shareList?.length > 0 || n.visibility !== 'private'));
  const handleResendActivation = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return;

      const btn = document.getElementById('resend-activation-btn');
      if (btn) {
        btn.disabled = true;
        btn.innerText = 'Đang gửi...';
      }
      await apiCall('/auth/resend-activation', { method: 'POST' });
      window.toast('Đã gửi lại email kích hoạt. Vui lòng kiểm tra hộp thư.', 'success');

      if (btn) {
        btn.innerText = 'Đã gửi lại thành công';
        setTimeout(() => {
          btn.disabled = false;
          btn.innerText = 'Click vào đây để gửi lại mã qua mail';
        }, 10000);
      }
    } catch (err) {
      window.toast(err.message || 'Lỗi khi gửi lại email kích hoạt', 'error');
      const btn = document.getElementById('resend-activation-btn');
      if (btn) {
        btn.disabled = false;
        btn.innerText = 'Click vào đây để gửi lại mã qua mail';
      }
    }
  };

  // phần = giao diện chính với sidebar và các view khác nhau
  return (
    <>
      {!isActive && (
        <div className="fixed top-0 left-0 right-0 z-[300] bg-red-500 text-white text-center py-2.5 px-4 text-sm font-black shadow-md flex items-center justify-center gap-2">
          <span>⚠️</span>
          <span>Tài khoản này chưa được xác thực. Vui lòng kiểm tra hộp thư đến của email đã đăng ký để hoàn tất quá trình kích hoạt. Hoặc <button id="resend-activation-btn" onClick={handleResendActivation} className="underline border-0 bg-transparent text-white cursor-pointer hover:text-red-200 p-0 m-0 font-bold ml-1 disabled:opacity-50 disabled:cursor-not-allowed">Click vào đây để gửi lại mã qua mail</button></span>
        </div>
      )}
      <div className="flex min-h-screen items-start overflow-x-hidden bg-indigo-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">

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

        {/*nút bật tắt sidebar */}
        <button
          onClick={() => setIsSidebarOpen(v => !v)}
          className={`fixed ${!isActive ? 'top-[52px]' : 'top-3'} left-3 z-[100] w-12 h-12 sm:w-10 sm:h-10 bg-white dark:bg-slate-800 rounded-xl shadow-lg border-2 border-indigo-500 dark:border-indigo-400 cursor-pointer flex flex-col items-center justify-center gap-1 transition-transform duration-300 hover:bg-indigo-100 dark:hover:bg-slate-700`}
          style={{ transform: isSidebarOpen ? 'translateX(256px)' : 'translateX(0)' }}>
          {[
            {
              transform: isSidebarOpen ? 'translateY(6px) rotate(45deg)' : 'translateY(0) rotate(0)',
              width: 20
            },
            {
              transform: isSidebarOpen ? 'scaleX(0)' : 'scaleX(1)', // Dùng scaleX để thu nhỏ mượt hơn là đổi width
              width: 16,
              opacity: isSidebarOpen ? 0 : 1
            },
            {
              transform: isSidebarOpen ? 'translateY(-6px) rotate(-45deg)' : 'translateY(0) rotate(0)',
              width: 20
            },
          ].map((s, i) => (
            <span
              key={i}
              className="block h-0.5 bg-slate-500 rounded transition-all duration-300 origin-center"
              style={s}
            />
          ))}
        </button>

        {/* Sidebar */}
        <nav className={`w-full sm:w-64 bg-white dark:bg-slate-800 shadow-2xl flex flex-col fixed ${!isActive ? 'top-[40px] h-[calc(100vh-40px)]' : 'top-0 h-screen'} z-[90] border-r border-slate-200 dark:border-slate-700 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>        {/* Avatar */}
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
              { view: 'shared', icon: '🔗', label: 'Đã chia sẻ', badge: sharedByMe.length + sharedWithMe.length },
              { view: 'settings', icon: '⚙️', label: 'Cài đặt' },
            ].map(item => (
              <button key={item.view}
                onClick={() => { setActiveView(item.view); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all font-extrabold text-sm border-0 cursor-pointer text-left font-[inherit] ${activeView === item.view ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-transparent text-slate-400 dark:text-slate-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-500'}`}>
                <span className="text-base">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.badge > 0 && (
                  <span className={`text-[10px] font-black px-1.5 py-px rounded-full ${activeView === item.view ? 'bg-white/25 text-white' : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}

            <div className="my-1.5 border-t border-slate-200 dark:border-slate-700" />

            <button
              onClick={() => { activeNoteIdRef.current = null; activeServerIdRef.current = null; setFormData({ ...defaultNote }); setEditorFont(prefs.fontFamily); setEditorColor(''); setShowModal(true); setTimeout(() => { if (editorRef.current) editorRef.current.innerHTML = ''; }, 60); }}
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

        {/*nội dung chính khi sidebar mở*/}
        <main className={`flex-1 min-w-0 min-h-screen px-5 pb-8 ${!isActive ? 'pt-[108px]' : 'pt-[68px]'} transition-[margin] duration-300`}
          style={{ marginLeft: isSidebarOpen ? 256 : 0 }}>

          {/* lịch cá nhân */}
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

              <div className={`bg-white dark:bg-slate-800 rounded-[18px] shadow-md p-2 sm:p-3.5 border border-slate-200 dark:border-slate-700 ${isFlipping ? 'cal-flip' : ''}`}>
                {/* header ngày */}
                <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1">
                  {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d, i) => (
                    <div key={d} className={`text-center font-black text-[10px] sm:text-[11px] py-0.5 ${i === 6 ? 'text-red-500' : 'text-slate-400'}`}>{d}</div>
                  ))}
                </div>
                {/* ô ngày */}
                <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                  {Array.from({ length: startDayIndex }).map((_, i) => <div key={`e${i}`} className="min-h-[60px] sm:min-h-[78px]" />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1, dateStr = getDateStr(day);
                    const notesToday = expandedNotes.filter(n => (n.createdAt || n.updatedAt || '').slice(0, 10) === dateStr);
                    const holidays = getHolidaysForDate(dateStr);
                    const isToday = new Date().toISOString().slice(0, 10) === dateStr;
                    const isSun = new Date(year, month, day).getDay() === 0;
                    return (
                      <div key={day}
                        onClick={() => setSelectedDayNotes({ day, dateStr, notes: notesToday, holidays })}
                        className={`min-h-[60px] sm:min-h-[78px] p-1 sm:p-1.5 rounded-xl border cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-400 ${isToday ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                        <div className="flex justify-between items-start">
                          <div className={`w-5 h-5 sm:w-5.5 sm:h-5.5 flex items-center justify-center rounded-lg text-[10px] sm:text-xs font-black ${isToday ? 'bg-indigo-500 text-white' : isSun ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}
                            style={{ width: 20, height: 20 }}>{day}</div>
                          <span className="hidden sm:inline text-[9px] text-slate-400 font-semibold">{getLunarDay(day, month + 1, year)}</span>
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

          {/*tất cả ghi chú*/}
          {activeView === 'all-notes' && (
            <div className="fade-up">
              <div className={`flex items-center justify-between mb-3.5 flex-wrap gap-2.5 ${isSidebarOpen ? '' : 'pl-11'}`}>
                <h1 className="text-[26px] font-black">📂 Ghi chú</h1>
                <div className="flex gap-2">
                  <button onClick={() => { activeNoteIdRef.current = null; activeServerIdRef.current = null; setFormData({ ...defaultNote }); setEditorFont(prefs.fontFamily); setEditorColor(''); setShowModal(true); setTimeout(() => { if (editorRef.current) editorRef.current.innerHTML = ''; }, 60); }} className={`${CLS_BTN_PRI} text-xs px-4 py-2.5`}>✍️ Tạo mới</button>
                  <button onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')} className={`${CLS_BTN_SEC} text-xs px-3.5 py-2.5`}>{viewMode === 'grid' ? '☰' : '⊞'}</button>
                  <button onClick={() => setLabelEditor(true)} className={`${CLS_BTN_SEC} text-xs px-3 py-2.5`} title="Quản lý nhãn">🏷️</button>
                </div>
              </div>

              {/* thanh tìm kiếm */}
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

              {/* bộ lọc */}
              <div className="flex flex-wrap gap-1.5 mb-4 overflow-x-auto pb-1">
                {FILTER_OPTIONS.map(f => (
                  <button key={f.value} onClick={() => handleSystemFilterClick(f.value)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold cursor-pointer transition-all border whitespace-nowrap font-[inherit] ${selectedFilterLabels.length === 0 && activeFilter === f.value ? 'bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/25' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-500'}`}>
                    <span>{f.icon}</span><span>{f.label}</span>
                    {selectedFilterLabels.length === 0 && activeFilter === f.value && (
                      <span className="bg-white/25 rounded-full px-1.5 py-px text-[10px] font-black">{getFilteredNotes().length}</span>
                    )}
                  </button>
                ))}
                {allLabels.map(lb => {
                  const isSelected = selectedFilterLabels.includes(lb.id) || (selectedFilterLabels.length === 0 && activeFilter === lb.id);
                  return (
                    <button key={`lb-${lb.id}`}
                      onClick={() => handleLabelFilterToggle(lb.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold cursor-pointer transition-all border whitespace-nowrap font-[inherit] ${isSelected ? 'shadow-md shadow-indigo-500/10' : 'opacity-80 hover:opacity-100'}`}
                      style={isSelected ? { borderColor: lb.color, background: lb.color, color: '#fff' } : { borderColor: lb.color + '60', background: lb.color + '15', color: lb.color }}>
                      <div className="w-2 h-2 rounded-full bg-current" />{lb.name}
                      {isSelected && (
                        <span className="bg-black/20 rounded-full px-1.5 py-px text-[10px] font-black ml-1">{getFilteredNotes().length}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <NoteGrid noteList={getFilteredNotes()} />
            </div>
          )}

          {/*mục đã chia sẻ*/}
          {activeView === 'shared' && (
            <div className="fade-up">
              <h1 className={`text-[26px] font-black mb-4 ${isSidebarOpen ? '' : 'pl-11'}`}>🔗 Đã chia sẻ</h1>
              <div className="flex gap-1.5 mb-4 bg-white dark:bg-slate-800 p-1 rounded-xl w-fit border border-slate-200 dark:border-slate-700">
                {[{ key: 'by-me', label: 'Tôi chia sẻ', icon: '📤', count: sharedByMe.length }, { key: 'with-me', label: 'Được chia sẻ', icon: '📥', count: sharedWithMe.length, badge: notifications.length }].map(tab => (
                  <button key={tab.key} onClick={() => setSharedSubTab(tab.key)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border-0 cursor-pointer font-extrabold text-sm transition-all font-[inherit] ${sharedSubTab === tab.key ? 'bg-indigo-500 text-white' : 'bg-transparent text-slate-400 hover:text-indigo-500'}`}>
                    <span>{tab.icon}</span><span>{tab.label}</span>
                    <span className={`text-[10px] px-1.5 py-px rounded-full font-[inherit] ${sharedSubTab === tab.key ? 'bg-white/25' : 'bg-slate-100 dark:bg-slate-700'}`}>{tab.count}</span>
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
                    <p className="font-black text-lg m-0">Chưa có note nào được chia sẻ</p>
                    <p className="text-sm mt-1.5">Khi có người chia sẻ note với bạn, nó sẽ xuất hiện ở đây</p>
                  </div>
                  : <div className="space-y-3">
                    {notifications.length > 0 && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 mb-3">
                        <div className="text-xs font-extrabold text-amber-700 dark:text-amber-300 flex items-center gap-2">
                          🔔 Bạn có {notifications.length} note mới được chia sẻ!
                        </div>
                      </div>
                    )}
                    {sharedWithMe.map(n => (
                      <div key={n.share_id || n.id}
                        className="rounded-2xl p-4 shadow-md border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 cursor-pointer hover:-translate-y-0.5 transition-all"
                        onClick={() => setViewingNote(n)}>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-black text-[15px] flex-1">{n.title}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${n.role === 'editor' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                            {n.role === 'editor' ? '✏️ Sửa' : '👁️ Xem'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          {n.owner_avatar ? (
                            <img src={n.owner_avatar.startsWith('http') ? n.owner_avatar : getStorageUrl(n.owner_avatar)} alt="avatar" className="w-5 h-5 rounded-full object-cover" />
                          ) : (
                            <span className="text-[11px]">👤</span>
                          )}
                          <div className="text-[11px] text-slate-500">
                            {n.owner_name || n.owner_email} · {n.shared_at ? new Date(n.shared_at).toLocaleDateString('vi-VN') : ''}
                          </div>
                        </div>
                        {!n.is_seen && <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">MỚI</span>}
                      </div>
                    ))}
                  </div>
              )}
            </div>
          )}

          {/* Cài đặt */}
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

                {/* bật/tắt hiển thị ngày lễ */}
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

                {/* Quản lý nhãn */}
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

                {/* Tài khoản */}
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
                    <button onClick={() => {
                      ['currentUser', 'displayName', 'avatar', 'token', 'isActive'].forEach(k => {
                        localStorage.removeItem(k);
                        sessionStorage.removeItem(k);
                      });
                      navigate('/login');
                    }}
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
                    <button onClick={() => {
                      setShowDeleteAllModal(true);
                      setDeleteAllConfirmPhrase('');
                      setDeleteAllError('');
                    }}
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

        {/* Chi tiết ngày khi bấm vào ô ngày */}
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
                      const locked = hasPass(note) && !unlockedNotes.has(note.id);
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
                              <p className="text-xs mt-1 line-clamp-2" style={{ fontFamily: note.fontFamily || prefs.fontFamily, color: note.textColor || undefined }}>
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
                            <button onClick={() => { handleDeleteNote(note); setSelectedDayNotes(prev => ({ ...prev, notes: prev.notes.filter(n => n.id !== note.id) })); }} className={`${CLS_IBTN_SM} hover:!bg-red-100`} title="Xóa">🗑️</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-3.5 border-t border-slate-200 dark:border-slate-700 mt-3">
                <button className={`${CLS_BTN_PRI} w-full py-3`} onClick={() => {
                  const targetDate = selectedDayNotes.dateStr;
                  setSelectedDayNotes(null);
                  setTimeout(() => {
                    activeNoteIdRef.current = null;
                    activeServerIdRef.current = null;
                    const isoDate = new Date(`${targetDate}T12:00:00Z`).toISOString();
                    setFormData({ ...defaultNote, createdAt: isoDate, updatedAt: isoDate });
                    setEditorFont(prefs.fontFamily);
                    setEditorColor('');
                    setShowModal(true);
                    setTimeout(() => { if (editorRef.current) editorRef.current.innerHTML = ''; }, 60);
                  }, 80);
                }}>✍️ Tạo ghi chú cho ngày này</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal tạo/sửa ghi chú */}
        {showModal && (() => {
          const isViewer = formData.is_shared && (formData.my_role === 'viewer' || formData.role === 'viewer');
          return (
            <div className={CLS_OVERLAY} onClick={handleCancel}>
              <div className="bg-white dark:bg-slate-800 rounded-[22px] w-full max-w-2xl max-h-[96vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 mx-2 sm:mx-0"
                onClick={e => e.stopPropagation()}>

                {/* Modal Header */}
                <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 flex-shrink-0">
                  <div className="flex-1">
                    <input type="text" placeholder="📝 Tiêu đề ghi chú..." value={formData.title}
                      onChange={e => {
                        formDataRef.current.title = e.target.value;
                        setFormData(p => ({ ...p, title: e.target.value }));
                        triggerAutoSave();
                      }}
                      readOnly={isViewer}
                      className={`text-lg font-black border-0 bg-transparent p-0 rounded-none w-full text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 ${isViewer ? 'opacity-80' : ''}`}
                      autoFocus={!isViewer} />
                  </div>
                  {!isViewer && (
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      {saveStatus === 'saving' && (
                        <span className="text-[11px] text-slate-500 font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-700/60 rounded-full flex items-center gap-1">
                          <span className="inline-block w-2.5 h-2.5 border border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                          Đang tự động lưu... ⏳
                        </span>
                      )}
                      {saveStatus === 'saved' && (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center gap-0.5">
                          Đã lưu tất cả! ✅
                        </span>
                      )}
                      {saveStatus === 'offline' && (
                        <span className="text-[11px] text-sky-600 dark:text-sky-400 font-bold px-2 py-0.5 bg-sky-50 dark:bg-sky-950/30 rounded-full flex items-center gap-0.5">
                          Đã lưu ngoại tuyến 📶
                        </span>
                      )}
                      {saveStatus === 'error' && (
                        <span className="text-[11px] text-rose-600 dark:text-rose-400 font-bold px-2 py-0.5 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center gap-0.5">
                          Lỗi lưu, sẽ tự lưu lại ⚠️
                        </span>
                      )}
                      {!saveStatus && formData.id && (
                        <span className="text-[11px] text-slate-400 font-bold px-2 py-0.5 bg-slate-100/50 dark:bg-slate-700/30 rounded-full flex items-center gap-0.5">
                          Tự động lưu ngầm ⚡
                        </span>
                      )}
                    </div>
                  )}
                  <button onClick={handleCancel} className={CLS_ICON_BTN}>✕</button>
                </div>

                {/* Toolbar */}
                {!isViewer && (
                  <div className="px-2 sm:px-3.5 py-2 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-1 sm:gap-1.5 bg-slate-50 dark:bg-slate-900/50 flex-shrink-0 overflow-x-auto">
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
                    <select value={formData.fontSize || prefs.fontSize} onChange={e => { applyFontSizeToEditor(e.target.value); editorRef.current?.focus(); }}
                      className={`${CLS_INPUT} text-[11px] py-0 px-1 w-16`}>
                      {[9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 24, 28, 32, 36].map(s => <option key={s} value={s}>{s}px</option>)}
                    </select>
                    <div className="flex gap-1 items-center">
                      {TEXT_COLORS.map(c => (
                        <button key={c} onMouseDown={e => { e.preventDefault(); applyColorToEditor(c); }}
                          className="w-[18px] h-[18px] rounded-md border cursor-pointer transition-transform hover:scale-110"
                          style={{ background: c, borderColor: editorColor === c ? '#6366f1' : '#e2e8f0', borderWidth: editorColor === c ? 2 : 1.5 }} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Editor */}
                <div className="flex-1 overflow-auto px-5 py-3.5">
                  <div ref={editorRef} contentEditable={!isViewer} suppressContentEditableWarning
                    data-placeholder="Nhập nội dung ghi chú..."
                    style={{
                      fontFamily: editorFont || prefs.fontFamily,
                      fontSize: `${formData.fontSize || prefs.fontSize}px`,
                      color: editorColor || undefined
                    }}
                    className="min-h-48 outline-none leading-relaxed break-words"
                    onInput={() => {
                      if (!isViewer) {
                        const newContent = editorRef.current?.innerHTML || '';
                        formDataRef.current.content = newContent;
                        setFormData(prev => ({ ...prev, content: newContent }));
                        triggerAutoSave();
                      }
                    }}
                  />
                </div>

                {/* preview tệp đính kèm */}
                {formData.attachments?.length > 0 && (
                  <div className="px-5 py-2 border-t border-slate-200 dark:border-slate-700 flex gap-2 flex-wrap flex-shrink-0">
                    {formData.attachments.map((att, i) => (
                      <div key={i} className="relative inline-block">
                        {att.type?.startsWith('image/')
                          ? <img src={att.data} alt={att.name} className="w-13 h-13 object-cover rounded-xl border-2 border-slate-200" style={{ width: 52, height: 52 }} />
                          : <div className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 text-[11px] font-bold max-w-[100px] truncate">📄 {att.name}</div>
                        }
                        {!isViewer && (
                          <button onClick={() => setFormData(p => ({ ...p, attachments: p.attachments.filter((_, j) => j !== i) }))}
                            className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-red-500 border-0 text-white cursor-pointer text-[10px] flex items-center justify-center font-black font-[inherit]">✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Bottom bar */}
                {!isViewer ? (
                  <div className="px-2 sm:px-4 py-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-1 sm:gap-2 flex-wrap flex-shrink-0 bg-slate-50 dark:bg-slate-900/50">
                    {/* đổi màu nền ghi chú */}
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
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border-0 cursor-pointer text-xs font-extrabold font-[inherit] transition-colors ${formData.isPinned ? 'bg-amber-100 dark:bg-amber-900/60 dark:text-amber-300' : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                        📌 Ghim
                      </button>
                      <button onClick={() => setLabelModal({ noteId: formData.id })}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border-0 cursor-pointer text-xs font-extrabold font-[inherit] transition-colors ${formData.labels?.length ? 'bg-violet-100 dark:bg-violet-900/60 dark:text-violet-300' : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                        🏷️ {formData.labels?.length > 0 ? `${formData.labels.length} nhãn` : 'Nhãn'}
                      </button>
                      <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg cursor-pointer text-xs font-extrabold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-[inherit]">
                        📎 Đính kèm
                        <input type="file" multiple className="hidden" onChange={handleAttachmentAdd} accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt" />
                      </label>
                      <button onClick={() => setPasswordModal({ mode: formData.password ? 'change' : 'set', noteId: formData.id || 'new' })}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border-0 cursor-pointer text-xs font-extrabold font-[inherit] transition-colors ${formData.password ? 'bg-amber-100 dark:bg-amber-900/60 dark:text-amber-300' : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                        🔒 {formData.password ? 'Đổi MK' : 'Đặt MK'}
                      </button>
                      <button onClick={handleCancel} className={`${CLS_BTN_SEC} text-xs px-4 py-1.5 flex items-center gap-1.5`}>
                        🚪 Đóng
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-center text-sm font-bold text-slate-500">
                    👁️ Bạn đang xem ghi chú này với quyền Chỉ xem.
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* modal xem ghi chú */}
        {viewingNote && (
          <ViewNoteModal note={viewingNote} onClose={() => setViewingNote(null)}
            onEdit={() => { setViewingNote(null); handleEditNote(viewingNote); }}
            onRevokeShare={handleRevokeShare} />
        )}
        {/* modal chia sẻ ghi chú */}
        {shareModal && (
          <ShareModal note={shareModal} error={shareError} onClose={() => { setShareModal(null); setShareError(''); }}
            onSave={({ shareList, visibility }) => handleSaveShare(shareModal.id, { shareList, visibility })} />
        )}

        {passwordModal && (
          <PasswordModal mode={passwordModal.mode} error={passwordError} isLoading={isPasswordSubmitLoading}
            onSubmit={pass => {
              if (passwordModal.mode === 'set') {
                if (passwordModal.noteId === 'new' || !passwordModal.noteId) { setFormData(p => ({ ...p, password: pass || null })); setPasswordModal(null); }
                else handlePasswordSubmit(pass);
              } else handlePasswordSubmit(pass);
            }}
            onCancel={() => { setPasswordModal(null); setPasswordError(''); }} />
        )}

        {lockMenu && (
          <LockMenuModal note={lockMenu} onClose={() => setLockMenu(null)}
            onChangePassword={() => { setLockMenu(null); setPasswordModal({ mode: 'change', noteId: lockMenu.id }); }}
            onRemovePassword={() => { setLockMenu(null); setPasswordModal({ mode: 'remove', noteId: lockMenu.id }); }}
          />
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
                formDataRef.current.labels = selectedLabels;
                setFormData(p => ({ ...p, labels: selectedLabels }));
                triggerAutoSave();
                setLabelModal(null);
              }
            }}
            onManageGlobal={() => { setLabelModal(null); setLabelEditor(true); }} />
        )}

        {labelEditor && (
          <LabelEditor labels={allLabels} onClose={() => setLabelEditor(false)} onSave={handleSaveGlobalLabels} isSaving={isSavingLabels} />
        )}

        {confirmDelete && (
          <ConfirmDialog
            message={
              confirmDelete.is_shared && (confirmDelete.my_role === 'editor' || confirmDelete.my_role === 'viewer' || confirmDelete.role === 'editor' || confirmDelete.role === 'viewer')
                ? `Bạn đang gỡ ghi chú được chia sẻ này khỏi danh sách của mình. Bạn sẽ không thể xem hoặc chỉnh sửa ghi chú này nữa trừ khi chủ sở hữu chia sẻ lại. Bạn có chắc chắn muốn gỡ không?`
                : "Xóa ghi chú này? Hành động không thể hoàn tác."
            }
            onConfirm={confirmDeleteNote}
            onCancel={() => setConfirmDelete(null)} />
        )}

        {showDeleteAllModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-md bg-white rounded-3xl border border-red-100 shadow-2xl overflow-hidden transform transition-all duration-300 scale-100 flex flex-col animate-scale-up">
              {/* Top red header warning banner */}
              <div className="bg-red-500 p-6 text-white flex flex-col items-center justify-center gap-2">
                <span className="text-4xl animate-bounce">🗑️</span>
                <h3 className="text-xl font-black text-center tracking-tight">XÓA TOÀN BỘ GHI CHÚ</h3>
              </div>

              {/* Body */}
              <div className="p-6 flex-1 flex flex-col gap-4 text-gray-700">
                <p className="text-sm font-bold text-gray-500 leading-relaxed">
                  Hành động này <span className="text-red-600 font-black underline">không thể hoàn tác</span>! Tất cả ghi chú của bạn sẽ bị xóa vĩnh viễn trên máy chủ lẫn thiết bị này.
                </p>

                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-xs font-semibold text-red-700 flex flex-col gap-1">
                  <span>• Xóa sạch toàn bộ {notes.length} ghi chú hiện có.</span>
                  <span>• Hủy bỏ toàn bộ các bản lưu đồng bộ và nhãn dán đính kèm.</span>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Nhập chữ <span className="text-red-600 font-black">DELETE ALL</span> để tiếp tục:
                  </label>
                  <input
                    type="text"
                    placeholder="Gõ chữ DELETE ALL..."
                    value={deleteAllConfirmPhrase}
                    onChange={(e) => setDeleteAllConfirmPhrase(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 text-gray-800 font-bold focus:border-red-500 focus:outline-none transition-all placeholder:text-gray-300 placeholder:font-normal uppercase"
                  />
                </div>

                {deleteAllError && (
                  <div className="text-xs font-black text-red-600 animate-pulse bg-red-50 border border-red-100 rounded-2xl p-3">
                    {deleteAllError}
                  </div>
                )}
              </div>

              {/* Footer buttons */}
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteAllModal(false)}
                  disabled={isDeletingAll}
                  className="flex-1 py-3.5 rounded-2xl bg-white border-2 border-gray-200 text-gray-500 font-black hover:bg-gray-100 hover:text-gray-700 transition-all focus:outline-none cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAllNotesConfirm}
                  disabled={deleteAllConfirmPhrase.trim().toUpperCase() !== 'DELETE ALL' || isDeletingAll}
                  className={`flex-1 py-3.5 rounded-2xl font-black text-white shadow-lg transition-all focus:outline-none flex items-center justify-center gap-2 ${deleteAllConfirmPhrase.trim().toUpperCase() === 'DELETE ALL' && !isDeletingAll
                    ? 'bg-red-600 hover:bg-red-700 active:scale-95 shadow-red-200 cursor-pointer'
                    : 'bg-gray-300 cursor-not-allowed shadow-none'
                    }`}
                >
                  {isDeletingAll ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Đang xóa...
                    </>
                  ) : (
                    'Xóa tất cả'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Home;
