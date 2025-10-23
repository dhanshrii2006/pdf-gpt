import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { chats } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import ChatSidebar from './chat-sidebar'
import PDFViewer from './PDFViewer'
import ChatComponent from './chat-component'

interface Props {
  params: Promise<{
    chatId: string
  }>
}

const ChatPage = async ({ params }: Props) => {
  const { userId } = await auth()
  if (!userId) {
    return redirect('/auth/sign-in')
  }

  const { chatId } = await params
  const _chats = await db.select().from(chats).where(eq(chats.userId, userId))

  if (!_chats || _chats.length === 0) {
    return redirect('/')
  }

  const currentChat = _chats.find((chat) => chat.id === parseInt(chatId))
  if (!currentChat) {
    return redirect('/')
  }

  return (
    <div className="flex max-h-screen overflow-scroll">
      <div className="flex w-full max-h-screen overflow-scroll">
        {/* Chat Sidebar */}
        <div className="flex-[1] max-w-xs">
          <ChatSidebar chats={_chats} chatId={parseInt(chatId)} />
        </div>

        {/* PDF Viewer */}
        <div className="max-h-screen p-4 overflow-scroll flex-[5]">
          <PDFViewer pdfUrl={currentChat.pdfUrl} />
        </div>

        {/* Chat Component */}
        <div className="flex-[3] border-l-4 border-l-slate-200">
          <ChatComponent chatId={parseInt(chatId)} />
        </div>
      </div>
    </div>
  )
}

export default ChatPage
