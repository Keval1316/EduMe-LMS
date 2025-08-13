import React, { useEffect, useRef, useState } from 'react';
import { Send, MessageSquare, X, Loader2 } from 'lucide-react';
import { sendChat } from '../../api/aiAssistantApi';
import useAuthStore from '../../store/authStore';

const initialWelcome = {
  role: 'assistant',
  content: "Hi! I'm your EduMe AI Learning Assistant. Ask me anything about your courses, concepts, or assignments."
};

export default function AIAssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([initialWelcome]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollerRef = useRef(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (open && scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [open, messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const newMsgs = [...messages, { role: 'user', content: text }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);
    try {
      const context = user ? `Student: ${user.fullName} (email: ${user.email})` : undefined;
      const { reply } = await sendChat(newMsgs, { course_context: context });
      setMessages((prev) => [...prev, { role: 'assistant', content: reply || 'Sorry, I could not generate a response.' }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'There was an error contacting the AI assistant.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        aria-label="Open AI Assistant"
        className="fixed bottom-6 right-6 z-40 rounded-full bg-primary-600 hover:bg-primary-700 text-white p-4 shadow-lg"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X size={22} /> : <MessageSquare size={22} />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 w-full max-w-md z-40 bg-white border border-gray-200 rounded-xl shadow-xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <div className="text-sm font-semibold text-gray-900">AI Learning Assistant</div>
            <div className="text-xs text-gray-500">Powered by Gemini</div>
          </div>
          <div ref={scrollerRef} className="px-4 py-3 h-80 overflow-y-auto space-y-3">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center text-gray-500 text-xs"><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Thinking…</div>
            )}
          </div>
          <div className="p-3 border-t bg-white flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              placeholder="Ask about your course, lesson, or concept…"
              className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            <button
              onClick={handleSend}
              className="rounded-md bg-primary-600 text-white px-3 py-2 text-sm hover:bg-primary-700 disabled:opacity-60"
              disabled={loading || !input.trim()}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
