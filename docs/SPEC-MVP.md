# Spec — MVP: entrada do Cenotáfio (Fase 3)

Gerado por `/to-spec` em 12/09/2026 a partir da conversa e dos docs. Substitui a separação "protótipo de formas simples" + "prova visual" de [PROTOTYPE.md](PROTOTYPE.md) e [ENGINE-REVIEW.md](ENGINE-REVIEW.md) §5–7: o usuário decidiu **não ter nada descartável**. O MVP é uma fatia pequena do jogo, com código, arquitetura e arte finais.

> **Revisão 12/09/2026:** a fatia passou do pântano (Fase 1) para a entrada do Cenotáfio (Fase 3). Motivo: a arte do Cenotáfio é reaproveitada nas fases 3, 4 e epílogo, e interior de pedra é mais fácil de acabar e medir do que água, vegetação e névoa. O pântano fica para depois da receita visual provada. Ticket 1 passa a ser o teste de arte da Uni; o código avança com modelos provisórios até a Uni final chegar.

Triagem: `ready-for-agent`. Sem tracker configurado no projeto (sem remote Git, sem `.claude/`); este arquivo é a publicação até existir tracker.

## Problema

O usuário quer viver o episódio final de Caverna do Dragão como Bobby, no navegador, por link, com gráficos de qualidade máxima fiéis ao desenho. Hoje só existe planejamento; não há nada jogável, nenhuma evidência de que a engine atinge a qualidade desejada no MacBook M5, e nenhum modelo de personagem. Sem uma fatia real e acabada, não dá para aprovar direção visual, medir custo nem estimar a campanha.

## Solução

Um trecho jogável de 3–5 minutos na entrada do Cenotáfio, com acabamento final: Bobby (mãos e tacape) em primeira pessoa, Uni ao lado com modelo e animações finais, tumba de pedra pintada, um primeiro alerta de Uni e uma primeira passagem aberta com o golpe pesado do tacape. Termina antes da criatura gelatinosa e sem os aliados. A pessoa abre o link, clica "Jogar", atravessa o trecho sem instrução verbal e vê a conclusão. O mesmo código e os mesmos recursos crescem até o capítulo completo.

## Histórias de usuário

Jogador = quem recebe o link. Produtor = o usuário dono do projeto. Desenvolvedor = agente/pessoa implementando.

