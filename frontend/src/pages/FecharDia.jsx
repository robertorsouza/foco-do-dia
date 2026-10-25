import { useState } from 'react';
import { Botao, Carregando, Chip, Falha, Pagina, Tag, Titulo } from '../components/ui.jsx';
import { Confirmar } from '../components/Popup.jsx';
import { useAvisar } from '../components/Toast.jsx';
import { useCarregar } from '../lib/useCarregar.js';
import { dataPorExtenso } from '../lib/datas.js';
import { NOME, opcoesDeFechamento } from '../lib/turnos.js';

/**
 * 04: fechar o dia (HU-06, RN-07, RN-11). O app pergunta, não impõe:
 * cada pendência já vem com o destino sugerido, e não fechar também é uma escolha.
 */
export function FecharDia({ api, irPara }) {
  const avisar = useAvisar();
  const { dados, erro, carregando, recarregar } = useCarregar(async () => {
    const dia = await api.hoje();
    const sugestoes = await api.sugestoesDeFechamento(dia.data);
    return { dia, sugestoes };
  }, [api]);
  const [escolhas, setEscolhas] = useState({});
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);

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

  const { dia, sugestoes } = dados;
  const { feitas, total } = dia.progresso.dia;
  const escolhaDe = (id) => escolhas[id] ?? 'amanha';

  async function fechar() {
    setEnviando(true);
    const destinos = sugestoes.flatMap(({ atividade, sugestao }) => {
      const opcao = opcoesDeFechamento(atividade, sugestao).find(
        (o) => o.chave === escolhaDe(atividade.id),
      );
      return opcao.destino ? [{ id: atividade.id, ...opcao.destino }] : [];
    });
    try {
      await api.fecharDia(dia.data, destinos);
      avisar('Dia fechado. Bom descanso.');
      irPara('hoje');
    } catch (falha) {
      setConfirmando(false);
      avisar(falha.message);
      await recarregar();
    } finally {
      setEnviando(false);
    }
  }

  const n = sugestoes.length;
  return (
    <Pagina>
      <Titulo data={dataPorExtenso(dia.data)}>Fechar o dia</Titulo>

      {dia.fechado ? (
        <>
          <p className="text-[15px] leading-normal text-suave">
            Este dia já está fechado. Se adicionar algo novo hoje, ele reabre.
          </p>
          <Botao grande largo onClick={() => irPara('hoje')}>
            Voltar para hoje
          </Botao>
        </>
      ) : (
        <>
          <p className="text-[15px] leading-normal text-suave">
            Você fez {feitas} de {total} hoje.{' '}
            {n === 0
              ? 'Não ficou nada para depois.'
              : `${n === 1 ? 'Uma ficou' : `${n} ficaram`} para depois, e está tudo bem. Deixei uma sugestão de destino para ${n === 1 ? 'ela' : 'cada uma'}; mude se quiser.`}
          </p>

          {sugestoes.map(({ atividade, sugestao }) => (
            <fieldset
              key={atividade.id}
              className="flex flex-col gap-3 rounded-[18px] border border-linha bg-white p-3.5"
            >
              <legend className="sr-only">Destino de {atividade.titulo}</legend>
              <div className="flex items-center gap-2">
                <p className="flex-1 text-base">{atividade.titulo}</p>
                {atividade.prioridade === 'urgente' && <Tag tipo="urgente" />}
              </div>
              <p className="-mt-2 text-xs text-suave">{NOME[atividade.turno]}</p>
              <div className="flex flex-wrap gap-1.5">
                {opcoesDeFechamento(atividade, sugestao).map((o) => (
                  <Chip
                    key={o.chave}
                    ativo={escolhaDe(atividade.id) === o.chave}
                    onClick={() => setEscolhas((e) => ({ ...e, [atividade.id]: o.chave }))}
                  >
                    {o.rotulo}
                    {o.chave === 'amanha' && <span className="ml-1 opacity-70">· sugerido</span>}
                  </Chip>
                ))}
              </div>
            </fieldset>
          ))}

          <section className="flex flex-col gap-3 rounded-2xl bg-black/[0.04] p-4">
            <h2 className="text-xl font-light">Quer fechar o dia agora?</h2>
            {n > 0 && (
              <>
                <p className="text-[15px] leading-normal text-suave">
                  Se precisar de ajuda, posso aplicar as sugestões de uma vez para você.
                </p>
                <Botao estilo="secundario" largo onClick={() => setEscolhas({})}>
                  Usar todas as sugestões
                </Botao>
              </>
            )}
          </section>

          <div className="flex flex-col gap-2">
            <Botao grande largo onClick={() => setConfirmando(true)}>
              Fechar o dia
            </Botao>
            <Botao estilo="fantasma" largo onClick={() => irPara('hoje')}>
              Agora não
            </Botao>
            <p className="text-center text-[13px] leading-normal text-suave">
              Se preferir não fechar, fique tranquilo. Amanhã o dia começa leve, com os turnos
              zerados, e o que ficou sem destino espera com calma em Atividades pendentes.
            </p>
          </div>
        </>
      )}

      {confirmando && (
        <Confirmar
          titulo="Fechar o dia?"
          texto="Cada atividade vai para o destino escolhido. Se mudar de ideia, é só adicionar ou desmarcar algo hoje: o dia reabre."
          sim="Sim, fechar"
          nao="Ainda não"
          ocupado={enviando}
          aoConfirmar={fechar}
          aoFechar={() => setConfirmando(false)}
        />
      )}
    </Pagina>
  );
}
