// Daily routine – sections → groups → items (items may have sub-steps).
// Only leaf items are tracked as tasks; parents show progress of their subs.

export const ROUTINE = [
  {
    id: 'morning', title: 'Morning', tagline: 'Start strong', icon: '🌅',
    time: '05:00', endTime: '09:00',
    color: '#F5B94A', glow: 'rgba(245,185,74,0.35)',
    groups: [
      {
        id: 'm_health', title: 'Health & Mind', icon: '🏃', priority: 'high',
        items: [
          { id: 'm_exercise', label: 'Exercise' },
          { id: 'm_cold', label: 'Cold bath' },
          { id: 'm_fruit', label: 'Eat fruits + nuts' },
          { id: 'm_music', label: 'Listen to good / positive music' },
        ],
      },
      {
        id: 'm_ai', title: 'AI Engineer Roadmap', icon: '💻', badge: '2 hrs', priority: 'high',
        items: [
          { id: 'm_python', label: 'Python basics' },
          { id: 'm_code', label: 'Practice coding' },
          { id: 'm_concept', label: 'Learn one concept properly' },
          { id: 'm_build', label: 'Build / practice something small' },
        ],
      },
      {
        id: 'm_plan', title: 'Daily Planning', icon: '🎯', priority: 'high',
        items: [
          { id: 'm_top3', label: "Decide today's Top 3 priorities" },
          { id: 'm_mit', label: 'Identify the most important work for today' },
          { id: 'm_balance', label: 'Plan company work + personal learning' },
        ],
      },
    ],
  },
  {
    id: 'work', title: 'Work', tagline: 'Company', icon: '🏢',
    time: '09:00', endTime: '13:00',
    color: '#5B9DFF', glow: 'rgba(91,157,255,0.35)',
    groups: [
      {
        id: 'w_rnd', title: 'R&D', icon: '🔬', badge: '2 hrs', priority: 'high',
        items: [
          { id: 'w_tech', label: 'Learn one new technology / tech stack' },
          { id: 'w_how', label: 'Understand how it works' },
          { id: 'w_practical', label: 'Do practical R&D' },
          { id: 'w_impl', label: 'Try a small implementation' },
          { id: 'w_notes', label: 'Note useful findings' },
        ],
      },
      {
        id: 'w_innov', title: 'Innovation', icon: '💡', priority: 'medium',
        items: [
          { id: 'w_idea', label: 'Think of one new idea' },
          { id: 'w_write', label: 'Write the idea down (card below)' },
        ],
        ideaCard: true,
      },
    ],
  },
  {
    id: 'afternoon', title: 'Afternoon', tagline: 'Deliver', icon: '☀️',
    time: '13:00', endTime: '17:30',
    color: '#FF8A5B', glow: 'rgba(255,138,91,0.35)',
    groups: [
      {
        id: 'a_work', title: 'Work', icon: '💼', priority: 'high',
        items: [
          { id: 'a_pending', label: 'Complete important pending work' },
          { id: 'a_continue', label: 'Continue project / work tasks' },
          { id: 'a_review', label: 'Review what is remaining' },
          { id: 'a_priority', label: 'Finish priority tasks before leaving' },
        ],
      },
      {
        id: 'a_lunch', title: 'After Lunch', icon: '🍽️', priority: 'low',
        items: [
          { id: 'a_break', label: 'Take a short break' },
          { id: 'a_focus', label: 'Get back to focused work' },
          { id: 'a_distract', label: 'Avoid unnecessary distractions' },
        ],
      },
    ],
  },
  {
    id: 'evening', title: 'Evening', tagline: 'Body + life', icon: '🌆',
    time: '17:30', endTime: '21:00',
    color: '#34D399', glow: 'rgba(52,211,153,0.35)',
    groups: [
      {
        id: 'e_health', title: 'Health', icon: '🚴', priority: 'high',
        items: [
          { id: 'e_cycle', label: 'Cycling / physical activity' },
          { id: 'e_active', label: 'Stay active' },
        ],
      },
      {
        id: 'e_german', title: 'German', icon: '🇩🇪', badge: '30–45 min', priority: 'high',
        items: [
          { id: 'e_lesson', label: 'German lesson' },
          { id: 'e_words', label: 'Learn new words' },
          { id: 'e_speak', label: 'Practice listening / speaking' },
        ],
      },
      {
        id: 'e_family', title: 'Family & Relationships', icon: '👨‍👩‍👦', priority: 'high',
        items: [
          { id: 'e_time', label: 'Quality time with family' },
          { id: 'e_msgs', label: 'Reply to important messages' },
          { id: 'e_call', label: 'Call important people' },
        ],
      },
    ],
  },
  {
    id: 'night', title: 'Night', tagline: 'Learn & reflect', icon: '🌙',
    time: '21:00', endTime: '23:30',
    color: '#A78BFA', glow: 'rgba(167,139,250,0.35)',
    groups: [
      {
        id: 'n_know', title: 'Knowledge', icon: '▶️', priority: 'medium',
        items: [
          { id: 'n_yt', label: 'Watch YouTube for useful information' },
          { id: 'n_topics', label: 'Technology / AI / Business / Career' },
          { id: 'n_scroll', label: 'Avoid meaningless scrolling' },
        ],
      },
      {
        id: 'n_biz', title: 'Business Thinking', icon: '💡', priority: 'medium',
        items: [
          { id: 'n_ideas', label: 'Think about business ideas' },
          { id: 'n_contacts', label: 'How can I build useful contacts?' },
          { id: 'n_who', label: 'Who can help me build this idea?' },
          { id: 'n_problem', label: 'What problem can I solve?' },
          { id: 'n_notebook', label: 'Write interesting ideas in my notebook' },
        ],
      },
    ],
    reviewCard: true,
  },
];

