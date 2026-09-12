# Backlog inicial

Proposta de sequência, não tickets já criados ou atribuídos. No fluxo do usuário, usar `/to-spec` antes de `/to-tickets` e `/implement`. IDs abaixo servem apenas para referência local.

## Primeira entrega

| ID | Trabalho | Depende de | Aceite |
| --- | --- | --- | --- |
| P-01 | Escolher engine candidata, dispositivo alvo e especificação | — | Candidata registrada para experimento; qualidade máxima incluída nos critérios |
| P-02 | Criar aplicação e verificações | P-01 | Página abre; lint, types, teste significativo e build passam; comandos documentados |
| P-03 | Movimento, câmera, colisão e pausa | P-02 | P01, P02 e P07 do protótipo passam |
| P-04 | Tacape e obstáculo | P-03 | P03 e P04 passam; um impacto não dispara várias quebras |
| P-05 | Uni segue e sinaliza | P-03 | P05 e P06 passam; não atravessa a curva nem bloqueia a porta |
| P-06 | Objetivo, saída e reinício integrado | P-04, P-05 | P08 passa; percurso completo funciona no navegador |
| P-07 | Teste acompanhado e correções | P-06 | P09 observado; registrar limitações e equipamento |
| V-01 | Prova visual antecipada | P-02 | Cena representativa conforme VISUAL-TARGET.md; aprovação visual, medições e decisão de engine registradas |

Cada item com código de produção inclui seu teste RED, implementação GREEN e refatoração quando necessária, juntos na mesma entrega. Não separar testes e código exigido por eles em commits/PRs diferentes.

## Depois de validar a sala

| ID | Trabalho | Depende de | Aceite |
| --- | --- | --- | --- |
| D-01 | Experimento de resgate de Uni | P-07 | Regras de carga, ponto seguro e reinício verificadas |
| D-02 | Integrar recursos aprovados na prova visual | P-07, V-01 | Arte funciona com as interações da sala; custo novamente medido |
| D-03 | Especificar trecho representativo | P-07 | Uma ameaça, uma cooperação e começo/fim definidos, sem ampliar a campanha |
| D-04 | Construir demonstração | D-02, D-03 | Trecho completo com áudio e interface; funcionamento e qualidade revisados |
| D-05 | Definir orçamento de produção | D-04 | Metas de download, fluidez, arte, prazo e custos baseadas nas medições |

O experimento D-01 não bloqueia arte ou narrativa; a mecânica só entra na demonstração se sua regra for escolhida. IDs não são autorização para lançar agentes paralelos ou editar o mesmo diretório em outra sessão.

## Capítulo completo: épicos ainda sem decomposição

- C-01: validar fontes e roteiro final.
- C-02: pântano e hidra.
- C-03: barganha, divisão e travessia.
- C-04: cenotáfio e reencontro.
- C-05: confronto, redenção e portal.
- C-06: continuidade entre fases, checkpoints e configurações.
- C-07: arte/áudio finais, qualidade e publicação.

Detalhar esses épicos após aprender com a demonstração. Não atribuir horas, pontos ou datas fictícios agora.

## Registro de decisão para cada entrega

Ao concluir: o que mudou, evidência de aceite, problemas restantes e próximo item desbloqueado. Quando houver tracker, transferir este backlog e registrar os IDs reais; não tratar a tabela local como issue já aberta.
