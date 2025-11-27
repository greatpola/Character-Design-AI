
import React, { useState, useEffect, useRef } from 'react';
import { User, SavedCharacter, Message } from '../types';
import { characterStorage } from '../services/characterStorage';
import { messageStorage } from '../services/messageStorage';
import { ShareMenu } from './ShareMenu';
import { Calendar, Activity, LogIn, Download, Trash2, ArrowLeft, Image as ImageIcon, Send, MessageSquare, User as UserIcon, Shield } from 'lucide-react';

interface MyPageProps {
  user: User;
  onBack: () => void;
  onLogout: () => void;
}

export const MyPage: React.FC<MyPageProps> = ({ user, onBack, onLogout }) => {
  const [savedCharacters, setSavedCharacters] = useState<SavedCharacter[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCharacters();
    loadMessages();
  }, [user.email]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadCharacters = () => {
    setSavedCharacters(characterStorage.getUserCharacters(user.email));
  };

  const loadMessages = () => {
    setMessages(messageStorage.getConversation(user.email));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('정말로 이 캐릭터를 삭제하시겠습니까?')) {
      characterStorage.deleteCharacter(id);
      loadCharacters();
    }
  };

  const handleDownload = (char: SavedCharacter) => {
    const link = document.createElement('a');
    link.href = `data:${char.mimeType};base64,${char.imageData}`;
    link.download = `my-character-${char.timestamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      // Send to Admin ID
      messageStorage.sendMessage(user.email, 'media@greatpola.com', 'user', newMessage);
      setNewMessage('');
      loadMessages();
    } catch (error) {
      alert('메시지 전송 중 오류가 발생했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatMessageTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
            title="앱으로 돌아가기"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
             <h1 className="text-xl font-bold text-slate-800">마이 페이지</h1>
             <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
               {user.nickname || user.email}
             </span>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="text-sm font-medium text-slate-500 hover:text-red-600 px-3 py-2 transition-colors"
        >
          로그아웃
        </button>
      </nav>

      <main className="container mx-auto max-w-5xl p-6 space-y-8">
        
        {/* Stats Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-full text-blue-600">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">가입일</p>
              <p className="text-lg font-bold text-slate-800">{formatDate(user.joinedAt)}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="bg-purple-50 p-3 rounded-full text-purple-600">
              <LogIn className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">총 로그인 횟수</p>
              <p className="text-lg font-bold text-slate-800">{user.loginCount || 1}회</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="bg-green-50 p-3 rounded-full text-green-600">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">캐릭터 생성 횟수</p>
              <p className="text-lg font-bold text-slate-800">{user.usageCount || 0}회</p>
            </div>
          </div>
        </section>

        {/* 1:1 Inquiry Section (Chat Style) */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
          <div className="bg-slate-800 text-white p-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            <span className="font-bold">1:1 관리자 문의</span>
          </div>
          
          {/* Chat History */}
          <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-50">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <p>문의사항이 있으시면 메시지를 남겨주세요.</p>
                <p className="text-sm mt-1">관리자가 확인 후 답변해 드립니다.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.senderRole === 'user';
                return (
                  <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${
                      isUser 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        {isUser ? (
                          <span className="text-xs text-blue-100">나</span>
                        ) : (
                          <div className="flex items-center gap-1 text-xs font-bold text-blue-600">
                            <Shield className="w-3 h-3" />
                            관리자
                          </div>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      <p className={`text-[10px] mt-1 text-right ${isUser ? 'text-blue-200' : 'text-slate-400'}`}>
                        {formatMessageTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="문의 내용을 입력하세요..."
              className="flex-grow p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            <button 
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white p-3 rounded-xl transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </section>

        {/* Gallery Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-5 h-5 text-slate-600" />
            <h2 className="text-xl font-bold text-slate-800">나의 캐릭터 보관함</h2>
          </div>

          {savedCharacters.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
              <p>아직 저장된 캐릭터가 없습니다.</p>
              <p className="text-sm mt-2">새로운 캐릭터를 생성하고 '저장하기'를 눌러보세요!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedCharacters.map((char) => (
                <div key={char.id} className="bg-white rounded-xl shadow-sm border border-slate-200 group hover:shadow-md transition-shadow flex flex-col">
                  {/* Image Section */}
                  <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden rounded-t-xl">
                    <img 
                      src={`data:${char.mimeType};base64,${char.imageData}`} 
                      alt="Character" 
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                       <button 
                         onClick={() => handleDownload(char)}
                         className="bg-white text-slate-900 p-2 rounded-full hover:scale-110 transition-transform"
                         title="다운로드"
                       >
                         <Download className="w-5 h-5" />
                       </button>
                       <button 
                         onClick={() => handleDelete(char.id)}
                         className="bg-red-500 text-white p-2 rounded-full hover:scale-110 transition-transform"
                         title="삭제"
                       >
                         <Trash2 className="w-5 h-5" />
                       </button>
                    </div>
                  </div>
                  
                  {/* Content Section */}
                  <div className="p-4 flex flex-col flex-grow">
                    <div className="flex-grow">
                        <p className="text-xs text-slate-400 mb-1">{formatDate(char.timestamp)}</p>
                        <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed" title={char.prompt}>
                        {char.prompt}
                        </p>
                    </div>
                    
                    {/* Share Button Section */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
                        <ShareMenu 
                            image={{ data: char.imageData, mimeType: char.mimeType }} 
                            prompt={char.prompt}
                        />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
};
