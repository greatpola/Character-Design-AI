import React from 'react';

interface LoadingProps {
  mode: 'generating' | 'editing';
}

export const Loading: React.FC<LoadingProps> = ({ mode }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="relative w-16 h-16">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-200 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="text-lg font-medium text-slate-600 animate-pulse text-center">
        {mode === 'generating' 
          ? '한글 타이포그래피 및 굿즈 목업 생성 중...' 
          : '레이아웃 유지 및 텍스트 최적화 수정 중...'}
      </p>
      <div className="text-sm text-slate-400 text-center space-y-1">
        <p>Gemini 3 Pro Image가 고해상도 시안을 제작하고 있습니다.</p>
        <p className="text-xs text-slate-300">Story • Basic • Turnaround • Motion • Application</p>
      </div>
    </div>
  );
};