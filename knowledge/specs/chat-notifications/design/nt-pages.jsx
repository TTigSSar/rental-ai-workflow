// nt-pages.jsx — chat thread prompt, unsubscribe page, email (Claude Design export, 2026-11-07)
const Stripe = ({ s = 64, r = 12, label }) => <span aria-hidden="true" style={{ width: s, height: s, borderRadius: r, flex: 'none', display: 'grid', placeItems: 'center', background: 'repeating-linear-gradient(135deg,#F1EEE7 0 6px,#E8E4DA 6px 12px)', fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 10, color: NT.sec }}>{label}</span>;

// ---------- chat ----------
function NChatHead() {
  return <div style={{ height: 60, flex: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 0 4px', background: '#fff', borderBottom: `1px solid ${NT.border}` }}>
    <button className="ibtn ghost" aria-label="Back"><Pi n="arrow-left" s={17} /></button>
    <img src={AV} alt="" style={{ width: 40, height: 40, borderRadius: 999, objectFit: 'cover' }} />
    <div style={{ minWidth: 0 }}><div style={{ fontSize: 16, fontWeight: 600, lineHeight: '22px' }}>Anna Sargsyan</div><div style={{ fontSize: 14, lineHeight: '20px', color: NT.sec }}>Owner of this toy</div></div>
  </div>;
}
const NToyStrip = () => <div style={{ margin: '12px 12px 0', flex: 'none', background: '#fff', border: `1px solid ${NT.border}`, borderRadius: 16, padding: 10, display: 'flex', gap: 12, alignItems: 'center' }}><Stripe s={44} r={10} /><div style={{ minWidth: 0 }}><div style={{ fontSize: 15, fontWeight: 600, lineHeight: '20px' }}>Baby stroller</div><div style={{ fontSize: 13, lineHeight: '18px', color: NT.sec }}>12–15 Nov · Request sent</div></div></div>;
const NMsg = ({ t, time }) => <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}><div style={{ maxWidth: '78%', padding: '9px 14px', borderRadius: '18px 18px 6px 18px', background: '#FFF2E9', border: '1px solid #F6D5BF', fontSize: 16, lineHeight: '22px' }}>{t}</div><div style={{ fontSize: 12, color: NT.sec, padding: '2px 4px 0', display: 'flex', gap: 4, alignItems: 'center' }}>{time}<Pi n="check" s={10} /></div></div>;
function NPrompt() {
  return <section aria-labelledby="np-t" style={{ marginTop: 14, background: '#fff', border: `1px solid ${NT.border}`, borderRadius: 16, padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
    <Tile i="bell" s={36} r={10} is={16} c={NT.strong} bg={NT.soft} />
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p id="np-t" style={{ margin: 0, fontSize: 15, lineHeight: '21px', textWrap: 'pretty' }}><b style={{ fontWeight: 600 }}>Want to know when they reply?</b> <span style={{ color: NT.sec }}>Turn on notifications for this device.</span></p>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}><button className="btn-p sm" style={{ minHeight: 44 }}>Turn on</button><button className="btn-q">Not now</button></div>
    </div>
  </section>;
}
function NComposer({ typing }) {
  return <div style={{ flex: 'none', padding: '10px 12px', background: '#fff', borderTop: `1px solid ${NT.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
    <button aria-label="Attach photo" style={{ width: 44, height: 44, borderRadius: 999, background: NT.bg, border: `1px solid ${NT.border}`, display: 'grid', placeItems: 'center', color: NT.sec, flex: 'none' }}><Pi n="image" s={18} /></button>
    <div style={{ flex: 1, height: 44, borderRadius: 999, border: `1.5px solid ${typing ? NT.strong : NT.border}`, background: NT.bg, display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: 16, color: NT.sec }}>{typing && <span className="caret" style={{ marginRight: 2 }}></span>}Message Anna…</div>
    <button aria-label="Send" style={{ width: 44, height: 44, borderRadius: 999, background: NT.brand, border: 0, display: 'grid', placeItems: 'center', flex: 'none' }}><Pi n="send" s={18} c="#fff" /></button>
  </div>;
}
function NChat({ prompt, kb }) {
  return <MFrame fixed><div style={{ height: 'calc(100% - 44px)', display: 'flex', flexDirection: 'column', background: NT.bg }}>
    <NChatHead /><NToyStrip />
    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '8px 16px 12px' }}>
      <div style={{ textAlign: 'center', fontSize: 14, lineHeight: '20px', color: NT.sec, fontWeight: 600, margin: '0 0 8px' }}>Today</div>
      <NMsg t="Hi Anna! Is the stroller free from 12 to 15 November?" time="10:42" />
      {prompt && <NPrompt />}
    </div>
    <NComposer typing={kb} />
    {kb ? <div style={{ position: 'relative', height: 291, flex: 'none' }}><Keyboard /></div> : <div style={{ height: 22, background: '#fff', display: 'grid', placeItems: 'center', flex: 'none' }}><i style={{ width: 134, height: 5, borderRadius: 9, background: NT.text, display: 'block' }}></i></div>}
  </div></MFrame>;
}
function NativeNote() {
  return <div className="ai" style={{ width: 390, background: '#fff', border: `1px solid ${NT.border}`, borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
    <div style={{ border: '1.5px dashed #B5B2A9', borderRadius: 12, padding: 16, minHeight: 120, display: 'grid', placeItems: 'center', textAlign: 'center', fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 12, lineHeight: '18px', color: NT.sec, background: 'repeating-linear-gradient(135deg,#FAF8F4 0 8px,#F4F1EA 8px 16px)' }}>browser’s own permission dialog<br />drawn by the browser, not by DoRent</div>
    <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, lineHeight: '20px', color: '#3B3C48', textWrap: 'pretty' }}>
      <li>Requested right after the first message is sent, from the Send tap.</li>
      <li>Its position, wording and language come from the browser. DoRent can’t explain why it asks.</li>
      <li>If the person dismisses or blocks it, Settings shows the matching Row B state.</li>
    </ul>
  </div>;
}

// ---------- unsubscribe ----------
const PubHead = ({ desk }) => <header style={{ height: desk ? 64 : 52, background: '#fff', borderBottom: `1px solid ${NT.border}`, display: 'flex', alignItems: 'center', padding: desk ? '0 40px' : '0 16px' }}><span className="wm" style={{ fontSize: desk ? 30 : 26 }}>DoRent</span></header>;
const UNS = {
  done: ['check-circle', NT.ok, NT.okSurf, 'You are unsubscribed from message emails.', 'Turn emails back on in Settings'],
  invalid: ['link', NT.sec, NT.muted, 'This link no longer works.', 'Go to Settings'],
  already: ['info-circle', NT.info, NT.iSurf, 'Message emails are already off.', 'Go to Settings'],
};
function UnsubCard({ st = 'confirm', desk }) {
  const h1 = { margin: 0, fontSize: desk ? 26 : 22, lineHeight: desk ? '34px' : '30px', fontWeight: 700, textWrap: 'balance' };
  const r = UNS[st];
  return <section style={{ width: '100%', maxWidth: 480, background: '#fff', border: `1px solid ${NT.border}`, borderRadius: 16, boxShadow: NT.shadow, padding: desk ? 32 : 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
    {r ? <>
      <Tile i={r[0]} s={44} r={14} is={20} c={r[1]} bg={r[2]} />
      <h1 role="status" style={h1}>{r[3]}</h1>
      <a href="#" className="lnk">{r[4]}<Pi n="arrow-right" s={13} /></a>
    </> : <>
      <Tile i="envelope" s={44} r={14} is={20} c={NT.strong} bg={NT.soft} />
      <h1 style={h1}>Stop emails about new messages?</h1>
      <p style={{ margin: 0, fontSize: 16, lineHeight: '24px', color: NT.sec, textWrap: 'pretty' }}>You will no longer get emails when someone writes to you in a chat. You can turn them back on any time in Settings.</p>
      {st === 'fail' && <Note tone="err" icon="exclamation-circle" style={{ fontSize: 14, lineHeight: '20px' }}>Something went wrong. Please try again.</Note>}
      <button className="btn-p" aria-disabled={st === 'loading' || undefined} style={{ width: desk ? 'auto' : '100%', alignSelf: desk ? 'flex-start' : 'stretch', minWidth: 200, marginTop: 4, cursor: st === 'loading' ? 'progress' : 'pointer' }}>{st === 'loading' ? <><i className="pi pi-spinner pi-spin" aria-hidden="true" style={{ fontSize: 16 }}></i>Unsubscribing…</> : 'Unsubscribe'}</button>
    </>}
  </section>;
}
const UnsubM = ({ st }) => <MFrame h={640}><PubHead /><main style={{ padding: '32px 16px 40px', display: 'flex', justifyContent: 'center' }}><UnsubCard st={st} /></main></MFrame>;
const UnsubD = ({ st }) => <DFrame h={640}><PubHead desk /><main style={{ padding: '80px 40px', display: 'flex', justifyContent: 'center' }}><UnsubCard st={st} desk /></main></DFrame>;

// ---------- email ----------
const EM = {
  en: { h: (n, t) => `${n} wrote to you about ${t}`, cta: 'Open chat', why: 'You are getting this because you have a conversation on DoRent and the message has been unread for a while.', u: 'Unsubscribe from message emails', m: 'Manage in Settings' },
  ru: { h: (n, t) => `${n} написала вам об игрушке «${t}»`, cta: 'Открыть чат', why: 'Вы получили это письмо, потому что у вас есть переписка на DoRent и сообщение какое-то время остаётся непрочитанным.', u: 'Отписаться от писем о сообщениях', m: 'Настроить в DoRent' },
  hy: { h: (n, t) => `${n}ն ձեզ գրել է «${t}» խաղալիքի մասին`, cta: 'Բացել զրույցը', why: 'Դուք ստանում եք այս նամակը, քանի որ DoRent-ում զրույց ունեք, և հաղորդագրությունը որոշ ժամանակ չի կարդացվել։', u: 'Չստանալ նամակներ հաղորդագրությունների մասին', m: 'Կառավարել Կարգավորումներում' },
};
function NEmail({ lang = 'en', name = 'Anna', toy = 'Baby stroller', w = 600 }) {
  const t = EM[lang], m = w < 600;
  const px = m ? 20 : 32;
  return <div className="ai" style={{ width: w + (m ? 0 : 48), background: '#F2EFE8', padding: m ? 0 : 24, borderRadius: m ? 0 : 12 }}>
    <div style={{ width: w, background: '#fff', borderRadius: m ? 0 : 16, border: m ? 0 : `1px solid ${NT.border}`, overflow: 'hidden' }}>
      <div style={{ padding: `20px ${px}px`, borderBottom: `1px solid ${NT.border}` }}><span className="wm" style={{ fontSize: 28 }}>DoRent</span></div>
      <div style={{ padding: `${m ? 24 : 32}px ${px}px`, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h1 style={{ margin: 0, fontSize: m ? 22 : 24, lineHeight: m ? '30px' : '32px', fontWeight: 700, color: NT.text, textWrap: 'pretty' }}>{t.h(name, toy)}</h1>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: 12, border: `1px solid ${NT.border}`, borderRadius: 14 }}><Stripe s={64} r={12} label="toy" /><span style={{ fontSize: 16, lineHeight: '22px', fontWeight: 600, textWrap: 'pretty' }}>{toy}</span></div>
        <a href="#" style={{ display: m ? 'flex' : 'inline-flex', alignSelf: m ? 'stretch' : 'flex-start', justifyContent: 'center', alignItems: 'center', minHeight: 48, padding: '12px 32px', borderRadius: 999, background: '#C24600', color: '#fff', fontSize: 16, fontWeight: 600, lineHeight: '24px' }}>{t.cta}</a>
      </div>
      <div style={{ padding: `20px ${px}px 24px`, borderTop: `1px solid ${NT.border}`, background: NT.bg, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, lineHeight: '19px', color: NT.sec }}>
        <p style={{ margin: 0, textWrap: 'pretty' }}>{t.why}</p>
        <p style={{ margin: 0, display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}><a href="#" style={{ color: NT.sec, textDecoration: 'underline', textUnderlineOffset: 2 }}>{t.u}</a><a href="#" style={{ color: NT.sec, textDecoration: 'underline', textUnderlineOffset: 2 }}>{t.m}</a></p>
      </div>
    </div>
  </div>;
}

Object.assign(window, { NChat, NativeNote, UnsubM, UnsubD, NEmail });
