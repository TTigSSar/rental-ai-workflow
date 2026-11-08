// pl-parts.jsx — Password & Language sheets, stage 2 (reuses NT/NCard/Dlg/Keyboard/MFrame/DFrame)
const PL = {
  en: { t: 'Settings', pw: 'Password', lang: 'Language', langV: 'English', sec: 'Notifications', del: 'Delete account', back: 'Back', pwG: 'You sign in with Google',
    cur: 'Current password', curP: 'Enter your current password', nw: 'New password', nwP: 'Enter your new password', cf: 'Confirm new password', cfP: 'Repeat your new password',
    cancel: 'Cancel', save: 'Save', saving: 'Saving', show: 'Show password', close: 'Close', ok: 'Password updated',
    req: 'Current password is required.', short: 'New password must be at least 8 characters.', match: 'Passwords do not match.',
    long: 'New password is too long. Use up to 72 Latin characters, or fewer if you use Armenian or Russian letters.',
    wrong: 'Current password is incorrect.', same: 'New password must be different from your current one.', rate: 'Too many attempts, try again in a minute.' },
  hy: { t: 'Կարգավորումներ', pw: 'Գաղտնաբառ', lang: 'Լեզու', langV: 'Հայերեն', sec: 'Ծանուցումներ', del: 'Ջնջել հաշիվը', back: 'Հետ', pwG: 'Դուք մուտք եք գործում Google-ով',
    cur: 'Ընթացիկ գաղտնաբառ', curP: 'Մուտքագրեք ձեր ընթացիկ գաղտնաբառը', nw: 'Նոր գաղտնաբառ', nwP: 'Մուտքագրեք ձեր նոր գաղտնաբառը', cf: 'Հաստատեք նոր գաղտնաբառը', cfP: 'Կրկին մուտքագրեք նոր գաղտնաբառը',
    cancel: 'Չեղարկել', save: 'Պահպանել', saving: 'Պահպանվում է', show: 'Ցույց տալ գաղտնաբառը', close: 'Փակել',
    req: 'Ընթացիկ գաղտնաբառը պարտադիր է։', short: 'Նոր գաղտնաբառը պետք է պարունակի առնվազն 8 նիշ։', match: 'Գաղտնաբառերը չեն համընկնում։' },
};
const PW = '••••••••••';

// settings rows (same look as NNav / SRow)
const PNav = ({ i, l, val, danger, open }) => <button className="srow" role="listitem" aria-haspopup="dialog" aria-expanded={open || undefined}>
  <Tile i={i} s={34} r={10} c={danger ? NT.danger : NT.text} bg={danger ? NT.dSurf : NT.muted} />
  <span style={{ flex: '1 1 auto', minWidth: 0, fontSize: 15, fontWeight: danger ? 700 : 600, lineHeight: '20px', color: danger ? NT.danger : NT.text }}>{l}</span>
  {val && <span className="val">{val}</span>}<Pi n="chevron-right" s={13} c={danger ? NT.danger : NT.sec} /></button>;
const POff = ({ i, l, hint }) => <div className="srow" role="listitem" aria-disabled="true">
  <Tile i={i} s={34} r={10} c={NT.hint} bg={NT.muted} />
  <span style={{ flex: '1 1 auto', minWidth: 0 }}><span style={{ display: 'block', fontSize: 15, fontWeight: 600, lineHeight: '20px', color: NT.hint }}>{l}</span><span style={{ display: 'block', fontSize: 13, lineHeight: '18px', color: NT.sec, textWrap: 'pretty' }}>{hint}</span></span></div>;
function PList({ lang = 'en', google }) {
  const t = PL[lang];
  return <div style={{ display: 'flex', flexDirection: 'column' }}>
    <NCard><div role="list">
      {google ? <POff i="lock" l={t.pw} hint={t.pwG} /> : <PNav i="lock" l={t.pw} />}
      <PNav i="globe" l={t.lang} val={t.langV} />
      <PNav i="bell" l={t.sec} />
    </div></NCard>
    <div role="separator" style={{ height: 1, background: NT.border, margin: '24px 4px 20px' }}></div>
    <NCard style={{ boxShadow: 'none' }}><div role="list"><PNav i="trash" l={t.del} danger /></div></NCard>
  </div>;
}
const PBack = ({ lang = 'en' }) => <div style={{ height: 52, display: 'flex', alignItems: 'center', gap: 4, padding: '0 16px 0 4px', borderBottom: `1px solid ${NT.border}`, background: '#fff' }}><button className="ibtn ghost" aria-label={PL[lang].back}><Pi n="arrow-left" s={17} /></button><span style={{ fontSize: 18, fontWeight: 700 }}>{PL[lang].t}</span></div>;

