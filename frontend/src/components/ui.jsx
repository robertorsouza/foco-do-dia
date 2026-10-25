/**
 * Componentes básicos, espelhando os componentes do Figma:
 * Botão, Chip, Tag, Check, Rótulo e Navegação.
 * Títulos de atividades são sempre renderizados como texto (o React escapa),
 * nunca como HTML (arquitetura, seção 7: XSS).
 */

const ESTILO_BOTAO = {
  primario: 'bg-tinta text-white',
  secundario: 'bg-white text-tinta border border-linha',
  fantasma: 'text-suave',
  perigo: 'bg-urgente text-white',
};

export function Botao({
  children,
  estilo = 'primario',
  grande = false,
  largo = false,
  className = '',
  ...props
}) {
  const tamanho = grande ? 'text-base px-4 py-4 rounded-2xl' : 'text-sm px-3.5 py-2.5 rounded-xl';
  return (
    <button
      type="button"
      className={`font-medium transition-opacity disabled:opacity-40 ${tamanho} ${
        ESTILO_BOTAO[estilo]
      } ${largo ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Chip({ children, ativo = false, urgente = false, ...props }) {
  const cor = ativo
    ? 'bg-tinta text-white border-tinta'
    : urgente
      ? 'bg-white text-urgente border-[#efc9b8]'
      : 'bg-white text-suave border-linha';
  return (
    <button
      type="button"
      aria-pressed={ativo}
      className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] ${cor}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Tag({ tipo }) {
  if (tipo === 'urgente') {
    return (
      <span className="rounded-full bg-urgente-fundo px-2 py-0.5 text-[11px] font-semibold text-urgente">
        Urgente
      </span>
    );
  }
  return (
    <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-semibold text-suave">
      Fixa
    </span>
  );
}

export function Check({ feita, rotulo, ...props }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={feita}
      aria-label={rotulo}
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px] border-tinta ${
        feita ? 'bg-tinta' : ''
      }`}
      {...props}
    >
      {feita && (
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path
            d="M2 6.5l2.5 2.5L10 3.5"
            stroke="#fff"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

export function Rotulo({ children }) {
  return <p className="text-xs font-semibold uppercase tracking-[0.8px] text-suave">{children}</p>;
}

export function Titulo({ data, children, aoTocarNaData }) {
  return (
    <header>
      {aoTocarNaData ? (
        <button type="button" onClick={aoTocarNaData} className="text-sm text-suave">
          <span aria-hidden="true">‹ </span>
          {data}
          <span className="sr-only"> (ver dia anterior)</span>
        </button>
      ) : (
        <p className="text-sm text-suave">{data}</p>
      )}
      <h1 className="text-[40px] font-light leading-tight tracking-[-1px]">{children}</h1>
    </header>
  );
}

const ABAS = [
  ['hoje', 'Hoje'],
  ['relatorio', 'Relatórios'],
  ['fixas', 'Fixas'],
];

export function Navegacao({ ativa, irPara }) {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-linha bg-white pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-md justify-around pt-3 pb-4">
        {ABAS.map(([chave, nome]) => {
          const ativo = chave === ativa;
          return (
            <li key={chave}>
              <button
                type="button"
                onClick={() => irPara(chave)}
                aria-current={ativo ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 px-4 text-xs ${
                  ativo ? 'font-semibold text-tinta' : 'text-suave'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-[22px] w-[22px] rounded-md border-[1.5px] border-current ${
                    ativo ? 'bg-tinta' : ''
                  }`}
                />
                {nome}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Pagina({ children }) {
  return <main className="mx-auto flex max-w-md flex-col gap-5 px-5 pt-8 pb-32">{children}</main>;
}

export function Carregando({ texto = 'Carregando…' }) {
  return (
    <p role="status" className="py-10 text-center text-sm text-suave">
      {texto}
    </p>
  );
}

export function Falha({ erro, tentarDeNovo }) {
  return (
    <div role="alert" className="rounded-2xl bg-urgente-fundo p-4">
      <p className="text-[15px] text-urgente">{erro.message}</p>
      {tentarDeNovo && (
        <Botao estilo="secundario" className="mt-3" onClick={tentarDeNovo}>
          Tentar de novo
        </Botao>
      )}
    </div>
  );
}
