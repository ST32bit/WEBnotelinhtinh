import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu nhập lại không khớp!');
      return;
    }
    
    setError('');
    alert('Đăng ký thành công, tự động chuyển về Đăng nhập.');
    
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-100 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-center text-3xl font-bold text-gray-800 select-none">Đăng Ký</h2>
        
        {error && <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 select-none">Tên hiển thị (Display Name)</label>
            <input 
              type="text" name="displayName" required onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 transition hover:translate-y-[-3px] transition-transform duration-100 active:scale-95 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Nhập tên của bạn"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 select-none">Email</label>
            <input 
              type="email" name="email" required onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 transition hover:translate-y-[-3px] transition-transform duration-100 active:scale-95 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Nhập email"
            />
          </div>
          
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 select-none">Mật khẩu</label>
            <input 
              type="password" name="password" required minLength={6} onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 transition hover:translate-y-[-3px] transition-transform duration-100 active:scale-95 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Nhập mật khẩu (Ít nhất 6 ký tự)"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 select-none">Xác nhận Mật khẩu</label>
            <input 
              type="password" name="confirmPassword" required minLength={6} onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 transition hover:translate-y-[-3px] transition-transform duration-100 active:scale-95 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Nhập lại mật khẩu"
            />
          </div>

          <button 
            type="submit" 
            className="mt-4 w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white transition hover:translate-y-[-3px] hover:bg-blue-700 select-none"
          >
            Tạo Tài Khoản
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 select-none">
          Đã có tài khoản? <Link to="/login" className="font-semibold text-blue-600 hover:underline">Đăng nhập ngay</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;