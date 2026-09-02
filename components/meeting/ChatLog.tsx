import { Card } from '@/components/ui/Card';

export interface ChatLogMessageItem {
  id: string;
  message: string;
  createdAt: Date;
  user: { name: string };
}

export function ChatLog({ messages }: { messages: ChatLogMessageItem[] }) {
  if (messages.length === 0) {
    return <Card className="p-6 text-sm text-muted-foreground">No messages were sent in this meeting.</Card>;
  }

  return (
    <Card className="max-h-96 space-y-3 overflow-y-auto p-6">
      {messages.map((message) => (
        <div key={message.id} className="text-sm">
          <span className="font-semibold text-foreground">{message.user.name}</span>
          <span className="ml-2 text-muted-foreground">{new Date(message.createdAt).toLocaleTimeString()}</span>
          <p className="mt-1 text-muted-foreground">{message.message}</p>
        </div>
      ))}
    </Card>
  );
}
