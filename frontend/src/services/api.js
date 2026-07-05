import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const http = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

// ── Sessions ────────────────────────────────────────────────────
export const sessions = {
  create: (data)     => http.post('/sessions', data),
  get:    (id)       => http.get(`/sessions/${id}`),
}

// ── Learning (lesson streaming handled via EventSource) ─────────
export const learning = {
  start: (data)      => http.post('/learn', data),
  next:  (data)      => http.post('/next', data),
}

// ── Quiz ────────────────────────────────────────────────────────
export const quiz = {
  generate: (data)   => http.post('/quiz/generate', data),
  submit:   (data)   => http.post('/quiz/submit', data),
  explain:  (data)   => http.post('/quiz/explain', data),
}

// ── Reflection ──────────────────────────────────────────────────
export const reflection = {
  generate: (data)   => http.post('/reflect', data),
}

// ── Resources ───────────────────────────────────────────────────
export const resources = {
  forTopic: (topic, sessionId) =>
    http.get(`/resources/${encodeURIComponent(topic)}`, { params: { session_id: sessionId } }),
}

// ── Progress ────────────────────────────────────────────────────
export const progress = {
  get:    (sessionId) => http.get('/progress',       { params: { session_id: sessionId } }),
  adapt:  (sessionId) => http.get('/progress/adapt', { params: { session_id: sessionId } }),
}

// ── SSE helper — lesson streaming ───────────────────────────────
export const createLessonStream = (sessionId, topicId) =>
  new EventSource(`${BASE_URL}/learn/stream?session_id=${sessionId}&topic_id=${topicId}`)

export default http
