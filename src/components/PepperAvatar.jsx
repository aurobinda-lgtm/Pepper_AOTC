/**
 * PepperAvatar — the five-mood assistant avatar.
 *
 * Moods:
 *   greet     — work is pouring in (many pending items)
 *   celebrate — all clear / everything done
 *   default   — normal working state
 *   sad       — a project is red / critical
 *   asleep    — inbox empty, nothing urgent
 *
 * The component is display-only; call moodFor() to compute
 * which mood to show, then pass avatarSrc={AV[mood]}.
 */

/**
 * @param {{ pendingCount: number, allDone: boolean, anyRed: boolean, anyOverdue: boolean }} state
 * @returns {"greet"|"celebrate"|"default"|"sad"|"asleep"}
 */
export function moodFor({ pendingCount, allDone, anyRed, anyOverdue }) {
  if (allDone)          return "celebrate";
  if (anyRed)           return "sad";
  if (pendingCount > 5) return "greet";
  if (pendingCount === 0 && !anyOverdue) return "asleep";
  return "default";
}

/**
 * @param {{ src: string, size?: number, style?: object }} props
 */
export default function PepperAvatar({ src, size = 62, style = {} }) {
  return (
    <img
      src={src}
      alt="Pepper"
      style={{
        width:        size,
        height:       size,
        borderRadius: "50%",
        border:       "3px solid rgba(245,244,242,.18)",
        objectFit:    "cover",
        flexShrink:   0,
        ...style,
      }}
    />
  );
}
