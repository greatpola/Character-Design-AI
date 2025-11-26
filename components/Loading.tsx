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
          ? '캐릭터 스토리, 턴어라운드, 굿즈 목업 생성 중...' 
          : '전체 레이아웃을 유지하며 수정 중...'}
      </p>
      <div className="text-sm text-slate-400 text-center space-y-1">
        <p>Gemini 3 Pro Image가 작업하고 있습니다.</p>
        <p className="text-xs text-slate-300">Basic Type • Turnaround • Motion • Application</p>
      </div>
    </div>
  );
};