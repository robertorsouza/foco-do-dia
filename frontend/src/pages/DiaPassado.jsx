import { useEffect, useState } from 'react';
import { Botao, Carregando, Falha, Pagina, Titulo } from '../components/ui.jsx';
import { Aviso } from '../components/Popup.jsx';
import { HistoricoDoDia } from '../components/Atividades.jsx';
import { useCarregar } from '../lib/useCarregar.js';
import { dataPorExtenso, nomeDoDia, somarDias } from '../lib/datas.js';

/** 02d: dia anterior, só para consulta (RN-13). */
export function DiaPassado({ api, irPara, data }) {
  const { dados, erro, carregando, recarregar } = useCarregar(async () => {
    const dia = await api.hoje();
    // Datas de hoje em diante não são histórico: volta para Hoje.
    if (data >= dia.data) return { hoje: dia.data, relatorio: null };
    return { hoje: dia.data, relatorio: await api.relatorioDiario(data) };
  }, [api, data]);
  const [aviso, setAviso] = useState(false);
  const deHojeEmDiante = dados && !dados.relatorio;
  useEffect(() => {
    if (deHojeEmDiante) irPara('hoje');
  }, [deHojeEmDiante, irPara]);

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
  if (deHojeEmDiante) return null;

  const { relatorio, hoje } = dados;
  return (
    <Pagina>
      <button
        type="button"
        onClick={() => irPara('hoje')}
        className="self-start text-sm font-medium"
      >
        ‹ Voltar para hoje
      </button>
      <Titulo data={dataPorExtenso(data)} aoTocarNaData={() => irPara('dia', somarDias(data, -1))}>
        {nomeDoDia(data, hoje)}
      </Titulo>
      <p className="rounded-xl bg-black/5 px-3 py-2.5 text-[13px] leading-normal text-suave">
        Só para consulta. Dias passados viram histórico e não mudam mais.
      </p>

      {relatorio.contagem.total === 0 ? (
        <p className="text-[15px] text-suave">Nenhuma atividade neste dia.</p>
      ) : (
        <HistoricoDoDia porTurno={relatorio.por_turno} aoTocar={() => setAviso(true)} />
      )}

      {data < somarDias(hoje, -1) && (
        <Botao estilo="secundario" largo onClick={() => irPara('dia', somarDias(data, 1))}>
          Dia seguinte ›
        </Botao>
      )}

      {aviso && (
        <Aviso
          titulo="Essa já faz parte do histórico"
          texto="Atividades de dias passados ficam guardadas para os seus relatórios, por isso não dá para editar ou excluir. Se ainda for importante, crie de novo em Hoje."
          aoFechar={() => setAviso(false)}
        />
      )}
    </Pagina>
  );
}
