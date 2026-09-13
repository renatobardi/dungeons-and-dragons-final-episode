## Problem Statement

O produtor considera a pequena fase já entregue visualmente simples demais: mãos sem antebraços convincentes, tacape pouco detalhado, materiais planos, cenário pouco monumental e movimentos de Uni aquém da qualidade desejada. A aprovação anterior do MVP não representa mais o alvo visual. O objetivo é elevar toda a fase ao padrão das sete imagens conceituais aprovadas, mantendo-a jogável no navegador.

O termo canônico é **realismo cinematográfico com identidade preservada**: Bobby continua criança, com tacape reconhecível; Uni continua filhote expressiva, com crina laranja. Não é reprodução do acabamento do desenho nem adaptação livre das identidades.

## Solution

Refazer o acabamento visual da fase completa do Cenotáfio: Bobby em primeira pessoa com mãos, braços e tacape detalhados; Uni refinada e animada naturalmente; pórtico, corredor, sala, colunas, estátuas, passagem bloqueada, destruição e saída com materiais e iluminação coerentes. A sala terá teto muito alto inspirado em capela, com abóbadas e arcos que comuniquem escala monumental.

As sete imagens aprovadas são o alvo de direção e acabamento. A entrega será aceita pela aparência e pelo movimento dentro do jogo, acompanhados de medições no Mac do produtor. O alvo é 60 fps; 30 fps estáveis são aceitáveis após medição para preservar a qualidade. Não reduzir silenciosamente o padrão visual nem prometer equivalência exata a uma imagem gerada.

Meshy será usado para bases onde trouxer benefício, Blender para acabamento e animação, e Babylon.js para integração no navegador. Há autorização para até **500 créditos Meshy na primeira rodada**, contando tentativas descartadas; isso não garante financiar a revisão inteira.

## User Stories

