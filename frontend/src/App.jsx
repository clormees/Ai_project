import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

// --- TŁUMACZENIA ---
const translations = {
  pl: {
    newChat: "Nowy czat",
    placeholder: "Wpisz wiadomość...",
    typing: "Pisanie...",
    error: "Błąd połączenia",
    langName: "Polski",
    welcome: "Cześć! W czym mogę pomóc?",
    deleteConfirm: "Usunąć ten czat?",
    chats: "Twoje czaty"
  },
  en: {
    newChat: "New Chat",
    placeholder: "Type a message...",
    typing: "Thinking...",
    error: "Connection error",
    langName: "English",
    welcome: "Hello! How can I help you?",
    deleteConfirm: "Delete this chat?",
    chats: "Your Chats"
  },
  uk: {
    newChat: "Новий чат",
    placeholder: "Введіть повідомлення...",
    typing: "Думаю...",
    error: "Помилка з'єднання",
    langName: "Українська",
    welcome: "Привіт! Чим можу допомогти?",
    deleteConfirm: "Видалити цей чат?",
    chats: "Ваші чати"
  }
};

// --- IKONY SVG ---
const MenuIcon = () => (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>);
const TrashIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>);
const BotIcon = () => (<div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xs">AI</div>);
const UserIcon = () => (<div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-bold text-xs">TY</div>);
const ClipIcon = () => (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>);

function App() {
  const [lang, setLang] = useState('pl');
  const t = translations[lang];
  
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Stan dla wybranego pliku
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  
  const messagesEndRef = useRef(null);

  useEffect(() => { fetchChats(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading, selectedFile]);

  // --- LOGIKA ---
  
  // Pobieranie listy czatów
  const fetchChats = async () => {
    try {
      const res = await axios.get('https://fakegpt-iiug.onrender.com');
      setChats(res.data);
    } catch (e) { console.error(e); }
  };

  // Tworzenie nowego czatu
  const createNewChat = async () => {
    try {
      const res = await axios.post('https://fakegpt-iiug.onrender.com');
      setChats(prev => [...prev, res.data]);
      setCurrentChatId(res.data.chat_id);
      setMessages([]);
      setIsMobileMenuOpen(false);
    } catch (e) { alert(t.error); }
  };

  // Ładowanie konkretnego czatu
  const loadChat = async (id) => {
    setCurrentChatId(id);
    setIsMobileMenuOpen(false);
    try {
      const res = await axios.get(`https://fakegpt-iiug.onrender.com/${id}`);
      setMessages(res.data);
    } catch (e) { console.error(e); }
  };

  // Usuwanie czatu
  const deleteChat = async (e, id) => {
    e.stopPropagation();
    if (!confirm(t.deleteConfirm)) return;
    try {
      await axios.delete(`https://fakegpt-iiug.onrender.com/${id}`);
      setChats(prev => prev.filter(c => c.id !== id));
      if (currentChatId === id) {
        setCurrentChatId(null);
        setMessages([]);
      }
    } catch (e) { alert(t.error); }
  };

  // Obsługa wyboru pliku
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // --- WYSYŁANIE WIADOMOŚCI ---
  const sendMessage = async () => {
    if (!input.trim() && !selectedFile) return;

    let chatId = currentChatId;
    if (!chatId) {
       try {
         const res = await axios.post('https://fakegpt-iiug.onrender.com');
         chatId = res.data.chat_id;
         setCurrentChatId(chatId);
         setChats(prev => [...prev, res.data]);
       } catch(e) { return; }
    }

    // 1. Przygotowanie lokalnego podglądu (Optimistic UI)
    // Jeśli wybrano plik, tworzymy tymczasowy URL, aby pokazać go w czacie PRZED wysłaniem na serwer
    let imagePreviewUrl = null;
    if (selectedFile) {
        imagePreviewUrl = URL.createObjectURL(selectedFile);
    }

    const userMsg = { 
        role: 'user', 
        text: input, 
        image: imagePreviewUrl // Zapisujemy URL obrazka w wiadomości
    };
    
    setMessages(prev => [...prev, userMsg]);
    
    // Przygotowanie danych (FormData dla plików)
    const formData = new FormData();
    formData.append('message', input || "Analyze this image");
    if (selectedFile) {
        formData.append('file', selectedFile);
    }

    // Czyszczenie pól
    setInput('');
    setSelectedFile(null);
    setIsLoading(true);

    try {
      const res = await axios.post(`https://fakegpt-iiug.onrender.com/chats/${chatId}/message`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessages(prev => [...prev, { role: 'bot', text: res.data.response }]);
      fetchChats(); // Odświeżamy listę, aby zaktualizować tytuł
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', text: `⚠️ ${t.error}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white font-sans text-gray-800 overflow-hidden relative">
      
      {/* LOGO fakeGPT (Prawy górny róg) */}
      <div className="absolute top-4 right-16 md:right-20 z-20 pointer-events-none select-none">
        <span className="text-gray-300 font-bold text-xl tracking-wider opacity-60">fakeGPT</span>
      </div>

      {/* --- PASEK BOCZNY (SIDEBAR) --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-gray-50 border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4">
          <button onClick={createNewChat} className="w-full flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 transition text-sm font-medium text-gray-700">
            <span className="text-xl leading-none">+</span> {t.newChat}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2">
          <p className="px-2 text-xs font-semibold text-gray-400 mb-2 uppercase">{t.chats}</p>
          {chats.map(chat => (
            <div key={chat.id} onClick={() => loadChat(chat.id)} className={`group flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer mb-1 ${currentChatId === chat.id ? 'bg-gray-200 font-medium' : 'hover:bg-gray-100 text-gray-600'}`}>
              <span className="truncate flex-1">{chat.title || t.newChat}</span>
              <button onClick={(e) => deleteChat(e, chat.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition"><TrashIcon /></button>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-100">
          <div className="flex gap-2">
            <button onClick={() => setLang('pl')} className={`flex-1 py-1 text-xs rounded border ${lang==='pl' ? 'bg-white border-green-500 text-green-700 shadow-sm' : 'border-gray-300'}`}>PL</button>
            <button onClick={() => setLang('en')} className={`flex-1 py-1 text-xs rounded border ${lang==='en' ? 'bg-white border-blue-500 text-blue-700 shadow-sm' : 'border-gray-300'}`}>EN</button>
            <button onClick={() => setLang('uk')} className={`flex-1 py-1 text-xs rounded border ${lang==='uk' ? 'bg-white border-blue-400 text-blue-600 shadow-sm' : 'border-gray-300'}`}>UA</button>
          </div>
        </div>
      </aside>

      {/* Tło dla menu mobilnego */}
      {isMobileMenuOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>}

      {/* --- GŁÓWNA CZĘŚĆ --- */}
      <main className="flex-1 flex flex-col relative w-full h-full">
        {/* Nagłówek mobilny */}
        <div className="md:hidden flex items-center justify-between p-4 border-b bg-white z-10">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-1 text-gray-600"><MenuIcon /></button>
          <span className="font-semibold text-gray-700">AI Chat</span>
          <div className="w-6"></div>
        </div>

        {/* Lista wiadomości */}
        <div className="flex-1 overflow-y-auto p-4 pb-40">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
               <div className="text-4xl mb-2">👋</div>
               <p>{t.welcome}</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className="w-full py-4">
                <div className="max-w-3xl mx-auto flex gap-4">
                  {msg.role === 'bot' ? <BotIcon /> : <UserIcon />}
                  <div className="flex-1 pt-1 space-y-2 overflow-hidden text-sm md:text-base leading-relaxed">
                    {msg.role === 'user' ? (
                      <div className="text-gray-800">
                        {/* JEŚLI JEST OBRAZEK - POKAZUJEMY GO */}
                        {msg.image && (
                            <img src={msg.image} alt="Przesłany obraz" className="max-w-xs md:max-w-sm rounded-lg mb-2 shadow-sm border border-gray-200" />
                        )}
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                      </div>
                    ) : (
                      <div className="prose prose-slate max-w-none text-gray-700">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
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

        {/* OBSZAR WPROWADZANIA (INPUT AREA) */}
        <div className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-100 p-4 md:p-6 bg-gradient-to-t from-white via-white to-transparent">
          <div className="max-w-3xl mx-auto relative">
            
            {/* Podgląd pliku (mały, nad inputem) */}
            {selectedFile && (
                <div className="absolute bottom-full left-0 mb-2 p-2 bg-white rounded-lg shadow border border-gray-200 flex items-center gap-2">
                    <span className="text-xs text-gray-500 max-w-[150px] truncate">{selectedFile.name}</span>
                    <button onClick={() => setSelectedFile(null)} className="text-red-500 hover:text-red-700 font-bold">×</button>
                </div>
            )}

            <div className="shadow-sm rounded-xl border border-gray-300 bg-white flex items-center pr-2">
              {/* Ukryte pole input dla pliku */}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
              
              <button onClick={() => fileInputRef.current.click()} className="p-3 text-gray-400 hover:text-gray-600 transition" title="Załącz obraz">
                <ClipIcon />
              </button>
              
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={t.placeholder}
                className="flex-1 py-3 focus:outline-none text-gray-700 placeholder-gray-400"
                disabled={isLoading}
              />
              <button 
                onClick={sendMessage}
                disabled={(!input.trim() && !selectedFile) || isLoading}
                className="p-2 bg-gray-100 hover:bg-black hover:text-white rounded-lg transition disabled:opacity-30 text-gray-500"
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