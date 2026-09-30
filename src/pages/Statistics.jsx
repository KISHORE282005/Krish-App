import { useState } from 'react';
import { useStore, DEFAULT_HABITS, DEFAULT_TASKS } from '../store/useStore';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color:'rgba(255,255,255,0.04)' }, ticks: { color:'#919094', font:{ size:11 } } },
    y: { grid: { color:'rgba(255,255,255,0.04)' }, ticks: { color:'#919094', font:{ size:11 } }, beginAtZero:true, max:100 },
  },
};

function getLast7Days() {
  return Array.from({ length:7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
}

export default function Statistics() {
  const { habitLogs, taskLogs } = useStore();
  const [period, setPeriod] = useState('week');

  const days7 = getLast7Days();
  const labels = days7.map(d => d.toLocaleDateString('en-US', { weekday:'short' }));

  const scoreData = days7.map(d => {
    const key = d.toISOString().split('T')[0];
    const hl = habitLogs[key] || {};
    const tl = taskLogs[key] || {};
    const hd = Object.values(hl).filter(Boolean).length;
    const td = DEFAULT_TASKS.filter(t => tl[t.id]).length;
    return Math.round((hd / DEFAULT_HABITS.length) * 60 + (td / DEFAULT_TASKS.length) * 40);
  });

  const habitCategories = {
    health:     DEFAULT_HABITS.filter(h=>h.category==='health').length,
    discipline: DEFAULT_HABITS.filter(h=>h.category==='discipline').length,
    learning:   DEFAULT_HABITS.filter(h=>h.category==='learning').length,
    personal:   DEFAULT_HABITS.filter(h=>h.category==='personal').length,
  };

  const today = new Date().toISOString().split('T')[0];
  const todayHL = habitLogs[today] || {};
  const todayDone = {
    health:     DEFAULT_HABITS.filter(h=>h.category==='health'&&todayHL[h.id]).length,
    discipline: DEFAULT_HABITS.filter(h=>h.category==='discipline'&&todayHL[h.id]).length,
    learning:   DEFAULT_HABITS.filter(h=>h.category==='learning'&&todayHL[h.id]).length,
    personal:   DEFAULT_HABITS.filter(h=>h.category==='personal'&&todayHL[h.id]).length,
  };

  const avgScore = scoreData.reduce((a,b) => a+b, 0) / 7 || 0;
  const maxScore = Math.max(...scoreData, 0);
  const consistency = scoreData.filter(s => s >= 50).length;

  const barChartData = {
    labels,
    datasets: [{
      data: scoreData,
      backgroundColor: scoreData.map(s =>
        s >= 80 ? 'rgba(212,175,55,0.7)' : s >= 60 ? 'rgba(212,175,55,0.4)' : 'rgba(212,175,55,0.2)'
      ),
      borderColor: 'rgba(212,175,55,0.8)',
      borderWidth: 1,
      borderRadius: 6,
    }]
  };

  const lineChartData = {
    labels,
    datasets: [{
      data: scoreData,
      borderColor: '#D4AF37',
      backgroundColor: 'rgba(212,175,55,0.08)',
      borderWidth: 2.5,
      pointBackgroundColor: '#D4AF37',
      pointRadius: 4,
      fill: true,
      tension: 0.4,
    }]
  };

  const doughnutData = {
    labels: ['Health', 'Discipline', 'Learning', 'Personal'],
    datasets: [{
      data: [
        todayDone.health, todayDone.discipline, todayDone.learning, todayDone.personal
      ],
      backgroundColor: ['#10B981','#D4AF37','#63B3ED','#F472B6'],
      borderWidth: 0,
    }]
  };

  const statCards = [
    { label:'Avg Score',    value: `${Math.round(avgScore)}`, unit:'/ 100', color:'var(--gold)' },
    { label:'Best Day',     value: `${maxScore}`,             unit:'pts',   color:'var(--emerald)' },
    { label:'Consistent',   value: `${consistency}/7`,        unit:'days',  color:'#63B3ED' },
    { label:'Habits Done',  value: `${Object.values(todayHL).filter(Boolean).length}`, unit:`/ ${DEFAULT_HABITS.length}`, color:'#F472B6' },
  ];

  return (
    <div className="page-container">
      <div className="anim-fade-up" style={{ marginBottom:'var(--sp-md)' }}>
        <p className="label-sm" style={{ color:'var(--gold)', marginBottom:6 }}>PERFORMANCE</p>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:700 }}>Statistics</h1>
      </div>

      {/* Period tabs */}
      <div className="tab-bar anim-fade-up" style={{ animationDelay:'0.1s' }}>
        {['week','month','year'].map(p => (
          <button key={p} className={`tab-btn ${period===p?'active':''}`} onClick={() => setPeriod(p)}>
            {p.charAt(0).toUpperCase()+p.slice(1)}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:'var(--sp-md)' }}>
        {statCards.map((s, i) => (
          <div key={i} className="surface-card anim-fade-up" style={{ animationDelay:`${0.1+i*0.07}s` }}>
            <p className="label-sm" style={{ marginBottom:8 }}>{s.label}</p>
            <p style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:700, color:s.color, lineHeight:1 }}>
              {s.value}
            </p>
            <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>{s.unit}</p>
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      <div className="glass-card anim-fade-up" style={{ padding:20, marginBottom:'var(--sp-md)', animationDelay:'0.3s' }}>
        <p className="label-sm" style={{ marginBottom:16 }}>📊 Daily Score — Last 7 Days</p>
        <div style={{ height:160 }}>
          <Bar data={barChartData} options={CHART_DEFAULTS} />
        </div>
      </div>

      {/* Line Chart */}
      <div className="glass-card anim-fade-up" style={{ padding:20, marginBottom:'var(--sp-md)', animationDelay:'0.35s' }}>
        <p className="label-sm" style={{ marginBottom:16 }}>📈 Progress Trend</p>
        <div style={{ height:140 }}>
          <Line data={lineChartData} options={CHART_DEFAULTS} />
        </div>
      </div>

      {/* Doughnut */}
      <div className="glass-card anim-fade-up" style={{ padding:20, animationDelay:'0.4s' }}>
        <p className="label-sm" style={{ marginBottom:16 }}>🎯 Today's Habit Breakdown</p>
        <div style={{ display:'flex', alignItems:'center', gap:24 }}>
          <div style={{ width:130, height:130, flexShrink:0 }}>
            <Doughnut data={doughnutData} options={{
              responsive:true, maintainAspectRatio:true,
              plugins: { legend:{ display:false } }, cutout:'72%'
            }} />
          </div>
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
            {[
              { label:'Health',     done:todayDone.health,     total:habitCategories.health,     color:'#10B981' },
              { label:'Discipline', done:todayDone.discipline, total:habitCategories.discipline, color:'#D4AF37' },
              { label:'Learning',   done:todayDone.learning,   total:habitCategories.learning,   color:'#63B3ED' },
              { label:'Personal',   done:todayDone.personal,   total:habitCategories.personal,   color:'#F472B6' },
            ].map(cat => (
              <div key={cat.label}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{cat.label}</span>
                  <span style={{ fontSize:12, color:cat.color, fontWeight:600 }}>{cat.done}/{cat.total}</span>
                </div>
                <div className="mini-bar-bg">
                  <div className="mini-bar-fill" style={{ width:`${(cat.done/cat.total)*100}%`, background:cat.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
