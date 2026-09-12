# Caverna do Dragão — Episódio Final

Aventura em primeira pessoa com Bobby e Uni, adaptando o último capítulo da jornada. **Destino confirmado: navegador, compartilhado por link.**

Status em 12/09/2026 (noite): MVP jogável da entrada do Cenotáfio com arte provisória, 31 testes de simulação, 3 cenários de navegador e medições reais no MacBook M5 Pro. Sem commits e sem publicação. Ver [relatório da noite](docs/NIGHT-REPORT-2026-09-12.md).

```bash
pnpm install && pnpm dev     # jogar em http://localhost:5173
pnpm verify                  # lint, types, testes, build, navegador
```

**Prioridade visual confirmada:** qualidade máxima de gráficos, mantendo a estética do desenho. A [direção visual](docs/VISUAL-TARGET.md) exige uma prova antecipada de qualidade e desempenho; a engine continua provisória.

## Por onde começar

1. Leia a [visão de produto](docs/PRODUCT.md) para entender o jogo e o tamanho da primeira entrega.
2. Veja o [primeiro protótipo](docs/PROTOTYPE.md): uma sala pequena que testa Bobby e Uni.
3. Leve o [briefing para o Fable](docs/FABLE-HANDOFF.md) à outra sessão.

## Mapa do projeto

| Documento | Para que serve |
| --- | --- |
| [Produto](docs/PRODUCT.md) | Experiência, escopo, decisões e dúvidas |
| [Protótipo](docs/PROTOTYPE.md) | Primeira experiência jogável e critérios de aceite |
| [Base técnica](docs/TECHNICAL-PLAN.md) | Engine proposta, responsabilidades e futura estrutura de código |
| [Produção](docs/PRODUCTION.md) | Etapas, modelos, animações, áudio e qualidade |
| [Backlog](docs/BACKLOG.md) | Ordem das entregas e dependências |
| [Briefing para o Fable](docs/FABLE-HANDOFF.md) | Contexto e pedido pronto para a próxima sessão |
| [Revisão de engine](docs/ENGINE-REVIEW.md) | Engine consolidada, ambiente de teste, metas e receita visual |
| [Spec do MVP](docs/SPEC-MVP.md) | Entrada do Cenotáfio com arte final; entrada para `/to-tickets` |
| [Medições](docs/MEASUREMENTS.md) | Resultados no M5 Pro e como reproduzir |
| [Relatório da noite](docs/NIGHT-REPORT-2026-09-12.md) | Estado por ticket, decisões e perguntas pendentes |

## Material narrativo existente

- [Ideia e stack desejada](IDEIA.md).
- [Plano atual de fases](PLANO-DE-FASES.md).
- [Personagens e habilidades](PERSONAGENS-E-HABILIDADES.md).
- [Primeiro escopo narrativo](ESCOPO-NARRATIVO.md), preservado como histórico.
- [Material recebido sobre finais e fases](REFERENCIAS-E-FASES-ORIGINAL.md), com referências ainda não verificadas.

As decisões explícitas mais recentes do usuário prevalecem sobre rascunhos antigos. Os documentos de produto distinguem decisões confirmadas de recomendações. O plano atual mantém Eric usando a chave; a escolha de Bobby acontece no epílogo e ainda precisa de definição.

No fluxo pessoal do projeto, `/to-spec` já foi conduzido (12/09/2026); o próximo passo sugerido é `/to-tickets` a partir do spec do MVP. Nenhuma skill desse fluxo foi invocada automaticamente.
