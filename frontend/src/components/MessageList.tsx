import {
  useEffect,
  useRef,
  useState,
} from "react";

import { ChevronDown } from "lucide-react";

import type { Message } from "../types";

interface Props {
  messages: Message[];

  typingUser: {
    id: string;
    name: string;
  } | null;

  onLoadOlder: () => void;
  hasMore: boolean;
  loadingOlder: boolean;
}


export default function MessageList({
  messages,
  typingUser,
  onLoadOlder,
  hasMore,
  loadingOlder,
}: Props) {
  const currentUser = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const containerRef =
    useRef<HTMLDivElement>(null);

  const previousMessageCount =
    useRef(0);

  const wasAtBottom =
    useRef(true);

  const previousScrollHeight =
    useRef(0);

  const loadingOlderRef =
    useRef(false);

  const [showScrollButton, setShowScrollButton] =
    useState(false);

  /*
   * Check whether the user is near the bottom.
   */
  const checkIfAtBottom = () => {
    const container = containerRef.current;

    if (!container) {
      return true;
    }

    return (
      container.scrollTop +
      container.clientHeight >=
      container.scrollHeight - 50
    );
  };

  /*
   * Handle initial messages and new messages.
   */
  useEffect(() => {
    const currentCount = messages.length;
    const previousCount =
      previousMessageCount.current;

    // Initial load
    if (
      previousCount === 0 &&
      currentCount > 0
    ) {
      requestAnimationFrame(() => {
        const container = containerRef.current;

        if (!container) return;

        container.scrollTop =
          container.scrollHeight;

        wasAtBottom.current = true;
        setShowScrollButton(false);
      });
    }

    // Older messages were loaded
    else if (loadingOlderRef.current) {
      requestAnimationFrame(() => {
        const container = containerRef.current;

        if (!container) return;

        const newScrollHeight =
          container.scrollHeight;

        const heightDifference =
          newScrollHeight -
          previousScrollHeight.current;

        container.scrollTop =
          heightDifference;

        loadingOlderRef.current = false;
      });
    }

    // New messages
    else if (currentCount > previousCount) {
      if (wasAtBottom.current) {
        requestAnimationFrame(() => {
          const container =
            containerRef.current;

          if (!container) return;

          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth",
          });

          wasAtBottom.current = true;
          setShowScrollButton(false);
        });
      } else {
        setShowScrollButton(true);
      }
    }

    previousMessageCount.current =
      currentCount;
  }, [messages]);
  /*
   * User scrolling.
   */
  const handleScroll = () => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const atBottom = checkIfAtBottom();

    wasAtBottom.current = atBottom;

    if (atBottom) {
      setShowScrollButton(false);
    }

    if (
      container.scrollTop <= 50 &&
      hasMore &&
      !loadingOlderRef.current
    ) {
      previousScrollHeight.current =
        container.scrollHeight;

      loadingOlderRef.current = true;

      onLoadOlder();
    }
  };
  useEffect(() => {
    if (
      loadingOlderRef.current &&
      !loadingOlder
    ) {
      const container = containerRef.current;

      if (container) {
        const newScrollHeight =
          container.scrollHeight;

        const heightDifference =
          newScrollHeight -
          previousScrollHeight.current;

        container.scrollTop = heightDifference;
      }

      loadingOlderRef.current = false;
    }
  }, [messages, loadingOlder]);
  /*
   * Scroll to latest message.
   */
  const scrollToBottom = () => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth",
    });

    wasAtBottom.current = true;
    setShowScrollButton(false);
  };

  const getInitial = (name?: string) => {
    return name?.charAt(0).toUpperCase() || "?";
  };

  return (
    <div className="relative h-full min-h-0">
      {/* ONLY THIS ELEMENT SCROLLS */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full min-h-0 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6"
      >
        {loadingOlder && (
          <div className="flex justify-center pb-3">
            <span className="text-xs text-slate-400">
              Loading older messages...
            </span>
          </div>
        )}
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-xl">
                💬
              </div>

              <h3 className="font-semibold text-slate-800">
                No messages yet
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Start the conversation!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              /*
               * Join / Leave
               */
              if (
                message.type === "join" ||
                message.type === "leave"
              ) {
                return (
                  <div
                    key={message._id}
                    className="flex justify-center py-1"
                  >
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${message.type === "join"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-slate-100 text-slate-500"
                        }`}
                    >
                      {message.message}
                    </span>
                  </div>
                );
              }

              const own =
                String(message.sender) ===
                String(currentUser.id);

              return (
                <div
                  key={message._id}
                  className={`flex items-end gap-2 ${own
                    ? "justify-end"
                    : "justify-start"
                    }`}
                >
                  {!own && (
                    <div className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                      {getInitial(message.senderName)}
                    </div>
                  )}

                  <div
                    className={`max-w-[75%] sm:max-w-md ${own
                      ? "items-end"
                      : "items-start"
                      }`}
                  >
                    <p
                      className={`mb-1 text-xs font-medium text-slate-500 ${own ? "mr-1 text-right" : "ml-1"
                        }`}
                    >
                      {message.senderName}
                    </p>

                    <div
                      className={`rounded-2xl px-4 py-2.5 shadow-sm ${own
                        ? "rounded-br-md bg-blue-600 text-white"
                        : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
                        }`}
                    >
                      <p className="wrap-break-word whitespace-pre-wrap text-sm leading-5">
                        {message.message}
                      </p>

                      <p
                        className={`mt-1 text-[10px] ${own
                          ? "text-blue-100"
                          : "text-slate-400"
                          }`}
                      >
                        {new Date(
                          message.createdAt
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {own && (
                    <div className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                      {getInitial(
                        currentUser.name ||
                        currentUser.username ||
                        "You"
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {typingUser && (
              <div className="flex items-end gap-2 pt-1">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                  {getInitial(typingUser.name)}
                </div>

                <div>
                  <p className="mb-1 ml-1 text-xs font-medium text-slate-500">
                    {typingUser.name}
                  </p>

                  <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            {/* Scroll target */}
          </div>
        )}
      </div>


      {/* New message / scroll-to-bottom button */}
      {showScrollButton && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-5 left-1/2 z-10 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-blue-600 shadow-lg transition hover:bg-blue-50"
          aria-label="Scroll to latest message"
        >
          <ChevronDown size={20} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}