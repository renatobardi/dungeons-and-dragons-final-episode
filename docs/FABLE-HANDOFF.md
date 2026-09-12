# Briefing para a sessão com o Fable

## Contexto

O usuário não tem experiência com desenvolvimento de games e quer conduzir o projeto com ajuda dos agentes. O destino confirmado é navegador, com compartilhamento por link. Esta sessão organizou a pré-produção; não implementou nem publicou o jogo.

O usuário pretende usar o Fable em outra sessão. Nenhuma sessão foi criada, nenhum modelo foi trocado e nenhuma tarefa foi enviada automaticamente.

## Pedido pronto para levar à sessão

**Prioridade mais recente:** qualidade máxima de gráficos, mantendo navegador e estética do desenho. Equipamento de referência confirmado: **MacBook M5 com 24 GB de RAM**. Leia [VISUAL-TARGET.md](VISUAL-TARGET.md). Babylon.js é uma candidatura provisória; avaliar uma prova visual antecipada antes de consolidar a engine. Navegador e resolução de teste continuam a definir.

> Atue como engenheiro de produto e arquiteto de games. Leia README.md e os documentos de docs/ deste projeto. Quero validar a base de um jogo web em primeira pessoa, com Bobby e Uni, restrito ao último capítulo de Caverna do Dragão. Sou iniciante: explique decisões em PT-BR e traduza termos técnicos quando necessários.
>
> Minha prioridade é qualidade máxima de gráficos, preservando a estética do desenho e a entrega por navegador. Meu equipamento de referência é um MacBook M5 com 24 GB de RAM. Revise a candidatura Babylon.js + TypeScript e planeje uma prova visual antecipada. O protótipo simples continua validando controles, mas não representa o acabamento final. Defina navegador e resolução de teste, proponha metas mensuráveis e consolide a engine somente com evidências. Separe decisões confirmadas, hipóteses e dúvidas bloqueadoras; não amplie para quatro fases antes de validar a sala e a direção visual.
>
> Preserve Eric como autor do gesto com a chave no plano atual. Não apresente as referências narrativas recebidas como verificadas. Não transforme toda habilidade citada em funcionalidade obrigatória. Os rascunhos antigos contêm ideias já superadas.
>
> Quero sair desta revisão com uma especificação executável do primeiro protótipo e critérios de aceite. Siga meu fluxo conduzido por mim: sugira /to-spec e depois /to-tickets; não invoque essas skills automaticamente. Antes de implementar, cumpra TDD, lint, types e testes. Não faça push nem publique sem pedido.

## Ordem de leitura

1. [Produto](PRODUCT.md): decisões e recorte.
2. [Protótipo](PROTOTYPE.md): comportamento observável.
3. [Base técnica](TECHNICAL-PLAN.md): recomendação e trade-offs.
4. [Produção](PRODUCTION.md) e [backlog](BACKLOG.md).
5. [Plano de fases](../PLANO-DE-FASES.md) e [habilidades](../PERSONAGENS-E-HABILIDADES.md), como contexto da expansão futura.

## Questões de maior impacto

- O fluxo em código com Babylon é adequado para o usuário ou o benefício de um editor como Godot justifica outra escolha?
- Qual equipamento e quais navegadores definirão “funciona bem”?
- O protótipo ensina a força de Bobby e a presença de Uni sem explicação externa?
- Que evidência é necessária antes de produzir modelos e vozes finais?

Uni automática com uma carga por tentativa, desktop com mouse/teclado e durações sugeridas são recomendações para teste, não decisões já aprovadas pelo usuário. Voltar/permanecer, destino de Uni e fidelidade dos detalhes de Requiem continuam pendentes para a campanha.

## Estado do repositório nesta entrega

Na inspeção inicial, o repositório estava em `main` com os cinco documentos narrativos não rastreados. Esta entrega adiciona documentação; não criou branch, commit ou push. Reinspecionar o estado antes de qualquer operação Git. Não trocar branch com árvore suja nem usar stash ou commit alheio como atalho.

Se outra sessão trabalhar simultaneamente, respeitar worktrees e arquivos sob responsabilidade de cada frente. Não disparar implementação paralela apenas porque este documento contém uma sequência de tarefas.

## Critério de conclusão da revisão

Registrar engine escolhida ou dúvida concreta restante, ambiente de teste, especificação da sala e ordem dos primeiros tickets. Uma lista de tecnologias, sozinha, não encerra a revisão.
