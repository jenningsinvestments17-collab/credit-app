type SupportBlockProps = {
  eyebrow?: string;
  title?: string;
  items: string[];
  tone?: "light" | "dark";
};

export function SupportBlock({
  eyebrow,
  title,
  items,
  tone = "light",
}: SupportBlockProps) {
  const shellStyles =
    tone === "dark"
      ? "rounded-[1.45rem] border border-white/10 bg-white/[0.04] p-5"
      : "rounded-[1.45rem] border border-black/10 bg-surface-light-soft p-5";

  const textStyles = tone === "dark" ? "text-zinc-300" : "text-zinc-700";

  return (
    <div className={shellStyles}>
      {(eyebrow || title) && (
        <div className="space-y-2">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          {title ? (
            <h3
              className={`font-display text-3xl uppercase leading-[0.92] tracking-[0.03em] ${
                tone === "dark" ? "text-white" : "text-text-dark"
              }`}
            >
              {title}
            </h3>
          ) : null}
        </div>
      )}

      <div className={`grid gap-3 ${eyebrow || title ? "mt-4" : ""}`}>
        {items.map((item) => (
          <div
            key={item}
            className={`rounded-2xl border px-4 py-4 text-sm leading-7 ${
              tone === "dark"
                ? "border-white/10 bg-black/20 text-zinc-300"
                : "border-black/10 bg-white/72 text-zinc-700"
            }`}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
