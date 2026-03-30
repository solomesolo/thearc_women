/**
 * ActionTransition — visual bridge divider before the implementation/action zone.
 * Placed between the free research sections and the gated action sections (7+).
 * Signals a shift from "understanding" to "doing".
 */

type ActionTransitionProps = {
  isSubscriber?: boolean;
};

export function ActionTransition({ isSubscriber = false }: ActionTransitionProps) {
  return (
    <div className="flex items-center gap-4 px-1 py-2">
      {/* Left rule */}
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#ddd0c6]" />

      {/* Center badge */}
      <div className="flex items-center gap-2 rounded-full border border-[#e0d3c9] bg-[#fdf3ec] px-4 py-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-[#c49a6c]" aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-[#a06b43]">
          {isSubscriber ? "Your action plan" : "Action plan"}
        </span>
      </div>

      {/* Right rule */}
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#ddd0c6]" />
    </div>
  );
}
