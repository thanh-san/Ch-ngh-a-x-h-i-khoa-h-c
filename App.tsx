
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getAiChatResponse } from './services/geminiService';
import { Message } from './types';
import { SendIcon, AiIcon } from './components/Icons';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Helper component for rendering a single message
interface MessageProps {
  message: Message;
}

const ChatMessage: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  return (
    <div className={`flex items-start gap-4 my-4 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
          <AiIcon />
        </div>
      )}
      <div
        className={`max-w-xl md:max-w-2xl px-5 py-3 rounded-2xl shadow-md ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none'
        }`}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <Markdown remarkPlugins={[remarkGfm]}>{message.text}</Markdown>
        </div>
      </div>
    </div>
  );
};

// Helper component for loading indicator
const LoadingIndicator: React.FC = () => (
  <div className="flex items-start gap-4 my-4">
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
      <AiIcon />
    </div>
    <div className="max-w-sm px-5 py-3 rounded-2xl shadow-md bg-white dark:bg-gray-800 rounded-bl-none">
      <div className="flex items-center justify-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse"></div>
        <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse [animation-delay:0.2s]"></div>
        <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse [animation-delay:0.4s]"></div>
      </div>
    </div>
  </div>
);

// Helper component for the chat input form
interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center p-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
    >
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Đặt câu hỏi của bạn ở đây..."
        className="flex-grow px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading}
        className="ml-3 flex-shrink-0 p-3 rounded-full text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
      >
        <SendIcon />
      </button>
    </form>
  );
};

// Main App Component
export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial-ai-message',
      text: 'Xin chào! Tôi là trợ lý AI chuyên về Chủ nghĩa xã hội khoa học. Bạn có câu hỏi nào cần giải đáp không?',
      sender: 'ai',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = useCallback(async (text: string) => {
    const userMessage: Message = { id: Date.now().toString(), text, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const aiResponseText = await getAiChatResponse(text);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        sender: 'ai',
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Rất tiếc, đã có lỗi xảy ra. Vui lòng thử lại.',
        sender: 'ai',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="flex flex-col h-screen font-sans bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-md p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto flex items-center">
            <div className="p-2 mr-3 rounded-full bg-blue-600 text-white">
                <i className="fa-solid fa-star"></i>
            </div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">Trợ lý CNXHKH</h1>
        </div>
      </header>

      <main className="flex-grow p-4 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isLoading && <LoadingIndicator />}
          <div ref={chatEndRef} />
        </div>
      </main>

      <footer className="sticky bottom-0 z-10">
         <div className="max-w-4xl mx-auto">
            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
         </div>
      </footer>
    </div>
  );
}
