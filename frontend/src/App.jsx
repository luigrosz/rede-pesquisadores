import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";

import RegistrationPage from './pages/registration/registrationPage';
import RegistrationPage2 from './pages/registration/registrationPage2';
import RegistrationPage3 from './pages/registration/registrationPage3';
import AdminPage from './pages/admin/adminPage';
import LoginPage from './pages/login/loginPage';
import MainPage from './pages/main/mainPage';
import NotFoundPage from './pages/notfound/notFoundPage';
import ProfilePage from './pages/profile/ProfilePage';
import ResetPasswordPage from './pages/resetPassword/resetPasswordPage';

const AdminRoutes = () => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return <Navigate to="/" />;
  }

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;

    if (decoded.exp < currentTime) {
      localStorage.clear();
      return <Navigate to="/" />;
    }

    if (decoded.isAdmin) {
      return <Outlet />;
    } else {
      return <Navigate to="/" />;
    }

  } catch (e) {
    console.error(e);
    localStorage.clear();
    return <Navigate to="/" />;
  }
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/register/step2/:id" element={<RegistrationPage2 />} />
        <Route path="/register/step3/:id" element={<RegistrationPage3 />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />

        <Route element={<AdminRoutes />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;
