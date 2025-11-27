import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { userManager } from '../services/userManager';
import { ShieldCheck, LogIn, ChevronRight } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdminEmail, setIsAdminEmail] = useState(false);

  useEffect(() => {
    // Check if entered email matches admin ID
    if (userManager.isAdmin(email)) {
      setIsAdminEmail(true);
    } else {
      setIsAdminEmail(false);
    }
  }, [email]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("이메일 주소를 입력해주세요.");
      return;
    }

    if (isAdminEmail) {
      if (!password) {
        setError("관리자 비밀번호를 입력해주세요.");
        return;
      }
    } else {
      if (!agreed) {
        setError("서비스 이용을 위해 마케팅 정보 활용에 동의해야 합니다.");
        return;
      }
    }

    try {
      const user = userManager.login(cleanEmail, password);
      if (user) {
        onLogin(user);
      }
    } catch (err: any) {
      setError(err.message || "로그인 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="bg-blue-600 p-8 text-center">
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
            Character Studio AI
          </h1>
          <p className="text-blue-100 text-sm">
            로그인하여 나만의 캐릭터 브랜드를 만들어보세요.
          </p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">이메일 주소</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              />
            </div>

            {isAdminEmail ? (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                <label className="text-sm font-semibold text-slate-700 ml-1">관리자 비밀번호</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                />
              </div>
            ) : (
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center h-5 mt-0.5">
                  <input
                    id="marketing"
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <label htmlFor="marketing" className="text-sm text-slate-600 cursor-pointer select-none">
                  <span className="font-semibold text-slate-800">[필수]</span> 마케팅 정보 수신 및 개인정보 수집 이용에 동의합니다.
                </label>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                <span className="font-bold">!</span> {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold text-lg transition-all transform active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
            >
              {isAdminEmail ? '관리자 로그인' : '무료로 시작하기'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </form>
        </div>
        
        <div className="px-8 pb-8 text-center">
          <p className="text-xs text-slate-400">
            &copy; 2024 Character AI. Powered by TP
          </p>
        </div>
      </div>
    </div>
  );
};