import { db } from '@/db'
import { messages } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { chatId }: { chatId: number } = await request.json()
  const _messages = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))

  // Format messages to match AI SDK Message interface
  const formattedMessages = _messages.map((msg) => ({
    id: msg.id.toString(),
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content,
  }))

  return NextResponse.json(formattedMessages)
}