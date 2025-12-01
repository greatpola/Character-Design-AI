
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Hero } from './components/Hero';
import { Loading } from './components/Loading';
import { Login } from './components/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { MyPage } from './components/MyPage';
import { ShareMenu } from './components/ShareMenu';
import { CreditShop } from './components/CreditShop';
import { generateContent, editCharacterSheet } from './services/gemini';
import { userManager } from './services/userManager';
import { characterStorage } from './services/characterStorage';
import { seoStorage } from './services/seoStorage';
import { GeneratedImage, AppState, User, GenerationMode } from './types';
import { Download, Wand2, RefreshCw, Send, Image as ImageIcon, Edit3, Settings, LogOut, User as UserIcon, Save, Heart, Zap, AlertCircle, PlusCircle, LayoutTemplate, MonitorPlay, ShoppingBag, Smile, Film, Activity, Lock } from 'lucide-react';

const SUGGESTIONS = {
  brand_sheet: [
    "머리에 새싹이 자라난 귀여운 꼬마 로봇, 흰색과 초록색 테마",
    "빨간 목도리를 한 북극곰 마스코트, 따뜻한 느낌",
    "전통 한복을 입은 다람쥐 캐릭터, 파스텔 톤"
  ],
  ad_storyboard: [
    "피곤한 직장인이 에너지 드링크를 마시고 힘을 내는 4컷 만화",
    "새로운 화장품을 바르고 피부가 좋아져서 기뻐하는 여성",
    "배달 앱으로 음식을 주문하고 빠르게 받는 장면"
  ],
  ani_storyboard: [
    "절벽에서 점프하여 날아가는 슈퍼히어로의 역동적인 장면",
    "숲속에서 길을 잃고 두리번거리는 아기 사슴",
    "거대한 로봇과 대치하는 주인공의 뒷모습"
  ],
  goods: [
    "귀여운 고양이 캐릭터가 그려진 에코백과 머그컵 세트",
    "심플한 로고가 박힌 고급스러운 텀블러와 다이어리",
    "다채로운 패턴의 스마트폰 케이스와 키링"
  ],
  emoticon: [
    "다양한 표정을 짓고 있는 핑크색 토끼 이모티콘 9종 세트",
    "직장인들이 공감할 만한 상황의 강아지 스티커",
    "사랑을 표현하는 귀여운 곰돌이 커플 이모티콘"
  ],
  moving_emoticon: [
    "제자리에서 달리기를 하는 픽셀 아트 소년 스프라이트 시트",
    "손을 흔들며 인사하는 소녀의 4x4 프레임 애니메이션",
    "불꽃이 타오르는 이펙트 스프라이트"
  ]
};

const MODE_LABELS: { [key in GenerationMode]: { label: string, icon: React.ReactNode, placeholder: string } } = {
  brand_sheet: { 
    label: '브랜드 시트', 
    icon: <LayoutTemplate className="w-4 h-4"/>,
    placeholder: "예: 파란색 후드티를 입은 장난꾸러기 토끼, 3D 렌더링 스타일"
  },
  ad_storyboard: { 
    label: '광고 스토리보드', 
    icon: <MonitorPlay className="w-4 h-4"/>,
    placeholder: "예: 신제품 커피를 마시고 놀라는 장면을 담은 4컷 광고"
  },
  ani_storyboard: { 
    label: '애니메이션 스토리보드', 
    icon: <Film className="w-4 h-4"/>,
    placeholder: "예: 주인공이 악당을 물리치는 역동적인 액션 시퀀스 5컷"
  },
  goods: { 
    label: '굿즈 패키지', 
    icon: <ShoppingBag className="w-4 h-4"/>,
    placeholder: "예: 캐릭터가 적용된 에코백, 머그컵, 뱃지 목업 이미지"
  },
  emoticon: { 
    label: '이모티콘 세트', 
    icon: <Smile className="w-4 h-4"/>,
    placeholder: "예: 기쁨, 슬픔, 분노 등 9가지 감정의 고양이 이모티콘"
  },
  moving_emoticon: { 
    label: '움직이는 이모티콘', 
    icon: <Activity className="w-4 h-4" />,
    placeholder: "예: 제자리에서 점프하는 4x4 스프라이트 시트"
  }
};

