import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

// --- LINK DO BACKENDU (RENDER) ---
const API_BASE = "https://fakegpt-iiug.onrender.com";

// --- KOMPONENT ANIMACJI PISANIA (POPRAWIONY) ---
const Typewriter = ({ text, speed = 15 }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    setDisplayedText(''); 
    let i = 0;
    const timer = setInterval(() => {
      i++;
      if (i <= text.length) {
        setDisplayedText(text.slice(0, i)); 
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return <ReactMarkdown>{displayedText}</ReactMarkdown>;
};

// --- TŁUMACZENIA ---
const translations = {
  pl: {
    newChat: "Nowy czat",
    placeholder: "Wpisz wiadomość...",
    typing: "Pisanie...",
    error: "Błąd połączenia",
    welcome: "Cześć! W czym mogę pomóc?",
    deleteConfirm: "Usunąć ten czat?",
    chats: "Twoje czaty",
    theme: "Motyw"
  },
  en: {
    newChat: "New Chat",
    placeholder: "Type a message...",
    typing: "Thinking...",
    error: "Connection error",
    welcome: "Hello! How can I help you?",
    deleteConfirm: "Delete this chat?",
    chats: "Your Chats",
    theme: "Theme"
  },
  uk: {
    newChat: "Новий чат",
    placeholder: "Введіть повідомлення...",
    typing: "Думаю...",
    error: "Помилка з'єднання",
    welcome: "Привіт! Чим можу допомогти?",
    deleteConfirm: "Видалити цей чат?",
    chats: "Ваші чати",
    theme: "Тема"
  }
};

// --- IKONY ---
const MenuIcon = () => (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>);
const TrashIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>);
const BotIcon = () => (<div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xs">AI</div>);
const UserIcon = () => (<div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold text-xs">TY</div>);
const ClipIcon = () => (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>);
const SunIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>);
const MoonIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>);

function App() {
  const [lang, setLang] = useState('pl');
  const [darkMode, setDarkMode] = useState(true);
  const t = translations[lang];
  
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  
  const messagesEndRef = useRef(null);

  useEffect(() => { fetchChats(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading, selectedFile]);

  // --- LOGIKA ---
  const fetchChats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/chats`);
      setChats(res.data);
    } catch (e) { console.error(e); }
  };

  const createNewChat = async () => {
    try {
      const res = await axios.post(`${API_BASE}/chats/new`);
      setChats(prev => [...prev, res.data]);
      setCurrentChatId(res.data.chat_id);
      setMessages([]);
      setIsMobileMenuOpen(false);
    } catch (e) { alert(t.error); }
  };

  const loadChat = async (id) => {
    setCurrentChatId(id);
    setIsMobileMenuOpen(false);
    try {
      const res = await axios.get(`${API_BASE}/chats/${id}`);
      setMessages(res.data);
    } catch (e) { console.error(e); }
  };

  const deleteChat = async (e, id) => {
    e.stopPropagation();
    if (!confirm(t.deleteConfirm)) return;
    try {
      await axios.delete(`${API_BASE}/chats/${id}`);
      setChats(prev => prev.filter(c => c.id !== id));
      if (currentChatId === id) {
        setCurrentChatId(null);
        setMessages([]);
      }
    } catch (e) { alert(t.error); }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() && !selectedFile) return;

    let chatId = currentChatId;
    if (!chatId) {
       try {
         const res = await axios.post(`${API_BASE}/chats/new`);
         chatId = res.data.chat_id;
         setCurrentChatId(chatId);
         setChats(prev => [...prev, res.data]);
       } catch(e) { return; }
    }

    let imagePreviewUrl = null;
    if (selectedFile) imagePreviewUrl = URL.createObjectURL(selectedFile);

    const userMsg = { role: 'user', text: input, image: imagePreviewUrl };
    setMessages(prev => [...prev, userMsg]);
    
    const formData = new FormData();
    formData.append('message', input || "Analyze this image");
    if (selectedFile) formData.append('file', selectedFile);

    setInput('');
    setSelectedFile(null);
    setIsLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/chats/${chatId}/message`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessages(prev => [...prev, { role: 'bot', text: res.data.response }]);
      fetchChats(); 
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', text: `⚠️ ${t.error}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Style CSS
  const themeClasses = {
    bg: darkMode ? "bg-black text-gray-100" : "bg-white text-gray-800",
    sidebar: darkMode ? "bg-gray-900 border-gray-800" : "bg-gray-50 border-gray-200",
    sidebarText: darkMode ? "text-gray-300" : "text-gray-700",
    hover: darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100",
    activeChat: darkMode ? "bg-gray-800 text-white" : "bg-gray-200 font-medium",
    inputBg: darkMode ? "bg-[#2f2f2f] text-white border-none" : "bg-white text-gray-800 border border-gray-300",
    botText: darkMode ? "text-gray-200" : "text-gray-800",
    userText: darkMode ? "text-white" : "text-gray-800",
    border: darkMode ? "border-gray-800" : "border-gray-200"
  };

  return (
    // Główny kontener
    <div className={`flex h-[100dvh] font-sans overflow-hidden relative ${themeClasses.bg}`}>
      
      {/* --- LOGO DESKTOP (Środek góra, tylko na PC) --- */}
      <div className="hidden md:block absolute top-4 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none select-none">
        <span className="font-bold text-xl tracking-wider text-white opacity-80">fakeGPT</span>
      </div>

      {/* --- SIDEBAR --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 flex flex-col border-r
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        ${themeClasses.sidebar}
      `}>
        <div className="p-4">
          <button 
            onClick={createNewChat} 
            className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg shadow-sm transition text-sm font-medium ${darkMode ? "bg-gray-800 text-white hover:bg-gray-700 border border-gray-700" : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"}`}
          >
            <span className="text-xl leading-none">+</span> {t.newChat}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          <p className="px-2 text-xs font-semibold opacity-50 mb-2 uppercase">{t.chats}</p>
          {chats.map(chat => (
            <div key={chat.id} onClick={() => loadChat(chat.id)} className={`group flex items-center justify-between px-3 py-3 text-sm rounded-lg cursor-pointer mb-1 transition-colors ${currentChatId === chat.id ? themeClasses.activeChat : `${themeClasses.hover} ${themeClasses.sidebarText}`}`}>
              <span className="truncate flex-1">{chat.title || t.newChat}</span>
              <button onClick={(e) => deleteChat(e, chat.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition"><TrashIcon /></button>
            </div>
          ))}
        </div>

        {/* USTAWIENIA */}
        <div className={`p-4 border-t ${themeClasses.border}`}>
          <div className="flex items-center justify-between mb-4">
             <span className="text-xs font-bold opacity-50 uppercase">{t.theme}</span>
             <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full transition ${darkMode ? "bg-gray-800 text-yellow-400 hover:bg-gray-700" : "bg-gray-200 text-gray-600 hover:bg-gray-300"}`}>
               {darkMode ? <SunIcon /> : <MoonIcon />}
             </button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setLang('pl')} className={`flex-1 py-1 text-xs rounded border ${lang==='pl' ? (darkMode ? 'bg-gray-800 border-green-600 text-green-400' : 'bg-white border-green-500 text-green-700') : (darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-300')}`}>PL</button>
            <button onClick={() => setLang('en')} className={`flex-1 py-1 text-xs rounded border ${lang==='en' ? (darkMode ? 'bg-gray-800 border-blue-600 text-blue-400' : 'bg-white border-blue-500 text-blue-700') : (darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-300')}`}>EN</button>
            <button onClick={() => setLang('uk')} className={`flex-1 py-1 text-xs rounded border ${lang==='uk' ? (darkMode ? 'bg-gray-800 border-blue-400 text-blue-300' : 'bg-white border-blue-400 text-blue-600') : (darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-300')}`}>UA</button>
          </div>
        </div>
      </aside>

      {isMobileMenuOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>}

      <main className="flex-1 flex flex-col relative w-full h-full">
        {/* --- NAGŁÓWEK MOBILNY (Tylko telefon) --- */}
        <div className={`md:hidden flex items-center justify-between p-4 border-b z-10 ${themeClasses.bg} ${themeClasses.border}`}>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-1"><MenuIcon /></button>
          {/* TUTAJ ZMIANA: fakeGPT na środku, biały */}
          <span className="font-bold text-xl tracking-wider text-white">fakeGPT</span>
          <div className="w-6"></div>
        </div>

        {/* LISTA WIADOMOŚCI */}
        <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-50">
               <div className="text-4xl mb-4 bg-gray-800 p-4 rounded-full">🤖</div>
               <p className="text-lg font-medium">{t.welcome}</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className="w-full py-4">
                <div className="max-w-3xl mx-auto flex gap-4">
                  {msg.role === 'bot' ? <BotIcon /> : <UserIcon />}
                  <div className={`flex-1 pt-1 space-y-2 overflow-hidden text-sm md:text-base leading-relaxed ${msg.role === 'user' ? themeClasses.userText : themeClasses.botText}`}>
                    {msg.role === 'user' ? (
                      <div>
                        {msg.image && <img src={msg.image} alt="Upload" className="max-w-xs rounded-lg mb-2 shadow-sm border border-gray-600" />}
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                      </div>
                    ) : (
                      <div className={`prose max-w-none ${darkMode ? "prose-invert" : ""}`}>
                        {idx === messages.length - 1 ? (<Typewriter text={msg.text} />) : (<ReactMarkdown>{msg.text}</ReactMarkdown>)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && <div className="max-w-3xl mx-auto flex gap-4 px-4 py-4 opacity-50"><BotIcon /><div className="text-sm pt-2 animate-pulse">{t.typing}</div></div>}
          <div ref={messagesEndRef} />
        </div>

        {/* OBSZAR WPROWADZANIA */}
        <div className={`w-full p-4 md:p-6 bg-gradient-to-t shrink-0 ${darkMode ? "from-black via-black to-transparent" : "from-white via-white to-transparent"}`}>
          <div className="max-w-3xl mx-auto relative">
            {selectedFile && (
                <div className={`absolute bottom-full left-0 mb-2 p-2 rounded-lg shadow border flex items-center gap-2 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                    <span className="text-xs opacity-70 max-w-[150px] truncate">{selectedFile.name}</span>
                    <button onClick={() => setSelectedFile(null)} className="text-red-500 hover:text-red-400 font-bold">×</button>
                </div>
            )}
            <div className={`shadow-lg rounded-xl flex items-center pr-2 ${themeClasses.inputBg}`}>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
              <button onClick={() => fileInputRef.current.click()} className="p-3 opacity-50 hover:opacity-100 transition" title="Załącz obraz"><ClipIcon /></button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={t.placeholder}
                className="flex-1 py-3 bg-transparent focus:outline-none placeholder-opacity-50"
                disabled={isLoading}
              />
              <button 
                onClick={sendMessage}
                disabled={(!input.trim() && !selectedFile) || isLoading}
                className={`p-2 rounded-lg transition ${(!input.trim() && !selectedFile) ? "opacity-30 cursor-not-allowed" : "hover:bg-gray-600 bg-gray-700 text-white"}`}
              >
                <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;