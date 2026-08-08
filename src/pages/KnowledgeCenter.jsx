import { useState } from 'react';

const TECH_NEWS = [
  { title:"OpenAI releases GPT-5 with reasoning breakthrough", tag:"AI", time:"2h ago", emoji:"🤖",
    body:"The latest model achieves human-level performance on complex reasoning tasks, beating previous records across benchmarks." },
  { title:"Apple Vision Pro 2 unveiled with neural interface", tag:"Tech", time:"5h ago", emoji:"🍎",
    body:"Apple's spatial computing platform gets a major upgrade with brain-computer interface capabilities and 8K per-eye display." },
  { title:"Quantum computing hits 1000-qubit milestone", tag:"Science", time:"1d ago", emoji:"⚛️",
    body:"Google's Willow processor demonstrates error correction at scale, bringing practical quantum advantage closer." },
  { title:"Tesla FSD v13 achieves zero-intervention drives", tag:"EV", time:"2d ago", emoji:"🚗",
    body:"Tesla's Full Self-Driving software records 10,000+ mile trips without human intervention in urban environments." },
  { title:"React 20 released with concurrent server components", tag:"Dev", time:"3d ago", emoji:"⚛️",
    body:"The popular JavaScript library ships major performance improvements and a simplified mental model for data fetching." },
];

const STOCKS = [
  { name:"NIFTY 50", value:"24,357", change:"+0.82%", up:true },
  { name:"SENSEX",   value:"80,123", change:"+0.74%", up:true },
  { name:"RELIANCE", value:"₹2,890", change:"-0.31%", up:false },
  { name:"TCS",      value:"₹4,120", change:"+1.23%", up:true },
  { name:"INFOSYS",  value:"₹1,890", change:"+0.56%", up:true },
  { name:"HDFC BANK",value:"₹1,654", change:"-0.12%", up:false },
];

const ENGLISH_WORDS = [
  { word:"Perspicacious", type:"adjective", def:"Having a ready insight; shrewd", example:"She was perspicacious enough to see through his scheme.", level:"Advanced" },
  { word:"Ephemeral",     type:"adjective", def:"Lasting for a very short time", example:"Social media fame is often ephemeral.", level:"Intermediate" },
  { word:"Sanguine",      type:"adjective", def:"Optimistic, especially in difficult situations", example:"He remained sanguine despite the setbacks.", level:"Advanced" },
  { word:"Alacrity",      type:"noun", def:"Brisk and cheerful readiness", example:"She accepted the challenge with alacrity.", level:"Advanced" },
  { word:"Loquacious",    type:"adjective", def:"Tending to talk a great deal", example:"The loquacious professor never finished on time.", level:"Intermediate" },
];

const GERMAN_LESSONS = [
  {
    title: "Essential Greetings",
    words: [
      { de:"Guten Morgen", en:"Good Morning" },
      { de:"Guten Tag",    en:"Good Day" },
      { de:"Guten Abend",  en:"Good Evening" },
      { de:"Danke schön",  en:"Thank you very much" },
      { de:"Bitte",        en:"Please / You're welcome" },
    ],
    phrase: "Wie geht es Ihnen?",
    phraseEn: "How are you? (formal)",
  },
  {
    title: "Numbers 1–10",
    words: [
      { de:"Eins",  en:"One" },
      { de:"Zwei",  en:"Two" },
      { de:"Drei",  en:"Three" },
      { de:"Vier",  en:"Four" },
      { de:"Fünf",  en:"Five" },
    ],
    phrase: "Ich spreche ein bisschen Deutsch.",
    phraseEn: "I speak a little German.",
  },
];

