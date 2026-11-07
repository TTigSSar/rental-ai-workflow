// nt-parts.jsx — Message notifications stage 1: settings rows (Claude Design export, 2026-11-07)
// NT extends the shared token object DA (not exported): text #1A1B26, sec #6B6A75, hint #6F6E7D, border #E8E5DE,
// bg #FAF8F4, muted #F4F4F8, strong #C24600, soft #FFF1E8, ok #0D7D56, okSurf #EDF9F1, danger #CC2D25, err #D43F5E, eSurf #FFF1F3.
const NT = { ...DA, warn: '#8A5C00', wSurf: '#FFF4D6', wBd: '#F2DFA6', info: '#3D52CC', iSurf: '#EAEDFF', okBd: 'rgba(13,125,86,.28)' };
const NS = {
  en: { t: 'Settings', pw: 'Password', lang: 'Language', langV: 'English', del: 'Delete account', sec: 'Notifications',
    aL: 'Email about new messages', aH: 'We email you when a message stays unread for 15 minutes. No emails between 22:00 and 09:00 (Yerevan time).',
    bL: 'Browser notifications', bH: 'Get a notification on this device while DoRent is open in another tab.',
    enable: 'Enable', on: 'On', offHint: 'Turn off in browser settings',
    blocked: 'Notifications are blocked in your browser. To turn them on, open the site settings (the lock icon next to the address) and allow notifications.',
    nosup: 'This browser does not support notifications.', saved: 'Saved', failed: 'Couldn’t save. Please try again.' },
  ru: { t: 'Настройки', pw: 'Пароль', lang: 'Язык', langV: 'Русский', del: 'Удалить аккаунт', sec: 'Уведомления',
    aL: 'Письма о новых сообщениях', aH: 'Мы пришлём письмо, если сообщение остаётся непрочитанным 15 минут. Без писем с 22:00 до 09:00 (по ереванскому времени).',
    bL: 'Уведомления в браузере', bH: 'Уведомление на этом устройстве, пока DoRent открыт в другой вкладке.',
    enable: 'Включить', on: 'Вкл.', offHint: 'Отключить можно в настройках браузера',
    blocked: 'Уведомления заблокированы в браузере. Чтобы включить их, откройте настройки сайта (значок замка рядом с адресом) и разрешите уведомления.',
    nosup: 'Этот браузер не поддерживает уведомления.', saved: 'Сохранено', failed: 'Не удалось сохранить. Попробуйте ещё раз.' },
};