1. Como produtor, quero revisar todos os elementos da fase pequena, para que o salto de qualidade seja coerente no conjunto.
2. Como produtor, quero comparar a entrega às sete imagens aprovadas, para julgar acabamento por uma referência concreta.
3. Como jogador, quero reconhecer Bobby como criança, para preservar a identidade do personagem.
4. Como jogador, quero ver antebraços contínuos até as mãos, para não perceber punhos flutuantes ou cortes expostos.
5. Como jogador, quero mãos infantis com anatomia convincente, para que a perspectiva em primeira pessoa pareça natural.
6. Como jogador, quero dedos e polegar envolvendo a empunhadura, para acreditar que Bobby segura o tacape.
7. Como jogador, quero pele com detalhes e resposta à luz coerentes, para evitar aparência de plástico uniforme.
8. Como jogador, quero braceletes reconhecíveis com volume e acabamento de metal, para preservar a identidade de Bobby.
9. Como jogador, quero um tacape de madeira de peça única e forma reconhecível, para distingui-lo de uma maça genérica.
10. Como jogador, quero fibras, desgaste e pequenas irregularidades na madeira, para perceber material e uso.
11. Como jogador, quero postura de repouso natural dos braços, para que eles pertençam ao corpo de Bobby.
12. Como jogador, quero preparação, impacto e recuperação legíveis no golpe simples, para sentir a ação.
13. Como jogador, quero carga e golpe pesado com mais peso que o golpe simples, para distinguir as duas ações visualmente.
14. Como jogador, quero transições contínuas entre repouso, carga e golpe, para evitar saltos artificiais.
15. Como jogador, quero que o balanço de câmera permaneça desligável, para manter conforto sem perder a leitura das animações.
16. Como jogador, quero reconhecer Uni como filhote branca com crina laranja e chifre, para preservar sua identidade.
17. Como jogador, quero olhos, focinho, orelhas e pelo convincentes em Uni, para aumentar sua presença e expressividade.
18. Como jogador, quero articulações que deformem naturalmente, para que Uni não pareça uma malha rígida dobrada.
19. Como jogador, quero patas apoiadas no chão durante a caminhada, para evitar deslizamento perceptível.
20. Como jogador, quero que a passada acompanhe a distância percorrida, para manter coerência ao acelerar, parar e retomar.
21. Como jogador, quero curvas e mudanças de direção naturais, para que Uni não gire como um objeto rígido.
22. Como jogador, quero movimentos sutis de repouso, cabeça e orelhas, para que Uni pareça viva quando parada.
23. Como jogador, quero alerta expressivo de Uni, para reconhecer o interesse pela passagem mesmo sem áudio.
24. Como jogador, quero que Uni continue acompanhando Bobby sem atravessar paredes ou atrapalhar passagens, para preservar a experiência atual.
25. Como jogador, quero um pórtico com profundidade, desgaste e escala convincente, para perceber a entrada de uma tumba monumental.
26. Como jogador, quero um corredor visualmente rico com caminho e curva legíveis, para explorar sem perder orientação.
27. Como jogador, quero teto de sala muito alto, com abóbadas e arcos, para sentir a escala de uma capela.
28. Como jogador, quero enxergar essa altura pela câmera baixa de Bobby, para que a monumentalidade seja percebida durante o jogo.
29. Como jogador, quero pedras com escala consistente em paredes, piso e teto, para evitar texturas esticadas ou desproporcionais.
30. Como jogador, quero colunas e estátuas com formas, relevos e desgaste convincentes, para perceber profundidade de perto.
31. Como jogador, quero fogo com forma e movimento naturais, para que tochas não pareçam lâmpadas esféricas.
32. Como jogador, quero que tochas iluminem coerentemente personagens e cenário, para integrar todos os materiais ao mesmo ambiente.
33. Como jogador, quero sombras e contatos coerentes com o chão e as paredes, para evitar objetos visualmente soltos.
34. Como jogador, quero luz, poeira e atmosfera que valorizem a arquitetura sem esconder o caminho, para conciliar acabamento e legibilidade.
35. Como jogador, quero escombros intactos com volume e massa, para acreditar no obstáculo que bloqueia a passagem.
36. Como jogador, quero fratura, detritos e poeira coerentes no golpe pesado, para perceber o impacto e a abertura do caminho.
37. Como jogador, quero uma passagem quebrada realmente legível e transitável, para saber onde seguir após o golpe.
38. Como jogador, quero uma saída luminosa com detalhe e profundidade, para reconhecer o destino sem um retângulo branco estourado.
39. Como jogador, quero carregar todos os recursos obrigatórios antes de jogar, para não iniciar com personagens ou equipamento ausentes.
40. Como jogador, quero uma mensagem de falha quando um recurso obrigatório não carregar, para não confundir defeito com acabamento.
41. Como jogador, quero reiniciar e pausar sem duplicações, animações indevidas ou perda de recursos, para manter a confiabilidade do MVP.
42. Como jogador, quero jogar pelo navegador no Mac, para manter a forma de acesso aprovada.
43. Como produtor, quero medições com toda a arte e os efeitos presentes, para avaliar o custo real do novo acabamento.
44. Como produtor, quero perseguir 60 fps e poder aceitar 30 estáveis após medição, para priorizar qualidade com uma concessão explícita de fluidez.
45. Como produtor, quero registrar cada consumo Meshy, inclusive descartes, para respeitar o teto de 500 créditos da primeira rodada.
46. Como produtor, quero reaproveitar recursos existentes quando atingirem o alvo, para concentrar orçamento no que exige nova produção.
47. Como produtor, quero saber quais elementos ficaram pendentes ao atingir o teto, para decidir a próxima rodada sem gastos não autorizados.
48. Como desenvolvedor, quero preservar a separação entre regras e desenho, para melhorar arte sem reescrever o jogo.
49. Como desenvolvedor, quero originais editáveis e exportações rastreáveis, para conseguir revisar e reproduzir os recursos aprovados.
50. Como produtor, quero validar o resultado em capturas e vídeo do jogo, para não aprovar apenas renders desconectados da experiência real.

## Implementation Decisions

