import Link from "next/link";

export default function Sidebar() {
  const links = [
    { href: "/dashboard", label: "Overview" },
    { href: "/users", label: "Users" },
    { href: "/reports", label: "Reports" },
  ];

  return (
    <aside className="w-64 bg-gray-100 h-screen border-r p-4">
      <h2 className="text-lg font-bold mb-4">Navigation</h2>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="hover:text-blue-600">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
