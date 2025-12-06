"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  User,
  ExternalLink,
  RefreshCcw,
  Sparkles,
  Star,
  TrendingUp,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  text: string;
  matches?: any[];
}

interface OtakuBotProps {
  className?: string;
}

export default function OtakuBot({ className }: OtakuBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Yo 👋 Je suis **OtakuBot**, la mascotte officielle d'**Anisphere** ! Dis-moi ce que tu cherches et je te trouve les meilleurs animes 🎌🔥",
      matches: [],
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => scrollToBottom(), [messages, loading]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", text: input, matches: [] };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const shortHistory = messages.slice(-20);

      const res = await fetch("/api/otakubot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, history: shortHistory }),
      });

      const data = await res.json();

      if (data.reply) {
        const botMsg: Message = {
          role: "assistant",
          text: data.reply,
          matches: data.matches || [],
        };
        setMessages((m) => [...m, botMsg]);
      }
    } catch (err) {
      console.error("Error:", err);
      const errorMsg: Message = {
        role: "assistant",
        text: "Oups ! Une erreur s'est produite 😅 Réessaye !",
        matches: [],
      };
      setMessages((m) => [...m, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  function newConversation() {
    setMessages([
      {
        role: "assistant",
        text: "Nouvelle conversation 🔄🔥 Dis-moi ce que tu cherches 🎌",
        matches: [],
      },
    ]);
  }

  const AnimeCard = ({ anime }: { anime: any }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      onClick={() => setSelectedAnime(anime)}
      className="group relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl cursor-pointer border border-slate-700/50 hover:border-pink-500/50 transition-all"
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={anime.image_url || "/placeholder.jpg"}
          alt={anime.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {anime.score && (
          <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded-lg font-bold text-xs flex items-center gap-1 shadow-lg">
            <Star className="w-3 h-3 fill-current" />
            {anime.score.toFixed(1)}
          </div>
        )}

        {anime.similarity && (
          <div className="absolute top-2 left-2 bg-pink-500 text-white px-2 py-1 rounded-lg font-bold text-xs flex items-center gap-1 shadow-lg">
            <Sparkles className="w-3 h-3" />
            {Math.round(anime.similarity * 100)}%
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-pink-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-xl">
            Voir plus
          </div>
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-bold text-white text-sm line-clamp-2 group-hover:text-pink-400 transition-colors mb-1">
          {anime.title}
        </h3>
        {anime.year && (
          <p className="text-slate-400 text-xs flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {anime.year}
          </p>
        )}
      </div>
    </motion.div>
  );

  const AnimeGrid = ({ matches }: { matches: any[] }) => {
    if (!matches || matches.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4 space-y-3"
      >
        <div className="flex items-center gap-2 text-pink-400 font-bold text-sm">
          <Sparkles className="w-4 h-4" />
          <span>Mes recommandations pour toi :</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {matches.map((anime, i) => (
            <AnimeCard key={anime.id || i} anime={anime} />
          ))}
        </div>
      </motion.div>
    );
  };

  const AnimeModal = ({
    anime,
    onClose,
  }: {
    anime: any;
    onClose: () => void;
  }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl border border-slate-700"
      >
        <div className="relative">
          <div className="relative h-64 overflow-hidden">
            <img
              src={anime.image_url}
              alt={anime.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <div className="space-y-2">
                {anime.score && (
                  <div className="bg-yellow-500 text-black px-3 py-1.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-xl w-fit">
                    <Star className="w-4 h-4 fill-current" />
                    {anime.score.toFixed(1)} / 10
                  </div>
                )}
                {anime.similarity && (
                  <div className="bg-pink-500 text-white px-3 py-1.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-xl w-fit">
                    <Sparkles className="w-4 h-4" />
                    Match à {Math.round(anime.similarity * 100)}%
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-2xl font-black text-white mb-2">
                {anime.title}
              </h2>
              {anime.year && (
                <p className="text-slate-400 text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Année : {anime.year}
                </p>
              )}
            </div>

            {anime.popularity && (
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <div className="bg-slate-800 px-3 py-2 rounded-lg">
                  <span className="text-slate-400">Popularité :</span>{" "}
                  <span className="font-bold">#{anime.popularity}</span>
                </div>
              </div>
            )}

            <a
              href={anime.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl text-center"
            >
              Voir la fiche complète
              <ExternalLink className="w-4 h-4 inline ml-2" />
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  const formatMessageText = (text: string) => {
    return text.replace(/\[\[(.*?)\|(.*?)\]\]/g, "**$1**");
  };

  return (
    <>
      <style jsx global>{`
        /* Scrollbar custom pour le chat uniquement */
        .chat-scroll::-webkit-scrollbar {
          width: 8px;
        }

        .chat-scroll::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
          border-radius: 10px;
        }

        .chat-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #ec4899, #a855f7);
          border-radius: 10px;
        }

        .chat-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #db2777, #9333ea);
        }

        /* Pour Firefox */
        .chat-scroll {
          scrollbar-width: thin;
          scrollbar-color: #ec4899 rgba(15, 23, 42, 0.3);
        }
      `}</style>

      <div className={`flex flex-col h-screen bg-slate-950 ${className}`}>
        {/* Header Fixe (non sticky, juste en haut) */}
        <div className="flex-shrink-0 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/50 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 to-purple-500 rounded-2xl blur-lg opacity-50" />
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-tr from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl">
                    <Bot className="text-white w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </motion.div>

                <div>
                  <h1 className="text-base sm:text-xl font-black text-white flex items-center gap-2">
                    OtakuBot
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
                      AI
                    </span>
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-2 font-medium">
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-2 h-2 bg-green-500 rounded-full"
                    />
                    En ligne · Prêt à recommander
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={newConversation}
                className="px-3 sm:px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-sm rounded-xl text-slate-300 hover:text-white flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wide border border-slate-700 transition-all"
              >
                <RefreshCcw size={16} />
                <span className="hidden sm:inline">Reset</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Zone de Messages avec SCROLL ISOLÉ */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto chat-scroll"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            <AnimatePresence mode="popLayout">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex items-start gap-3 max-w-[85%] sm:max-w-[75%] ${
                      m.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.1 }}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                        m.role === "user"
                          ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                          : "bg-gradient-to-br from-pink-500 to-purple-600"
                      }`}
                    >
                      {m.role === "user" ? (
                        <User size={16} className="text-white sm:w-5 sm:h-5" />
                      ) : (
                        <Bot size={16} className="text-white sm:w-5 sm:h-5" />
                      )}
                    </motion.div>

                    <div className="space-y-3 flex-1">
                      <div
                        className={`px-4 sm:px-5 py-3 sm:py-4 rounded-2xl text-sm leading-relaxed shadow-lg ${
                          m.role === "user"
                            ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-none"
                            : "bg-slate-800/80 backdrop-blur-sm text-slate-100 border border-slate-700/50 rounded-tl-none"
                        }`}
                      >
                        {m.role === "user" ? (
                          <span className="font-medium">{m.text}</span>
                        ) : (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => (
                                <p className="mb-2 last:mb-0">{children}</p>
                              ),
                              strong: ({ children }) => (
                                <strong className="text-pink-400 font-bold">
                                  {children}
                                </strong>
                              ),
                              em: ({ children }) => (
                                <em className="text-purple-400">{children}</em>
                              ),
                              ul: ({ children }) => (
                                <ul className="list-disc list-inside space-y-1 my-2">
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="list-decimal list-inside space-y-1 my-2">
                                  {children}
                                </ol>
                              ),
                            }}
                          >
                            {formatMessageText(m.text)}
                          </ReactMarkdown>
                        )}
                      </div>

                      {m.role === "assistant" &&
                        m.matches &&
                        m.matches.length > 0 && (
                          <AnimeGrid matches={m.matches} />
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
                className="flex justify-start"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Bot size={16} className="text-white sm:w-5 sm:h-5" />
                  </div>
                  <div className="bg-slate-800/80 backdrop-blur-sm px-6 py-4 rounded-2xl flex gap-2 items-center border border-slate-700/50">
                    <motion.span
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                      className="w-2.5 h-2.5 bg-pink-500 rounded-full"
                    />
                    <motion.span
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: 0.2,
                      }}
                      className="w-2.5 h-2.5 bg-purple-500 rounded-full"
                    />
                    <motion.span
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: 0.4,
                      }}
                      className="w-2.5 h-2.5 bg-indigo-500 rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Fixe en bas (non sticky) */}
        <div className="flex-shrink-0 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/50 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative flex-1">
                <input
                  className="w-full bg-slate-900/80 border border-slate-700 focus:border-pink-500 text-white rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all placeholder-slate-500 text-sm font-medium"
                  placeholder="Demande une recommandation... 🎌"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && sendMessage()
                  }
                  disabled={loading}
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all shadow-lg flex-shrink-0 ${
                  input.trim() && !loading
                    ? "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-pink-500/50"
                    : "bg-slate-800 text-slate-600 cursor-not-allowed"
                }`}
              >
                <Send size={18} className="sm:w-5 sm:h-5" />
              </motion.button>
            </div>

            <p className="text-slate-500 text-xs mt-3 text-center font-medium">
              💡 Décris ce que tu veux regarder et je te trouve les meilleurs
              animes !
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedAnime && (
          <AnimeModal
            anime={selectedAnime}
            onClose={() => setSelectedAnime(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
