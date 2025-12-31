"use client";
import { useAuth } from "@/hooks/useAuth";
import { useUI } from "@/hooks/useUI";

export default function Home() {
  const { user, login, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme, sidebarOpen, toggleSidebar } = useUI();

  return (
    <main className={`p-6 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
      <h1 className="text-2xl font-bold mb-4">State Management with Context & Hooks</h1>

      <section className="mb-6">
        <h2 className="font-semibold mb-2">Authentication</h2>
        {isAuthenticated ? (
          <>
            <p>Logged in as: {user}</p>
            <button onClick={logout} className="bg-red-500 text-white px-3 py-1 rounded">Logout</button>
          </>
        ) : (
          <button onClick={() => login("KalviumUser")} className="bg-green-500 text-white px-3 py-1 rounded">
            Login
          </button>
        )}
      </section>

      <section>
        <h2 className="font-semibold mb-2">UI Controls</h2>
        <p>Current Theme: {theme}</p>
        <button onClick={toggleTheme} className="bg-blue-500 text-white px-3 py-1 rounded mr-3">Toggle Theme</button>
        <button onClick={toggleSidebar} className="bg-yellow-500 text-black px-3 py-1 rounded">
          {sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
        </button>
      </section>
    </main>
  );
}
