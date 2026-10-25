import { useState } from 'react';
import { Botao, Check, Chip, Rotulo, Tag } from './ui.jsx';
import { Popup } from './Popup.jsx';
import {
  FAIXA,
  NOME,
  ROTULO_STATUS,
  TURNOS,
  textoAmanha,
  textoProximoTurno,
} from '../lib/turnos.js';

const COR_DO_TURNO = { manha: 'bg-manha', tarde: 'bg-tarde', noite: 'bg-noite' };

/** Uma atividade no turno: o círculo marca/desmarca; tocar no título abre o menu. */
export function Atividade({ atividade, aoMarcar, aoAbrir }) {
  const feita = atividade.status === 'feita';
  return (
    <li className="flex items-center gap-3 border-t border-black/[0.08] py-2.5 first:border-0">
      <Check
        feita={feita}
        rotulo={`${feita ? 'Desmarcar' : 'Marcar como feita'}: ${atividade.titulo}`}
        onClick={() => aoMarcar(atividade)}
      />
      <button
        type="button"
        onClick={() => aoAbrir(atividade)}
        className={`flex-1 text-left text-base ${feita ? 'text-suave line-through' : ''}`}
      >
        {atividade.titulo}
      </button>
      {atividade.prioridade === 'urgente' && <Tag tipo="urgente" />}
      {atividade.fixa_id && atividade.prioridade !== 'urgente' && <Tag tipo="fixa" />}
    </li>
  );
}

/** Cartão de um turno. `atual` destaca o turno em andamento. */
export function CartaoDoTurno({ turno, atual, children, vazio }) {
  return (
    <section
      aria-label={NOME[turno]}
      className={`rounded-[20px] p-4 ${COR_DO_TURNO[turno]} ${atual ? 'outline-2 outline-tinta' : ''}`}
    >
      <div className="flex items-center justify-between pb-1.5">
        <h2 className="flex items-center gap-2 text-xl">
          {NOME[turno]}
          {atual && (
            <span className="rounded-full bg-tinta px-2 py-0.5 text-[11px] font-bold tracking-[0.6px] text-white">
              AGORA
            </span>
          )}
        </h2>
        <span className="text-[13px] text-suave">{FAIXA[turno]}</span>
      </div>
      {vazio ? <p className="py-1 text-sm text-apagado">Nada por aqui ainda</p> : children}
    </section>
  );
}

/** Linha do histórico (dia fechado ou passado): título e o que aconteceu com ela. */
const COR_STATUS = {
  feita: 'text-tinta',
  movida: 'text-noite-forte',
  em_aberto: 'text-aberto',
  deixada_de_lado: 'text-apagado',
  pendente: 'text-suave',
};
export function LinhaDoHistorico({ atividade, aoTocar }) {
  const feita = atividade.status === 'feita';
  return (
    <li>
      <button
        type="button"
        onClick={() => aoTocar?.(atividade)}
        className="flex w-full items-center gap-2.5 border-t border-black/[0.08] py-2.5 text-left"
      >
        <span className={`flex-1 ${feita ? 'text-suave line-through' : ''}`}>
          {atividade.titulo}
        </span>
        <span className={`text-xs font-medium ${COR_STATUS[atividade.status]}`}>
          {ROTULO_STATUS[atividade.status]}
        </span>
      </button>
    </li>
  );
}

/** Histórico do dia por turno, a partir do relatório diário (por_turno). */
export function HistoricoDoDia({ porTurno, aoTocar }) {
  return TURNOS.map((t) => {
    const lista = [...porTurno[t].feitas, ...porTurno[t].nao_feitas];
    return (
      <CartaoDoTurno key={t} turno={t} vazio={lista.length === 0}>
        <ul>
          {lista.map((a) => (
            <LinhaDoHistorico key={a.id} atividade={a} aoTocar={aoTocar} />
          ))}
        </ul>
      </CartaoDoTurno>
    );
  });
}