1. Como jogador, quero abrir o link e ver um estado de carregamento visível, para saber que o jogo está chegando e não travou.
2. Como jogador, quero ver os controles na tela inicial antes de clicar "Jogar", para não precisar de explicação verbal.
3. Como jogador, quero que o jogo só comece após eu clicar "Jogar", para que o mouse não seja capturado sem eu pedir.
4. Como jogador, quero andar com WASD e olhar com o mouse em primeira pessoa, para me sentir sendo Bobby.
5. Como jogador, quero a câmera na altura dos olhos de uma criança, para perceber que Bobby é o menor do grupo e o cenário é grande.
6. Como jogador, quero que paredes, colunas e escombros me bloqueiem sem atravessar nem cair pelo chão, para confiar no mundo.
7. Como jogador, quero ver as mãos de Bobby e o tacape com animação de peso, para sentir a força da arma.
8. Como jogador, quero dar um golpe simples com o clique esquerdo, para interagir com o mundo de forma rápida.
9. Como jogador, quero segurar o clique para carregar um golpe pesado e ver uma indicação clara de "carga pronta", para saber quando soltar.
10. Como jogador, quero que o golpe simples não quebre a passagem bloqueada e o golpe pesado a quebre, para aprender a diferença entre os dois sem texto.
11. Como jogador, quero que golpes fora de alcance ou através de uma parede não afetem nada, para que o mundo seja coerente.
12. Como jogador, quero ver o obstáculo mudar para uma versão quebrada com detritos e poeira, para sentir o impacto.
13. Como jogador, quero que Uni caminhe ao meu lado sem atravessar colunas nem deslizar os pés, para acreditar que ela está ali.
14. Como jogador, quero que Uni não empurre Bobby nem fique parada na passagem, para não ser atrapalhado por ela.
15. Como jogador, quero que Uni olhe para a passagem bloqueada e emita um balido com sinal visual, para entender para onde ir mesmo sem som.
16. Como jogador, quero que o alerta de Uni aconteça uma vez ao descobrir o bloqueio, e não a cada instante, para não ficar irritante.
17. Como jogador, quero que Uni volte a me acompanhar depois de eu ir e voltar pelo caminho, para ela nunca se perder.
18. Como jogador, quero ver a saída do trecho de forma reconhecível e interagir com E quando estiver perto, para concluir a abertura.
19. Como jogador, quero uma tela de conclusão com opção de reiniciar, para jogar de novo ou mostrar a alguém.
20. Como jogador, quero que Esc pause o jogo e libere o mouse, e que trocar de aba pause também, para Bobby nunca andar ou atacar sozinho.
21. Como jogador, quero ajustar a sensibilidade do mouse e desligar o balanço de câmera, para jogar confortavelmente.
22. Como jogador, quero som ambiente de tumba, som de golpe, de quebra e de alerta, para o mundo ter presença, sem depender deles para entender o objetivo.
23. Como jogador, quero que o áudio só comece após eu clicar "Jogar", para o navegador não bloquear o som.
24. Como jogador, quero reiniciar várias vezes sem Uni duplicada, sons repetidos ou erros, para o jogo ser confiável.
25. Como jogador, quero o jogo fluido em tela cheia no MacBook, sem travadas ao virar a câmera, para a experiência ser agradável.
26. Como jogador, quero que o cenário pareça uma pintura do desenho dos anos 80 e Uni pareça a Uni, para reconhecer o que estou vendo.
27. Como jogador com computador mais fraco, quero que o jogo ainda abra com qualidade reduzida automaticamente (WebGL2 quando não há WebGPU), para não ver uma tela preta.
28. Como produtor, quero um painel de depuração com DPR, TAA e sombras, para comparar qualidade e custo na hora.
29. Como produtor, quero ver tempo de quadro e p95 na tela ao apertar uma tecla, para medir sem ferramentas externas.
30. Como produtor, quero um vídeo capturado no navegador e uma tabela de medições por navegador/DPR, para aprovar a direção visual com evidência.
31. Como produtor, quero uma comparação lado a lado com frames identificados do desenho, para julgar fidelidade e não gosto.
32. Como produtor, quero que trocar o modelo de Uni ou um material não exija mudar regras do jogo, para evoluir a arte sem quebrar o jogo.
33. Como produtor, quero que o build seja estático e sirva por HTTPS em qualquer hospedagem, para compartilhar por link.
34. Como produtor, quero que nenhuma chave de serviço vá para o navegador, para não vazar segredos.
35. Como desenvolvedor, quero testar todas as regras do jogo sem abrir navegador, para o TDD ser rápido e determinístico.
36. Como desenvolvedor, quero lint, types, testes e build num só comando, para nunca entregar "compila na minha cabeça".
37. Como desenvolvedor, quero um registro de cada recurso de arte (origem, licença, formato, tamanho), para saber o que pode ser publicado.

## Decisões de implementação

**Engine e plataforma**
- Babylon.js 8 + TypeScript + Vite, aplicação web estática. WebGPU como caminho principal; fallback automático para WebGL2. Decisão registrada em [ENGINE-REVIEW.md](ENGINE-REVIEW.md) §1; Three.js é o plano B só com medições registradas.
- Ambiente de teste: MacBook M5 24 GB, Chrome estável (principal), Safari 26 (secundário), tela cheia em DPR 2, queda para DPR 1.5 se não segurar a meta.
- Metas (alvos, não resultados): 60 fps estáveis, p95 ≤ 18 ms, zero quadros > 33 ms após carregar, ≤ 25 MB transferidos, jogável em ≤ 6 s em "Fast 4G" com cache frio, ≤ 1,5 GB de memória GPU.

