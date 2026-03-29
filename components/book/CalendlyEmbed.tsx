const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL;

export function CalendlyEmbed() {
  const hasEmbed = Boolean(calendlyUrl);

  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5">
      <p className="text-[11px] uppercase tracking-[0.22em] text-accent">
        {hasEmbed ? "Book your consultation" : "Calendly embed ready"}
      </p>

      <div className="mt-4 overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.04]">
        {hasEmbed ? (
          <iframe
            title="Book a consultation"
            src={calendlyUrl}
            className="min-h-[44rem] w-full"
          />
        ) : (
          <div className="min-h-[24rem] p-5 text-sm leading-7 text-zinc-400 md:min-h-[34rem]">
            Premium booking container ready for your live Calendly link.
            Add <code className="rounded bg-black/25 px-2 py-1 text-zinc-200">NEXT_PUBLIC_CALENDLY_URL</code> to
            load the scheduler here without changing the page layout.
          </div>
        )}
      </div>
    </div>
  );
}
