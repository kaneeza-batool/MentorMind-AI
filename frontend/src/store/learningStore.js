import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useLearningStore = create(
  persist(
    (set, get) => ({
      // ── Onboarding ───────────────────────────────────────────────
      skill:          '',
      goal:           '',
      level:          '',
      dailyMinutes:   30,
      deadline:       '60',
      deadlineCustom: '',
      learningStyle:  '',

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
      lessonHistory:  {},
      whyExplanation: {},

      // ── Quiz ─────────────────────────────────────────────────────
      quizQuestions:  [],
      quizResults:    null,
      pendingExplain: null,
      quizLoading:    false,
      quizFeedback:   {},

      // ── Progress ─────────────────────────────────────────────────
      mastery:   {},
      weakAreas: [],

      // ── Adaptive curriculum ───────────────────────────────────────
      curriculumAdapted:    false,    // true when the latest quiz triggered adaptation
      curriculumAdaptCount: 0,        // total adaptations this session

      // ── Resources ────────────────────────────────────────────────
      resources: {},

      // ── Reflection ───────────────────────────────────────────────
      reflection:        null,
      reflectionHistory: {},

      // ── Dashboard & Analytics ─────────────────────────────────────
      dashboardData:  null,
      analyticsData:  null,

      // ── Actions ──────────────────────────────────────────────────
      initSession: ({ sessionId, curriculum }) =>
        set({
          sessionId,
          curriculum: curriculum.map((t, i) => ({
            ...t,
            status: t.status ?? (i === 0 ? 'active' : 'locked'),
          })),
          currentTopicIndex:    0,
          curriculumAdapted:    false,
          curriculumAdaptCount: 0,
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

      setQuizQuestions:  (qs)             => set({ quizQuestions: qs, quizResults: null }),
      setQuizResults:    (r)              => set({ quizResults: r }),
      setPendingExplain: (p)              => set({ pendingExplain: p }),
      setQuizLoading:    (v)              => set({ quizLoading: v }),
      setQuizFeedback:   (topicId, text)  =>
        set((s) => ({ quizFeedback: { ...s.quizFeedback, [topicId]: text } })),

      // Called after quiz submit with the full server response
      handleQuizSubmit: (topicId, serverResponse) =>
        set((s) => {
          const adapted = serverResponse?.curriculum_adapted ?? false
          return {
            quizResults:          serverResponse,
            mastery:              {
              ...s.mastery,
              [topicId]: serverResponse?.mastery_delta != null
                ? Math.min(100, (s.mastery[topicId] ?? 0) + serverResponse.mastery_delta)
                : s.mastery[topicId] ?? 0,
            },
            weakAreas:            serverResponse?.weak_concepts ?? s.weakAreas,
            curriculumAdapted:    adapted,
            curriculumAdaptCount: adapted
              ? s.curriculumAdaptCount + 1
              : s.curriculumAdaptCount,
          }
        }),

      // Sync curriculum from server (called when adaptation is detected)
      syncCurriculum: (serverTopics) =>
        set((s) => ({
          curriculum: s.curriculum.map((local) => {
            const server = serverTopics.find((t) => t.id === local.id)
            if (!server) return local
            // Only update locked topics — preserve completed/active status client-side
            if (local.status === 'locked') {
              return { ...local, title: server.title, description: server.description }
            }
            return local
          }),
          curriculumAdapted: false,  // reset banner after sync
        })),

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
            currentTopicIndex: isLast ? i : Math.min(i + 1, s.curriculum.length - 1),
            lessonContent:     '',
            lessonComplete:    false,
            streamError:       null,
            quizQuestions:     [],
            quizResults:       null,
            reflection:        null,
            curriculumAdapted: false,
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

      setDashboardData:  (data) => set({ dashboardData: data }),
      setAnalyticsData:  (data) => set({ analyticsData: data }),

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
          analyticsData: null, curriculumAdapted: false, curriculumAdaptCount: 0,
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
        curriculumAdaptCount: s.curriculumAdaptCount,
      }),
    }
  )
)

export default useLearningStore