**Arquitetura: simulação separada do desenho (final, não provisória)**
- A **simulação do jogo** é TypeScript puro, sem dependência do Babylon: contém mundo (colisão simplificada), Bobby (posição, direção, alcance, carga), Uni (seguir, alerta), obstáculo (intacto/quebrado), saída e a máquina de estados da partida.
- A simulação avança em **passo fixo** (60 Hz) com acumulador de tempo; velocidades nunca dependem da taxa de quadros.
- Entrada da simulação: **comandos** (mover, olhar, golpe simples, iniciar/soltar carga, interagir, pausar, retomar, reiniciar). Saída: **estado observável** (posições, orientação, estado do obstáculo, alerta emitido, fase da partida, carga pronta).
- A **camada de renderização** (Babylon) só lê o estado e desenha; a **camada de entrada** traduz teclado/mouse em comandos. Nenhuma regra vive no Babylon.
- Reinício = destruir e recriar simulação e cena; nunca "zerar campos". Evita duplicações (história 24).
- Estados da partida: carregando → pronto → jogando ⇄ pausado → concluído; falha de carregamento como estado terminal com mensagem.

**Regras (números são hipóteses iniciais; testes verificam a regra, não o número)**
- Velocidade 3,5 m/s; altura dos olhos 1,2 m; alcance do golpe 2,0 m; golpe pesado pronto após 0,6 s segurando.
- Detecção de acerto: raio a partir dos olhos na direção do olhar, limitado ao alcance, contra volumes de colisão da simulação; parede no caminho cancela.
- Obstáculo: máquina de dois estados, intacto → quebrado, transição única, só por golpe pesado pronto. Após quebrar, o volume de colisão é removido.
- Uni: segue por pontos de passagem do trecho, mantendo 1,5–2,5 m de Bobby; se ficar a mais de 4 m refaz a rota; nunca ocupa o ponto de passagem do obstáculo/saída; sem empurrar Bobby (Bobby não colide com Uni; Uni desvia).
- Alerta: disparado uma vez quando Bobby entra na zona de descoberta do obstáculo; reinício restaura.
- Saída: zona de interação; E conclui quando Bobby está dentro e o obstáculo já foi quebrado.
- Pausa/perda de foco/saída do Pointer Lock: comandos de movimento e ataque são descartados; carga em andamento é cancelada.

**Conteúdo do trecho (Fase 3, entrada do Cenotáfio)**
- Entrada da tumba: pórtico externo → corredor com uma curva entre colunas → sala com passagem bloqueada (escombros/coluna caída) → passagem liberada → saída (portal para o interior). Sem criatura gelatinosa, sem aliados visíveis, sem mecanismos.
- Arte final como meta do MVP (decisão do usuário): conjunto modular de pedra (piso, parede, coluna, escombros) com materiais PBR de textura pintada, poeira no ar, tochas; Uni com esqueleto e animações parada/andar/alerta; mãos e tacape com golpe simples e golpe pesado; obstáculo em duas versões com detritos e poeira; iluminação dirigida com sombras macias; TAA. Estilo: 3D pintado, sem contorno (decisão registrada em ENGINE-REVIEW §4).
- Áudio final para o trecho: ambiente, golpe, quebra, alerta, confirmação. Sem vozes.
- Recursos entram como GLB/texturas/áudio pré-produzidos; nenhum serviço externo é chamado durante a partida.
- **Modelos provisórios são permitidos no código** enquanto os finais não existem; trocar um modelo não altera regras (história 32). A entrega do MVP só é aceita com arte final.

**Teste de arte da Uni (ticket 1, antes dos demais personagens)**
- Pipeline: confirmar acesso ao Meshy → reunir e aprovar referências (frames identificados do desenho) → modelo base no Meshy → Blender (revisão de malha/escala/materiais, rigging, animações parada/andar/alerta) → GLB → validação no navegador no MacBook M5.
- Saída: aparência aprovada pelo produtor, movimento sem deslizar os pés, medições (fps, p95, memória) com a Uni na cena, registro do recurso (origem, licença, formato, tamanho). Só depois produzir os demais personagens.

