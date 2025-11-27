
import React, { useState } from 'react';
import { GeneratedImage } from '../types';
import { shareService } from '../services/shareService';
import { imageProcessor } from '../services/imageProcessor';
import { Share2, Link, Facebook, MessageCircle, Instagram, Loader2, Download } from 'lucide-react';

interface ShareMenuProps {
  image: GeneratedImage;
  prompt: string;
}

export const ShareMenu: React.FC<ShareMenuProps> = ({ image, prompt }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [instaMenuOpen, setInstaMenuOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleNativeShare = async () => {
    const success = await shareService.shareNative(
      image, 
      'Character Studio AI', 
      `AI로 만든 내 캐릭터: ${prompt}`
    );
    if (!success) {
      // If native share fails or cancelled (or desktop), toggle menu
      setIsOpen(!isOpen);
    }
  };

  const handleCopyLink = async () => {
    await shareService.copyLink();
    alert('링크가 클립보드에 복사되었습니다!');
    setIsOpen(false);
  };

  const handleKakao = () => {
    shareService.shareKakao();
    setIsOpen(false);
  };

  const handleFacebook = () => {
    shareService.shareFacebook();
    setIsOpen(false);
  };

  const handleInstagramProcess = async (format: 'feed' | 'story') => {
    setIsProcessing(true);
    try {
      // 1. Resize/Format Image
      const formattedImage = await imageProcessor.createInstagramFormat(image, format);
      
      // 2. Try Native Share (Mobile)
      const success = await shareService.shareNative(
        formattedImage,
        'Instagram Share',
        'Check out my character!',
      );

      // 3. Fallback for Desktop: Download
      if (!success) {
        const link = document.createElement('a');
        link.href = `data:${formattedImage.mimeType};base64,${formattedImage.data}`;
        link.download = `instagram-${format}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        alert('이미지가 저장되었습니다. 인스타그램 앱에서 업로드해주세요!');
      }
    } catch (e) {
      console.error(e);
      alert('이미지 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
      setInstaMenuOpen(false);
      setIsOpen(false);
    }
  };

  // On Mobile, prefer native share immediately
  const handleMainClick = () => {
    if (shareService.canShareFiles()) {
      handleNativeShare();
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={handleMainClick}
        disabled={isProcessing}
        className="flex items-center gap-2 text-sm bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-300 transition-colors shadow-sm disabled:opacity-70"
      >
        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
        공유하기
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 animate-in fade-in zoom-in-95 duration-200">
          
          {instaMenuOpen ? (
            // Sub-menu for Instagram Formats
            <div className="p-2">
               <div className="text-xs font-bold text-slate-500 px-2 py-1 mb-2">인스타그램 업로드용 크기 선택</div>
               <button
                 onClick={() => handleInstagramProcess('feed')}
                 className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg text-left transition-colors"
               >
                 <div className="bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] p-1.5 rounded-md">
                   <div className="w-4 h-5 border border-white/50 bg-white/20 rounded-sm"></div>
                 </div>
                 <div>
                   <span className="text-sm font-bold text-slate-700 block">피드 게시물</span>
                   <span className="text-[10px] text-slate-400">4:5 비율 (최적)</span>
                 </div>
               </button>
               <button
                 onClick={() => handleInstagramProcess('story')}
                 className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg text-left transition-colors mt-1"
               >
                 <div className="bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] p-1.5 rounded-md">
                   <div className="w-3.5 h-6 border border-white/50 bg-white/20 rounded-sm"></div>
                 </div>
                 <div>
                   <span className="text-sm font-bold text-slate-700 block">스토리</span>
                   <span className="text-[10px] text-slate-400">9:16 비율 (꽉 찬 화면)</span>
                 </div>
               </button>
               <button 
                 onClick={() => setInstaMenuOpen(false)}
                 className="w-full text-center text-xs text-slate-400 mt-2 py-1 hover:text-slate-600"
               >
                 뒤로가기
               </button>
            </div>
          ) : (
            // Main Menu
            <div className="py-1 p-2 grid grid-cols-4 gap-2">
              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className="flex flex-col items-center justify-center p-2 hover:bg-slate-50 rounded-lg transition-colors gap-1 group"
                title="링크 복사"
              >
                <div className="bg-slate-100 p-2 rounded-full group-hover:bg-slate-200">
                  <Link className="w-4 h-4 text-slate-600" />
                </div>
                <span className="text-[10px] text-slate-500">링크복사</span>
              </button>

              {/* KakaoTalk */}
              <button
                onClick={handleKakao}
                className="flex flex-col items-center justify-center p-2 hover:bg-slate-50 rounded-lg transition-colors gap-1 group"
                title="카카오톡"
              >
                <div className="bg-[#FEE500] p-2 rounded-full group-hover:bg-[#fdd835]">
                  <MessageCircle className="w-4 h-4 text-[#3C1E1E] fill-current" />
                </div>
                <span className="text-[10px] text-slate-500">카카오톡</span>
              </button>

              {/* Facebook */}
              <button
                onClick={handleFacebook}
                className="flex flex-col items-center justify-center p-2 hover:bg-slate-50 rounded-lg transition-colors gap-1 group"
                title="페이스북"
              >
                <div className="bg-[#1877F2] p-2 rounded-full group-hover:bg-[#166fe5]">
                  <Facebook className="w-4 h-4 text-white fill-current" />
                </div>
                <span className="text-[10px] text-slate-500">페이스북</span>
              </button>

              {/* Instagram Trigger */}
              <button
                onClick={() => setInstaMenuOpen(true)}
                className="flex flex-col items-center justify-center p-2 hover:bg-slate-50 rounded-lg transition-colors gap-1 group"
                title="인스타그램 업로드"
              >
                <div className="bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] p-2 rounded-full group-hover:opacity-90">
                  <Instagram className="w-4 h-4 text-white" />
                </div>
                <span className="text-[10px] text-slate-500">인스타</span>
              </button>
            </div>
          )}
          
          {!instaMenuOpen && (
            <div className="px-3 pb-2 text-center border-t border-slate-100 pt-2">
              <p className="text-[10px] text-slate-400">
                인스타 버튼을 누르면 사이즈가 자동 조절됩니다.
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Backdrop to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => { setIsOpen(false); setInstaMenuOpen(false); }}
        />
      )}
    </div>
  );
};
