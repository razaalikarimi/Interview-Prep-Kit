// ============================================================
// LLM CLIENT ABSTRACTION
//
// Provider-agnostic interface. Swap implementations by
// changing LLM_PROVIDER env var and implementing this interface.
// ============================================================

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  text: string;
  finishReason: 'stop' | 'length' | 'error' | 'unknown';
  tokensUsed?: number | undefined;
}

export interface LLMGenerateOptions {
  maxTokens?: number | undefined;
  temperature?: number | undefined;
  /** Request JSON output mode if provider supports it */
  jsonMode?: boolean | undefined;
  /** System prompt (separate from messages) */
  systemPrompt?: string | undefined;
}

export interface ILLMClient {
  /**
   * Generate a response from the LLM.
   * @param messages Conversation history
   * @param options Generation options
   */
  generate(messages: LLMMessage[], options?: LLMGenerateOptions): Promise<LLMResponse>;

  /**
   * Generate structured JSON output.
   * Falls back to text parsing if provider doesn't support JSON mode.
   */
  generateJSON<T>(
    messages: LLMMessage[],
    options?: LLMGenerateOptions,
  ): Promise<{ raw: string; parsed: T | null; error?: string | undefined }>;
}

export class LLMError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly retryable: boolean = false,
    public readonly retryAfterMs?: number | undefined,
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

