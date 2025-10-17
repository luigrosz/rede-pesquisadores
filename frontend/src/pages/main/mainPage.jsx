import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './mainStyles.css';

function MainPage() {
  const navigate = useNavigate();
  const [nameSearchTerm, setNameSearchTerm] = useState('');
  const handleNameSearchChange = (event) => {
    setNameSearchTerm(event.target.value);
  };

  const handleLogin = () => {
    navigate('/');
  };


  const estados = [
    'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal',
    'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul',
    'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí',
    'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia',
    'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'
  ];

  const [stateFilter, setStateFilter] = useState('');
  const handleStateChange = (event) => {
    setStateFilter(event.target.value);
  };

  const [areaFilter, setAreaFilter] = useState('');
  const handleAreaChange = (event) => {
    setAreaFilter(event.target.value);
  };

  const [isSBFTEChecked, setIsSBFTEChecked] = useState(false);
  const handleSBFTEChange = (event) => {
    setIsSBFTEChecked(event.target.checked);
  };

  const [societyText, setSocietyText] = useState('');
  const handleSocietyTextChange = (event) => {
    setSocietyText(event.target.value);
  };

  const [drAreaFilter, setDrAreaFilter] = useState('');
  const handleDrAreaChange = (event) => {
    setDrAreaFilter(event.target.value);
  };

  const [postgradProgramFilter, setPostgradProgramFilter] = useState('');
  const handlePostgradProgramChange = (event) => {
    setPostgradProgramFilter(event.target.value);
  };

  const [disciplineFilter, setDisciplineFilter] = useState('');
  const handleDisciplineChange = (event) => {
    setDisciplineFilter(event.target.value);
  };

  const [isPesquisadorPQFilter, setIsPesquisadorPQFilter] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const handlePesquisadorPQChange = (event) => {
    setIsPesquisadorPQFilter(event.target.checked);
  };

  const handleSearch = async () => {
    const params = new URLSearchParams();
    if (nameSearchTerm) params.append('nome', nameSearchTerm);
    if (stateFilter) params.append('estado', stateFilter);
    if (areaFilter) params.append('area', areaFilter);
    if (societyText) params.append('sociedade', societyText);
    if (drAreaFilter) params.append('area_doutorado', drAreaFilter);
    if (postgradProgramFilter) params.append('programa_de_pos', postgradProgramFilter);
    if (disciplineFilter) params.append('disciplina', disciplineFilter);
    if (isPesquisadorPQFilter) params.append('pesquisador_pq', 'true');
    if (isSBFTEChecked) params.append('sbfte', 'true');
    if (equipmentFilter) params.append('equipamento', equipmentFilter);

    const queryString = params.toString();
    const url = `http://localhost:3000/pesquisador/pesquisar?${queryString}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSearchResults(data);
      console.log('Search Results:', data);
    } catch (error) {
      console.error('Erro ao buscar pesquisadores:', error);
      setSearchResults([]);
    }
  };

  const [equipmentFilter, setEquipmentsFilter] = useState('');
  const handleEquipmentsChange = (event) => {
    setEquipmentsFilter(event.target.value);
  };

  return (
    <div className="main-page-container">
      <div className="main-page-header">
        <h1>Pagina Principal</h1>
        <button onClick={handleLogin}>Pagina de Login</button>
      </div>

      <div className="filters-section">
        {/* <h2>Filtros</h2>*/}
        <div className="filters-grid">
          <div className="filter-item">
            <label htmlFor="nameSearch">Nome:</label>
            <input
              id="nameSearch"
              type="text"
              value={nameSearchTerm}
              onChange={handleNameSearchChange}
            />
          </div>

          <div className="filter-item">
            <label htmlFor="areaFilter">Área:</label>
            <input
              id="areaFilter"
              type="text"
              value={areaFilter}
              onChange={handleAreaChange}
            />
          </div>

          <div className="filter-item">
            <label htmlFor="drAreaFilter">Área de Doutorado:</label>
            <input
              id="drAreaFilter"
              type="text"
              value={drAreaFilter}
              onChange={handleDrAreaChange}
            />
          </div>

          <div className="filter-item">
            <label htmlFor="postgradProgramFilter">Programa de Pós:</label>
            <input
              id="postgradProgramFilter"
              type="text"
              value={postgradProgramFilter}
              onChange={handlePostgradProgramChange}
            />
          </div>

          <div className="filter-item">
            <label htmlFor="disciplineFilter">Disciplina:</label>
            <input
              id="disciplineFilter"
              type="text"
              value={disciplineFilter}
              onChange={handleDisciplineChange}
            />
          </div>

          <div className="filter-item">
            <label htmlFor="equipmentFilter">Equipamento:</label>
            <input
              id="equipmentFilter"
              type="text"
              value={equipmentFilter}
              onChange={handleEquipmentsChange}
            />
          </div>

          <div className="filter-item">
            <label htmlFor="society">Sociedade:</label>
            <input
              id="society"
              type="text"
              value={societyText}
              onChange={handleSocietyTextChange}
            />
          </div>

          <div className="filter-item">
            <label htmlFor="stateFilter">Estado:</label>
            <select
              id="stateFilter"
              value={stateFilter}
              onChange={handleStateChange}
            >
              <option value="">Todos os Estados</option>
              {estados.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-checkbox-group">
            <input
              id="isPesquisadorPQFilter"
              type="checkbox"
              checked={isPesquisadorPQFilter}
              onChange={handlePesquisadorPQChange}
            />
            <label htmlFor="isPesquisadorPQFilter">Pesquisador PQ</label>
          </div>

          <div className="filter-checkbox-group">
            <input
              id="sbfteCheckbox"
              type="checkbox"
              checked={isSBFTEChecked}
              onChange={handleSBFTEChange}
            />
            <label htmlFor="sbfteCheckbox">SBFTE</label>
          </div>
        </div>
      </div>
      <div className="search-actions">
        <button onClick={handleSearch}>Buscar Pesquisadores</button>
      </div>

      {searchResults.length > 0 && (
        <div className="search-results-section">
          {searchResults.map((pesquisador) => (
            <div key={pesquisador.id_pesquisador}>
              <h3>{pesquisador.nome}</h3>
              <p>Email: {pesquisador.email}</p>
              <p>Estado: {pesquisador.nome_estado}</p>
              {pesquisador.area_doutorado_titulo && <p>Área de Doutorado: {pesquisador.area_doutorado_titulo}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MainPage;
