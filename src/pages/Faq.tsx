import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FAQS, DEFAULT_SUGGESTED_FAQ_IDS, FaqItem, matchFaq } from '../data/faqs';
import PageHero from '../components/PageHero';
import AccentWord from '../components/AccentWord';

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
    }, 350);
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
            className="text-[var(--accent-ink)] font-bold underline underline-offset-2"
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
          <Link to="/suggest" className="text-[var(--accent-ink)] font-bold underline underline-offset-2">
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
    <div className="pb-12 animate-fade-up">
      <PageHero
        eyebrow="Guidance Assistant"
        title={
          <>
            SchemeSaathi <AccentWord>Help</AccentWord> & FAQ
          </>
        }
        subtitle={t('faqPage.headerSubtitle')}
      />

      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 -mt-10 relative z-10">
        <div className="max-w-[760px] mx-auto editorial-card overflow-hidden flex flex-col">
          {/* Card Header with Coral S Avatar */}
          <header className="bg-[var(--paper)] px-5 sm:px-7 py-4 flex items-center justify-between gap-4 border-b border-[var(--line)]">
            <div className="flex items-center gap-3.5 min-w-0">
              <span
                className="w-10 h-10 rounded-full bg-[var(--accent)] text-[var(--navy)] font-display font-bold text-base inline-flex items-center justify-center shrink-0"
                aria-hidden="true"
              >
                S
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-lg sm:text-xl font-bold text-[var(--navy)] leading-tight">
                  {t('faqPage.headerTitle')}
                </h2>
                <p className="text-xs sm:text-sm text-[var(--muted)]">
                  Pick a question below or type in English
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClearChat}
              className="btn-outline-pill min-h-[40px] px-4 py-1.5 text-xs cursor-pointer shrink-0"
            >
              {t('faqPage.clearChat')}
            </button>
          </header>

        {/* Messages */}
        <div className="p-4 sm:p-6 space-y-5 bg-[var(--cream)] min-h-[380px]" aria-live="polite">
          {messages.map((msg) => {
            if (msg.sender === 'user') {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-[16px] rounded-br-[4px] px-4 py-3 bg-[var(--navy)] text-[var(--cream)] text-base leading-relaxed">
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
                  className="w-8 h-8 rounded-full bg-[var(--accent)] text-[var(--navy)] font-display font-bold text-sm inline-flex items-center justify-center shrink-0 mt-0.5"
                  aria-hidden="true"
                >
                  S
                </span>

                <div className="space-y-3 max-w-[88%] min-w-0">
                  <div className="rounded-[16px] rounded-tl-[4px] px-4 py-3.5 bg-[var(--paper)] border border-[var(--line)] text-[var(--navy)] text-base leading-relaxed shadow-[var(--shadow-paper)]">
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
                          className="btn-accent-pill min-h-[40px] inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm cursor-pointer"
                        >
                          {t('faqPage.sendToTeam')}
                        </button>
                      </div>
                    )}
                  </div>

                  {suggestedItems.length > 0 && (
                    <div className="space-y-2">
                      {msg.id !== 'greeting' && (
                        <p className="text-xs font-bold text-[var(--muted)]">
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
                            className="min-h-[40px] px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-left bg-[var(--paper)] text-[var(--navy)] border border-[var(--line)] hover:border-[var(--navy)] transition-colors cursor-pointer disabled:opacity-50"
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
                className="w-8 h-8 rounded-full bg-[var(--accent)] text-[var(--navy)] font-display font-bold text-sm inline-flex items-center justify-center shrink-0"
                aria-hidden="true"
              >
                S
              </span>
              <div className="rounded-[16px] px-4 py-2.5 bg-[var(--paper)] border border-[var(--line)] text-sm text-[var(--muted)]">
                Typing...
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSend}
          className="p-4 sm:p-5 bg-[var(--paper)] border-t border-[var(--line)] flex items-center gap-2.5"
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
            className="editorial-input flex-1 min-w-0 px-4 py-2 text-base placeholder:text-[var(--muted)]"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="btn-accent-pill min-h-[48px] px-6 py-2 text-sm cursor-pointer disabled:opacity-50 shrink-0"
          >
            {t('faqPage.sendBtn')}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
};

export default Faq;
