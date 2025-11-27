import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { userManager } from '../services/userManager';
import { Users, Trash2, LogOut, ArrowLeft } from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, onBack }) => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setUsers(userManager.getAllUsers().sort((a, b) => b.joinedAt - a.joinedAt));
  };

  const handleDelete = (email: string) => {
    if (window.confirm(`${email} 사용자를 정말 삭제하시겠습니까?`)) {
      userManager.removeUser(email);
      loadUsers();
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

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
            title="앱으로 돌아가기"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Users className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">사용자 관리자 페이지</h1>
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
      <main className="container mx-auto max-w-5xl p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
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
                  <th className="px-6 py-4 font-semibold">이메일</th>
                  <th className="px-6 py-4 font-semibold">가입 일시</th>
                  <th className="px-6 py-4 font-semibold">마케팅 동의</th>
                  <th className="px-6 py-4 font-semibold">사용 횟수</th>
                  <th className="px-6 py-4 font-semibold text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      등록된 사용자가 없습니다.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.email} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-900 font-medium">{user.email}</td>
                      <td className="px-6 py-4 text-slate-600 text-sm">{formatDate(user.joinedAt)}</td>
                      <td className="px-6 py-4">
                        {user.marketingAgreed ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            동의함
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            미동의
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-800 font-medium">
                        {user.usageCount || 0}회
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(user.email)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                          title="사용자 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};