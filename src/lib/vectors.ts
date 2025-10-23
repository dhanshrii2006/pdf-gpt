import { downloadFromS3AndParse } from './s3-server'
import { getEmbeddings } from './embeddings'


import { db } from '@/db'
import { documents } from '@/db/schema'

async function loadS3IntoVectorDB(fileKey: string, chatId: number) {

  console.log('Downloading S3 object to file system...')
  const document = await downloadFromS3AndParse(fileKey)

  if (!document) throw new Error('Cannot download from S3')
  console.log('PDF downloaded successfully!');
  const vectors = [];
  for (let i = 0; i < document.length; i++) {
    const doc = document[i];
    try {
      const embeddings = await getEmbeddings(doc.pageContent)
      const vectorValues = embeddings?.length && embeddings[0]?.values ? embeddings[0].values : [];
      vectors.push({
        values: vectorValues,
        metadata: {
          fileKey: fileKey,
          pageNumber: doc.metadata.pageNumber as number,
          text: doc.pageContent as string,
        },
      })
    } catch (error) {
      console.log('Error embedding documents', error)
      throw error
    }
  }

  await db.insert(documents).values(vectors.map((vector) => ({
    chatId,
    content: vector.metadata.text,
    embedding: vector.values,
  })))
}



export { loadS3IntoVectorDB }