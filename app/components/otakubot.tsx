"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, ExternalLink, RefreshCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  text: string;
}

interface OtakuBotProps {
  className?: string; // pour personnaliser la taille ou le style depuis la page
}

export default function OtakuBot({ className }: OtakuBotProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("otakubot_history");
      if (saved) return JSON.parse(saved);
    }
    return [
      {
        role: "assistant",
        text: "Yo 👋 Je suis OtakuBot la mascotte officiel de Anisphère ! Dis-moi ce que tu cherches 🎌🔥",
      },
    ];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => scrollToBottom(), [messages, loading]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("otakubot_history", JSON.stringify(messages));
    }
  }, [messages]);

  async function sendMessage() {
    if (!input.trim()) return;
    const userMsg = { role: "user", text: input };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    const shortHistory = messages.slice(-20);

    const res = await fetch("/api/otakubot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input, history: shortHistory }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.reply) {
      setMatches(data.matches ?? []);
      const botMsg = { role: "assistant", text: data.reply };
      setMessages((m) => [...m, botMsg]);
    }

    setInput("");
  }

  function newConversation() {
    setMessages([
      {
        role: "assistant",
        text: "Nouvelle conversation 🔄🔥 Dis-moi ce que tu cherches 🎌",
      },
    ]);
    setMatches([]);
    localStorage.removeItem("otakubot_history");
  }

  const formatMessageWithMatches = (text: string) =>
    text.replace(/\[\[(.*?)\|(.*?)\]\]/g, (_, title) => {
      const match = matches.find((m) => m.title === title);
      return `[${title}](${match ? match.url : "#"})`;
    });

  return (
    <div
      className={`flex flex-col h-full bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-800 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Bot className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">
              OtakuBot <span className="text-pink-500">AI</span>
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>{" "}
              Online
            </p>
          </div>
        </div>
        <button
          onClick={newConversation}
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 flex items-center gap-1 text-xs uppercase tracking-wide"
        >
          <RefreshCcw size={16} /> Reset
        </button>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <AnimatePresence>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex items-start gap-3 max-w-[90%] ${
                  m.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    m.role === "user" ? "bg-indigo-600" : "bg-slate-800"
                  }`}
                >
                  {m.role === "user" ? (
                    <User size={14} />
                  ) : (
                    <Bot size={14} className="text-pink-500" />
                  )}
                </div>
                <div
                  className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-indigo-600 text-white rounded-tr-none"
                      : "bg-slate-800/50 text-slate-200 border border-slate-700/50 rounded-tl-none"
                  }`}
                >
                  {m.role === "user" ? (
                    <span>{m.text}</span>
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-pink-500/40 text-pink-400 hover:bg-pink-500 hover:text-white transition-all duration-300 text-xs font-semibold uppercase tracking-wide"
                          >
                            {children} <ExternalLink size={12} />
                          </a>
                        ),
                      }}
                    >
                      {formatMessageWithMatches(m.text)}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start ml-11"
          >
            <div className="bg-slate-800/50 px-4 py-3 rounded-2xl flex gap-1 items-center h-[40px]">
              <span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-slate-900/80 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <input
            className="w-full bg-slate-950/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-pink-500"
            placeholder="Demande une recommandation..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className={`p-3 rounded-xl ${
              input.trim()
                ? "bg-pink-600 hover:bg-pink-500 text-white shadow-lg"
                : "bg-slate-800 text-slate-600"
            }`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
