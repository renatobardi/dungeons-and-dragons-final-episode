# Revisão de engine e prova visual (Fable, 12/09/2026)

> **Atualização 12/09/2026:** o usuário decidiu não ter nada descartável. As seções 5–7 (prova visual separada, protótipo de formas simples, ordem de tickets) foram substituídas por [SPEC-MVP.md](SPEC-MVP.md): a entrada do Cenotáfio com arte e arquitetura finais, teste de arte da Uni como ticket 1. Seções 1–4 e 9 permanecem válidas.

Resultado da revisão pedida em [FABLE-HANDOFF.md](FABLE-HANDOFF.md). Linguagem simples; termos técnicos traduzidos na primeira vez. Nada aqui foi implementado ainda.

## 1. Veredito: Babylon.js + TypeScript, consolidado para o protótipo e a prova visual

**Por quê, em uma frase:** é a única candidata que roda no navegador com a API gráfica mais nova (WebGPU) já hoje, e vem com tudo que o jogo precisa "na caixa" (colisão, animação, áudio, carregador de modelos glTF, interface, inspetor de depuração).

Termos:
- **WebGPU** = a forma moderna de o navegador falar com a placa de vídeo. Mais rápida e com mais recursos que a antiga (WebGL2). Está ligada por padrão no Chrome e no Safari 26 (macOS Tahoe).
- **Engine** = o "motor" que desenha e move as coisas. Não é um editor visual; a cena é montada em código.

| Candidata | Situação | Por que não |
| --- | --- | --- |
| **Babylon.js 8** | **Escolhida** | WebGPU nativo com fallback automático para WebGL2; física, navegação, glTF, inspetor inclusos; comunidade e docs ativas |
| Three.js | Alternativa viável | Também tem WebGPU. Exige montar "as peças" (física, navegação, UI) à mão. Só vale a troca se Babylon falhar na prova visual |
| Godot 4 | Descartada para web | Exportação web usa apenas o renderer "Compatibility" (WebGL2); os renderers de alta qualidade (Forward+) não existem no navegador. O que se vê no editor não é o que roda no link |
| Unity / Unreal web | Descartadas | Builds pesados, licenças e suporte web instável para o objetivo "abrir por link" |

**Condição de saída:** se a prova visual (seção 5) não atingir qualidade e fluidez juntas no MacBook M5, a alternativa é Three.js, não Godot. Registrar medições antes de trocar.

