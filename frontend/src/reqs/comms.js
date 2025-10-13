export const postRoute = async (payload) => await fetch('http://localhost:3000/pesquisador', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
});
