import { useCallback, useEffect, useMemo, useState } from 'react';
import { criarCliente } from './api/cliente.js';
import { criarApi } from './api/foco.js';
import { lerCodigo, salvarCodigo, apagarCodigo } from './lib/sessao.js';
import { ProvedorDeAvisos } from './components/Toast.jsx';
import { Navegacao } from './components/ui.jsx';
import { Acesso } from './pages/Acesso.jsx';
import { Acordando } from './pages/Acordando.jsx';
import { Hoje } from './pages/Hoje.jsx';
import { FecharDia } from './pages/FecharDia.jsx';
import { DiaPassado } from './pages/DiaPassado.jsx';
import { Relatorio } from './pages/Relatorio.jsx';
import { Fixas } from './pages/Fixas.jsx';

/** Rotas por hash (#/hoje, #/fechar, #/dia/2026-10-24 ...): funciona em hospedagem estática. */
function lerRota() {
  const [pagina = 'hoje', parametro] = window.location.hash.replace(/^#\/?/, '').split('/');
  return { pagina, parametro };
}

function useRota() {
  const [rota, setRota] = useState(lerRota);
  useEffect(() => {
    const aoMudar = () => {
      setRota(lerRota());
      window.scrollTo?.(0, 0);
    };
    window.addEventListener('hashchange', aoMudar);
    return () => window.removeEventListener('hashchange', aoMudar);
  }, []);
  const irPara = useCallback((pagina, parametro) => {
    window.location.hash = parametro ? `/${pagina}/${parametro}` : `/${pagina}`;
  }, []);
  return [rota, irPara];
}

const ABA_DA_PAGINA = {
  hoje: 'hoje',
  fechar: 'hoje',
  dia: 'hoje',
  relatorio: 'relatorio',
  semana: 'relatorio',
  fixas: 'fixas',
};

/**
 * @param {{ baseURL?: string, fetch?: typeof fetch }} props
 *   `fetch` só é trocado nos testes.
 */
export default function App({ baseURL = import.meta.env.VITE_API_URL ?? '', fetch }) {
  const [codigo, setCodigo] = useState(lerCodigo);
  const [motivoDaSaida, setMotivoDaSaida] = useState(null);
  const [demorando, setDemorando] = useState(false);
  const [rota, irPara] = useRota();

  const api = useMemo(() => {
    const http = criarCliente({
      baseURL,
      fetch,
      obterCodigo: lerCodigo,
      aoDemorar: setDemorando,
      aoNaoAutorizar: () => {
        apagarCodigo();
        setMotivoDaSaida('Seu código mudou. Digite o novo para continuar.');
        setCodigo(null);
      },
    });
    return criarApi(http);
  }, [baseURL, fetch]);

  const entrar = (novo) => {
    salvarCodigo(novo);
    setMotivoDaSaida(null);
    setCodigo(novo);
  };

  let conteudo;
  if (!codigo) {
    conteudo = <Acesso api={api} aoEntrar={entrar} aviso={motivoDaSaida} />;
  } else {
    const props = { api, irPara };
    const { pagina, parametro } = rota;
    conteudo = (
      <>
        {pagina === 'fechar' && <FecharDia {...props} />}
        {pagina === 'dia' && parametro && <DiaPassado {...props} data={parametro} />}
        {pagina === 'relatorio' && <Relatorio {...props} aba="dia" />}
        {pagina === 'semana' && <Relatorio {...props} aba="semana" />}
        {pagina === 'fixas' && <Fixas {...props} />}
        {(!ABA_DA_PAGINA[pagina] || pagina === 'hoje' || (pagina === 'dia' && !parametro)) && (
          <Hoje {...props} />
        )}
        <Navegacao ativa={ABA_DA_PAGINA[pagina] ?? 'hoje'} irPara={irPara} />
      </>
    );
  }

  return (
    <ProvedorDeAvisos>
      {conteudo}
      {demorando && <Acordando />}
    </ProvedorDeAvisos>
  );
}
