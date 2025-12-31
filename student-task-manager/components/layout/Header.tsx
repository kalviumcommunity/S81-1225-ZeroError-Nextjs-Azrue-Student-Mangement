import Link from "next/link";

export default function Header() {
  return (
    <header className="flex justify-between items-center bg-blue-600 text-white px-6 py-3">
      <h1 className="text-lg font-semibold">MyApp</h1>
      <nav className="flex gap-4" aria-label="Main navigation">
        <Link href="/">Home</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/settings">Settings</Link>
      </nav>
    </header>
  );
}
