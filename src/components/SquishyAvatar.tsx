import React from 'react';
import { motion } from 'motion/react';
import { sounds } from '../services/soundEffects';

interface SquishyAvatarProps {
  id: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'arena';
  interactive?: boolean;
  onSquish?: () => void;
  className?: string;
  isWinning?: boolean;
  imageUrl?: string;
}

export const SquishyAvatar: React.FC<SquishyAvatarProps> = ({
  id,
  size = 'md',
  interactive = true,
  onSquish,
  className = '',
  isWinning = false,
  imageUrl,
}) => {
  const sizeClasses = {
    xs: 'w-10 h-10',
    sm: 'w-14 h-14',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-44 h-44',
    arena: 'w-48 h-48 sm:w-56 sm:h-56',
  };

  const handlePress = () => {
    if (interactive) {
      sounds.playSquish();
      onSquish?.();
    }
  };

  const renderVisual = () => {
    switch (id) {
      case 'croissant':
        return (
          <svg viewBox="0 0 160 120" className="w-full h-full drop-shadow-md select-none">
            <defs>
              <linearGradient id="croissantGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="35%" stopColor="#D97706" />
                <stop offset="70%" stopColor="#B45309" />
                <stop offset="100%" stopColor="#FEF3C7" />
              </linearGradient>
              <linearGradient id="crustGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#FFFBEB" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#FCD34D" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            {/* Croissant Main Body - Crescent Curves */}
            <path
              d="M 18 78 C 22 50, 48 30, 80 30 C 112 30, 138 50, 142 78 C 144 86, 132 90, 116 86 C 96 82, 64 82, 44 86 C 28 90, 16 86, 18 78 Z"
              fill="url(#croissantGrad)"
            />
            {/* Layered Pastry Folds */}
            <path
              d="M 32 76 C 36 54, 52 40, 80 40 C 108 40, 124 54, 128 76 C 114 74, 98 72, 80 72 C 62 72, 46 74, 32 76 Z"
              fill="#FBBF24"
              opacity="0.9"
            />
            <path
              d="M 50 72 C 54 52, 64 44, 80 44 C 96 44, 106 52, 110 72 C 98 68, 90 67, 80 67 C 70 67, 62 68, 50 72 Z"
              fill="#F59E0B"
            />
            {/* Flaky Crust Ridge Segments */}
            <path d="M 60 48 Q 80 52 100 48" stroke="#92400E" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 44 60 Q 80 66 116 60" stroke="#92400E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M 34 72 Q 80 78 126 72" stroke="#B45309" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* Buttery Highlight */}
            <ellipse cx="80" cy="38" rx="22" ry="4" fill="url(#crustGlow)" />
            {/* Cute Kawaii Face */}
            <circle cx="68" cy="62" r="3.5" fill="#451A03" />
            <circle cx="92" cy="62" r="3.5" fill="#451A03" />
            <circle cx="70" cy="60" r="1.2" fill="#FFFFFF" />
            <circle cx="94" cy="60" r="1.2" fill="#FFFFFF" />
            <path d="M 76 66 Q 80 70 84 66" stroke="#451A03" strokeWidth="2" fill="none" strokeLinecap="round" />
            <ellipse cx="62" cy="66" rx="4" ry="2" fill="#F43F5E" opacity="0.6" />
            <ellipse cx="98" cy="66" rx="4" ry="2" fill="#F43F5E" opacity="0.6" />
          </svg>
        );

      case 'dumpling_rosa':
        return (
          <svg viewBox="0 0 140 120" className="w-full h-full drop-shadow-md select-none">
            <defs>
              <radialGradient id="pinkMochiGrad" cx="50%" cy="40%" r="55%">
                <stop offset="0%" stopColor="#FFA4B8" />
                <stop offset="60%" stopColor="#FB7185" />
                <stop offset="90%" stopColor="#E11D48" />
                <stop offset="100%" stopColor="#BE123C" />
              </radialGradient>
              <linearGradient id="jellySheen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Smooth Mochi Dome */}
            <ellipse cx="70" cy="74" rx="56" ry="38" fill="url(#pinkMochiGrad)" />
            {/* Jelly Glossy Highlight */}
            <ellipse cx="70" cy="52" rx="36" ry="14" fill="url(#jellySheen)" />
            {/* Kawaii Eyes */}
            <circle cx="52" cy="70" r="6" fill="#1E293B" />
            <circle cx="88" cy="70" r="6" fill="#1E293B" />
            {/* Anime Sparkles in eyes */}
            <circle cx="50" cy="68" r="2.2" fill="#FFFFFF" />
            <circle cx="54" cy="72" r="1" fill="#FFFFFF" />
            <circle cx="86" cy="68" r="2.2" fill="#FFFFFF" />
            <circle cx="90" cy="72" r="1" fill="#FFFFFF" />
            {/* Sweet smile */}
            <path d="M 64 78 Q 70 85 76 78" stroke="#1E293B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Soft pink blush marks (3 whiskers/stripes each side like photo) */}
            <path d="M 38 78 L 46 78 M 38 81 L 46 81 M 38 84 L 46 84" stroke="#FFF1F2" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
            <path d="M 94 78 L 102 78 M 94 81 L 102 81 M 94 84 L 102 84" stroke="#FFF1F2" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
            <ellipse cx="44" cy="80" rx="6" ry="3.5" fill="#FFE4E6" opacity="0.8" />
            <ellipse cx="96" cy="80" rx="6" ry="3.5" fill="#FFE4E6" opacity="0.8" />
          </svg>
        );

      case 'dumpling_clasico':
        return (
          <svg viewBox="0 0 140 120" className="w-full h-full drop-shadow-md select-none">
            <defs>
              <linearGradient id="baoGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="60%" stopColor="#FFFBEB" />
                <stop offset="100%" stopColor="#FEF3C7" />
              </linearGradient>
            </defs>
            {/* Baozi round body */}
            <path
              d="M 22 75 C 22 45, 45 35, 70 34 C 95 35, 118 45, 118 75 C 118 95, 95 102, 70 102 C 45 102, 22 95, 22 75 Z"
              fill="url(#baoGrad)"
              stroke="#FDE68A"
              strokeWidth="2"
            />
            {/* Twisted top knot pleats */}
            <path d="M 70 34 Q 65 24 70 20 Q 75 24 70 34" fill="#FDE68A" />
            <path d="M 70 34 Q 55 45 42 62" stroke="#FDE68A" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 70 34 Q 64 50 60 68" stroke="#FDE68A" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 70 34 Q 76 50 80 68" stroke="#FDE68A" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 70 34 Q 85 45 98 62" stroke="#FDE68A" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* Kawaii Face */}
            <circle cx="52" cy="74" r="5" fill="#451A03" />
            <circle cx="88" cy="74" r="5" fill="#451A03" />
            <circle cx="51" cy="72" r="1.8" fill="#FFFFFF" />
            <circle cx="87" cy="72" r="1.8" fill="#FFFFFF" />
            {/* Smiling mouth */}
            <path d="M 65 80 Q 70 85 75 80" stroke="#451A03" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Heart blush cheeks! (Exact match to user image photo) */}
            <path
              d="M 38 78 C 38 75, 42 75, 43 78 C 44 75, 48 75, 48 78 C 48 82, 43 85, 43 85 C 43 85, 38 82, 38 78 Z"
              fill="#E11D48"
            />
            <path
              d="M 92 78 C 92 75, 96 75, 97 78 C 98 75, 102 75, 102 78 C 102 82, 97 85, 97 85 C 97 85, 92 82, 92 78 Z"
              fill="#E11D48"
            />
          </svg>
        );

      case 'hielo_rojo':
        return (
          <svg viewBox="0 0 140 120" className="w-full h-full drop-shadow-md select-none">
            <defs>
              <linearGradient id="rubyFront" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F87171" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#DC2626" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="rubyTop" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FECACA" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#F87171" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="rubyRight" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#EF4444" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#991B1B" stopOpacity="0.95" />
              </linearGradient>
            </defs>
            {/* Isometric Glass Cube */}
            {/* Top Face */}
            <polygon points="70,22 115,45 70,68 25,45" fill="url(#rubyTop)" stroke="#FCA5A5" strokeWidth="1.5" />
            {/* Left/Front Face */}
            <polygon points="25,45 70,68 70,105 25,82" fill="url(#rubyFront)" stroke="#F87171" strokeWidth="1.5" />
            {/* Right Face */}
            <polygon points="70,68 115,45 115,82 70,105" fill="url(#rubyRight)" stroke="#EF4444" strokeWidth="1.5" />
            {/* Crystal Core Glow */}
            <polygon points="45,55 70,68 70,88 45,75" fill="#FEF2F2" opacity="0.3" />
            {/* Cute mini glint / eyes */}
            <circle cx="48" cy="65" r="3" fill="#FFFFFF" opacity="0.9" />
            <circle cx="62" cy="72" r="3" fill="#FFFFFF" opacity="0.9" />
            <circle cx="50" cy="64" r="1" fill="#991B1B" />
            <circle cx="64" cy="71" r="1" fill="#991B1B" />
            <path d="M 52 74 Q 56 78 60 75" stroke="#FFFFFF" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          </svg>
        );

      case 'mantequilla':
        return (
          <svg viewBox="0 0 160 110" className="w-full h-full drop-shadow-md select-none">
            <defs>
              <linearGradient id="butterFace" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="100%" stopColor="#FACC15" />
              </linearGradient>
              <linearGradient id="butterTop" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FEF9C3" />
                <stop offset="100%" stopColor="#FEF08A" />
              </linearGradient>
            </defs>
            {/* 3D Butter Stick Perspective */}
            {/* Top Plane */}
            <polygon points="32,32 138,32 126,20 20,20" fill="url(#butterTop)" stroke="#EAB308" strokeWidth="1" />
            {/* Front Body */}
            <rect x="20" y="32" width="118" height="54" rx="4" fill="url(#butterFace)" stroke="#EAB308" strokeWidth="1.5" />
            {/* Right 3D end */}
            <polygon points="138,32 146,24 146,68 138,86" fill="#CA8A04" opacity="0.7" />
            {/* Iconic Butter Typography from user's photo: "SALTED 4oz. BUTTER NET WT. (113 G)" */}
            <text x="100" y="44" fontSize="8" fontWeight="bold" fill="#0F2F3B" fontFamily="sans-serif">SALTED</text>
            <text x="36" y="66" fontSize="18" fontWeight="900" fill="#0F2F3B" fontFamily="sans-serif">4oz.</text>
            <text x="78" y="67" fontSize="17" fontWeight="900" fill="#0F2F3B" fontFamily="sans-serif">BUTTER</text>
            <text x="46" y="78" fontSize="7" fontWeight="bold" fill="#0F2F3B" fontFamily="sans-serif">NET WT. (113 G)</text>
            {/* Tiny cute smile in the corner */}
            <circle cx="126" cy="62" r="1.5" fill="#0F2F3B" />
            <path d="M 124 66 Q 126 69 128 66" stroke="#0F2F3B" strokeWidth="1" fill="none" />
          </svg>
        );

      case 'mantequilla_arcoiris':
        return (
          <svg viewBox="0 0 160 110" className="w-full h-full drop-shadow-md select-none">
            <defs>
              <linearGradient id="rainbowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0284C7" />
                <stop offset="25%" stopColor="#10B981" />
                <stop offset="50%" stopColor="#FACC15" />
                <stop offset="75%" stopColor="#F43F5E" />
                <stop offset="100%" stopColor="#0284C7" />
              </linearGradient>
              <linearGradient id="rainbowTop" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="25%" stopColor="#34D399" />
                <stop offset="50%" stopColor="#FEF08A" />
                <stop offset="75%" stopColor="#FB7185" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>
            </defs>
            {/* Top Plane */}
            <polygon points="32,32 138,32 126,20 20,20" fill="url(#rainbowTop)" />
            {/* Rainbow Body */}
            <rect x="20" y="32" width="118" height="54" rx="4" fill="url(#rainbowGrad)" />
            {/* Right Edge */}
            <polygon points="138,32 146,24 146,68 138,86" fill="#0284C7" opacity="0.8" />
            {/* Iconic Typography */}
            <text x="100" y="44" fontSize="8" fontWeight="bold" fill="#0F172A" fontFamily="sans-serif">SALTED</text>
            <text x="36" y="66" fontSize="18" fontWeight="900" fill="#0F172A" fontFamily="sans-serif">4oz.</text>
            <text x="78" y="67" fontSize="17" fontWeight="900" fill="#0F172A" fontFamily="sans-serif">BUTTER</text>
            <text x="46" y="78" fontSize="7" fontWeight="bold" fill="#0F172A" fontFamily="sans-serif">NET WT. (113 G)</text>
            {/* Sparkles */}
            <text x="24" y="44" fontSize="10">✨</text>
            <text x="132" y="78" fontSize="10">🌸</text>
          </svg>
        );

      case 'medusa':
        return (
          <svg viewBox="0 0 140 130" className="w-full h-full drop-shadow-md select-none">
            <defs>
              <radialGradient id="jellyMedusa" cx="50%" cy="30%" r="60%">
                <stop offset="0%" stopColor="#F5D0FE" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#E879F9" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#C026D3" stopOpacity="0.9" />
              </radialGradient>
            </defs>
            {/* Jellyfish Bell Dome */}
            <ellipse cx="70" cy="48" rx="42" ry="34" fill="url(#jellyMedusa)" />
            {/* Shiny dome glint */}
            <ellipse cx="64" cy="34" rx="20" ry="9" fill="#FFFFFF" opacity="0.6" />
            {/* Scalloped Jelly Rim (bubbly pink pearls like photo) */}
            <g fill="#F472B6">
              <circle cx="34" cy="74" r="7" />
              <circle cx="48" cy="76" r="7" />
              <circle cx="62" cy="77" r="7" />
              <circle cx="78" cy="77" r="7" />
              <circle cx="92" cy="76" r="7" />
              <circle cx="106" cy="74" r="7" />
            </g>
            {/* Wavy Tentacles of soft silicone */}
            <path d="M 40 82 Q 30 100 42 118" stroke="#F472B6" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.8" />
            <path d="M 54 83 Q 66 102 52 122" stroke="#F472B6" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.8" />
            <path d="M 70 84 Q 82 104 74 125" stroke="#F472B6" strokeWidth="4.5" fill="none" strokeLinecap="round" opacity="0.8" />
            <path d="M 86 83 Q 72 103 88 122" stroke="#F472B6" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.8" />
            <path d="M 100 82 Q 112 100 102 118" stroke="#F472B6" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.8" />
            {/* Cute Kawaii Face */}
            <circle cx="56" cy="50" r="4.5" fill="#701A75" />
            <circle cx="84" cy="50" r="4.5" fill="#701A75" />
            <circle cx="58" cy="48" r="1.5" fill="#FFFFFF" />
            <circle cx="86" cy="48" r="1.5" fill="#FFFFFF" />
            <path d="M 66 58 Q 70 63 74 58" stroke="#701A75" strokeWidth="2" fill="none" strokeLinecap="round" />
            <ellipse cx="48" cy="56" rx="5" ry="2.5" fill="#F43F5E" opacity="0.5" />
            <ellipse cx="92" cy="56" rx="5" ry="2.5" fill="#F43F5E" opacity="0.5" />
          </svg>
        );

      case 'oreo':
        return (
          <svg viewBox="0 0 150 110" className="w-full h-full drop-shadow-md select-none">
            <defs>
              <linearGradient id="oreoWafer" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>
            </defs>
            {/* Top Dark Chocolate Wafer */}
            <ellipse cx="75" cy="38" rx="58" ry="16" fill="url(#oreoWafer)" stroke="#0F172A" strokeWidth="2" />
            {/* Embossed biscuit rim ridges */}
            <ellipse cx="75" cy="38" rx="52" ry="13" stroke="#475569" strokeWidth="2" strokeDasharray="5,4" fill="none" />
            <ellipse cx="75" cy="38" rx="36" ry="8" stroke="#475569" strokeWidth="1.5" fill="none" />
            {/* Thick Squishy White Cream Center */}
            <ellipse cx="75" cy="56" rx="60" ry="15" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2" />
            <rect x="15" y="44" width="120" height="16" fill="#F8FAFC" />
            {/* Bottom Dark Wafer */}
            <ellipse cx="75" cy="68" rx="58" ry="16" fill="url(#oreoWafer)" stroke="#0F172A" strokeWidth="2" />
            <rect x="17" y="58" width="116" height="12" fill="url(#oreoWafer)" />
            {/* Kawaii Face on Cream layer! */}
            <circle cx="62" cy="52" r="3.5" fill="#1E293B" />
            <circle cx="88" cy="52" r="3.5" fill="#1E293B" />
            <circle cx="63" cy="50" r="1.2" fill="#FFFFFF" />
            <circle cx="89" cy="50" r="1.2" fill="#FFFFFF" />
            <path d="M 71 56 Q 75 60 79 56" stroke="#1E293B" strokeWidth="2" fill="none" strokeLinecap="round" />
            <ellipse cx="54" cy="54" rx="4" ry="2" fill="#FDA4AF" />
            <ellipse cx="96" cy="54" rx="4" ry="2" fill="#FDA4AF" />
          </svg>
        );

      case 'oveja':
        return (
          <svg viewBox="0 0 130 120" className="w-full h-full drop-shadow-md select-none">
            {/* Minecraft Voxel Style Sheep Head (exact match to user photo!) */}
            {/* White Wool Outer Cube */}
            <rect x="22" y="16" width="86" height="86" rx="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="3" />
            {/* Inner Beige Face Inset */}
            <rect x="34" y="38" width="62" height="42" fill="#FDE68A" />
            {/* Voxel Eyes: Black square + White square */}
            <rect x="34" y="52" width="12" height="14" fill="#0F172A" />
            <rect x="46" y="52" width="8" height="14" fill="#FFFFFF" />
            <rect x="84" y="52" width="12" height="14" fill="#0F172A" />
            <rect x="76" y="52" width="8" height="14" fill="#FFFFFF" />
            {/* Pink Muzzle / Mouth Inset */}
            <rect x="52" y="72" width="26" height="8" fill="#F472B6" />
            <rect x="52" y="80" width="26" height="4" fill="#FDBA74" />
            {/* Wool Texture Shadows */}
            <rect x="22" y="16" width="86" height="22" fill="#F8FAFC" rx="10" />
            <circle cx="34" cy="28" r="4" fill="#E2E8F0" />
            <circle cx="96" cy="28" r="4" fill="#E2E8F0" />
          </svg>
        );

      case 'pankoso':
        return (
          <svg viewBox="0 0 140 110" className="w-full h-full drop-shadow-md select-none">
            <defs>
              <linearGradient id="bunGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="35%" stopColor="#D97706" />
                <stop offset="75%" stopColor="#FEF3C7" />
                <stop offset="100%" stopColor="#FDE68A" />
              </linearGradient>
            </defs>
            {/* Round Golden Glazed Milk Bread */}
            <path
              d="M 18 64 C 18 36, 40 22, 70 22 C 100 22, 122 36, 122 64 C 122 84, 102 92, 70 92 C 38 92, 18 84, 18 64 Z"
              fill="url(#bunGrad)"
              stroke="#B45309"
              strokeWidth="1.5"
            />
            {/* Golden Glazed Cap Shine */}
            <ellipse cx="70" cy="38" rx="42" ry="12" fill="#FFFBEB" opacity="0.6" />
            {/* Kawaii Face */}
            <circle cx="52" cy="62" r="4" fill="#78350F" />
            <circle cx="88" cy="62" r="4" fill="#78350F" />
            <circle cx="53" cy="60" r="1.3" fill="#FFFFFF" />
            <circle cx="89" cy="60" r="1.3" fill="#FFFFFF" />
            <path d="M 64 68 Q 70 74 76 68" stroke="#78350F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <ellipse cx="42" cy="66" rx="5" ry="3" fill="#FB7185" opacity="0.7" />
            <ellipse cx="98" cy="66" rx="5" ry="3" fill="#FB7185" opacity="0.7" />
          </svg>
        );

      case 'panquesito':
        return (
          <svg viewBox="0 0 140 120" className="w-full h-full drop-shadow-md select-none">
            <defs>
              <linearGradient id="muffinTop" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="45%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#FBBF24" />
              </linearGradient>
            </defs>
            {/* Cylindrical Bakery Base */}
            <path
              d="M 34 60 L 40 102 C 40 106, 100 106, 100 102 L 106 60 Z"
              fill="#FEF08A"
              stroke="#FDE047"
              strokeWidth="2"
            />
            {/* Fluting ribs on base */}
            <path d="M 48 62 L 52 102" stroke="#FACC15" strokeWidth="1.5" />
            <path d="M 62 62 L 64 103" stroke="#FACC15" strokeWidth="1.5" />
            <path d="M 76 62 L 76 103" stroke="#FACC15" strokeWidth="1.5" />
            <path d="M 90 62 L 88 102" stroke="#FACC15" strokeWidth="1.5" />
            {/* Puffed Bakery Muffin Crown */}
            <path
              d="M 22 56 C 22 32, 42 22, 70 22 C 98 22, 118 32, 118 56 C 118 64, 108 68, 96 66 C 84 64, 56 64, 44 66 C 32 68, 22 64, 22 56 Z"
              fill="url(#muffinTop)"
              stroke="#B45309"
              strokeWidth="2"
            />
            {/* Sugar cracks on crown */}
            <path d="M 60 30 Q 70 38 68 46" stroke="#FEF3C7" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 72 36 Q 82 42 78 48" stroke="#FEF3C7" strokeWidth="2.5" strokeLinecap="round" />
            {/* Kawaii Face */}
            <circle cx="54" cy="52" r="3.5" fill="#451A03" />
            <circle cx="86" cy="52" r="3.5" fill="#451A03" />
            <circle cx="55" cy="50" r="1.2" fill="#FFFFFF" />
            <circle cx="87" cy="50" r="1.2" fill="#FFFFFF" />
            <path d="M 66 58 Q 70 62 74 58" stroke="#451A03" strokeWidth="2" fill="none" strokeLinecap="round" />
            <ellipse cx="46" cy="56" rx="4" ry="2" fill="#F43F5E" opacity="0.7" />
            <ellipse cx="94" cy="56" rx="4" ry="2" fill="#F43F5E" opacity="0.7" />
          </svg>
        );

      case 'quesito':
        return (
          <svg viewBox="0 0 160 120" className="w-full h-full drop-shadow-md select-none">
            <defs>
              <linearGradient id="cheeseTop" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="50%" stopColor="#FDE047" />
                <stop offset="100%" stopColor="#FACC15" />
              </linearGradient>
              <linearGradient id="cheeseFront" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FACC15" />
                <stop offset="60%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
              <linearGradient id="cheeseBack" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
              <radialGradient id="holeInner" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#B45309" />
                <stop offset="70%" stopColor="#92400E" />
                <stop offset="100%" stopColor="#78350F" />
              </radialGradient>
            </defs>

            {/* Back curved crust / rear */}
            <path
              d="M 100 24 C 126 30, 144 42, 144 56 L 144 76 C 144 64, 126 50, 100 44 Z"
              fill="url(#cheeseBack)"
            />

            {/* Top Plane Triangle of Cheese Wedge */}
            <path
              d="M 22 72 L 100 24 C 124 30, 144 42, 144 56 L 36 94 Z"
              fill="url(#cheeseTop)"
              stroke="#FDE047"
              strokeWidth="1.5"
            />

            {/* Front Cut Side with Holes */}
            <path
              d="M 22 72 L 36 94 L 36 104 C 36 106, 32 108, 22 104 L 22 72 Z"
              fill="#EAB308"
            />
            <path
              d="M 36 94 L 144 56 L 144 86 C 124 98, 70 108, 36 104 Z"
              fill="url(#cheeseFront)"
              stroke="#D97706"
              strokeWidth="1.5"
            />

            {/* Swiss Cheese Holes with 3D Depth */}
            {/* Hole 1 - Top */}
            <ellipse cx="94" cy="40" rx="9" ry="5" fill="url(#holeInner)" opacity="0.8" />
            <ellipse cx="95" cy="41" rx="8" ry="4" fill="#D97706" opacity="0.6" />

            {/* Hole 2 - Top Back */}
            <ellipse cx="124" cy="50" rx="6" ry="3.5" fill="url(#holeInner)" opacity="0.8" />

            {/* Hole 3 - Front Large */}
            <ellipse cx="62" cy="92" rx="10" ry="7" fill="url(#holeInner)" opacity="0.85" />
            <ellipse cx="63" cy="93" rx="8.5" ry="5.5" fill="#B45309" opacity="0.7" />

            {/* Hole 4 - Front Right */}
            <ellipse cx="118" cy="74" rx="11" ry="8" fill="url(#holeInner)" opacity="0.85" />
            <ellipse cx="119" cy="75" rx="9.5" ry="6.5" fill="#B45309" opacity="0.7" />

            {/* Hole 5 - Small Front Center */}
            <circle cx="92" cy="86" r="4.5" fill="url(#holeInner)" opacity="0.85" />

            {/* Kawaii Face on Front Face */}
            {/* Left Eye */}
            <circle cx="74" cy="72" r="5" fill="#451A03" />
            <circle cx="73" cy="70" r="1.8" fill="#FFFFFF" />
            <circle cx="76" cy="73" r="0.9" fill="#FFFFFF" />

            {/* Right Eye */}
            <circle cx="102" cy="66" r="5" fill="#451A03" />
            <circle cx="101" cy="64" r="1.8" fill="#FFFFFF" />
            <circle cx="104" cy="67" r="0.9" fill="#FFFFFF" />

            {/* Open Happy Smiling Mouth with Tongue */}
            <path
              d="M 84 74 Q 88 84 92 72 Z"
              fill="#BE123C"
            />
            <path
              d="M 86 78 Q 88 83 91 76"
              fill="#FDA4AF"
            />

            {/* Rosy Blush Cheeks */}
            <ellipse cx="66" cy="76" rx="5" ry="2.8" fill="#FB7185" opacity="0.8" />
            <ellipse cx="110" cy="70" rx="5" ry="2.8" fill="#FB7185" opacity="0.8" />

            {/* Sparkle Glint */}
            <text x="34" y="66" fontSize="11" fill="#FFFFFF">✨</text>
          </svg>
        );

      default:
        return (
          <div className="w-full h-full rounded-full bg-pink-200 flex items-center justify-center text-2xl">
            🧸
          </div>
        );
    }
  };

  return (
    <motion.div
      onClick={handlePress}
      whileHover={interactive ? { scale: 1.06, rotate: 1 } : undefined}
      whileTap={
        interactive
          ? {
              scaleX: 1.35,
              scaleY: 0.65,
              rotate: -3,
              transition: { duration: 0.1 },
            }
          : undefined
      }
      animate={
        isWinning
          ? {
              scale: [1, 1.1, 1],
              rotate: [-2, 2, -2],
              transition: { repeat: Infinity, duration: 1.5 },
            }
          : undefined
      }
      transition={{
        type: 'spring',
        stiffness: 220,
        damping: 10,
        mass: 0.8,
      }}
      className={`relative inline-flex items-center justify-center cursor-pointer select-none ${sizeClasses[size]} ${className}`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={id}
          className="w-full h-full object-contain drop-shadow-md select-none rounded-2xl"
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
      ) : (
        renderVisual()
      )}
    </motion.div>
  );
};
