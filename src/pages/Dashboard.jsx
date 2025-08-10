import useSession from "../hooks/useSession";
import PriceCards from "../components/PriceCards";

export default function Dashboard() {
  const { session } = useSession();
  return (
    <div style={{ color:'#fff', padding: 24 }}>
      <h2>Dashboard</h2>
      <p>Welcome, {session?.user?.email ?? 'friend'}!</p>
      <PriceCards />
    </div>
  );
}
