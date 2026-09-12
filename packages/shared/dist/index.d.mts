import { z } from 'zod';

declare const RequirementKindSchema: z.ZodEnum<["technical", "behavioural", "domain"]>;
declare const RequirementPrioritySchema: z.ZodEnum<["must", "nice"]>;
declare const QuestionCategorySchema: z.ZodEnum<["technical", "behavioural", "system-design", "company-fit"]>;
declare const DifficultySchema: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>]>;
declare const ConfidenceSchema: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>, z.ZodLiteral<5>]>;
declare const KitStatusSchema: z.ZodEnum<["queued", "running", "completed", "partial", "failed"]>;
declare const GenerationStageSchema: z.ZodEnum<["validating", "extracting_requirements", "researching_company", "finding_hiring_process", "researching_public_interviews", "generating_questions", "generating_flashcards", "checking_coverage", "closing_coverage_gaps", "allocating_schedule", "validating_kit", "saving", "completed"]>;
declare const EntityOriginSchema: z.ZodEnum<["generated", "user-added"]>;
declare const RegeneratableSectionSchema: z.ZodEnum<["company-brief", "questions", "flashcards", "schedule"]>;
declare const EntityStateSchema: z.ZodObject<{
    origin: z.ZodEnum<["generated", "user-added"]>;
    edited: z.ZodBoolean;
    pinned: z.ZodBoolean;
    version: z.ZodNumber;
    editedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    origin: "generated" | "user-added";
    edited: boolean;
    pinned: boolean;
    version: number;
    editedAt?: string | undefined;
}, {
    origin: "generated" | "user-added";
    edited: boolean;
    pinned: boolean;
    version: number;
    editedAt?: string | undefined;
}>;
type EntityState = z.infer<typeof EntityStateSchema>;
declare const RequirementSchema: z.ZodObject<{
    id: z.ZodString;
    text: z.ZodString;
    kind: z.ZodEnum<["technical", "behavioural", "domain"]>;
    priority: z.ZodEnum<["must", "nice"]>;
    state: z.ZodOptional<z.ZodObject<{
        origin: z.ZodEnum<["generated", "user-added"]>;
        edited: z.ZodBoolean;
        pinned: z.ZodBoolean;
        version: z.ZodNumber;
        editedAt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        origin: "generated" | "user-added";
        edited: boolean;
        pinned: boolean;
        version: number;
        editedAt?: string | undefined;
    }, {
        origin: "generated" | "user-added";
        edited: boolean;
        pinned: boolean;
        version: number;
        editedAt?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    text: string;
    kind: "technical" | "behavioural" | "domain";
    priority: "must" | "nice";
    state?: {
        origin: "generated" | "user-added";
        edited: boolean;
        pinned: boolean;
        version: number;
        editedAt?: string | undefined;
    } | undefined;
}, {
    id: string;
    text: string;
    kind: "technical" | "behavioural" | "domain";
    priority: "must" | "nice";
    state?: {
        origin: "generated" | "user-added";
        edited: boolean;
        pinned: boolean;
        version: number;
        editedAt?: string | undefined;
    } | undefined;
}>;
type Requirement = z.infer<typeof RequirementSchema>;
declare const QuestionSchema: z.ZodObject<{
    id: z.ZodString;
    requirement_ids: z.ZodArray<z.ZodString, "many">;
    category: z.ZodEnum<["technical", "behavioural", "system-design", "company-fit"]>;
    prompt: z.ZodString;
    answer_outline: z.ZodString;
    difficulty: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>]>;
    state: z.ZodOptional<z.ZodObject<{
        origin: z.ZodEnum<["generated", "user-added"]>;
        edited: z.ZodBoolean;
        pinned: z.ZodBoolean;
        version: z.ZodNumber;
        editedAt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        origin: "generated" | "user-added";
        edited: boolean;
        pinned: boolean;
        version: number;
        editedAt?: string | undefined;
    }, {
        origin: "generated" | "user-added";
        edited: boolean;
        pinned: boolean;
        version: number;
        editedAt?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    requirement_ids: string[];
    category: "technical" | "behavioural" | "system-design" | "company-fit";
    prompt: string;
    answer_outline: string;
    difficulty: 3 | 2 | 1;
    state?: {
        origin: "generated" | "user-added";
        edited: boolean;
        pinned: boolean;
        version: number;
        editedAt?: string | undefined;
    } | undefined;
}, {
    id: string;
    requirement_ids: string[];
    category: "technical" | "behavioural" | "system-design" | "company-fit";
    prompt: string;
    answer_outline: string;
    difficulty: 3 | 2 | 1;
    state?: {
        origin: "generated" | "user-added";
        edited: boolean;
        pinned: boolean;
        version: number;
        editedAt?: string | undefined;
    } | undefined;
}>;
type Question = z.infer<typeof QuestionSchema>;
declare const FlashcardSchema: z.ZodObject<{
    id: z.ZodString;
    front: z.ZodString;
    back: z.ZodString;
    requirement_ids: z.ZodArray<z.ZodString, "many">;
    state: z.ZodOptional<z.ZodObject<{
        origin: z.ZodEnum<["generated", "user-added"]>;
        edited: z.ZodBoolean;
        pinned: z.ZodBoolean;
        version: z.ZodNumber;
        editedAt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        origin: "generated" | "user-added";
        edited: boolean;
        pinned: boolean;
        version: number;
        editedAt?: string | undefined;
    }, {
        origin: "generated" | "user-added";
        edited: boolean;
        pinned: boolean;
        version: number;
        editedAt?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    requirement_ids: string[];
    front: string;
    back: string;
    state?: {
        origin: "generated" | "user-added";
        edited: boolean;
        pinned: boolean;
        version: number;
        editedAt?: string | undefined;
    } | undefined;
}, {
    id: string;
    requirement_ids: string[];
    front: string;
    back: string;
    state?: {
        origin: "generated" | "user-added";
        edited: boolean;
        pinned: boolean;
        version: number;
        editedAt?: string | undefined;
    } | undefined;
}>;
type Flashcard = z.infer<typeof FlashcardSchema>;
declare const ScheduleDaySchema: z.ZodObject<{
    day: z.ZodNumber;
    focus: z.ZodString;
    question_ids: z.ZodArray<z.ZodString, "many">;
    minutes: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    day: number;
    focus: string;
    question_ids: string[];
    minutes: number;
}, {
    day: number;
    focus: string;
    question_ids: string[];
    minutes: number;
}>;
type ScheduleDay = z.infer<typeof ScheduleDaySchema>;
declare const ScheduleSchema: z.ZodObject<{
    days_available: z.ZodNumber;
    days: z.ZodArray<z.ZodObject<{
        day: z.ZodNumber;
        focus: z.ZodString;
        question_ids: z.ZodArray<z.ZodString, "many">;
        minutes: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        day: number;
        focus: string;
        question_ids: string[];
        minutes: number;
    }, {
        day: number;
        focus: string;
        question_ids: string[];
        minutes: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    days_available: number;
    days: {
        day: number;
        focus: string;
        question_ids: string[];
        minutes: number;
    }[];
}, {
    days_available: number;
    days: {
        day: number;
        focus: string;
        question_ids: string[];
        minutes: number;
    }[];
}>;
type Schedule = z.infer<typeof ScheduleSchema>;
declare const CoverageSchema: z.ZodObject<{
    uncovered_requirement_ids: z.ZodArray<z.ZodString, "many">;
    passes: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    uncovered_requirement_ids: string[];
    passes: number;
}, {
    uncovered_requirement_ids: string[];
    passes: number;
}>;
type Coverage = z.infer<typeof CoverageSchema>;
declare const SourcePageSchema: z.ZodObject<{
    url: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    relevanceScore: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    url: string;
    title?: string | undefined;
    relevanceScore?: number | undefined;
}, {
    url: string;
    title?: string | undefined;
    relevanceScore?: number | undefined;
}>;
type SourcePage = z.infer<typeof SourcePageSchema>;
declare const KitSourceSchema: z.ZodObject<{
    company: z.ZodString;
    company_url: z.ZodString;
    role: z.ZodString;
    location: z.ZodString;
    jd_chars: z.ZodNumber;
    researched_at: z.ZodString;
    pages_used: z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        title: z.ZodOptional<z.ZodString>;
        relevanceScore: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        title?: string | undefined;
        relevanceScore?: number | undefined;
    }, {
        url: string;
        title?: string | undefined;
        relevanceScore?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    company: string;
    company_url: string;
    role: string;
    location: string;
    jd_chars: number;
    researched_at: string;
    pages_used: {
        url: string;
        title?: string | undefined;
        relevanceScore?: number | undefined;
    }[];
}, {
    company: string;
    company_url: string;
    role: string;
    location: string;
    jd_chars: number;
    researched_at: string;
    pages_used: {
        url: string;
        title?: string | undefined;
        relevanceScore?: number | undefined;
    }[];
}>;
type KitSource = z.infer<typeof KitSourceSchema>;
declare const CompanyBriefSchema: z.ZodObject<{
    summary: z.ZodString;
    what_they_do: z.ZodString;
    sources: z.ZodArray<z.ZodString, "many">;
    state: z.ZodOptional<z.ZodObject<{
        origin: z.ZodEnum<["generated", "user-added"]>;
        edited: z.ZodBoolean;
        pinned: z.ZodBoolean;
        version: z.ZodNumber;
        editedAt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        origin: "generated" | "user-added";
        edited: boolean;
        pinned: boolean;
        version: number;
        editedAt?: string | undefined;
    }, {
        origin: "generated" | "user-added";
        edited: boolean;
        pinned: boolean;
        version: number;
        editedAt?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    summary: string;
    what_they_do: string;
    sources: string[];
    state?: {
        origin: "generated" | "user-added";
        edited: boolean;
        pinned: boolean;
        version: number;
        editedAt?: string | undefined;
    } | undefined;
}, {
    summary: string;
    what_they_do: string;
    sources: string[];
    state?: {
        origin: "generated" | "user-added";
        edited: boolean;
        pinned: boolean;
        version: number;
        editedAt?: string | undefined;
    } | undefined;
}>;
type CompanyBrief = z.infer<typeof CompanyBriefSchema>;
declare const RoleSchema: z.ZodObject<{
    title: z.ZodString;
    seniority: z.ZodString;
    responsibilities: z.ZodArray<z.ZodString, "many">;
    requirements: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
        kind: z.ZodEnum<["technical", "behavioural", "domain"]>;
        priority: z.ZodEnum<["must", "nice"]>;
        state: z.ZodOptional<z.ZodObject<{
            origin: z.ZodEnum<["generated", "user-added"]>;
            edited: z.ZodBoolean;
            pinned: z.ZodBoolean;
            version: z.ZodNumber;
            editedAt: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            origin: "generated" | "user-added";
            edited: boolean;
            pinned: boolean;
            version: number;
            editedAt?: string | undefined;
        }, {
            origin: "generated" | "user-added";
            edited: boolean;
            pinned: boolean;
            version: number;
            editedAt?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        text: string;
        kind: "technical" | "behavioural" | "domain";
        priority: "must" | "nice";
        state?: {
            origin: "generated" | "user-added";
            edited: boolean;
            pinned: boolean;
            version: number;
            editedAt?: string | undefined;
        } | undefined;
    }, {
        id: string;
        text: string;
        kind: "technical" | "behavioural" | "domain";
        priority: "must" | "nice";
        state?: {
            origin: "generated" | "user-added";
            edited: boolean;
            pinned: boolean;
            version: number;
            editedAt?: string | undefined;
        } | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    title: string;
    seniority: string;
    responsibilities: string[];
    requirements: {
        id: string;
        text: string;
        kind: "technical" | "behavioural" | "domain";
        priority: "must" | "nice";
        state?: {
            origin: "generated" | "user-added";
            edited: boolean;
            pinned: boolean;
            version: number;
            editedAt?: string | undefined;
        } | undefined;
    }[];
}, {
    title: string;
    seniority: string;
    responsibilities: string[];
    requirements: {
        id: string;
        text: string;
        kind: "technical" | "behavioural" | "domain";
        priority: "must" | "nice";
        state?: {
            origin: "generated" | "user-added";
            edited: boolean;
            pinned: boolean;
            version: number;
            editedAt?: string | undefined;
        } | undefined;
    }[];
}>;
type Role = z.infer<typeof RoleSchema>;
declare const KitSchema: z.ZodObject<{
    source: z.ZodObject<{
        company: z.ZodString;
        company_url: z.ZodString;
        role: z.ZodString;
        location: z.ZodString;
        jd_chars: z.ZodNumber;
        researched_at: z.ZodString;
        pages_used: z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            title: z.ZodOptional<z.ZodString>;
            relevanceScore: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            url: string;
            title?: string | undefined;
            relevanceScore?: number | undefined;
        }, {
            url: string;
            title?: string | undefined;
            relevanceScore?: number | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        company: string;
        company_url: string;
        role: string;
        location: string;
        jd_chars: number;
        researched_at: string;
        pages_used: {
            url: string;
            title?: string | undefined;
            relevanceScore?: number | undefined;
        }[];
    }, {
        company: string;
        company_url: string;
        role: string;
        location: string;
        jd_chars: number;
        researched_at: string;
        pages_used: {
            url: string;
            title?: string | undefined;
            relevanceScore?: number | undefined;
        }[];
    }>;
    company_brief: z.ZodObject<{
        summary: z.ZodString;
        what_they_do: z.ZodString;
        sources: z.ZodArray<z.ZodString, "many">;
        state: z.ZodOptional<z.ZodObject<{
            origin: z.ZodEnum<["generated", "user-added"]>;
            edited: z.ZodBoolean;
            pinned: z.ZodBoolean;
            version: z.ZodNumber;
            editedAt: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            origin: "generated" | "user-added";
            edited: boolean;
            pinned: boolean;
            version: number;
            editedAt?: string | undefined;
        }, {
            origin: "generated" | "user-added";
            edited: boolean;
            pinned: boolean;
            version: number;
            editedAt?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        summary: string;
        what_they_do: string;
        sources: string[];
        state?: {
            origin: "generated" | "user-added";
            edited: boolean;
            pinned: boolean;
            version: number;
            editedAt?: string | undefined;
        } | undefined;
    }, {
        summary: string;
        what_they_do: string;
        sources: string[];
        state?: {
            origin: "generated" | "user-added";
            edited: boolean;
            pinned: boolean;
            version: number;
            editedAt?: string | undefined;
        } | undefined;
    }>;
    role: z.ZodObject<{
        title: z.ZodString;
        seniority: z.ZodString;
        responsibilities: z.ZodArray<z.ZodString, "many">;
        requirements: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            text: z.ZodString;
            kind: z.ZodEnum<["technical", "behavioural", "domain"]>;
            priority: z.ZodEnum<["must", "nice"]>;
            state: z.ZodOptional<z.ZodObject<{
                origin: z.ZodEnum<["generated", "user-added"]>;
                edited: z.ZodBoolean;
                pinned: z.ZodBoolean;
                version: z.ZodNumber;
                editedAt: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                origin: "generated" | "user-added";
                edited: boolean;
                pinned: boolean;
                version: number;
                editedAt?: string | undefined;
            }, {
                origin: "generated" | "user-added";
                edited: boolean;
                pinned: boolean;
                version: number;
                editedAt?: string | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            text: string;
            kind: "technical" | "behavioural" | "domain";
            priority: "must" | "nice";
            state?: {
                origin: "generated" | "user-added";
                edited: boolean;
                pinned: boolean;
                version: number;
                editedAt?: string | undefined;
            } | undefined;
        }, {
            id: string;
            text: string;
            kind: "technical" | "behavioural" | "domain";
            priority: "must" | "nice";
            state?: {
                origin: "generated" | "user-added";
                edited: boolean;
                pinned: boolean;
                version: number;
                editedAt?: string | undefined;
            } | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        title: string;
        seniority: string;
        responsibilities: string[];
        requirements: {
            id: string;
            text: string;
            kind: "technical" | "behavioural" | "domain";
            priority: "must" | "nice";
            state?: {
                origin: "generated" | "user-added";
                edited: boolean;
                pinned: boolean;
                version: number;
                editedAt?: string | undefined;
            } | undefined;
        }[];
    }, {
        title: string;
        seniority: string;
        responsibilities: string[];
        requirements: {
            id: string;
            text: string;
            kind: "technical" | "behavioural" | "domain";
            priority: "must" | "nice";
            state?: {
                origin: "generated" | "user-added";
                edited: boolean;
                pinned: boolean;
                version: number;
                editedAt?: string | undefined;
            } | undefined;
        }[];
    }>;
    questions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        requirement_ids: z.ZodArray<z.ZodString, "many">;
        category: z.ZodEnum<["technical", "behavioural", "system-design", "company-fit"]>;
        prompt: z.ZodString;
        answer_outline: z.ZodString;
        difficulty: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>]>;
        state: z.ZodOptional<z.ZodObject<{
            origin: z.ZodEnum<["generated", "user-added"]>;
            edited: z.ZodBoolean;
            pinned: z.ZodBoolean;
            version: z.ZodNumber;
            editedAt: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            origin: "generated" | "user-added";
            edited: boolean;
            pinned: boolean;
            version: number;
            editedAt?: string | undefined;
        }, {
            origin: "generated" | "user-added";
            edited: boolean;
            pinned: boolean;
            version: number;
            editedAt?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        requirement_ids: string[];
        category: "technical" | "behavioural" | "system-design" | "company-fit";
        prompt: string;
        answer_outline: string;
        difficulty: 3 | 2 | 1;
        state?: {
            origin: "generated" | "user-added";
            edited: boolean;
            pinned: boolean;
            version: number;
            editedAt?: string | undefined;
        } | undefined;
    }, {
        id: string;
        requirement_ids: string[];
        category: "technical" | "behavioural" | "system-design" | "company-fit";
        prompt: string;
        answer_outline: string;
        difficulty: 3 | 2 | 1;
        state?: {
            origin: "generated" | "user-added";
            edited: boolean;
            pinned: boolean;
            version: number;
            editedAt?: string | undefined;
        } | undefined;
    }>, "many">;
    flashcards: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        front: z.ZodString;
        back: z.ZodString;
        requirement_ids: z.ZodArray<z.ZodString, "many">;
        state: z.ZodOptional<z.ZodObject<{
            origin: z.ZodEnum<["generated", "user-added"]>;
            edited: z.ZodBoolean;
            pinned: z.ZodBoolean;
            version: z.ZodNumber;
            editedAt: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            origin: "generated" | "user-added";
            edited: boolean;
            pinned: boolean;
            version: number;
            editedAt?: string | undefined;
        }, {
            origin: "generated" | "user-added";
            edited: boolean;
            pinned: boolean;
            version: number;
            editedAt?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        requirement_ids: string[];
        front: string;
        back: string;
        state?: {
            origin: "generated" | "user-added";
            edited: boolean;
            pinned: boolean;
            version: number;
            editedAt?: string | undefined;
        } | undefined;
    }, {
        id: string;
        requirement_ids: string[];
        front: string;
        back: string;
        state?: {
            origin: "generated" | "user-added";
            edited: boolean;
            pinned: boolean;
            version: number;
            editedAt?: string | undefined;
        } | undefined;
    }>, "many">;
    schedule: z.ZodObject<{
        days_available: z.ZodNumber;
        days: z.ZodArray<z.ZodObject<{
            day: z.ZodNumber;
            focus: z.ZodString;
            question_ids: z.ZodArray<z.ZodString, "many">;
            minutes: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            day: number;
            focus: string;
            question_ids: string[];
            minutes: number;
        }, {
            day: number;
            focus: string;
            question_ids: string[];
            minutes: number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        days_available: number;
        days: {
            day: number;
            focus: string;
            question_ids: string[];
            minutes: number;
        }[];
    }, {
        days_available: number;
        days: {
            day: number;
            focus: string;
            question_ids: string[];
            minutes: number;
        }[];
    }>;
    coverage: z.ZodObject<{
        uncovered_requirement_ids: z.ZodArray<z.ZodString, "many">;
        passes: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        uncovered_requirement_ids: string[];
        passes: number;
    }, {
        uncovered_requirement_ids: string[];
        passes: number;
    }>;
}, "strip", z.ZodTypeAny, {
    questions: {
        id: string;
        requirement_ids: string[];
        category: "technical" | "behavioural" | "system-design" | "company-fit";
        prompt: string;
        answer_outline: string;
        difficulty: 3 | 2 | 1;
        state?: {
            origin: "generated" | "user-added";
            edited: boolean;
            pinned: boolean;
            version: number;
            editedAt?: string | undefined;
        } | undefined;
    }[];
    flashcards: {
        id: string;
        requirement_ids: string[];
        front: string;
        back: string;
        state?: {
            origin: "generated" | "user-added";
            edited: boolean;
            pinned: boolean;
            version: number;
            editedAt?: string | undefined;
        } | undefined;
    }[];
    schedule: {
        days_available: number;
        days: {
            day: number;
            focus: string;
            question_ids: string[];
            minutes: number;
        }[];
    };
    role: {
        title: string;
        seniority: string;
        responsibilities: string[];
        requirements: {
            id: string;
            text: string;
            kind: "technical" | "behavioural" | "domain";
            priority: "must" | "nice";
            state?: {
                origin: "generated" | "user-added";
                edited: boolean;
                pinned: boolean;
                version: number;
                editedAt?: string | undefined;
            } | undefined;
        }[];
    };
    source: {
        company: string;
        company_url: string;
        role: string;
        location: string;
        jd_chars: number;
        researched_at: string;
        pages_used: {
            url: string;
            title?: string | undefined;
            relevanceScore?: number | undefined;
        }[];
    };
    company_brief: {
        summary: string;
        what_they_do: string;
        sources: string[];
        state?: {
            origin: "generated" | "user-added";
            edited: boolean;
            pinned: boolean;
            version: number;
            editedAt?: string | undefined;
        } | undefined;
    };
    coverage: {
        uncovered_requirement_ids: string[];
        passes: number;
    };
}, {
    questions: {
        id: string;
        requirement_ids: string[];
        category: "technical" | "behavioural" | "system-design" | "company-fit";
        prompt: string;
        answer_outline: string;
        difficulty: 3 | 2 | 1;
        state?: {
            origin: "generated" | "user-added";
            edited: boolean;
            pinned: boolean;
            version: number;
            editedAt?: string | undefined;
        } | undefined;
    }[];
    flashcards: {
        id: string;
        requirement_ids: string[];
        front: string;
        back: string;
        state?: {
            origin: "generated" | "user-added";
            edited: boolean;
            pinned: boolean;
            version: number;
            editedAt?: string | undefined;
        } | undefined;
    }[];
    schedule: {
        days_available: number;
        days: {
            day: number;
            focus: string;
            question_ids: string[];
            minutes: number;
        }[];
    };
    role: {
        title: string;
        seniority: string;
        responsibilities: string[];
        requirements: {
            id: string;
            text: string;
            kind: "technical" | "behavioural" | "domain";
            priority: "must" | "nice";
            state?: {
                origin: "generated" | "user-added";
                edited: boolean;
                pinned: boolean;
                version: number;
                editedAt?: string | undefined;
            } | undefined;
        }[];
    };
    source: {
        company: string;
        company_url: string;
        role: string;
        location: string;
        jd_chars: number;
        researched_at: string;
        pages_used: {
            url: string;
            title?: string | undefined;
            relevanceScore?: number | undefined;
        }[];
    };
    company_brief: {
        summary: string;
        what_they_do: string;
        sources: string[];
        state?: {
            origin: "generated" | "user-added";
            edited: boolean;
            pinned: boolean;
            version: number;
            editedAt?: string | undefined;
        } | undefined;
    };
    coverage: {
        uncovered_requirement_ids: string[];
        passes: number;
    };
}>;
type Kit = z.infer<typeof KitSchema>;
declare const GenerationProgressSchema: z.ZodObject<{
    status: z.ZodEnum<["queued", "running", "completed", "partial", "failed"]>;
    stage: z.ZodOptional<z.ZodEnum<["validating", "extracting_requirements", "researching_company", "finding_hiring_process", "researching_public_interviews", "generating_questions", "generating_flashcards", "checking_coverage", "closing_coverage_gaps", "allocating_schedule", "validating_kit", "saving", "completed"]>>;
    stageIndex: z.ZodOptional<z.ZodNumber>;
    totalStages: z.ZodOptional<z.ZodNumber>;
    percentage: z.ZodOptional<z.ZodNumber>;
    completedStages: z.ZodOptional<z.ZodArray<z.ZodEnum<["validating", "extracting_requirements", "researching_company", "finding_hiring_process", "researching_public_interviews", "generating_questions", "generating_flashcards", "checking_coverage", "closing_coverage_gaps", "allocating_schedule", "validating_kit", "saving", "completed"]>, "many">>;
    warnings: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    error: z.ZodOptional<z.ZodString>;
    startedAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "queued" | "running" | "completed" | "partial" | "failed";
    stage?: "completed" | "validating" | "extracting_requirements" | "researching_company" | "finding_hiring_process" | "researching_public_interviews" | "generating_questions" | "generating_flashcards" | "checking_coverage" | "closing_coverage_gaps" | "allocating_schedule" | "validating_kit" | "saving" | undefined;
    stageIndex?: number | undefined;
    totalStages?: number | undefined;
    percentage?: number | undefined;
    completedStages?: ("completed" | "validating" | "extracting_requirements" | "researching_company" | "finding_hiring_process" | "researching_public_interviews" | "generating_questions" | "generating_flashcards" | "checking_coverage" | "closing_coverage_gaps" | "allocating_schedule" | "validating_kit" | "saving")[] | undefined;
    warnings?: string[] | undefined;
    error?: string | undefined;
    startedAt?: string | undefined;
    updatedAt?: string | undefined;
}, {
    status: "queued" | "running" | "completed" | "partial" | "failed";
    stage?: "completed" | "validating" | "extracting_requirements" | "researching_company" | "finding_hiring_process" | "researching_public_interviews" | "generating_questions" | "generating_flashcards" | "checking_coverage" | "closing_coverage_gaps" | "allocating_schedule" | "validating_kit" | "saving" | undefined;
    stageIndex?: number | undefined;
    totalStages?: number | undefined;
    percentage?: number | undefined;
    completedStages?: ("completed" | "validating" | "extracting_requirements" | "researching_company" | "finding_hiring_process" | "researching_public_interviews" | "generating_questions" | "generating_flashcards" | "checking_coverage" | "closing_coverage_gaps" | "allocating_schedule" | "validating_kit" | "saving")[] | undefined;
    warnings?: string[] | undefined;
    error?: string | undefined;
    startedAt?: string | undefined;
    updatedAt?: string | undefined;
}>;
type GenerationProgress = z.infer<typeof GenerationProgressSchema>;
declare const CreateKitRequestSchema: z.ZodObject<{
    jobDescription: z.ZodString;
    companyUrl: z.ZodString;
    daysAvailable: z.ZodNumber;
    companyName: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    jobDescription: string;
    companyUrl: string;
    daysAvailable: number;
    role?: string | undefined;
    location?: string | undefined;
    companyName?: string | undefined;
}, {
    jobDescription: string;
    companyUrl: string;
    daysAvailable: number;
    role?: string | undefined;
    location?: string | undefined;
    companyName?: string | undefined;
}>;
type CreateKitRequest = z.infer<typeof CreateKitRequestSchema>;
declare const RegenerateRequestSchema: z.ZodObject<{
    section: z.ZodEnum<["company-brief", "questions", "flashcards", "schedule"]>;
    category: z.ZodOptional<z.ZodEnum<["technical", "behavioural", "system-design", "company-fit"]>>;
    expectedVersion: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    section: "company-brief" | "questions" | "flashcards" | "schedule";
    category?: "technical" | "behavioural" | "system-design" | "company-fit" | undefined;
    expectedVersion?: number | undefined;
}, {
    section: "company-brief" | "questions" | "flashcards" | "schedule";
    category?: "technical" | "behavioural" | "system-design" | "company-fit" | undefined;
    expectedVersion?: number | undefined;
}>;
type RegenerateRequest = z.infer<typeof RegenerateRequestSchema>;
declare const UpdateQuestionSchema: z.ZodObject<{
    prompt: z.ZodOptional<z.ZodString>;
    answer_outline: z.ZodOptional<z.ZodString>;
    difficulty: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>]>>;
    category: z.ZodOptional<z.ZodEnum<["technical", "behavioural", "system-design", "company-fit"]>>;
    requirement_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    pinned: z.ZodOptional<z.ZodBoolean>;
    order: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    pinned?: boolean | undefined;
    requirement_ids?: string[] | undefined;
    category?: "technical" | "behavioural" | "system-design" | "company-fit" | undefined;
    prompt?: string | undefined;
    answer_outline?: string | undefined;
    difficulty?: 3 | 2 | 1 | undefined;
    order?: number | undefined;
}, {
    pinned?: boolean | undefined;
    requirement_ids?: string[] | undefined;
    category?: "technical" | "behavioural" | "system-design" | "company-fit" | undefined;
    prompt?: string | undefined;
    answer_outline?: string | undefined;
    difficulty?: 3 | 2 | 1 | undefined;
    order?: number | undefined;
}>;
type UpdateQuestion = z.infer<typeof UpdateQuestionSchema>;
declare const CreateQuestionSchema: z.ZodObject<{
    requirement_ids: z.ZodArray<z.ZodString, "many">;
    category: z.ZodEnum<["technical", "behavioural", "system-design", "company-fit"]>;
    prompt: z.ZodString;
    answer_outline: z.ZodString;
    difficulty: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>]>;
}, "strip", z.ZodTypeAny, {
    requirement_ids: string[];
    category: "technical" | "behavioural" | "system-design" | "company-fit";
    prompt: string;
    answer_outline: string;
    difficulty: 3 | 2 | 1;
}, {
    requirement_ids: string[];
    category: "technical" | "behavioural" | "system-design" | "company-fit";
    prompt: string;
    answer_outline: string;
    difficulty: 3 | 2 | 1;
}>;
type CreateQuestion = z.infer<typeof CreateQuestionSchema>;
declare const UpdateFlashcardSchema: z.ZodObject<{
    front: z.ZodOptional<z.ZodString>;
    back: z.ZodOptional<z.ZodString>;
    requirement_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    pinned: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    pinned?: boolean | undefined;
    requirement_ids?: string[] | undefined;
    front?: string | undefined;
    back?: string | undefined;
}, {
    pinned?: boolean | undefined;
    requirement_ids?: string[] | undefined;
    front?: string | undefined;
    back?: string | undefined;
}>;
type UpdateFlashcard = z.infer<typeof UpdateFlashcardSchema>;
declare const CreateFlashcardSchema: z.ZodObject<{
    front: z.ZodString;
    back: z.ZodString;
    requirement_ids: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    requirement_ids: string[];
    front: string;
    back: string;
}, {
    requirement_ids: string[];
    front: string;
    back: string;
}>;
type CreateFlashcard = z.infer<typeof CreateFlashcardSchema>;
declare const UpdateCompanyBriefSchema: z.ZodObject<{
    summary: z.ZodOptional<z.ZodString>;
    what_they_do: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    summary?: string | undefined;
    what_they_do?: string | undefined;
}, {
    summary?: string | undefined;
    what_they_do?: string | undefined;
}>;
type UpdateCompanyBrief = z.infer<typeof UpdateCompanyBriefSchema>;
declare const PracticeRecordSchema: z.ZodObject<{
    flashcardId: z.ZodString;
    confidence: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>, z.ZodLiteral<5>]>;
}, "strip", z.ZodTypeAny, {
    flashcardId: string;
    confidence: 3 | 2 | 4 | 1 | 5;
}, {
    flashcardId: string;
    confidence: 3 | 2 | 4 | 1 | 5;
}>;
type PracticeRecord = z.infer<typeof PracticeRecordSchema>;
declare const RegisterRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    name: string;
}, {
    email: string;
    password: string;
    name: string;
}>;
type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
declare const LoginRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
type LoginRequest = z.infer<typeof LoginRequestSchema>;
declare const BatchCaseSchema: z.ZodObject<{
    id: z.ZodString;
    jd: z.ZodString;
    company_url: z.ZodString;
    days: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    days: number;
    company_url: string;
    jd: string;
}, {
    id: string;
    days: number;
    company_url: string;
    jd: string;
}>;
type BatchCase = z.infer<typeof BatchCaseSchema>;
declare const BatchInputSchema: z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    jd: z.ZodString;
    company_url: z.ZodString;
    days: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    days: number;
    company_url: string;
    jd: string;
}, {
    id: string;
    days: number;
    company_url: string;
    jd: string;
}>, "many">;
type BatchInput = z.infer<typeof BatchInputSchema>;
declare const BatchKitResultSchema: z.ZodObject<{
    id: z.ZodString;
    status: z.ZodEnum<["ok", "failed"]>;
    kit: z.ZodNullable<z.ZodObject<{
        source: z.ZodObject<{
            company: z.ZodString;
            company_url: z.ZodString;
            role: z.ZodString;
            location: z.ZodString;
            jd_chars: z.ZodNumber;
            researched_at: z.ZodString;
            pages_used: z.ZodArray<z.ZodObject<{
                url: z.ZodString;
                title: z.ZodOptional<z.ZodString>;
                relevanceScore: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                url: string;
                title?: string | undefined;
                relevanceScore?: number | undefined;
            }, {
                url: string;
                title?: string | undefined;
                relevanceScore?: number | undefined;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            company: string;
            company_url: string;
            role: string;
            location: string;
            jd_chars: number;
            researched_at: string;
            pages_used: {
                url: string;
                title?: string | undefined;
                relevanceScore?: number | undefined;
            }[];
        }, {
            company: string;
            company_url: string;
            role: string;
            location: string;
            jd_chars: number;
            researched_at: string;
            pages_used: {
                url: string;
                title?: string | undefined;
                relevanceScore?: number | undefined;
            }[];
        }>;
        company_brief: z.ZodObject<{
            summary: z.ZodString;
            what_they_do: z.ZodString;
            sources: z.ZodArray<z.ZodString, "many">;
            state: z.ZodOptional<z.ZodObject<{
                origin: z.ZodEnum<["generated", "user-added"]>;
                edited: z.ZodBoolean;
                pinned: z.ZodBoolean;
                version: z.ZodNumber;
                editedAt: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                origin: "generated" | "user-added";
                edited: boolean;
                pinned: boolean;
                version: number;
                editedAt?: string | undefined;
            }, {
                origin: "generated" | "user-added";
                edited: boolean;
                pinned: boolean;
                version: number;
                editedAt?: string | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            summary: string;
            what_they_do: string;
            sources: string[];
            state?: {
                origin: "generated" | "user-added";
                edited: boolean;
                pinned: boolean;
                version: number;
                editedAt?: string | undefined;
            } | undefined;
        }, {
            summary: string;
            what_they_do: string;
            sources: string[];
            state?: {
                origin: "generated" | "user-added";
                edited: boolean;
                pinned: boolean;
                version: number;
                editedAt?: string | undefined;
            } | undefined;
        }>;
        role: z.ZodObject<{
            title: z.ZodString;
            seniority: z.ZodString;
            responsibilities: z.ZodArray<z.ZodString, "many">;
            requirements: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                text: z.ZodString;
                kind: z.ZodEnum<["technical", "behavioural", "domain"]>;
                priority: z.ZodEnum<["must", "nice"]>;
                state: z.ZodOptional<z.ZodObject<{
                    origin: z.ZodEnum<["generated", "user-added"]>;
                    edited: z.ZodBoolean;
                    pinned: z.ZodBoolean;
                    version: z.ZodNumber;
                    editedAt: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                }, {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                id: string;
                text: string;
                kind: "technical" | "behavioural" | "domain";
                priority: "must" | "nice";
                state?: {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                } | undefined;
            }, {
                id: string;
                text: string;
                kind: "technical" | "behavioural" | "domain";
                priority: "must" | "nice";
                state?: {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                } | undefined;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            title: string;
            seniority: string;
            responsibilities: string[];
            requirements: {
                id: string;
                text: string;
                kind: "technical" | "behavioural" | "domain";
                priority: "must" | "nice";
                state?: {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                } | undefined;
            }[];
        }, {
            title: string;
            seniority: string;
            responsibilities: string[];
            requirements: {
                id: string;
                text: string;
                kind: "technical" | "behavioural" | "domain";
                priority: "must" | "nice";
                state?: {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                } | undefined;
            }[];
        }>;
        questions: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            requirement_ids: z.ZodArray<z.ZodString, "many">;
            category: z.ZodEnum<["technical", "behavioural", "system-design", "company-fit"]>;
            prompt: z.ZodString;
            answer_outline: z.ZodString;
            difficulty: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>]>;
            state: z.ZodOptional<z.ZodObject<{
                origin: z.ZodEnum<["generated", "user-added"]>;
                edited: z.ZodBoolean;
                pinned: z.ZodBoolean;
                version: z.ZodNumber;
                editedAt: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                origin: "generated" | "user-added";
                edited: boolean;
                pinned: boolean;
                version: number;
                editedAt?: string | undefined;
            }, {
                origin: "generated" | "user-added";
                edited: boolean;
                pinned: boolean;
                version: number;
                editedAt?: string | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            requirement_ids: string[];
            category: "technical" | "behavioural" | "system-design" | "company-fit";
            prompt: string;
            answer_outline: string;
            difficulty: 3 | 2 | 1;
            state?: {
                origin: "generated" | "user-added";
                edited: boolean;
                pinned: boolean;
                version: number;
                editedAt?: string | undefined;
            } | undefined;
        }, {
            id: string;
            requirement_ids: string[];
            category: "technical" | "behavioural" | "system-design" | "company-fit";
            prompt: string;
            answer_outline: string;
            difficulty: 3 | 2 | 1;
            state?: {
                origin: "generated" | "user-added";
                edited: boolean;
                pinned: boolean;
                version: number;
                editedAt?: string | undefined;
            } | undefined;
        }>, "many">;
        flashcards: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            front: z.ZodString;
            back: z.ZodString;
            requirement_ids: z.ZodArray<z.ZodString, "many">;
            state: z.ZodOptional<z.ZodObject<{
                origin: z.ZodEnum<["generated", "user-added"]>;
                edited: z.ZodBoolean;
                pinned: z.ZodBoolean;
                version: z.ZodNumber;
                editedAt: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                origin: "generated" | "user-added";
                edited: boolean;
                pinned: boolean;
                version: number;
                editedAt?: string | undefined;
            }, {
                origin: "generated" | "user-added";
                edited: boolean;
                pinned: boolean;
                version: number;
                editedAt?: string | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            requirement_ids: string[];
            front: string;
            back: string;
            state?: {
                origin: "generated" | "user-added";
                edited: boolean;
                pinned: boolean;
                version: number;
                editedAt?: string | undefined;
            } | undefined;
        }, {
            id: string;
            requirement_ids: string[];
            front: string;
            back: string;
            state?: {
                origin: "generated" | "user-added";
                edited: boolean;
                pinned: boolean;
                version: number;
                editedAt?: string | undefined;
            } | undefined;
        }>, "many">;
        schedule: z.ZodObject<{
            days_available: z.ZodNumber;
            days: z.ZodArray<z.ZodObject<{
                day: z.ZodNumber;
                focus: z.ZodString;
                question_ids: z.ZodArray<z.ZodString, "many">;
                minutes: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                day: number;
                focus: string;
                question_ids: string[];
                minutes: number;
            }, {
                day: number;
                focus: string;
                question_ids: string[];
                minutes: number;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            days_available: number;
            days: {
                day: number;
                focus: string;
                question_ids: string[];
                minutes: number;
            }[];
        }, {
            days_available: number;
            days: {
                day: number;
                focus: string;
                question_ids: string[];
                minutes: number;
            }[];
        }>;
        coverage: z.ZodObject<{
            uncovered_requirement_ids: z.ZodArray<z.ZodString, "many">;
            passes: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            uncovered_requirement_ids: string[];
            passes: number;
        }, {
            uncovered_requirement_ids: string[];
            passes: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        questions: {
            id: string;
            requirement_ids: string[];
            category: "technical" | "behavioural" | "system-design" | "company-fit";
            prompt: string;
            answer_outline: string;
            difficulty: 3 | 2 | 1;
            state?: {
                origin: "generated" | "user-added";
                edited: boolean;
                pinned: boolean;
                version: number;
                editedAt?: string | undefined;
            } | undefined;
        }[];
        flashcards: {
            id: string;
            requirement_ids: string[];
            front: string;
            back: string;
            state?: {
                origin: "generated" | "user-added";
                edited: boolean;
                pinned: boolean;
                version: number;
                editedAt?: string | undefined;
            } | undefined;
        }[];
        schedule: {
            days_available: number;
            days: {
                day: number;
                focus: string;
                question_ids: string[];
                minutes: number;
            }[];
        };
        role: {
            title: string;
            seniority: string;
            responsibilities: string[];
            requirements: {
                id: string;
                text: string;
                kind: "technical" | "behavioural" | "domain";
                priority: "must" | "nice";
                state?: {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                } | undefined;
            }[];
        };
        source: {
            company: string;
            company_url: string;
            role: string;
            location: string;
            jd_chars: number;
            researched_at: string;
            pages_used: {
                url: string;
                title?: string | undefined;
                relevanceScore?: number | undefined;
            }[];
        };
        company_brief: {
            summary: string;
            what_they_do: string;
            sources: string[];
            state?: {
                origin: "generated" | "user-added";
                edited: boolean;
                pinned: boolean;
                version: number;
                editedAt?: string | undefined;
            } | undefined;
        };
        coverage: {
            uncovered_requirement_ids: string[];
            passes: number;
        };
    }, {
        questions: {
            id: string;
            requirement_ids: string[];
            category: "technical" | "behavioural" | "system-design" | "company-fit";
            prompt: string;
            answer_outline: string;
            difficulty: 3 | 2 | 1;
            state?: {
                origin: "generated" | "user-added";
                edited: boolean;
                pinned: boolean;
                version: number;
                editedAt?: string | undefined;
            } | undefined;
        }[];
        flashcards: {
            id: string;
            requirement_ids: string[];
            front: string;
            back: string;
            state?: {
                origin: "generated" | "user-added";
                edited: boolean;
                pinned: boolean;
                version: number;
                editedAt?: string | undefined;
            } | undefined;
        }[];
        schedule: {
            days_available: number;
            days: {
                day: number;
                focus: string;
                question_ids: string[];
                minutes: number;
            }[];
        };
        role: {
            title: string;
            seniority: string;
            responsibilities: string[];
            requirements: {
                id: string;
                text: string;
                kind: "technical" | "behavioural" | "domain";
                priority: "must" | "nice";
                state?: {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                } | undefined;
            }[];
        };
        source: {
            company: string;
            company_url: string;
            role: string;
            location: string;
            jd_chars: number;
            researched_at: string;
            pages_used: {
                url: string;
                title?: string | undefined;
                relevanceScore?: number | undefined;
            }[];
        };
        company_brief: {
            summary: string;
            what_they_do: string;
            sources: string[];
            state?: {
                origin: "generated" | "user-added";
                edited: boolean;
                pinned: boolean;
                version: number;
                editedAt?: string | undefined;
            } | undefined;
        };
        coverage: {
            uncovered_requirement_ids: string[];
            passes: number;
        };
    }>>;
    error: z.ZodNullable<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
    }, {
        code: string;
        message: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    status: "failed" | "ok";
    id: string;
    error: {
        code: string;
        message: string;
    } | null;
    kit: {
        questions: {
            id: string;
            requirement_ids: string[];
            category: "technical" | "behavioural" | "system-design" | "company-fit";
            prompt: string;
            answer_outline: string;
            difficulty: 3 | 2 | 1;
            state?: {
                origin: "generated" | "user-added";
                edited: boolean;
                pinned: boolean;
                version: number;
                editedAt?: string | undefined;
            } | undefined;
        }[];
        flashcards: {
            id: string;
            requirement_ids: string[];
            front: string;
            back: string;
            state?: {
                origin: "generated" | "user-added";
                edited: boolean;
                pinned: boolean;
                version: number;
                editedAt?: string | undefined;
            } | undefined;
        }[];
        schedule: {
            days_available: number;
            days: {
                day: number;
                focus: string;
                question_ids: string[];
                minutes: number;
            }[];
        };
        role: {
            title: string;
            seniority: string;
            responsibilities: string[];
            requirements: {
                id: string;
                text: string;
                kind: "technical" | "behavioural" | "domain";
                priority: "must" | "nice";
                state?: {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                } | undefined;
            }[];
        };
        source: {
            company: string;
            company_url: string;
            role: string;
            location: string;
            jd_chars: number;
            researched_at: string;
            pages_used: {
                url: string;
                title?: string | undefined;
                relevanceScore?: number | undefined;
            }[];
        };
        company_brief: {
            summary: string;
            what_they_do: string;
            sources: string[];
            state?: {
                origin: "generated" | "user-added";
                edited: boolean;
                pinned: boolean;
                version: number;
                editedAt?: string | undefined;
            } | undefined;
        };
        coverage: {
            uncovered_requirement_ids: string[];
            passes: number;
        };
    } | null;
}, {
    status: "failed" | "ok";
    id: string;
    error: {
        code: string;
        message: string;
    } | null;
    kit: {
        questions: {
            id: string;
            requirement_ids: string[];
            category: "technical" | "behavioural" | "system-design" | "company-fit";
            prompt: string;
            answer_outline: string;
            difficulty: 3 | 2 | 1;
            state?: {
                origin: "generated" | "user-added";
                edited: boolean;
                pinned: boolean;
                version: number;
                editedAt?: string | undefined;
            } | undefined;
        }[];
        flashcards: {
            id: string;
            requirement_ids: string[];
            front: string;
            back: string;
            state?: {
                origin: "generated" | "user-added";
                edited: boolean;
                pinned: boolean;
                version: number;
                editedAt?: string | undefined;
            } | undefined;
        }[];
        schedule: {
            days_available: number;
            days: {
                day: number;
                focus: string;
                question_ids: string[];
                minutes: number;
            }[];
        };
        role: {
            title: string;
            seniority: string;
            responsibilities: string[];
            requirements: {
                id: string;
                text: string;
                kind: "technical" | "behavioural" | "domain";
                priority: "must" | "nice";
                state?: {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                } | undefined;
            }[];
        };
        source: {
            company: string;
            company_url: string;
            role: string;
            location: string;
            jd_chars: number;
            researched_at: string;
            pages_used: {
                url: string;
                title?: string | undefined;
                relevanceScore?: number | undefined;
            }[];
        };
        company_brief: {
            summary: string;
            what_they_do: string;
            sources: string[];
            state?: {
                origin: "generated" | "user-added";
                edited: boolean;
                pinned: boolean;
                version: number;
                editedAt?: string | undefined;
            } | undefined;
        };
        coverage: {
            uncovered_requirement_ids: string[];
            passes: number;
        };
    } | null;
}>;
type BatchKitResult = z.infer<typeof BatchKitResultSchema>;
declare const BatchOutputSchema: z.ZodObject<{
    version: z.ZodLiteral<"1.0">;
    generated_at: z.ZodString;
    kits: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        status: z.ZodEnum<["ok", "failed"]>;
        kit: z.ZodNullable<z.ZodObject<{
            source: z.ZodObject<{
                company: z.ZodString;
                company_url: z.ZodString;
                role: z.ZodString;
                location: z.ZodString;
                jd_chars: z.ZodNumber;
                researched_at: z.ZodString;
                pages_used: z.ZodArray<z.ZodObject<{
                    url: z.ZodString;
                    title: z.ZodOptional<z.ZodString>;
                    relevanceScore: z.ZodOptional<z.ZodNumber>;
                }, "strip", z.ZodTypeAny, {
                    url: string;
                    title?: string | undefined;
                    relevanceScore?: number | undefined;
                }, {
                    url: string;
                    title?: string | undefined;
                    relevanceScore?: number | undefined;
                }>, "many">;
            }, "strip", z.ZodTypeAny, {
                company: string;
                company_url: string;
                role: string;
                location: string;
                jd_chars: number;
                researched_at: string;
                pages_used: {
                    url: string;
                    title?: string | undefined;
                    relevanceScore?: number | undefined;
                }[];
            }, {
                company: string;
                company_url: string;
                role: string;
                location: string;
                jd_chars: number;
                researched_at: string;
                pages_used: {
                    url: string;
                    title?: string | undefined;
                    relevanceScore?: number | undefined;
                }[];
            }>;
            company_brief: z.ZodObject<{
                summary: z.ZodString;
                what_they_do: z.ZodString;
                sources: z.ZodArray<z.ZodString, "many">;
                state: z.ZodOptional<z.ZodObject<{
                    origin: z.ZodEnum<["generated", "user-added"]>;
                    edited: z.ZodBoolean;
                    pinned: z.ZodBoolean;
                    version: z.ZodNumber;
                    editedAt: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                }, {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                summary: string;
                what_they_do: string;
                sources: string[];
                state?: {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                } | undefined;
            }, {
                summary: string;
                what_they_do: string;
                sources: string[];
                state?: {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                } | undefined;
            }>;
            role: z.ZodObject<{
                title: z.ZodString;
                seniority: z.ZodString;
                responsibilities: z.ZodArray<z.ZodString, "many">;
                requirements: z.ZodArray<z.ZodObject<{
                    id: z.ZodString;
                    text: z.ZodString;
                    kind: z.ZodEnum<["technical", "behavioural", "domain"]>;
                    priority: z.ZodEnum<["must", "nice"]>;
                    state: z.ZodOptional<z.ZodObject<{
                        origin: z.ZodEnum<["generated", "user-added"]>;
                        edited: z.ZodBoolean;
                        pinned: z.ZodBoolean;
                        version: z.ZodNumber;
                        editedAt: z.ZodOptional<z.ZodString>;
                    }, "strip", z.ZodTypeAny, {
                        origin: "generated" | "user-added";
                        edited: boolean;
                        pinned: boolean;
                        version: number;
                        editedAt?: string | undefined;
                    }, {
                        origin: "generated" | "user-added";
                        edited: boolean;
                        pinned: boolean;
                        version: number;
                        editedAt?: string | undefined;
                    }>>;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    text: string;
                    kind: "technical" | "behavioural" | "domain";
                    priority: "must" | "nice";
                    state?: {
                        origin: "generated" | "user-added";
                        edited: boolean;
                        pinned: boolean;
                        version: number;
                        editedAt?: string | undefined;
                    } | undefined;
                }, {
                    id: string;
                    text: string;
                    kind: "technical" | "behavioural" | "domain";
                    priority: "must" | "nice";
                    state?: {
                        origin: "generated" | "user-added";
                        edited: boolean;
                        pinned: boolean;
                        version: number;
                        editedAt?: string | undefined;
                    } | undefined;
                }>, "many">;
            }, "strip", z.ZodTypeAny, {
                title: string;
                seniority: string;
                responsibilities: string[];
                requirements: {
                    id: string;
                    text: string;
                    kind: "technical" | "behavioural" | "domain";
                    priority: "must" | "nice";
                    state?: {
                        origin: "generated" | "user-added";
                        edited: boolean;
                        pinned: boolean;
                        version: number;
                        editedAt?: string | undefined;
                    } | undefined;
                }[];
            }, {
                title: string;
                seniority: string;
                responsibilities: string[];
                requirements: {
                    id: string;
                    text: string;
                    kind: "technical" | "behavioural" | "domain";
                    priority: "must" | "nice";
                    state?: {
                        origin: "generated" | "user-added";
                        edited: boolean;
                        pinned: boolean;
                        version: number;
                        editedAt?: string | undefined;
                    } | undefined;
                }[];
            }>;
            questions: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                requirement_ids: z.ZodArray<z.ZodString, "many">;
                category: z.ZodEnum<["technical", "behavioural", "system-design", "company-fit"]>;
                prompt: z.ZodString;
                answer_outline: z.ZodString;
                difficulty: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>]>;
                state: z.ZodOptional<z.ZodObject<{
                    origin: z.ZodEnum<["generated", "user-added"]>;
                    edited: z.ZodBoolean;
                    pinned: z.ZodBoolean;
                    version: z.ZodNumber;
                    editedAt: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                }, {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                id: string;
                requirement_ids: string[];
                category: "technical" | "behavioural" | "system-design" | "company-fit";
                prompt: string;
                answer_outline: string;
                difficulty: 3 | 2 | 1;
                state?: {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                } | undefined;
            }, {
                id: string;
                requirement_ids: string[];
                category: "technical" | "behavioural" | "system-design" | "company-fit";
                prompt: string;
                answer_outline: string;
                difficulty: 3 | 2 | 1;
                state?: {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                } | undefined;
            }>, "many">;
            flashcards: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                front: z.ZodString;
                back: z.ZodString;
                requirement_ids: z.ZodArray<z.ZodString, "many">;
                state: z.ZodOptional<z.ZodObject<{
                    origin: z.ZodEnum<["generated", "user-added"]>;
                    edited: z.ZodBoolean;
                    pinned: z.ZodBoolean;
                    version: z.ZodNumber;
                    editedAt: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                }, {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                id: string;
                requirement_ids: string[];
                front: string;
                back: string;
                state?: {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                } | undefined;
            }, {
                id: string;
                requirement_ids: string[];
                front: string;
                back: string;
                state?: {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                } | undefined;
            }>, "many">;
            schedule: z.ZodObject<{
                days_available: z.ZodNumber;
                days: z.ZodArray<z.ZodObject<{
                    day: z.ZodNumber;
                    focus: z.ZodString;
                    question_ids: z.ZodArray<z.ZodString, "many">;
                    minutes: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    day: number;
                    focus: string;
                    question_ids: string[];
                    minutes: number;
                }, {
                    day: number;
                    focus: string;
                    question_ids: string[];
                    minutes: number;
                }>, "many">;
            }, "strip", z.ZodTypeAny, {
                days_available: number;
                days: {
                    day: number;
                    focus: string;
                    question_ids: string[];
                    minutes: number;
                }[];
            }, {
                days_available: number;
                days: {
                    day: number;
                    focus: string;
                    question_ids: string[];
                    minutes: number;
                }[];
            }>;
            coverage: z.ZodObject<{
                uncovered_requirement_ids: z.ZodArray<z.ZodString, "many">;
                passes: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                uncovered_requirement_ids: string[];
                passes: number;
            }, {
                uncovered_requirement_ids: string[];
                passes: number;
            }>;
        }, "strip", z.ZodTypeAny, {
            questions: {
                id: string;
                requirement_ids: string[];
                category: "technical" | "behavioural" | "system-design" | "company-fit";
                prompt: string;
                answer_outline: string;
                difficulty: 3 | 2 | 1;
                state?: {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                } | undefined;
            }[];
            flashcards: {
                id: string;
                requirement_ids: string[];
                front: string;
                back: string;
                state?: {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                } | undefined;
            }[];
            schedule: {
                days_available: number;
                days: {
                    day: number;
                    focus: string;
                    question_ids: string[];
                    minutes: number;
                }[];
            };
            role: {
                title: string;
                seniority: string;
                responsibilities: string[];
                requirements: {
                    id: string;
                    text: string;
                    kind: "technical" | "behavioural" | "domain";
                    priority: "must" | "nice";
                    state?: {
                        origin: "generated" | "user-added";
                        edited: boolean;
                        pinned: boolean;
                        version: number;
                        editedAt?: string | undefined;
                    } | undefined;
                }[];
            };
            source: {
                company: string;
                company_url: string;
                role: string;
                location: string;
                jd_chars: number;
                researched_at: string;
                pages_used: {
                    url: string;
                    title?: string | undefined;
                    relevanceScore?: number | undefined;
                }[];
            };
            company_brief: {
                summary: string;
                what_they_do: string;
                sources: string[];
                state?: {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                } | undefined;
            };
            coverage: {
                uncovered_requirement_ids: string[];
                passes: number;
            };
        }, {
            questions: {
                id: string;
                requirement_ids: string[];
                category: "technical" | "behavioural" | "system-design" | "company-fit";
                prompt: string;
                answer_outline: string;
                difficulty: 3 | 2 | 1;
                state?: {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                } | undefined;
            }[];
            flashcards: {
                id: string;
                requirement_ids: string[];
                front: string;
                back: string;
                state?: {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                } | undefined;
            }[];
            schedule: {
                days_available: number;
                days: {
                    day: number;
                    focus: string;
                    question_ids: string[];
                    minutes: number;
                }[];
            };
            role: {
                title: string;
                seniority: string;
                responsibilities: string[];
                requirements: {
                    id: string;
                    text: string;
                    kind: "technical" | "behavioural" | "domain";
                    priority: "must" | "nice";
                    state?: {
                        origin: "generated" | "user-added";
                        edited: boolean;
                        pinned: boolean;
                        version: number;
                        editedAt?: string | undefined;
                    } | undefined;
                }[];
            };
            source: {
                company: string;
                company_url: string;
                role: string;
                location: string;
                jd_chars: number;
                researched_at: string;
                pages_used: {
                    url: string;
                    title?: string | undefined;
                    relevanceScore?: number | undefined;
                }[];
            };
            company_brief: {
                summary: string;
                what_they_do: string;
                sources: string[];
                state?: {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                } | undefined;
            };
            coverage: {
                uncovered_requirement_ids: string[];
                passes: number;
            };
        }>>;
        error: z.ZodNullable<z.ZodObject<{
            code: z.ZodString;
            message: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            code: string;
            message: string;
        }, {
            code: string;
            message: string;
        }>>;
    }, "strip", z.ZodTypeAny, {
        status: "failed" | "ok";
        id: string;
        error: {
            code: string;
            message: string;
        } | null;
        kit: {
            questions: {
                id: string;
                requirement_ids: string[];
                category: "technical" | "behavioural" | "system-design" | "company-fit";
                prompt: string;
                answer_outline: string;
                difficulty: 3 | 2 | 1;
                state?: {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                } | undefined;
            }[];
            flashcards: {
                id: string;
                requirement_ids: string[];
                front: string;
                back: string;
                state?: {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                } | undefined;
            }[];
            schedule: {
                days_available: number;
                days: {
                    day: number;
                    focus: string;
                    question_ids: string[];
                    minutes: number;
                }[];
            };
            role: {
                title: string;
                seniority: string;
                responsibilities: string[];
                requirements: {
                    id: string;
                    text: string;
                    kind: "technical" | "behavioural" | "domain";
                    priority: "must" | "nice";
                    state?: {
                        origin: "generated" | "user-added";
                        edited: boolean;
                        pinned: boolean;
                        version: number;
                        editedAt?: string | undefined;
                    } | undefined;
                }[];
            };
            source: {
                company: string;
                company_url: string;
                role: string;
                location: string;
                jd_chars: number;
                researched_at: string;
                pages_used: {
                    url: string;
                    title?: string | undefined;
                    relevanceScore?: number | undefined;
                }[];
            };
            company_brief: {
                summary: string;
                what_they_do: string;
                sources: string[];
                state?: {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                } | undefined;
            };
            coverage: {
                uncovered_requirement_ids: string[];
                passes: number;
            };
        } | null;
    }, {
        status: "failed" | "ok";
        id: string;
        error: {
            code: string;
            message: string;
        } | null;
        kit: {
            questions: {
                id: string;
                requirement_ids: string[];
                category: "technical" | "behavioural" | "system-design" | "company-fit";
                prompt: string;
                answer_outline: string;
                difficulty: 3 | 2 | 1;
                state?: {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                } | undefined;
            }[];
            flashcards: {
                id: string;
                requirement_ids: string[];
                front: string;
                back: string;
                state?: {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                } | undefined;
            }[];
            schedule: {
                days_available: number;
                days: {
                    day: number;
                    focus: string;
                    question_ids: string[];
                    minutes: number;
                }[];
            };
            role: {
                title: string;
                seniority: string;
                responsibilities: string[];
                requirements: {
                    id: string;
                    text: string;
                    kind: "technical" | "behavioural" | "domain";
                    priority: "must" | "nice";
                    state?: {
                        origin: "generated" | "user-added";
                        edited: boolean;
                        pinned: boolean;
                        version: number;
                        editedAt?: string | undefined;
                    } | undefined;
                }[];
            };
            source: {
                company: string;
                company_url: string;
                role: string;
                location: string;
                jd_chars: number;
                researched_at: string;
                pages_used: {
                    url: string;
                    title?: string | undefined;
                    relevanceScore?: number | undefined;
                }[];
            };
            company_brief: {
                summary: string;
                what_they_do: string;
                sources: string[];
                state?: {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                } | undefined;
            };
            coverage: {
                uncovered_requirement_ids: string[];
                passes: number;
            };
        } | null;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    version: "1.0";
    generated_at: string;
    kits: {
        status: "failed" | "ok";
        id: string;
        error: {
            code: string;
            message: string;
        } | null;
        kit: {
            questions: {
                id: string;
                requirement_ids: string[];
                category: "technical" | "behavioural" | "system-design" | "company-fit";
                prompt: string;
                answer_outline: string;
                difficulty: 3 | 2 | 1;
                state?: {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                } | undefined;
            }[];
            flashcards: {
                id: string;
                requirement_ids: string[];
                front: string;
                back: string;
                state?: {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                } | undefined;
            }[];
            schedule: {
                days_available: number;
                days: {
                    day: number;
                    focus: string;
                    question_ids: string[];
                    minutes: number;
                }[];
            };
            role: {
                title: string;
                seniority: string;
                responsibilities: string[];
                requirements: {
                    id: string;
                    text: string;
                    kind: "technical" | "behavioural" | "domain";
                    priority: "must" | "nice";
                    state?: {
                        origin: "generated" | "user-added";
                        edited: boolean;
                        pinned: boolean;
                        version: number;
                        editedAt?: string | undefined;
                    } | undefined;
                }[];
            };
            source: {
                company: string;
                company_url: string;
                role: string;
                location: string;
                jd_chars: number;
                researched_at: string;
                pages_used: {
                    url: string;
                    title?: string | undefined;
                    relevanceScore?: number | undefined;
                }[];
            };
            company_brief: {
                summary: string;
                what_they_do: string;
                sources: string[];
                state?: {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                } | undefined;
            };
            coverage: {
                uncovered_requirement_ids: string[];
                passes: number;
            };
        } | null;
    }[];
}, {
    version: "1.0";
    generated_at: string;
    kits: {
        status: "failed" | "ok";
        id: string;
        error: {
            code: string;
            message: string;
        } | null;
        kit: {
            questions: {
                id: string;
                requirement_ids: string[];
                category: "technical" | "behavioural" | "system-design" | "company-fit";
                prompt: string;
                answer_outline: string;
                difficulty: 3 | 2 | 1;
                state?: {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                } | undefined;
            }[];
            flashcards: {
                id: string;
                requirement_ids: string[];
                front: string;
                back: string;
                state?: {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                } | undefined;
            }[];
            schedule: {
                days_available: number;
                days: {
                    day: number;
                    focus: string;
                    question_ids: string[];
                    minutes: number;
                }[];
            };
            role: {
                title: string;
                seniority: string;
                responsibilities: string[];
                requirements: {
                    id: string;
                    text: string;
                    kind: "technical" | "behavioural" | "domain";
                    priority: "must" | "nice";
                    state?: {
                        origin: "generated" | "user-added";
                        edited: boolean;
                        pinned: boolean;
                        version: number;
                        editedAt?: string | undefined;
                    } | undefined;
                }[];
            };
            source: {
                company: string;
                company_url: string;
                role: string;
                location: string;
                jd_chars: number;
                researched_at: string;
                pages_used: {
                    url: string;
                    title?: string | undefined;
                    relevanceScore?: number | undefined;
                }[];
            };
            company_brief: {
                summary: string;
                what_they_do: string;
                sources: string[];
                state?: {
                    origin: "generated" | "user-added";
                    edited: boolean;
                    pinned: boolean;
                    version: number;
                    editedAt?: string | undefined;
                } | undefined;
            };
            coverage: {
                uncovered_requirement_ids: string[];
                passes: number;
            };
        } | null;
    }[];
}>;
type BatchOutput = z.infer<typeof BatchOutputSchema>;
interface ApiResponse<T> {
    success: true;
    data: T;
}
interface ApiError {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
}
type ApiResult<T> = ApiResponse<T> | ApiError;
interface UserPublic {
    id: string;
    email: string;
    name: string;
    createdAt: string;
}
interface KitListItem {
    id: string;
    company: string;
    role: string;
    status: string;
    daysAvailable: number;
    createdAt: string;
    updatedAt: string;
    progress?: GenerationProgress;
}
interface KitDetail extends KitListItem {
    kit: Kit;
    version: number;
}
interface PracticeSession {
    flashcardId: string;
    confidence: number;
    practicedAt: string;
}
interface FlashcardWithProgress extends Flashcard {
    lastConfidence?: number;
    lastPracticedAt?: string;
    practiceCount: number;
    priorityScore: number;
}
interface WeaknessRadarItem {
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
interface WeaknessRadar {
    items: WeaknessRadarItem[];
    overallReadiness: number;
    criticalCount: number;
    strongCount: number;
    recommendations: string[];
}

declare const ErrorCodes: {
    readonly INVALID_INPUT: "INVALID_INPUT";
    readonly INVALID_URL: "INVALID_URL";
    readonly UNAUTHENTICATED: "UNAUTHENTICATED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly USER_EXISTS: "USER_EXISTS";
    readonly INVALID_CREDENTIALS: "INVALID_CREDENTIALS";
    readonly KIT_NOT_FOUND: "KIT_NOT_FOUND";
    readonly KIT_NOT_READY: "KIT_NOT_READY";
    readonly KIT_ALREADY_RUNNING: "KIT_ALREADY_RUNNING";
    readonly KIT_VALIDATION_FAILED: "KIT_VALIDATION_FAILED";
    readonly GENERATION_FAILED: "GENERATION_FAILED";
    readonly CONCURRENT_UPDATE: "CONCURRENT_UPDATE";
    readonly COMPANY_URL_INVALID: "COMPANY_URL_INVALID";
    readonly COMPANY_UNREACHABLE: "COMPANY_UNREACHABLE";
    readonly COMPANY_TIMEOUT: "COMPANY_TIMEOUT";
    readonly ROBOTS_DENIED: "ROBOTS_DENIED";
    readonly CONTENT_TYPE_UNSUPPORTED: "CONTENT_TYPE_UNSUPPORTED";
    readonly SSRF_BLOCKED: "SSRF_BLOCKED";
    readonly REDIRECT_UNSAFE: "REDIRECT_UNSAFE";
    readonly LLM_RATE_LIMITED: "LLM_RATE_LIMITED";
    readonly LLM_INVALID_OUTPUT: "LLM_INVALID_OUTPUT";
    readonly LLM_PROVIDER_ERROR: "LLM_PROVIDER_ERROR";
    readonly QUESTION_NOT_FOUND: "QUESTION_NOT_FOUND";
    readonly FLASHCARD_NOT_FOUND: "FLASHCARD_NOT_FOUND";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly RATE_LIMITED: "RATE_LIMITED";
};
type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

declare const REQUIREMENT_KINDS: readonly ["technical", "behavioural", "domain"];
declare const REQUIREMENT_PRIORITIES: readonly ["must", "nice"];
declare const QUESTION_CATEGORIES: readonly ["technical", "behavioural", "system-design", "company-fit"];
declare const DIFFICULTY_LEVELS: readonly [1, 2, 3];
declare const CONFIDENCE_LEVELS: readonly [1, 2, 3, 4, 5];
declare const KIT_STATUSES: readonly ["queued", "running", "completed", "partial", "failed"];
declare const GENERATION_STAGES: readonly ["validating", "extracting_requirements", "researching_company", "finding_hiring_process", "researching_public_interviews", "generating_questions", "generating_flashcards", "checking_coverage", "closing_coverage_gaps", "allocating_schedule", "validating_kit", "saving", "completed"];
declare const ENTITY_ORIGINS: readonly ["generated", "user-added"];
declare const REGENERATABLE_SECTIONS: readonly ["company-brief", "questions", "flashcards", "schedule"];
declare const MAX_COVERAGE_PASSES = 3;
declare const MAX_CRAWLER_PAGES = 15;
declare const CRAWLER_TIMEOUT_MS = 10000;
declare const CRAWLER_MAX_RESPONSE_BYTES: number;
declare const CRAWLER_CONCURRENCY = 2;
declare const CRAWLER_RATE_LIMIT_MS = 500;
declare const MAX_LLM_CONCURRENCY = 2;
declare const LLM_MAX_RETRIES = 3;
declare const MINUTES_PER_QUESTION = 20;
declare const MAX_MINUTES_PER_DAY = 180;
declare const MIN_MINUTES_PER_DAY = 20;
declare const REQUIREMENT_PRIORITY_WEIGHT: {
    readonly must: 2;
    readonly nice: 1;
};
declare const RECENCY_DECAY_DAYS = 7;
type RequirementKind = (typeof REQUIREMENT_KINDS)[number];
type RequirementPriority = (typeof REQUIREMENT_PRIORITIES)[number];
type QuestionCategory = (typeof QUESTION_CATEGORIES)[number];
type KitStatus = (typeof KIT_STATUSES)[number];
type GenerationStage = (typeof GENERATION_STAGES)[number];
type EntityOrigin = (typeof ENTITY_ORIGINS)[number];
type RegeneratableSection = (typeof REGENERATABLE_SECTIONS)[number];

export { type ApiError, type ApiResponse, type ApiResult, type BatchCase, BatchCaseSchema, type BatchInput, BatchInputSchema, type BatchKitResult, BatchKitResultSchema, type BatchOutput, BatchOutputSchema, CONFIDENCE_LEVELS, CRAWLER_CONCURRENCY, CRAWLER_MAX_RESPONSE_BYTES, CRAWLER_RATE_LIMIT_MS, CRAWLER_TIMEOUT_MS, type CompanyBrief, CompanyBriefSchema, ConfidenceSchema, type Coverage, CoverageSchema, type CreateFlashcard, CreateFlashcardSchema, type CreateKitRequest, CreateKitRequestSchema, type CreateQuestion, CreateQuestionSchema, DIFFICULTY_LEVELS, DifficultySchema, ENTITY_ORIGINS, type EntityOrigin, EntityOriginSchema, type EntityState, EntityStateSchema, type ErrorCode, ErrorCodes, type Flashcard, FlashcardSchema, type FlashcardWithProgress, GENERATION_STAGES, type GenerationProgress, GenerationProgressSchema, type GenerationStage, GenerationStageSchema, KIT_STATUSES, type Kit, type KitDetail, type KitListItem, KitSchema, type KitSource, KitSourceSchema, type KitStatus, KitStatusSchema, LLM_MAX_RETRIES, type LoginRequest, LoginRequestSchema, MAX_COVERAGE_PASSES, MAX_CRAWLER_PAGES, MAX_LLM_CONCURRENCY, MAX_MINUTES_PER_DAY, MINUTES_PER_QUESTION, MIN_MINUTES_PER_DAY, type PracticeRecord, PracticeRecordSchema, type PracticeSession, QUESTION_CATEGORIES, type Question, type QuestionCategory, QuestionCategorySchema, QuestionSchema, RECENCY_DECAY_DAYS, REGENERATABLE_SECTIONS, REQUIREMENT_KINDS, REQUIREMENT_PRIORITIES, REQUIREMENT_PRIORITY_WEIGHT, type RegeneratableSection, RegeneratableSectionSchema, type RegenerateRequest, RegenerateRequestSchema, type RegisterRequest, RegisterRequestSchema, type Requirement, type RequirementKind, RequirementKindSchema, type RequirementPriority, RequirementPrioritySchema, RequirementSchema, type Role, RoleSchema, type Schedule, type ScheduleDay, ScheduleDaySchema, ScheduleSchema, type SourcePage, SourcePageSchema, type UpdateCompanyBrief, UpdateCompanyBriefSchema, type UpdateFlashcard, UpdateFlashcardSchema, type UpdateQuestion, UpdateQuestionSchema, type UserPublic, type WeaknessRadar, type WeaknessRadarItem };
