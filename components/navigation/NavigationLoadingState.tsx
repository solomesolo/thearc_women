"use client";

export function NavigationLoadingState({ text }: { text?: string }) {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <div className="mx-auto max-w-[72rem] px-5 py-10 text-[0.9375rem] text-[#737373] md:px-8">
        {text ?? "Loading…"}
      </div>
    </div>
  );
}

