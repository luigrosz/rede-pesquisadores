import { useState, useEffect } from 'react';
import './adminStyles.css';

function AdminPage() {
  const [adminData, setAdminData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAdminData = async (pesquisador = '') => {
    setLoading(true);
    setError('');
    try {
      const url = pesquisador ? `http://localhost:3000/pesquisador/pesquisar?nome=${pesquisador}` : 'http://localhost:3000/pesquisador';
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao buscar dados do administrador.');
      } else {
        const data = await response.json();
        setAdminData(data);
      }
    } catch (err) {
      console.error('Erro ao buscar dados do administrador:', err);
      setError(err.message || 'Erro ao buscar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleEnableDisable = async (pesquisadorId, currentStatus) => {
    const newStatus = !currentStatus;
    try {
      const response = await fetch(`http://localhost:3000/pesquisador/${pesquisadorId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_enabled: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Falha ao ${newStatus ? 'habilitar' : 'desabilitar'} pesquisador.`);
      }
      await fetchAdminData(searchTerm);
      alert(`Pesquisador ${newStatus ? 'habilitado' : 'desabilitado'}!`);
    } catch (err) {
      console.error(`Erro ao ${newStatus ? 'habilitar' : 'desabilitar'} pesquisador:`, err);
      setError(err.message);
    }
  };

  const handleSearch = () => {
    fetchAdminData(searchTerm);
  };

  if (loading) {
    return <div>Carregando dados...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Erro: {error}</h1>
      </div>
    );
  }

  return (
    <div className='container-admin'>
      <h1>Página do Administrador</h1>

      <div >
        <input
          type="text"
          placeholder="Buscar pesquisador por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='search-bar-admin'
        />
        <button
          onClick={handleSearch}
          className="btn-search-admin"
        >
          Buscar
        </button>
      </div>

      {adminData && adminData.length > 0 ? (
        <div>
          <h2>Pesquisadores Cadastrados</h2>
          <table className='table-admin'>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                <th>ID</th>
                <th>Nome</th>
                <th>Email</th>
                <th>Habilitado</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {adminData.map((pesquisador) => (
                <tr className="table-admin-row" key={pesquisador.id_pesquisador}>
                  <td>{pesquisador.id_pesquisador}</td>
                  <td>{pesquisador.nome}</td>
                  <td>{pesquisador.email}</td>
                  <td>{pesquisador.is_enabled ? 'Sim' : 'Não'}</td>
                  <td>
                    <button
                      onClick={() => handleEnableDisable(pesquisador.id_pesquisador, pesquisador.is_enabled)}
                      style={{ backgroundColor: pesquisador.is_enabled ? '#dc3545' : '#28a745' }}
                      className="btn-admin-enable-disable"
                    >
                      {pesquisador.is_enabled ? 'Desabilitar' : 'Habilitar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>Nenhum pesquisador encontrado ou dados não puderam ser carregados.</p>
      )}
    </div>
  );
}

export default AdminPage;