// mobile + desktop page shells
const PM = ({ lang = 'en', google, overlay, h = 844 }) => <MFrame fixed h={h} overlay={overlay}><PBack lang={lang} /><div style={{ padding: '16px 16px 28px' }}><PList lang={lang} google={google} /></div></MFrame>;
const PD = ({ overlay, h = 780 }) => <DFrame h={h}><DNav lang="en" /><div style={{ maxWidth: 1120, margin: '0 auto', padding: '32px 40px', display: 'grid', gridTemplateColumns: '300px minmax(0,1fr)', gap: 28, alignItems: 'start' }}><DSidebar on="Settings" /><main style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 640 }}><h1 style={{ margin: 0, fontSize: 28, lineHeight: '36px', fontWeight: 800 }}>Settings</h1><PList /></main></div>{overlay}</DFrame>;

// mobile bottom sheet: same handle/header/backdrop as NSheet, plus pinned footer
let _pid = 0;
function PSheet({ title, lang = 'en', children, foot, kb }) {
  const id = 'psh' + (++_pid);
  return <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,27,38,.5)' }}>
    <div role="dialog" aria-modal="true" aria-labelledby={id} style={{ position: 'absolute', left: 0, right: 0, bottom: kb ? 291 : 0, maxHeight: kb ? 300 : 'calc(100% - 56px)', overflow: 'hidden', background: '#fff', borderRadius: '20px 20px 0 0', boxShadow: '0 -12px 40px -12px rgba(20,15,5,.25)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 'none', padding: '8px 16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'grid', placeItems: 'center' }}><span style={{ width: 36, height: 4, borderRadius: 999, background: NT.inputBd }}></span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 0 4px 4px' }}><h2 id={id} style={{ flex: 1, margin: 0, fontSize: 20, lineHeight: '28px', fontWeight: 700 }}>{title}</h2><button className="ibtn ghost" aria-label={PL[lang].close} style={{ marginRight: -6 }}><Pi n="times" s={15} /></button></div>
      </div>
      <div style={{ flex: '1 1 auto', minHeight: 0, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: kb ? 'flex-end' : 'flex-start' }}>
        <div style={{ padding: foot ? '8px 16px 16px' : '8px 16px 34px', display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
        {kb && <span aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 24, background: 'linear-gradient(#fff,rgba(255,255,255,0))' }}></span>}
      </div>
      {foot && <div style={{ flex: 'none', padding: kb ? '12px 16px' : '12px 16px 34px', borderTop: `1px solid ${NT.border}`, background: '#fff' }}>{foot}</div>}
    </div>
    {kb && <Keyboard />}
  </div>;
}

