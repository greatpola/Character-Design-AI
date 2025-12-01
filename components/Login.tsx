
import React, { useState } from 'react';
import { User } from '../types';
import { userManager } from '../services/userManager';
import { ChevronRight, Lock, Mail, Loader2 } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLoginView, setIsLoginView] = useState(true); // Toggle between Login and Signup

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Nickname is now auto-generated
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("이메일 주소를 입력해주세요.");
      setIsLoading(false);
      return;
    }
    if (!password) {
      setError("비밀번호를 입력해주세요.");
      setIsLoading(false);
      return;
    }

    try {
      if (isLoginView) {
        // --- LOGIN FLOW ---
        const user = await userManager.login(cleanEmail, password);
        if (user) onLogin(user);
      } else {
        // --- SIGN UP FLOW ---
        if (!agreed) {
          setError("서비스 이용을 위해 마케팅 정보 활용에 동의해야 합니다.");
          setIsLoading(false);
          return;
        }
        
        // Check if user already exists
        const exists = await userManager.checkUserExists(cleanEmail);
        if (exists) {
           setError("이미 가입된 이메일입니다. 로그인 탭을 이용해주세요.");
           setIsLoading(false);
           return;
        }

        // Pass only email and password (nickname is auto-generated in manager)
        const user = await userManager.registerUser(cleanEmail, password);
        if (user) onLogin(user);
      }
    } catch (err: any) {
      setError(err.message || "오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const user = await userManager.loginWithGoogle();
      if (user) onLogin(user);
    } catch (err: any) {
      setError(err.message || "Google 로그인에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleView = (isLogin: boolean) => {
    setIsLoginView(isLogin);
    setError(null);
    setPassword(''); 
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
                  <p className="text-xs text-slate-400 text-center">
                    닉네임은 가입 시 자동으로 생성되며, 마이페이지에서 수정 가능합니다.
                  </p>
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
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLoginView ? '로그인' : '무료로 회원가입'}
                {!isLoading && <ChevronRight className="w-4 h-4" />}
              </button>
           </form>

           {/* Google Login Separator */}
           <div className="relative my-6">
             <div className="absolute inset-0 flex items-center">
               <div className="w-full border-t border-slate-200"></div>
             </div>
             <div className="relative flex justify-center text-sm">
               <span className="px-2 bg-white text-slate-500">또는</span>
             </div>
           </div>

           {/* Google Login Button */}
           <button
             type="button"
             onClick={handleGoogleLogin}
             disabled={isLoading}
             className="w-full py-3.5 rounded-xl font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
           >
             <svg className="w-5 h-5" viewBox="0 0 24 24">
               <path
                 d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                 fill="#4285F4"
               />
               <path
                 d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                 fill="#34A853"
               />
               <path
                 d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                 fill="#FBBC05"
               />
               <path
                 d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                 fill="#EA4335"
               />
             </svg>
             Google 계정으로 시작하기
           </button>

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
