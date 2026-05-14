import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Activate from './pages/Activate';
import Home from './pages/Home';
import User from './pages/User';
import ResetPassword from './pages/ResetPassword';
import SharedNotePage from './pages/SharedNotePage';
import './index.css'

const isLoggedIn = () => !!(localStorage.getItem('token') || sessionStorage.getItem('token'));

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={isLoggedIn() ? "/home" : "/login"} replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/activate" element={<Activate />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/home" element={<Home />} />
        <Route path="/user" element={<User />} />
        <Route path="/shared/:noteId" element={<SharedNotePage />} />      </Routes>
    </BrowserRouter>
  );
}

export default App;