import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FAQS, DEFAULT_SUGGESTED_FAQ_IDS, FaqItem, matchFaq } from '../data/faqs';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  relatedIds?: string[];
  unmatchedQuery?: string;
}

const getFaqById = (id: string): FaqItem | undefined => FAQS.find((f) => f.id === id);

export const Faq: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const lang = (['en', 'kn', 'hi'].includes(i18n.language) ? i18n.language : 'en') as 'en' | 'kn' | 'hi';

  const createInitialMessages = (): ChatMessage[] => [
    {
      id: 'greeting',
      sender: 'bot',
      text: t('faqPage.greeting'),
      relatedIds: DEFAULT_SUGGESTED_FAQ_IDS,
    },
  ];

  const [messages, setMessages] = useState<ChatMessage[]>(createInitialMessages);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleClearChat = () => {
    setMessages(createInitialMessages());
    setInputText('');
    setIsTyping(false);
    inputRef.current?.focus();
  };

  const appendBotReply = (userText: string, matchedFaq: FaqItem | null) => {
    setIsTyping(true);
    window.setTimeout(() => {
      if (matchedFaq) {
        const localizedAnswer = matchedFaq.answer[lang] || matchedFaq.answer.en;
        setMessages((prev) => [
          ...prev,
          {
            id: `bot_${Date.now()}`,
            sender: 'bot',
            text: localizedAnswer,
            relatedIds: matchedFaq.related.slice(0, 3),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot_${Date.now()}`,
            sender: 'bot',
            text: t('faqPage.noMatch'),
            unmatchedQuery: userText,
          },
        ]);
      }
      setIsTyping(false);
    }, 400);
  };

  const handlePickFaq = (faq: FaqItem) => {
    if (isTyping) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `user_${Date.now()}`,
        sender: 'user',
        text: faq.question,
      },
    ]);
    appendBotReply(faq.question, faq);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isTyping) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `user_${Date.now()}`,
        sender: 'user',
        text: trimmed,
      },
    ]);
    setInputText('');
    inputRef.current?.focus();

    const matched = matchFaq(trimmed, FAQS);
    appendBotReply(trimmed, matched);
  };

  const renderBotText = (text: string) => {
    if (text.includes('https://www.myscheme.gov.in/')) {
      const parts = text.split('https://www.myscheme.gov.in/');
      return (
        <>
          {parts[0]}
          <a
            href="https://www.myscheme.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--teal)] hover:text-[var(--teal-hover)] font-semibold underline underline-offset-2"
          >
            https://www.myscheme.gov.in/
          </a>
          {parts[1]}
        </>
      );
    }

    if (text.includes('(/suggest)')) {
      const parts = text.split('(/suggest)');
      return (
        <>
          {parts[0]}
          (
          <Link
            to="/suggest"
            className="text-[var(--teal)] hover:text-[var(--teal-hover)] font-semibold underline underline-offset-2"
          >
            /suggest
          </Link>
          )
          {parts[1]}
        </>
      );
    }

    return text;
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-[720px] mx-auto bg-[var(--surface)] border border-[var(--border)] rounded-[6px] overflow-hidden flex flex-col">
        {/* Header */}
        <header className="bg-[var(--deep-band)] text-[var(--deep-text)] px-5 py-4 flex items-center justify-between gap-4 border-b border-[var(--deep-border)]">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="w-10 h-10 rounded-full bg-[var(--saffron)] text-[var(--saffron-text)] font-bold text-lg inline-flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              S
            </span>
            <div className="min-w-0">
              <h1 className="text-[20px] font-bold text-[var(--deep-text)] leading-tight">
                {t('faqPage.headerTitle')}
              </h1>
              <p className="text-sm text-[var(--deep-muted)]">
                {t('faqPage.headerSubtitle')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClearChat}
            className="min-h-[40px] px-3 py-1.5 rounded-[6px] text-xs font-semibold border border-[var(--deep-border)] text-[var(--deep-text)] hover:bg-[var(--deep-band-end)] transition-colors duration-150 cursor-pointer shrink-0"
          >
            {t('faqPage.clearChat')}
          </button>
        </header>

        {/* Messages */}
        <div
          className="p-4 sm:p-6 space-y-5 bg-[var(--bg-page)] min-h-[360px]"
          aria-live="polite"
        >
          {messages.map((msg) => {
            if (msg.sender === 'user') {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-[6px] px-4 py-3 bg-[var(--teal)] text-[var(--deep-text)] text-base leading-relaxed">
                    {msg.text}
                  </div>
                </div>
              );
            }

            const suggestedItems = (msg.relatedIds || [])
              .map(getFaqById)
              .filter((item): item is FaqItem => Boolean(item));

            return (
              <div key={msg.id} className="flex items-start gap-3">
                <span
                  className="w-8 h-8 rounded-full bg-[var(--teal)] text-[var(--deep-text)] font-bold text-sm inline-flex items-center justify-center shrink-0 mt-0.5"
                  aria-hidden="true"
                >
                  S
                </span>

                <div className="space-y-2.5 max-w-[88%] min-w-0">
                  <div className="rounded-[6px] px-4 py-3 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-base leading-relaxed">
                    <p>{renderBotText(msg.text)}</p>

                    {msg.unmatchedQuery && (
                      <div className="pt-3">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/suggest?type=other&message=${encodeURIComponent(
                                msg.unmatchedQuery || ''
                              )}`,
                              {
                                state: {
                                  type: 'other',
                                  message: msg.unmatchedQuery,
                                },
                              }
                            )
                          }
                          className="min-h-[40px] inline-flex items-center justify-center px-4 py-2 rounded-[6px] text-sm font-semibold bg-[var(--saffron)] hover:bg-[var(--saffron-hover)] text-[var(--saffron-text)] transition-colors duration-150 cursor-pointer"
                        >
                          {t('faqPage.sendToTeam')}
                        </button>
                      </div>
                    )}
                  </div>

                  {suggestedItems.length > 0 && (
                    <div className="space-y-1.5">
                      {msg.id !== 'greeting' && (
                        <p className="text-xs font-semibold text-[var(--text-muted)]">
                          {t('faqPage.relatedHeading')}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {suggestedItems.map((faq) => (
                          <button
                            key={faq.id}
                            type="button"
                            onClick={() => handlePickFaq(faq)}
                            disabled={isTyping}
                            className="min-h-[40px] px-3 py-1.5 rounded-[6px] text-sm font-semibold text-left bg-[var(--teal-tint)] text-[var(--teal)] border border-[var(--border)] hover:border-[var(--teal)] transition-colors duration-150 cursor-pointer disabled:opacity-50"
                          >
                            {faq.question}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-3">
              <span
                className="w-8 h-8 rounded-full bg-[var(--teal)] text-[var(--deep-text)] font-bold text-sm inline-flex items-center justify-center shrink-0"
                aria-hidden="true"
              >
                S
              </span>
              <div className="rounded-[6px] px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-muted)]">
                Typing...
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSend}
          className="p-4 bg-[var(--surface)] border-t border-[var(--border)] flex items-center gap-2.5"
        >
          <label htmlFor="faq-question-input" className="sr-only">
            {t('faqPage.inputPlaceholder')}
          </label>
          <input
            ref={inputRef}
            id="faq-question-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t('faqPage.inputPlaceholder')}
            className="flex-1 min-w-0 min-h-[44px] px-3.5 py-2 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--teal)] rounded-[6px] text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="min-h-[44px] px-5 py-2 bg-[var(--teal)] hover:bg-[var(--teal-hover)] text-[var(--deep-text)] font-semibold text-sm rounded-[6px] transition-colors duration-150 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {t('faqPage.sendBtn')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Faq;