const NCard = ({ children, style }) => <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${NT.border}`, boxShadow: NT.shadow, overflow: 'hidden', ...style }}>{children}</div>;
const NSw = ({ on, label, focus }) => <button role="switch" aria-checked={!!on} aria-label={label} className={'sw' + (on ? ' on' : '') + (focus ? ' fv' : '')}><span className="sw-track"><span className="sw-knob"></span></span></button>;

// simple nav row (existing look)
const NNav = ({ i, l, val, danger }) => <button className="srow" role="listitem">
  <Tile i={i} s={34} r={10} c={danger ? NT.danger : NT.text} bg={danger ? NT.dSurf : NT.muted} />
  <span style={{ flex: '1 1 auto', minWidth: 0, fontSize: 15, fontWeight: danger ? 700 : 600, lineHeight: '20px', color: danger ? NT.danger : NT.text }}>{l}</span>
  {val && <span className="val">{val}</span>}<Pi n="chevron-right" s={13} c={danger ? NT.danger : NT.sec} /></button>;

// setting row with hint + control on the right / content below hint
function NRow({ i, l, hint, off, right, below, top, id }) {
  return <div className="nrow" role="listitem" aria-disabled={off || undefined} style={top ? { borderTop: `1px solid ${NT.border}` } : undefined}>
    <Tile i={i} s={34} r={10} c={off ? NT.hint : NT.text} bg={NT.muted} />
    <div style={{ flex: '1 1 auto', minWidth: 0, paddingTop: 7, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span id={id} style={{ fontSize: 15, fontWeight: 600, lineHeight: '20px', color: off ? NT.hint : NT.text, textWrap: 'pretty' }}>{l}</span>
      {hint && <span style={{ fontSize: 13, lineHeight: '18px', color: NT.sec, textWrap: 'pretty' }}>{hint}</span>}
      {below}
    </div>
    {right && <div style={{ flex: 'none' }}>{right}</div>}
  </div>;
}

const SaveHint = ({ st, lang = 'en' }) => st === 'ok'
  ? <span role="status" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 13, lineHeight: '18px', fontWeight: 600, color: NT.ok }}><Pi n="check" s={12} />{NS[lang].saved}</span>
  : <span role="alert" style={{ display: 'inline-flex', gap: 6, alignItems: 'flex-start', fontSize: 13, lineHeight: '18px', fontWeight: 600, color: NT.danger }}><Pi n="exclamation-circle" s={12} style={{ marginTop: 3 }} />{NS[lang].failed}</span>;

const Note = ({ tone = 'warn', icon = 'exclamation-triangle', children, style }) => {
  const c = { warn: [NT.wSurf, NT.wBd, NT.warn], ok: [NT.okSurf, NT.okBd, NT.ok], info: [NT.iSurf, '#CDD3FA', NT.info], err: [NT.eSurf, NT.eBd, NT.err] }[tone];
  return <div role={tone === 'err' ? 'alert' : 'status'} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: c[0], border: `1px solid ${c[1]}`, borderRadius: 14, padding: '10px 12px', fontSize: 13, lineHeight: '19px', color: NT.text, textWrap: 'pretty', ...style }}><Pi n={icon} s={14} c={c[2]} style={{ marginTop: 3 }} /><span>{children}</span></div>;
};

// Row A
const RowA = ({ lang = 'en', on = true, save, k = '' }) => { const t = NS[lang]; return <NRow id={'ra' + k + lang} i="envelope" l={t.aL} hint={t.aH} right={<NSw on={on} label={t.aL} />} below={save && <SaveHint st={save} lang={lang} />} />; };
// Row B: st = ask | on | blocked | nosup
function RowB({ lang = 'en', st = 'ask' }) {
  const t = NS[lang];
  if (st === 'nosup') return <NRow top off i="desktop" l={t.bL} hint={t.nosup} />;
  const right = st === 'ask' ? <button className="btn-s" style={{ marginTop: -5 }}>{t.enable}</button>
    : st === 'on' ? <span className="pill-ok"><Pi n="check" s={11} />{t.on}</span> : null;
  const below = st === 'on' ? <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 13, lineHeight: '18px', color: NT.sec }}><Pi n="cog" s={12} />{t.offHint}</span>
    : st === 'blocked' ? <Note style={{ marginTop: 6 }}>{t.blocked}</Note> : null;
  return <NRow top i="desktop" l={t.bL} hint={t.bH} right={right} below={below} />;
}
const NSecHead = ({ lang = 'en', id }) => <div style={{ padding: '16px 16px 2px', borderTop: `1px solid ${NT.border}` }}><h2 id={id} style={{ margin: 0, fontSize: 13, lineHeight: '18px', fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: NT.sec }}>{NS[lang].sec}</h2></div>;

// notifications section only (for strips)
const NSection = ({ lang = 'en', b = 'ask', aOn = true, save, bare }) => { const l = <div role="list" aria-label={NS[lang].sec}><RowA lang={lang} on={aOn} save={save} k={b} /><RowB lang={lang} st={b} /></div>; return bare ? l : <NCard>{l}</NCard>; };

// full settings list
function NSettingsList({ lang = 'en', b = 'ask' }) {
  const t = NS[lang];
  return <div style={{ display: 'flex', flexDirection: 'column' }}>
    <NCard><div role="list">
      <NNav i="lock" l={t.pw} />
      <NNav i="globe" l={t.lang} val={t.langV} />
      <NNav i="bell" l={t.sec} />
    </div></NCard>
    <div role="separator" style={{ height: 1, background: NT.border, margin: '24px 4px 20px' }}></div>
    <NCard style={{ boxShadow: 'none' }}><div role="list"><NNav i="trash" l={t.del} danger /></div></NCard>
  </div>;
}
const NBack = ({ title }) => <div style={{ height: 52, display: 'flex', alignItems: 'center', gap: 4, padding: '0 16px 0 4px', borderBottom: `1px solid ${NT.border}`, background: '#fff' }}><button className="ibtn ghost" aria-label="Back"><Pi n="arrow-left" s={17} /></button><span style={{ fontSize: 18, fontWeight: 700 }}>{title}</span></div>;
const NMSettings = ({ lang = 'en', b }) => <MFrame><NBack title={NS[lang].t} /><div style={{ padding: '16px 16px 28px' }}><NSettingsList lang={lang} b={b} /></div></MFrame>;
const NDSettings = ({ b, overlay }) => <DFrame h={860}><DNav lang="en" /><div style={{ maxWidth: 1120, margin: '0 auto', padding: '32px 40px', display: 'grid', gridTemplateColumns: '300px minmax(0,1fr)', gap: 28, alignItems: 'start' }}><DSidebar on="Settings" /><main style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 640 }}><h1 style={{ margin: 0, fontSize: 28, lineHeight: '36px', fontWeight: 800 }}>Settings</h1><NSettingsList b={b} /></main></div>{overlay}</DFrame>;

function NSheet({ title, children }) {
  return <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,27,38,.5)' }}>
    <div role="dialog" aria-modal="true" aria-labelledby="nsh" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: 'calc(100% - 56px)', overflow: 'hidden', background: '#fff', borderRadius: '20px 20px 0 0', boxShadow: '0 -12px 40px -12px rgba(20,15,5,.25)', padding: '8px 16px 34px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'grid', placeItems: 'center' }}><span style={{ width: 36, height: 4, borderRadius: 999, background: NT.inputBd }}></span></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 0 4px 4px' }}><h2 id="nsh" style={{ flex: 1, margin: 0, fontSize: 20, lineHeight: '28px', fontWeight: 700 }}>{title}</h2><button className="ibtn ghost" aria-label="Close" style={{ marginRight: -6 }}><Pi n="times" s={15} /></button></div>
      {children}
    </div>
  </div>;
}
const NMNotif = ({ lang = 'en', b }) => <MFrame fixed overlay={<NSheet title={NS[lang].sec}><NSection lang={lang} b={b} /></NSheet>}><NBack title={NS[lang].t} /><div style={{ padding: '16px 16px 28px' }}><NSettingsList lang={lang} b={b} /></div></MFrame>;
const NDNotif = ({ b }) => <NDSettings b={b} overlay={<Dlg w={560} title={NS.en.sec} foot={null}><NSection b={b} /></Dlg>} />;
Object.assign(window, { NMNotif, NDNotif, NT, NS, NCard, NSw, NRow, RowA, RowB, NSection, NSettingsList, NMSettings, NDSettings, Note, SaveHint });
