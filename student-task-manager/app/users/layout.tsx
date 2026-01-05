export default async function UsersLayout({ children }: { children: React.ReactNode }) {
  // Simulate delay to visualize the loading.tsx skeleton
  await new Promise((r) => setTimeout(r, 2000));
  return <>{children}</>;
}
