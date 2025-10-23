// src/lib/oracleBucket.ts
import { S3 } from 'aws-sdk'

export async function uploadToS3(file: File) {
  const s3 = new S3({
    accessKeyId: process.env.NEXT_PUBLIC_OCI_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_OCI_SECRET_ACCESS_KEY!,
    endpoint: process.env.NEXT_PUBLIC_OCI_ENDPOINT!,  // Oracle S3 endpoint
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
    region: process.env.NEXT_PUBLIC_OCI_REGION!,
  })

  const fileKey = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`

  await s3
    .putObject({
      Bucket: process.env.NEXT_PUBLIC_OCI_BUCKET_NAME!,
      Key: fileKey,
      Body: file,
      ContentType: file.type,
    })
    .promise()

  return fileKey
}
