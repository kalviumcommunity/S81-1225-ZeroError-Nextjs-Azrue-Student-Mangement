"use client";
import { useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [uploadedUrl, setUploadedUrl] = useState<string>("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");
    setUploadedUrl("");

    if (!file) {
      setStatus("Please select a file first.");
      return;
    }

    // Client-side validation per guidance
    const allowed = ["image/png", "image/jpeg"];
    if (!allowed.includes(file.type)) {
      setStatus("Only PNG and JPEG allowed!");
      return;
    }
    const MAX = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX) {
      setStatus("File too large! Max 2MB.");
      return;
    }

    try {
      setStatus("Requesting upload URL...");
      const metaRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, fileType: file.type, fileSize: file.size }),
      });
      const meta = await metaRes.json();
      if (!metaRes.ok || !meta?.success) {
        throw new Error(meta?.message || "Failed to get upload URL");
      }

      const uploadHeaders: Record<string, string> = meta.uploadHeaders || {};

      setStatus("Uploading file...");
      const putRes = await fetch(meta.uploadURL, {
        method: "PUT",
        headers: uploadHeaders,
        body: file,
      });
      if (!putRes.ok) throw new Error(`Upload failed (${putRes.status})`);

      setStatus("Saving file record...");
      const saveRes = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileURL: meta.fileURL, fileSize: file.size, mimeType: file.type }),
      });
      const save = await saveRes.json();
      if (!saveRes.ok || !save?.success) throw new Error(save?.message || "Failed to save file record");

      setUploadedUrl(meta.fileURL);
      setStatus("Upload complete!");
    } catch (err: any) {
      setStatus(String(err?.message || err || "Unknown error"));
    }
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Upload a File</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          accept="image/png,image/jpeg"
          className="block w-full border p-2 rounded"
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Upload</button>
      </form>
      {status && <p className="text-sm text-gray-700">{status}</p>}
      {uploadedUrl && (
        <div className="mt-2">
          <p className="text-sm">File URL:</p>
          <a href={uploadedUrl} className="text-blue-700 underline" target="_blank" rel="noreferrer">
            {uploadedUrl}
          </a>
        </div>
      )}
    </div>
  );
}
