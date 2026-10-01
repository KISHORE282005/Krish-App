// Local-time YYYY-MM-DD. (toISOString() is UTC, which puts IST mornings on the previous day.)
export const dateKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const today = () => dateKey();

export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

export const parseKey = (key) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d); };
