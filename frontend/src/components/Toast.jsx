import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

/** Avisos curtos que somem sozinhos (T1 a T4 no Figma). */
const Contexto = createContext(() => {});

export function ProvedorDeAvisos({ children, duracaoMs = 2600 }) {
  const [aviso, setAviso] = useState(null);
  const timer = useRef(null);

  const avisar = useCallback(
    (texto) => {
      clearTimeout(timer.current);
      setAviso({ texto, id: Date.now() });
      timer.current = setTimeout(() => setAviso(null), duracaoMs);
    },
    [duracaoMs],
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
          <p
            key={aviso.id}
            className="surgir rounded-2xl bg-tinta px-[18px] py-3.5 text-sm text-white shadow-lg"
          >
            {aviso.texto}
          </p>
        )}
      </div>
    </Contexto.Provider>
  );
}

export const useAvisar = () => useContext(Contexto);
