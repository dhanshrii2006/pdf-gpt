'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useChat } from 'ai/react'
import { Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import MessageList from './message-list'
import { Message } from 'ai'

async function getInitialMessages(chatId: number) {
  const url = typeof window !== 'undefined' 
    ? '/api/get-messages' 
    : `${process.env.NEXT_PUBLIC_URL}/api/get-messages`;
    
  const data = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({ chatId }),
    headers: { 'Content-Type': 'application/json' },
  })
  return (await data.json()) as Message[]
}

const ChatComponent = ({ chatId }: { chatId: number }) => {
  const messageContainer = useRef<HTMLDivElement>(null)
  const [initialMessages, setInitialMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    getInitialMessages(chatId).then((fetchedMessages) => {
      console.log('📥 Initial messages loaded:', fetchedMessages.length, fetchedMessages)
      setInitialMessages(fetchedMessages)
      setIsLoading(false)
    }).catch(err => {
      console.error('❌ Error loading initial messages:', err)
      setIsLoading(false)
    })
  }, [chatId])

  const { input, handleInputChange, handleSubmit, messages, isLoading: isChatLoading } = useChat({
    api: '/api/chat',
    body: { chatId },
    initialMessages,
    onResponse(response) {
      console.log('✅ Response received:', response.status, response.headers.get('content-type'))
    },
    onFinish(message) {
      console.log('✅ Message finished:', message)
    },
    onError(error) {
      console.error('❌ Chat error:', error)
    },
  })

  // Debug: Log messages whenever they change
  useEffect(() => {
    console.log('📝 Messages updated:', messages.length, messages)
  }, [messages])

  useEffect(() => {
    messageContainer.current?.scrollTo({
      top: messageContainer.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  return (
    <div className="relative h-screen overflow-scroll" ref={messageContainer}>
      <div className="sticky top-0 inset-x-0 p-2 bg-white h-fit text-xl font-bold border-b">
        Chat
      </div>

      <MessageList messages={messages} isLoading={isLoading || isChatLoading} />

      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 inset-x-0 p-2 bg-white bg-gradient-to-t from-white"
      >
        <div className="flex">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask any question..."
            className="w-full"
          />
          <Button className="bg-blue-600 ml-2">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ChatComponent