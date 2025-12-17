// Revalidate page every 60 seconds
export const revalidate = 60;

export default async function TasksPage() {
  const res = await fetch('https://api.example.com/public-tasks');
  const tasks = await res.json();

  return (
    <div>
      <h1>Recent Tasks</h1>
      <ul>
        {tasks.map((task: any) => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
    </div>
  );
}
