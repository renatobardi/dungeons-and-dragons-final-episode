# Relatório da noite — 12/09/2026

Execução dos tickets 01–12 de `.scratch/mvp-cenotafio/issues/` sem pausas. Tudo está na árvore de trabalho, **sem commits**: a guarda de git do ambiente bloqueia criar branch com árvore suja, e a regra do projeto proíbe contornar. Decisão de git fica para você (ver "Perguntas").

## Como rodar

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm verify       # lint + types + Vitest + build + Playwright
pnpm measure      # medição no Chrome com GPU real (precisa de pnpm preview rodando)
```

## Estado por ticket

| # | Ticket | Estado | Evidência |
| --- | --- | --- | --- |
| 01 | Teste de arte da Uni | **Bloqueado** (você) | Precisa de acesso ao Meshy, referências aprovadas e Blender (não instalado nesta máquina) |
| 02 | Aplicação abre, "Jogar" e pausa | **Feito** | Vitest 4 testes da máquina de estados; Playwright P01 e P07; WebGPU com fallback WebGL2; `pnpm verify` único |
| 03 | Andar e olhar pela entrada da tumba | **Feito** | Vitest 9 testes (passo fixo, colisão com paredes e colunas, deslizar, pausa descarta comandos); Playwright P02 com teclas reais |
| 04 | Tacape e passagem bloqueada | **Feito** | Vitest 8 testes (alcance, parede no caminho, simples vs pesado, quebra única, carga cancelada na pausa pelos dois caminhos); Playwright P03/P04 com clique real e Esc durante a carga |
| 05 | Uni segue e alerta | **Feito** | Vitest 10 testes (segue pela curva, volta, contorna a parede da curva, aproxima-se fora da trilha, não entra na porta, alerta único, pose de alerta); Playwright P05 |
| 06 | Saída, conclusão e reinício | **Feito** | Vitest 4 testes; Playwright P08 (3 reinícios sem duplicar Uni nem erros) |
| 07 | Cenotáfio com arte final e medições | **Parcial** | Cenário modular em código com texturas pintadas geradas, tochas, sombras PCF, TAA, bloom, névoa; painel de depuração (F3) com DPR/TAA/sombras e p95; medições reais no M5 Pro ([MEASUREMENTS.md](MEASUREMENTS.md)). **Não é arte final**: sem Blender, as peças são primitivas com material pintado |
| 08 | Uni final no jogo | **Bloqueado** por 01 | Uni provisória de primitivas com parada/andar/alerta e chifre que brilha; a classe que a desenha troca de corpo sem mudar regras |
| 09 | Mãos, tacape e obstáculo finais | **Parcial** | Mãos/tacape provisórios com animação de carga, golpe simples e pesado; obstáculo intacto/quebrado com poeira. Modelos finais dependem de Meshy/Blender |
| 10 | Áudio final e interface acabada | **Parcial** | Áudio sintetizado em WebAudio (ambiente, golpe, quebra, balido, carrilhão), sem arquivos nem licenças; interface completa (início, HUD com carga, dica E, banner de alerta, pausa com sensibilidade e balanço, conclusão). "Final" depende da sua aprovação |
| 11 | Evidência visual e aprovação | **Parcial** | Vídeo, 7 capturas e tabela em `docs/measurements/`. Falta comparação com frames do desenho (sem referências) e sua aprovação escrita |
| 12 | Teste com uma pessoa | **Bloqueado** (você) | Precisa de uma pessoa |

Totais: Vitest 35 testes, Playwright 7 cenários, lint e types limpos, build 3 MB em disco / 0,6 MB transferidos.

## O que você vai ver

Abra `pnpm dev`, clique "Jogar". Pórtico de pedra com feixe de luz, corredor com tochas, curva, sala com colunas e uma pilha de escombros bloqueando a porta. Uni (provisória, branca com chifre dourado) segue você e bale ao descobrir o bloqueio. Segure o clique até "PRONTO" e solte para quebrar. Atravesse, aperte E na luz dourada. Tela de conclusão com reiniciar. F3 abre o painel de depuração.

## Decisões técnicas tomadas sem você (reversíveis)

- TypeScript fixado na linha 6 (typescript-eslint ainda não suporta a 7).
- Babylon importado por módulos específicos (bundle menor); as extensões de engine necessárias ao WebGPU estão em `src/render/engine.ts`.
- Colisão: círculo do jogador contra caixas, resolvida por eixo, sem motor de física.
- Uni tem posição livre: vai direto a 2 m de Bobby quando a linha reta está livre de paredes; senão segue a trilha central do nível (waypoints) até a projeção de Bobby. Fica parada quando está a até 2,5 m. Nunca a menos de 2,5 m da porta bloqueada nem dentro da zona de saída.
- Áudio sintetizado em vez de arquivos: zero licenças pendentes.
- Mãos desenhadas em grupo de renderização próprio para nunca sumirem dentro de paredes.
- Hooks de teste em `window.__game` (avançar a simulação, ler estado, medir) usados por Playwright e pelo script de medição; só existem no servidor de desenvolvimento ou com `?debug` na URL. Não vão para o jogador.

## Revisão de código (agente revisor) e o que foi corrigido

Achados altos e médios, todos com teste RED antes da correção quando cabia:

- **Pausa não cancelava a carga pelo caminho real do app** (o `Game` pausava a máquina de estados antes de mandar o comando). Corrigido: o comando de pausa sempre limpa movimento e carga; teste Vitest novo e teste Playwright com clique real + Esc.
- **Colunas visíveis sem colisão.** Corrigido: as colunas agora nascem na definição do nível e geram colisores; a cena desenha a partir da mesma lista. Teste Vitest novo.
- **Uni presa à trilha ficava a até 5,5 m quando Bobby saía do eixo.** Corrigido com posição livre (acima). Dois testes novos.
- **Bug real encontrado ao testar clique de verdade:** o Babylon cancela o `pointerdown` no canvas e o navegador então suprime `mousedown`/`mouseup`; o jogador nunca conseguiria golpear com o mouse. Os controles passaram a usar eventos de ponteiro. Coberto pelos novos testes Playwright P03/P04.
- Pointer lock recusado (Safari devolve `pointerlockerror`): agora mostra "Clique na tela para capturar o mouse" e o clique no canvas pede o lock de novo.
- Contagem de Uni duplicada agora olha todas as cenas vivas do engine, e o teste também exige exatamente 1 cena.
- Painel: janela do p95 ampliada para ~30 s; preset de rede da medição corrigido para o "Fast 4G" real do Chrome (4 Mbps, 20 ms); DPR fracionário escolhe a opção mais próxima; rótulo da carga muda durante a carga.
- Animações (mãos, tochas) congelam na pausa; reiniciar limpa o banner de alerta pendente; `interact` sem efeito colateral escondido; parâmetro morto removido.

Não corrigido, de propósito: o ticket 07 continua **parcial** (o revisor confirmou que não há GLB do Blender nem registro de recursos); a pasta `docs/measurements/` continua versionável até você decidir (pergunta 6). As medições anteriores foram feitas com a janela de p95 antiga (4 s); a tabela precisa ser refeita com `pnpm measure` para valer como evidência do ticket 07.

## Adendo — 12/09/2026, tarde: arte da Uni (tickets 01 e 08)

Branch `claude/ticket-01-uni-3d-art`, tirada de `feat/mvp-cenotafio`.

- **Modelo pronto e no jogo.** Quatro variações no Meshy a partir de `uni-fullbody-walk-side-s01e01-t0250s.jpg`; a do Meshy 7 tem a melhor proporção de filhote. Remesh para 30k triângulos e retextura para tirar o verde que veio do fundo do quadro. Asset final 1,5 MB. Créditos por etapa em [REFERENCES.md](REFERENCES.md); 105 de 3126.
- **Rigging esquelético não existe no Meshy para quadrúpede.** O `rig` devolve 422 "Pose estimation failed" e as 680 animações do catálogo público são todas de bípede. Parada, andar e alerta saem de `src/render/uni-pose.ts` como movimento de corpo e brilho do chifre; **as patas não se mexem**. É a pendência real dos tickets 01 e 08.
- **A sala perdeu quatro luzes.** O WebGPU permite 12 uniform buffers por estágio de shader e o corredor tinha uma luz por tocha (10 luzes no total). Com a malha da Uni na cena o limite estourava, todos os pipelines eram recusados e o quadro inteiro ficava preto. Agora só as três tochas mais próximas iluminam; as sete chamas continuam visíveis. Reversível em uma linha em `scene-view.ts`, mas aí a Uni não entra.
- **Decisões suas de 12/09/2026:** aparência da Uni **aprovada**; a animação de patas fica fora do MVP (ticket 13, aberto); as três tochas com luz ficam como estão; teste no Safari dispensado. Com isso o ticket 01 fecha.
- **Medições com a Uni na cena** (Chrome 153, WebGPU, M5): 120 fps, p95 9,7 ms, 0 quadros acima de 33 ms em 3024×1890; 2,1 MB transferidos a frio contra 0,6 MB antes. `pnpm verify` verde: lint, types, 41 testes Vitest, build e 7 cenários Playwright.

## Perguntas para você (todas juntas, como pediu)

1. ~~Git~~ Resolvido em 12/09/2026: branch `feat/mvp-cenotafio` com commits por ticket. Casa única do projeto: `~/Projects/Github/dungeons-and-dragons-final-episode` (remote `origin` = `renatobardi/dungeons-and-dragons-final-episode`; tracker de issues e labels em `AGENTS.md` e `docs/agents/`). A pasta antiga em Documents foi movida para lá; o backup do conteúdo anterior da pasta está na Lixeira. O repositório `caverna-do-dragao-episodio-final` no GitHub (com o PR #1) ficou obsoleto e pode ser apagado por você.
2. ~~Meshy~~ Premium assinado em 12/09/2026; MCP oficial instalado. Blender continua ausente; rigging e animação serão tentados no próprio Meshy.
3. ~~Referências~~ 28 quadros capturados e aprovados em 12/09/2026 (`docs/REFERENCES.md`).
4. **Aprovação visual do que existe:** o cenário provisório em código atende como base para a arte final, ou prefere que a produção de arte comece do zero no Blender?
5. **Safari:** pode abrir o build no Safari 26 e apertar F3 para eu registrar a segunda coluna da tabela?
6. **Artefatos de medição:** a pasta `docs/measurements/` tem 14 MB (PNGs 3024×1890 + vídeo). Versionar ou ignorar no git?
