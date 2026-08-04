import { useMemo } from "react";

const COLORS = ["#1E9E72","#14A085","#B98427","#C0392B","#2A6B5A","#8CCFB8","#F4A792","#1C7562"];
const EMOJI  = ["🎉","🎊","✨","🥳","⭐","🌟","💚","🙌"];

/* Full-screen 1-second confetti + emoji burst. Render with show=true to fire. */
export default function Celebration({ show }) {
  const pieces = useMemo(() => Array.from({ length: 70 }, (_, i) => {
    const isEmoji = i % 4 === 0;
    return {
      id: i,
      left: (i * 89) % 100,                 // deterministic spread across width
      delay: (i % 12) * 0.03,
      dur: 0.85 + (i % 6) * 0.04,
      rot: (i * 47) % 360,
      drift: ((i % 9) - 4) * 26,
      color: COLORS[i % COLORS.length],
      emoji: EMOJI[i % EMOJI.length],
      size: 7 + (i % 5) * 3,
      isEmoji,
    };
  }), []);

  if (!show) return null;

  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:9999, overflow:"hidden" }}>
      {/* center pop */}
      <div style={{ position:"absolute", top:"40%", left:"50%",
                    fontSize:"min(24vw,170px)", animation:"celebrate-pop 1s ease-out forwards" }}>🎉</div>
      {/* radial flash */}
      <div style={{ position:"absolute", inset:0, animation:"celebrate-flash 1s ease-out forwards",
                    background:"radial-gradient(circle at 50% 42%, rgba(30,158,114,.18), transparent 55%)" }} />
      {/* confetti */}
      {pieces.map(p => (
        <span key={p.id} style={{
          position:"absolute", top:"-8%", left:`${p.left}%`,
          fontSize: p.isEmoji ? `${16 + p.size}px` : undefined,
          width:  p.isEmoji ? undefined : p.size,
          height: p.isEmoji ? undefined : p.size * 1.5,
          background: p.isEmoji ? undefined : p.color,
          borderRadius: p.isEmoji ? undefined : 2,
          "--drift": `${p.drift}px`,
          "--rot": `${p.rot}deg`,
          animation: `confetti-fall ${p.dur}s ${p.delay}s cubic-bezier(.3,.6,.5,1) forwards`,
        }}>{p.isEmoji ? p.emoji : ""}</span>
      ))}
    </div>
  );
}
