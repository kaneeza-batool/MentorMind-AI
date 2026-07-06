import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const http = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

// ── Sessions ────────────────────────────────────────────────────
export const sessions = {
  create: (data) => http.post('/sessions', data),
  get:    (id)   => http.get(`/sessions/${id}`),
}

// ── Learning ────────────────────────────────────────────────────
export const learning = {
  start:    (data)               => http.post('/learn', data),
  complete: (sessionId, topicId, studyMinutes) =>
    http.post('/learn/complete', null, {
      params: { session_id: sessionId, topic_id: topicId, study_minutes: studyMinutes },
    }),
  next:     (data)               => http.post('/next', data),
  why:      (sessionId, topicId) =>
    http.get('/learn/why', { params: { session_id: sessionId, topic_id: topicId } }),
}

// ── Quiz ────────────────────────────────────────────────────────
export const quiz = {
  generate: (data) => http.post('/quiz/generate', data, { timeout: 60_000 }),
  submit:   (data) => http.post('/quiz/submit', data),
  feedback: (data) => http.post('/quiz/feedback', data, { timeout: 45_000 }),
  explain:  (data) => http.post('/quiz/explain', data),
}

// ── Reflection ──────────────────────────────────────────────────
export const reflection = {
  generate: (data) => http.post('/reflect', data, { timeout: 45_000 }),
}

// ── Resources ───────────────────────────────────────────────────
export const resources = {
  forTopic: (topic, sessionId) =>
    http.get(`/resources/${encodeURIComponent(topic)}`, { params: { session_id: sessionId } }),
}

// ── Progress & Analytics ─────────────────────────────────────────
export const progress = {
  get:       (sessionId) => http.get('/progress',   { params: { session_id: sessionId } }),
  adapt:     (sessionId) => http.get('/progress/adapt', { params: { session_id: sessionId } }),
  dashboard: (sessionId) => http.get('/dashboard',  { params: { session_id: sessionId } }),
  analytics: (sessionId) => http.get('/analytics',  { params: { session_id: sessionId } }),
}

// ── SSE ─────────────────────────────────────────────────────────
export const createLessonStream = (sessionId, topicId) =>
  new EventSource(`${BASE_URL}/learn/stream?session_id=${sessionId}&topic_id=${topicId}`)

// ── MCP ─────────────────────────────────────────────────────────
export const mcp = {
  info: () => http.get('/mcp/info'),
  call: (method, params) =>
    http.post('/mcp', { jsonrpc: '2.0', id: Date.now(), method, params }),
}

export default http
