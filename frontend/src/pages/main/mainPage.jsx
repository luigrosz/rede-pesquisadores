import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './mainStyles.css';

function MainPage() {
  const navigate = useNavigate();

  const isLoggedIn = !!localStorage.getItem('userId');
  const [loggedInUserName] = useState(localStorage.getItem('userName') || '');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchSubscription = async () => {
      try {
        const id = localStorage.getItem('userId');
        if (isAdmin) { setSubscriptionInfo({ isAdmin: true }); return; }
        const res = await fetch(`http://localhost:3000/pesquisador/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        setSubscriptionInfo({ isAdmin: false, enabledUntil: data.enabled_until || null });
      } catch (e) {
        console.error(e);
      }
    };
    fetchSubscription();
  }, [isLoggedIn, isAdmin]);

  const getSubscriptionLabel = () => {
    if (!subscriptionInfo) return null;
    if (subscriptionInfo.isAdmin) return { text: 'Administrador', color: '#6f42c1' };
    if (!subscriptionInfo.enabledUntil) return { text: 'Assinatura expirada', color: '#dc3545' };
    const diff = new Date(subscriptionInfo.enabledUntil) - new Date();
    if (diff <= 0) return { text: 'Assinatura expirada', color: '#dc3545' };
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    const color = days <= 7 ? '#fd7e14' : '#198754';
    return { text: `Assinatura expira em ${days} dia${days !== 1 ? 's' : ''}`, color };
  };

  const [activeTab, setActiveTab] = useState('pesquisadores'); // 'pesquisadores' | 'servicos'

  const estados = [
    'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal',
    'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul',
    'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí',
    'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia',
    'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'
  ];

  // tab pesquisadores
  const [stateFilter, setStateFilter] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('');
  const [nameSearchTerm, setNameSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [isSBFTEChecked, setIsSBFTEChecked] = useState(false);
  const [societyText, setSocietyText] = useState('');
  const [drAreaFilter, setDrAreaFilter] = useState('');
  const [postgradProgramFilter, setPostgradProgramFilter] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState('');
  const [isPesquisadorPQFilter, setIsPesquisadorPQFilter] = useState(false);

  // tab servicos
  const [equipmentFilter, setEquipmentsFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');

  const [searchResults, setSearchResults] = useState([]);

  const handleStateChange = (event) => setStateFilter(event.target.value);
  const handleInstitutionChange = (event) => setInstitutionFilter(event.target.value);
  const handleNameSearchChange = (event) => setNameSearchTerm(event.target.value);
  const handleAreaChange = (event) => setAreaFilter(event.target.value);
  const handleSBFTEChange = (event) => setIsSBFTEChecked(event.target.checked);
  const handleSocietyTextChange = (event) => setSocietyText(event.target.value);
  const handleDrAreaChange = (event) => setDrAreaFilter(event.target.value);
  const handlePostgradProgramChange = (event) => setPostgradProgramFilter(event.target.value);
  const handleDisciplineChange = (event) => setDisciplineFilter(event.target.value);
  const handlePesquisadorPQChange = (event) => setIsPesquisadorPQFilter(event.target.checked);
  const handleEquipmentsChange = (event) => setEquipmentsFilter(event.target.value);
  const handleServiceChange = (event) => setServiceFilter(event.target.value);

  const handleTabSwitch = (newTab) => {
    if (activeTab === newTab) return;

    setActiveTab(newTab);

    setNameSearchTerm('');
    setInstitutionFilter('');
    setStateFilter('');
    setAreaFilter('');
    setDrAreaFilter('');
    setPostgradProgramFilter('');
    setDisciplineFilter('');
    setSocietyText('');
    setEquipmentsFilter('');
    setServiceFilter('');
    setIsPesquisadorPQFilter(false);
    setIsSBFTEChecked(false);

    setSearchResults([]);
  };

  const handleSearch = async () => {
    const searchBody = {};

    if (nameSearchTerm) searchBody.nome = nameSearchTerm;
    if (stateFilter) searchBody.estado = stateFilter;

    if (activeTab === 'pesquisadores') {
      if (institutionFilter) searchBody.instituicao = institutionFilter;
    }

    if (isLoggedIn) {
      if (activeTab === 'pesquisadores') {
        if (areaFilter) searchBody.area = areaFilter;
        if (societyText) searchBody.sociedade = societyText;
        if (drAreaFilter) searchBody.area_doutorado = drAreaFilter;
        if (postgradProgramFilter) searchBody.programa_de_pos = postgradProgramFilter;
        if (disciplineFilter) searchBody.disciplina = disciplineFilter;
        if (isPesquisadorPQFilter) searchBody.pesquisador_pq = true;
        if (isSBFTEChecked) searchBody.sbfte = true;
      }
    }

    if (activeTab === 'servicos') {
      if (equipmentFilter) searchBody.equipamento = equipmentFilter;
      if (serviceFilter) searchBody.servico = serviceFilter;
    }

    const url = `http://localhost:3000/pesquisador/pesquisar/ativos`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Erro ao buscar pesquisadores:', error);
      setSearchResults([]);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPesquisador, setSelectedPesquisador] = useState(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const emailTemplates = [
    { id: '1', name: 'Colaboração de Pesquisa', subject: 'Proposta de Colaboração em Pesquisa', body: 'Prezado(a) Professor(a) [Nome do Pesquisador],\n\nEscrevo para expressar meu interesse em colaborar em sua área de pesquisa...\n\nAtenciosamente, [Seu Nome]' },
    { id: '2', name: 'Consulta Geral', subject: 'Consulta sobre Publicação/Trabalho', body: 'Prezado(a) Professor(a) [Nome do Pesquisador],\n\nEstou entrando em contato a respeito de seu trabalho publicado sobre [Tema]. Gostaria de perguntar...\n\nAtenciosamente, [Seu Nome]' },
  ];

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPesquisador(null);
    setEmailSubject('');
    setEmailBody('');
    setSelectedTemplate('');
  };

  const handleSendEmailClick = (pesquisador) => {
    setSelectedPesquisador(pesquisador);
    setIsModalOpen(true);
  };

  const handleTemplateChange = (event) => {
    const templateId = event.target.value;
    setSelectedTemplate(templateId);

    if (templateId) {
      const template = emailTemplates.find(t => t.id === templateId);
      if (template && selectedPesquisador) {
        let populatedBody = template.body.replace('[Nome do Pesquisador]', selectedPesquisador.nome);
        populatedBody = populatedBody.replace('[Seu Nome]', loggedInUserName);
        setEmailSubject(template.subject);
        setEmailBody(populatedBody);
      }
    } else {
      setEmailSubject('');
      setEmailBody('');
    }
  };

  const handleSend = async () => {
    if (!emailSubject || !emailBody) {
      alert('Por favor, preencha o assunto e o corpo do e-mail.');
      return;
    }

    setIsSendingEmail(true);

    const emailData = {
      recipientEmail: selectedPesquisador.email,
      subject: emailSubject,
      body: emailBody
    };

    try {
      const response = await fetch('http://localhost:3000/mail/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(emailData),
      });

      if (response.ok) {
        alert(`E-mail enviado com sucesso para ${selectedPesquisador.nome}!`);
        closeModal();
      } else {
        const errorData = await response.json();
        alert(`Erro ao enviar e-mail: ${errorData.error || 'Erro desconhecido.'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao tentar enviar o e-mail.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleAuthAction = async () => {
    if (isLoggedIn) {
      await fetch('http://localhost:3000/auth/logout', { method: 'POST', credentials: 'include' });
      localStorage.removeItem('userId');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      window.location.reload();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="main-page-container">
      <button
        onClick={handleAuthAction}
        className={isLoggedIn ? "logout-button-fixed" : "login-button-fixed"}
      >
        {isLoggedIn ? "Sair" : "Entrar"}
      </button>
      <div className="main-page-header">
        <h1>Busca de Pesquisadores</h1>
        {isLoggedIn && getSubscriptionLabel() && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
            <span style={{ fontSize: '0.9rem', color: getSubscriptionLabel().color, fontWeight: 'bold' }}>
              {getSubscriptionLabel().text}
            </span>
            {isAdmin && (
              <button onClick={() => navigate('/admin')} style={{ backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '5px', padding: '6px 14px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
                Painel Admin
              </button>
            )}
          </div>
        )}
      </div>

      <div className="filters-section">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
          <button
            onClick={() => handleTabSwitch('pesquisadores')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'pesquisadores' ? '#007bff' : '#f0f0f0',
              color: activeTab === 'pesquisadores' ? 'white' : 'black',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Pesquisadores
          </button>
          <button
            onClick={() => handleTabSwitch('servicos')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'servicos' ? '#007bff' : '#f0f0f0',
              color: activeTab === 'servicos' ? 'white' : 'black',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Serviços e Equipamentos
          </button>
        </div>

        <div className="filters-grid">

          {/* ============================================= */}
          {/* TAB 1: PESQUISADORES      */}
          {/* ============================================= */}
          {activeTab === 'pesquisadores' && (
            <>
              <div className="filter-item">
                <label htmlFor="nameSearch">Nome:</label>
                <input id="nameSearch" type="text" value={nameSearchTerm} onChange={handleNameSearchChange} />
              </div>

              <div className="filter-item">
                <label htmlFor="institutionFilter">Instituição:</label>
                <input id="institutionFilter" type="text" value={institutionFilter} onChange={handleInstitutionChange} />
              </div>

              <div className="filter-item">
                <label htmlFor="stateFilter">Estado:</label>
                <select id="stateFilter" value={stateFilter} onChange={handleStateChange}>
                  <option value="">Todos os Estados</option>
                  {estados.map((state) => <option key={state} value={state}>{state}</option>)}
                </select>
              </div>

              {isLoggedIn && (
                <>
                  <div className="filter-item">
                    <label htmlFor="areaFilter">Área:</label>
                    <input id="areaFilter" type="text" value={areaFilter} onChange={handleAreaChange} />
                  </div>
                  <div className="filter-item">
                    <label htmlFor="drAreaFilter">Área de Doutorado:</label>
                    <input id="drAreaFilter" type="text" value={drAreaFilter} onChange={handleDrAreaChange} />
                  </div>
                  <div className="filter-item">
                    <label htmlFor="postgradProgramFilter">Programa de Pós:</label>
                    <input id="postgradProgramFilter" type="text" value={postgradProgramFilter} onChange={handlePostgradProgramChange} />
                  </div>
                  <div className="filter-item">
                    <label htmlFor="disciplineFilter">Disciplina:</label>
                    <input id="disciplineFilter" type="text" value={disciplineFilter} onChange={handleDisciplineChange} />
                  </div>
                  <div className="filter-item">
                    <label htmlFor="society">Sociedade:</label>
                    <input id="society" type="text" value={societyText} onChange={handleSocietyTextChange} />
                  </div>
                  <div className="filter-checkbox-group">
                    <input id="isPesquisadorPQFilter" type="checkbox" checked={isPesquisadorPQFilter} onChange={handlePesquisadorPQChange} />
                    <label htmlFor="isPesquisadorPQFilter">Pesquisador PQ</label>
                  </div>
                  <div className="filter-checkbox-group">
                    <input id="sbfteCheckbox" type="checkbox" checked={isSBFTEChecked} onChange={handleSBFTEChange} />
                    <label htmlFor="sbfteCheckbox">SBFTE</label>
                  </div>
                </>
              )}
            </>
          )}

          {/* ============================================= */}
          {/* TAB 2: SERVIÇOS E EQUIPAMENTOS                */}
          {/* ============================================= */}
          {activeTab === 'servicos' && (
            <>
              {/* Nome & Estado  */}
              <div className="filter-item">
                <label htmlFor="nameSearch">Nome:</label>
                <input id="nameSearch" type="text" value={nameSearchTerm} onChange={handleNameSearchChange} />
              </div>

              <div className="filter-item">
                <label htmlFor="stateFilter">Estado:</label>
                <select id="stateFilter" value={stateFilter} onChange={handleStateChange}>
                  <option value="">Todos os Estados</option>
                  {estados.map((state) => <option key={state} value={state}>{state}</option>)}
                </select>
              </div>

              {/* Servico e Equipamento */}
              <div className="filter-item">
                <label htmlFor="serviceFilter">Serviço:</label>
                <input id="serviceFilter" type="text" value={serviceFilter} onChange={handleServiceChange} />
              </div>
              <div className="filter-item">
                <label htmlFor="equipmentFilter">Equipamento:</label>
                <input id="equipmentFilter" type="text" value={equipmentFilter} onChange={handleEquipmentsChange} />
              </div>
            </>
          )}

        </div>
      </div>
      <div className="search-actions">
        <button onClick={handleSearch}>Buscar Pesquisadores</button>
      </div>

      {searchResults.length > 0 && (
        <div className="search-results-section">
          {searchResults.map((pesquisador) => (
            <div key={pesquisador.id_pesquisador} className="researcher-card">
              <h3>{pesquisador.nome}</h3>
              <p><strong>Estado:</strong> {pesquisador.nome_estado}</p>

              {isLoggedIn && (
                <>
                  <p><strong>Área de Doutorado:</strong> {pesquisador.area_doutorado_titulo || 'N/A'}</p>
                  {pesquisador.disciplina_titulo && <p><strong>Disciplina:</strong> {pesquisador.disciplina_titulo}</p>}
                  {pesquisador.programa_de_pos_titulo && <p><strong>Programa de Pós:</strong> {pesquisador.programa_de_pos_titulo}</p>}
                </>
              )}
              <div className="researcher-actions">
                <button onClick={() => navigate(`/profile/${pesquisador.id_pesquisador}`)}>Ver Perfil</button>
                <button onClick={() => handleSendEmailClick(pesquisador)}>Enviar E-mail</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && selectedPesquisador && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white', padding: '20px', borderRadius: '8px',
            width: '90%', maxWidth: '500px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h2>Enviar E-mail para {selectedPesquisador.nome}</h2>
            <p>Destinatário: <strong>{selectedPesquisador.email}</strong></p>

            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="templateSelect" style={{ display: 'block', marginBottom: '5px' }}>
                Selecionar Modelo:
              </label>
              <select
                id="templateSelect"
                value={selectedTemplate}
                onChange={handleTemplateChange}
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="">E-mail Personalizado</option>
                {emailTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="emailSubject" style={{ display: 'block', marginBottom: '5px' }}>
                Assunto:
              </label>
              <input
                id="emailSubject"
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Insira o assunto do e-mail"
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="emailBody" style={{ display: 'block', marginBottom: '5px' }}>
                Corpo do E-mail:
              </label>
              <textarea
                id="emailBody"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Digite a mensagem..."
                data-1p-ignore
                style={{
                  padding: '8px',
                  boxSizing: 'border-box',
                  width: '100%',
                  height: '150px',
                  resize: 'none',
                  autoComplete: "off",
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={closeModal} style={{ padding: '10px 15px', backgroundColor: '#ccc' }}>
                Cancelar
              </button>
              <button
                onClick={handleSend}
                disabled={isSendingEmail}
                style={{
                  padding: '10px 15px',
                  backgroundColor: isSendingEmail ? '#99c2ff' : '#007bff',
                  color: 'white',
                  cursor: isSendingEmail ? 'not-allowed' : 'pointer',
                  opacity: isSendingEmail ? 0.7 : 1
                }}
              >
                {isSendingEmail ? 'Enviando...' : 'Enviar E-mail'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainPage;
