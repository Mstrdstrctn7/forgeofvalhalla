export default function EnvCheck() {
  const hasUrl = !!import.meta.env.VITE_SUPABASE_URL;
  const hasAnon = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
  return (
    <div style={{ color: '#fff', padding: 24 }}>
      <h2>Env Check</h2>
      <p>VITE_SUPABASE_URL: {hasUrl ? 'OK ✅' : 'Missing ❌'}</p>
      <p>VITE_SUPABASE_ANON_KEY: {hasAnon ? 'OK ✅' : 'Missing ❌'}</p>
      <p style={{ opacity: 0.7, marginTop: 12 }}>
        If either is Missing on the live site, add them in Netlify → Site configuration → Environment variables,
        then “Clear cache and redeploy”.
      </p>
    </div>
  );
}
