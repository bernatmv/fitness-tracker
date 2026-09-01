import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface StoreReviewInterface {
  requestReview(): Promise<boolean>;
}

const { StoreReview } = NativeModules;

export const REVIEW_STORAGE_KEY = '@fitness_tracker:review_state';

/**
 * How many distinct days of use before asking. Distinct DAYS, not launches: someone opening
 * the app five times in one evening is exploring, not yet satisfied. Returning across three
 * separate days is the cheapest honest signal that the app earned a place.
 */
export const MILESTONE_DAYS = 3;

/**
 * Apple allows three prompts per user per year and silently drops the rest. Asking again
 * sooner cannot succeed, so we do not spend a milestone on it.
 */
export const MIN_DAYS_BETWEEN_ASKS = 120;

export interface ReviewState {
  /** ISO dates (YYYY-MM-DD) the app was used on, capped at MILESTONE_DAYS. */
  activeDays: string[];
  lastAskedAt?: string;
  askCount: number;
}

const EMPTY: ReviewState = { activeDays: [], askCount: 0 };

const today = (now: Date) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`;

const daysBetween = (from: string, to: string) =>
  Math.floor((Date.parse(to) - Date.parse(from)) / 86_400_000);

/**
 * Pure decision, separated from storage and the native call so the rules can be tested
 * without a simulator.
 *
 * Never asks on the day the app was first opened, never asks twice inside Apple's window,
 * and never asks a fourth time — the prompt would be dropped anyway, and a user who has
 * declined three times has answered.
 */
export function ShouldAskForReview(state: ReviewState, now: Date): boolean {
  if (state.activeDays.length < MILESTONE_DAYS) return false;
  if (state.askCount >= 3) return false;
  if (state.lastAskedAt && daysBetween(state.lastAskedAt, today(now)) < MIN_DAYS_BETWEEN_ASKS) {
    return false;
  }
  return true;
}

/** Records today as an active day. Idempotent within a day, and capped so it cannot grow. */
export function RecordActiveDay(state: ReviewState, now: Date): ReviewState {
  const day = today(now);
  if (state.activeDays.includes(day)) return state;
  return { ...state, activeDays: [...state.activeDays, day].slice(-MILESTONE_DAYS) };
}

class StoreReviewService {
  private native: StoreReviewInterface | null =
    Platform.OS === 'ios' && StoreReview ? (StoreReview as StoreReviewInterface) : null;

  private async Load(): Promise<ReviewState> {
    try {
      const raw = await AsyncStorage.getItem(REVIEW_STORAGE_KEY);
      if (!raw) return EMPTY;
      const parsed = JSON.parse(raw) as Partial<ReviewState>;
      return {
        activeDays: Array.isArray(parsed.activeDays) ? parsed.activeDays : [],
        lastAskedAt: parsed.lastAskedAt,
        askCount: typeof parsed.askCount === 'number' ? parsed.askCount : 0,
      };
    } catch {
      // A corrupt record must not crash a launch; starting over only delays a prompt.
      return EMPTY;
    }
  }

  private async Save(state: ReviewState): Promise<void> {
    try {
      await AsyncStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Non-critical: the worst case is asking again later than intended.
    }
  }

  /**
   * Call once the app has finished loading and shown the user their wall — never during
   * onboarding or a sync. Returns whether the prompt was requested.
   */
  async MaybeAskAfterMilestone(now: Date = new Date()): Promise<boolean> {
    if (!this.native) return false;

    const recorded = RecordActiveDay(await this.Load(), now);
    if (!ShouldAskForReview(recorded, now)) {
      await this.Save(recorded);
      return false;
    }

    // Mark it asked BEFORE the call. If the app is killed mid-prompt, the failure mode
    // should be one prompt too few rather than a user asked twice.
    const asked: ReviewState = {
      ...recorded,
      lastAskedAt: today(now),
      askCount: recorded.askCount + 1,
    };
    await this.Save(asked);

    try {
      return await this.native.requestReview();
    } catch (error) {
      console.warn('StoreReview: prompt failed', error);
      return false;
    }
  }
}

export const storeReviewService = new StoreReviewService();
