import React, { useState, useRef, useEffect } from 'react';
import { Message } from './types';
import { streamAiChatResponse } from './services/geminiService';
import { SendIcon, UserIcon, AiIcon, VietnamFlagIcon } from './components/Icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';


// A simple UUID generator for message IDs.
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: Message = { id: uuidv4(), text: input, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);
    setError(null);

    const aiMessageId = uuidv4();
    setMessages((prev) => [...prev, { id: aiMessageId, text: '', sender: 'ai' }]);

    try {
      await streamAiChatResponse(currentInput, (chunk) => {
        setMessages((prev) => {
          return prev.map((msg) =>
            msg.id === aiMessageId ? { ...msg, text: msg.text + chunk } : msg
          );
        });
      });
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
      setMessages((prev) => prev.filter((msg) => msg.id !== aiMessageId)); // Remove empty AI message on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <header className="flex items-center justify-center gap-3 p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-10">
        <VietnamFlagIcon />
        <h1 className="text-xl font-bold">AI hỗ trợ học tập</h1>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {messages.map((message) => (
            <div key={message.id} className={`flex items-start gap-4 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.sender === 'ai' && (
                <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center bg-emerald-500 text-white">
                  <AiIcon className="w-6 h-6" />
                </div>
              )}

              <div className={`max-w-xl rounded-2xl p-4 shadow-md ${message.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                 <div className="prose prose-sm max-w-none text-inherit dark:prose-invert prose-p:my-2 prose-ul:my-2 prose-ol:my-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.text || "▍"}
                    </ReactMarkdown>
                  </div>
              </div>
              
              {message.sender === 'user' && (
                 <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center bg-blue-600 text-white">
                  <UserIcon className="w-6 h-6" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 sticky bottom-0">
        <div className="max-w-4xl mx-auto">
          {error && <p className="text-red-500 text-center text-sm mb-2">{error}</p>}
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Nhập câu hỏi của bạn tại đây..."
              disabled={isLoading}
              className="w-full px-5 py-3 pr-14 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-blue-600 text-white disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
              aria-label="Gửi"
            >
              <SendIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;