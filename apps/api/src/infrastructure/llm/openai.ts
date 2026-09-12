import {
  type ILLMClient,
  type LLMMessage,
  type LLMResponse,
  type LLMGenerateOptions,
  LLMError,
} from './client.js';
import { ErrorCodes, MAX_LLM_CONCURRENCY, LLM_MAX_RETRIES } from '@interview-prep/shared';
import { logger } from '../../utils/logger.js';

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

export class OpenAIClient implements ILLMClient {
  private readonly apiKey: string;
  private readonly modelName: string;

  constructor() {
    const key = process.env['OPENAI_API_KEY'] || process.env['LLM_API_KEY'];
    if (!key) throw new Error('OPENAI_API_KEY or LLM_API_KEY environment variable not set');
    this.apiKey = key;
    this.modelName = process.env['LLM_MODEL'] ?? 'gpt-4o-mini';
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
  ): Promise<{ raw: string; parsed: T | null; error?: string | undefined }> {
    const response = await this.generateWithRetry(messages, options, true);
    const raw = response.text.trim();

    let parsed: T | null = null;
    let error: string | undefined;

    try {
      const clean = raw
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      parsed = JSON.parse(clean) as T;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      logger.warn('OpenAI JSON parse failed', { error, rawLength: raw.length });
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
        const response = await this.callOpenAI(messages, options, jsonMode);
        return response;
      } catch (err) {
        lastError = err;

        if (err instanceof LLMError && !err.retryable) {
          throw err;
        }

        const waitMs =
          err instanceof LLMError && err.retryAfterMs
            ? err.retryAfterMs
            : backoff + Math.random() * 1000;

        logger.warn(
          `OpenAI request failed (attempt ${attempt}/${retries}), retrying in ${waitMs}ms...`,
          {
            error: err instanceof Error ? err.message : String(err),
            attempt,
          },
        );

        if (attempt < retries) {
          await sleep(waitMs);
          backoff *= 2;
        }
      } finally {
        semaphore.release();
      }
    }

    const errorMsg = lastError instanceof Error ? lastError.message : String(lastError);
    throw new LLMError(
      ErrorCodes.LLM_PROVIDER_ERROR,
      `OpenAI failed after ${retries} retries: ${errorMsg}`,
      false,
    );
  }

  private async callOpenAI(
    messages: LLMMessage[],
    options: LLMGenerateOptions,
    jsonMode: boolean,
  ): Promise<LLMResponse> {
    const formattedMessages: Array<{ role: string; content: string }> = [];

    if (options.systemPrompt) {
      formattedMessages.push({ role: 'system', content: options.systemPrompt });
    }

    for (const msg of messages) {
      formattedMessages.push({ role: msg.role, content: msg.content });
    }

    const body: Record<string, unknown> = {
      model: this.modelName,
      messages: formattedMessages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 4096,
    };

    if (jsonMode) {
      body['response_format'] = { type: 'json_object' };
    }

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const status = res.status;
        const errText = await res.text();

        if (status === 429) {
          const retryHeader = res.headers.get('retry-after');
          const retryMs = retryHeader ? Number(retryHeader) * 1000 : 5000;
          throw new LLMError(ErrorCodes.LLM_RATE_LIMITED, `Rate limited (429): ${errText}`, true, retryMs);
        }

        if (status >= 500) {
          throw new LLMError(ErrorCodes.LLM_PROVIDER_ERROR, `OpenAI server error (${status}): ${errText}`, true);
        }

        throw new LLMError(ErrorCodes.LLM_PROVIDER_ERROR, `OpenAI API error (${status}): ${errText}`, false);
      }

      const data = (await res.json()) as {
        choices: Array<{
          message: { content: string };
          finish_reason: string;
        }>;
        usage?: { total_tokens: number };
      };

      const choice = data.choices[0];
      const text = choice?.message?.content ?? '';
      const finishReason =
        choice?.finish_reason === 'stop'
          ? 'stop'
          : choice?.finish_reason === 'length'
            ? 'length'
            : 'unknown';

      return {
        text,
        finishReason,
        ...(data.usage?.total_tokens !== undefined ? { tokensUsed: data.usage.total_tokens } : {}),
      };
    } catch (err) {
      if (err instanceof LLMError) throw err;
      const message = err instanceof Error ? err.message : String(err);
      throw new LLMError(ErrorCodes.LLM_PROVIDER_ERROR, `Network error calling OpenAI: ${message}`, true);
    }
  }
}
