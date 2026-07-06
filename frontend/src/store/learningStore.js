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

  // M5: streaming completion, error, and per-topic history
  lessonComplete: false,
  streamError:    null,
  lessonHistory:  {},   // { topicId: { completedAt, wordCount, estimatedMinutes } }
  whyExplanation: {},   // { topicId: string } — cached "why" text per topic

  // ── Quiz ─────────────────────────────────────────────────────
  quizQuestions:  [],
  quizResults:    null,
  pendingExplain: null,
  quizLoading:    false,
  quizFeedback:   {},   // { [topicId]: string } — cached AI feedback per topic

  // ── Progress ─────────────────────────────────────────────────
  mastery:    {},
  weakAreas:  [],

  // ── Resources ────────────────────────────────────────────────
  resources: {},

  // ── Reflection ───────────────────────────────────────────────
  reflection: null,

  // ── Actions ──────────────────────────────────────────────────
  initSession: ({ sessionId, curriculum }) =>
    set({
      sessionId,
      // Ensure every topic has a status field; API may omit it.
      curriculum: curriculum.map((t, i) => ({
        ...t,
        status: t.status ?? (i === 0 ? 'active' : 'locked'),
      })),
      currentTopicIndex: 0,
    }),

  setCurrentTopic: (i) =>
    set({ currentTopicIndex: i, lessonContent: '', lessonComplete: false, streamError: null }),

  appendLesson:     (chunk)   => set((s) => ({ lessonContent: s.lessonContent + chunk })),
  setLessonLoading: (v)       => set({ lessonLoading: v }),
  setLessonComplete: (v)      => set({ lessonComplete: v }),
  setStreamError:   (msg)     => set({ streamError: msg }),

  // Clears lesson state before (re)starting a stream.
  clearLesson: () =>
    set({ lessonContent: '', lessonComplete: false, streamError: null, lessonLoading: false }),

  // Called when streaming finishes — saves word count + timestamps to history.
  saveLessonHistory: (topicId) =>
    set((s) => {
      const words = s.lessonContent.trim().split(/\s+/).filter(Boolean).length
      return {
        lessonHistory: {
          ...s.lessonHistory,
          [topicId]: {
            completedAt:      new Date().toISOString(),
            wordCount:        words,
            estimatedMinutes: Math.max(1, Math.round(words / 200)),
          },
        },
      }
    }),

  setWhyExplanation: (topicId, text) =>
    set((s) => ({ whyExplanation: { ...s.whyExplanation, [topicId]: text } })),

  setQuizQuestions:  (qs)      => set({ quizQuestions: qs, quizResults: null }),
  setQuizResults:    (r)       => set({ quizResults: r }),
  setPendingExplain: (p)       => set({ pendingExplain: p }),
  setQuizLoading:    (v)       => set({ quizLoading: v }),
  setQuizFeedback:   (topicId, text) =>
    set((s) => ({ quizFeedback: { ...s.quizFeedback, [topicId]: text } })),

  // Mark the current topic completed, unlock the next, and advance the index.
  // Called when the learner passes the quiz and clicks "Next Topic".
  completeCurrentTopic: () =>
    set((s) => {
      const i = s.currentTopicIndex
      const updated = s.curriculum.map((t, idx) => {
        if (idx === i)     return { ...t, status: 'completed' }
        if (idx === i + 1) return { ...t, status: 'active' }
        return t
      })
      return {
        curriculum: updated,
        currentTopicIndex: Math.min(i + 1, s.curriculum.length - 1),
        lessonContent:  '',
        lessonComplete: false,
        streamError:    null,
        quizQuestions:  [],
        quizResults:    null,
        reflection:     null,
      }
    }),

  updateMastery: (topicId, score) =>
    set((s) => ({ mastery: { ...s.mastery, [topicId]: score } })),
  setWeakAreas: (areas) => set({ weakAreas: areas }),

  setResources: (topicId, list) =>
    set((s) => ({ resources: { ...s.resources, [topicId]: list } })),

  setReflection: (r)          => set({ reflection: r }),

  advanceTopic: () =>
    set((s) => ({
      currentTopicIndex: Math.min(s.currentTopicIndex + 1, s.curriculum.length - 1),
      lessonContent: '',
      lessonComplete: false,
      streamError: null,
      quizQuestions: [],
      quizResults: null,
      reflection: null,
    })),

  resetSession: () =>
    set({
      sessionId: null, curriculum: [], currentTopicIndex: 0,
      lessonContent: '', lessonLoading: false,
      lessonComplete: false, streamError: null,
      lessonHistory: {}, whyExplanation: {},
      quizQuestions: [], quizResults: null, pendingExplain: null,
      quizLoading: false, quizFeedback: {},
      mastery: {}, weakAreas: [], resources: {}, reflection: null,
    }),

  // ── Selectors ────────────────────────────────────────────────
  getCurrentTopic: () => {
    const s = get()
    return s.curriculum[s.currentTopicIndex] ?? null
  },
}))

export default useLearningStore
