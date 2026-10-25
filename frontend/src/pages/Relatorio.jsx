import { useState } from 'react';
import { Botao, Carregando, Falha, Pagina, Rotulo, Titulo } from '../components/ui.jsx';
import { Confirmar } from '../components/Popup.jsx';
import { useAvisar } from '../components/Toast.jsx';
import { useCarregar } from '../lib/useCarregar.js';
import { dataPorExtenso, inicialDaSemana, intervalo, somarDias } from '../lib/datas.js';
import { NOME, TURNOS } from '../lib/turnos.js';

const TODO_TURNO = { manha: 'todas as manhãs', tarde: 'todas as tardes', noite: 'todas as noites' };
const NO_TURNO = { manha: 'de manhã', tarde: 'à tarde', noite: 'à noite' };

function Abas({ aba, irPara }) {
  return (
    <div role="tablist" className="flex rounded-xl bg-black/[0.06] p-1">
      {[
        ['dia', 'Dia', 'relatorio'],
        ['semana', 'Semana', 'semana'],
      ].map(([chave, nome, rota]) => (
        <button
          key={chave}
          type="button"
          role="tab"
          aria-selected={aba === chave}
          onClick={() => irPara(rota)}
          className={`flex-1 rounded-[9px] py-2 text-sm ${
            aba === chave ? 'bg-white font-semibold' : 'text-suave'
          }`}
        >
          {nome}
        </button>
      ))}
    </div>
  );
}

function Numero({ feitas, total }) {
  return (
    <p className="flex items-baseline gap-2.5">
      <span className="text-[64px] font-extralight leading-none tracking-[-2px]">
        {feitas} de {total}
      </span>
      <span className="text-base text-suave">concluídas</span>
    </p>
  );
}

function Contadores({ itens }) {
  return (
    <div className="flex gap-2">
      {itens.map(([n, rotulo]) => (
        <div key={rotulo} className="flex-1 rounded-[14px] border border-linha bg-white p-3">
          <p className="text-[22px] font-light">{n}</p>
          <p className="text-[13px] text-suave">{rotulo}</p>
        </div>
      ))}
    </div>
  );
}