type ViewState = 'main' | 'admin' | 'mypage';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [prompt, setPrompt] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  
  // Store the Master Brand Sheet separately to use as reference
  const [brandSheetImage, setBrandSheetImage] = useState<GeneratedImage | null>(null);

  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('main');
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showCreditShop, setShowCreditShop] = useState(false);
  
  // New State for Generation Mode
  const [genMode, setGenMode] = useState<GenerationMode>('brand_sheet');

  // Focus ref for edit input
  const editInputRef = useRef<HTMLInputElement>(null);

  // Check login session on mount
  useEffect(() => {
    const sessionUser = userManager.getSession();
    if (sessionUser) {
      setUser(sessionUser);
    }
  }, []);

  // Check for Payment Success in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentSuccess = params.get('payment_success');
    
    if (paymentSuccess === 'true' && user) {
        const simulateRecharge = async () => {
            await userManager.addCredits(user.email, 10); 
            alert("결제가 완료되어 10 크레딧이 충전되었습니다!");
            const updatedUser = await userManager.getUser(user.email);
            if(updatedUser) {
                handleUserUpdate(updatedUser);
            }
            window.history.replaceState({}, document.title, window.location.pathname);
        };
        simulateRecharge();
    }
  }, [user]);

  useEffect(() => {
    seoStorage.applyToDocument(); 
    seoStorage.fetchAndSync();    
  }, [currentView]);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setCurrentView('main');
  };

  const handleLogout = () => {
    userManager.logout();
    setUser(null);
    setCurrentView('main');
    setCurrentImage(null);
    setBrandSheetImage(null); // Clear ref
    setPrompt('');
    setShowAdminDashboard(false);
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
    userManager.saveSession(updatedUser);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !user) return;

    const hasCredit = await userManager.checkCredit(user.email);
    if (!hasCredit) {
      setShowCreditShop(true); 
      return;
    }

    setAppState(AppState.GENERATING);
    setErrorMsg(null);
    setEditPrompt('');

    try {
      // Logic: If mode is NOT brand_sheet, pass the brandSheetImage as reference
      const referenceImage = genMode !== 'brand_sheet' ? (brandSheetImage || undefined) : undefined;

      const result = await generateContent(prompt, genMode, referenceImage);
      setCurrentImage(result);
      
      // If we just generated a Brand Sheet, save it as the master reference
      if (genMode === 'brand_sheet') {
        setBrandSheetImage(result);
      }

      setAppState(AppState.SUCCESS);
      
      // Auto-save logic
      await characterStorage.saveCharacter(user.email, result, prompt, genMode);

      await userManager.deductCredit(user.email, 1);
      await userManager.incrementActivity(user.email, 'generation');
      
      const updatedUser = await userManager.getUser(user.email);
      if(updatedUser) {
        handleUserUpdate(updatedUser);
      }
      
    } catch (e) {
      console.error(e);
      setErrorMsg("이미지를 생성하는 도중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      setAppState(AppState.ERROR);
    }
  };

  const handleEdit = async () => {
    if (!editPrompt.trim() || !currentImage || !user) return;

    const hasCredit = await userManager.checkCredit(user.email);
    if (!hasCredit) {
      setShowCreditShop(true);
      return;
    }

    setAppState(AppState.EDITING);
    setErrorMsg(null);

    try {
      // Pass the current mode to edit as well
      const result = await editCharacterSheet(currentImage, editPrompt, genMode);
      setCurrentImage(result);
      
      // If we edited the brand sheet, update the reference
      if (genMode === 'brand_sheet') {
        setBrandSheetImage(result);
      }

      setAppState(AppState.SUCCESS);
      setEditPrompt('');
      
      // Auto-save edited version
      await characterStorage.saveCharacter(user.email, result, `${prompt} (Edited)`, genMode);

      await userManager.deductCredit(user.email, 1);
      await userManager.incrementActivity(user.email, 'edit');
      
      const updatedUser = await userManager.getUser(user.email);
      if(updatedUser) {
        handleUserUpdate(updatedUser);
      }

    } catch (e) {
      console.error(e);
      setErrorMsg("이미지를 수정하는 도중 오류가 발생했습니다. 편집 내용을 조금 더 구체적으로 적어주세요.");
      setAppState(AppState.ERROR);
    }
  };

  const handleDownload = () => {
    if (!currentImage) return;
    const link = document.createElement('a');
    link.href = `data:${currentImage.mimeType};base64,${currentImage.data}`;
    link.download = `character-${genMode}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
  };

  const handleSupportDeveloper = () => {
    setShowCreditShop(true);
  };

  // Logic to determine if a mode is locked
  const isModeLocked = (mode: GenerationMode) => {
    if (mode === 'brand_sheet') return false; // Always open
    if (user && user.role === 'admin') return false; // Admin unlock all

    // Locked if: No Brand Sheet generated OR No Credits Purchased (Free User)
    return !brandSheetImage || !user?.hasPurchasedCredits;
  };

  const handleModeClick = (mode: GenerationMode) => {
    if (isModeLocked(mode)) {
      if (!user?.hasPurchasedCredits) {
        alert("이 기능은 크레딧을 한 번 이상 충전한 회원만 사용할 수 있습니다.");
        setShowCreditShop(true);
      } else if (!brandSheetImage) {
        alert("브랜드 시트를 먼저 생성해야 이 기능을 사용할 수 있습니다.\n브랜드 시트를 기반으로 일관성 있는 디자인이 생성됩니다.");
        setGenMode('brand_sheet');
      }
      return;
    }
    setGenMode(mode);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (showAdminDashboard && user.role === 'admin') {
    return <AdminDashboard onLogout={handleLogout} onBack={() => setShowAdminDashboard(false)} />;
  }

  if (currentView === 'mypage') {
    return <MyPage user={user} onBack={() => setCurrentView('main')} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {showCreditShop && <CreditShop onClose={() => setShowCreditShop(false)} />}

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
             <span className="font-bold text-slate-800 text-lg">{user.nickname}</span>
             <span className="text-xs text-slate-500">({user.group})</span>
          </div>
          
          {user.role !== 'admin' && (
             <button 
               onClick={() => setShowCreditShop(true)}
               className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors group"
             >
                <div className="bg-yellow-400 rounded-full p-1 group-hover:scale-110 transition-transform">
                    <Zap className="w-3 h-3 text-white fill-white" />
                </div>
                <span className="text-sm font-bold text-slate-700">
                  {user.credits} 크레딧
                </span>
                <PlusCircle className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
             </button>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {user.role === 'admin' && (
            <button
              onClick={() => setShowAdminDashboard(true)}
              className="text-sm flex items-center gap-2 bg-slate-800 text-white px-3 py-2 rounded-lg hover:bg-slate-900 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">관리자</span>
            </button>
          )}
          
          {user.role === 'user' && (
             <button
              onClick={() => setCurrentView('mypage')}
              className="text-sm flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
             >
               <UserIcon className="w-4 h-4" />
               <span className="hidden sm:inline">마이페이지</span>
             </button>
          )}

          <button
            onClick={handleLogout}
            className="text-sm flex items-center gap-2 text-slate-600 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">로그아웃</span>
          </button>
        </div>
      </div>

      <Hero />

      <main className="flex-grow container mx-auto max-w-5xl px-4 py-8 space-y-8">
        
        {/* Input Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
          
          {/* Mode Selector Tabs */}
          <div className="flex overflow-x-auto pb-4 mb-4 gap-2 no-scrollbar">
            {(Object.keys(MODE_LABELS) as GenerationMode[]).map((mode) => {
              const locked = isModeLocked(mode);
              return (
                <button
                  key={mode}
                  onClick={() => handleModeClick(mode)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all relative ${
                    genMode === mode 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : locked 
                        ? 'bg-slate-50 text-slate-400 cursor-not-allowed opacity-70'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {locked ? <Lock className="w-3 h-3" /> : MODE_LABELS[mode].icon}
                  {MODE_LABELS[mode].label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-4">
            <label className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-blue-600" />
              {MODE_LABELS[genMode].label} 만들기
            </label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={MODE_LABELS[genMode].placeholder}
                className="w-full p-4 pr-32 h-32 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-slate-700 placeholder-slate-400"
                disabled={appState === AppState.GENERATING || appState === AppState.EDITING}
              />
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || appState === AppState.GENERATING || appState === AppState.EDITING}
                className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {appState === AppState.GENERATING ? '생성 중...' : '1 크레딧으로 생성'}
                <Send className="w-4 h-4" />
              </button>
            </div>
            
            {user.credits <= 0 && user.role !== 'admin' && (
               <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors" onClick={() => setShowCreditShop(true)}>
                 <AlertCircle className="w-4 h-4" />
                 <span>크레딧이 부족합니다. <strong>여기를 눌러 충전하세요.</strong></span>
               </div>
            )}
            
            {/* Dynamic Suggestions */}
            <div className="flex flex-wrap gap-2 mt-2">
              {SUGGESTIONS[genMode].map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(s)}
                  className="text-xs md:text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full transition-colors text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Credit & Support Banner */}
        <section className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-700">
           <div className="flex items-start md:items-center gap-3">
              <div className="bg-white p-2 rounded-full text-indigo-500 shadow-sm shrink-0">
                <Zap className="w-5 h-5 fill-indigo-100" />
              </div>
              <div className="text-sm text-indigo-900 leading-relaxed">
                <p className="font-bold">이미지 생성 및 수정 시 1 크레딧이 소모됩니다.</p>
                <p className="text-indigo-700">광고 없는 프로그램 사용과 새로운 기능 개발을 위해 사용됩니다.</p>
              </div>
           </div>
           <button
             onClick={handleSupportDeveloper}
             className="w-full md:w-auto bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-200 px-4 py-2.5 rounded-lg font-bold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 group whitespace-nowrap"
           >
             <Heart className="w-4 h-4 text-red-500 fill-red-50 group-hover:fill-red-500 transition-colors" />
             크레딧 충전 / 응원하기
           </button>
        </section>

        {/* Error Message */}
        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-2">
            <span>⚠️</span> {errorMsg}
          </div>
        )}

        {/* Display Section */}
        <section className="min-h-[400px]">
          {(appState === AppState.GENERATING || appState === AppState.EDITING) ? (
            <div className="h-[600px] bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center">
              <Loading mode={appState === AppState.GENERATING ? 'generating' : 'editing'} />
            </div>
          ) : currentImage ? (
            <div className="space-y-6 animate-in fade-in zoom-in duration-500">
              
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200">
                <div className="bg-slate-100 p-2 border-b border-slate-200 flex justify-between items-center px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    <ImageIcon className="w-4 h-4" />
                    Generated Result ({MODE_LABELS[genMode].label})
                  </div>
                  <div className="flex gap-2">
                    <ShareMenu image={currentImage} prompt={prompt} />
                    {user.role === 'user' && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 text-xs rounded-lg border border-green-200">
                        <Save className="w-3 h-3" />
                        자동 저장됨
                      </div>
                    )}
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 text-sm bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-300 transition-colors shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      다운로드
                    </button>
                  </div>
                </div>
                
                <div className="relative group flex justify-center bg-slate-50">
                  <img
                    src={`data:${currentImage.mimeType};base64,${currentImage.data}`}
                    alt="Result"
                    className="max-w-full h-auto max-h-[800px] object-contain shadow-sm"
                  />
                </div>
              </div>

              {/* Edit Toolbar */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-4">
                 <div className="bg-blue-100 p-3 rounded-full hidden md:block">
                   <Edit3 className="w-6 h-6 text-blue-600" />
                 </div>
                 <div className="flex-grow w-full">
                    <h3 className="text-base font-bold text-blue-900 mb-1">AI 편집 도구</h3>
                    <p className="text-sm text-blue-700 mb-3">현재 이미지를 수정하고 싶나요? (1 크레딧 소모)</p>
                    <div className="flex gap-2">
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        placeholder={
                            user.credits <= 0 && user.role !== 'admin'
                            ? "크레딧이 부족합니다." 
                            : "예: 배경을 노란색으로 바꿔줘, 캐릭터 표정을 웃는 얼굴로 변경해줘"
                        }
                        disabled={user.credits <= 0 && user.role !== 'admin'}
                        className="flex-grow p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                        onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                      />
                      <button
                        onClick={handleEdit}
                        disabled={!editPrompt.trim() || (user.credits <= 0 && user.role !== 'admin')}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-5 py-3 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        수정하기
                      </button>
                    </div>
                 </div>
              </div>

            </div>
          ) : (
            <div className="h-96 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 gap-4">
              <div className="bg-white p-4 rounded-full shadow-sm">
                <ImageIcon className="w-8 h-8 text-slate-300" />
              </div>
              <p>원하는 모드를 선택하고 설명을 입력해보세요</p>
            </div>
          )}
        </section>

      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-slate-500 text-sm">
        <p>&copy; 2024 Character AI. Powered by TP</p>
      </footer>
    </div>
  );
}

export default App;
