import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './loginStyles.css';

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });



      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha no login');
      }

      const data = await response.json();
      const { token, refreshToken } = data;

      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', refreshToken);

      navigate('/main');
    } catch (err) {
      console.error('Login error:', err.message);
      setError(err.message || 'Erro ao fazer login. Tente novamente.');
    }
  };

  const handleRegister = () => {
    navigate('/register');
  };

  return (
    <div className='login-root'>
      <div className='login-container'>
        <h1 className='login-title'>Login</h1>
        <form onSubmit={handleLogin}>
          <div className='login-input-container'>
            <label htmlFor="email" className='login-input-label'>Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className='login-input'
            />
          </div>
          <div className='login-input-container'>
            <label htmlFor="password" className='login-input-label'>Senha:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className='login-input'
            />
          </div>
          {error && <p className='login-error'>{error}</p>}
          <button
            type="submit"
            className='login-button-submit'
          >
            Entrar
          </button>
        </form>
        <hr className='login-hr' />
        <p className='login-text-no-account'>Não tem uma conta?</p>
        <button
          onClick={handleRegister}
          className='login-button-register'
        >
          Cadastre-se
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
