/**
 * The shape of a club swing, as a curve rather than as a lerp.
 *
 * The MVP swung the arm with a single half-sine: the club went out and came back with no preparation
 * and nothing to read as impact, and the heavy strike was the same motion scaled. The spec asks for
 * three legible beats — wind up, impact, recovery — and for the heavy strike to carry more weight than
 * the simple one. Keeping the curve here, away from Babylon, is what makes those two claims testable.
 */

/** Seconds each swing takes. The heavy one is slower, which is most of why it reads as heavier. */
export const STRIKE_DURATION = { light: 0.42, heavy: 0.66 } as const;

export interface StrikePose {
  /** Rotation around the camera's right axis: negative winds back, positive drives down. */
  pitch: number;
  /** Roll across the body, so the swing is diagonal instead of a piston. */
  roll: number;
  /** How far the hands lift out of rest. */
  lift: number;
  done: boolean;
}

const REST: StrikePose = { pitch: 0, roll: 0, lift: 0, done: true };

/** Fraction of the swing spent winding up. The rest is the strike and the recovery out of it. */
const WIND = 0.32;
/** Fraction of what is left that the club spends driving down. Contact is at the end of it. */
const DRIVE = 0.3;
const LIGHT = { wind: -0.55, drive: 1.05, roll: 0.34, lift: 0.1 };
const HEAVY = { wind: -1.15, drive: 1.95, roll: 0.6, lift: 0.22 };

/** Smooth in and out, so neither end of a beat shows a corner. */
function ease(t: number): number {
  return t * t * (3 - 2 * t);
}

export function strikePose(elapsed: number, heavy: boolean): StrikePose {
  const duration = heavy ? STRIKE_DURATION.heavy : STRIKE_DURATION.light;
  if (elapsed <= 0 || elapsed >= duration) return { ...REST, done: elapsed >= duration };

  const t = elapsed / duration;
  const amp = heavy ? HEAVY : LIGHT;

  if (t < WIND) {
    // preparation: the arm pulls back and up, gathering the swing
    const p = ease(t / WIND);
    return { pitch: amp.wind * p, roll: -amp.roll * 0.5 * p, lift: amp.lift * p, done: false };
  }

  // The strike is deliberately lopsided: a short drive out of the wound-up pose to the impact, then a
  // longer recovery back to rest. A symmetric curve puts the deepest point of the swing at the end of
  // the motion, which reads as the club stopping in mid-air rather than hitting something.
  const p = (t - WIND) / (1 - WIND);
  if (p < DRIVE) {
    const q = ease(p / DRIVE);
    return {
      pitch: amp.wind * (1 - q) + amp.drive * q,
      roll: -amp.roll * 0.5 * (1 - q) + amp.roll * q,
      lift: amp.lift * (1 - q) - amp.lift * 0.8 * q,
      done: false,
    };
  }
  const q = ease((p - DRIVE) / (1 - DRIVE));
  return {
    pitch: amp.drive * (1 - q),
    roll: amp.roll * (1 - q),
    lift: -amp.lift * 0.8 * (1 - q),
    done: false,
  };
}
