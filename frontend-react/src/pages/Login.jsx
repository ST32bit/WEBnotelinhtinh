import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => { // Component đăng nhập sử dụng useState để quản lý trạng thái của email, password và rememberMe. Khi người dùng nhấn nút đăng nhập, hàm handleLogin sẽ được gọi để lưu thông tin người dùng vào localStorage hoặc sessionStorage tùy thuộc vào lựa chọn "Ghi nhớ đăng nhập". Sau đó, người dùng sẽ được điều hướng đến trang chủ (/home).
  const navigate = useNavigate(); // Sử dụng useNavigate để điều hướng người dùng sau khi đăng nhập thành công
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false); // Mặc định không ghi nhớ đăng nhập

  const handleLogin = (e) => { // Hàm xử lý đăng nhập sẽ ngăn chặn hành động mặc định của form, sau đó lưu email vào sessionStorage và nếu chọn "Ghi nhớ đăng nhập" thì cũng lưu vào localStorage. Cuối cùng, hàm sẽ điều hướng người dùng đến trang chủ (/home).
    e.preventDefault();

    sessionStorage.setItem('currentUser', email);
    if (rememberMe) {
      localStorage.setItem('currentUser', email);
    }

    navigate('/home');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-100">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-center text-3xl font-bold text-gray-800 select-none">Đăng Nhập</h2>
  
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
              <a href="#" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                Quên mật khẩu?
              </a>
            </div>
          </div>

          <button type="submit" className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white transition hover:translate-y-[-3px] hover:bg-blue-700 select-none">
            Đăng Nhập
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 select-none">
          Chưa có tài khoản? <Link to="/register" className="font-semibold text-blue-600 hover:underline">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
};

export default Login; 