**Interface**
- Tela inicial com controles e botão "Jogar" (ativa Pointer Lock e áudio). HUD mínimo: indicador de carga, dica de interação "E" quando disponível. Pausa com sensibilidade e liga/desliga de balanço de câmera. Tela de conclusão com "Reiniciar".
- Painel de depuração (tecla dedicada): DPR 2/1.5/1, TAA, sombras alta/baixa, sobreposição de tempo de quadro e p95.

**Entrega**
- Build estático; hospedagem HTTPS a definir (sem publicação nesta spec). Lint, types, testes e build num único comando de verificação.

## Decisões de teste

- **Teste bom** = envia comandos e afirma sobre estado observável ou sobre o que o jogador vê; nunca inspeciona detalhes internos (estruturas, nomes de métodos, ordem de chamadas).
- **Costura principal (única para regras): a simulação do jogo**, testada com Vitest sem navegador. Cobre P02–P06 e P08 de [PROTOTYPE.md](PROTOTYPE.md): colisão, alcance, parede no caminho, golpe simples vs pesado, transição única do obstáculo, seguimento de Uni pela curva e retorno, alerta único, pausa descartando comandos, reinício sem duplicação.
- **Costura secundária, mínima: Playwright no Chrome** contra o build: abrir página com estado de carregamento, "Jogar" captura o mouse, Esc pausa, troca de foco pausa, percurso completo até a conclusão, reiniciar 3 vezes sem erros no console (P01, P07, P08).
- **Sem teste automatizado de qualidade visual/desempenho.** Evidência: vídeo de 30–60 s no navegador, tabela de medições por navegador × DPR, comparação com 3 frames identificados, aprovação do produtor em texto. P09 (pessoa sem explicação) é observação registrada.
- Não há prior art: repositório novo. TDD obrigatório: RED (teste falhando pela asserção certa) → GREEN mínimo → REFACTOR; teste e código no mesmo commit.

## Fora de escopo

Criatura gelatinosa e qualquer inimigo; mecanismos e puzzle com Presto; pântano e hidra (Fase 1); aliados visíveis ou controláveis; resgate/teletransporte de Uni; investida de Uni; pulo, corrida, esquiva; checkpoints e progresso salvo; celular, toque, controle; vozes; menu de configurações além de sensibilidade e balanço; múltiplos idiomas; hospedagem e domínio; otimização para máquinas fracas além do fallback WebGL2; fases 1, 2 e 4, restante da Fase 3 e epílogo; verificação das referências narrativas.

## Notas

- **Caminho crítico é a arte, não o código.** Meshy segue na stack; acesso ainda a confirmar e referências a reunir. Produzir Uni final, mãos/tacape e Cenotáfio exige modelagem, rigging e animação no Blender. O teste de arte da Uni é o primeiro ticket; até lá o código avança com a simulação e modelos provisórios.
- Ordem sugerida de tickets: (1) teste de arte da Uni; (2) aplicação Babylon+Vite+TS com verificação única; (3) simulação: movimento/colisão/pausa; (4) simulação: tacape/obstáculo; (5) simulação: Uni; (6) renderização do Cenotáfio com materiais e iluminação finais + medições; (7) Uni final e mãos/tacape renderizados e animados; (8) interface, áudio, conclusão e reinício; (9) vídeo, tabela, comparação e aprovação; (10) teste com uma pessoa. (1) corre em paralelo a (2)–(5).
- Decisões preservadas: primeira pessoa com Bobby; navegador por link; qualidade máxima mantendo estética do desenho; só o último capítulo; Eric usa a chave e Bobby protege; referências narrativas não verificadas; nem toda habilidade vira funcionalidade.
- Risco de direitos: fan game com semelhança de personagens, compartilhado por link aberto. Não bloqueia o MVP; decidir antes de publicar.
- Próximo passo do fluxo: `/to-tickets` a partir deste spec.
