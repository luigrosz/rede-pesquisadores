import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './loginStyles.css';

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('userId')) {
      navigate('/main');
    }
  }, [navigate]);

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

      localStorage.setItem('userId', data.id);
      localStorage.setItem('isAdmin', data.isAdmin);
      localStorage.setItem('userName', data.nome);
      localStorage.setItem('userEmail', data.email);

      navigate('/main');
    } catch (err) {
      console.error('Login error:', err.message);
      setError(err.message || 'Erro ao fazer login. Tente novamente.');
    }
  };

  const handleRegister = () => {
    navigate('/register');
  };

  const handleGuestAccess = () => {
    navigate('/main');
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessage('');
    try {
      const res = await fetch('http://localhost:3000/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      setForgotMessage(data.message || 'Email enviado.');
    } catch {
      setForgotMessage('Erro ao enviar. Tente novamente.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className='login-root'>
      <div className='login-container'>
        <h1 className='login-title'>ConectaFarmaco</h1>
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
          <button
            type="button"
            onClick={() => { setShowForgotModal(true); setForgotMessage(''); setForgotEmail(''); }}
            style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', marginTop: '8px', fontSize: '0.875rem' }}
          >
            Esqueceu sua senha?
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

        {/* Botao Convidado */}
        <button
          onClick={handleGuestAccess}
          className='login-button-guest'
          style={{
            marginTop: '15px',
            width: '100%',
            padding: '10px',
            cursor: 'pointer',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem'
          }}
        >
          Entrar como Visitante
        </button>

      </div>
      {showForgotModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', width: '90%', maxWidth: '400px' }}>
            <h2 style={{ marginTop: 0 }}>Recuperar senha</h2>
            {forgotMessage ? (
              <>
                <p>{forgotMessage}</p>
                <button onClick={() => setShowForgotModal(false)} style={{ width: '100%', padding: '10px', cursor: 'pointer' }}>Fechar</button>
              </>
            ) : (
              <form onSubmit={handleForgotSubmit}>
                <label style={{ display: 'block', marginBottom: '6px' }}>Informe seu email:</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', marginBottom: '16px', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setShowForgotModal(false)} style={{ flex: 1, padding: '10px', cursor: 'pointer' }}>Cancelar</button>
                  <button type="submit" disabled={forgotLoading} style={{ flex: 1, padding: '10px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
                    {forgotLoading ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