/** Campo para planejar: título, turno e urgência (HU-01). */
export function Adicionar({ turnoInicial, aoAdicionar }) {
  const [titulo, setTitulo] = useState('');
  const [turno, setTurno] = useState(turnoInicial);
  const [urgente, setUrgente] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const limpo = titulo.trim();

  async function enviar(e) {
    e.preventDefault();
    if (!limpo || enviando) return;
    setEnviando(true);
    const ok = await aoAdicionar({
      titulo: limpo,
      turno,
      prioridade: urgente ? 'urgente' : 'normal',
    });
    setEnviando(false);
    if (ok) {
      setTitulo('');
      setUrgente(false);
    }
  }

  return (
    <form
      onSubmit={enviar}
      aria-label="Adicionar atividade"
      className="flex flex-col gap-3 rounded-2xl border border-linha bg-white p-3.5"
    >
      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        maxLength={80}
        placeholder="O que você precisa fazer?"
        aria-label="O que você precisa fazer?"
        className="bg-transparent text-base outline-none placeholder:text-[#a3a19b]"
      />
      <div className="flex items-center gap-1.5">
        {TURNOS.map((t) => (
          <Chip key={t} ativo={turno === t} onClick={() => setTurno(t)}>
            {NOME[t]}
          </Chip>
        ))}
        <Chip ativo={urgente} urgente onClick={() => setUrgente((u) => !u)}>
          Urgente
        </Chip>
        <button
          type="submit"
          disabled={!limpo || enviando}
          aria-label="Adicionar"
          className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tinta text-[22px] font-light text-white disabled:opacity-30"
        >
          +
        </button>
      </div>
    </form>
  );
}

/** P1: menu da atividade. As opções mudam conforme o status (docs/jornadas.md, J3). */
export function MenuDaAtividade({ atividade, aoEscolher, aoFechar }) {
  const feita = atividade.status === 'feita';
  const opcoes = feita
    ? [
        ['desmarcar', 'Desmarcar', 'Volta a ficar pendente'],
        ['editar', 'Editar', 'Título, turno ou urgência'],
        ['excluir', 'Excluir', 'Pede confirmação'],
      ]
    : [
        ['marcar', 'Marcar como feita', ''],
        ['proximo_turno', 'Levar para o próximo turno', textoProximoTurno(atividade.turno)],
        ['amanha', 'Levar para amanhã', textoAmanha(atividade.turno)],
        ['editar', 'Editar', 'Título, turno ou urgência'],
        ['deixar', 'Deixar de lado', 'Pede confirmação'],
        ['excluir', 'Excluir', 'Pede confirmação'],
      ];
  return (
    <Popup titulo={atividade.titulo} aoFechar={aoFechar} embaixo>
      <p className="-mt-2 text-xs text-suave">
        {NOME[atividade.turno]} · {feita ? 'feita' : 'pendente'}
      </p>
      <ul>
        {opcoes.map(([chave, rotulo, sub]) => (
          <li key={chave}>
            <button
              type="button"
              onClick={() => aoEscolher(chave)}
              className="flex w-full items-center gap-2 border-t border-linha py-3.5 text-left"
            >
              <span className={`flex-1 text-base ${chave === 'excluir' ? 'text-urgente' : ''}`}>
                {rotulo}
              </span>
              {sub && <span className="text-xs text-apagado">{sub}</span>}
            </button>
          </li>
        ))}
      </ul>
      <Botao estilo="fantasma" largo onClick={aoFechar}>
        Fechar
      </Botao>
    </Popup>
  );
}

/** Editar título, turno e urgência (HU-02). */
export function EditarAtividade({ atividade, aoSalvar, aoFechar }) {
  const [titulo, setTitulo] = useState(atividade.titulo);
  const [turno, setTurno] = useState(atividade.turno);
  const [urgente, setUrgente] = useState(atividade.prioridade === 'urgente');
  const limpo = titulo.trim();
  return (
    <Popup titulo="Editar atividade" aoFechar={aoFechar}>
      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        maxLength={80}
        aria-label="Título"
        className="rounded-xl border border-linha px-3 py-3 text-base outline-none"
      />
      <div className="flex flex-wrap gap-1.5">
        {TURNOS.map((t) => (
          <Chip key={t} ativo={turno === t} onClick={() => setTurno(t)}>
            {NOME[t]}
          </Chip>
        ))}
        <Chip ativo={urgente} urgente onClick={() => setUrgente((u) => !u)}>
          Urgente
        </Chip>
      </div>
      <div className="flex flex-col gap-2 pt-2">
        <Botao
          grande
          largo
          disabled={!limpo}
          onClick={() =>
            aoSalvar({ titulo: limpo, turno, prioridade: urgente ? 'urgente' : 'normal' })
          }
        >
          Salvar
        </Botao>
        <Botao estilo="fantasma" largo onClick={aoFechar}>
          Cancelar
        </Botao>
      </div>
    </Popup>
  );
}

