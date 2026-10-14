import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Share2, MessageCircle, ExternalLink, ShieldCheck, AlertCircle, QrCode, Edit3, RotateCcw } from 'lucide-react';
import { 
  getPublicShareUrl, 
  getWhatsAppShareLink, 
  getAlternativeWhatsAppLink,
  getWhatsAppShareText, 
  triggerWhatsAppShare, 
  copyTextSafe,
  getCustomShareUrl,
  setCustomShareUrl,
  DEFAULT_AI_STUDIO_URL
} from '../utils/shareUtils';
import { sounds } from '../services/soundEffects';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [customInputUrl, setCustomInputUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState(getPublicShareUrl());

  useEffect(() => {
    if (isOpen) {
      const active = getPublicShareUrl();
      setCurrentUrl(active);
      setCustomInputUrl(getCustomShareUrl() || active);
    }
  }, [isOpen]);

  // Tecla Escape para cerrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const whatsappLink = getWhatsAppShareLink(currentUrl);
  const waMeLink = getAlternativeWhatsAppLink(currentUrl);

  const handleCopy = async () => {
    sounds.playSquish();
    const success = await copyTextSafe(currentUrl);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2600);
    }
  };

  const handleCopyMessage = async () => {
    sounds.playSquish();
    const fullMsg = getWhatsAppShareText(currentUrl);
    const success = await copyTextSafe(fullMsg);
    if (success) {
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2600);
    }
  };

  const handleSaveCustomUrl = () => {
    sounds.playBonus();
    if (customInputUrl.trim()) {
      setCustomShareUrl(customInputUrl.trim());
      setCurrentUrl(customInputUrl.trim());
    }
    setIsEditingUrl(false);
  };

  const handleResetUrl = () => {
    sounds.playSquish();
    setCustomShareUrl(null);
    const defaultUrl = getPublicShareUrl();
    setCurrentUrl(defaultUrl);
    setCustomInputUrl(defaultUrl);
    setIsEditingUrl(false);
  };

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(currentUrl)}`;

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[100] overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
      >
        {/* Tache flotante superior */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ventana de compartir"
          className="fixed top-3 right-3 sm:top-5 sm:right-5 z-[110] flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-zinc-900/95 hover:bg-red-600 text-zinc-200 hover:text-white border-2 border-zinc-700 hover:border-red-500 shadow-2xl transition active:scale-95 cursor-pointer backdrop-blur-md"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
          <span className="text-xs font-black uppercase tracking-wider">Cerrar (Esc)</span>
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-zinc-900 rounded-3xl p-5 sm:p-6 border-2 border-zinc-800 shadow-2xl text-zinc-100 relative my-auto space-y-4 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-green-500/20 border border-green-500/50 flex items-center justify-center text-green-400">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black uppercase text-white tracking-tight">
                  Compartir en WhatsApp
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Enlace directo para La Casa de los Famosísimos 2
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Explicación de solución y estado */}
          <div className="bg-emerald-950/40 border border-emerald-700/60 rounded-2xl p-3 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Acceso Público 100% Abierto</span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              El bloqueo de Google y el error 404 fueron eliminados por completo. Cualquier persona en WhatsApp puede entrar y votar de inmediato sin cuentas ni registros.
            </p>
          </div>

          {/* Botón Principal WhatsApp: <a href> directo sin bloqueos */}
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => sounds.playBonus()}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-98 text-zinc-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-xl shadow-green-950/40 transition cursor-pointer text-center"
          >
            <MessageCircle className="w-5 h-5 fill-zinc-950 shrink-0" />
            <span>Enviar Directo a WhatsApp 📲</span>
          </a>

          {/* Enlace alternativo wa.me */}
          <div className="flex justify-between items-center text-[11px] px-1 text-zinc-400">
            <span>¿Prefieres wa.me?</span>
            <a
              href={waMeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 underline font-bold"
            >
              Abrir con wa.me/?text=...
            </a>
          </div>

          {/* Input con el enlace y botones de acción */}
          <div className="space-y-1.5 bg-zinc-950/80 p-3 rounded-2xl border border-zinc-800">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-zinc-400 uppercase tracking-wider">
                Enlace de Votación que se enviará:
              </span>
              <button
                type="button"
                onClick={() => setIsEditingUrl(!isEditingUrl)}
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold text-[10px] cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isEditingUrl ? 'Cancelar Edición' : 'Personalizar URL'}</span>
              </button>
            </div>

            {isEditingUrl ? (
              <div className="space-y-2 pt-1">
                <input
                  type="url"
                  value={customInputUrl}
                  onChange={(e) => setCustomInputUrl(e.target.value)}
                  placeholder="https://tudominio.com o https://bit.ly/..."
                  className="w-full bg-zinc-900 border border-amber-500/60 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveCustomUrl}
                    className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition"
                  >
                    Guardar URL
                  </button>
                  <button
                    type="button"
                    onClick={handleResetUrl}
                    className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition flex items-center gap-1"
                    title="Restablecer URL por defecto"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restablecer</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800">
                <input
                  type="text"
                  readOnly
                  value={currentUrl}
                  className="bg-transparent px-2.5 py-1 text-xs text-zinc-300 font-mono flex-1 focus:outline-none select-all truncate"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-md ${
                    copiedLink
                      ? 'bg-green-600 text-white'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white'
                  }`}
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Botones de acción complementarios */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyMessage}
              className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                copiedMessage 
                  ? 'bg-green-700/80 border-green-500 text-white' 
                  : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200'
              }`}
            >
              {copiedMessage ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
              <span>{copiedMessage ? '¡Mensaje Copiado!' : 'Copiar Mensaje'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowQr(!showQr)}
              className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span>{showQr ? 'Ocultar QR' : 'Código QR'}</span>
            </button>
          </div>

          {/* Consejos para invitados en celular */}
          <div className="bg-zinc-950/60 rounded-xl p-2.5 border border-zinc-800/80 text-[10px] text-zinc-400 space-y-1">
            <p className="font-bold text-zinc-300 flex items-center gap-1">
              <span>💡</span>
              <span>Si tus invitados abren el enlace desde el celular:</span>
            </p>
            <p>
              Pueden votar directamente. Si WhatsApp en el teléfono muestra pantalla de cookies o Google, indícales tocar los tres puntos (<strong>⋮</strong>) y elegir <em>"Abrir en Chrome"</em> o <em>"Abrir en Safari"</em>.
            </p>
          </div>

          {/* Código QR Desplegable */}
          <AnimatePresence>
            {showQr && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-2 flex flex-col items-center justify-center"
              >
                <div className="p-3 bg-white rounded-2xl shadow-xl border border-zinc-300 inline-block">
                  <img
                    src={qrApiUrl}
                    alt="Código QR para votar en La Casa de los Famosísimos 2"
                    className="w-44 h-44 object-contain"
                  />
                </div>
                <p className="text-[11px] text-zinc-400 mt-2 font-medium text-center">
                  Escanea con la cámara de cualquier celular para entrar y votar
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
