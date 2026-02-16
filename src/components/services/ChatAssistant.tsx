import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ChatIcon } from '../icons/ChatIcon';

const API_KEY = process.env?.API_KEY;

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    if (!API_KEY) {
        setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting. The API key is not configured." }]);
        setIsLoading(false);
        return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const model = 'gemini-2.5-flash';
      
      const chat = ai.chats.create({
        model: model,
        history: messages.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.text }],
        })),
        config: {
          systemInstruction: "You are an AI assistant for Chartered Ease, a company that helps users with business registrations in India like GST and Shop Act. Be friendly, concise, and helpful. Do not answer questions unrelated to Indian business compliance.",
        }
      });
      
      const responseStream = await chat.sendMessageStream({ message: input });

      let fullResponse = '';
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of responseStream) {
        fullResponse += chunk.text;
        setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].text = fullResponse;
            return newMessages;
        });
      }

    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = () => setIsOpen(prev => !prev);

  return (
    <>
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 bg-ease-blue text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-ease-blue/90 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ease-blue focus:ring-offset-2 z-50"
        aria-label="Toggle AI Chat"
      >
        <ChatIcon />
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-full max-w-sm h-[60vh] bg-white rounded-lg shadow-2xl flex flex-col z-50 animate-fade-in-up">
          <header className="bg-ease-blue text-white p-4 rounded-t-lg flex justify-between items-center">
            <h3 className="font-bold">Chartered Ease Business Assistant</h3>
            <button onClick={toggleChat} className="text-white hover:text-gray-200">&times;</button>
          </header>

          <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs md:max-w-sm px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-ease-blue/10 text-gray-800' : 'bg-gray-100 text-gray-800'}`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex justify-start">
                 <div className="max-w-xs md:max-w-sm px-4 py-2 rounded-lg bg-gray-100 text-gray-800">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                    </div>
                 </div>
               </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about the process..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ease-blue"
                disabled={isLoading}
              />
              <button type="submit" className="bg-ease-blue text-white px-4 py-2 rounded-md disabled:bg-ease-blue/50" disabled={isLoading || !input.trim()}>
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};