import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './ProfilePage.css';

const REQUIRED_FIELDS = {
  pos_graduacoes: { label: 'Pós-Graduações', fields: [['titulo', 'Título'], ['instituicao_nome', 'Instituição']] },
  publicacoes: { label: 'Publicações', fields: [['doi', 'DOI'], ['titulo', 'Título']] },
  redes_sociais: { label: 'Redes Sociais', fields: [['plataforma', 'Plataforma'], ['url', 'URL']] },
  vinculos: { label: 'Vínculos Institucionais', fields: [['instituicao_nome', 'Instituição'], ['tipo', 'Tipo de Vínculo'], ['nome_programa', 'Programa']] },
  grupos_pesquisa: { label: 'Grupos de Pesquisa', fields: [['nome', 'Nome'], ['descricao', 'Descrição'], ['instituicao_nome', 'Instituição'], ['link', 'Link']] },
  servicos: { label: 'Serviços', fields: [['nome', 'Nome'], ['cidade', 'Cidade'], ['estado', 'Estado']] },
  equipamentos: { label: 'Equipamentos', fields: [['nome', 'Nome'], ['cidade', 'Cidade'], ['estado', 'Estado']] },
};

const ENUM_LABELS = {
  primaria: 'Primário',
  secundario: 'Secundário',
  pos: 'Pós-Graduação',
  linkedin: 'LinkedIn',
  researchgate: 'ResearchGate',
  x: 'X (Twitter)',
  instagram: 'Instagram',
};

const enumLabel = (value) => ENUM_LABELS[value] || value;

