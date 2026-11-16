// hm-faq.jsx — DoRent standalone FAQ page (mobile ru / hy, desktop ru).
// Copied from Claude Design project df24299b-1299-4804-8a0a-5484005594c3 (2026-11-16).
// Shared parts (FaqItem, StillCard, Footer…) live in the project's hm-parts.jsx; .faqi/.crumb CSS in FAQ.html.

const FAQ_HOME = { ru:'Главная', hy:'Գլխավոր' };

function Crumb({ L, lang }) {
  return <nav className="crumb" aria-label="breadcrumb" lang={lang}><a href="Home Redesign Stage 1.html">{FAQ_HOME[lang]}</a><Ic n="chevron" s={14} c={H.hint} /><span aria-current="page" style={{ color:H.t }}>{L.faq}</span></nav>;
}
function FaqList({ L, lang, mobile }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: mobile ? 32 : 40 }}>
      {L.faqGroups.map(([title, qs], gi) => (
        <section key={gi} aria-label={title}>
          <h2 className={mobile ? 'h2m' : 'h2d'} lang={lang} style={{ paddingBottom: mobile ? 10 : 12, borderBottom:`1px solid ${H.o}`, marginBottom: mobile ? 12 : 16 }}>{title}</h2>
          <div style={{ display:'flex', flexDirection:'column', gap: mobile ? 8 : 12 }}>{qs.map(([q, a], i) => <FaqItem key={i} q={q} a={a} open={gi === 0 && i === 0} lang={lang} />)}</div>
        </section>
      ))}
    </div>
  );
}

function MFaqPage({ lang = 'ru' }) {
  const L = S[lang];
  return (
    <div className="pg" lang={lang} style={{ width:390, background:H.bg }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 18px' }}><Logo /><LangBtn L={L} /></div>
      <main style={{ padding:'4px 18px 48px' }}>
        <Crumb L={L} lang={lang} />
        <h1 className="h1m" style={{ margin:'8px 0 20px' }}>{L.faq}</h1>
        <FaqList L={L} lang={lang} mobile />
        <div style={{ marginTop:32 }}><StillCard L={L} lang={lang} mobile /></div>
      </main>
      <Footer L={L} lang={lang} stacked />
      <BottomNav L={L} lang={lang} />
    </div>
  );
}

function DFaqPage({ lang = 'ru', W = 1440 }) {
  const L = S[lang];
  return (
    <div className="pg" lang={lang} style={{ width:W, background:H.bg }}>
      <header className="dhead"><Logo size={24} /><span style={{ flex:1 }}></span><LangBtn L={L} desk /><button className="btn-o">{L.login}</button><button className="btn-p sm">{L.signup}</button></header>
      <main style={{ padding:'32px 70px 80px', display:'grid', gridTemplateColumns:'360px minmax(0,1fr)', gap:64, alignItems:'start' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:16, position:'sticky', top:24 }}>
          <Crumb L={L} lang={lang} />
          <h1 className="h1d">{L.faq}</h1>
          <div style={{ marginTop:16 }}><StillCard L={L} lang={lang} /></div>
        </div>
        <div style={{ paddingTop:52, maxWidth:820 }}><FaqList L={L} lang={lang} /></div>
      </main>
      <Footer L={L} lang={lang} />
    </div>
  );
}

// Relevant CSS from FAQ.html:
// .faqi{background:#fff;border:1px solid #E8E5DE;border-radius:14px;overflow:hidden}
// .faqi.open{border-color:#DDD9D0}
// .faqi button{width:100%;min-height:56px;display:flex;align-items:center;gap:12px;padding:14px 14px 14px 20px;border:0;background:transparent;text-align:left;font-size:16px;line-height:22px;font-weight:600}
// .faqi button:hover{background:#FAF8F4}
// .faqi p{margin:0;padding:0 20px 18px;font-size:15px;line-height:22px;color:#6B6A75;text-wrap:pretty}
// .crumb{display:flex;align-items:center;gap:6px;font-size:14px;line-height:20px;color:#6B6A75;min-height:44px}
// .h1d{font-size:44px;line-height:52px;font-weight:800;letter-spacing:-.03em} .h1m{font-size:28px;line-height:34px;font-weight:800;letter-spacing:-.025em}
// .h2d{font-size:24px;line-height:32px;font-weight:800;letter-spacing:-.02em} .h2m{font-size:20px;line-height:28px;font-weight:800;letter-spacing:-.015em}
// StillCard: #fff, radius 16, 1px #E8E5DE, padding 24 (m 20), gap 8; h3 18/24 700; p 15/22 #6B6A75; .btn-p min-h 48, pad 12 24, #C24600, mail icon.
