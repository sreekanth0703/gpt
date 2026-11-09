import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, MessageSquare, Menu, User, Bot, ArrowLeft, Check, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function ChatPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);
  
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat sessions on initial mount
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/chat/sessions/')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setSessions(data);
          setCurrentSessionId(data[0].id);
        } else {
          createNewChat();
        }
      })
      .catch(err => console.error("Failed to fetch sessions", err));
  }, []);

  // Create new chat session
  const createNewChat = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/chat/create/', { method: 'POST' });
      const data = await res.json();
      setSessions(prev => [{ id: data.session_id, title: data.title }, ...prev]);
      setCurrentSessionId(data.session_id);
      setMessages([]);
      inputRef.current?.focus();
    } catch (err) {
      console.error("Failed to create session", err);
    }
  };

  // Switch session & open WebSocket connection
  useEffect(() => {
    if (!currentSessionId) return;

    fetch(`http://127.0.0.1:8000/api/chat/history/${currentSessionId}/`)
      .then(res => res.json())
      .then(data => setMessages(data.messages || []));

    if (wsRef.current) wsRef.current.close();

    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${currentSessionId}/`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (data.sender === 'assistant' && lastMsg && lastMsg.role === 'assistant' && !lastMsg.done) {
          return [
            ...prev.slice(0, -1),
            { ...lastMsg, content: lastMsg.content + data.message, done: data.done }
          ];
        } else {
          return [...prev, { role: data.sender, content: data.message, done: data.done || false }];
        }
      });
    };

    return () => ws.close();
  }, [currentSessionId]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({ message: input }));
    setInput('');
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="flex h-screen bg-[#343541] text-gray-100 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} bg-[#202123] flex flex-col transition-all duration-300 overflow-hidden shrink-0 border-r border-gray-800`}>
        <div className="p-3 flex gap-2">
          <button 
            onClick={createNewChat}
            className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-600 text-sm hover:bg-gray-700 transition"
          >
            <Plus size={16} /> New chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => setCurrentSessionId(session.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm truncate hover:bg-[#2A2B32] transition ${currentSessionId === session.id ? 'bg-[#343541]' : ''}`}
            >
              <MessageSquare size={16} />
              <span className="truncate">{session.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative">
        
        {/* Top Header */}
        <div className="h-14 border-b border-gray-700 flex items-center justify-between px-4 bg-[#343541] shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-700 rounded-lg transition">
              <Menu size={20} />
            </button>
            <span className="font-semibold text-sm">AI Assistant Workspace</span>
          </div>

          {/* Optional Home/Exit Button */}
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-1.5 text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-md transition"
          >
            <ArrowLeft size={14} /> Exit Chat
          </button>
        </div>

        {/* Message Stream Window */}
        <div className="flex-1 overflow-y-auto pb-36">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <h1 className="text-4xl font-bold mb-4">What can I help with today?</h1>
              <p className="text-gray-400 text-sm">Start a conversation using the chat box below.</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div 
                key={index} 
                className={`py-6 px-4 md:px-24 lg:px-48 flex gap-4 ${msg.role === 'assistant' ? 'bg-[#444654]' : 'bg-[#343541]'}`}
              >
                <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'bg-emerald-600' : 'bg-purple-600'}`}>
                  {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                </div>
                
                <div className="flex-1 leading-relaxed text-sm md:text-base overflow-x-auto">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeString = String(children).replace(/\n$/, '');
                        const codeId = `${index}-${Math.random()}`;

                        if (!inline && match) {
                          return (
                            <div className="relative rounded-md my-4 overflow-hidden bg-[#1e1e1e]">
                              <div className="bg-[#2d2d2d] px-4 py-1.5 text-xs text-gray-400 flex justify-between items-center">
                                <span>{match[1]}</span>
                                <button 
                                  onClick={() => copyToClipboard(codeString, codeId)}
                                  className="flex items-center gap-1 hover:text-white transition"
                                >
                                  {copiedCode === codeId ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                  <span>{copiedCode === codeId ? 'Copied!' : 'Copy code'}</span>
                                </button>
                              </div>
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {codeString}
                              </SyntaxHighlighter>
                            </div>
                          );
                        }
                        return <code className="bg-gray-700 px-1.5 py-0.5 rounded text-sm" {...props}>{children}</code>;
                      }
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#343541] via-[#343541] to-transparent">
          <form onSubmit={sendMessage} className="max-w-3xl mx-auto relative flex">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message ChatGPT..."
              className="w-full bg-[#40414F] text-white pl-4 pr-12 py-3.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-500 shadow-lg"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="absolute right-3 top-3.5 p-1.5 rounded-lg bg-white text-gray-900 disabled:opacity-40 hover:bg-gray-200 transition"
            >
              <Send size={16} />
            </button>
          </form>
          <div className="text-center text-xs text-gray-400 mt-2">
            ChatGPT Clone Page with React Router.
          </div>
        </div>

      </div>
    </div>
  );
}