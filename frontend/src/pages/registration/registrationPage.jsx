import { useState } from 'react';
import './registrationStyles.css';
import { useNavigate } from 'react-router-dom';
import { postRoute } from '../../reqs/comms';

function RegistrationPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    localidade: {
      nome_cidade: '',
      nome_estado: '',
    },
  });

  const handleSimpleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.senha !== formData.confirmarSenha) {
      alert("As senhas não coincidem!");
      return;
    }

    if (!formData.link_lattes.startsWith('http://lattes.cnpq.br/')) {
      alert("O Link Lattes deve começar com http://lattes.cnpq.br/");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      nome: formData.nome,
      email: formData.email,
      password: formData.senha,
      celular: formData.celular,
      link_lattes: formData.link_lattes,
      localidade_data: formData.localidade,
      laboratorio: '',
      pq: false,
      sbfte: false,
      is_admin: false,
      editor_revista: false,
      pagina_institucional: '',
    };

    try {
      const response = await postRoute(payload);
      const data = await response.json();

      if (response.ok) {
        navigate(`/register/step2/${data.id_pesquisador}`);
      } else {
        alert(`Erro no cadastro: ${data.error || data.details}`);
      }
    } catch (error) {
      console.error("Erro ao enviar dados do cadastro:", error);
      alert("Ocorreu um erro ao tentar cadastrar. Tente novamente mais tarde.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="registration-container">
      <form onSubmit={handleSubmit} className="registration-form-card">
        <header className="registration-header">
          <h1>Cadastro - Etapa 1 de 3</h1>
          <button type="button" onClick={handleMainPageButton}>Pagina Principal</button>
        </header>

        <div className="step-indicator">
          <div className="step active">1</div>
          <div className="step-line"></div>
          <div className="step">2</div>
          <div className="step-line"></div>
          <div className="step">3</div>
        </div>

        <p className="registration-intro">
          Preencha as informações obrigatórias abaixo para criar sua conta. Ao clicar em "Continuar", sua conta será criada e você poderá completar seu perfil nas próximas etapas ou fazer isso depois.
        </p>

        {/* Informações Pessoais e Login */}
        <fieldset>
          <legend>Informações de Acesso</legend>
          <div className="form-group"><label>Nome Completo</label><input required name="nome" value={formData.nome} onChange={handleSimpleChange} /></div>
          <div className="form-group"><label>E-mail</label><input required type="email" name="email" value={formData.email} onChange={handleSimpleChange} /></div>
          <div className="form-group"><label>Senha</label><input required type="password" name="senha" value={formData.senha} onChange={handleSimpleChange} minLength="6" /></div>
          <div className="form-group"><label>Confirmar Senha</label><input required type="password" name="confirmarSenha" value={formData.confirmarSenha} onChange={handleSimpleChange} /></div>
        </fieldset>

        {/* Contato e Localização */}
        <fieldset>
          <legend>Contato e Localização</legend>
          <div className="form-group"><label>Celular</label><input required type="tel" name="celular" value={formData.celular} onChange={handleSimpleChange} /></div>
          <div className="form-group"><label>Link Lattes</label><input required type="url" name="link_lattes" value={formData.link_lattes} onChange={handleSimpleChange} placeholder="http://lattes.cnpq.br/1234567890123456" pattern="http://lattes\.cnpq\.br/.*" /></div>
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

        <button type="submit" className="submit-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Criando conta...' : 'Criar Conta e Continuar'}
        </button>
      </form>
    </div>
  );
}

export default RegistrationPage;
