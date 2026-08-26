import {
  useEffect,
  useRef,
  useState,
  type SubmitEvent,
  type KeyboardEvent,
} from "react";

import { Send } from "lucide-react";

interface Props {
  onSend: (message: string) => void;
  onTyping: (isTyping: boolean) => void;
}

export default function ChatInput({
  onSend,
  onTyping,
}: Props) {
  const [message, setMessage] = useState("");

  const typingTimeoutRef = useRef<
    ReturnType<typeof setTimeout> | null
  >(null);

  const handleTyping = (value: string) => {
    setMessage(value);

    if (value.trim().length > 0) {
      onTyping(true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 2000);
    } else {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      onTyping(false);
    }
  };

  const stopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    onTyping(false);
  };

  const handleSubmit = (
    e: SubmitEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage) return;

    onSend(trimmedMessage);

    setMessage("");

    stopTyping();
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      const trimmedMessage = message.trim();

      if (!trimmedMessage) return;

      onSend(trimmedMessage);

      setMessage("");

      stopTyping();
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      onTyping(false);
    };
  }, []);

  const hasMessage =
    message.trim().length > 0;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white px-4 py-3 sm:px-5"
    >
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 transition focus-within:border-blue-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">

        <input
          type="text"
          value={message}
          onChange={(e) =>
            handleTyping(e.target.value)
          }
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />

        <button
          type="submit"
          disabled={!hasMessage}
          aria-label="Send message"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
            hasMessage
              ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:scale-95"
              : "cursor-not-allowed bg-slate-200 text-slate-400"
          }`}
        >
          <Send size={17} />
        </button>
      </div>
    </form>
  );
}