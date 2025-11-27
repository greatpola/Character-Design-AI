
import React, { useState } from 'react';
import { User } from '../types';
import { userManager } from '../services/userManager';
import { ChevronRight, User as UserIcon, Lock, Mail } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLoginView, setIsLoginView] = useState(true); // Toggle between Login and Signup

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    const cleanNickname = nickname.trim();

    if (!cleanEmail) {
      setError("이메일 주소를 입력해주세요.");
      return;
    }
    if (!password) {
      setError("비밀번호를 입력해주세요.");
      return;
    }

    try {
      if (isLoginView) {
        // --- LOGIN FLOW ---
        const user = await userManager.login(cleanEmail, password);
        if (user) onLogin(user);
      } else {
        // --- SIGN UP FLOW ---
        if (!cleanNickname) {
          setError("사용하실 닉네임을 입력해주세요.");
          return;
        }
        if (!agreed) {
          setError("서비스 이용을 위해 마케팅 정보 활용에 동의해야 합니다.");
          return;
        }
        
        // Check if user already exists before trying to register
        if (userManager.checkUserExists(cleanEmail)) {
           setError("이미 가입된 이메일입니다. 로그인 탭을 이용해주세요.");
           return;
        }

        const user = await userManager.registerUser(cleanEmail, password, cleanNickname);
        if (user) onLogin(user);
      }
    } catch (err: any) {
      setError(err.message || "오류가 발생했습니다.");
    }
  };

  const toggleView = (isLogin: boolean) => {
    setIsLoginView(isLogin);
    setError(null);
    setPassword(''); // Clear password for security/UX context switch
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        
        {/* Header Tabs */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => toggleView(true)}
            className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${
              isLoginView ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            기존 회원 로그인
          </button>
          <button
            onClick={() => toggleView(false)}
            className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${
              !isLoginView ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            신규 회원 가입
          </button>
        </div>

        {/* Form Container */}
        <div className="p-8">
           <div className="text-center mb-8">
             <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
               Character Studio AI
             </h1>
             <p className="text-slate-500 text-sm">
               {isLoginView ? '이메일과 비밀번호로 로그인하세요.' : '나만의 AI 캐릭터 스튜디오를 시작하세요.'}
             </p>
           </div>

           <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 ml-1">이메일 주소</label>
                <div className="relative">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 ml-1">비밀번호</label>
                <div className="relative">
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호 입력"
                    className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>

              {/* Signup Fields */}
              {!isLoginView && (
                <div className="space-y-5 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 ml-1">닉네임</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="사용하실 닉네임"
                        className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center h-5 mt-0.5">
                      <input
                        id="marketing"
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    <label htmlFor="marketing" className="text-xs text-slate-600 cursor-pointer select-none leading-relaxed">
                      <span className="font-bold text-slate-800">[필수]</span> 마케팅 정보 수신 및 개인정보 수집 이용에 동의합니다.
                    </label>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-3 text-sm bg-red-50 text-red-600 rounded-lg flex items-center gap-2 font-medium animate-in shake duration-300">
                  <span>⚠️</span> {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
              >
                {isLoginView ? '로그인' : '무료로 회원가입'}
                <ChevronRight className="w-4 h-4" />
              </button>
           </form>
        </div>

        <div className="px-8 pb-6 text-center">
          <p className="text-xs text-slate-400">
            &copy; 2024 Character AI. Powered by TP
          </p>
        </div>

      </div>
    </div>
  );
};
