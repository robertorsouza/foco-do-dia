import { useCallback, useEffect, useState } from 'react';

/**
 * Carrega dados da API e permite recarregar depois de uma ação.
 * Em `recarregar`, os dados atuais continuam na tela até a resposta chegar
 * (sem "piscar" a tela a cada toque).
 */
export function useCarregar(buscar, deps) {
  const [estado, setEstado] = useState({ dados: null, erro: null, carregando: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const funcao = useCallback(buscar, deps);

  const recarregar = useCallback(async () => {
    try {
      const dados = await funcao();
      setEstado({ dados, erro: null, carregando: false });
      return dados;
    } catch (erro) {
      setEstado((e) => ({ ...e, erro, carregando: false }));
      return null;
    }
  }, [funcao]);

  useEffect(() => {
    let ativo = true;
    setEstado((e) => ({ ...e, carregando: true }));
    funcao()
      .then((dados) => ativo && setEstado({ dados, erro: null, carregando: false }))
      .catch((erro) => ativo && setEstado({ dados: null, erro, carregando: false }));
    return () => {
      ativo = false;
    };
  }, [funcao]);

  return { ...estado, recarregar };
}
