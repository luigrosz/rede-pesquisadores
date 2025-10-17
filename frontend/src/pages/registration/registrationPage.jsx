import { useState } from 'react';
import './registrationStyles.css';
import { useNavigate } from 'react-router-dom';
import { postRoute } from '../../reqs/comms';

function RegistrationPage() {
  const navigate = useNavigate();
  const estadosBrasileiros = [
    'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal',
    'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul',
    'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí',
    'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia',
    'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'
  ];

  const handleMainPageButton = () => {
    navigate('/main');
  }

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',

    celular: '',
    link_lattes: '',
    paginas_institucionais: [''],

    laboratorio: '',

    localidade: {
      nome_cidade: '',
      nome_estado: '',
    },

    area_doutorado: { titulo: '', instituicao_nome: '' },

    vinculos: [{ instituicao_nome: '', tipo: 'primaria', nome_programa: '' }],

    grupos_pesquisa: [{ nome: '', descricao: '', instituicao_nome: '', link: '' }],

    areas_pesquisa: [''],
    disciplinas: [{ nome: '', descricao: '' }],

    pq: false,
    sbfte: false,

    publicacoes: [{ doi: '', titulo: '' }],
    editor_revista: false,
    revistas_editadas: [''],

    redes_sociais: [{ plataforma: 'linkedin', url: '' }],
    org_sociedades: [''],
    pos_graduacoes: [{ titulo: '', instituicao_name: '' }],
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

  const handleLocalidadeChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      localidade: {
        ...prev.localidade,
        [name]: value,
      },
    }));
  };

  const handleAreaDoutoradoChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      area_doutorado: {
        ...prev.area_doutorado,
        [name]: value,
      },
    }));
  };

  const handleVinculoChange = (index, e) => {
    const { name, value } = e.target;
    const updatedVinculos = formData.vinculos.map((vinculo, i) =>
      i === index ? { ...vinculo, [name]: value } : vinculo
    );
    setFormData(prev => ({ ...prev, vinculos: updatedVinculos }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.senha !== formData.confirmarSenha) {
      alert("As senhas não coincidem!");
      return;
    }

    const payload = {
      nome: formData.nome,
      email: formData.email,
      password: formData.senha,
      celular: formData.celular,
      link_lattes: formData.link_lattes,
      sbfte: formData.sbfte,

      localidade_data: formData.localidade,

      pagina_institucional: formData.paginas_institucionais.filter(p => p !== '').join('; '),
      pq: formData.pq,
      is_admin: false,
      editor_revista: formData.editor_revista,
      laboratorio: formData.laboratorio,

      area_doutorado_data: formData.area_doutorado.titulo && formData.area_doutorado.instituicao_nome
        ? formData.area_doutorado
        : null,

      vinculos_data: formData.vinculos.filter(v => v.instituicao_nome !== '' && v.tipo !== '' && v.nome_programa !== ''),

      grupos_pesquisa_data: formData.grupos_pesquisa.filter(g => g.nome !== '' && g.instituicao_nome !== '' && g.link !== ''),

      areas_pesquisa: formData.areas_pesquisa.filter(a => a !== '').map(a => ({ descricao: a })),
      disciplinas: formData.disciplinas.filter(d => d.nome !== '' && d.descricao !== ''),
      publicacoes: formData.publicacoes.filter(p => p.doi !== '' || p.titulo !== ''),
      redes_sociais: formData.redes_sociais.filter(r => r.url !== ''),
      revistas_editadas: formData.editor_revista ? formData.revistas_editadas.filter(r => r !== '').map(r => ({ titulo: r, endereco: null })) : [],
      pos_graduacoes: formData.pos_graduacoes.filter(p => p.titulo !== '' && p.instituicao_name !== '').map(p => ({ titulo: p.titulo, instituicao_name: p.instituicao_name })),
      org_sociedades: formData.org_sociedades.filter(o => o !== '').map(o => ({ nome: o })),
    };

    try {
      const response = await postRoute(payload);
      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        // TODO: REDIRECIONAR USUARIO ou limpar formulário
      } else {
        alert(`Erro no cadastro: ${data.error || data.details}`);
      }
    } catch (error) {
      console.error("Erro ao enviar dados do cadastro:", error);
      alert("Ocorreu um erro ao tentar cadastrar. Tente novamente mais tarde.");
    }
  };

  return (
    <div className="registration-container">
      <form onSubmit={handleSubmit} className="registration-form-card">
        <header className="registration-header">
          <h1>Cadastro</h1>
          <button onClick={handleMainPageButton}>Pagina Principal</button>
        </header>

        {/* Informações Pessoais e Login */}
        <fieldset>
          <legend>Informações Pessoais e Acesso</legend>
          <div className="form-group"><label>Nome Completo</label><input required name="nome" value={formData.nome} onChange={handleSimpleChange} /></div>
          <div className="form-group"><label>E-mail</label><input required type="email" name="email" value={formData.email} onChange={handleSimpleChange} /></div>
          <div className="form-group"><label>Senha</label><input required type="password" name="senha" value={formData.senha} onChange={handleSimpleChange} minLength="6" /></div>
          <div className="form-group"><label>Confirmar Senha</label><input required type="password" name="confirmarSenha" value={formData.confirmarSenha} onChange={handleSimpleChange} /></div>
          <div className="form-group"><label>Celular</label><input required type="tel" name="celular" value={formData.celular} onChange={handleSimpleChange} /></div>
          <div className="form-group"><label>Link Lattes</label><input required type="url" name="link_lattes" value={formData.link_lattes} onChange={handleSimpleChange} /></div>
        </fieldset>

        {/* Localidade */}
        <fieldset>
          <legend>Localidade</legend>
          <div className="form-group">
            <label>Cidade</label>
            <input
              required
              name="nome_cidade"
              value={formData.localidade.nome_cidade}
              onChange={handleLocalidadeChange}
              placeholder="Ex: Barra do Garças"
            />
          </div>
          <div className="form-group">
            <label htmlFor="nome_estado">Estado</label>
            <select
              required
              id="nome_estado"
              name="nome_estado"
              value={formData.localidade.nome_estado}
              onChange={handleLocalidadeChange}
            >
              <option value="">Selecione um Estado</option>
              {estadosBrasileiros.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
        </fieldset>

        {/* Área de Doutorado */}
        <fieldset>
          <legend>Área de Doutorado</legend>
          <div className="form-group">
            <label>Título do Doutorado</label>
            <input
              name="titulo"
              value={formData.area_doutorado.titulo}
              onChange={handleAreaDoutoradoChange}
              placeholder="Ex: Farmacologia Clínica"
            />
          </div>
          <div className="form-group">
            <label>Instituição do Doutorado</label>
            <input
              name="instituicao_nome"
              value={formData.area_doutorado.instituicao_nome}
              onChange={handleAreaDoutoradoChange}
              placeholder="Ex: Universidade Federal do Mato Grosso"
            />
          </div>
        </fieldset>

        {/* Vínculos e Afiliações */}
        <fieldset>
          <legend>Vínculos e Afiliações</legend>
          <div className="form-group"><label>Laboratório de Pesquisa</label><input name="laboratorio" value={formData.laboratorio} onChange={handleSimpleChange} /></div>

          {/* Vínculos Dinâmicos */}
          <fieldset>
            <legend>Vínculos Institucionais</legend>
            {formData.vinculos.map((vinculo, index) => (
              <div key={index} className="dynamic-list-item-column">
                <label>Instituição</label>
                <input
                  name="instituicao_nome"
                  value={vinculo.instituicao_nome}
                  onChange={(e) => handleVinculoChange(index, e)}
                  placeholder="Nome da Instituição"
                />
                <label>Tipo de Vínculo</label>
                <select name="tipo" value={vinculo.tipo} onChange={(e) => handleVinculoChange(index, e)}>
                  <option value="primaria">Primário</option>
                  <option value="secundario">Secundário</option>
                  <option value="pos">Pós-Graduação</option>
                </select>
                <label>Nome do Programa</label>
                <input
                  name="nome_programa"
                  value={vinculo.nome_programa}
                  onChange={(e) => handleVinculoChange(index, e)}
                  placeholder="Nome do Programa/Departamento"
                />
                {formData.vinculos.length > 1 && (
                  <button type="button" className="remove-btn" onClick={() => removeListItem(index, 'vinculos')}>Remover Vínculo</button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="add-btn"
              onClick={() => addListItem('vinculos', { instituicao_nome: '', tipo: 'primaria', nome_programa: '' })}
            >
              Adicionar Vínculo
            </button>
          </fieldset>

          {/* Grupos de Pesquisa Dinâmicos */}
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

          <div className="form-group checkbox-group"><input type="checkbox" id="pq" name="pq" checked={formData.pq} onChange={handleSimpleChange} /><label htmlFor="pq">É pesquisador PQ (CNPq)?</label></div>
          <div className="form-group checkbox-group"><input type="checkbox" id="sbfte" name="sbfte" checked={formData.sbfte} onChange={handleSimpleChange} /><label htmlFor="sbfte">É membro da SBFTE?</label></div>

          {/* Sociedades e Organizações */}
          <fieldset>
            <legend>Sociedades e Organizações</legend>
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
        </fieldset>

        {/* Páginas Institucionais */}
        <fieldset>
          <legend>Páginas Institucionais</legend>
          {formData.paginas_institucionais.map((pagina, index) => (
            <div key={index} className="dynamic-list-item">
              <input value={pagina} onChange={(e) => handleListChange(index, e, 'paginas_institucionais')} placeholder="http://sua-pagina.edu.br" />
              {formData.paginas_institucionais.length > 1 && <button type="button" className="remove-btn" onClick={() => removeListItem(index, 'paginas_institucionais')}>Remover</button>}
            </div>
          ))}
          <button type="button" className="add-btn" onClick={() => addListItem('paginas_institucionais', '')}>Adicionar Página</button>
        </fieldset>

        {/* Pós-Graduações */}
        <fieldset>
          <legend>Pós-Graduações (Máx. 5)</legend>
          {formData.pos_graduacoes.map((pos, index) => (
            <div key={index} className="dynamic-list-item-column">
              <input name="titulo" value={pos.titulo} onChange={(e) => handleListChange(index, e, 'pos_graduacoes')} placeholder="Título da Pós-Graduação" />
              <input name="instituicao_name" value={pos.instituicao_name} onChange={(e) => handleListChange(index, e, 'pos_graduacoes')} placeholder="Instituição" />
              {formData.pos_graduacoes.length > 1 && (
                <button type="button" className="remove-btn" onClick={() => removeListItem(index, 'pos_graduacoes')}>Remover</button>
              )}
            </div>
          ))}
          {formData.pos_graduacoes.length < 5 && (
            <button type="button" className="add-btn" onClick={() => addListItem('pos_graduacoes', { titulo: '', instituicao_name: '' })}>Adicionar Pós-Graduação</button>
          )}
        </fieldset>

        {/* Áreas de Pesquisa */}
        <fieldset>
          <legend>Áreas de Pesquisa</legend>
          {formData.areas_pesquisa.map((area, index) => (
            <div key={index} className="dynamic-list-item">
              <input value={area} onChange={(e) => handleListChange(index, e, 'areas_pesquisa')} placeholder="Ex: Biologia Molecular" />
              {formData.areas_pesquisa.length > 1 && <button type="button" className="remove-btn" onClick={() => removeListItem(index, 'areas_pesquisa')}>Remover</button>}
            </div>
          ))}
          <button type="button" className="add-btn" onClick={() => addListItem('areas_pesquisa', '')}>Adicionar Área</button>
        </fieldset>

        {/* Disciplinas */}
        <fieldset>
          <legend>Disciplinas Lecionadas</legend>
          {formData.disciplinas.map((disciplina, index) => (
            <div key={index} className="dynamic-list-item-column">
              <input name="nome" value={disciplina.nome} onChange={(e) => handleListChange(index, e, 'disciplinas')} placeholder="Nome da Disciplina" />
              <textarea name="descricao" value={disciplina.descricao} onChange={(e) => handleListChange(index, e, 'disciplinas')} placeholder="Descrição da Disciplina" />
              {formData.disciplinas.length > 1 && <button type="button" className="remove-btn" onClick={() => removeListItem(index, 'disciplinas')}>Remover Disciplina</button>}
            </div>
          ))}
          <button type="button" className="add-btn" onClick={() => addListItem('disciplinas', { nome: '', descricao: '' })}>Adicionar Disciplina</button>
        </fieldset>

        {/* Publicações */}
        <fieldset>
          <legend>Principais Publicações (DOI)</legend>
          {formData.publicacoes.map((pub, index) => (
            <div key={index} className="dynamic-list-item">
              <input type="text" value={pub.doi} onChange={(e) => updateListItem('publicacoes', index, 'doi', e.target.value)} placeholder="doi.org/10.1038/171737a0" />
              <input type="text" value={pub.titulo} onChange={(e) => updateListItem('publicacoes', index, 'titulo', e.target.value)} placeholder="Título da Publicação" />
              {formData.publicacoes.length > 1 && <button type="button" className="remove-btn" onClick={() => removeListItem(index, 'publicacoes')}>Remover</button>}
            </div>
          ))}
          {formData.publicacoes.length < 5 && <button type="button" className="add-btn" onClick={() => addListItem('publicacoes', { doi: '', titulo: '' })}>Adicionar Publicação</button>}
        </fieldset>

        {/* Redes Sociais */}
        <fieldset>
          <legend>Redes Sociais</legend>
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

        <button type="submit" className="submit-btn">Criar Conta</button>
      </form>
    </div>
  );
}

export default RegistrationPage;
