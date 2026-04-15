export const postRoute = async (payload) => await fetch(`${import.meta.env.VITE_API_URL}/pesquisador`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
});

export const putPesquisador = async (id, payload) => await fetch(`${import.meta.env.VITE_API_URL}/pesquisador/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify(payload),
});
