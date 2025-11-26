import React from 'react';

export const Hero: React.FC = () => {
  return (
    <div className="bg-white border-b border-slate-200 pb-8 pt-12 px-6 text-center">
      <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">
        Character <span className="text-blue-600">Studio</span> AI
      </h1>
      <p className="text-lg text-slate-600 max-w-2xl mx-auto">
        캐릭터 스토리부터 굿즈 목업까지, 완벽한 브랜드 시트를 완성하세요. <br/>
        <span className="text-sm text-slate-400">Powered by Gemini 3 Pro Image (Nano Banana 2)</span>
      </p>
    </div>
  );
};