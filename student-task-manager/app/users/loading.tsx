export default function Loading() {
  return (
    <main className="p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
        <ul className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3">
              <div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded" />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