export const RULES = [
  { id: 'r_noporn', label: 'No porn', icon: '🚫', key: true },
  { id: 'r_social', label: 'Avoid unnecessary social media', icon: '📵' },
  { id: 'r_time', label: 'Avoid wasting time', icon: '⏳' },
  { id: 'r_compare', label: "Don't compare myself with others", icon: '🙅' },
  { id: 'r_progress', label: 'Focus on my own progress', icon: '📈' },
  { id: 'r_learn', label: 'Learn something every day', icon: '📚' },
  { id: 'r_build', label: 'Build something every day', icon: '🛠️' },
  { id: 'r_care', label: 'Take care of my body and mind', icon: '🧠' },
];

export const IDEA_FIELDS = [
  { key: 'idea_problem', label: 'Problem' },
  { key: 'idea_solution', label: 'Possible solution' },
  { key: 'idea_tech', label: 'Technology needed' },
  { key: 'idea_business', label: 'How it could become useful / business' },
];

export const REVIEW_FIELDS = [
  { key: 'rv_accomplished', label: 'What did I accomplish today?' },
  { key: 'rv_learned', label: 'What did I learn today?' },
  { key: 'rv_well', label: 'What went well?' },
  { key: 'rv_wasted', label: 'What did I waste time on?' },
  { key: 'rv_improve', label: 'What should I improve tomorrow?' },
  { key: 'rv_priority', label: "What is tomorrow's #1 priority?" },
];

// Success check – each row is derived from the groups / rules it lists.
export const SUCCESS_CHECK = [
  { label: 'Health', icon: '💪', groups: ['m_health', 'e_health'] },
  { label: 'AI Learning', icon: '🤖', groups: ['m_ai'] },
  { label: 'Company R&D', icon: '🔬', groups: ['w_rnd'] },
  { label: 'Work', icon: '💼', groups: ['a_work'] },
  { label: 'German', icon: '🇩🇪', groups: ['e_german'] },
  { label: 'Family', icon: '👨‍👩‍👦', groups: ['e_family'] },
  { label: 'Innovation / Business', icon: '💡', groups: ['w_innov', 'n_biz'] },
  { label: 'Daily Review', icon: '📝', review: true },
  { label: 'No Porn', icon: '🚫', rules: ['r_noporn'] },
];

export const RULE_OF_THE_DAY = "Don't try to do everything. Finish the important things first.";

// Flat task list used by the store, dashboard and sync.
export const DEFAULT_TASKS = [
  ...ROUTINE.flatMap(s => s.groups.flatMap(g => g.items.map(it => ({
    id: it.id,
    label: it.label,
    icon: g.icon,
    group: g.id,
    groupTitle: g.title,
    section: s.id,
    time: s.time,
    endTime: s.endTime,
    priority: g.priority,
    done: false,
  })))),
  ...RULES.map(r => ({
    id: r.id, label: r.label, icon: r.icon, group: 'rules', groupTitle: 'Daily Rules',
    section: 'rules', time: '00:00', endTime: '23:59', priority: 'high', allDay: true, done: false,
  })),
];
