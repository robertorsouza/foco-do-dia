import { Botao, Pagina, Rotulo, Tag } from '../components/ui.jsx';

/** 06: a gestão de fixas fica para a próxima versão (requisitos, seção 10). */
export function Fixas({ irPara }) {
  return (
    <Pagina>
      <header className="flex items-center gap-3">
        <h1 className="text-[40px] font-light tracking-[-1px]">Fixas</h1>
        <span className="rounded-full bg-noite px-2.5 py-1 text-[11px] font-bold tracking-[0.6px] text-noite-forte">
          PRÓXIMA VERSÃO
        </span>
      </header>
      <p className="text-2xl font-light leading-tight tracking-[-0.4px]">
        O que se repete, sem precisar lembrar.
      </p>
      <p className="text-[15px] leading-normal text-suave">
        Atividades fixas aparecem sozinhas no turno certo, todos os dias. Assim sua cabeça fica
        livre para o que é novo.
      </p>

      <section aria-label="Prévia" className="rounded-[20px] bg-noite p-4 opacity-60">
        <Rotulo>Uma prévia</Rotulo>
        {['Tomar remédio', 'Academia', 'Ler 10 páginas'].map((t) => (
          <div
            key={t}
            className="flex items-center gap-3 border-t border-black/5 py-2.5 first-of-type:border-0"
          >
            <span className="h-6 w-6 rounded-full border-[1.5px] border-tinta" />
            <span className="flex-1">{t}</span>
            <Tag tipo="fixa" />
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <Rotulo>O que vem por aí</Rotulo>
        <ol className="flex flex-col gap-3">
          {[
            'Ver e editar todas as suas fixas num só lugar',
            'Escolher em quais dias da semana cada uma aparece',
            'Pausar uma fixa nas férias, sem precisar apagar',
          ].map((t, i) => (
            <li key={t} className="flex items-center gap-3 text-[15px]">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-linha bg-white text-[13px] font-medium">
                {i + 1}
              </span>
              {t}
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-[18px] border border-linha bg-white p-4">
        <Rotulo>Enquanto isso</Rotulo>
        <p className="mt-2 text-[15px] leading-normal">
          Quando você fizer a mesma atividade em 3 dias da semana, eu pergunto no relatório se quer
          torná-la fixa. Você decide, sem pressa.
        </p>
      </section>

      <Botao estilo="secundario" grande largo onClick={() => irPara('hoje')}>
        Voltar para hoje
      </Botao>
    </Pagina>
  );
}