export default function KnowledgeCenter() {
  const [activeTab, setActiveTab] = useState('tech');
  const [wordIdx, setWordIdx] = useState(new Date().getDate() % ENGLISH_WORDS.length);
  const [germanIdx, setGermanIdx] = useState(0);
  const [flipped, setFlipped] = useState({});

  const today = new Date();
  const todayLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const dailyUpdate = [
    {
      title: 'Momentum Builder',
      subtitle: 'Study one new concept and one new word today.',
      tip: 'Small consistent learning beats random cramming.',
    },
    {
      title: 'Focus Sprint',
      subtitle: 'Spend 20 focused minutes on tech, stocks, or language.',
      tip: 'Deep work is strongest when the environment is distraction-free.',
    },
    {
      title: 'Growth Loop',
      subtitle: 'Review yesterday’s notes and add one fresh insight.',
      tip: 'Reflection turns information into durable knowledge.',
    },
  ][today.getDate() % 3];

  const toggleFlip = (i) => setFlipped(p => ({ ...p, [i]: !p[i] }));

  return (
    <div className="page-container">
      <div className="anim-fade-up" style={{ marginBottom:'var(--sp-md)' }}>
        <p className="label-sm" style={{ color:'var(--gold)', marginBottom:6 }}>DAILY LEARNING</p>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:700 }}>Knowledge Center</h1>
      </div>

      <div className="glass-card anim-fade-up" style={{ padding:'18px 20px', marginBottom:'var(--sp-md)', animationDelay:'0.08s' }}>
        <p className="label-sm" style={{ color:'var(--gold)', marginBottom:6 }}>TODAY'S UPDATE</p>
        <p style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:700, marginBottom:4 }}>{todayLabel}</p>
        <p style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)', marginBottom:6 }}>{dailyUpdate.title}</p>
        <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6 }}>{dailyUpdate.subtitle}</p>
        <p style={{ fontSize:12, color:'var(--gold)', marginTop:8 }}>💡 {dailyUpdate.tip}</p>
      </div>

      <div className="tab-bar anim-fade-up" style={{ animationDelay:'0.1s' }}>
        {[
          { key:'tech',    label:'💻 Tech' },
          { key:'stocks',  label:'📈 Stocks' },
          { key:'english', label:'🇬🇧 English' },
          { key:'german',  label:'🇩🇪 German' },
        ].map(t => (
          <button key={t.key} className={`tab-btn ${activeTab===t.key?'active':''}`} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tech News */}
      {activeTab === 'tech' && (
        <div className="stagger" style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {TECH_NEWS.map((n, i) => (
            <div key={i} className="knowledge-card anim-fade-up" style={{ animationDelay:`${i*0.07}s` }}>
              <div style={{ padding:'16px 18px 14px' }}>
                <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                  <span style={{ fontSize:28, flexShrink:0 }}>{n.emoji}</span>
                  <div>
                    <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:6 }}>
                      <span className="chip chip-blue">{n.tag}</span>
                      <span className="label-sm">{n.time}</span>
                    </div>
                    <p style={{ fontWeight:600, fontSize:15, lineHeight:1.4, marginBottom:6 }}>{n.title}</p>
                    <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6 }}>{n.body}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stocks */}
      {activeTab === 'stocks' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div className="glass-card anim-fade-up" style={{ padding:20, marginBottom:4 }}>
            <p className="label-sm" style={{ marginBottom:4 }}>📊 Market Overview</p>
            <p style={{ fontSize:13, color:'var(--text-muted)' }}>
              Markets are trading cautiously as global inflation concerns persist. IT sector showing strength.
            </p>
          </div>
          {STOCKS.map((s, i) => (
            <div key={i} className="surface-card anim-fade-up" style={{
              display:'flex', justifyContent:'space-between', alignItems:'center',
              animationDelay:`${0.1+i*0.06}s`
            }}>
              <div>
                <p style={{ fontWeight:700, fontSize:15 }}>{s.name}</p>
                <p className="label-sm">NSE / BSE</p>
              </div>
              <div style={{ textAlign:'right' }}>
                <p style={{ fontFamily:'var(--font-label)', fontWeight:700, fontSize:16 }}>{s.value}</p>
                <span className={`chip ${s.up ? 'chip-green' : 'chip-red'}`}>
                  {s.up ? '▲' : '▼'} {s.change}
                </span>
              </div>
            </div>
          ))}
          <div className="surface-card" style={{ marginTop:4 }}>
            <p className="label-sm" style={{ marginBottom:10 }}>💡 Today's Insight</p>
            <p style={{ fontSize:14, color:'var(--text-secondary)', lineHeight:1.7 }}>
              <strong style={{ color:'var(--text-primary)' }}>SIP Strategy:</strong> Consistent monthly investments in index funds outperform 85% of active fund managers over 10 years. 
              Stick to your plan; don't try to time the market.
            </p>
          </div>
        </div>
      )}

      {/* English */}
      {activeTab === 'english' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Word of the day */}
          <div className="glass-card anim-fade-up" style={{ padding:24 }}>
            <p className="label-sm" style={{ color:'var(--gold)', marginBottom:14 }}>✦ Word of the Day</p>
            <p style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:700, marginBottom:4 }}>
              {ENGLISH_WORDS[wordIdx].word}
            </p>
            <div style={{ display:'flex', gap:8, marginBottom:14 }}>
              <span className="chip chip-blue">{ENGLISH_WORDS[wordIdx].type}</span>
              <span className="chip chip-gold">{ENGLISH_WORDS[wordIdx].level}</span>
            </div>
            <p style={{ fontSize:15, color:'var(--text-secondary)', marginBottom:10 }}>
              {ENGLISH_WORDS[wordIdx].def}
            </p>
            <div style={{ background:'var(--bg-surface-mid)', borderRadius:'var(--r-md)', padding:'12px 16px',
              borderLeft:'3px solid var(--gold)' }}>
              <p className="label-sm" style={{ marginBottom:4 }}>Example</p>
              <p style={{ fontSize:14, fontStyle:'italic', color:'var(--text-secondary)' }}>
                "{ENGLISH_WORDS[wordIdx].example}"
              </p>
            </div>
          </div>

          {/* Vocabulary list */}
          <div>
            <p className="label-sm" style={{ marginBottom:12 }}>📚 Vocabulary Bank</p>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {ENGLISH_WORDS.map((w, i) => (
                <div key={i} className="surface-card" style={{ cursor:'pointer', transition:'all 0.2s' }}
                  onClick={() => setWordIdx(i)}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <p style={{ fontWeight:600, fontSize:14, color: i===wordIdx ? 'var(--gold)' : 'var(--text-primary)' }}>
                        {w.word}
                      </p>
                      <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{w.def}</p>
                    </div>
                    <span className="chip chip-blue">{w.level}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* German */}
      {activeTab === 'german' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'flex', gap:8, marginBottom:4 }}>
            {GERMAN_LESSONS.map((l, i) => (
              <button key={i} className={`tab-btn ${germanIdx===i?'active':''}`} onClick={() => setGermanIdx(i)}>
                Lesson {i+1}
              </button>
            ))}
          </div>

          <div className="glass-card anim-fade-up" style={{ padding:22 }}>
            <p className="label-sm" style={{ color:'var(--gold)', marginBottom:10 }}>🇩🇪 {GERMAN_LESSONS[germanIdx].title}</p>
            <div style={{ background:'var(--bg-surface-mid)', borderRadius:'var(--r-lg)', padding:16, marginBottom:16,
              borderLeft:'3px solid var(--gold)' }}>
              <p style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:600, marginBottom:4 }}>
                {GERMAN_LESSONS[germanIdx].phrase}
              </p>
              <p style={{ color:'var(--text-muted)', fontSize:14 }}>{GERMAN_LESSONS[germanIdx].phraseEn}</p>
            </div>
          </div>

          <div>
            <p className="label-sm" style={{ marginBottom:12 }}>Flash Cards — tap to flip</p>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {GERMAN_LESSONS[germanIdx].words.map((w, i) => (
                <div key={i} onClick={() => toggleFlip(i)}
                  style={{
                    background: flipped[i] ? 'rgba(212,175,55,0.12)' : 'var(--bg-surface-low)',
                    border: `1px solid ${flipped[i] ? 'var(--border-gold)' : 'var(--border-light)'}`,
                    borderRadius:'var(--r-lg)', padding:'16px 20px',
                    cursor:'pointer', transition:'all 0.25s',
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                  }}
                >
                  <p style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:600,
                    color: flipped[i] ? 'var(--gold)' : 'var(--text-primary)' }}>
                    {flipped[i] ? w.en : w.de}
                  </p>
                  <span className="label-sm">{flipped[i] ? 'EN' : 'DE'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