Fontes consultadas em 12/09/2026: [Babylon WebGPU status](https://doc.babylonjs.com/setup/support/webGPU/webGPUStatus), [Godot web export](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html), [WebGPU em Safari 26 / navegadores](https://web.dev/blog/webgpu-supported-major-browsers).

## 2. Ambiente de teste (proposta, a confirmar)

| Item | Proposta |
| --- | --- |
| Máquina | MacBook M5, 24 GB (confirmado). Registrar modelo exato e núcleos de GPU na primeira medição |
| Navegador principal | Chrome estável mais recente (melhor ferramenta de medição de quadros) |
| Navegador secundário | Safari 26 (é o padrão do Mac; quem receber o link provavelmente abre nele) |
| Resolução | Janela em tela cheia, resolução nativa da tela (DPR 2). Se não segurar a meta, cair para DPR 1.5 e registrar |
| Rede para medir carregamento | Chrome DevTools, perfil "Fast 4G" (4 Mbps de descida, 20 ms), cache frio |

DPR = quantos pixels reais o navegador desenha por pixel "lógico". No Mac com tela Retina, DPR 2 é o máximo de nitidez e o maior custo.

## 3. Metas mensuráveis (para o MacBook M5; são alvos, não resultados)

| Métrica | Meta | Como medir |
| --- | --- | --- |
| Fluidez | 60 quadros/s estáveis; tempo de quadro p95 ≤ 18 ms | Captura de 60 s com câmera em movimento, via Performance do Chrome |
| Travadas | zero quadros > 33 ms após o carregamento | Mesma captura |
| Carregamento | ≤ 25 MB transferidos; jogável em ≤ 6 s no perfil de rede acima | Aba Network, cache frio |
| Memória GPU | ≤ 1,5 GB no trecho da prova visual | Inspetor do Babylon / about:gpu |
| Representatividade | contar personagens, luzes com sombra e efeitos presentes na cena medida | Anotar junto com as medições |

Abaixo dessas metas em DPR 2 → tentar DPR 1.5 antes de cortar qualidade de arte.

**Resultado em 12/09/2026 (Chrome, WebGPU, M5 Pro):** 120 fps, p95 9,1 ms, zero quadros > 33 ms em DPR 2; 0,6 MB transferidos; pronto em 1,3–2,4 s. Metas atingidas com o cenário provisório; ver [MEASUREMENTS.md](MEASUREMENTS.md). Engine consolidada para o MVP; reavaliar quando a Uni final e mais luzes entrarem.

## 4. Receita visual: 3D pintado, sem contorno (decisão do usuário em 12/09/2026)

O usuário escolheu **3D pintado, sem contorno de tinta**: aparência de filme de animação moderno, mantendo silhuetas, cores e proporções do desenho dos anos 80. Cel puro (cores chapadas + contorno) ficou descartado.

| Camada | Técnica | O que o jogador vê |
| --- | --- | --- |
| Personagens (Uni, mãos/tacape, aliados) | Materiais PBR* com texturas pintadas à mão (pinceladas visíveis), sombra suavizada em rampa (meio-termo entre toon e realista), sem contorno | Uni e Bobby com volume e "tinta", reconhecíveis do desenho |
| Cenário (Cenotáfio) | Texturas painterly, iluminação dirigida, sombras macias, oclusão ambiente leve | Fundo pintado com profundidade real |
| Magia | Partículas e energia com formas gráficas, bloom moderado | Luz com identidade, legível |
| Imagem em movimento | TAA (anti-serrilhado temporal) | Bordas estáveis, sem cintilar |

*PBR = material "fisicamente baseado": reage à luz como o material real. Aqui é usado com texturas pintadas para não virar fotorrealismo.

Trade-offs: sem contorno, a leitura da silhueta depende de iluminação e contraste de cor; o custo de GPU migra do contorno para sombras/TAA. Ambos medidos na prova visual.

## 5. Prova visual antecipada (V-01): escopo executável

**Objetivo:** provar que a receita da seção 4 atinge a direção de [VISUAL-TARGET.md](VISUAL-TARGET.md) com as metas da seção 3, no Babylon, antes de produzir a campanha.

**Cena:** um trecho do Cenotáfio de ~8×8 m: piso, 4 colunas, uma parede com relevo, um sarcófago ao fundo, luz principal com sombra + 2 luzes de tocha. Não é fase; é um "estúdio".

**Conteúdo obrigatório**
1. Uni com esqueleto e 3 animações: parada, andar, alerta (olhar + balido). Caminha sem deslizar os pés.
2. Mãos de Bobby + tacape em primeira pessoa com 2 animações: golpe simples e golpe pesado carregado.
3. Um efeito de magia (rajada de sombra do Vingador ou brilho do chifre de Uni) com partículas e luz.
4. Câmera em primeira pessoa andando e girando (reaproveita o controle do protótipo).
5. Interruptores de depuração: DPR 2 / 1.5 / 1, TAA ligado/desligado, sombras alta/baixa.

**Evidência de saída**
- Vídeo de 30–60 s capturado no navegador, câmera próxima e em movimento.
- Tabela de medições (seção 3) por navegador e DPR.
- Comparação lado a lado com 3 referências identificadas (frame do desenho de Uni, de Bobby, do Cenotáfio).
- Aprovação visual do usuário registrada em texto.
- Decisão: engine consolidada / ajustar receita / trocar para Three.js.

**Fora da prova:** aliados, inimigos com IA, áudio final, interface final, otimização para máquinas fracas.

**Origem dos modelos:** o usuário ainda não tem Meshy. A prova visual começa com Uni modelada de forma simples no Blender (ou modelo placeholder animado de origem licenciada), com esqueleto e 3 animações, exportada em GLB. Meshy entra depois, se e quando contratado; o caminho Meshy → Blender → GLB será validado com a Uni antes de gerar mais alguém. Referências (frames identificados do desenho) ainda não foram reunidas: é o primeiro ticket de arte. Direitos: fan game não comercial; registrar decisão de uso da semelhança dos personagens antes de publicar por link aberto.

## 6. Protótipo (sala de formas simples): confirmações e ajustes

[PROTOTYPE.md](PROTOTYPE.md) está pronto para virar especificação. Ajustes desta revisão:

- **Pointer Lock** (o mouse "preso" na janela para olhar) começa apenas ao clicar "Jogar"; Esc solta. Regra P07 cobre.
- **Regras numéricas, como hipóteses de teste:** velocidade 3,5 m/s; altura dos olhos 1,2 m (Bobby é criança; a câmera baixa é pilar de produto); alcance do golpe 2,0 m; carga pesada pronta em 0,6 s; Uni segue a 1,5–2,5 m, refaz rota se ficar > 4 m. Todos ajustáveis; o teste automatizado verifica a regra, não o número.
- **Colisão sem motor de física** no protótipo (Babylon `moveWithCollisions` + caixas). Física só se uma cena aprovada exigir.
- **Uni no protótipo:** segue por pontos de passagem (waypoints) da sala; sem malha de navegação até a curva falhar no teste P05.
- **Reinício** = destruir e recriar a sala inteira, não "resetar campos". Evita duplicar Uni/sons (P08).
- **Testes:** Vitest para regras (alcance, carga, estados do obstáculo, reinício); Playwright para o fluxo P01–P08 no Chrome; P09 é observação manual registrada.

## 7. Ordem dos primeiros tickets

1. **P-02** Criar aplicação Babylon + Vite + TypeScript com lint, types, Vitest, Playwright e build. Página abre com "Jogar".
2. **P-03** Movimento, câmera, colisão, pausa/foco → P01, P02, P07.
3. **V-01a** Estúdio visual com cenário e mãos/tacape (reaproveita P-03) → medir.
4. **P-04** Tacape e obstáculo → P03, P04.
5. **P-05** Uni segue e sinaliza → P05, P06.
6. **V-01b** Uni animada + efeito de magia no estúdio → vídeo, tabela, decisão de engine.
7. **P-06** Objetivo, saída, reinício → P08.
8. **P-07** Teste com uma pessoa → P09.

Prova visual intercalada de propósito: se a receita falhar, sabemos antes de gastar em Uni de formas simples refinada. Nenhum ticket foi aberto em tracker.

## 8. Decisões preservadas (não reabrir)

Primeira pessoa com Bobby; navegador por link; qualidade máxima mantendo estética do desenho; só o último capítulo; Eric usa a chave, Bobby protege; referências narrativas continuam não verificadas; nem toda habilidade vira funcionalidade; desktop com mouse/teclado no primeiro teste (hipótese de teste, não decisão final).

## 9. Dúvidas bloqueadoras resolvidas (12/09/2026)

| Dúvida | Resposta do usuário |
| --- | --- |
| Navegador | Chrome principal, Safari 26 secundário |
| Estilo dos personagens | 3D pintado, sem contorno |
| Resolução | Tela cheia, resolução nativa (DPR 2); cair para 1.5 se não segurar 60 fps |
| Assets | Sem Meshy e sem referências reunidas; Uni provisória no Blender/placeholder |

## 10. Dúvidas ainda abertas (não bloqueiam o protótipo)

- Direitos de uso da semelhança dos personagens em fan game compartilhado por link aberto: decidir antes de publicar.
- Interruptor de depuração DPR/TAA na cena de prova: mantido; o de contorno sai (estilo decidido).
- Prazo e orçamento: medir P-02/P-03 antes de estimar.

Próximo passo do fluxo: `/to-spec` usando este documento + [PROTOTYPE.md](PROTOTYPE.md) + [VISUAL-TARGET.md](VISUAL-TARGET.md) como entrada.
