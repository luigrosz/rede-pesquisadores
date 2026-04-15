import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import './adminStyles.css';

function AdminPage() {
  const [adminData, setAdminData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showContributionForm, setShowContributionForm] = useState(false);
  const [currentPesquisadorIdForContribution, setCurrentPesquisadorIdForContribution] = useState(null);
  const [newContribution, setNewContribution] = useState({
    valor: '',
    metodo: 'pix', // default
  });
  const [mensalidade, setMensalidade] = useState(null);
  const [newMensalidade, setNewMensalidade] = useState('');
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);

  const navigate = useNavigate();

  const fetchAdminData = async (pesquisador = '') => {
    setLoading(true);
    setError('');
    try {
      const url = 'http://localhost:3000/pesquisador/pesquisar';
      const requestBody = {};
      if (pesquisador) {
        requestBody.nome = pesquisador;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      let decodedToken;
      const token = localStorage.getItem('accessToken');
      try {
        decodedToken = jwtDecode(token);
      } catch (e) {
        console.error('Invalid token format:', e);
        localStorage.clear();
        navigate('/');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao buscar dados do administrador.');
      } else {
        const data = await response.json();
        const dataWithRemovedLoggedUser = data.filter(item => item.id_pesquisador !== decodedToken.id);
        const sortedData = dataWithRemovedLoggedUser.sort((a, b) => a.id_pesquisador - b.id_pesquisador);
        setAdminData(sortedData);
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

    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setIsMasterAdmin(decoded.email === 'admin@admin.com');
      } catch (e) {}
    }

    fetch('http://localhost:3000/pesquisador/mensalidade')
      .then(r => r.json())
      .then(d => { setMensalidade(d.mensalidade); setNewMensalidade(d.mensalidade); })
      .catch(() => {});
  }, []);


  const handleMakeAdmin = async (pesquisadorId, currentAdminStatus) => {
    const newAdminStatus = !currentAdminStatus;
    try {
      let decodedToken;
      const token = localStorage.getItem('accessToken');
      try {
        decodedToken = jwtDecode(token);
      } catch (e) {
        console.error('Invalid token format:', e);
        localStorage.clear();
        navigate('/');
        return;
      }
      const response = await fetch(`http://localhost:3000/pesquisador/${pesquisadorId}/admin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_admin: newAdminStatus, user_id: decodedToken.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Falha ao ${newAdminStatus ? 'promover a admin' : 'remover como admin'}.`);
      }
      const updatedPesquisador = await response.json();
      setAdminData(prevData =>
        prevData.map(p =>
          p.id_pesquisador === updatedPesquisador.pesquisador.id_pesquisador
            ? { ...p, is_admin: updatedPesquisador.pesquisador.is_admin }
            : p
        ).sort((a, b) => a.id_pesquisador - b.id_pesquisador)
      );
    } catch (err) {
      console.error(`Erro ao ${newAdminStatus ? 'promover a admin' : 'remover como admin'}:`, err);
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userName');

    navigate('/');
  };

  const handleAddContributionClick = (pesquisadorId) => {
    setCurrentPesquisadorIdForContribution(pesquisadorId);
    setNewContribution({ valor: '', metodo: 'pix' });
    setShowContributionForm(true);
  };

  const handleContributionChange = (e) => {
    const { name, value } = e.target;
    setNewContribution(prev => ({ ...prev, [name]: value }));
  };

  const handleContributionSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      let decodedToken;
      const token = localStorage.getItem('accessToken');
      try {
        decodedToken = jwtDecode(token);
      } catch (e) {
        console.error('Invalid token format:', e);
        localStorage.clear();
        navigate('/');
        return;
      }
      const contributionData = { ...newContribution, data_pagamento: today, user_id: decodedToken.id };

      const response = await fetch(`http://localhost:3000/pesquisador/${currentPesquisadorIdForContribution}/contribuicao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(contributionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao adicionar contribuição.');
      }
      await fetchAdminData();
      setShowContributionForm(false);
      setCurrentPesquisadorIdForContribution(null);
      alert('Contribuição adicionada com sucesso!');
    } catch (err) {
      console.error('Erro ao adicionar contribuição:', err);
      setError(err.message);
    }
  };

  const handleSearch = () => {
    fetchAdminData(searchTerm);
  };

  const handleMensalidadeSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      const decoded = jwtDecode(token);
      const response = await fetch('http://localhost:3000/pesquisador/mensalidade', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ valor: Number(newMensalidade), user_id: decoded.id }),
      });
      if (!response.ok) {
        const err = await response.json();
        alert(err.error || 'Erro ao atualizar mensalidade.');
        return;
      }
      const data = await response.json();
      setMensalidade(data.mensalidade);
      alert('Mensalidade atualizada com sucesso!');
    } catch (err) {
      alert('Erro ao atualizar mensalidade.');
    }
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
      <h1>Painel Administrativo</h1>

      {isMasterAdmin && (
        <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px', maxWidth: '400px', margin: '0 auto 20px auto', textAlign: 'center' }}>
          <h3 style={{ marginTop: 0 }}>Valor da Mensalidade</h3>
          <p>Atual: <strong>R$ {mensalidade?.toFixed(2)}</strong></p>
          <form onSubmit={handleMensalidadeSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
            <input
              type="number"
              min="1"
              step="0.01"
              value={newMensalidade}
              onChange={e => setNewMensalidade(e.target.value)}
              required
              style={{ width: '100px', padding: '6px' }}
            />
            <button type="submit">Salvar</button>
          </form>
        </div>
      )}

      <button onClick={handleLogout} className="logout-button-fixed">
        Sair
      </button>

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
                <th>Nome</th>
                <th>Email</th>
                <th>Habilitado Até</th>
                <th>Status de Habilitação</th>
                <th>Admin</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {adminData.map((pesquisador) => {
                const enabledUntil = pesquisador.enabled_until;
                const isActive = enabledUntil && new Date(enabledUntil) > new Date();

                return (
                  <tr className="table-admin-row" key={pesquisador.id_pesquisador}>
                    <td>{pesquisador.nome}</td>
                    <td>{pesquisador.email}</td>
                    <td>{enabledUntil ? new Date(enabledUntil).toLocaleDateString("pt-BR") : '---'}</td>
                    <td>
                      {isActive
                        ? 'Ativo'
                        : 'Inativo'
                      }
                    </td>
                    <td>{pesquisador.is_admin ? 'Sim' : 'Não'}</td>
                    <td>
                      <button
                        onClick={() => handleMakeAdmin(pesquisador.id_pesquisador, pesquisador.is_admin)}
                        style={{ backgroundColor: pesquisador.is_admin ? '#ffc107' : '#17a2b8', marginLeft: '5px' }}
                        className="btn-admin-make-admin"
                      >
                        {pesquisador.is_admin ? 'Remover Admin' : 'Tornar Admin'}
                      </button>
                      <button
                        onClick={() => handleAddContributionClick(pesquisador.id_pesquisador)}
                        style={{ backgroundColor: '#007bff', marginLeft: '5px' }}
                        className="btn-admin-add-contribution"
                      >
                        Adicionar Contribuição
                      </button>
                      {showContributionForm && currentPesquisadorIdForContribution === pesquisador.id_pesquisador && (
                        <div className="contribution-form-container">
                          <h3>Adicionar Contribuição para {pesquisador.nome}</h3>
                          <form onSubmit={handleContributionSubmit}>
                            <div>
                              <label>Valor:</label>
                              <input
                                type="number"
                                name="valor"
                                value={newContribution.valor}
                                onChange={handleContributionChange}
                                required
                                min="0"
                                step="0.01"
                              />
                            </div>

                            <div>
                              <label>Método:</label>
                              <select
                                name="metodo"
                                value={newContribution.metodo}
                                onChange={handleContributionChange}
                                required
                              >
                                <option value="pix">PIX</option>
                                <option value="cartao_credito">Cartão de Crédito</option>
                                <option value="boleto">Boleto</option>
                                <option value="transferencia_bancaria">Transferência Bancária</option>
                              </select>
                            </div>
                            <button type="submit">Registrar Contribuição</button>
                            <button type="button" onClick={() => setShowContributionForm(false)}>Cancelar</button>
                          </form>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
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
