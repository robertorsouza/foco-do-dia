import { useEffect, useId, useRef } from 'react';
import { Botao } from './ui.jsx';

/**
 * Janela por cima da tela (P1 a P7 no Figma). Fecha com Esc ou tocando fora.
 * `embaixo` usa o formato de painel que sobe do rodapé (menu e alerta).
 */
export function Popup({ titulo, children, aoFechar, embaixo = false }) {
  const idTitulo = useId();
  const caixa = useRef(null);
  // Guarda a função mais recente sem refazer o efeito a cada renderização:
  // o foco é posicionado uma vez só, ao abrir.
  const fecharAtual = useRef(aoFechar);
  useEffect(() => {
    fecharAtual.current = aoFechar;
  });

  useEffect(() => {
    const anterior = document.activeElement;
    // Foco no elemento marcado (em confirmações, o "não"), senão no primeiro botão.
    const alvo =
      caixa.current?.querySelector('[data-foco-inicial]') ??
      caixa.current?.querySelector('button, input');
    alvo?.focus();
    const aoTeclar = (e) => e.key === 'Escape' && fecharAtual.current();
    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      anterior?.focus?.();
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-30 flex bg-tinta/45 ${
        embaixo ? 'items-end' : 'items-center px-6'
      } justify-center`}
      onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}
    >
      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        className={`surgir flex w-full flex-col gap-3 bg-white p-6 ${
          embaixo
            ? 'max-w-md rounded-t-[28px] pb-[max(2rem,env(safe-area-inset-bottom))]'
            : 'max-w-[342px] rounded-3xl shadow-2xl'
        }`}
      >
        {embaixo && (
          <span aria-hidden="true" className="mx-auto -mt-2 mb-1 h-[5px] w-10 rounded bg-linha" />
        )}
        <h2 id={idTitulo} className="text-[22px] font-light leading-snug tracking-[-0.4px]">
          {titulo}
        </h2>
        {children}
      </div>
    </div>
  );
}

/** Popup de confirmação Sim / Não (docs/jornadas.md). */
export function Confirmar({ titulo, texto, sim, nao, aoConfirmar, aoFechar, ocupado = false }) {
  return (
    <Popup titulo={titulo} aoFechar={aoFechar}>
      <p className="text-[15px] leading-normal text-suave">{texto}</p>
      <div className="flex flex-col gap-2 pt-2">
        <Botao grande largo onClick={aoConfirmar} disabled={ocupado}>
          {sim}
        </Botao>
        {/* Foco começa no "não": um Enter sem querer não exclui nem fecha o dia. */}
        <Botao estilo="fantasma" largo onClick={aoFechar} data-foco-inicial>
          {nao}
        </Botao>
      </div>
    </Popup>
  );
}

/** Aviso de algo que não pode (P4). */
export function Aviso({ titulo, texto, aoFechar }) {
  return (
    <Popup titulo={titulo} aoFechar={aoFechar}>
      <p className="text-[15px] leading-normal text-suave">{texto}</p>
      <div className="pt-2">
        <Botao grande largo onClick={aoFechar}>
          Entendi
        </Botao>
      </div>
    </Popup>
  );
}
