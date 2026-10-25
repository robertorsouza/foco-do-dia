import { useCallback, useEffect, useState } from 'react';
import { Botao, Carregando, Falha, Pagina, Titulo } from '../components/ui.jsx';
import { Aviso, Confirmar } from '../components/Popup.jsx';
import { useAvisar } from '../components/Toast.jsx';
import {
  Adicionar,
  AlertaDeTurno,
  Atividade,
  CartaoDoTurno,
  EditarAtividade,
  HistoricoDoDia,
  MenuDaAtividade,
  Pendentes,
  TrazerParaHoje,
} from '../components/Atividades.jsx';
import { useCarregar } from '../lib/useCarregar.js';
import { dataCurta, dataPorExtenso, somarDias } from '../lib/datas.js';
import { TURNOS, avisoMovida, turnoAtual } from '../lib/turnos.js';
import { alertaDispensado, dispensarAlerta } from '../lib/sessao.js';

const FIM_DO_TURNO = { manha: 12 * 60, tarde: 18 * 60, noite: 23 * 60 };
const INTERVALO_DO_ALERTA_MS = 60_000;

function textoDesde(p, hoje) {
  if (p.pendente_desde === somarDias(hoje, -1)) return 'Em aberto desde ontem';
  return `Em aberto desde ${dataCurta(p.pendente_desde)}`;
}