- **Direção e precedência:** o realismo cinematográfico com identidade preservada substitui a direção visual anterior para esta revisão. A identidade e idade de Bobby e Uni permanecem. As concessões anteriores de simplicidade visual não impedem o novo acabamento.
- **Escopo:** toda a fase pequena existente, mantendo primeira pessoa, percurso e ações. A altura e a arquitetura superior da sala mudam para comunicar capela monumental; a dimensão exata será escolhida na composição e validada pela câmera do jogo, sem inventar um número aprovado pelo produtor.
- **Referências:** as sete imagens orientam personagem, materiais, arquitetura e iluminação. Personagens incidentais, altares, bandeiras e outros adornos que apareçam nos fundos não constituem requisitos narrativos ou de gameplay. Para identidade de Uni prevalece sua imagem dedicada.
- **Produção de arte:** avaliar primeiro os recursos atuais; gerar bases no Meshy apenas quando necessário, refiná-las no Blender e exportar recursos para o jogo. Subdivisão e aumento de textura isoladamente não são critérios de qualidade.
- **Bobby:** trabalhar anatomia dos braços e mãos, encaixe da empunhadura, materiais de pele/braceletes/madeira e animações de repouso, golpe simples, carga e golpe pesado. Evitar cortes visíveis, mãos adultas e interpenetrações perceptíveis no enquadramento de jogo.
- **Uni:** o estado atual já contém esqueleto quadrúpede e animações de repouso, caminhada e alerta, com passada dirigida por distância. Refinar ou substituir o necessário para atingir o alvo; não tratar o personagem como desprovido de rig. Preservar acompanhamento e alerta, melhorando deformações, apoio dos cascos, transições e expressividade.
- **Cenotáfio:** trabalhar o conjunto de pedra, abóbadas, arcos, colunas, estátuas, escombros, tochas e saída. Manter densidade de textura coerente e geometria visual alinhada aos volumes transitáveis. Aumentar a altura não autoriza adicionar andares, salas ou novos mecanismos.
- **Materiais e iluminação:** produzir relevo e resposta de superfície adequados a cada material, com luz dirigida, sombras coerentes e atmosfera legível. A integração deverá revisar os limites de iluminação dos materiais existentes para que personagens e peças recebam a luz pretendida sem falha do backend.
- **Destruição:** manter a regra intacto → quebrado pelo golpe pesado; melhorar as representações visuais e o efeito de impacto. A solução não exige física dinâmica geral.
- **Arquitetura:** manter simulação pura, passo fixo, tradução de entrada e camada de desenho separadas. Os principais módulos afetados são apresentação do cenário, apresentação de Bobby, apresentação/animador de Uni e orquestração de carregamento. Não criar framework novo, backend ou API de geração durante a partida.
- **Contrato de carregamento:** início e reinício só liberam o jogo quando os recursos obrigatórios e a cena estiverem prontos. Falhas devem chegar ao estado de erro existente. Pausa interrompe animações de gameplay; reinício não deixa recursos ou cenas duplicados.
- **Plataforma:** manter Babylon.js no navegador, com o caminho WebGPU e fallback existente. Blender é ferramenta de autoria, não destino de execução. Não há autorização para migrar para aplicativo instalado.
- **Desempenho:** alvo de 60 fps no Mac do produtor; 30 fps estáveis aceitáveis após medição, preservando qualidade. Registrar navegador, hardware, resolução real, DPR, configurações, tempo médio, p95, pior quadro e quedas durante percurso com animações e quebra. Não declarar estabilidade por média isolada. Não impor novos limites numéricos de download, resolução ou memória não discutidos nesta revisão; medir e apresentar esses custos e eventuais conflitos com metas antigas.
- **Orçamento Meshy:** limite agregado de 500 créditos para a primeira rodada, incluindo gerações descartadas, retexturas e outras operações cobradas. Registrar custo estimado antes de cada operação e custo efetivo após; não disparar uma operação que exceda o saldo autorizado. Se o custo não puder ser determinado, esclarecer antes de consumir. Contar também tarefas simultâneas ou em andamento. O teto não é autorização para compra de créditos nem garantia de financiar toda a fase.
- **Rastreabilidade:** conservar originais editáveis, exportações, origem/permissão dos recursos, referências, parâmetros de geração, custo e motivo dos descartes. Segredos ficam fora de artefatos e do cliente. A galeria aprovada é referência, não recurso a incorporar como fundo falso no jogo.

## Testing Decisions

O produtor confirmou nesta sessão: **testes funcionais + comparação visual e desempenho**.

