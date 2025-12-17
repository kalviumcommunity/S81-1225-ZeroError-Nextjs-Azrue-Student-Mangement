export type Task = {
  id: number;
  title: string;
  status: string;
  due?: string;
};

export async function getTasks(): Promise<Task[]> {
  return [
    { id: 1, title: "Submit Math Assignment", due: "2025-12-20", status: "Pending" },
    { id: 2, title: "Prepare Physics Lab", due: "2025-12-22", status: "Pending" },
    { id: 3, title: "Revise Chemistry Notes", due: "2025-12-19", status: "Completed" },
  ];
}
