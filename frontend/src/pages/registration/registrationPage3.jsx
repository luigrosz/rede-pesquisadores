import { useState } from 'react';
import './registrationStyles.css';
import { useNavigate, useParams } from 'react-router-dom';
import { putPesquisador } from '../../reqs/comms';

function RegistrationPage3() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    paginas_institucionais: [''],
    grupos_pesquisa: [{ nome: '', descricao: '', instituicao_nome: '', link: '' }],
    pq: false,
    sbfte: false,
    publicacoes: [{ doi: '', titulo: '' }],
    editor_revista: false,
    revistas_editadas: [''],
    redes_sociais: [{ plataforma: 'linkedin', url: '' }],
    org_sociedades: [''],
  });

  const handleSimpleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleListChange = (index, event, listName) => {
    const { name, value } = event.target;
    const list = [...formData[listName]];
    if (typeof list[index] === 'object' && list[index] !== null) {
      list[index][name] = value;
    } else {
      list[index] = value;
    }
    setFormData(prev => ({ ...prev, [listName]: list }));
  };

  const handleGrupoPesquisaChange = (index, e) => {
    const { name, value } = e.target;
    const updatedGrupos = formData.grupos_pesquisa.map((grupo, i) =>
      i === index ? { ...grupo, [name]: value } : grupo
    );
    setFormData(prev => ({ ...prev, grupos_pesquisa: updatedGrupos }));
  };

  const addListItem = (listName, newItem) => {
    setFormData(prev => ({
      ...prev,
      [listName]: [...prev[listName], newItem]
    }));
  };

  const updateListItem = (listName, index, field, value) => {
    setFormData(prev => ({
      ...prev,
      [listName]: prev[listName].map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeListItem = (index, listName) => {
    const list = [...formData[listName]];
    list.splice(index, 1);
    setFormData(prev => ({ ...prev, [listName]: list }));
  };

  const handleFinish = () => {
    alert('Cadastro concluído! Você pode completar seu perfil a qualquer momento.');
    navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      pagina_institucional: formData.paginas_institucionais.filter(p => p !== '').join('; '),
      pq: formData.pq,
      sbfte: formData.sbfte,
      editor_revista: formData.editor_revista,

      grupos_pesquisa: formData.grupos_pesquisa
        .filter(g => g.nome !== '' && g.instituicao_nome !== '' && g.link !== '')
        .map(g => ({ nome: g.nome, descricao: g.descricao, instituicao_nome: g.instituicao_nome, link: g.link })),

      publicacoes: formData.publicacoes.filter(p => p.doi !== '' || p.titulo !== ''),
      redes_sociais: formData.redes_sociais.filter(r => r.url !== ''),
      org_sociedades: formData.org_sociedades.filter(o => o !== '').map(o => ({ nome: o })),
    };

    try {
      const response = await putPesquisador(id, payload);
      const data = await response.json();

      if (response.ok) {
        alert('Cadastro concluído com sucesso!');
        navigate('/');
      } else {
        alert(`Erro ao salvar: ${data.error || data.details}`);
      }
    } catch (error) {
      console.error("Erro ao enviar dados:", error);
      alert("Ocorreu um erro ao tentar salvar. Tente novamente mais tarde.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="registration-container">
      <form onSubmit={handleSubmit} className="registration-form-card">
        <header className="registration-header">
          <h1>Cadastro - Etapa 3 de 3</h1>
          <button type="button" onClick={handleFinish}>Finalizar Depois</button>
        </header>

        <div className="step-indicator">
          <div className="step completed">1</div>
          <div className="step-line completed"></div>
          <div className="step completed">2</div>
          <div className="step-line completed"></div>
          <div className="step active">3</div>
        </div>

        <p className="registration-intro">
          Última etapa! Adicione informações sobre suas atividades profissionais e redes sociais. Todas as informações são opcionais.
        </p>

        {/* Grupos de Pesquisa */}
        <fieldset>
          <legend>Grupos de Pesquisa</legend>
          {formData.grupos_pesquisa.map((grupo, index) => (
            <div key={index} className="dynamic-list-item-column">
              <label>Nome do Grupo</label>
              <input
                name="nome"
                value={grupo.nome}
                onChange={(e) => handleGrupoPesquisaChange(index, e)}
                placeholder="Ex: Grupo de Pesquisa em Nanotecnologia"
              />
              <label>Descrição</label>
              <textarea
                name="descricao"
                value={grupo.descricao}
                onChange={(e) => handleGrupoPesquisaChange(index, e)}
                placeholder="Breve descrição do grupo"
              />
              <label>Instituição do Grupo</label>
              <input
                name="instituicao_nome"
                value={grupo.instituicao_nome}
                onChange={(e) => handleGrupoPesquisaChange(index, e)}
                placeholder="Ex: Universidade Federal"
              />
              <label>Link do Grupo</label>
              <input
                name="link"
                type="url"
                value={grupo.link}
                onChange={(e) => handleGrupoPesquisaChange(index, e)}
                placeholder="http://link-do-grupo.org"
              />
              {formData.grupos_pesquisa.length > 1 && (
                <button type="button" className="remove-btn" onClick={() => removeListItem(index, 'grupos_pesquisa')}>Remover Grupo</button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="add-btn"
            onClick={() => addListItem('grupos_pesquisa', { nome: '', descricao: '', instituicao_nome: '', link: '' })}
          >
            Adicionar Grupo de Pesquisa
          </button>
        </fieldset>

        {/* Afiliações e Membros */}
        <fieldset>
          <legend>Afiliações e Membros</legend>
          <div className="form-group checkbox-group"><input type="checkbox" id="pq" name="pq" checked={formData.pq} onChange={handleSimpleChange} /><label htmlFor="pq">É pesquisador PQ (CNPq)?</label></div>
          <div className="form-group checkbox-group"><input type="checkbox" id="sbfte" name="sbfte" checked={formData.sbfte} onChange={handleSimpleChange} /><label htmlFor="sbfte">É membro da SBFTE?</label></div>

          <div className="subsection-title">Sociedades e Organizações</div>
          {formData.org_sociedades.map((org, index) => (
            <div key={index} className="dynamic-list-item">
              <input
                value={org}
                onChange={(e) => handleListChange(index, e, 'org_sociedades')}
                placeholder="Nome da Sociedade/Organização"
              />
              {formData.org_sociedades.length > 1 && (
                <button type="button" className="remove-btn" onClick={() => removeListItem(index, 'org_sociedades')}>Remover</button>
              )}
            </div>
          ))}
          <button type="button" className="add-btn" onClick={() => addListItem('org_sociedades', '')}>Adicionar Sociedade/Organização</button>
        </fieldset>

        {/* Publicações */}
        <fieldset>
          <legend>Principais Publicações (Máx. 5)</legend>
          {formData.publicacoes.map((pub, index) => (
            <div key={index} className="dynamic-list-item">
              <input type="text" value={pub.doi} onChange={(e) => updateListItem('publicacoes', index, 'doi', e.target.value)} placeholder="doi.org/10.1038/171737a0" />
              <input type="text" value={pub.titulo} onChange={(e) => updateListItem('publicacoes', index, 'titulo', e.target.value)} placeholder="Título da Publicação" />
              {formData.publicacoes.length > 1 && <button type="button" className="remove-btn" onClick={() => removeListItem(index, 'publicacoes')}>Remover</button>}
            </div>
          ))}
          {formData.publicacoes.length < 5 && <button type="button" className="add-btn" onClick={() => addListItem('publicacoes', { doi: '', titulo: '' })}>Adicionar Publicação</button>}
        </fieldset>

        {/* Páginas e Redes */}
        <fieldset>
          <legend>Páginas e Redes Sociais</legend>

          <div className="subsection-title">Páginas Institucionais</div>
          {formData.paginas_institucionais.map((pagina, index) => (
            <div key={index} className="dynamic-list-item">
              <input value={pagina} onChange={(e) => handleListChange(index, e, 'paginas_institucionais')} placeholder="http://sua-pagina.edu.br" />
              {formData.paginas_institucionais.length > 1 && <button type="button" className="remove-btn" onClick={() => removeListItem(index, 'paginas_institucionais')}>Remover</button>}
            </div>
          ))}
          <button type="button" className="add-btn" onClick={() => addListItem('paginas_institucionais', '')}>Adicionar Página</button>

          <div className="subsection-title">Redes Sociais</div>
          {formData.redes_sociais.map((rede, index) => (
            <div key={index} className="dynamic-list-item">
              <select name="plataforma" value={rede.plataforma} onChange={(e) => handleListChange(index, e, 'redes_sociais')}>
                <option value="linkedin">LinkedIn</option><option value="researchgate">ResearchGate</option><option value="x">X (Twitter)</option><option value="instagram">Instagram</option>
              </select>
              <input name="url" value={rede.url} onChange={(e) => handleListChange(index, e, 'redes_sociais')} placeholder="URL do seu perfil" />
              {formData.redes_sociais.length > 1 && <button type="button" className="remove-btn" onClick={() => removeListItem(index, 'redes_sociais')}>Remover</button>}
            </div>
          ))}
          <button type="button" className="add-btn" onClick={() => addListItem('redes_sociais', { plataforma: 'linkedin', url: '' })}>Adicionar Rede Social</button>
        </fieldset>

        {/* Edição de Revistas */}
        <fieldset>
          <legend>Atuação Editorial</legend>
          <div className="form-group checkbox-group"><input type="checkbox" id="editor_revista" name="editor_revista" checked={formData.editor_revista} onChange={handleSimpleChange} /><label htmlFor="editor_revista">É editor(a) de revista científica?</label></div>
          {formData.editor_revista && (
            <div>
              {formData.revistas_editadas.map((revista, index) => (
                <div key={index} className="dynamic-list-item">
                  <input value={revista} onChange={(e) => handleListChange(index, e, 'revistas_editadas')} placeholder="Nome da Revista" />
                  {formData.revistas_editadas.length > 1 && <button type="button" className="remove-btn" onClick={() => removeListItem(index, 'revistas_editadas')}>Remover</button>}
                </div>
              ))}
              <button type="button" className="add-btn" onClick={() => addListItem('revistas_editadas', '')}>Adicionar Revista</button>
            </div>
          )}
        </fieldset>

        <div className="registration-buttons">
          <button type="button" className="skip-btn" onClick={handleFinish}>Pular e Finalizar</button>
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Finalizar Cadastro'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default RegistrationPage3;
