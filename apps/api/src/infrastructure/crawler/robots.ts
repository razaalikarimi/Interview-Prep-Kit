import robotsParser from 'robots-parser';
import { safeFetch } from './fetcher.js';
import { logger } from '../../utils/logger.js';

// ============================================================
// ROBOTS.TXT PARSER
// Fetches and caches robots.txt for a given base URL.
// Respects Disallow rules for our user-agent.
// ============================================================

const USER_AGENT = 'InterviewPrepBot';
const robotsCache = new Map<string, ReturnType<typeof robotsParser>>();

export async function fetchRobots(
  baseUrl: string,
  isEvalMode = false,
): Promise<ReturnType<typeof robotsParser> | null> {
  const origin = new URL(baseUrl).origin;
  const robotsUrl = `${origin}/robots.txt`;

  if (robotsCache.has(origin)) {
    return robotsCache.get(origin)!;
  }

  try {
    const result = await safeFetch(robotsUrl, isEvalMode);
    if (result.status === 200) {
      const robots = robotsParser(robotsUrl, result.text);
      robotsCache.set(origin, robots);
      return robots;
    }
    // No robots.txt — allow all
    robotsCache.set(origin, robotsParser(robotsUrl, ''));
    return robotsCache.get(origin)!;
  } catch {
    // If robots.txt fetch fails, assume allow
    logger.debug('Could not fetch robots.txt, assuming allow-all', { robotsUrl });
    robotsCache.set(origin, robotsParser(robotsUrl, ''));
    return robotsCache.get(origin)!;
  }
}

export async function isAllowedByCrawl(
  url: string,
  baseUrl: string,
  isEvalMode = false,
): Promise<boolean> {
  const robots = await fetchRobots(baseUrl, isEvalMode);
  if (!robots) return true;
  return robots.isAllowed(url, USER_AGENT) !== false;
}
