/** 01d: o servidor gratuito estava dormindo e a resposta está demorando. */
export function Acordando() {
  return (
    <div
      role="status"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-fundo px-7 text-center"
    >
      <span
        aria-hidden="true"
        className="h-11 w-11 animate-spin rounded-full border-[3px] border-linha border-t-tinta"
      />
      <p className="text-2xl font-light">Acordando o app…</p>
      <p className="max-w-xs text-[15px] leading-normal text-suave">
        Na primeira vez do dia pode levar até 1 minuto. Enquanto isso, respire: o seu dia já está
        esperando.
      </p>
    </div>
  );
}
