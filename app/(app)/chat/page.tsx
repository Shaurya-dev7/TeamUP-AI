import { Suspense } from "react";
import ChatClient from "@/components/chat/ChatClient";

export default function ChatPage() {
  return (
    <Suspense fallback={<div>Loading chat...</div>}>
      <ChatClient />
    </Suspense>
  );
}

