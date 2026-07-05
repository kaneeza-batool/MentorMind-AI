import {
  Compass,
  BookOpen,
  ClipboardList,
  TrendingUp,
  Library,
  Sparkles,
} from 'lucide-react'

export const AGENTS = [
  {
    id: 'strategist',
    name: 'Strategist',
    role: 'Curriculum Architect',
    color: '#818CF8',
    colorVar: 'strategist',
    Icon: Compass,
    tagline: 'Your personal learning architect',
    description:
      'Designs a custom learning roadmap from your goals and adapts it dynamically as your mastery evolves.',
    powers: [
      'Builds structured, goal-aligned curriculum',
      'Re-plans the path based on Coach signals',
      'Prioritizes high-impact topics first',
    ],
  },
  {
    id: 'mentor',
    name: 'Mentor',
    role: 'Knowledge Guide',
    color: '#34D399',
    colorVar: 'mentor',
    Icon: BookOpen,
    tagline: 'Your real-time knowledge companion',
    description:
      'Delivers rich, streaming lessons calibrated to your exact skill level — with examples, analogies, and code.',
    powers: [
      'Streams lessons live as they are generated',
      'Adapts depth and tone to your level',
      'Uses examples, analogies, and visuals',
    ],
  },
  {
    id: 'examiner',
    name: 'Examiner',
    role: 'Knowledge Assessor',
    color: '#FBBF24',
    colorVar: 'examiner',
    Icon: ClipboardList,
    tagline: 'Tests your understanding precisely',
    description:
      'Generates adaptive quizzes after every lesson and explains every answer in depth — with a single click.',
    powers: [
      'Creates adaptive difficulty quizzes',
      'Grades with precision and nuance',
      '"Why?" explains every answer on demand',
    ],
  },
  {
    id: 'coach',
    name: 'Coach',
    role: 'Progress Optimizer',
    color: '#F87171',
    colorVar: 'coach',
    Icon: TrendingUp,
    tagline: 'Tracks your mastery over time',
    description:
      'Monitors performance across all topics, computes mastery scores, and tells the Strategist when to adapt.',
    powers: [
      'Tracks per-topic mastery 0–100',
      'Pinpoints weak areas automatically',
      'Triggers Strategist re-planning when needed',
    ],
  },
  {
    id: 'resource',
    name: 'Resource',
    role: 'Knowledge Curator',
    color: '#22D3EE',
    colorVar: 'resource',
    Icon: Library,
    tagline: 'Surfaces the best learning materials',
    description:
      'Recommends curated articles, videos, docs, and courses — matched to your current topic and goal.',
    powers: [
      'Curates articles, videos, docs, and courses',
      'Ranks resources by relevance to your goal',
      'Refreshes recommendations per topic',
    ],
  },
  {
    id: 'reflection',
    name: 'Reflection',
    role: 'Insight Generator',
    color: '#C084FC',
    colorVar: 'reflection',
    Icon: Sparkles,
    tagline: 'Turns quiz results into clarity',
    description:
      'Writes a personalized narrative after every quiz — naming your strengths, exposing gaps, and charting what to do next.',
    powers: [
      'Generates personalized feedback narratives',
      'Names your strengths and weak spots',
      'Recommends your exact next action',
    ],
  },
]

export const AGENT_MAP = Object.fromEntries(AGENTS.map((a) => [a.id, a]))
