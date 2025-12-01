
import React from 'react';
import { CreditPackage } from '../types';
import { X, Check, Zap, Star } from 'lucide-react';

interface CreditShopProps {
  onClose: () => void;
}

// Packages linking to the provided Stripe URL
// In a real app, you would have different Stripe links for different products
const PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 10,
    price: 5, // $5 (Approximation)
    link: 'https://buy.stripe.com/28E5kDgVC9dl6AE8Wy?prefilled_promo_code=STARTER' 
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    credits: 50,
    price: 20, // $20
    popular: true,
    link: 'https://buy.stripe.com/28E5kDgVC9dl6AE8Wy?prefilled_promo_code=PRO'
  }
];

export const CreditShop: React.FC<CreditShopProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 opacity-20"></div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
              <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              크레딧 충전소
            </h2>
            <p className="text-slate-300 text-sm">
              더 많은 캐릭터를 생성하려면 크레딧이 필요합니다.
            </p>
          </div>
        </div>

        {/* Packages */}
        <div className="p-6 space-y-4">
          {PACKAGES.map((pkg) => (
            <div 
              key={pkg.id}
              className={`relative border-2 rounded-2xl p-5 transition-all hover:shadow-lg flex items-center justify-between ${
                pkg.popular 
                  ? 'border-blue-500 bg-blue-50/50' 
                  : 'border-slate-100 hover:border-slate-300'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-6 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                  Most Popular
                </div>
              )}

              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  {pkg.name}
                  <span className="text-sm font-normal text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                    {pkg.credits} 크레딧
                  </span>
                </h3>
                <ul className="mt-2 space-y-1">
                  <li className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-green-500" />
                    캐릭터 생성 {pkg.credits}회 가능
                  </li>
                  <li className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-green-500" />
                    영구 소장 및 상업적 이용
                  </li>
                </ul>
              </div>

              <a 
                href={pkg.link} 
                target="_blank"
                rel="noopener noreferrer"
                className={`px-5 py-3 rounded-xl font-bold text-sm shadow-sm transition-transform hover:scale-105 active:scale-95 ${
                  pkg.popular 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-slate-800 text-white hover:bg-slate-900'
                }`}
              >
                ${pkg.price} 구매
              </a>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 leading-relaxed">
            결제는 Stripe를 통해 안전하게 처리됩니다.<br/>
            결제가 완료되면 자동으로 크레딧이 충전됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};
