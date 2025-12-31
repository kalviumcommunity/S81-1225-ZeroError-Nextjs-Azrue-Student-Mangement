interface Props {
    params: Promise<{ id: string }>;
}

export default async function UserProfile({ params }: Props) {
    const { id } = await params;
    // Mock fetch user data
    const user = { id, name: "User " + id };

    return (
        <main className="flex flex-col items-center mt-10 p-4">
            <div className="bg-white p-6 rounded-lg shadow-md border">
                <h2 className="text-xl font-bold mb-4">User Profile</h2>
                <div className="space-y-2">
                    <p><span className="font-semibold">ID:</span> {user.id}</p>
                    <p><span className="font-semibold">Name:</span> {user.name}</p>
                </div>
                <div className="mt-4 text-sm text-gray-500">
                    <p>Breadcrumbs: Users / {user.name}</p>
                </div>
            </div>
        </main>
    );
}
