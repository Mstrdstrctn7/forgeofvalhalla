import useSession from "../hooks/useSession";

export default function Dashboard() {
  const { session } = useSession();

  return (
    <div style={{ padding: 16, color: "#fff" }}>
      <h2>Dashboard</h2>
      <p>
        Welcome{session?.user?.email ? `, ${session.user.email}` : ""}!
      </p>
      <p>This page is protected. If you sign out, you’ll be redirected to Login.</p>
    </div>
  );
}