- **Costura principal de integração:** a experiência observável no navegador. Reutilizar a suíte existente para carregamento, jogar, movimento, pausa/perda de foco, alerta, golpe, quebra, saída e reinício; estender apenas para comportamentos novos ou defeitos introduzidos/revelados pela troca de arte. Não criar interfaces internas apenas para testar detalhes da modelagem.
- **Costura existente de regras:** manter os testes de simulação de colisão, alcance, golpe simples/pesado, acompanhamento, alerta único, pausa e conclusão. A revisão visual não deve mudar essas regras silenciosamente.
- **Prior art:** o projeto já possui testes unitários de passo de Uni dirigido por distância, brilho do chifre, ajuste de modelos, controles e simulação, além de cenários Playwright do percurso e de reinícios. Esses testes ajudam a detectar regressão, mas não provam naturalidade visual.
- **Teste bom:** observar comportamento externo e resultado para o jogador. Não afirmar quantidade de vértices, nomes de ossos, ordem de chamadas ou detalhes privados como substituto do requisito visual. Usar checagens de integridade de recursos somente quando sustentarem o contrato de carregamento/exportação.
- **TDD:** código de produção com comportamento novo ou correção exige teste que falhe pela razão correta, implementação mínima e suíte verde. Trabalhos artísticos são validados pela evidência visual; não inventar testes unitários de “beleza”.
- **Carregamento e reinício:** verificar respostas lentas e falhas de modelos/texturas obrigatórios, ausência de prontidão prematura, múltiplos reinícios sem duplicação e ausência de erros não tratados.
- **Comparação estática:** capturas novas do jogo cobrindo os sete assuntos aprovados, com detalhes de mãos/antebraços/empunhadura, rosto/corpo/cascos de Uni, teto, pedra, tochas, escombros e saída. Apresentar referências e capturas lado a lado, identificando diferenças. Não confundir conceitos gerados com capturas reais.
- **Movimento:** vídeo do jogo mostrando repouso, caminhada/curva/parada/retomada/alerta de Uni; repouso/carga/golpe/recuperação de Bobby; impacto e passagem liberada; câmera olhando para o teto. Avaliar apoio dos pés, deformações, contato da mão com a arma, peso, transições, cintilação e legibilidade.
- **Desempenho:** medir no navegador do Mac do produtor com o conjunto completo presente, registrando custo de carregamento e memória disponível além dos tempos de quadro. Incluir movimento de câmera, Uni e partículas; sala vazia ou render do Blender não comprova a meta. Justificar eventual adoção de 30 fps estáveis e identificar pausas/travadas persistentes.
- **Aceite visual:** avaliação do produtor sobre capturas e vídeo reais comparados às referências. Não usar igualdade pixel a pixel com as imagens de conceito. Registrar aprovação ou lista objetiva de ajustes por elemento.
- **Verificações de código:** lint, types, suíte unitária, build e testes de navegador verdes para a entrega implementada. Não ampliar requisitos de compatibilidade para Safari, anteriormente dispensado.

## Out of Scope

- Novas fases, salas jogáveis adicionais, andares, inimigos, aliados, puzzles ou habilidades.
- Mudar identidade/idade de Bobby e Uni ou reproduzir literalmente todos os objetos incidentais das imagens.
- Migração para aplicativo instalado ou outra engine; substituição geral da arquitetura.
- Refazer áudio e interface já aprovados, salvo correções necessárias à integração dos recursos e preservação dos controles existentes.
- Backend de geração durante o jogo, serviços pagos novos, compra de créditos ou ultrapassar 500 créditos Meshy sem nova autorização.
- Prometer finalizar toda a fase com a primeira rodada de créditos ou declarar equivalência exata aos conceitos antes da produção.
- Tornar obrigatórios resolução 4K, ray tracing, contagem fixa de polígonos ou novo hardware como sinônimos de qualidade.
- Certificação para todos os computadores, dispositivos móveis, controles adicionais ou retorno do Safari ao escopo.
- Publicação/deploy, push, merge ou reescrita de histórico por efeito desta especificação.

## Further Notes

- Esta especificação consolida decisões já confirmadas; não é uma nova aprovação da arte implementada. As aprovações do MVP anterior permanecem históricas, mas não bastam para o novo alvo.
- Referências locais versionadas: galeria `docs/art-direction/cinematic-v1/index.html`, aceite `APPROVAL.md` e prompts `PROMPTS.md` na mesma pasta. As sete imagens são: `01-chapel-hall.png`, `02-bobby-arms-club.png`, `03-uni-character.png`, `04-portico-corridor.png`, `05-stone-columns-statues.png`, `06-blocked-passage.png`, `07-open-passage-exit.png`.
- A cópia local consultada está no commit `b35bccef4a8526fe6ff71b9a95da115768382de2`. Esse commit não estava acessível no remoto durante a preparação; não foi feito push. Agentes em outro checkout precisam receber essas referências antes de executar produção visual, sem substituí-las por memória ou novas imagens não aprovadas.
- Há distinção entre **escopo final** (fase inteira) e **rodada financiada** (até 500 créditos). Ao atingir o teto, registrar entregas, saldo e pendências; continuar trabalho local autorizado que não consuma novos créditos, sem declarar a fase concluída enquanto houver critérios não atendidos.
- Sequenciamento técnico e divisão em tickets serão definidos em `/to-tickets`, a partir desta especificação. Não há autorização implícita para iniciar gerações Meshy neste passo de documentação.
