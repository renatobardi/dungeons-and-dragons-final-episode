# Visão de produto

## O jogo em uma frase

Viver o episódio final pelos olhos de Bobby: usar o tacape para abrir caminhos e proteger os amigos, com Uni sempre próxima, até criar as condições para a redenção do Vingador e a abertura do portal para casa.

## Decisões confirmadas

- Jogo em primeira pessoa, com Bobby como personagem do jogador.
- Navegador e compartilhamento por link.
- Qualidade gráfica máxima como prioridade, preservando a estética do desenho. Ver [direção visual e prova de qualidade](VISUAL-TARGET.md).
- Equipamento de referência: MacBook M5 com 24 GB de RAM, jogando pelo navegador.
- Somente o último capítulo: quatro fases e epílogo no plano narrativo atual.
- Uni como companheira próxima; Hank, Eric, Diana, Sheila e Presto como aliados.
- Intenção de fidelidade ao desenho dos anos 80 e uso de Requiem como referência narrativa.
- Na versão mais recente do confronto, Eric usa a chave; Bobby protege o grupo.
- Ferramentas desejadas: Codex, Blender, Meshy 3D, Google Lyria 3.5 e ElevenLabs. Disponibilidade, versões e integrações ainda não foram conferidas.

## Recomendações de produto para revisão com o Fable

| Tema | Proposta inicial | Por quê / custo da escolha |
| --- | --- | --- |
| Público de teste | Você e poucos convidados que conheçam ou não o desenho | Permite observar compreensão sem depender só da nostalgia |
| Dispositivo | Computador com teclado e mouse | Reduz o trabalho de controles; celular e controle ficam fora do primeiro teste |
| Modo | Um jogador, aventura linear | Mantém foco no capítulo; dispensa sistemas de rede |
| Primeiro protótipo | Sala do Cenotáfio de aproximadamente 3–5 minutos | Testa a interação central; duração é hipótese, não compromisso |
| Primeira demonstração com arte | Trecho de aproximadamente 10–15 minutos | Mostra qualidade representativa antes de produzir quatro fases |
| Grupo | Participação contextual dos aliados | Evita precisar de cinco companheiros autônomos em todos os momentos |
| Progresso inicial | Reiniciar o pequeno trecho | Checkpoints persistentes entram quando houver uma fase longa |
| Narrativa inicial | Texto e áudio provisório | Permite corrigir cenas antes de produzir vozes finais |

## Pilares da experiência

1. **Ser Bobby:** câmera baixa em relação aos amigos e ao cenário, tacape com impacto legível e obstáculos que respondem à força.
2. **Estar com Uni:** companhia percebida durante exploração e perigo, sem bloquear a passagem ou esconder a visão.
3. **Salvar os amigos:** vencer significa abrir caminho, conter e cooperar; o confronto final depende da confiança e da chave.
4. **Reconhecer o desenho:** silhuetas, cores, cenários, gestos e relações entre personagens precisam ser revisados contra referências identificadas.

## Ciclo principal

Perceber um perigo ou bloqueio → ler a reação de Uni e dos aliados → usar o tacape ou uma interação contextual → observar a mudança no cenário → avançar com o grupo.

Cada encontro deve ter um objetivo visível além de causar dano. O primeiro teste precisa demonstrar esse ciclo inteiro uma vez.

## Três entregas diferentes

| Entrega | Contém | Como saber que passou |
| --- | --- | --- |
| Protótipo | Formas simples, Bobby, Uni provisória, obstáculo e saída | Uma pessoa entende e conclui sem orientação verbal |
| Demonstração representativa | Um trecho do Cenotáfio com arte, áudio, uma ameaça e uma cooperação | A interação funciona com a qualidade visual desejada no navegador alvo |
| Capítulo completo | Quatro fases, confronto e epílogo | Jornada completa, reinício/continuação confiáveis e revisão narrativa concluída |

Não converter a lista completa de poderes em uma lista obrigatória de funcionalidades. Primeiro demonstrar as habilidades necessárias às cenas.

## Fora da primeira entrega

Voo livre, destruição irrestrita, combate com todos os aliados simultaneamente, moral numérica, fúria, inventário, evolução de personagem, múltiplos chefes, multiplayer, contas, loja, celular e diálogos gerados durante a partida. Essas exclusões limitam o protótipo; não alteram automaticamente o roteiro futuro.

## Decisões pendentes e quando resolvê-las

| Decisão | Proposta / situação | Necessária antes de |
| --- | --- | --- |
| Engine | Babylon.js + TypeScript como candidatura provisória; consolidar após prova visual | Produção da campanha |
| Navegador e resolução de teste | MacBook M5 com 24 GB confirmado; navegador e resolução ainda a definir | Fixar metas de desempenho |
| Uni: resgate | Automático, uma carga por tentativa no protótipo, como hipótese de teste | Implementar o resgate opcional |
| Bobby e liderança de Hank | Pedidos contextuais de ajuda de Bobby; Hank mantém liderança narrativa | Primeiro aliado interativo |
| Voltar ou permanecer; destino de Uni | Não decidido | Escrever o epílogo final |
| Geleia bloqueada que reaparece | Conferir roteiro e definir continuidade | Integrar fases 3 e 4 |
| Fidelidade literal ou adaptação | Identificar cada diferença no registro de fontes | Aprovar roteiro e falas finais |
| Prazo e orçamento | Não informados; medir esforço do protótipo antes de estimar a campanha | Comprometer cronograma e compras |

## Como você participa sem saber programar

Você escolhe a sensação desejada, joga as entregas e relata o que aconteceu. Exemplo útil: “Uni ficou atrás da coluna e não entendi para onde ir”. O agente transforma isso em problema verificável, teste e correção. Aprove uma entrega jogável antes de ampliar a seguinte.
