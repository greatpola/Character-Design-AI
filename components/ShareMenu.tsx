import React, { useState } from 'react';
import { GeneratedImage } from '../types';
import { shareService } from '../services/shareService';
import { Share2, Link, Facebook, MessageCircle, Instagram, X } from 'lucide-react';

interface ShareMenuProps {
  image: GeneratedImage;
  prompt: string;
}

export const ShareMenu: React.FC<ShareMenuProps> = ({ image, prompt }) => {
  const [isOpen, setIsOpen] = useState(false);

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

  const handleInstagram = () => {
    alert('인스타그램 공유는 모바일 앱의 "공유하기" 버튼을 이용해주세요.');
    setIsOpen(false);
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
        className="flex items-center gap-2 text-sm bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-300 transition-colors shadow-sm"
      >
        <Share2 className="w-4 h-4" />
        공유하기
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 animate-in fade-in zoom-in-95 duration-200">
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

            {/* Instagram (Placeholder/Info) */}
            <button
              onClick={handleInstagram}
              className="flex flex-col items-center justify-center p-2 hover:bg-slate-50 rounded-lg transition-colors gap-1 group"
              title="인스타그램 (모바일 전용)"
            >
              <div className="bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] p-2 rounded-full group-hover:opacity-90">
                <Instagram className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] text-slate-500">인스타</span>
            </button>
          </div>
          <div className="px-3 pb-2 text-center border-t border-slate-100 pt-2">
            <p className="text-[10px] text-slate-400">
              이미지 공유는 모바일 앱을 이용해주세요.
            </p>
          </div>
        </div>
      )}
      
      {/* Backdrop to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};