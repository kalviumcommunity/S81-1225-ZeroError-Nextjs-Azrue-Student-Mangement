# Object Storage Setup (AWS S3 or Azure Blob)

This app supports secure, direct uploads from the browser via short-lived presigned URLs (AWS) or SAS URLs (Azure).

## 1) Basics

- AWS → S3: Bucket → Object (key) → URL (public/private)
- Azure → Blob Storage: Container → Blob → SAS URL (time-bound permissions)

Each object/blob is uniquely identified and can be accessed securely via time-limited URLs or with server-side access.

## 2) Create Bucket / Container

### AWS S3
1. Console → S3 → Create bucket (e.g., `kalvium-app-storage`).
2. Recommended: Block all public access for private apps.
3. Optional: Enable bucket versioning.

### Azure Blob
1. Portal → Storage accounts → Create (`kalviumstorage123`).
2. Performance: Standard, Redundancy: LRS.
3. Open the account → Containers → Create `uploads` (Private access).

## 3) Minimal Permissions / Access Keys

### AWS IAM Policy
Grant `PutObject` and `GetObject` for the bucket:

```
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": ["arn:aws:s3:::kalvium-app-storage/*"]
    }
  ]
}
```

Create an IAM user (e.g., `storage-uploader`) → generate Access Key ID and Secret Access Key.

### Azure Blob
Use Access Keys (Connection string) or generate SAS tokens with limited permissions (e.g., Write + Create). Prefer user delegation SAS via Azure AD in production.

## 4) Environment Variables

Set these in `.env.local` or environment-specific files:

- Common:
  - `STORAGE_PROVIDER=aws` or `azure`

- AWS:
  - `AWS_REGION=ap-south-1`
  - `AWS_BUCKET_NAME=kalvium-app-storage`
  - `AWS_S3_PUBLIC_READ=false` (optional; set `true` to make uploads publicly readable)

- Azure:
  - `AZURE_STORAGE_ACCOUNT_NAME=<account>`
  - `AZURE_STORAGE_ACCOUNT_KEY=<key>`
  - `AZURE_STORAGE_CONTAINER_NAME=uploads`

## 5) Presigned Upload Flow (Implemented)

- API: [app/api/upload/route.ts](app/api/upload/route.ts)
  - Validates file type and size (images/PDF server-side; 25MB limit)
  - Returns:
    - `uploadURL` (presigned/SAS URL, expires in 60s)
    - `fileURL` (canonical object/blob URL for records)
    - `uploadHeaders` (Azure requires `x-ms-blob-type: BlockBlob`)

- Client Page: [app/upload/page.tsx](app/upload/page.tsx)
  - Client validation: only PNG/JPEG, max 2MB (example)
  - Uploads directly via `PUT` to `uploadURL`
  - Saves record via [app/api/files/route.ts](app/api/files/route.ts)

## 6) Test Steps

```bash
npm install
npm run dev
# Visit http://localhost:3000/upload
```

Upload a small PNG/JPEG and verify:
- Success toast on the page
- Object/blob exists in your S3 bucket or Azure container

## 7) Security & Lifecycle

- Prefer private buckets/containers; avoid broad public access.
- Use minimal IAM/SAS permissions and short expiries (60s in this demo).
- Consider lifecycle policies (e.g., auto-delete temp files after 30 days).
- For read access to private content, issue time-limited presigned/SAS URLs server-side per request.
