/**
 * Utilidades para compartir enlaces públicos compatibles con WhatsApp y redes sociales.
 */

export const CUSTOM_SHARE_URL_STORAGE_KEY = 'squishy_custom_share_url';

// URL activa del servicio en Cloud Run / AI Studio con parámetro limpio para invalidar caché antiguo de WhatsApp
export const DEFAULT_AI_STUDIO_URL = 'https://ais-dev-tvkfmgitlbhwttavqi5c55-461759886237.us-west1.run.app/?v=votar';

export function getCustomShareUrl(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(CUSTOM_SHARE_URL_STORAGE_KEY);
    return saved && saved.trim() ? saved.trim() : null;
  } catch {
    return null;
  }
}

export function setCustomShareUrl(url: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (url && url.trim()) {
      localStorage.setItem(CUSTOM_SHARE_URL_STORAGE_KEY, url.trim());
    } else {
      localStorage.removeItem(CUSTOM_SHARE_URL_STORAGE_KEY);
    }
  } catch (err) {
    console.warn('Error guardando URL personalizada:', err);
  }
}

export function getPublicShareUrl(): string {
  // 1. Si el usuario/administrador definió un enlace personalizado (ej. acortador, dominio o túnel)
  const custom = getCustomShareUrl();
  if (custom) return custom;

  if (typeof window === 'undefined') {
    return DEFAULT_AI_STUDIO_URL;
  }

  const origin = window.location.origin;

  // 2. Si estamos en un origen público real (como ais-dev-... o dominio propio), usarlo directamente
  if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
    return `${origin}/?v=votar`;
  }

  // 3. Fallback en entorno local
  return DEFAULT_AI_STUDIO_URL;
}

export function isPrivateDevOrigin(): boolean {
  if (typeof window === 'undefined') return false;
  const origin = window.location.origin;
  return origin.includes('ais-dev-') || origin.includes('localhost') || origin.includes('127.0.0.1');
}

export function getWhatsAppShareText(customUrl?: string): string {
  const url = customUrl || getPublicShareUrl();
  return `👁️ ¡LA CASA DE LOS FAMOSÍSIMOS 2 - SEMANA 4! 🌟🔥

👑 NUEVA LÍDER DE LA SEMANA 4: Oveja Cúbica 🐑
(Inmunidad total garantizada. Es la única habitante con inmunidad por el momento).

📅 PRÓXIMA CITA: Gala de Nominación este Miércoles.
Ahorita no hay nadie nominado; las votaciones se abrirán tras las nominaciones del miércoles.

🚪 HISTORIAL OFICIAL DE EXPULSADOS:
• 1° Expulsada: Mantequilla Clásica 🧈 (Semana 1)
• 2° Expulsada: Dumpling Rosa 🥟 (Semana 2)
• 3° Expulsada: Galleta Oreo 🍪 (Semana 3)

👉 SIGUE LA CASA EN VIVO:
${url}

🔒 Votos 100% secretos para mayor emoción. Funciona en cualquier celular (iPhone y Android) sin instalar nada.`;
}

export function getWhatsAppShareLink(customUrl?: string): string {
  const text = getWhatsAppShareText(customUrl);
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}

export function getAlternativeWhatsAppLink(customUrl?: string): string {
  const text = getWhatsAppShareText(customUrl);
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Intenta abrir el diálogo nativo de compartir (ideal en móviles) o abre WhatsApp
 */
export async function triggerWhatsAppShare(customUrl?: string): Promise<boolean> {
  const text = getWhatsAppShareText(customUrl);
  const url = customUrl || getPublicShareUrl();

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: 'La Casa de los Famosísimos 2 - Votación de Salvación',
        text,
        url,
      });
      return true;
    } catch {
      // Si el usuario canceló el diálogo o no está soportado, continuar a fallback
    }
  }

  // Fallback: abrir enlace directo de WhatsApp mediante un tag anchor invisible
  // (evita que el bloqueador de popups o el sandbox del iframe lo cancele)
  const link = getWhatsAppShareLink(url);
  try {
    const a = document.createElement('a');
    a.href = link;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch {
    window.location.href = link;
    return true;
  }
}

/**
 * Copia texto al portapapeles con fallback seguro para navegadores integrados (WhatsApp Webview, etc.)
 */
export async function copyTextSafe(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('Clipboard API fallo, usando fallback textarea:', err);
  }

  // Fallback para navegadores móviles o WebView de WhatsApp
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('No se pudo copiar texto:', err);
    return false;
  }
}