/**
 * Seção "Atividades pendentes", separada dos turnos (HU-11, RN-12).
 * Mostra só as 3 primeiras de início: uma lista longa de pendências pesa para
 * quem tem TDAH. O resto fica a um toque.
 */
const PENDENTES_VISIVEIS = 3;
export function Pendentes({ lista, aoTrazer, aoDeixar }) {
  const [todas, setTodas] = useState(false);
  if (!lista.length) return null;
  const visiveis = todas ? lista : lista.slice(0, PENDENTES_VISIVEIS);
  const escondidas = lista.length - visiveis.length;
  return (
    <section
      aria-label="Atividades pendentes"
      className="flex flex-col gap-3 rounded-[20px] border-[1.5px] border-dashed border-[#c9c6be] p-4"
    >
      <div>
        <h2 className="text-lg">Atividades pendentes</h2>
        <p className="text-[13px] text-suave">De dias anteriores, ainda sem destino</p>
      </div>
      {visiveis.map((a) => (
        <article key={a.id} className="flex flex-col gap-2.5 rounded-[14px] bg-white p-3">
          <div>
            <p className="text-[15px]">{a.titulo}</p>
            <p className="text-xs text-suave">{a.textoDesde}</p>
          </div>
          <div className="flex gap-2">
            <Botao estilo="secundario" onClick={() => aoTrazer(a)}>
              Trazer para hoje
            </Botao>
            <Botao estilo="fantasma" onClick={() => aoDeixar(a)}>
              Deixar de lado
            </Botao>
          </div>
        </article>
      ))}
      {escondidas > 0 && (
        <Botao estilo="fantasma" largo onClick={() => setTodas(true)}>
          Ver mais {escondidas} {escondidas === 1 ? 'pendência' : 'pendências'}
        </Botao>
      )}
    </section>
  );
}

/** P7: em qual turno de hoje a pendência volta. */
export function TrazerParaHoje({ atividade, turnoSugerido, aoConfirmar, aoFechar }) {
  const [turno, setTurno] = useState(turnoSugerido);
  return (
    <Popup titulo="Em qual turno?" aoFechar={aoFechar}>
      <p className="text-[15px] leading-normal text-suave">
        "{atividade.titulo}" volta para o seu dia de hoje.
      </p>
      <div className="flex gap-2">
        {TURNOS.map((t) => (
          <Chip key={t} ativo={turno === t} onClick={() => setTurno(t)}>
            {NOME[t]}
          </Chip>
        ))}
      </div>
      <div className="flex flex-col gap-2 pt-2">
        <Botao grande largo onClick={() => aoConfirmar(turno)}>
          Trazer para hoje
        </Botao>
        <Botao estilo="fantasma" largo onClick={aoFechar}>
          Cancelar
        </Botao>
      </div>
    </Popup>
  );
}

/** 03: alerta de fim de turno (HU-04). A decisão de alertar vem do backend. */
export function AlertaDeTurno({ alerta, minutosRestantes, aoMarcar, aoLevar, aoDispensar }) {
  const n = alerta.pendencias.length;
  return (
    <Popup titulo={alerta.mensagem} aoFechar={aoDispensar} embaixo>
      {minutosRestantes > 0 && (
        <Rotulo>
          Faltam {minutosRestantes} {minutosRestantes === 1 ? 'minuto' : 'minutos'} para o fim da{' '}
          {NOME[alerta.turno].toLowerCase()}
        </Rotulo>
      )}
      <ul className="flex flex-col gap-2">
        {alerta.pendencias.map((a) => (
          <li key={a.id} className="flex items-center gap-2.5 rounded-[14px] bg-fundo p-3">
            <span className="flex-1 text-[15px]">{a.titulo}</span>
            {a.prioridade === 'urgente' && <Tag tipo="urgente" />}
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2 pt-1">
        <Botao grande largo onClick={aoMarcar}>
          Marcar as que já fiz
        </Botao>
        <Botao estilo="secundario" grande largo onClick={aoLevar}>
          {n === 1 ? 'Levar' : n === 2 ? 'Levar as duas' : 'Levar todas'} para{' '}
          {alerta.turno === 'noite'
            ? 'amanhã de manhã'
            : `a ${alerta.turno === 'manha' ? 'tarde' : 'noite'}`}
        </Botao>
        <Botao estilo="fantasma" largo onClick={aoDispensar}>
          Agora não
        </Botao>
      </div>
    </Popup>
  );
}