// password field (existing input + error line)
function PField({ id, l, ph, v, focus, err, dis, lang = 'en' }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <label htmlFor={id} style={{ fontSize: 14, lineHeight: '20px', fontWeight: 600, textWrap: 'pretty' }}>{l}</label>
    <div className={'inp' + (focus ? ' focus' : '') + (err ? ' err' : '') + (dis ? ' ro' : '')}>
      <span id={id} role="textbox" aria-invalid={err ? true : undefined} aria-describedby={err ? id + '-e' : undefined} aria-disabled={dis || undefined} style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: dis ? NT.sec : NT.text }}>
        {focus && !v && <span className="caret" style={{ marginLeft: 0, marginRight: 2 }}></span>}
        {v ? <span style={{ letterSpacing: 2 }}>{v}</span> : <span style={{ color: NT.hint }}>{ph}</span>}
        {focus && v && <span className="caret"></span>}
      </span>
      <button className="ibtn ghost" aria-label={PL[lang].show} aria-disabled={dis || undefined}><Pi n="eye" s={17} c={dis ? NT.hint : NT.sec} /></button>
    </div>
    {err && <span id={id + '-e'} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 14, lineHeight: '20px', color: NT.danger, fontWeight: 500, textWrap: 'pretty' }}><Pi n="exclamation-circle" s={14} style={{ marginTop: 3 }} /><span>{err}</span></span>}
  </div>;
}
// s: { cur, nw, cf: {v, err, focus}, dis, banner }
function PForm({ lang = 'en', s = {}, k = '' }) {
  const t = PL[lang], f = (n) => s[n] || {};
  return <>
    {s.banner && <div role="alert" className="pmsg"><Pi n="exclamation-circle" s={16} c={NT.err} style={{ marginTop: 2 }} /><span>{s.banner}</span></div>}
    <PField id={'cur' + k} lang={lang} l={t.cur} ph={t.curP} {...f('cur')} dis={s.dis} />
    <PField id={'nw' + k} lang={lang} l={t.nw} ph={t.nwP} {...f('nw')} dis={s.dis} />
    <PField id={'cf' + k} lang={lang} l={t.cf} ph={t.cfP} {...f('cf')} dis={s.dis} />
  </>;
}
function PFoot({ lang = 'en', busy, desk }) {
  const t = PL[lang];
  return <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap-reverse', justifyContent: desk ? 'flex-end' : 'stretch' }}>
    <button className="btn-c" aria-disabled={busy || undefined} style={desk ? { flex: '0 1 auto', minWidth: 140 } : undefined}>{t.cancel}</button>
    <button className="btn-p" aria-disabled={busy || undefined} aria-busy={busy || undefined} aria-label={busy ? t.saving : undefined} style={{ flex: desk ? '0 1 auto' : '1 1 140px', minWidth: desk ? 140 : undefined, position: 'relative', cursor: busy ? 'progress' : 'pointer' }}>
      <span style={{ visibility: busy ? 'hidden' : undefined }}>{t.save}</span>
      {busy && <i className="pi pi-spinner pi-spin" aria-hidden="true" style={{ position: 'absolute', left: 'calc(50% - 9px)', top: 'calc(50% - 9px)', fontSize: 18, lineHeight: '18px', width: 18, height: 18 }}></i>}
    </button>
  </div>;
}

// language options
const LANGS = [['hy', 'Հայերեն'], ['ru', 'Русский'], ['en', 'English']];
const LangList = ({ cur = 'en', focus }) => <NCard style={{ boxShadow: 'none' }}><div role="listbox" aria-label="Language">
  {LANGS.map(([c, n]) => { const on = c === cur; return <button key={c} role="option" aria-selected={on} lang={c} className="lopt" style={focus && on ? { outline: '2px solid #C24600', outlineOffset: -4, borderRadius: 14 } : undefined}>
    <span style={{ flex: 1, minWidth: 0, fontWeight: on ? 600 : 500 }}>{n}</span>{on && <Pi n="check" s={15} c={NT.strong} />}</button>; })}
</div></NCard>;

// toast (existing top-centre toast look, 44 px close)
const PToast = ({ desk }) => <div role="status" aria-live="polite" style={{ position: 'absolute', zIndex: 5, top: desk ? 80 : 52, left: desk ? 'calc(50% - 180px)' : 12, right: desk ? undefined : 12, width: desk ? 360 : undefined, display: 'flex', gap: 12, alignItems: 'center', padding: '6px 4px 6px 14px', borderRadius: 16, background: NT.okSurf, border: `1px solid ${NT.okBd}`, boxShadow: '0 16px 40px -14px rgba(20,15,5,.28)', fontSize: 15, lineHeight: '22px', fontWeight: 600, color: NT.text }}>
  <Pi n="check-circle" s={18} c={NT.ok} /><span style={{ flex: 1, minWidth: 0 }}>{PL.en.ok}</span>
  <button className="ibtn ghost" aria-label="Close"><Pi n="times" s={12} c={NT.sec} /></button></div>;

// composed frames
const PwM = ({ lang = 'en', s, busy, kb }) => <PM lang={lang} overlay={<PSheet title={PL[lang].pw} lang={lang} kb={kb} foot={<PFoot lang={lang} busy={busy} />}><PForm lang={lang} s={s} k={'m' + (++_pid)} /></PSheet>} />;
const PwD = ({ s, busy }) => <PD overlay={<Dlg w={560} title={PL.en.pw} foot={<PFoot busy={busy} desk />}><PForm s={s} k={'d' + (++_pid)} /></Dlg>} />;
const LangM = () => <PM overlay={<PSheet title={PL.en.lang}><LangList /></PSheet>} />;
const LangD = () => <PD h={640} overlay={<Dlg w={560} title={PL.en.lang} foot={null}><LangList focus /></Dlg>} />;

Object.assign(window, { PL, PW, PList, PM, PD, PSheet, PField, PForm, PFoot, LangList, PToast, PwM, PwD, LangM, LangD });
