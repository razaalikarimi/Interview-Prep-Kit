import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  type GenerateContentRequest,
} from '@google/generative-ai';
import {
  type ILLMClient,
  type LLMMessage,
  type LLMResponse,
  type LLMGenerateOptions,
  LLMError,
} from './client.js';
import { ErrorCodes, MAX_LLM_CONCURRENCY, LLM_MAX_RETRIES } from '@interview-prep/shared';
import { logger } from '../../utils/logger.js';

// ============================================================
// GEMINI LLM CLIENT IMPLEMENTATION
//
// - Concurrency limited via semaphore
// - Exponential backoff + jitter on rate limit errors
// - Retry-After header support
// - JSON mode via response_mime_type
// ============================================================

class Semaphore {
  private queue: Array<() => void> = [];
  private running = 0;

  constructor(private readonly limit: number) {}

  async acquire(): Promise<void> {
    if (this.running < this.limit) {
      this.running++;
      return;
    }
    await new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
    this.running++;
  }

  release(): void {
    this.running--;
    const next = this.queue.shift();
    if (next) next();
  }
}

const concurrencyLimit = Number(
  process.env['LLM_MAX_CONCURRENCY'] ?? MAX_LLM_CONCURRENCY,
);
const semaphore = new Semaphore(concurrencyLimit);

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class GeminiClient implements ILLMClient {
  private readonly genAI: GoogleGenerativeAI;
  private readonly modelName: string;

  constructor() {
    const apiKey = process.env['LLM_API_KEY'] || process.env['GEMINI_API_KEY'];
    if (!apiKey) throw new Error('LLM_API_KEY or GEMINI_API_KEY environment variable not set');

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = process.env['LLM_MODEL'] ?? 'gemini-1.5-flash';
  }

  async generate(
    messages: LLMMessage[],
    options: LLMGenerateOptions = {},
  ): Promise<LLMResponse> {
    return this.generateWithRetry(messages, options, false);
  }

  async generateJSON<T>(
    messages: LLMMessage[],
    options: LLMGenerateOptions = {},
  ): Promise<{ raw: string; parsed: T | null; error?: string }> {
    const response = await this.generateWithRetry(messages, options, true);
    const raw = response.text.trim();

    // Try to parse JSON
    let parsed: T | null = null;
    let error: string | undefined;

    try {
      // Strip markdown code fences if present (Gemini sometimes adds these)
      const clean = raw
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      parsed = JSON.parse(clean) as T;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      logger.warn('LLM JSON parse failed', { error, rawLength: raw.length });
    }

    return { raw, parsed, ...(error !== undefined ? { error } : {}) };
  }


  private async generateWithRetry(
    messages: LLMMessage[],
    options: LLMGenerateOptions,
    jsonMode: boolean,
    retries = LLM_MAX_RETRIES,
  ): Promise<LLMResponse> {
    let lastError: unknown;
    let backoff = 2000;

    for (let attempt = 1; attempt <= retries; attempt++) {
      await semaphore.acquire();

      try {
        const response = await this.callGemini(messages, options, jsonMode);
        return response;
      } catch (err) {
        lastError = err;

        if (err instanceof LLMError) {
          if (!err.retryable) {
            throw err;
          }

          // Honor Retry-After if provided
          const waitMs = err.retryAfterMs ?? backoff + Math.random() * 1000;

          if (attempt < retries) {
            logger.warn(`LLM attempt ${attempt} failed, retrying in ${waitMs.toFixed(0)}ms`, {
              code: err.code,
              message: err.message,
            });
            await sleep(waitMs);
            backoff = Math.min(backoff * 2, 60_000);
          }
        } else {
          throw err;
        }
      } finally {
        semaphore.release();
      }
    }

    const errorMsg =
      lastError instanceof Error ? lastError.message : String(lastError);
    throw new LLMError(
      ErrorCodes.LLM_PROVIDER_ERROR,
      `LLM failed after ${retries} retries: ${errorMsg}`,
      false,
    );
  }

  private async callGemini(
    messages: LLMMessage[],
    options: LLMGenerateOptions,
    jsonMode: boolean,
  ): Promise<LLMResponse> {
    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
      generationConfig: {
        maxOutputTokens: options.maxTokens ?? 8192,
        temperature: options.temperature ?? 0.3,
        ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
      },
      ...(options.systemPrompt ? { systemInstruction: options.systemPrompt } : {}),
    });


    // Convert messages to Gemini format
    // Gemini uses alternating user/model turns
    const history: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    const userMessages = messages.filter((m) => m.role !== 'system');

    for (let i = 0; i < userMessages.length - 1; i++) {
      const msg = userMessages[i];
      if (!msg) continue;
      history.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }

    const lastMsg = userMessages[userMessages.length - 1];
    if (!lastMsg) {
      throw new LLMError(ErrorCodes.LLM_PROVIDER_ERROR, 'No user messages provided', false);
    }

    const request: GenerateContentRequest = {
      contents: [
        ...history,
        { role: 'user', parts: [{ text: lastMsg.content }] },
      ],
    };

    try {
      const result = await model.generateContent(request);
      const response = result.response;
      const text = response.text();
      const finishReason = response.candidates?.[0]?.finishReason;

      return {
        text,
        finishReason:
          finishReason === 'STOP'
            ? 'stop'
            : finishReason === 'MAX_TOKENS'
              ? 'length'
              : 'unknown',
        tokensUsed:
          response.usageMetadata?.totalTokenCount,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);

      // Detect rate limiting
      if (
        message.includes('429') ||
        message.toLowerCase().includes('quota') ||
        message.toLowerCase().includes('rate limit')
      ) {
        throw new LLMError(
          ErrorCodes.LLM_RATE_LIMITED,
          `LLM rate limited: ${message}`,
          true,
          5000,
        );
      }

      if (
        message.includes('503') ||
        message.includes('502') ||
        message.toLowerCase().includes('unavailable')
      ) {
        throw new LLMError(
          ErrorCodes.LLM_PROVIDER_ERROR,
          `LLM service unavailable: ${message}`,
          true,
        );
      }

      throw new LLMError(ErrorCodes.LLM_PROVIDER_ERROR, `LLM error: ${message}`, false);
    }
  }
}

import { OpenAIClient } from './openai.js';

// Factory function — respects LLM_PROVIDER env var and key prefix
export function createLLMClient(): ILLMClient {
  const apiKey =
    process.env['LLM_API_KEY'] ||
    process.env['OPENAI_API_KEY'] ||
    process.env['GEMINI_API_KEY'] ||
    '';

  let provider = process.env['LLM_PROVIDER'];
  if (!provider) {
    provider = apiKey.startsWith('sk-') ? 'openai' : 'gemini';
  }

  switch (provider.toLowerCase()) {
    case 'openai':
      return new OpenAIClient();
    case 'gemini':
      return new GeminiClient();
    default:
      if (apiKey.startsWith('sk-')) return new OpenAIClient();
      return new GeminiClient();
  }
}

