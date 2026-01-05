export const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch data");
  const json = await res.json();
  return json?.data ?? json;
};
