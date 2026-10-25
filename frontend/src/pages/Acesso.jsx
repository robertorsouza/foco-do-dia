import { useState } from 'react';
import { Botao } from '../components/ui.jsx';

/** 01, 01b e 01c: código de acesso (RNF-10). */
export function Acesso({ api, aoEntrar, aviso }) {
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState(null);
  const [bloqueado, setBloqueado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    const limpo = codigo.trim();
    if (!limpo) return;
    setEnviando(true);
    setErro(null);
    try {
      await api.testarCodigo(limpo);
      aoEntrar(limpo);
    } catch (falha) {
      if (falha.status === 429) setBloqueado(true);
      else if (falha.status === 401) setErro('Esse código não confere. Confira e tente de novo.');
      else setErro(falha.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-7 pt-28 pb-10">
      <h1 className="text-5xl font-extralight tracking-[-1.5px]">Foco do Dia</h1>
      <p className="text-[15px] leading-normal text-suave">
        Um turno de cada vez.
        <br />
        Sem culpa pelo que ficar para depois.
      </p>

      <form onSubmit={entrar} className="mt-8 flex flex-col gap-4">
        {aviso && !erro && !bloqueado && (
          <p role="status" className="text-sm text-suave">
            {aviso}
          </p>
        )}
        {bloqueado && (
          <div role="alert" className="rounded-2xl bg-urgente-fundo p-4">
            <p className="font-medium text-urgente">Muitas tentativas</p>
            <p className="mt-1 text-sm leading-normal text-suave">
              Por segurança, pausamos por 15 minutos. Respire, confira o código e tente de novo
              depois.
            </p>
          </div>
        )}
        <label
          className={`flex flex-col gap-1.5 rounded-2xl border bg-white p-4 ${
            erro ? 'border-[1.5px] border-urgente' : 'border-linha'
          } ${bloqueado ? 'opacity-40' : ''}`}
        >
          <span className="text-xs text-suave">Código de acesso</span>
          <input
            type="password"
            autoComplete="current-password"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            disabled={bloqueado}
            aria-invalid={Boolean(erro)}
            aria-describedby={erro ? 'erro-codigo' : undefined}
            className="bg-transparent text-base tracking-[4px] outline-none"
          />
        </label>
        {erro && (
          <p id="erro-codigo" role="alert" className="text-sm text-urgente">
            {erro}
          </p>
        )}
        <Botao type="submit" grande largo disabled={bloqueado || enviando || !codigo.trim()}>
          {bloqueado ? 'Tente de novo em 15 minutos' : enviando ? 'Entrando…' : 'Entrar'}
        </Botao>
      </form>

      <p className="mt-auto text-center text-[13px] text-suave">
        O código fica salvo só neste aparelho.
      </p>
    </main>
  );
}
