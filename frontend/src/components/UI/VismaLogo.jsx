import React from 'react';

let logoImg = '/logo.png';
try {
  logoImg = new URL('../../assets/logo.png', import.meta.url).href;
} catch (e) {}

export const VismaLogo = ({ size = "md", isDarkBg = false, className = "" }) => {
  const iconSize = size === "sm" ? "h-8" : size === "lg" ? "h-20" : "h-11";

  if (isDarkBg) {
    return (
      <div className={`inline-flex items-center gap-3 select-none ${className}`}>
        {/* Compact white badge holding orange icon */}
        <div className="bg-white p-1.5 rounded-xl shadow-sm flex items-center justify-center shrink-0 border border-slate-700/50">
          <img
            src={logoImg}
            alt="Visma Icon"
            className="h-7 w-7 object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://raw.githubusercontent.com/adityadigiworq1/translation-pms/main/logo.png';
            }}
          />
        </div>
        {/* Crisp White & Blue Sidebar Brand Typography */}
        <div className="flex flex-col leading-none">
          <span className="font-black text-white text-base tracking-[0.2em] uppercase">
            VISMA
          </span>
          <span className="text-[10px] font-bold text-brand-400 tracking-widest uppercase mt-0.5">
            Translation
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center justify-center select-none ${className}`}>
      <img
        src={logoImg}
        alt="Visma Translation"
        className={`${iconSize} w-auto object-contain font-bold`}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = 'https://raw.githubusercontent.com/adityadigiworq1/translation-pms/main/logo.png';
        }}
      />
    </div>
  );
};

export default VismaLogo;
