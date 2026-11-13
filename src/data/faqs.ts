export interface FaqItem {
  id: string;
  question: string;
  keywords: string[];
  answer: {
    en: string;
    kn: string;
    hi: string;
  };
  related: string[];
}

// Note: Kannada (kn) and Hindi (hi) answers use English text placeholders where needed so every FAQ remains clear and accurate across languages.
export const FAQS: FaqItem[] = [
  {
    id: 'what-is-schemesaathi',
    question: 'What is SchemeSaathi?',
    keywords: ['what', 'schemesaathi', 'about', 'platform', 'purpose', 'portal', 'tool', 'help'],
    answer: {
      en: 'SchemeSaathi is a free, privacy-first guide that helps families discover Central and Karnataka welfare schemes that may be relevant to them, explained in simple everyday language.',
      kn: 'ಸ್ಕೀಮ್‌ಸಾಥಿ (SchemeSaathi) ಒಂದು ಉಚಿತ ಮತ್ತು ಗೌಪ್ಯತೆ-ಸುರಕ್ಷಿತ ಮಾರ್ಗದರ್ಶಿಯಾಗಿದೆ. ಇದು ಕುಟುಂಬಗಳಿಗೆ ಅನ್ವಯವಾಗಬಹುದಾದ ಕೇಂದ್ರ ಮತ್ತು ಕರ್ನಾಟಕ ಸರ್ಕಾರದ ಯೋಜನೆಗಳನ್ನು ಸರಳ ಭಾಷೆಯಲ್ಲಿ ಹುಡುಕಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.',
      hi: 'स्कीमसाथी (SchemeSaathi) एक निःशुल्क और गोपनीयता-सुरक्षित मार्गदर्शिका है जो परिवारों को केंद्र और कर्नाटक की उन सरकारी योजनाओं को खोजने में मदद करती है जो उनके लिए उपयोगी हो सकती हैं।',
    },
    related: ['guarantee-scheme', 'what-details', 'cost-anything'],
  },
  {
    id: 'guarantee-scheme',
    question: 'Does this guarantee I will get a scheme?',
    keywords: ['guarantee', 'guaranteed', 'confirmed', 'sure', 'get', 'receive', 'approved', 'approval', 'eligible'],
    answer: {
      en: 'No. SchemeSaathi only shows schemes that may be relevant based on the details you enter. Final eligibility and approval are always decided by the official government department when you apply.',
      kn: 'ಇಲ್ಲ. ನೀವು ನೀಡಿದ ಮಾಹಿತಿಯ ಆಧಾರದ ಮೇಲೆ ನಿಮಗೆ ಅನ್ವಯವಾಗಬಹುದಾದ ಯೋಜನೆಗಳನ್ನು ಮಾತ್ರ ಸ್ಕೀಮ್‌ಸಾಥಿ ತೋರಿಸುತ್ತದೆ. ಅಂತಿಮ ಅನುಮೋದನೆಯನ್ನು ಸಂಬಂಧಿತ ಸರ್ಕಾರಿ ಇಲಾಖೆಯೇ ನಿರ್ಧರಿಸುತ್ತದೆ.',
      hi: 'नहीं। आपके द्वारा दी गई जानकारी के आधार पर स्कीमसाथी केवल वे योजनाएं दिखाता है जो आपके लिए उपयोगी हो सकती हैं। अंतिम स्वीकृति हमेशा संबंधित सरकारी विभाग द्वारा ही दी जाती है।',
    },
    related: ['high-medium-match', 'how-to-apply', 'up-to-date'],
  },
  {
    id: 'what-details',
    question: 'What details do I need to enter?',
    keywords: ['details', 'enter', 'profile', 'information', 'form', 'aadhaar', 'documents', 'need', 'fields'],
    answer: {
      en: 'You only enter basic details such as your age, state, approximate annual income bracket, occupation, and household category (like student, senior citizen, farmer, or woman). We never ask for Aadhaar, bank account, or phone numbers.',
      kn: 'ನೀವು ಕೇವಲ ವಯಸ್ಸು, ರಾಜ್ಯ, ಅಂದಾಜು ವಾರ್ಷಿಕ ಆದಾಯ ಶ್ರೇಣಿ, ಉದ್ಯೋಗ ಮತ್ತು ವರ್ಗದಂತಹ ಸರಳ ವಿವರಗಳನ್ನು ಮಾತ್ರ ನೀಡಬೇಕು. ನಾವು ಆಧಾರ್, ಬ್ಯಾಂಕ್ ಅಥವಾ ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ಕೇಳುವುದಿಲ್ಲ.',
      hi: 'आपको केवल उम्र, राज्य, अनुमानित वार्षिक आय वर्ग, व्यवसाय और श्रेणी जैसी सामान्य जानकारी दर्ज करनी होती है। हम कभी भी आधार, बैंक खाता या फ़ोन नंबर नहीं मांगते।',
    },
    related: ['data-safe', 'high-medium-match', 'what-is-schemesaathi'],
  },
  {
    id: 'high-medium-match',
    question: 'What do High and Medium match mean?',
    keywords: ['high', 'medium', 'match', 'badge', 'mean', 'meaning', 'difference', 'score', 'strong', 'confirm'],
    answer: {
      en: 'A High match means all primary rules for that scheme line up with your profile, so it may be relevant right away. A Medium match means key criteria match, but some details (such as a specific occupation or certificate) still need your confirmation.',
      kn: 'High match ಎಂದರೆ ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ವಿವರಗಳು ಯೋಜನೆಯ ಪ್ರಮುಖ ನಿಯಮಗಳಿಗೆ ಹೊಂದಿಕೆಯಾಗುತ್ತವೆ ಮತ್ತು ಅದು ನಿಮಗೆ ಅನ್ವಯವಾಗಬಹುದು. Medium match ಎಂದರೆ ಪ್ರಮುಖ ಅಂಶಗಳು ಹೊಂದಿಕೆಯಾಗಿವೆ, ಆದರೆ ಕೆಲವು ವಿವರಗಳನ್ನು ನೀವು ಪರಿಶೀಲಿಸಬೇಕು.',
      hi: 'High match का अर्थ है कि आपकी प्रोफ़ाइल उस योजना के मुख्य नियमों से मेल खाती है और यह आपके लिए उपयोगी हो सकती है। Medium match का अर्थ है कि मुख्य शर्तें मिलती हैं, लेकिन कुछ विवरणों की पुष्टि करना आवश्यक है।',
    },
    related: ['guarantee-scheme', 'what-details', 'how-to-apply'],
  },
  {
    id: 'how-to-apply',
    question: 'How do I apply for a scheme?',
    keywords: ['apply', 'application', 'submit', 'seva', 'sindhu', 'myscheme', 'portal', 'official', 'link', 'process'],
    answer: {
      en: 'Open any scheme details page to review the required documents checklist, then click the "Open Official Application Page" button. That takes you directly to the official government portal (such as Seva Sindhu or myScheme.gov.in) to submit your application.',
      kn: 'ಯಾವುದೇ ಯೋಜನೆಯ ವಿವರಗಳ ಪುಟವನ್ನು ತೆರೆದು ಅಗತ್ಯ ದಾಖಲೆಗಳ ಪಟ್ಟಿಯನ್ನು ಪರಿಶೀಲಿಸಿ, ನಂತರ "ಅಧಿಕೃತ ಅರ್ಜಿ ಪುಟವನ್ನು ತೆರೆಯಿರಿ" ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ. ಅದು ನಿಮ್ಮನ್ನು ನೇರವಾಗಿ ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಪೋರ್ಟಲ್‌ಗೆ ಕರೆದೊಯ್ಯುತ್ತದೆ.',
      hi: 'किसी भी योजना के विवरण पृष्ठ को खोलकर आवश्यक दस्तावेजों की सूची देखें, फिर आधिकारिक आवेदन पृष्ठ खोलने वाले बटन पर क्लिक करें। इससे आप सीधे आधिकारिक सरकारी पोर्टल पर पहुंच जाएंगे।',
    },
    related: ['guarantee-scheme', 'save-scheme', 'what-details'],
  },
  {
    id: 'data-safe',
    question: 'Is my data safe?',
    keywords: ['safe', 'privacy', 'security', 'private', 'data', 'aadhaar', 'bank', 'phone', 'secure', 'protect'],
    answer: {
      en: 'Yes. SchemeSaathi is built to collect only minimal, non-sensitive profile details needed to find schemes that may be relevant to your household. We do not collect Aadhaar numbers, PAN cards, bank details, or phone numbers.',
      kn: 'ಹೌದು. ನಿಮಗೆ ಅನ್ವಯವಾಗಬಹುದಾದ ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಲು ಅಗತ್ಯವಿರುವ ಕನಿಷ್ಠ ಮತ್ತು ಸಾಮಾನ್ಯ ಮಾಹಿತಿಯನ್ನು ಮಾತ್ರ ಸಂಗ್ರಹಿಸಲಾಗುತ್ತದೆ. ಆಧಾರ್, ಪ್ಯಾನ್, ಬ್ಯಾಂಕ್ ಅಥವಾ ಫೋನ್ ಸಂಖ್ಯೆಗಳನ್ನು ಸಂಗ್ರಹಿಸುವುದಿಲ್ಲ.',
      hi: 'हाँ। स्कीमसाथी केवल उतनी ही सामान्य जानकारी लेता है जो आपके परिवार के लिए संभावित उपयोगी योजनाएं खोजने हेतु जरूरी हो। हम आधार, पैन, बैंक या फ़ोन नंबर कभी एकत्र नहीं करते।',
    },
    related: ['what-details', 'cost-anything', 'what-is-schemesaathi'],
  },
  {
    id: 'languages-supported',
    question: 'Which languages are supported?',
    keywords: ['language', 'languages', 'kannada', 'hindi', 'english', 'translate', 'translation', 'switch', 'kn', 'hi'],
    answer: {
      en: 'SchemeSaathi supports English, ಕನ್ನಡ (Kannada), and हिन्दी (Hindi). You can switch languages anytime using the language selector in the top header.',
      kn: 'ಸ್ಕೀಮ್‌ಸಾಥಿ ಇಂಗ್ಲಿಷ್, ಕನ್ನಡ ಮತ್ತು ಹಿಂದಿ ಭಾಷೆಗಳನ್ನು ಬೆಂಬಲಿಸುತ್ತದೆ. ಮೇಲಿನ ಮೆನುವಿನಲ್ಲಿರುವ ಭಾಷಾ ಆಯ್ಕೆಯ ಮೂಲಕ ನೀವು ಯಾವಾಗ ಬೇಕಾದರೂ ಭಾಷೆಯನ್ನು ಬದಲಾಯಿಸಬಹುದು.',
      hi: 'स्कीमसाथी अंग्रेज़ी, कन्नड़ (ಕನ್ನಡ) और हिन्दी का समर्थन करता है। आप शीर्ष हेडर में दिए गए भाषा विकल्प से कभी भी भाषा बदल सकते हैं।',
    },
    related: ['what-is-schemesaathi', 'up-to-date', 'suggest-scheme'],
  },
  {
    id: 'up-to-date',
    question: 'Is the scheme information up to date?',
    keywords: ['update', 'updated', 'latest', 'current', 'verified', 'date', 'recent', 'accurate', 'fresh'],
    answer: {
      en: 'Each scheme shows a "Last verified by team" date on its details page. Because government guidelines and income limits can change, please always double-check the latest official circular on the department website before applying.',
      kn: 'ಪ್ರತಿ ಯೋಜನೆಯ ವಿವರಗಳ ಪುಟದಲ್ಲಿ ಕೊನೆಯದಾಗಿ ಪರಿಶೀಲಿಸಿದ ದಿನಾಂಕವನ್ನು ತೋರಿಸಲಾಗುತ್ತದೆ. ಸರ್ಕಾರಿ ನಿಯಮಗಳು ಬದಲಾಗಬಹುದಾದ್ದರಿಂದ, ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ಮೊದಲು ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ಪರಿಶೀಲಿಸಿ.',
      hi: 'प्रत्येक योजना के विवरण पृष्ठ पर अंतिम सत्यापन तिथि दिखाई जाती है। चूंकि सरकारी नियम बदल सकते हैं, इसलिए आवेदन से पहले हमेशा आधिकारिक वेबसाइट पर नवीनतम जानकारी जांचें।',
    },
    related: ['guarantee-scheme', 'sample-data', 'suggest-scheme'],
  },
  {
    id: 'sample-data',
    question: 'Why does a scheme say "Sample data"?',
    keywords: ['sample', 'badge', 'demo', 'synthetic', 'label', 'test', 'placeholder'],
    answer: {
      en: 'Any entry created for testing or academic demonstration carries a "Sample data" badge so families clearly know it is an illustrative record and not an active government scheme. Real Central and Karnataka schemes do not carry that badge.',
      kn: 'ಪರೀಕ್ಷೆ ಅಥವಾ ಶೈಕ್ಷಣಿಕ ಪ್ರದರ್ಶನಕ್ಕಾಗಿ ಸೇರಿಸಲಾದ ಮಾಹಿತಿಗೆ ಮಾತ್ರ "ಮಾದರಿ ಡೇಟಾ" (Sample data) ಬ್ಯಾಡ್ಜ್ ಇರುತ್ತದೆ. ನಿಜವಾದ ಕೇಂದ್ರ ಮತ್ತು ಕರ್ನಾಟಕ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳಿಗೆ ಈ ಬ್ಯಾಡ್ಜ್ ಇರುವುದಿಲ್ಲ.',
      hi: 'केवल परीक्षण या शैक्षिक प्रदर्शन के लिए जोड़ी गई प्रविष्टियों पर "नमूना डेटा" (Sample data) बैज होता है। वास्तविक केंद्र और कर्नाटक सरकारी योजनाओं पर यह बैज नहीं होता।',
    },
    related: ['up-to-date', 'guarantee-scheme', 'what-is-schemesaathi'],
  },
  {
    id: 'save-scheme',
    question: 'How do I save a scheme?',
    keywords: ['save', 'saved', 'bookmark', 'track', 'later', 'applied', 'status', 'list'],
    answer: {
      en: 'Sign in to your account and click the "Save Scheme" or bookmark button on any scheme card or details page. You can review all bookmarked schemes and mark whether you have applied on the Saved page.',
      kn: 'ನಿಮ್ಮ ಖಾತೆಗೆ ಲಾಗಿನ್ ಆಗಿ, ಯಾವುದೇ ಯೋಜನೆಯ ಮೇಲಿರುವ "ಉಳಿಸಿ" (Save) ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ. ನೀವು ಉಳಿಸಿದ ಎಲ್ಲಾ ಯೋಜನೆಗಳನ್ನು "ಉಳಿಸಿದ ಯೋಜನೆಗಳು" ಪುಟದಲ್ಲಿ ನೋಡಬಹುದು.',
      hi: 'अपने खाते में लॉग इन करें और किसी भी योजना कार्ड या विवरण पृष्ठ पर "सहेजें" (Save) बटन दबाएं। आप सहेजी गई सभी योजनाओं को "Saved" पृष्ठ पर देख सकते हैं।',
    },
    related: ['how-to-apply', 'cost-anything', 'what-details'],
  },
  {
    id: 'cost-anything',
    question: 'Does it cost anything?',
    keywords: ['cost', 'fee', 'fees', 'price', 'pay', 'money', 'free', 'charge', 'charges'],
    answer: {
      en: 'No. SchemeSaathi is 100% free to use. We never charge fees or act as paid agents. Official scheme applications are submitted directly on government portals.',
      kn: 'ಇಲ್ಲ. ಸ್ಕೀಮ್‌ಸಾಥಿ ಸಂಪೂರ್ಣವಾಗಿ ಉಚಿತವಾಗಿದೆ. ನಾವು ಯಾವುದೇ ಶುಲ್ಕವನ್ನು ಪಡೆಯುವುದಿಲ್ಲ ಮತ್ತು ಮಧ್ಯವರ್ತಿಯಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುವುದಿಲ್ಲ.',
      hi: 'नहीं। स्कीमसाथी का उपयोग पूरी तरह से निःशुल्क है। हम कोई शुल्क नहीं लेते और न ही किसी एजेंट के रूप में काम करते हैं।',
    },
    related: ['what-is-schemesaathi', 'data-safe', 'how-to-apply'],
  },
  {
    id: 'suggest-scheme',
    question: 'How can I suggest a new scheme or feature?',
    keywords: ['suggest', 'suggestion', 'add', 'missing', 'feature', 'feedback', 'request', 'report', 'improve', 'contact'],
    answer: {
      en: 'You can visit our Community Suggestions page (/suggest) anytime — logged in or logged out — to suggest a government scheme, request a new feature, or share feedback with our team.',
      kn: 'ನೀವು ಲಾಗಿನ್ ಆಗಿರಲಿ ಅಥವಾ ಇಲ್ಲದಿರಲಿ, ನಮ್ಮ "Suggest" ಪುಟಕ್ಕೆ (/suggest) ಭೇಟಿ ನೀಡಿ ಹೊಸ ಯೋಜನೆ, ವೈಶಿಷ್ಟ್ಯ ಅಥವಾ ಪ್ರತಿಕ್ರಿಯೆಯನ್ನು ಹಂಚಿಕೊಳ್ಳಬಹುದು.',
      hi: 'आप लॉग इन हों या न हों, हमारे "Suggest" पृष्ठ (/suggest) पर जाकर किसी नई योजना, सुविधा या सुझाव को सीधे हमारी टीम के साथ साझा कर सकते हैं।',
    },
    related: ['what-is-schemesaathi', 'up-to-date', 'languages-supported'],
  },
];

export const DEFAULT_SUGGESTED_FAQ_IDS = [
  'what-is-schemesaathi',
  'guarantee-scheme',
  'what-details',
  'high-medium-match',
  'how-to-apply',
  'suggest-scheme',
];

export function matchFaq(query: string, faqList: FaqItem[] = FAQS): FaqItem | null {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return null;

  let bestMatch: FaqItem | null = null;
  let bestScore = 0;

  for (const faq of faqList) {
    let score = 0;
    for (const kw of faq.keywords) {
      const lowerKw = kw.toLowerCase();
      if (normalized.includes(lowerKw)) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = faq;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}