function ProfilePage() {
  const navigate = useNavigate();
  const { userId } = useParams();

  const isUserLoggedIn = !!localStorage.getItem('userId');
  const loggedUserId = Number(localStorage.getItem('userId'));

  const [isEditing, setIsEditing] = useState(false);

  let canEdit = loggedUserId === Number(userId);

  const [userData, setUserData] = useState({
    name: '', email: '', phone: '', celular: '', link_lattes: '',
    paginas_institucionais: [''], laboratorio: '', nome_cidade: '', nome_estado: '',
    pq: false, sbfte: false, editor_revista: false,
    pos_graduacoes: [], publicacoes: [], redes_sociais: [], areas_pesquisa: [],
    vinculos: [], grupos_pesquisa: [], org_sociedades: [], disciplinas: [],
    revistas_editadas: [], servicos: [], equipamentos: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [invalidFields, setInvalidFields] = useState([]);

  const isInvalid = (key) => (invalidFields.includes(key) ? 'invalid-field' : undefined);

  const estadosBrasileiros = [
    'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal',
    'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul',
    'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí',
    'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia',
    'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/pesquisador/${userId}`);
        const fetchedData = response.data;

        setUserData({
          name: fetchedData.nome || '',
          email: fetchedData.email || '',
          celular: fetchedData.celular || '',
          link_lattes: fetchedData.link_lattes || '',
          nome_cidade: fetchedData.nome_cidade || '',
          nome_estado: fetchedData.nome_estado || '',
          paginas_institucionais: fetchedData.pagina_institucional ? [fetchedData.pagina_institucional] : [''],
          laboratorio: fetchedData.laboratorio || '',
          pq: fetchedData.pq || false,
          sbfte: fetchedData.sbfte || false,
          editor_revista: fetchedData.editor_revista || false,
          pos_graduacoes: fetchedData.pos_graduacoes || [],
          publicacoes: fetchedData.publicacoes || [],
          redes_sociais: fetchedData.redes_sociais || [],
          areas_pesquisa: fetchedData.areas_pesquisa || [],
          vinculos: fetchedData.vinculos || [],
          grupos_pesquisa: fetchedData.grupos_pesquisa || [],
          org_sociedades: fetchedData.org_sociedades || [],
          disciplinas: fetchedData.disciplinas || [],
          revistas_editadas: fetchedData.revistas_editadas || [],
          servicos: fetchedData.servicos ? fetchedData.servicos.map(serv => ({
            nome: serv.nome || '',
            descricao: serv.descricao || '',
            area: serv.area || '',
            tipo: serv.tipo || '',
            cidade: serv.cidade || '',
            estado: serv.estado || ''
          })) : [],
          equipamentos: fetchedData.equipamentos ? fetchedData.equipamentos.map(equip => ({
            nome: equip.nome || '',
            descricao_tecnica: equip.descricao_tecnica || '',
            cidade: equip.cidade || '',
            estado: equip.estado || ''
          })) : [],
        });
      } catch (err) {
        setError('Não foi possível carregar o perfil.');
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, navigate]);

  useEffect(() => {
    if (invalidFields.length === 0) return;
    const first = document.querySelector('.invalid-field');
    if (!first) return;
    first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    first.focus({ preventScroll: true });
  }, [invalidFields]);

  const toggleEditMode = (e) => {
    e.preventDefault();
    setIsEditing(!isEditing);
    setSuccessMessage('');
    setSaveError('');
    setInvalidFields([]);
  };

  const handleChange = (e) => {
    if (!canEdit) return;
    const { name, value, type, checked } = e.target;

    setUserData(prevData => {
      if (name === 'paginas_institucionais') {
        return { ...prevData, paginas_institucionais: [value] };
      } else {
        return { ...prevData, [name]: type === 'checkbox' ? checked : value };
      }
    });
  };

  const handleAddPosGraduacao = () => setUserData(p => ({ ...p, pos_graduacoes: [...p.pos_graduacoes, { titulo: '', instituicao_nome: '' }] }));
  const handleRemovePosGraduacao = (index) => setUserData(p => ({ ...p, pos_graduacoes: p.pos_graduacoes.filter((_, i) => i !== index) }));
  const handleChangePosGraduacao = (index, field, value) => setUserData(p => ({ ...p, pos_graduacoes: p.pos_graduacoes.map((item, i) => i === index ? { ...item, [field]: value } : item) }));

  const handleAddPublicacao = () => setUserData(p => ({ ...p, publicacoes: [...p.publicacoes, { doi: '', titulo: '' }] }));
  const handleRemovePublicacao = (index) => setUserData(p => ({ ...p, publicacoes: p.publicacoes.filter((_, i) => i !== index) }));
  const handleChangePublicacao = (index, field, value) => setUserData(p => ({ ...p, publicacoes: p.publicacoes.map((item, i) => i === index ? { ...item, [field]: value } : item) }));

  const handleAddRedeSocial = () => setUserData(p => ({ ...p, redes_sociais: [...p.redes_sociais, { plataforma: '', url: '' }] }));
  const handleRemoveRedeSocial = (index) => setUserData(p => ({ ...p, redes_sociais: p.redes_sociais.filter((_, i) => i !== index) }));
  const handleChangeRedeSocial = (index, field, value) => setUserData(p => ({ ...p, redes_sociais: p.redes_sociais.map((item, i) => i === index ? { ...item, [field]: value } : item) }));

  const handleAddAreaPesquisa = () => setUserData(p => ({ ...p, areas_pesquisa: [...p.areas_pesquisa, { descricao: '' }] }));
  const handleRemoveAreaPesquisa = (index) => setUserData(p => ({ ...p, areas_pesquisa: p.areas_pesquisa.filter((_, i) => i !== index) }));
  const handleChangeAreaPesquisa = (index, value) => setUserData(p => ({ ...p, areas_pesquisa: p.areas_pesquisa.map((item, i) => i === index ? { ...item, descricao: value } : item) }));

  const handleAddVinculo = () => setUserData(p => ({ ...p, vinculos: [...p.vinculos, { instituicao_nome: '', tipo: 'primaria', nome_programa: '' }] }));
  const handleRemoveVinculo = (index) => setUserData(p => ({ ...p, vinculos: p.vinculos.filter((_, i) => i !== index) }));
  const handleChangeVinculo = (index, field, value) => setUserData(p => ({ ...p, vinculos: p.vinculos.map((item, i) => i === index ? { ...item, [field]: value } : item) }));

  const handleAddGrupoPesquisa = () => setUserData(p => ({ ...p, grupos_pesquisa: [...p.grupos_pesquisa, { nome: '', descricao: '', instituicao_nome: '', link: '' }] }));
  const handleRemoveGrupoPesquisa = (index) => setUserData(p => ({ ...p, grupos_pesquisa: p.grupos_pesquisa.filter((_, i) => i !== index) }));
  const handleChangeGrupoPesquisa = (index, field, value) => setUserData(p => ({ ...p, grupos_pesquisa: p.grupos_pesquisa.map((item, i) => i === index ? { ...item, [field]: value } : item) }));

  const handleAddOrgSociedade = () => setUserData(p => ({ ...p, org_sociedades: [...p.org_sociedades, { nome: '' }] }));
  const handleRemoveOrgSociedade = (index) => setUserData(p => ({ ...p, org_sociedades: p.org_sociedades.filter((_, i) => i !== index) }));
  const handleChangeOrgSociedade = (index, value) => setUserData(p => ({ ...p, org_sociedades: p.org_sociedades.map((item, i) => i === index ? { ...item, nome: value } : item) }));

  const handleAddDisciplina = () => setUserData(p => ({ ...p, disciplinas: [...p.disciplinas, { descricao: '' }] }));
  const handleRemoveDisciplina = (index) => setUserData(p => ({ ...p, disciplinas: p.disciplinas.filter((_, i) => i !== index) }));
  const handleChangeDisciplina = (index, field, value) => setUserData(p => ({ ...p, disciplinas: p.disciplinas.map((item, i) => i === index ? { ...item, [field]: value } : item) }));

  const handleAddRevista = () => setUserData(p => ({ ...p, revistas_editadas: [...p.revistas_editadas, { titulo: '' }] }));
  const handleRemoveRevista = (index) => setUserData(p => ({ ...p, revistas_editadas: p.revistas_editadas.filter((_, i) => i !== index) }));
  const handleChangeRevista = (index, value) => setUserData(p => ({ ...p, revistas_editadas: p.revistas_editadas.map((item, i) => i === index ? { ...item, titulo: value } : item) }));

  const handleAddServico = () => setUserData(p => ({ ...p, servicos: [...p.servicos, { nome: '', descricao: '', area: '', tipo: '', cidade: '', estado: '' }] }));
  const handleRemoveServico = (index) => setUserData(p => ({ ...p, servicos: p.servicos.filter((_, i) => i !== index) }));
  const handleChangeServico = (index, field, value) => setUserData(p => ({ ...p, servicos: p.servicos.map((item, i) => i === index ? { ...item, [field]: value } : item) }));

  const handleAddEquipamento = () => setUserData(p => ({ ...p, equipamentos: [...p.equipamentos, { nome: '', descricao_tecnica: '', cidade: '', estado: '' }] }));
  const handleRemoveEquipamento = (index) => setUserData(p => ({ ...p, equipamentos: p.equipamentos.filter((_, i) => i !== index) }));
  const handleChangeEquipamento = (index, field, value) => setUserData(p => ({ ...p, equipamentos: p.equipamentos.map((item, i) => i === index ? { ...item, [field]: value } : item) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) return;

    try {
      setSaveError('');

      const invalidKeys = [];
      const problems = [];

      for (const [section, { label, fields }] of Object.entries(REQUIRED_FIELDS)) {
        userData[section].forEach((item, index) => {
          const empty = fields.filter(([field]) => !item[field]?.trim());
          if (empty.length === 0 || empty.length === fields.length) return;

          problems.push(`${label} ${index + 1}: ${empty.map(([, fieldLabel]) => fieldLabel).join(', ')}`);
          empty.forEach(([field]) => invalidKeys.push(`${section}-${index}-${field}`));
        });
      }

      if (invalidKeys.length > 0) {
        setInvalidFields(invalidKeys);
        alert(`Preencha os campos obrigatórios:\n\n${problems.map(p => `• ${p}`).join('\n')}`);
        return;
      }
      setInvalidFields([]);

      const payload = {
        nome: userData.name,
        email: userData.email,
        celular: userData.celular,
        link_lattes: userData.link_lattes,
        pagina_institucional: userData.paginas_institucionais[0] || '',
        laboratorio: userData.laboratorio,
        localidade: { nome_cidade: userData.nome_cidade, nome_estado: userData.nome_estado },
        pq: userData.pq,
        sbfte: userData.sbfte,
        editor_revista: userData.editor_revista,
        pos_graduacoes: userData.pos_graduacoes.filter(pg => pg.titulo !== '' && pg.instituicao_nome !== ''),
        publicacoes: userData.publicacoes.filter(pub => pub.doi !== '' && pub.titulo !== ''),
        redes_sociais: userData.redes_sociais.filter(rede => rede.plataforma !== '' && rede.url !== ''),
        areas_pesquisa: userData.areas_pesquisa.filter(area => area.descricao !== ''),
        vinculos: userData.vinculos.filter(vin => vin.instituicao_nome !== '' && vin.tipo !== '' && vin.nome_programa !== ''),
        grupos_pesquisa: userData.grupos_pesquisa.filter(grupo => grupo.nome !== '' && grupo.descricao !== '' && grupo.instituicao_nome !== '' && grupo.link !== ''),
        org_sociedades: userData.org_sociedades.filter(org => org.nome !== ''),
        disciplinas: userData.disciplinas.filter(disc => disc.descricao !== ''),
        revistas_editadas: userData.revistas_editadas.filter(rev => rev.titulo && rev.titulo.trim()),
        servicos: userData.servicos.filter(serv => serv.nome && serv.cidade && serv.estado),
        equipamentos: userData.equipamentos.filter(equip => equip.nome && equip.cidade && equip.estado),
      };

      await api.put(`/pesquisador/${loggedUserId}`, payload);
      setSuccessMessage('Perfil atualizado com sucesso!');
      setSaveError('');
      setIsEditing(false);
    } catch (err) {
      const message = err.response?.data?.error || err.response?.data?.message || 'Não foi possível atualizar o perfil.';
      setSaveError(message);
      console.error('Error updating profile:', err.response ? err.response.data : err.message);
    }
  };

  if (loading) return <div>Carregando perfil...</div>;
  if (error) return <div className="error-message">{error}</div>;

  const clearUserSession = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('isMasterAdmin');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
  };

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      clearUserSession();
      navigate('/');
    }
  };

  return (
    <div className="profile-page-container">
      <div className="profile-navigation-actions">
        {canEdit && (
          <button
            type="button"
            onClick={toggleEditMode}
            className={`edit-mode-button${isEditing ? ' editing' : ''}`}
          >
            {isEditing ? 'Cancelar Edição' : 'Editar Perfil'}
          </button>
        )}
        <button onClick={() => navigate('/main')} className="back-to-search-button">
          Voltar à busca
        </button>
        {isUserLoggedIn ? (
          <button onClick={handleLogout} className="logout-button-fixed">
            Sair
          </button>
        ) : (
          <button onClick={() => navigate('/')} className="login-button-fixed">
            Entrar
          </button>
        )}
      </div>

      <div className="profile-header">
        <h1 className="profile-title">{userData.name || 'Perfil do Pesquisador'}</h1>
      </div>
      {successMessage && <div className="success-message">{successMessage}</div>}
      {saveError && <div className="error-message">{saveError}</div>}
      <form
        onSubmit={handleSubmit}
        onChange={() => invalidFields.length > 0 && setInvalidFields([])}
        className="profile-form"
      >

        {/* --- Informacoes Pessoais --- */}
        <div className="form-section">
          <h2>Informações Pessoais</h2>
          <div className="form-group">
            <label htmlFor="name">Nome:</label>
            <p className="read-only-field">{userData.name}</p>
          </div>
          {userData.email && (
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <p className="read-only-field">{userData.email}</p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="nome_cidade">Cidade:</label>
            {isEditing ? (
              <input type="text" id="nome_cidade" name="nome_cidade" value={userData.nome_cidade || ''} onChange={handleChange} />
            ) : (
              <p className="read-only-field">{userData.nome_cidade || 'Não informado'}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="nome_estado">Estado:</label>
            {isEditing ? (
              <select id="nome_estado" name="nome_estado" value={userData.nome_estado || ''} onChange={handleChange}>
                <option value="">Selecione um estado</option>
                {estadosBrasileiros.map((estado) => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>
            ) : (
              <p className="read-only-field">{userData.nome_estado || 'Não informado'}</p>
            )}
          </div>
        </div>

        {/* ---  Links (Lattes) --- */}
        <div className="form-section">
          <h2>Links</h2>
          {isUserLoggedIn && (
            <div className="form-group">
              <label htmlFor="pagina_institucional">Página Institucional:</label>
              {isEditing ? (
                <input type="text" id="pagina_institucional" name="paginas_institucionais" value={userData.paginas_institucionais[0] || ''} onChange={handleChange} className="form-control" />
              ) : (
                <p className="read-only-field">{userData.paginas_institucionais[0] || 'Não informado'}</p>
              )}
            </div>
          )}
          <div className="form-group">
            <label htmlFor="link_lattes">Link Lattes:</label>
            {isEditing ? (
              <input type="text" id="link_lattes" name="link_lattes" value={userData.link_lattes} onChange={handleChange} />
            ) : (
              userData.link_lattes
                ? <a href={userData.link_lattes} target="_blank" rel="noreferrer" className="read-only-field link-field">{userData.link_lattes}</a>
                : <p className="read-only-field">Não informado</p>
            )}
          </div>
        </div>

        {/* --- Afiliacoes --- */}
        <div className="form-section">
          <h2>Afiliações</h2>
          <div className='afiliacoes'>
            {['pq', 'sbfte', 'editor_revista'].map(field => (
              <div className="form-group checkbox-group" key={field}>
                <input
                  type="checkbox"
                  id={field}
                  name={field}
                  checked={userData[field]}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
                <label htmlFor={field}>{field === 'pq' ? 'Pesquisador PQ' : field === 'sbfte' ? 'Membro SBFTE' : 'Editor de Revista'}</label>
              </div>
            ))}
          </div>

          {isEditing ? (
            <>
              {userData.revistas_editadas.map((rev, index) => (
                <div key={index} className="array-item-group">
                  <input value={rev.titulo || ''} onChange={(e) => handleChangeRevista(index, e.target.value)} placeholder="Nome da Revista" />
                  <button type="button" onClick={() => handleRemoveRevista(index)} className="remove-button">Remover</button>
                </div>
              ))}
              <button type="button" onClick={handleAddRevista} className="add-button">Adicionar Revista</button>
            </>
          ) : (
            userData.revistas_editadas.some(rev => rev.titulo) && (
              <div className="read-only-list">
                {userData.revistas_editadas.map((rev, index) => rev.titulo && (
                  <p key={index} className="read-only-field">{rev.titulo}</p>
                ))}
              </div>
            )
          )}
        </div>

        {/* ========================================================= */}
        {/* Secao Restrita, Requer LOGIN                       */}
        {/* ========================================================= */}

        {isUserLoggedIn && (
          <>
            <div className="form-section">
              <h2>Pós-Graduações</h2>
              {userData.pos_graduacoes.map((pg, index) => (
                <div key={index} className="pos-graduacao-item">
                  <div className="form-group">
                    <label>Título:</label>
                    {isEditing ? (
                      <input type="text" value={pg.titulo} onChange={(e) => handleChangePosGraduacao(index, 'titulo', e.target.value)} className={isInvalid(`pos_graduacoes-${index}-titulo`)} />
                    ) : (
                      <p className="read-only-field">{pg.titulo || 'Não informado'}</p>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Nome da Instituição:</label>
                    {isEditing ? (
                      <input type="text" value={pg.instituicao_nome} onChange={(e) => handleChangePosGraduacao(index, 'instituicao_nome', e.target.value)} className={isInvalid(`pos_graduacoes-${index}-instituicao_nome`)} />
                    ) : (
                      <p className="read-only-field">{pg.instituicao_nome || 'Não informado'}</p>
                    )}
                  </div>
                  {isEditing && (
                    <button type="button" onClick={() => handleRemovePosGraduacao(index)} className="remove-button">Remover</button>
                  )}
                </div>
              ))}
              {isEditing && (
                <button type="button" onClick={handleAddPosGraduacao} className="add-button">Adicionar Pós-Graduação</button>
              )}
            </div>

            <div className="form-section">
              <h2>Publicações</h2>
              {isEditing ? (
                <>
                  {userData.publicacoes.map((pub, index) => (
                    <div key={index} className="array-item-group">
                      <input type="text" value={pub.doi || ''} onChange={(e) => handleChangePublicacao(index, 'doi', e.target.value)} placeholder="DOI" className={isInvalid(`publicacoes-${index}-doi`)} />
                      <input type="text" value={pub.titulo || ''} onChange={(e) => handleChangePublicacao(index, 'titulo', e.target.value)} placeholder="Título" className={isInvalid(`publicacoes-${index}-titulo`)} />
                      <button type="button" onClick={() => handleRemovePublicacao(index)} className="remove-button">Remover</button>
                    </div>
                  ))}
                  <button type="button" onClick={handleAddPublicacao} className="add-button">Adicionar Publicação</button>
                </>
              ) : (
                <div className="read-only-list">
                  {userData.publicacoes.length > 0 ? userData.publicacoes.map((pub, index) => (
                    <p key={index} className="read-only-field">{`${pub.titulo || ''} (DOI: ${pub.doi || 'N/A'})`}</p>
                  )) : <p className="read-only-field">Não informado</p>}
                </div>
              )}
            </div>

            <div className="form-section">
              <h2>Redes Sociais</h2>
              {isEditing ? (
                <>
                  {userData.redes_sociais.map((rede, index) => (
                    <div key={index} className="array-item-group">
                      <select value={rede.plataforma || ''} onChange={(e) => handleChangeRedeSocial(index, 'plataforma', e.target.value)} className={isInvalid(`redes_sociais-${index}-plataforma`)}>
                        <option value="" disabled>Plataforma</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="researchgate">ResearchGate</option>
                        <option value="x">X (Twitter)</option>
                        <option value="instagram">Instagram</option>
                      </select>
                      <input type="url" value={rede.url || ''} onChange={(e) => handleChangeRedeSocial(index, 'url', e.target.value)} placeholder="URL" className={isInvalid(`redes_sociais-${index}-url`)} />
                      <button type="button" onClick={() => handleRemoveRedeSocial(index)} className="remove-button">Remover</button>
                    </div>
                  ))}
                  <button type="button" onClick={handleAddRedeSocial} className="add-button">Adicionar Rede Social</button>
                </>
              ) : (
                <div className="read-only-list">
                  {userData.redes_sociais.length > 0 ? userData.redes_sociais.map((rede, index) => (
                    <p key={index} className="read-only-field">{`${enumLabel(rede.plataforma)}: ${rede.url}`}</p>
                  )) : <p className="read-only-field">Não informado</p>}
                </div>
              )}
            </div>

            <div className="form-section">
              <h2>Áreas de Pesquisa</h2>
              {isEditing ? (
                <>
                  {userData.areas_pesquisa.map((area, index) => (
                    <div key={index} className="array-item-group">
                      <input type="text" value={area.descricao || ''} onChange={(e) => handleChangeAreaPesquisa(index, e.target.value)} placeholder="Descrição" />
                      <button type="button" onClick={() => handleRemoveAreaPesquisa(index)} className="remove-button">Remover</button>
                    </div>
                  ))}
                  <button type="button" onClick={handleAddAreaPesquisa} className="add-button">Adicionar Área</button>
                </>
              ) : (
                <div className="read-only-list">
                  {userData.areas_pesquisa.length > 0 ? userData.areas_pesquisa.map((area, index) => (
                    <p key={index} className="read-only-field">{area.descricao}</p>
                  )) : <p className="read-only-field">Não informado</p>}
                </div>
              )}
            </div>

            <div className="form-section">
              <h2>Vínculos Institucionais</h2>
              {isEditing ? (
                <>
                  {userData.vinculos.map((vinculo, index) => (
                    <div key={index} className="array-item-group">
                      <input type="text" value={vinculo.instituicao_nome || ''} onChange={(e) => handleChangeVinculo(index, 'instituicao_nome', e.target.value)} placeholder="Instituição" className={isInvalid(`vinculos-${index}-instituicao_nome`)} />
                      <select value={vinculo.tipo || ''} onChange={(e) => handleChangeVinculo(index, 'tipo', e.target.value)} className={isInvalid(`vinculos-${index}-tipo`)}>
                        <option value="" disabled>Tipo de Vínculo</option>
                        <option value="primaria">Primário</option>
                        <option value="secundario">Secundário</option>
                        <option value="pos">Pós-Graduação</option>
                      </select>
                      <input type="text" value={vinculo.nome_programa || ''} onChange={(e) => handleChangeVinculo(index, 'nome_programa', e.target.value)} placeholder="Programa" className={isInvalid(`vinculos-${index}-nome_programa`)} />
                      <button type="button" onClick={() => handleRemoveVinculo(index)} className="remove-button">Remover</button>
                    </div>
                  ))}
                  <button type="button" onClick={handleAddVinculo} className="add-button">Adicionar Vínculo</button>
                </>
              ) : (
                <div className="read-only-list">
                  {userData.vinculos.length > 0 ? userData.vinculos.map((vinculo, index) => (
                    <p key={index} className="read-only-field">{`${vinculo.instituicao_nome} - ${enumLabel(vinculo.tipo)} (${vinculo.nome_programa})`}</p>
                  )) : <p className="read-only-field">Não informado</p>}
                </div>
              )}
            </div>

            <div className="form-section">
              <h2>Grupos de Pesquisa</h2>
              {isEditing ? (
                <>
                  {userData.grupos_pesquisa.map((grupo, index) => (
                    <div key={index} className="array-item-group">
                      <input type="text" value={grupo.nome || ''} onChange={(e) => handleChangeGrupoPesquisa(index, 'nome', e.target.value)} placeholder="Nome" className={isInvalid(`grupos_pesquisa-${index}-nome`)} />
                      <textarea value={grupo.descricao || ''} onChange={(e) => handleChangeGrupoPesquisa(index, 'descricao', e.target.value)} placeholder="Descrição" className={isInvalid(`grupos_pesquisa-${index}-descricao`)} />
                      <input type="text" value={grupo.instituicao_nome || ''} onChange={(e) => handleChangeGrupoPesquisa(index, 'instituicao_nome', e.target.value)} placeholder="Instituição" className={isInvalid(`grupos_pesquisa-${index}-instituicao_nome`)} />
                      <input type="url" value={grupo.link || ''} onChange={(e) => handleChangeGrupoPesquisa(index, 'link', e.target.value)} placeholder="Link" className={isInvalid(`grupos_pesquisa-${index}-link`)} />
                      <button type="button" onClick={() => handleRemoveGrupoPesquisa(index)} className="remove-button">Remover</button>
                    </div>
                  ))}
                  <button type="button" onClick={handleAddGrupoPesquisa} className="add-button">Adicionar Grupo</button>
                </>
              ) : (
                <div className="read-only-list">
                  {userData.grupos_pesquisa.length > 0 ? userData.grupos_pesquisa.map((grupo, index) => (
                    <p key={index} className="read-only-field">{`${grupo.nome} (${grupo.instituicao_nome})`}</p>
                  )) : <p className="read-only-field">Não informado</p>}
                </div>
              )}
            </div>

            <div className="form-section">
              <h2>Sociedades</h2>
              {isEditing ? (
                <>
                  {userData.org_sociedades.map((org, index) => (
                    <div key={index} className="array-item-group">
                      <input type="text" value={org.nome || ''} onChange={(e) => handleChangeOrgSociedade(index, e.target.value)} placeholder="Nome" />
                      <button type="button" onClick={() => handleRemoveOrgSociedade(index)} className="remove-button">Remover</button>
                    </div>
                  ))}
                  <button type="button" onClick={handleAddOrgSociedade} className="add-button">Adicionar Organização</button>
                </>
              ) : (
                <div className="read-only-list">
                  {userData.org_sociedades.length > 0 ? userData.org_sociedades.map((org, index) => (
                    <p key={index} className="read-only-field">{org.nome}</p>
                  )) : <p className="read-only-field">Não informado</p>}
                </div>
              )}
            </div>

            <div className="form-section">
              <h2>Disciplinas Lecionadas</h2>
              {isEditing ? (
                <>
                  {userData.disciplinas.map((disc, index) => (
                    <div key={index} className="array-item-group">
                      <textarea value={disc.descricao || ''} onChange={(e) => handleChangeDisciplina(index, 'descricao', e.target.value)} placeholder="Disciplina" />
                      <button type="button" onClick={() => handleRemoveDisciplina(index)} className="remove-button">Remover</button>
                    </div>
                  ))}
                  <button type="button" onClick={handleAddDisciplina} className="add-button">Adicionar Disciplina</button>
                </>
              ) : (
                <div className="read-only-list">
                  {userData.disciplinas.length > 0 ? userData.disciplinas.map((disc, index) => (
                    <p key={index} className="read-only-field">{disc.descricao}</p>
                  )) : <p className="read-only-field">Não informado</p>}
                </div>
              )}
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* FIM SECAO RESTRITA             */}
        {/* ========================================================= */}

        {/* --- Servicos --- */}
        <div className="form-section">
          <h2>Serviços</h2>
          {isEditing ? (
            <>
              {userData.servicos.map((serv, index) => (
                <div key={index} className="array-item-group">
                  <input type="text" value={serv.nome || ''} onChange={(e) => handleChangeServico(index, 'nome', e.target.value)} placeholder="Nome" className={isInvalid(`servicos-${index}-nome`)} />
                  <input value={serv.descricao || ''} onChange={(e) => handleChangeServico(index, 'descricao', e.target.value)} placeholder="Descrição" />
                  <input type="text" value={serv.area || ''} onChange={(e) => handleChangeServico(index, 'area', e.target.value)} placeholder="Área" />
                  <input type="text" value={serv.tipo || ''} onChange={(e) => handleChangeServico(index, 'tipo', e.target.value)} placeholder="Tipo" />
                  <input type="text" value={serv.cidade || ''} onChange={(e) => handleChangeServico(index, 'cidade', e.target.value)} placeholder="Cidade" className={isInvalid(`servicos-${index}-cidade`)} />
                  <select value={serv.estado || ''} onChange={(e) => handleChangeServico(index, 'estado', e.target.value)} className={isInvalid(`servicos-${index}-estado`)}>
                    <option value="">Estado</option>
                    {estadosBrasileiros.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                  <button type="button" onClick={() => handleRemoveServico(index)} className="remove-button">Remover</button>
                </div>
              ))}
              <button type="button" onClick={handleAddServico} className="add-button">Adicionar Serviço</button>
            </>
          ) : (
            <div className="read-only-list">
              {userData.servicos.length > 0 ? userData.servicos.map((serv, index) => (
                <p key={index} className="read-only-field">
                  {`${serv.nome} (${serv.tipo}) - ${serv.area}`} <br />
                  <small>{serv.cidade ? `${serv.cidade}` : ''}{serv.cidade && serv.estado ? ' - ' : ''}{serv.estado ? `${serv.estado}` : ''}</small> <br />
                  {serv.descricao}
                </p>
              )) : <p className="read-only-field">Não informado</p>}
            </div>
          )}
        </div>

        {/* --- Equipamentos --- */}
        <div className="form-section">
          <h2>Equipamentos</h2>
          {isEditing ? (
            <>
              {userData.equipamentos.map((equip, index) => (
                <div key={index} className="array-item-group">
                  <input type="text" value={equip.nome || ''} onChange={(e) => handleChangeEquipamento(index, 'nome', e.target.value)} placeholder="Nome" className={isInvalid(`equipamentos-${index}-nome`)} />
                  <input value={equip.descricao_tecnica || ''} onChange={(e) => handleChangeEquipamento(index, 'descricao_tecnica', e.target.value)} placeholder="Descrição" />
                  <input type="text" value={equip.cidade || ''} onChange={(e) => handleChangeEquipamento(index, 'cidade', e.target.value)} placeholder="Cidade" className={isInvalid(`equipamentos-${index}-cidade`)} />
                  <select value={equip.estado || ''} onChange={(e) => handleChangeEquipamento(index, 'estado', e.target.value)} className={isInvalid(`equipamentos-${index}-estado`)}>
                    <option value="">Estado</option>
                    {estadosBrasileiros.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                  <button type="button" onClick={() => handleRemoveEquipamento(index)} className="remove-button">Remover</button>
                </div>
              ))}
              <button type="button" onClick={handleAddEquipamento} className="add-button">Adicionar Equipamento</button>
            </>
          ) : (
            <div className="read-only-list">
              {userData.equipamentos.length > 0 ? userData.equipamentos.map((equip, index) => (
                <p key={index} className="read-only-field">
                  {`${equip.nome}`} <br />
                  <small>{equip.cidade ? `${equip.cidade}` : ''}{equip.cidade && equip.estado ? ' - ' : ''}{equip.estado ? `${equip.estado}` : ''}</small> <br />
                  {equip.descricao_tecnica}
                </p>
              )) : <p className="read-only-field">Não informado</p>}
            </div>
          )}
        </div>

        {canEdit && isEditing && (
          <button
            type="submit"
            disabled={loading}
            className="profile-button"
          >
            {loading ? 'Atualizando...' : 'Salvar Alterações'}
          </button>
        )}
      </form>
    </div>
  );
}

export default ProfilePage;