/** 05: relatório do dia (HU-07, HU-10). */
function RelatorioDoDia({ api, hoje }) {
  const avisar = useAvisar();
  const { dados, erro, carregando, recarregar } = useCarregar(
    () => api.relatorioDiario(hoje),
    [api, hoje],
  );
  const [sugestao, setSugestao] = useState(null);

  if (carregando && !dados) return <Carregando />;
  if (!dados) return <Falha erro={erro} tentarDeNovo={recarregar} />;

  const r = dados;
  const naoFeitas = TURNOS.flatMap((t) => r.por_turno[t].nao_feitas);
  const conta = (s) => naoFeitas.filter((a) => a.status === s).length;

  async function tornarFixa() {
    const s = sugestao;
    setSugestao(null);
    try {
      await api.criarFixa({ titulo: s.titulo, turno: s.turno });
      avisar(`Pronto. "${s.titulo}" agora é fixa.`);
    } catch (falha) {
      avisar(falha.message);
    }
    await recarregar();
  }

  return (
    <>
      <Numero feitas={r.contagem.feitas} total={r.contagem.total} />

      <section className="flex flex-col gap-2 rounded-[18px] border border-linha bg-white p-4">
        <Rotulo>Resumo</Rotulo>
        <p className="text-[17px] font-light leading-normal">{r.mensagem}</p>
      </section>

      {r.contagem.total > 0 && (
        <section className="flex flex-col gap-3" aria-label="Por turno">
          <Rotulo>Por turno</Rotulo>
          {TURNOS.map((t) => {
            const f = r.por_turno[t].feitas.length;
            const tot = f + r.por_turno[t].nao_feitas.length;
            return (
              <div key={t} className="flex items-center gap-3 text-sm">
                <span className="w-14">{NOME[t]}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-linha">
                  <div
                    className="h-2.5 rounded-full bg-tinta"
                    style={{ width: `${tot ? (f / tot) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-8 text-right text-suave">
                  {f}/{tot}
                </span>
              </div>
            );
          })}
        </section>
      )}

      {naoFeitas.length > 0 && (
        <Contadores
          itens={[
            [conta('movida'), 'movidas'],
            [conta('em_aberto') + conta('pendente'), 'em aberto'],
            [conta('deixada_de_lado'), 'deixadas de lado'],
          ]}
        />
      )}

      {r.plano_amanha.length > 0 && (
        <section className="flex flex-col gap-2 rounded-[18px] border border-linha bg-white p-4">
          <Rotulo>Amanhã você já tem</Rotulo>
          <ul className="text-[15px]">
            {r.plano_amanha.map((a) => (
              <li key={a.id} className="py-1">
                {a.titulo} <span className="text-suave">· {NOME[a.turno]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {r.sugestoes_fixas.map((s) => (
        <section key={s.titulo} className="flex flex-col gap-2.5 rounded-[18px] bg-noite p-4">
          <Rotulo>Virar atividade fixa?</Rotulo>
          <div>
            <p className="text-base">{s.titulo}</p>
            <p className="text-[13px] text-suave">
              Feita em {s.dias} dos últimos 7 dias, mais vezes {NO_TURNO[s.turno]}
            </p>
          </div>
          <div className="flex gap-2">
            <Botao onClick={() => setSugestao(s)}>Tornar fixa</Botao>
          </div>
        </section>
      ))}

      {sugestao && (
        <Confirmar
          titulo={`Tornar "${sugestao.titulo}" fixa?`}
          texto={`Ela vai aparecer sozinha ${TODO_TURNO[sugestao.turno]}, a partir de amanhã.`}
          sim="Sim, tornar fixa"
          nao="Não, obrigado"
          aoConfirmar={tornarFixa}
          aoFechar={() => setSugestao(null)}
        />
      )}
    </>
  );
}

/** 05b: relatório da semana (HU-08), os últimos 7 dias até hoje. */
function RelatorioDaSemana({ api, hoje }) {
  const { dados, erro, carregando, recarregar } = useCarregar(
    () => api.relatorioSemanal(somarDias(hoje, -6)),
    [api, hoje],
  );

  if (carregando && !dados) return <Carregando />;
  if (!dados) return <Falha erro={erro} tentarDeNovo={recarregar} />;

  const feitas = dados.dias.reduce((s, d) => s + d.feitas, 0);
  const total = dados.dias.reduce((s, d) => s + d.total, 0);
  const comAtividade = dados.dias.filter((d) => d.total > 0);
  const melhor = [...comAtividade].sort(
    (a, b) => b.percentual - a.percentual || b.feitas - a.feitas,
  )[0];

  return (
    <>
      <Numero feitas={feitas} total={total} />

      <section className="flex flex-col gap-2 rounded-[18px] border border-linha bg-white p-4">
        <Rotulo>Resumo</Rotulo>
        <p className="text-[17px] font-light leading-normal">
          {melhor
            ? `O dia que mais rendeu foi ${dataPorExtenso(melhor.data).split(',')[0].toLowerCase()}, com ${melhor.feitas} de ${melhor.total}. Cada dia conta.`
            : 'Semana livre. Que tal planejar só uma coisa para amanhã?'}
        </p>
      </section>

      <section
        aria-label="Por dia"
        className="flex flex-col gap-3 rounded-[18px] border border-linha bg-white p-4"
      >
        <Rotulo>Por dia</Rotulo>
        <ul className="flex items-end justify-between">
          {dados.dias.map((d) => (
            <li key={d.data} className="flex flex-col items-center gap-1.5">
              <div
                className="flex h-[100px] w-7 flex-col justify-end overflow-hidden rounded-md bg-linha"
                title={`${dataPorExtenso(d.data)}: ${d.feitas} de ${d.total}`}
              >
                <div className="w-7 rounded-md bg-tinta" style={{ height: `${d.percentual}%` }} />
              </div>
              <span className="text-xs text-suave" aria-hidden="true">
                {inicialDaSemana(d.data)}
              </span>
              <span className="sr-only">
                {dataPorExtenso(d.data)}: {d.feitas} de {d.total}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <Contadores itens={[[dados.pendencias.length, 'em aberto na semana']]} />
    </>
  );
}

/** 05 e 05b. */
export function Relatorio({ api, irPara, aba }) {
  const { dados: dia, erro, recarregar } = useCarregar(() => api.hoje(), [api]);
  if (!dia) {
    return (
      <Pagina>{erro ? <Falha erro={erro} tentarDeNovo={recarregar} /> : <Carregando />}</Pagina>
    );
  }
  const hoje = dia.data;
  return (
    <Pagina>
      <Titulo data={aba === 'dia' ? dataPorExtenso(hoje) : intervalo(somarDias(hoje, -6), hoje)}>
        {aba === 'dia' ? 'Seu dia' : 'Sua semana'}
      </Titulo>
      <Abas aba={aba} irPara={irPara} />
      {aba === 'dia' ? (
        <RelatorioDoDia api={api} hoje={hoje} />
      ) : (
        <RelatorioDaSemana api={api} hoje={hoje} />
      )}
    </Pagina>
  );
}
