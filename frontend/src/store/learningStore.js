import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useLearningStore = create(
  persist(
    (set, get) => ({
      // ── Onboarding ───────────────────────────────────────────────
      skill:          '',
      goal:           '',
      level:          '',        // beginner | intermediate | advanced
      dailyMinutes:   30,
      deadline:       '60',      // '30' | '60' | '90' | 'custom'
      deadlineCustom: '',
      learningStyle:  '',        // visual | hands-on | reading | mixed

      setField:      (key, val) => set({ [key]: val }),
      setOnboarding: (data)     => set(data),

      // ── Session ──────────────────────────────────────────────────
      sessionId:         null,
      curriculum:        [],
      currentTopicIndex: 0,

      // ── Lesson ───────────────────────────────────────────────────
      lessonContent:  '',
      lessonLoading:  false,
      lessonComplete: false,
      streamError:    null,
      lessonHistory:  {},   // { topicId: { completedAt, wordCount, estimatedMinutes } }
      whyExplanation: {},   // { topicId: string }

      // ── Quiz ─────────────────────────────────────────────────────
      quizQuestions:  [],
      quizResults:    null,
      pendingExplain: null,
      quizLoading:    false,
      quizFeedback:   {},   // { [topicId]: string }

      // ── Progress ─────────────────────────────────────────────────
      mastery:   {},
      weakAreas: [],

      // ── Resources ────────────────────────────────────────────────
      resources: {},   // { [topicId]: ResourceSchema[] }

      // ── Reflection ───────────────────────────────────────────────
      reflection:        null,
      reflectionHistory: {},   // { [topicId]: reflectionData }

      // ── Dashboard ────────────────────────────────────────────────
      dashboardData: null,

      // ── Actions ──────────────────────────────────────────────────
      initSession: ({ sessionId, curriculum }) =>
        set({
          sessionId,
          curriculum: curriculum.map((t, i) => ({
            ...t,
            status: t.status ?? (i === 0 ? 'active' : 'locked'),
          })),
          currentTopicIndex: 0,
        }),

      setCurrentTopic: (i) =>
        set({ currentTopicIndex: i, lessonContent: '', lessonComplete: false, streamError: null }),

      appendLesson:      (chunk) => set((s) => ({ lessonContent: s.lessonContent + chunk })),
      setLessonLoading:  (v)     => set({ lessonLoading: v }),
      setLessonComplete: (v)     => set({ lessonComplete: v }),
      setStreamError:    (msg)   => set({ streamError: msg }),

      clearLesson: () =>
        set({ lessonContent: '', lessonComplete: false, streamError: null, lessonLoading: false }),

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

      setQuizQuestions:  (qs)            => set({ quizQuestions: qs, quizResults: null }),
      setQuizResults:    (r)             => set({ quizResults: r }),
      setPendingExplain: (p)             => set({ pendingExplain: p }),
      setQuizLoading:    (v)             => set({ quizLoading: v }),
      setQuizFeedback:   (topicId, text) =>
        set((s) => ({ quizFeedback: { ...s.quizFeedback, [topicId]: text } })),

      // Mark the current topic completed, unlock the next, and advance the index.
      completeCurrentTopic: () =>
        set((s) => {
          const i      = s.currentTopicIndex
          const isLast = i === s.curriculum.length - 1
          const updated = s.curriculum.map((t, idx) => {
            if (idx === i)     return { ...t, status: 'completed' }
            if (idx === i + 1) return { ...t, status: 'active' }
            return t
          })
          return {
            curriculum:        updated,
            // Stay at last index when completing the final topic (no next topic to advance to)
            currentTopicIndex: isLast ? i : Math.min(i + 1, s.curriculum.length - 1),
            lessonContent:     '',
            lessonComplete:    false,
            streamError:       null,
            quizQuestions:     [],
            quizResults:       null,
            reflection:        null,
          }
        }),

      updateMastery: (topicId, score) =>
        set((s) => ({ mastery: { ...s.mastery, [topicId]: score } })),
      setWeakAreas: (areas) => set({ weakAreas: areas }),

      setResources: (topicId, list) =>
        set((s) => ({ resources: { ...s.resources, [topicId]: list } })),

      setReflection: (r) => set({ reflection: r }),

      setReflectionHistory: (topicId, data) =>
        set((s) => ({ reflectionHistory: { ...s.reflectionHistory, [topicId]: data } })),

      setDashboardData: (data) => set({ dashboardData: data }),

      advanceTopic: () =>
        set((s) => ({
          currentTopicIndex: Math.min(s.currentTopicIndex + 1, s.curriculum.length - 1),
          lessonContent:  '',
          lessonComplete: false,
          streamError:    null,
          quizQuestions:  [],
          quizResults:    null,
          reflection:     null,
        })),

      resetSession: () =>
        set({
          sessionId: null, curriculum: [], currentTopicIndex: 0,
          lessonContent: '', lessonLoading: false,
          lessonComplete: false, streamError: null,
          lessonHistory: {}, whyExplanation: {},
          quizQuestions: [], quizResults: null, pendingExplain: null,
          quizLoading: false, quizFeedback: {},
          mastery: {}, weakAreas: [], resources: {},
          reflection: null, reflectionHistory: {}, dashboardData: null,
        }),

      // ── Selectors ────────────────────────────────────────────────
      getCurrentTopic: () => {
        const s = get()
        return s.curriculum[s.currentTopicIndex] ?? null
      },

      isJourneyComplete: () => {
        const s = get()
        return s.curriculum.length > 0 && s.curriculum.every((t) => t.status === 'completed')
      },
    }),
    {
      name: 'mentormind-learning',
      partialize: (s) => ({
        skill:             s.skill,
        goal:              s.goal,
        level:             s.level,
        dailyMinutes:      s.dailyMinutes,
        deadline:          s.deadline,
        deadlineCustom:    s.deadlineCustom,
        learningStyle:     s.learningStyle,
        sessionId:         s.sessionId,
        curriculum:        s.curriculum,
        currentTopicIndex: s.currentTopicIndex,
        lessonHistory:     s.lessonHistory,
        whyExplanation:    s.whyExplanation,
        quizFeedback:      s.quizFeedback,
        mastery:           s.mastery,
        weakAreas:         s.weakAreas,
        resources:         s.resources,
        reflectionHistory: s.reflectionHistory,
        dashboardData:     s.dashboardData,
      }),
    }
  )
)

export default useLearningStore
