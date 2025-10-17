import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RegistrationPage from './pages/registration/registrationPage';
import AdminPage from './pages/admin/adminPage';
import LoginPage from './pages/login/loginPage';
import MainPage from './pages/main/mainPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/main" element={<MainPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
