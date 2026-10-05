/** Static gold-and-emerald glow behind every marketing page, and the fallback when WebGL is off. */
export function Ambient() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-20 overflow-hidden">
      <div className="absolute top-[-10%] left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-linear-to-tr from-gold/10 via-gold-light/5 to-transparent blur-[120px]" />
      <div className="absolute top-2/3 right-[10%] h-[500px] w-[500px] rounded-full bg-linear-to-bl from-emerald-accent/20 via-gold/5 to-transparent blur-[140px]" />
    </div>
  );
}
