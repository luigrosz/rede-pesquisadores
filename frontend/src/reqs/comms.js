export const postRoute = async (payload) => await fetch('http://localhost:3000/pesquisador', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
});

export const putPesquisador = async (id, payload) => await fetch(`http://localhost:3000/pesquisador/${id}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
});
