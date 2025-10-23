import { S3 } from 'aws-sdk'
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";


const streamToBuffer = async (readableStream: any): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of readableStream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};
export async function downloadFromS3AndParse(fileKey: string) {
  const s3 = new S3({
    accessKeyId: process.env.NEXT_PUBLIC_OCI_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_OCI_SECRET_ACCESS_KEY!,
    endpoint: process.env.NEXT_PUBLIC_OCI_ENDPOINT!,
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
    region: process.env.NEXT_PUBLIC_OCI_REGION!,
  })

  const obj = await s3
    .getObject({
      Bucket: process.env.NEXT_PUBLIC_OCI_BUCKET_NAME!,
      Key: fileKey,
    })
    .promise()
  if (!obj.Body) {
    throw new Error("File not found or empty in S3.");
  }

  const fileBuffer =
    obj.Body instanceof Buffer ? obj.Body : await streamToBuffer(obj.Body);

  // ✅ Use LangChain PDFLoader directly on buffer
  const loader = new PDFLoader(new Blob([fileBuffer]), {
    splitPages: true
  });

  const docs = await loader.load();

  return docs;
}