/** 02, 02b e 02c: o dia de hoje. */
export function Hoje({ api, irPara, agora = () => new Date() }) {
  const avisar = useAvisar();
  const { dados, erro, carregando, recarregar } = useCarregar(async () => {
    const [dia, pendencias] = await Promise.all([api.hoje(), api.pendencias()]);
    const relatorio = dia.fechado ? await api.relatorioDiario(dia.data) : null;
    return { dia, pendencias, relatorio };
  }, [api]);

  // Popup aberto: { tipo, atividade }
  const [popup, setPopup] = useState(null);
  const [alerta, setAlerta] = useState(null);
  const fechar = useCallback(() => setPopup(null), []);

  /** Executa uma ação; erros da API viram aviso com a mensagem dela. */
  async function agir(acao, textoDeSucesso) {
    setPopup(null);
    try {
      await acao();
      if (textoDeSucesso) avisar(textoDeSucesso);
      return true;
    } catch (falha) {
      avisar(falha.message);
      return false;
    } finally {
      await recarregar();
    }
  }

  // HU-04: pergunta ao backend a cada minuto se é hora de alertar.
  useEffect(() => {
    let ativo = true;
    async function verificar() {
      try {
        const r = await api.alertaDeAgora();
        if (ativo && r.alertar && !alertaDispensado(r.data, r.turno)) setAlerta(r);
      } catch {
        // Sem alerta se a consulta falhar; tenta de novo no próximo minuto.
      }
    }
    verificar();
    const timer = setInterval(verificar, INTERVALO_DO_ALERTA_MS);
    return () => {
      ativo = false;
      clearInterval(timer);
    };
  }, [api]);

  if (carregando && !dados)
    return (
      <Pagina>
        <Carregando />
      </Pagina>
    );
  if (!dados)
    return (
      <Pagina>
        <Falha erro={erro} tentarDeNovo={recarregar} />
      </Pagina>
    );

  const { dia, pendencias, relatorio } = dados;
  const hoje = dia.data;
  const atual = turnoAtual(agora());
  // Dia fechado: os turnos só mostram as feitas; o total real vem do relatório.
  const { feitas, total } = relatorio ? relatorio.contagem : dia.progresso.dia;
  const vazio = total === 0 && !dia.fechado;
  const minutos = agora().getHours() * 60 + agora().getMinutes();

  const marcar = (a) =>
    agir(() => api.editarAtividade(a.id, { status: a.status === 'feita' ? 'pendente' : 'feita' }));

  function escolherNoMenu(chave) {
    const a = popup.atividade;
    if (chave === 'marcar' || chave === 'desmarcar') return marcar(a);
    if (chave === 'proximo_turno' || chave === 'amanha') {
      return agir(() => api.moverAtividade(a.id, { destino: chave }), avisoMovida(chave, a.turno));
    }
    setPopup({ tipo: chave, atividade: a });
  }

  async function levarPendenciasDoAlerta() {
    const lista = alerta.pendencias;
    setAlerta(null);
    dispensarAlerta(alerta.data, alerta.turno);
    await agir(
      () => Promise.all(lista.map((a) => api.moverAtividade(a.id, { destino: 'proximo_turno' }))),
      avisoMovida('proximo_turno', alerta.turno),
    );
  }

  return (
    <Pagina>
      <Titulo data={dataPorExtenso(hoje)} aoTocarNaData={() => irPara('dia', somarDias(hoje, -1))}>
        Hoje
      </Titulo>

      {vazio ? (
        <div>
          <p className="text-[22px] font-light">Seu dia está em branco.</p>
          <p className="text-[15px] leading-normal text-suave">
            Comece pelo que importa agora. Uma coisa já é um bom começo.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={feitas}
            aria-label="Progresso do dia"
            className="h-1.5 overflow-hidden rounded bg-linha"
          >
            <div
              className="h-1.5 rounded bg-tinta transition-[width]"
              style={{ width: `${total ? (feitas / total) * 100 : 0}%` }}
            />
          </div>
          <p className="text-sm text-suave">
            {dia.fechado
              ? `Dia fechado · ${feitas} de ${total} feitas`
              : `${feitas} de ${total} feitas`}
          </p>
        </div>
      )}

      {dia.fechado && (
        <section className="flex flex-col gap-2 rounded-[18px] bg-noite p-4">
          <p className="text-xl font-light">Dia fechado. Bom descanso.</p>
          <p className="text-sm leading-normal text-suave">
            Se lembrar de algo, é só adicionar abaixo. O dia reabre sem problema.
          </p>
          <div>
            <Botao onClick={() => irPara('relatorio')}>Ver relatório do dia</Botao>
          </div>
        </section>
      )}

      <Adicionar
        turnoInicial={atual}
        aoAdicionar={(dados) => agir(() => api.criarAtividade({ ...dados, data: hoje }))}
      />

      {dia.fechado && relatorio ? (
        <HistoricoDoDia
          porTurno={relatorio.por_turno}
          aoTocar={(a) =>
            setPopup({ tipo: a.status === 'feita' ? 'menu' : 'historico', atividade: a })
          }
        />
      ) : (
        TURNOS.map((t) => (
          <CartaoDoTurno
            key={t}
            turno={t}
            atual={t === atual && !vazio}
            vazio={dia.turnos[t].length === 0}
          >
            <ul>
              {dia.turnos[t].map((a) => (
                <Atividade
                  key={a.id}
                  atividade={a}
                  aoMarcar={marcar}
                  aoAbrir={(x) => setPopup({ tipo: 'menu', atividade: x })}
                />
              ))}
            </ul>
          </CartaoDoTurno>
        ))
      )}

      {!dia.fechado && !vazio && (
        <Botao estilo="secundario" grande largo onClick={() => irPara('fechar')}>
          Fechar o dia
        </Botao>
      )}

      <Pendentes
        lista={pendencias.map((p) => ({ ...p, textoDesde: textoDesde(p, hoje) }))}
        aoTrazer={(a) => setPopup({ tipo: 'trazer', atividade: a })}
        aoDeixar={(a) => setPopup({ tipo: 'deixar', atividade: a })}
      />

      {popup?.tipo === 'menu' && (
        <MenuDaAtividade
          atividade={popup.atividade}
          aoEscolher={escolherNoMenu}
          aoFechar={fechar}
        />
      )}
      {popup?.tipo === 'editar' && (
        <EditarAtividade
          atividade={popup.atividade}
          aoFechar={fechar}
          aoSalvar={(campos) =>
            agir(() => api.editarAtividade(popup.atividade.id, campos), 'Salvo.')
          }
        />
      )}
      {popup?.tipo === 'deixar' && (
        <Confirmar
          titulo={`Deixar "${popup.atividade.titulo}" de lado?`}
          texto="Tudo bem não fazer tudo. Ela sai do seu dia e fica só no histórico."
          sim="Sim, deixar de lado"
          nao="Manter"
          aoFechar={fechar}
          aoConfirmar={() => agir(() => api.deixarDeLado(popup.atividade.id), 'Deixada de lado.')}
        />
      )}
      {popup?.tipo === 'excluir' && (
        <Confirmar
          titulo={`Excluir "${popup.atividade.titulo}"?`}
          texto="Ela sai do seu dia e não dá para desfazer."
          sim="Sim, excluir"
          nao="Cancelar"
          aoFechar={fechar}
          aoConfirmar={() => agir(() => api.excluirAtividade(popup.atividade.id), 'Excluída.')}
        />
      )}
      {popup?.tipo === 'trazer' && (
        <TrazerParaHoje
          atividade={popup.atividade}
          turnoSugerido={atual}
          aoFechar={fechar}
          aoConfirmar={(turno) =>
            agir(
              () => api.moverAtividade(popup.atividade.id, { destino: 'data', data: hoje, turno }),
              'Voltou para hoje.',
            )
          }
        />
      )}
      {popup?.tipo === 'historico' && (
        <Aviso
          titulo="Essa já faz parte do histórico"
          texto="Atividades movidas ou de dias passados ficam guardadas para os seus relatórios."
          aoFechar={fechar}
        />
      )}

      {alerta && !popup && (
        <AlertaDeTurno
          alerta={alerta}
          minutosRestantes={FIM_DO_TURNO[alerta.turno] - minutos}
          aoMarcar={() => {
            dispensarAlerta(alerta.data, alerta.turno);
            setAlerta(null);
          }}
          aoLevar={levarPendenciasDoAlerta}
          aoDispensar={() => {
            dispensarAlerta(alerta.data, alerta.turno);
            setAlerta(null);
          }}
        />
      )}
    </Pagina>
  );
}
