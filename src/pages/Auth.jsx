import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [user, setUser] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signUp = async () => {
    setMsg('Working...');
    const { error } = await supabase.auth.signUp({ email, password: pwd });
    setMsg(error ? error.message : 'Check your email to confirm sign-up.');
  };

  const signIn = async () => {
    setMsg('Working...');
    const { error } = await supabase.auth.signInWithPassword({ email, password: pwd });
    setMsg(error ? error.message : 'Signed in!');
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setMsg('Signed out');
  };

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', color: '#fff' }}>
      <h2>Login / Sign Up</h2>
      {user ? (
        <>
          <p>Signed in as: <b>{user.email}</b></p>
          <button onClick={signOut}>Sign out</button>
        </>
      ) : (
        <>
          <input
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: 'block', width: '100%', marginBottom: 8 }}
          />
          <input
            placeholder="password"
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            style={{ display: 'block', width: '100%', marginBottom: 8 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={signIn}>Sign in</button>
            <button onClick={signUp}>Sign up</button>
          </div>
        </>
      )}
      <p style={{ marginTop: 12 }}>{msg}</p>
    </div>
  );
}
