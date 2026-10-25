/**
 * Funções da API, uma por endpoint (contrato em docs/arquitetura.md, seção 5).
 * @param {ReturnType<import('./cliente.js').criarCliente>} http
 */
export function criarApi(http) {
  return {
    /** Confere um código antes de salvá-lo (tela de acesso). */
    testarCodigo: (codigo) => http.get('/hoje', { codigo }),

    hoje: () => http.get('/hoje'),
    dia: (data) => http.get(`/dias/${data}`),
    sugestoesDeFechamento: (data) => http.get(`/dias/${data}/sugestoes-fechamento`),
    fecharDia: (data, destinos) => http.post(`/dias/${data}/fechar`, { destinos }),

    criarAtividade: (dados) => http.post('/atividades', dados),
    editarAtividade: (id, campos) => http.patch(`/atividades/${id}`, campos),
    excluirAtividade: (id) => http.delete(`/atividades/${id}`),
    moverAtividade: (id, destino) => http.post(`/atividades/${id}/mover`, destino),
    deixarDeLado: (id) => http.post(`/atividades/${id}/deixar-de-lado`),
    desfazerMovimento: (idDaCopia) => http.post(`/atividades/${idDaCopia}/desfazer-movimento`),

    pendencias: () => http.get('/pendencias'),
    alertaDeAgora: () => http.get('/alertas/agora'),

    relatorioDiario: (data) => http.get(`/relatorios/diario/${data}`),
    relatorioSemanal: (inicio) => http.get(`/relatorios/semanal?inicio=${inicio}`),

    criarFixa: (dados) => http.post('/fixas', dados),
  };
}
