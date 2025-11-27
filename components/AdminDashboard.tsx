
import React, { useState, useEffect, useRef } from 'react';
import { User, Message, SeoConfig } from '../types';
import { userManager } from '../services/userManager';
import { messageStorage } from '../services/messageStorage';
import { seoStorage } from '../services/seoStorage';
import { Users, Trash2, LogOut, ArrowLeft, MessageSquare, Mail, Send, User as UserIcon, Shield, Globe, Save, Link, Edit, X, Loader2 } from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
  onBack: () => void;
}

type Tab = 'users' | 'messages' | 'seo';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [users, setUsers] = useState<User[]>([]);
  
  // Message System States
  const [senders, setSenders] = useState<string[]>([]);
  const [selectedSender, setSelectedSender] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // User Edit Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ group: '', maxGenerations: 0, maxEdits: 0 });

  // SEO States
  const [seoConfig, setSeoConfig] = useState<SeoConfig>(seoStorage.getSeoConfig());
  const [isSavingSeo, setIsSavingSeo] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    if (selectedSender) {
      loadChatHistory(selectedSender);
    }
  }, [selectedSender]);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const loadData = () => {
    if (activeTab === 'users') {
      setUsers(userManager.getAllUsers().sort((a, b) => b.joinedAt - a.joinedAt));
    } else if (activeTab === 'messages') {
      setSenders(messageStorage.getUniqueSenders());
    } else if (activeTab === 'seo') {
      // Fetch latest from cloud when entering SEO tab
      seoStorage.fetchAndSync().then(() => {
         setSeoConfig(seoStorage.getSeoConfig());
      });
    }
  };

  const loadChatHistory = (email: string) => {
    setChatHistory(messageStorage.getConversation(email));
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDeleteUser = (email: string) => {
    if (window.confirm(`${email} 사용자를 정말 삭제하시겠습니까?`)) {
      userManager.removeUser(email);
      loadData();
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditForm({
      group: user.group || 'basic',
      maxGenerations: user.maxGenerations || 1,
      maxEdits: user.maxEdits || 1
    });
  };

  const handleSaveUser = async () => {
    if (editingUser) {
      await userManager.updateUserLimits(
        editingUser.email, 
        editForm.group, 
        Number(editForm.maxGenerations), 
        Number(editForm.maxEdits)
      );
      setEditingUser(null);
      loadData();
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedSender) return;

    // Admin sending message to selectedSender
    messageStorage.sendMessage('media@greatpola.com', selectedSender, 'admin', replyMessage);
    setReplyMessage('');
    loadChatHistory(selectedSender);
  };

  const handleSaveSeo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSeo(true);
    try {
      await seoStorage.saveSeoConfig(seoConfig);
      alert('설정이 저장되었으며 사이트 전체에 적용되었습니다.');
    } catch (err: any) {
      // Show explicit error if cloud sync fails
      alert(`오류: ${err.message || '설정 저장 중 문제가 발생했습니다.'}`);
    } finally {
      setIsSavingSeo(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNickname = (email: string) => {
    const user = userManager.getUser(email);
    return user ? user.nickname : email;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
            title="앱으로 돌아가기"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-slate-800 p-2 rounded-lg text-white">
              <Users className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">관리자 대시보드</h1>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 text-slate-600 hover:text-red-600 transition-colors font-medium text-sm bg-slate-50 px-4 py-2 rounded-lg border border-slate-200"
        >
          <LogOut className="w-4 h-4" />
          로그아웃
        </button>
      </nav>

      {/* Content */}
      <main className="container mx-auto max-w-6xl p-6 flex-grow flex flex-col">
        
        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 pb-1 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-medium transition-colors ${
              activeTab === 'users' 
                ? 'bg-white text-blue-600 border-b-2 border-blue-600' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            사용자 관리
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-medium transition-colors ${
              activeTab === 'messages' 
                ? 'bg-white text-blue-600 border-b-2 border-blue-600' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Mail className="w-4 h-4" />
            고객 문의 관리
          </button>
          <button
            onClick={() => setActiveTab('seo')}
            className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-medium transition-colors ${
              activeTab === 'seo' 
                ? 'bg-white text-blue-600 border-b-2 border-blue-600' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Globe className="w-4 h-4" />
            사이트 및 SEO 설정
          </button>
        </div>

        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">
                등록된 사용자 목록 
                <span className="ml-2 text-blue-600 text-sm font-normal bg-blue-50 px-2 py-1 rounded-full">
                  총 {users.length}명
                </span>
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold">닉네임 / 이메일</th>
                    <th className="px-6 py-4 font-semibold">가입 일시</th>
                    <th className="px-6 py-4 font-semibold">그룹</th>
                    <th className="px-6 py-4 font-semibold">생성 현황</th>
                    <th className="px-6 py-4 font-semibold">수정 현황</th>
                    <th className="px-6 py-4 font-semibold text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        등록된 사용자가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.email} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-slate-900 font-bold">{user.nickname || '-'}</div>
                          <div className="text-slate-500 text-xs">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-sm">{formatDate(user.joinedAt)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase
                            ${user.group === 'admin' ? 'bg-slate-800 text-white' : 
                              user.group === 'pro' ? 'bg-purple-100 text-purple-800' : 
                              'bg-blue-100 text-blue-800'}`}>
                            {user.group || 'basic'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-800 font-medium text-sm">
                           {user.generationCount || 0} / {user.maxGenerations}회
                        </td>
                        <td className="px-6 py-4 text-slate-800 font-medium text-sm">
                           {user.editCount || 0} / {user.maxEdits}회
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                             <button
                              onClick={() => openEditModal(user)}
                              className="text-slate-400 hover:text-blue-500 transition-colors p-2 rounded-full hover:bg-blue-50"
                              title="정보 수정"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.email)}
                              className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                              title="사용자 삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex h-[600px] animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* User List Sidebar */}
            <div className="w-1/3 border-r border-slate-200 flex flex-col">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  문의 내역
                </h3>
              </div>
              <div className="flex-grow overflow-y-auto">
                {senders.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    아직 문의가 없습니다.
                  </div>
                ) : (
                  senders.map(email => {
                    const nick = getNickname(email);
                    return (
                      <button
                        key={email}
                        onClick={() => setSelectedSender(email)}
                        className={`w-full text-left p-4 border-b border-slate-100 transition-colors hover:bg-slate-50 ${
                          selectedSender === email ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <UserIcon className="w-4 h-4 text-slate-400" />
                          <span className="font-bold text-slate-800 truncate">{nick}</span>
                        </div>
                        <p className="text-xs text-slate-400 truncate mb-1">{email}</p>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="w-2/3 flex flex-col bg-slate-50">
              {selectedSender ? (
                <>
                  <div className="p-4 bg-white border-b border-slate-200 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{getNickname(selectedSender)}</h3>
                      <p className="text-xs text-slate-500">{selectedSender}</p>
                    </div>
                  </div>

                  <div className="flex-grow overflow-y-auto p-6 space-y-4">
                    {chatHistory.map((msg) => {
                      const isAdmin = msg.senderRole === 'admin';
                      return (
                        <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                           <div className={`max-w-[75%] rounded-2xl p-4 shadow-sm ${
                             isAdmin 
                               ? 'bg-slate-800 text-white rounded-tr-none' 
                               : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                           }`}>
                             <div className="flex items-center gap-2 mb-1">
                               {isAdmin ? (
                                  <div className="flex items-center gap-1 text-xs font-bold text-slate-300">
                                    <Shield className="w-3 h-3" />
                                    관리자 (나)
                                  </div>
                               ) : (
                                  <span className="text-xs text-slate-500">{getNickname(selectedSender)}</span>
                               )}
                             </div>
                             <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                             <p className={`text-[10px] mt-1 text-right ${isAdmin ? 'text-slate-400' : 'text-slate-400'}`}>
                               {formatTime(msg.timestamp)}
                             </p>
                           </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>

                  <form onSubmit={handleSendReply} className="p-4 bg-white border-t border-slate-200 flex gap-2">
                    <input 
                      type="text"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="답변을 입력하세요..."
                      className="flex-grow p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button 
                      type="submit" 
                      disabled={!replyMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white p-3 rounded-xl transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-slate-400">
                  <MessageSquare className="w-16 h-16 mb-4 text-slate-200" />
                  <p>좌측 목록에서 사용자를 선택하여 대화를 시작하세요.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'seo' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
             {/* Same SEO Form as before */}
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                사이트 및 SEO 설정
              </h2>
              <p className="text-sm text-slate-500 mt-1">메타 태그 및 사이트 주요 설정을 관리할 수 있습니다.</p>
            </div>
            
            <form onSubmit={handleSaveSeo} className="p-8 max-w-3xl">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">사이트 제목 (Title)</label>
                  <input
                    type="text"
                    value={seoConfig.title}
                    onChange={(e) => setSeoConfig({...seoConfig, title: e.target.value})}
                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">설명 (Meta Description)</label>
                  <textarea
                    value={seoConfig.description}
                    onChange={(e) => setSeoConfig({...seoConfig, description: e.target.value})}
                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">키워드 (Keywords)</label>
                  <input
                    type="text"
                    value={seoConfig.keywords}
                    onChange={(e) => setSeoConfig({...seoConfig, keywords: e.target.value})}
                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">작성자 (Author)</label>
                  <input
                    type="text"
                    value={seoConfig.author}
                    onChange={(e) => setSeoConfig({...seoConfig, author: e.target.value})}
                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Link className="w-4 h-4" />
                    개발자 응원하기 링크 (전체 사용자 적용)
                  </label>
                  <input
                    type="text"
                    value={seoConfig.supportLink || ''}
                    onChange={(e) => setSeoConfig({...seoConfig, supportLink: e.target.value})}
                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="예: https://buy.stripe.com/..."
                  />
                  <p className="text-xs text-slate-400">이 링크는 클라우드에 저장되어 모든 사용자에게 동일하게 적용됩니다.</p>
                </div>
                <div className="pt-4 flex justify-end">
                   <button
                     type="submit"
                     disabled={isSavingSeo}
                     className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg shadow-blue-200"
                   >
                     {isSavingSeo ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                     {isSavingSeo ? '저장 중...' : '설정 저장 및 적용'}
                   </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
               <h3 className="font-bold text-slate-800">사용자 권한 설정</h3>
               <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                 <X className="w-5 h-5" />
               </button>
            </div>
            <div className="p-6 space-y-4">
               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500">사용자</label>
                 <div className="p-2 bg-slate-100 rounded text-sm">{editingUser.email}</div>
               </div>
               
               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500">그룹명 (등급)</label>
                 <input 
                   type="text" 
                   value={editForm.group} 
                   onChange={(e) => setEditForm({...editForm, group: e.target.value})}
                   className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                   placeholder="basic, pro, vip..."
                 />
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500">최대 생성 횟수</label>
                   <input 
                     type="number" 
                     value={editForm.maxGenerations} 
                     onChange={(e) => setEditForm({...editForm, maxGenerations: Number(e.target.value)})}
                     className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                 </div>
                 <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500">최대 수정 횟수</label>
                   <input 
                     type="number" 
                     value={editForm.maxEdits} 
                     onChange={(e) => setEditForm({...editForm, maxEdits: Number(e.target.value)})}
                     className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                 </div>
               </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
               <button 
                 onClick={() => setEditingUser(null)}
                 className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium"
               >
                 취소
               </button>
               <button 
                 onClick={handleSaveUser}
                 className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
               >
                 저장하기
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
