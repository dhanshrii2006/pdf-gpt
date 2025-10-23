import { NextRequest, NextResponse } from 'next/server'
import { StreamingTextResponse, Message } from 'ai'
import { db } from '@/db'
import { chats } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getContext } from '@/lib/context'
import { messages as _messages } from '@/db/schema'
import { GoogleGenAI } from '@google/genai'

const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const {
      messages,
      chatId,
    }: {
      messages: Message[]
      chatId: number
    } = await request.json()

    await getFileKeyByChatId(chatId, () => {
      return NextResponse.json({ error: 'Chat not found' })
    })

    const lastMessage = messages[messages.length - 1]
    console.log(lastMessage);
    const context = await getContext(lastMessage.content, chatId)
    console.log("context", context);
    
    const prompt = `AI assistant is a brand new, powerful, human-like artificial intelligence.
The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
AI is a well-behaved and well-mannered individual.
AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
START CONTEXT BLOCK
${context}
END OF CONTEXT BLOCK
AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
AI assistant will not apologize for previous responses, but instead will indicated new information was gained.
AI assistant will not invent anything that is not drawn directly from the context.

IMPORTANT: Respond in plain text only.
Do not use Markdown, bullet points, numbering, headings, bold, italics, or special formatting.
`;

    const conversationHistory = messages
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');

    const fullPrompt = `${prompt}\n\nConversation:\n${conversationHistory}\n\nassistant:`;

    const response = await genAI.models.generateContentStream({
      model: 'gemini-2.0-flash-exp',
      contents: fullPrompt,
    });

    await db.insert(_messages).values({
      chatId,
      content: lastMessage.content,
      role: 'user',
    })

    let fullText = "";
    
    // Create a readable stream that formats data for AI SDK
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of response) {
            const text = chunk.text;
            if (text) {
              fullText += text;
              // Format as data stream with newline separator (AI SDK v3 format)
              const formatted = `0:${JSON.stringify(text)}\n`;
              controller.enqueue(encoder.encode(formatted));
            }
          }
        } catch (err) {
          console.error('Stream error:', err);
          controller.error(err);
        } finally {
          // Save the complete response to database
          if (fullText) {
            await db.insert(_messages).values({
              chatId,
              content: fullText,
              role: 'system',  // Keep as 'system' for database
            });
          }
          controller.close();
        }
      },
    });

    // Return with proper headers for AI SDK streaming
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Vercel-AI-Data-Stream': 'v1',
      },
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: 'Something is going wrong ...' },
      { status: 500 }
    )
  }
}

async function getFileKeyByChatId(chatId: number, onError: Function) {
  const _chats = await db.select().from(chats).where(eq(chats.id, chatId))
  if (_chats.length !== 1) onError()
  return _chats[0].fileKey
}