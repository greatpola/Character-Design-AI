import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Hero } from './components/Hero';
import { Loading } from './components/Loading';
import { generateCharacterSheet, editCharacterSheet } from './services/gemini';
import { GeneratedImage, AppState } from './types';
import { Download, Wand2, RefreshCw, Send, Image as ImageIcon, Edit3, LockKeyhole } from 'lucide-react';

const SUGGESTIONS = [
  "머리에 새싹이 자라난 귀여운 꼬마 로봇, 흰색과 초록색 테마",
  "빨간 목도리를 한 북극곰 마스코트, 따뜻한 느낌",
  "미래지향적인 사이버펑크 고양이, 네온 블루 포인트",
  "전통 한복을 입은 다람쥐 캐릭터, 파스텔 톤"
];

function App() {
  const [prompt, setPrompt] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Focus ref for edit input
  const editInputRef = useRef<HTMLInputElement>(null);

  // Check for API key on mount
  useEffect(() => {
    const checkKey = async () => {
      try {
        // @ts-ignore
        if (window.aistudio && window.aistudio.hasSelectedApiKey) {
          // @ts-ignore
          const has = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(has);
        }
      } catch (e) {
        console.error("Error checking API key status:", e);
      }
    };
    checkKey();
  }, []);

  const handleApiKeySelect = async () => {
    try {
      // @ts-ignore
      if (window.aistudio && window.aistudio.openSelectKey) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        // Assume success to mitigate race condition
        setHasApiKey(true);
      }
    } catch (e) {
      console.error("Error opening key selector:", e);
      setErrorMsg("API 키 선택 창을 여는 중 오류가 발생했습니다.");
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setAppState(AppState.GENERATING);
    setErrorMsg(null);
    setEditPrompt(''); // Clear previous edit prompt

    try {
      const result = await generateCharacterSheet(prompt);
      setCurrentImage(result);
      setAppState(AppState.SUCCESS);
    } catch (e) {
      console.error(e);
      setErrorMsg("이미지를 생성하는 도중 오류가 발생했습니다. API 키가 유효한지 확인해주세요.");
      setAppState(AppState.ERROR);
    }
  };

  const handleEdit = async () => {
    if (!editPrompt.trim() || !currentImage) return;

    setAppState(AppState.EDITING);
    setErrorMsg(null);

    try {
      const result = await editCharacterSheet(currentImage, editPrompt);
      setCurrentImage(result);
      setAppState(AppState.SUCCESS);
      setEditPrompt(''); // Reset edit prompt after success
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
    link.download = `character-design-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
  };

  // API Key Selection Screen
  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Hero />
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-slate-200 max-w-lg w-full text-center space-y-8 animate-in zoom-in-95 duration-300">
            <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <LockKeyhole className="w-10 h-10 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">API 키 설정이 필요합니다</h2>
              <p className="text-slate-600 leading-relaxed">
                Gemini 3 Pro Image 모델을 사용하여 고품질 캐릭터를 생성하려면<br className="hidden md:inline" /> 
                Google Cloud 프로젝트의 API 키를 선택해야 합니다.
              </p>
            </div>
            
            <button
              onClick={handleApiKeySelect}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-3"
            >
              <Wand2 className="w-5 h-5" />
              API 키 선택하고 시작하기
            </button>
            
            <p className="text-xs text-slate-400">
              API 키는 로컬 환경에만 저장되며 서버로 전송되지 않습니다. <br/>
              자세한 내용은 <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-blue-600 transition-colors">Billing Documentation</a>을 참고하세요.
            </p>
          </div>
        </div>
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-slate-500 text-sm">
          <p>&copy; 2024 Character Studio AI. Powered by Google Gemini 3 Pro Image.</p>
        </footer>
      </div>
    );
  }

  // Main App Screen
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Hero />

      <main className="flex-grow container mx-auto max-w-5xl px-4 py-8 space-y-8">
        
        {/* Input Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
          <div className="flex flex-col gap-4">
            <label className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-blue-600" />
              어떤 캐릭터를 만들까요?
            </label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="예: 파란색 후드티를 입은 장난꾸러기 토끼, 3D 렌더링 스타일"
                className="w-full p-4 pr-32 h-32 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-slate-700 placeholder-slate-400"
                disabled={appState === AppState.GENERATING || appState === AppState.EDITING}
              />
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || appState === AppState.GENERATING || appState === AppState.EDITING}
                className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {appState === AppState.GENERATING ? '생성 중...' : '디자인 생성'}
                <Send className="w-4 h-4" />
              </button>
            </div>
            
            {/* Suggestions */}
            <div className="flex flex-wrap gap-2 mt-2">
              {SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(s)}
                  className="text-xs md:text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
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
              
              {/* Image Card */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200">
                <div className="bg-slate-100 p-2 border-b border-slate-200 flex justify-between items-center px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    <ImageIcon className="w-4 h-4" />
                    Generated Result (2K)
                  </div>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 text-sm bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-300 transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    다운로드
                  </button>
                </div>
                
                <div className="relative group flex justify-center bg-slate-50">
                  <img
                    src={`data:${currentImage.mimeType};base64,${currentImage.data}`}
                    alt="Character Design"
                    className="max-w-full h-auto max-h-[800px] object-contain shadow-sm"
                  />
                </div>
              </div>

              {/* Edit Toolbar (Nano Banana Feature) */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-4">
                 <div className="bg-blue-100 p-3 rounded-full hidden md:block">
                   <Edit3 className="w-6 h-6 text-blue-600" />
                 </div>
                 <div className="flex-grow w-full">
                    <h3 className="text-base font-bold text-blue-900 mb-1">AI 편집 도구</h3>
                    <p className="text-sm text-blue-700 mb-3">현재 캐릭터를 수정하고 싶나요? 원하는 변경사항을 입력하세요.</p>
                    <div className="flex gap-2">
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        placeholder="예: 모자 색깔을 빨간색으로 바꿔줘, 배경에 나무를 추가해줘"
                        className="flex-grow p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                      />
                      <button
                        onClick={handleEdit}
                        disabled={!editPrompt.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-5 py-3 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        수정하기
                      </button>
                    </div>
                 </div>
              </div>

            </div>
          ) : (
            /* Placeholder State */
            <div className="h-96 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 gap-4">
              <div className="bg-white p-4 rounded-full shadow-sm">
                <ImageIcon className="w-8 h-8 text-slate-300" />
              </div>
              <p>캐릭터 설명을 입력하고 생성 버튼을 눌러보세요</p>
            </div>
          )}
        </section>

      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-slate-500 text-sm">
        <p>&copy; 2024 Character Studio AI. Powered by Google Gemini 3 Pro Image.</p>
      </footer>
    </div>
  );
}

export default App;
