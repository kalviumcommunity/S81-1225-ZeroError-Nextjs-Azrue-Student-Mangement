import Link from "next/link";

export default function NotFound() {
    return (
        <main className="flex flex-col items-center justify-center min-h-[60vh] text-red-600 px-4">
            <h1 className="text-4xl font-bold mb-2">404 — Page Not Found</h1>
            <p className="text-lg text-gray-600 mb-6 text-center">
                Oops! The route you are looking for doesn’t exist.
            </p>
            <Link
                href="/"
                className="bg-gray-800 text-white px-6 py-2 rounded-full hover:bg-gray-900 transition-all"
            >
                Go Home
            </Link>
        </main>
    );
}
