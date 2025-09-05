import { format } from "date-fns";
import type { Message } from "@shared/schema";

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

export default function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  return (
    <div
      className={`flex mb-3 fade-in ${isOwnMessage ? "justify-end" : "justify-start"}`}
      data-testid={`message-${isOwnMessage ? "outgoing" : "incoming"}-${message.id}`}
    >
      <div
        className={`chat-bubble rounded-lg px-3 py-2 max-w-[85%] sm:max-w-[70%] ${
          isOwnMessage ? "message-outgoing" : "message-incoming"
        }`}
      >
        <p className="text-sm break-words" data-testid="text-message-content">
          {message.text}
        </p>
        <span className="text-xs opacity-70 mt-1 block" data-testid="text-message-timestamp">
          {format(new Date(message.timestamp!), "h:mm a")}
        </span>
      </div>
    </div>
  );
}
