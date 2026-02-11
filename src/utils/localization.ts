/**
 * Localization utility for share text and other UI elements
 * Detects user's browser language and provides appropriate translations
 */

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'zh' | 'ko' | 'ru' | 'ar' | 'hi'

export interface ShareTextTranslation {
  checkOutMyDream: string
  interpretation: string
  dreamTitle: string
  viewFullInterpretation: string
  shareButton: string
  shareOnTwitter: string
  shareOnFacebook: string
  shareOnLinkedIn: string
  shareViaEmail: string
  copyToClipboard: string
  copied: string
  emailSubject: string
}

const translations: Record<SupportedLanguage, ShareTextTranslation> = {
  en: {
    checkOutMyDream: 'Check out my dream interpretation',
    interpretation: 'Interpretation',
    dreamTitle: 'Dream',
    viewFullInterpretation: 'View full interpretation',
    shareButton: 'Share Dream',
    shareOnTwitter: 'Share on Twitter',
    shareOnFacebook: 'Share on Facebook',
    shareOnLinkedIn: 'Share on LinkedIn',
    shareViaEmail: 'Share via Email',
    copyToClipboard: 'Copy to Clipboard',
    copied: 'Copied!',
    emailSubject: 'Check out my dream',
  },
  es: {
    checkOutMyDream: 'Mira la interpretación de mi sueño',
    interpretation: 'Interpretación',
    dreamTitle: 'Sueño',
    viewFullInterpretation: 'Ver interpretación completa',
    shareButton: 'Compartir Sueño',
    shareOnTwitter: 'Compartir en Twitter',
    shareOnFacebook: 'Compartir en Facebook',
    shareOnLinkedIn: 'Compartir en LinkedIn',
    shareViaEmail: 'Compartir por Email',
    copyToClipboard: 'Copiar al Portapapeles',
    copied: '¡Copiado!',
    emailSubject: 'Mira mi sueño',
  },
  fr: {
    checkOutMyDream: 'Découvrez l\'interprétation de mon rêve',
    interpretation: 'Interprétation',
    dreamTitle: 'Rêve',
    viewFullInterpretation: 'Voir l\'interprétation complète',
    shareButton: 'Partager le Rêve',
    shareOnTwitter: 'Partager sur Twitter',
    shareOnFacebook: 'Partager sur Facebook',
    shareOnLinkedIn: 'Partager sur LinkedIn',
    shareViaEmail: 'Partager par Email',
    copyToClipboard: 'Copier dans le Presse-papiers',
    copied: 'Copié!',
    emailSubject: 'Découvrez mon rêve',
  },
  de: {
    checkOutMyDream: 'Schauen Sie sich meine Traumdeutung an',
    interpretation: 'Interpretation',
    dreamTitle: 'Traum',
    viewFullInterpretation: 'Vollständige Interpretation anzeigen',
    shareButton: 'Traum Teilen',
    shareOnTwitter: 'Auf Twitter teilen',
    shareOnFacebook: 'Auf Facebook teilen',
    shareOnLinkedIn: 'Auf LinkedIn teilen',
    shareViaEmail: 'Per E-Mail teilen',
    copyToClipboard: 'In Zwischenablage kopieren',
    copied: 'Kopiert!',
    emailSubject: 'Schauen Sie sich meinen Traum an',
  },
  it: {
    checkOutMyDream: 'Guarda l\'interpretazione del mio sogno',
    interpretation: 'Interpretazione',
    dreamTitle: 'Sogno',
    viewFullInterpretation: 'Visualizza interpretazione completa',
    shareButton: 'Condividi Sogno',
    shareOnTwitter: 'Condividi su Twitter',
    shareOnFacebook: 'Condividi su Facebook',
    shareOnLinkedIn: 'Condividi su LinkedIn',
    shareViaEmail: 'Condividi via Email',
    copyToClipboard: 'Copia negli Appunti',
    copied: 'Copiato!',
    emailSubject: 'Guarda il mio sogno',
  },
  pt: {
    checkOutMyDream: 'Confira a interpretação do meu sonho',
    interpretation: 'Interpretação',
    dreamTitle: 'Sonho',
    viewFullInterpretation: 'Ver interpretação completa',
    shareButton: 'Compartilhar Sonho',
    shareOnTwitter: 'Compartilhar no Twitter',
    shareOnFacebook: 'Compartilhar no Facebook',
    shareOnLinkedIn: 'Compartilhar no LinkedIn',
    shareViaEmail: 'Compartilhar por Email',
    copyToClipboard: 'Copiar para Área de Transferência',
    copied: 'Copiado!',
    emailSubject: 'Confira meu sonho',
  },
  ja: {
    checkOutMyDream: '私の夢の解釈をご覧ください',
    interpretation: '解釈',
    dreamTitle: '夢',
    viewFullInterpretation: '完全な解釈を見る',
    shareButton: '夢を共有',
    shareOnTwitter: 'Twitterで共有',
    shareOnFacebook: 'Facebookで共有',
    shareOnLinkedIn: 'LinkedInで共有',
    shareViaEmail: 'メールで共有',
    copyToClipboard: 'クリップボードにコピー',
    copied: 'コピーしました！',
    emailSubject: '私の夢をご覧ください',
  },
  zh: {
    checkOutMyDream: '查看我的梦境解读',
    interpretation: '解读',
    dreamTitle: '梦境',
    viewFullInterpretation: '查看完整解读',
    shareButton: '分享梦境',
    shareOnTwitter: '在Twitter上分享',
    shareOnFacebook: '在Facebook上分享',
    shareOnLinkedIn: '在LinkedIn上分享',
    shareViaEmail: '通过电子邮件分享',
    copyToClipboard: '复制到剪贴板',
    copied: '已复制！',
    emailSubject: '查看我的梦境',
  },
  ko: {
    checkOutMyDream: '내 꿈 해석을 확인하세요',
    interpretation: '해석',
    dreamTitle: '꿈',
    viewFullInterpretation: '전체 해석 보기',
    shareButton: '꿈 공유',
    shareOnTwitter: 'Twitter에서 공유',
    shareOnFacebook: 'Facebook에서 공유',
    shareOnLinkedIn: 'LinkedIn에서 공유',
    shareViaEmail: '이메일로 공유',
    copyToClipboard: '클립보드에 복사',
    copied: '복사됨!',
    emailSubject: '내 꿈을 확인하세요',
  },
  ru: {
    checkOutMyDream: 'Посмотрите толкование моего сна',
    interpretation: 'Толкование',
    dreamTitle: 'Сон',
    viewFullInterpretation: 'Посмотреть полное толкование',
    shareButton: 'Поделиться Сном',
    shareOnTwitter: 'Поделиться в Twitter',
    shareOnFacebook: 'Поделиться в Facebook',
    shareOnLinkedIn: 'Поделиться в LinkedIn',
    shareViaEmail: 'Поделиться по Email',
    copyToClipboard: 'Скопировать в буфер обмена',
    copied: 'Скопировано!',
    emailSubject: 'Посмотрите мой сон',
  },
  ar: {
    checkOutMyDream: 'اطلع على تفسير حلمي',
    interpretation: 'تفسير',
    dreamTitle: 'حلم',
    viewFullInterpretation: 'عرض التفسير الكامل',
    shareButton: 'مشاركة الحلم',
    shareOnTwitter: 'مشاركة على تويتر',
    shareOnFacebook: 'مشاركة على فيسبوك',
    shareOnLinkedIn: 'مشاركة على لينكد إن',
    shareViaEmail: 'مشاركة عبر البريد الإلكتروني',
    copyToClipboard: 'نسخ إلى الحافظة',
    copied: 'تم النسخ!',
    emailSubject: 'اطلع على حلمي',
  },
  hi: {
    checkOutMyDream: 'मेरे सपने की व्याख्या देखें',
    interpretation: 'व्याख्या',
    dreamTitle: 'सपना',
    viewFullInterpretation: 'पूर्ण व्याख्या देखें',
    shareButton: 'सपना साझा करें',
    shareOnTwitter: 'Twitter पर साझा करें',
    shareOnFacebook: 'Facebook पर साझा करें',
    shareOnLinkedIn: 'LinkedIn पर साझा करें',
    shareViaEmail: 'ईमेल के माध्यम से साझा करें',
    copyToClipboard: 'क्लिपबोर्ड पर कॉपी करें',
    copied: 'कॉपी हो गया!',
    emailSubject: 'मेरा सपना देखें',
  },
}

/**
 * Detects the user's preferred language from browser settings
 * Falls back to English if the language is not supported
 */
export function detectUserLanguage(): SupportedLanguage {
  if (typeof navigator === 'undefined') return 'en'
  
  const browserLang = navigator.language || navigator.languages?.[0] || 'en'
  const langCode = browserLang.split('-')[0].toLowerCase() as SupportedLanguage
  
  return translations[langCode] ? langCode : 'en'
}

/**
 * Gets translations for the user's language
 */
export function getShareTranslations(language?: SupportedLanguage): ShareTextTranslation {
  const lang = language || detectUserLanguage()
  return translations[lang] || translations.en
}

/**
 * Generates localized share text for a dream
 */
export function generateShareText(
  dreamTitle: string,
  dreamDescription: string,
  interpretation: string,
  shareUrl: string,
  language?: SupportedLanguage
): string {
  const t = getShareTranslations(language)
  
  return `${t.checkOutMyDream}: "${dreamTitle}"

${dreamDescription.substring(0, 150)}...

${t.interpretation}: ${interpretation.substring(0, 100)}...

${t.viewFullInterpretation}: ${shareUrl}`
}
