// Frontend API Client
// Typed wrapper around fetch for all API calls

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${path}`;

  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Send httpOnly cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!data.success) {
    throw new ApiError(
      data.error?.code ?? 'UNKNOWN',
      data.error?.message ?? 'Request failed',
      response.status,
    );
  }

  return data.data as T;
}

// ============================================================
// AUTH API
// ============================================================

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    request<{ userId: string; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ userId: string; name: string; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () =>
    request<{ message: string }>('/api/auth/logout', { method: 'POST' }),

  me: () => request<User>('/api/auth/me'),
};

// ============================================================
// KITS API
// ============================================================

export interface KitListItem {
  id: string;
  company: string;
  role: string;
  status: string;
  daysAvailable: number;
  createdAt: string;
  updatedAt: string;
  progress?: GenerationProgress;
  version: number;
}

export interface GenerationProgress {
  status: string;
  stage?: string;
  percentage?: number;
  completedStages?: string[];
  warnings?: string[];
  error?: string;
  startedAt?: string;
  updatedAt?: string;
}

export interface KitDetail extends KitListItem {
  kit: KitData;
}

export interface KitData {
  source: {
    company: string;
    company_url: string;
    role: string;
    location: string;
    jd_chars: number;
    researched_at: string;
    pages_used: Array<{ url: string; title?: string }>;
  };
  company_brief: {
    summary: string;
    what_they_do: string;
    sources: string[];
    state?: EntityState;
  };
  role: {
    title: string;
    seniority: string;
    responsibilities: string[];
    requirements: Requirement[];
  };
  questions: Question[];
  flashcards: Flashcard[];
  schedule: {
    days_available: number;
    days: ScheduleDay[];
  };
  coverage: {
    uncovered_requirement_ids: string[];
    passes: number;
  };
}

export interface EntityState {
  origin: 'generated' | 'user-added';
  edited: boolean;
  pinned: boolean;
  version: number;
  editedAt?: string;
}

export interface Requirement {
  id: string;
  text: string;
  kind: 'technical' | 'behavioural' | 'domain';
  priority: 'must' | 'nice';
  state?: EntityState;
}

export interface Question {
  id: string;
  requirement_ids: string[];
  category: 'technical' | 'behavioural' | 'system-design' | 'company-fit';
  prompt: string;
  answer_outline: string;
  difficulty: 1 | 2 | 3;
  state?: EntityState;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  requirement_ids: string[];
  state?: EntityState;
  lastConfidence?: number;
  lastPracticedAt?: string;
  practiceCount?: number;
  priorityScore?: number;
}

export interface ScheduleDay {
  day: number;
  focus: string;
  question_ids: string[];
  minutes: number;
}

export interface WeaknessRadarItem {
  requirementId: string;
  requirementText: string;
  kind: string;
  priority: string;
  questionCount: number;
  coveredByQuestions: boolean;
  flashcardCount: number;
  averageConfidence: number | null;
  lastPracticedAt: string | null;
  priorityScore: number;
  status: 'strong' | 'good' | 'needs-work' | 'critical' | 'unpracticed';
  recommendedAction: string;
}

export interface WeaknessRadar {
  items: WeaknessRadarItem[];
  overallReadiness: number;
  criticalCount: number;
  strongCount: number;
  recommendations: string[];
}

export const kitsApi = {
  list: () => request<KitListItem[]>('/api/kits'),

  get: (id: string) => request<KitDetail>(`/api/kits/${id}`),

  create: (data: {
    jobDescription: string;
    companyUrl: string;
    daysAvailable: number;
    companyName?: string;
    role?: string;
  }) =>
    request<{ kitId: string; status: string; message: string; isDuplicate?: boolean }>(
      '/api/kits',
      { method: 'POST', body: JSON.stringify(data) },
    ),

  delete: (id: string) =>
    request<{ message: string }>(`/api/kits/${id}`, { method: 'DELETE' }),

  getProgress: (id: string) =>
    request<{ status: string; progress: GenerationProgress }>(`/api/kits/${id}/progress`),

  regenerate: (
    id: string,
    data: { section: string; category?: string; expectedVersion?: number },
  ) =>
    request<{ message: string; kit: KitData; version: number }>(
      `/api/kits/${id}/regenerate`,
      { method: 'POST', body: JSON.stringify(data) },
    ),

  updateCompanyBrief: (
    id: string,
    data: { summary?: string; what_they_do?: string },
  ) => request<{ company_brief: KitData['company_brief'] }>(`/api/kits/${id}/company-brief`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  updateQuestion: (
    kitId: string,
    questionId: string,
    data: Partial<Question & { pinned?: boolean; order?: number }>,
  ) =>
    request<{ question: Question }>(`/api/kits/${kitId}/questions/${questionId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  createQuestion: (kitId: string, data: Omit<Question, 'id' | 'state'>) =>
    request<{ question: Question }>(`/api/kits/${kitId}/questions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteQuestion: (kitId: string, questionId: string) =>
    request<{ message: string }>(`/api/kits/${kitId}/questions/${questionId}`, {
      method: 'DELETE',
    }),

  updateFlashcard: (
    kitId: string,
    flashcardId: string,
    data: Partial<Flashcard & { pinned?: boolean }>,
  ) =>
    request<{ flashcard: Flashcard }>(`/api/kits/${kitId}/flashcards/${flashcardId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  createFlashcard: (kitId: string, data: Omit<Flashcard, 'id' | 'state'>) =>
    request<{ flashcard: Flashcard }>(`/api/kits/${kitId}/flashcards`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteFlashcard: (kitId: string, flashcardId: string) =>
    request<{ message: string }>(`/api/kits/${kitId}/flashcards/${flashcardId}`, {
      method: 'DELETE',
    }),

  recordPractice: (
    kitId: string,
    data: { flashcardId: string; confidence: 1 | 2 | 3 | 4 | 5 },
  ) =>
    request<{ message: string }>(`/api/kits/${kitId}/practice`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getFlashcardsOrdered: (kitId: string) =>
    request<Flashcard[]>(`/api/kits/${kitId}/flashcards-ordered`),

  getWeaknessRadar: (kitId: string) =>
    request<WeaknessRadar>(`/api/kits/${kitId}/weakness-radar`),

  getProgressReport: (kitId: string) =>
    request<{
      totalFlashcards: number;
      practicedFlashcards: number;
      practicePercentage: number;
      practiceRecordCount: number;
    }>(`/api/kits/${kitId}/progress-report`),
};
