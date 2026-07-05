import { create } from 'zustand'

const useLearningStore = create((set, get) => ({
  // ── Onboarding ───────────────────────────────────────────────
  skill:          '',
  goal:           '',
  level:          '',        // beginner | intermediate | advanced
  dailyMinutes:   30,
  deadline:       '60',      // '30' | '60' | '90' | 'custom'
  deadlineCustom: '',        // when deadline === 'custom'
  learningStyle:  '',        // visual | hands-on | reading | mixed

  setField: (key, val) => set({ [key]: val }),

  setOnboarding: (data) => set(data),

  // ── Session ──────────────────────────────────────────────────
  sessionId:        null,
  curriculum:       [],
  currentTopicIndex: 0,

  // ── Lesson ───────────────────────────────────────────────────
  lessonContent:  '',
  lessonLoading:  false,

  // ── Quiz ─────────────────────────────────────────────────────
  quizQuestions:  [],
  quizResults:    null,
  pendingExplain: null,

  // ── Progress ─────────────────────────────────────────────────
  mastery:    {},
  weakAreas:  [],

  // ── Resources ────────────────────────────────────────────────
  resources: {},

  // ── Reflection ───────────────────────────────────────────────
  reflection: null,

  // ── Actions ──────────────────────────────────────────────────
  initSession: ({ sessionId, curriculum }) =>
    set({ sessionId, curriculum, currentTopicIndex: 0 }),

  setCurrentTopic:  (i)       => set({ currentTopicIndex: i, lessonContent: '' }),
  appendLesson:     (chunk)   => set((s) => ({ lessonContent: s.lessonContent + chunk })),
  setLessonLoading: (v)       => set({ lessonLoading: v }),

  setQuizQuestions: (qs)      => set({ quizQuestions: qs, quizResults: null }),
  setQuizResults:   (r)       => set({ quizResults: r }),
  setPendingExplain:(p)       => set({ pendingExplain: p }),

  updateMastery: (topicId, score) =>
    set((s) => ({ mastery: { ...s.mastery, [topicId]: score } })),
  setWeakAreas: (areas)       => set({ weakAreas: areas }),

  setResources: (topicId, list) =>
    set((s) => ({ resources: { ...s.resources, [topicId]: list } })),

  setReflection: (r)          => set({ reflection: r }),

  advanceTopic: () =>
    set((s) => ({
      currentTopicIndex: Math.min(s.currentTopicIndex + 1, s.curriculum.length - 1),
      lessonContent: '',
      quizQuestions: [],
      quizResults: null,
      reflection: null,
    })),

  resetSession: () =>
    set({
      sessionId: null, curriculum: [], currentTopicIndex: 0,
      lessonContent: '', lessonLoading: false,
      quizQuestions: [], quizResults: null, pendingExplain: null,
      mastery: {}, weakAreas: [], resources: {}, reflection: null,
    }),

  // ── Selectors ────────────────────────────────────────────────
  getCurrentTopic: () => {
    const s = get()
    return s.curriculum[s.currentTopicIndex] ?? null
  },
}))

export default useLearningStore
