import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
<<<<<<< HEAD
import Activate from './pages/Activate';
import Home from './pages/Home';
import User from './pages/User';
import ResetPassword from './pages/ResetPassword';
import SharedNotePage from './pages/SharedNotePage';
import './index.css'

const isLoggedIn = () => !!(localStorage.getItem('token') || sessionStorage.getItem('token'));

=======
import Home from './pages/Home';
import User from './pages/User';
import ResetPassword from './pages/ResetPassword';
import './index.css'

>>>>>>> a518c7f15ee7892eb351a53417168a339bed928d
function App() {
  return (
    <BrowserRouter>
      <Routes>
<<<<<<< HEAD
        <Route path="/" element={<Navigate to={isLoggedIn() ? "/home" : "/login"} replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/activate" element={<Activate />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/home" element={<Home />} />
        <Route path="/user" element={<User />} />
        <Route path="/shared/:noteId" element={<SharedNotePage />} />      </Routes>
=======
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/home" element={<Home />} />
        <Route path="/user" element={<User />} />
      </Routes>
>>>>>>> a518c7f15ee7892eb351a53417168a339bed928d
    </BrowserRouter>
  );
}

export default App;