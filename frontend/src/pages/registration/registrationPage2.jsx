import { useState } from 'react';
import './registrationStyles.css';
import { useNavigate, useParams } from 'react-router-dom';
import { putPesquisador } from '../../reqs/comms';

function RegistrationPage2() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    laboratorio: '',
    area_doutorado: { titulo: '', instituicao_nome: '' },
    vinculos: [{ instituicao_nome: '', tipo: 'primaria', nome_programa: '' }],
    pos_graduacoes: [{ titulo: '', instituicao_nome: '' }],
    areas_pesquisa: [''],
    disciplinas: [{ nome: '', descricao: '' }],
  });

  const handleSimpleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

  const addListItem = (listName, newItem) => {
    setFormData(prev => ({
      ...prev,
      [listName]: [...prev[listName], newItem]
    }));
  };

  const removeListItem = (index, listName) => {
    const list = [...formData[listName]];
    list.splice(index, 1);
    setFormData(prev => ({ ...prev, [listName]: list }));
  };

  const handleSkip = () => {
    navigate(`/register/step3/${id}`);
  };

  const handleFinish = () => {
    alert('Cadastro concluído! Você pode completar seu perfil a qualquer momento.');
    navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      laboratorio: formData.laboratorio,
      vinculos: formData.vinculos
        .filter(v => v.instituicao_nome !== '' && v.tipo !== '' && v.nome_programa !== '')
        .map(v => ({ instituicao_nome: v.instituicao_nome, tipo: v.tipo, nome_programa: v.nome_programa })),
      areas_pesquisa: formData.areas_pesquisa.filter(a => a !== '').map(a => ({ descricao: a })),
      disciplinas: formData.disciplinas.filter(d => d.nome !== '' || d.descricao !== '').map(d => ({ descricao: d.descricao || d.nome })),
      pos_graduacoes: formData.pos_graduacoes
        .filter(p => p.titulo !== '' && p.instituicao_nome !== '')
        .map(p => ({ titulo: p.titulo, instituicao_nome: p.instituicao_nome })),
    };

    try {
      const response = await putPesquisador(id, payload);
      const data = await response.json();

      if (response.ok) {
        navigate(`/register/step3/${id}`);
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
          <h1>Cadastro - Etapa 2 de 3</h1>
          <button type="button" onClick={handleFinish}>Finalizar Depois</button>
        </header>

        <div className="step-indicator">
          <div className="step completed">1</div>
          <div className="step-line completed"></div>
          <div className="step active">2</div>
          <div className="step-line"></div>
          <div className="step">3</div>
        </div>

        <p className="registration-intro">
          Sua conta foi criada! Agora você pode adicionar suas informações acadêmicas. Todas as informações desta etapa são opcionais.
        </p>

        {/* Laboratório e Doutorado */}
        <fieldset>
          <legend>Formação e Laboratório</legend>
          <div className="form-group">
            <label>Laboratório de Pesquisa</label>
            <input
              name="laboratorio"
              value={formData.laboratorio}
              onChange={handleSimpleChange}
              placeholder="Ex: Laboratório de Farmacologia"
            />
          </div>
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

        {/* Vínculos Institucionais */}
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

        {/* Pós-Graduações */}
        <fieldset>
          <legend>Pós-Graduações (Máx. 5)</legend>
          {formData.pos_graduacoes.map((pos, index) => (
            <div key={index} className="dynamic-list-item-column">
              <input name="titulo" value={pos.titulo} onChange={(e) => handleListChange(index, e, 'pos_graduacoes')} placeholder="Título da Pós-Graduação" />
              <input name="instituicao_nome" value={pos.instituicao_nome} onChange={(e) => handleListChange(index, e, 'pos_graduacoes')} placeholder="Instituição" />
              {formData.pos_graduacoes.length > 1 && (
                <button type="button" className="remove-btn" onClick={() => removeListItem(index, 'pos_graduacoes')}>Remover</button>
              )}
            </div>
          ))}
          {formData.pos_graduacoes.length < 5 && (
            <button type="button" className="add-btn" onClick={() => addListItem('pos_graduacoes', { titulo: '', instituicao_nome: '' })}>Adicionar Pós-Graduação</button>
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

        <div className="registration-buttons">
          <button type="button" className="skip-btn" onClick={handleSkip}>Pular Etapa</button>
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar e Continuar'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default RegistrationPage2;
