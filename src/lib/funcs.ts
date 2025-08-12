export const FUNCS_BASE =
  import.meta.env.VITE_FUNCS || '/.netlify/functions';

export const fn = (name: string, qs: string = '') =>
  `${FUNCS_BASE}/${name}${qs}`;
