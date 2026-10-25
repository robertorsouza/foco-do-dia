import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

/**
 * Avisos curtos que somem sozinhos (T1 a T4 no Figma).
 * Um aviso pode ter uma ação, como "Desfazer": aí ele fica mais tempo na tela.
 */
const Contexto = createContext(() => {});

export function ProvedorDeAvisos({ children, duracaoMs = 2600, duracaoComAcaoMs = 6000 }) {
  const [aviso, setAviso] = useState(null);
  const timer = useRef(null);

  const fechar = useCallback(() => {
    clearTimeout(timer.current);
    setAviso(null);
  }, []);

  /** @param {string} texto  @param {{rotulo: string, aoTocar: () => void}} [acao] */
  const avisar = useCallback(
    (texto, acao) => {
      clearTimeout(timer.current);
      setAviso({ texto, acao, id: Date.now() });
      timer.current = setTimeout(() => setAviso(null), acao ? duracaoComAcaoMs : duracaoMs);
    },
    [duracaoMs, duracaoComAcaoMs],
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <Contexto.Provider value={avisar}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-28 z-40 flex justify-center px-5"
      >
        {aviso && (
          <div
            key={aviso.id}
            className="surgir pointer-events-auto flex items-center gap-4 rounded-2xl bg-tinta py-3.5 pr-3 pl-[18px] text-sm text-white shadow-lg"
          >
            <p>{aviso.texto}</p>
            {aviso.acao && (
              <button
                type="button"
                onClick={() => {
                  fechar();
                  aviso.acao.aoTocar();
                }}
                className="rounded-lg px-2 py-1 font-semibold underline underline-offset-2"
              >
                {aviso.acao.rotulo}
              </button>
            )}
          </div>
        )}
      </div>
    </Contexto.Provider>
  );
}

export const useAvisar = () => useContext(Contexto);
