# Bobby — acabamento visual do ticket #25

Versão local para avaliação do produtor. Ticket reaberto e atribuído; não fechado automaticamente.
Base: main `5d47cf7`. Branch: `fix/bobby-visual-finish`.

## Resultado

- Antebraços continuados no Blender, sem expor as extremidades na trajetória verificada.
- Orientação de importação corrigida: mão direita e tacape preservam a empunhadura original; mão livre reposicionada.
- Detalhe da madeira e das mãos recuperado a partir dos originais Meshy. Preservados os mapas de 2K.
- Pele com rugosidade revisada e microvariação discreta no mapa de normais; iluminação de preenchimento restrita ao equipamento.
- Carga preservada na transição para o golpe, sem voltar abruptamente ao repouso. Trajetória mais compacta e tremor reduzido.
- Fontes editáveis em `assets/models/bobby/left-arm.blend` e `right-arm-club.blend`; exportações em `public/models/bobby/`.

## Evidência

[Galeria comparativa](index.html) · [Repouso](01-rest.jpg) · [Carga](02-charge.jpg) · [Vídeo do jogo](bobby-in-game.webm) · [Medição](measurement.json).

As imagens são capturas da build de produção, sem retoque. O vídeo foi gravado no navegador e mostra repouso, cargas, golpes, recuperação e pausa/retomada. O arquivo de vídeo tem 25 fps; a taxa do jogo é medida separadamente, não inferida do vídeo.

## Verificação

RED: a versão anterior falhou em continuidade carga → golpe e enquadramento do cotovelo. Uma verificação adicional dos vértices dos GLBs detectou exposição durante o movimento. GREEN: 99 testes unitários, lint, tipos e build passaram; os 11 cenários de navegador passaram contra a build deste worktree em porta isolada.

O teste geométrico amostra as extremidades dos dois modelos em passos de 1/120 s durante golpes simples e pesados. Ele verifica o enquadramento, não qualidade artística. Esta continua sujeita à avaliação visual.

## Medição incremental

Chrome 153.0.8010.36 · WebGPU · 3024×1890 · DPR 2 · TAA e sombras altas ligados.
12 golpes (6 simples e 6 pesados), incluindo carga e recuperação, executados em tempo real no trecho contado.

- Média: 8,33 ms/quadro, aproximadamente 120 fps, limitada pelo refresh de 120 Hz.
- p95: 10,0 ms; pior: 10,4 ms; quadros >33 ms: zero; amostras: 1697.
- Sem erros de página registrados. Carregamento local sem limitação artificial de rede: 496 ms.

A medição é incremental do equipamento na sala, não certificação da fase inteira ou de outros dispositivos. Não mede uma nova destruição do obstáculo. Os GLBs passaram de aproximadamente 1,8 MiB somados para 13,3 MiB; há custo maior de download e memória. O tempo local não estima carregamento em conexão móvel.

## Origem e créditos

Reutilizados os originais das operações 1 e 2 do registro `docs/MESHY-LEDGER.md`: tarefas Meshy `01a098b2-e2d8-762c-815a-552e642a0574` e `01a098b2-f713-751f-b49a-7b9f4655a6cf`, já vinculadas à referência aprovada de Bobby. Nenhuma geração, compra ou consumo novo de créditos nesta alteração. O registro compartilhado não foi reescrito.

Reprodução do acabamento: executar `scripts/finish-bobby.py` pelo Blender, na raiz do projeto, com os originais `*-raw.glb` já presentes. Os `.blend` empacotam as texturas e permitem edição sem buscar novamente os originais. Evidência reproduzível por `scripts/measure-bobby.ts` contra um preview de produção, configurável por `BOBBY_URL`.

## Diferenças remanescentes para a referência

Os dedos mantêm a pose modelada, sem articulação individual; não há simulação de tecido biológico ou shader específico de subsuperfície. A mão livre ainda tem uma pose mais aberta/vertical que a referência. O material foi melhorado, mas não alegamos equivalência fotográfica ao conceito. A arquitetura, Uni e a sincronização da destruição não foram alteradas neste ticket.

O fechamento visual depende da avaliação do produtor sobre esta evidência; testes verdes não substituem esse aceite.
