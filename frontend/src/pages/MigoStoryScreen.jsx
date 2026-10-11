import { useEffect, useState } from 'react';
import { getCompanionName, setCompanionName } from '../db.js';
import { buildMigoStory } from '../migoStory.js';

// Partículas de fondo, generadas una sola vez (a nivel de módulo) para que no
// salten de posición en cada render — solo titilan y flotan en su lugar.
const SPARKLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  left: Math.round(Math.random() * 100),
  top: Math.round(Math.random() * 100),
  size: (4 + Math.random() * 9).toFixed(1),
  delay: (Math.random() * 6).toFixed(2),
  duration: (3.5 + Math.random() * 4).toFixed(2),
  drift: Math.round(Math.random() * 18 - 9),
  glyph: Math.random() > 0.65 ? '✨' : '·',
}));

function StorySparkles() {
  return (
    <div className="story-sparkles" aria-hidden="true">
      {SPARKLES.map((s) => (
        <span
          key={s.id}
          className="story-sparkle"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            fontSize: `${s.size}px`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
            '--drift': `${s.drift}px`,
          }}
        >
          {s.glyph}
        </span>
      ))}
    </div>
  );
}

export function MigoStoryScreen({ onBack }) {
  const [loadingName, setLoadingName] = useState(true);
  const [name, setName] = useState(null);
  const [nameDraft, setNameDraft] = useState('');
  const [askingName, setAskingName] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    getCompanionName().then((stored) => {
      setName(stored);
      setAskingName(!stored);
      setLoadingName(false);
    });
  }, []);

  async function handleNameSubmit(e) {
    e.preventDefault();
    const trimmed = nameDraft.trim();
    if (trimmed) {
      await setCompanionName(trimmed);
      setName(trimmed);
    }
    setAskingName(false);
  }

  async function handleSkipName() {
    setAskingName(false);
  }

  if (loadingName) return null;

  if (askingName) {
    return (
      <div className="story-screen">
        <div className="story-sky" aria-hidden="true" />
        <StorySparkles />
        <button className="story-back" onClick={onBack}>
          ← Perfil
        </button>
        <div className="story-name-step">
          <div className="story-glyph-halo is-accent-violet">
            <span className="story-glyph">🔮</span>
          </div>
          <h1 className="story-name-title">Antes de empezar…</h1>
          <p className="story-name-lede">
            ¿Cómo te llamas? Así la historia es tuya, no de cualquiera.
          </p>
          <form onSubmit={handleNameSubmit} className="story-name-form">
            <input
              type="text"
              autoFocus
              placeholder="Tu nombre"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              maxLength={30}
            />
            <button type="submit" disabled={!nameDraft.trim()}>
              Empezar
            </button>
          </form>
          <button className="ghost" onClick={handleSkipName}>
            Dejarlo así, solo Migo
          </button>
        </div>
      </div>
    );
  }

  const pages = buildMigoStory(name);
  const page = pages[pageIndex];
  const isFirst = pageIndex === 0;
  const isLast = pageIndex === pages.length - 1;
  const accent = page.accent || 'violet';

  return (
    <div className={`story-screen is-accent-${accent}`}>
      <div className="story-sky" aria-hidden="true" />
      <StorySparkles />

      <button className="story-back" onClick={onBack}>
        ← Perfil
      </button>

      <div className="story-progress" aria-hidden="true">
        {pages.map((_, i) => (
          <span key={i} className={`story-dot ${i === pageIndex ? 'is-active' : ''} ${i < pageIndex ? 'is-done' : ''}`} />
        ))}
      </div>

      <div className="story-frame" key={pageIndex}>
        <span className="story-frame-corner is-tl" aria-hidden="true">✦</span>
        <span className="story-frame-corner is-tr" aria-hidden="true">✦</span>
        <span className="story-frame-corner is-bl" aria-hidden="true">✦</span>
        <span className="story-frame-corner is-br" aria-hidden="true">✦</span>

        <div className="story-book">
          <div className={`story-glyph-halo is-accent-${accent}`}>
            <span className="story-glyph">{page.glyph}</span>
          </div>
          {page.title && <h1 className="story-title">{page.title}</h1>}
          <p className="story-text">{page.text}</p>
        </div>
      </div>

      <div className="story-nav">
        <button className="ghost story-nav-btn" onClick={() => setPageIndex((p) => p - 1)} disabled={isFirst}>
          ← Antes
        </button>
        {isLast ? (
          <button className="story-nav-btn story-nav-close" onClick={onBack}>
            Cerrar el libro
          </button>
        ) : (
          <button className="story-nav-btn" onClick={() => setPageIndex((p) => p + 1)}>
            Después →
          </button>
        )}
      </div>
    </div>
  );
}
