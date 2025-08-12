import { supa } from "../lib/supa";

export default function Header() {
  return (
    <header className="w-full flex items-center justify-between p-3 border-b border-zinc-800">
      <h1 className="text-lg font-semibold">Forge of Valhalla</h1>
      <button
        onClick={async () => { await supa.auth.signOut(); location.href = "/login"; }}
        className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
      >
        Sign out
      </button>
    </header>
  );
}
