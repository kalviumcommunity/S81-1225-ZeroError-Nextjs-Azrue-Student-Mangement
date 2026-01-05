"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Loader, FullScreenLoader } from "@/components/ui/Loader";
import { Trash2, Save, Play, CheckCircle2, AlertTriangle } from "lucide-react";

export default function FeedbackDemo() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [fullScreenLoading, setFullScreenLoading] = useState(false);

    const handleSave = async () => {
        toast.loading("Saving data...", { id: "save" });
        setIsLoading(true);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setIsLoading(false);
        toast.success("Data saved successfully!", { id: "save" });
    };

    const handleError = () => {
        toast.error("An error occurred. Please try again.");
    };

    const handleDelete = async () => {
        setIsModalOpen(false);
        setFullScreenLoading(true);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setFullScreenLoading(false);
        toast.success("Item deleted successfully!");
    };

    return (
        <div className="p-8 space-y-12">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Feedback Layers Demo</h1>
                <p className="text-gray-600 mt-2">
                    Demonstrating Toasts, Modals, and Loaders for responsive UI.
                </p>
            </header>

            {/* Toast Section */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <CheckCircle2 className="text-green-500" />
                    Toast Notifications
                </h2>
                <div className="flex gap-4">
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Save size={18} />
                        Success Flow
                    </button>
                    <button
                        onClick={handleError}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                        <AlertTriangle size={18} />
                        Error Toast
                    </button>
                </div>
            </section>

            {/* Modal Section */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <AlertTriangle className="text-amber-500" />
                    Blocking Feedback (Modals)
                </h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                >
                    <Trash2 size={18} />
                    Confirm Deletion
                </button>

                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title="Delete Confirmation"
                >
                    <div className="space-y-4">
                        <p className="text-gray-600">
                            Are you sure you want to delete this item? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </Modal>
            </section>

            {/* Loader Section */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Play className="text-blue-500" />
                    Process Feedback (Loaders)
                </h2>
                <div className="grid grid-cols-2 gap-8">
                    <div className="border rounded-xl p-6 bg-gray-50">
                        <h3 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Inline Loader</h3>
                        {isLoading ? (
                            <Loader message="Synchronizing with server..." />
                        ) : (
                            <p className="text-gray-600 italic">Click "Success Flow" to see inline loader here.</p>
                        )}
                    </div>

                    <div className="border rounded-xl p-6 bg-gray-50">
                        <h3 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Full Screen Overlay</h3>
                        <button
                            onClick={() => {
                                setFullScreenLoading(true);
                                setTimeout(() => setFullScreenLoading(false), 3000);
                            }}
                            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                            Trigger Full Screen Loader
                        </button>
                    </div>
                </div>
            </section>

            {fullScreenLoading && <FullScreenLoader message="Processing your request..." />}
        </div>
    );
}
