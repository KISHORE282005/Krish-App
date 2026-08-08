import { useStore, ACHIEVEMENTS } from '../store/useStore';

export default function Achievements() {
  const { habitLogs } = useStore();

  // Compute streak
  let streak = 0;
  const checkDate = new Date();
  const { DEFAULT_HABITS } = useStore.getState();
  for (let i = 0; i < 365; i++) {
    const d = checkDate.toISOString().split('T')[0];
    const hl = habitLogs[d] || {};
    const done = Object.values(hl).filter(Boolean).length;
    if (done >= DEFAULT_HABITS.length * 0.5) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
    else break;
  }

  const isUnlocked = (ach) => {
    try { return ach.condition(streak); } catch { return false; }
  };

  const unlocked = ACHIEVEMENTS.filter(a => isUnlocked(a));
  const locked   = ACHIEVEMENTS.filter(a => !isUnlocked(a));

  const RARITY_LABELS = ['', '', '', '', 'Epic', 'Legendary', '', '', '', '', 'Mythic', '', 'Divine'];
  const getRarity = (id) => {
    const idx = ACHIEVEMENTS.findIndex(a => a.id === id);
    if (idx < 3) return 'Legendary';
    if (idx < 6) return 'Epic';
    return 'Rare';
  };
  const rarityColor = { Legendary:'var(--gold)', Epic:'#A855F7', Rare:'#63B3ED' };

  return (
    <div className="page-container">
      <div className="anim-fade-up" style={{ marginBottom:'var(--sp-md)' }}>
        <p className="label-sm" style={{ color:'var(--gold)', marginBottom:6 }}>YOUR TROPHIES</p>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:700 }}>Achievements</h1>
      </div>

      {/* Progress overview */}
      <div className="glass-card anim-fade-up" style={{ padding:22, marginBottom:'var(--sp-md)', animationDelay:'0.1s' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div>
            <p style={{ fontFamily:'var(--font-display)', fontSize:30, fontWeight:700, color:'var(--gold)' }}>
              {unlocked.length}
              <span style={{ fontSize:16, color:'var(--text-muted)' }}>/{ACHIEVEMENTS.length}</span>
            </p>
            <p className="label-sm" style={{ marginTop:4 }}>achievements unlocked</p>
          </div>
          <div style={{ textAlign:'right' }}>
            <p style={{ fontFamily:'var(--font-display)', fontSize:30, fontWeight:700, color:'var(--emerald)' }}>
              {streak}
            </p>
            <p className="label-sm" style={{ marginTop:4 }}>day streak 🔥</p>
          </div>
        </div>
        <div className="mini-bar-bg" style={{ height:6 }}>
          <div className="mini-bar-fill" style={{ width:`${(unlocked.length/ACHIEVEMENTS.length)*100}%`, height:6 }} />
        </div>
      </div>

      {/* Unlocked */}
      {unlocked.length > 0 && (
        <>
          <p className="label-sm" style={{ marginBottom:14 }}>✦ UNLOCKED</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:'var(--sp-md)' }}>
            {unlocked.map((a, i) => {
              const rarity = getRarity(a.id);
              return (
                <div key={a.id} className="achievement-card unlocked anim-fade-up"
                  style={{ animationDelay:`${i*0.08}s` }}>
                  <div style={{
                    width:64, height:64, borderRadius:'50%',
                    background:`radial-gradient(circle, rgba(212,175,55,0.2) 0%, transparent 70%)`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    border:'2px solid var(--border-gold)',
                    animation:'pulse-gold 2s ease infinite'
                  }}>
                    <span style={{ fontSize:30 }}>{a.icon}</span>
                  </div>
                  <p style={{ fontWeight:700, fontSize:13, color:'var(--text-primary)' }}>{a.title}</p>
                  <span style={{ fontSize:11, color: rarityColor[rarity], fontFamily:'var(--font-label)',
                    fontWeight:600, letterSpacing:'0.05em' }}>{rarity}</span>
                  <p style={{ fontSize:11, color:'var(--text-muted)', lineHeight:1.5 }}>{a.desc}</p>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Locked */}
      <p className="label-sm" style={{ marginBottom:14 }}>🔒 LOCKED</p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {locked.map((a, i) => {
          const rarity = getRarity(a.id);
          return (
            <div key={a.id} className="achievement-card anim-fade-up"
              style={{ animationDelay:`${i*0.06}s`, opacity:0.7 }}>
              <div style={{
                width:64, height:64, borderRadius:'50%',
                background:'var(--bg-surface-mid)',
                display:'flex', alignItems:'center', justifyContent:'center',
                border:'2px solid var(--border-light)',
                filter:'grayscale(1)',
              }}>
                <span style={{ fontSize:30 }}>{a.icon}</span>
              </div>
              <p style={{ fontWeight:700, fontSize:13, color:'var(--text-muted)' }}>{a.title}</p>
              <span style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-label)',
                fontWeight:600, letterSpacing:'0.05em' }}>{rarity}</span>
              <p style={{ fontSize:11, color:'var(--text-muted)', lineHeight:1.5 }}>{a.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
