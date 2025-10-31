import { GoogleGenAI, Chat } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';

let chat: Chat | null = null;

const initializeChat = (): Chat => {
  // Sử dụng API Key bạn đã cung cấp.
  // QUAN TRỌNG: Không commit key này lên các kho code công khai.
  const API_KEY = "AIzaSyCkVJjbpMuOKnbB4zXb6Tw8a2Pjo_vPp-s";

  if (!API_KEY) {
    throw new Error("API_KEY is not set.");
  }
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  });
};

export const streamAiChatResponse = async (
  userMessage: string,
  onUpdate: (chunk: string) => void
): Promise<void> => {
  try {
    if (!chat) {
      chat = initializeChat();
    }
    
    const stream = await chat.sendMessageStream({ message: userMessage });

    for await (const chunk of stream) {
      onUpdate(chunk.text);
    }
  } catch (error) {
    console.error("Error streaming AI response:", error);
    // Reset chat session on error
    chat = null;
    throw new Error("Đã xảy ra lỗi khi kết nối với AI. Vui lòng thử lại sau.");
  }
};