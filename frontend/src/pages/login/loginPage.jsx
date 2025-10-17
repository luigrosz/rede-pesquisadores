import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/main');
  };

  const handleRegister = () => {
    navigate('/register');
  }

  return (
    <div>
      <h1>TODO: LOGIN</h1>
      <button onClick={handleLogin}>Pagina Principal</button>
      <hr></hr>
      <button onClick={handleRegister}>Registro</button>
      <h1>TODO: LOGIN</h1>
      <h1>TODO: LOGIN</h1>
      <h1>TODO: LOGIN</h1>
      <h1>TODO: LOGIN</h1>
      <h1>TODO: LOGIN</h1>
      <h1>TODO: LOGIN</h1>
      <h1>TODO: LOGIN</h1>
    </div>
  );
}

export default LoginPage;
