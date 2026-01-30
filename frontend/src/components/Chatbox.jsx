import React, { useState, useEffect, useRef } from "react";
import { FaRobot, FaTimes, FaPaperPlane, FaInfoCircle } from "react-icons/fa";
import { geminiAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

const Chatbot = () => {
  const [isGeminiOpen, setIsGeminiOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm your AI health assistant powered by Gemini. How can I help you today?",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [geminiAvailable, setGeminiAvailable] = useState(false);
  const messagesEndRef = useRef(null);
  const { email } = useAuth();

  // ✅ REMOVED: Botpress loading code

  useEffect(() => {
    // Check Gemini status
    geminiAPI
      .getStatus()
      .then((data) => {
        if (data.success && data.data?.enabled) {
          setGeminiAvailable(true);
        }
      })
      .catch(() => {
        setGeminiAvailable(false);
      });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    
    // Add user message
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
    ]);
    setIsLoading(true);

    try {
      const context = email ? { user_email: email } : {};
      const response = await geminiAPI.healthChat(userMessage, context);

      if (response.success && response.data) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: response.data.response || response.data,
          },
        ]);
      } else {
        throw new Error(response.message || "Failed to get response");
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm sorry, I'm having trouble responding right now. Please try again later.",
        },
      ]);
      toast.error("Failed to get response from AI assistant");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Quick Questions
  const quickQuestions = [
    "What are common cold symptoms?",
    "How to improve sleep quality?",
    "Healthy diet tips",
    "Exercise recommendations",
  ];

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
  };

  return (
    <>
      {/* ✅ REMOVED: Botpress webchat div */}
      
      {/* Gemini Chat Toggle Button - Now positioned bottom-right */}
      {geminiAvailable && !isGeminiOpen && (
        <button
          onClick={() => setIsGeminiOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-btn2 to-sky-500 text-white p-4 rounded-full shadow-lg hover:shadow-2xl transition-all z-[9999] flex items-center justify-center group hover:scale-110 animate-pulse"
          aria-label="Open Gemini AI chat"
          title="Gemini AI Assistant"
        >
          <FaRobot size={24} />
          <span className="ml-2 text-xs font-semibold hidden md:inline">Ask AI</span>
        </button>
      )}

      {/* Gemini Chat Window - Now bottom-right */}
      {geminiAvailable && isGeminiOpen && (
        <div className="fixed bottom-0 right-0 md:bottom-6 md:right-6 w-full md:w-96 h-screen md:h-[600px] bg-white md:rounded-lg shadow-2xl flex flex-col z-[9999] border border-gray-200 animate-slideUp">
          {/* Header */}
          <div className="bg-gradient-to-r from-btn2 to-sky-500 text-white p-4 md:rounded-t-lg flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 backdrop-blur-md p-2 rounded-lg">
                <FaRobot className="text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Gemini AI Assistant</h3>
                <p className="text-xs text-white/80">Powered by Google Gemini</p>
              </div>
            </div>
            <button
              onClick={() => setIsGeminiOpen(false)}
              className="hover:bg-white/20 rounded-lg p-2 transition-all hover:rotate-90"
              aria-label="Close chat"
            >
              <FaTimes size={20} />
            </button>
          </div>

          {/* Quick Questions (Show only if no messages yet) */}
          {messages.length === 1 && (
            <div className="p-4 bg-blue-50 border-b border-blue-100">
              <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                <FaInfoCircle className="text-btn2" />
                Quick Questions:
              </p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    className="text-xs bg-white hover:bg-btn2 hover:text-white border border-gray-300 hover:border-btn2 px-3 py-2 rounded-lg transition-all font-medium"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-br from-gray-50 to-blue-50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                } animate-slideUp`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div
                  className={`max-w-[85%] md:max-w-[80%] rounded-2xl p-3 shadow-md ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-btn2 to-sky-500 text-white"
                      : "bg-white text-gray-800 border border-gray-200"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-slideUp">
                <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-md">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-btn2 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-btn2 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-btn2 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Gemini is typing...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white md:rounded-b-lg shadow-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your health question..."
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-btn2 focus:ring-4 focus:ring-btn2/20 transition-all text-sm"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-gradient-to-r from-btn2 to-sky-500 text-white px-5 py-3 rounded-xl hover:from-sky-500 hover:to-btn2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:scale-100"
              >
                <FaPaperPlane />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                💡 Ask about symptoms, diet, exercise, or general health
              </p>
              <button
                onClick={() => setMessages([messages[0]])}
                className="text-xs text-btn2 hover:underline font-semibold"
              >
                Clear Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
