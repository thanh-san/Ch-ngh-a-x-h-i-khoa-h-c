import { GoogleGenAI, Chat } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';

let chat: Chat | null = null;

const initializeChat = (): Chat => {
  // Dán API Key của bạn vào đây
  const apiKey = "AIzaSyCkVJjbpMuOKnbB4zXb6Tw8a2Pjo_vPp-s"; 

  if (!apiKey) {
    throw new Error("API_KEY environment variable not set");
  }
  const ai = new GoogleGenAI({ apiKey: apiKey });
  
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