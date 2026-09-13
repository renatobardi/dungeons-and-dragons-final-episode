# Registro de créditos Meshy — revisão cinematográfica

Registro único e compartilhado dos tickets [#25](https://github.com/renatobardi/dungeons-and-dragons-final-episode/issues/25),
[#26](https://github.com/renatobardi/dungeons-and-dragons-final-episode/issues/26),
[#27](https://github.com/renatobardi/dungeons-and-dragons-final-episode/issues/27),
[#28](https://github.com/renatobardi/dungeons-and-dragons-final-episode/issues/28) e
[#29](https://github.com/renatobardi/dungeons-and-dragons-final-episode/issues/29), conforme a spec
[#24](https://github.com/renatobardi/dungeons-and-dragons-final-episode/issues/24).

**Teto autorizado da primeira rodada: 500 créditos**, incluindo gerações descartadas. Não há autorização
para comprar créditos. O saldo da conta é maior que o teto — o teto é o limite, não o saldo.

- Saldo da conta na abertura do registro (13/09/2026): **2847 créditos**
- Consumido nesta rodada: **180**
- Restante do teto: **320**

## Tabela de preços aplicada

| Operação | Créditos |
| --- | --- |
| image-to-3d meshy-7, malha apenas | 20 |
| image-to-3d meshy-7, com textura 2k (PBR incluso) | 30 |
| image-to-3d meshy-7, textura 8k | 35 |
| text-to-3d meshy-6/latest | 20 |
| retextura 2k | 10 |
| rig | 5 |
| animação | 3 |

## Operações

| # | Data | Ticket | Alvo | Operação | Estimado | Efetivo | Saldo do teto | Situação |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 13/09/2026 | #25 | Braço direito de Bobby com o tacape | image-to-3d meshy-7, textura 2k + PBR, a partir de `assets/refs/bobby-right-arm-club.png` (recorte da imagem aprovada 02) | 30 | 30 | 470 | aprovada — task `01a098b2-e2d8-762c-815a-552e642a0574`, 1,94 M triângulos crus, acabamento no Blender |
| 2 | 13/09/2026 | #25 | Braço esquerdo de Bobby | image-to-3d meshy-7, textura 2k + PBR, a partir de `assets/refs/bobby-left-arm.png` (recorte da imagem aprovada 02) | 30 | 30 | 440 | aprovada — task `01a098b2-f713-751f-b49a-7b9f4655a6cf`, 1,93 M triângulos crus, acabamento no Blender |
| 3 | 13/09/2026 | #28 | Bloqueio intacto | image-to-3d meshy-7, textura 2k + PBR, a partir de `assets/refs/rubble-intact.png` (recorte da imagem aprovada 06) | 30 | 30 | 410 | aprovada — task `01a098c1-4071-77f3-b519-a4bff56f8813`, 1,64 M triângulos crus |
| 4 | 13/09/2026 | #28 | Escombros da passagem aberta | image-to-3d meshy-7, textura 2k + PBR, a partir de `assets/refs/rubble-broken.png` (recorte da imagem aprovada 07) | 30 | 30 | 380 | aprovada — task `01a098c1-4fb3-73a7-b7c7-e9507c9ca443`, 1,82 M triângulos crus |
| 5 | 13/09/2026 | #26 | Uni cinematográfica | image-to-3d meshy-7, textura 2k + PBR, `pose_mode: t-pose`, a partir de `assets/refs/uni-foal.png` (recorte da imagem aprovada 03) | 30 | 30 | 350 | **descartada** — proporção de cavalo adulto, que o critério do #26 proíbe explicitamente; pose com um membro suspenso, ruim para o rig |
| 6 | 13/09/2026 | #26 | Uni cinematográfica, segunda tentativa | image-to-3d meshy-7, textura 2k + PBR, a partir de `assets/refs/uni-foal-profile.png` (recorte da imagem aprovada 01, de perfil e com os quatro cascos no chão) | 30 | 30 | 320 | **descartada** — continuou com proporção adulta e trouxe furos visíveis no ombro e no flanco |

As quatro primeiras saídas foram aceitas na primeira tentativa: antebraço contínuo até a mão, bracelete com
rebites, dedos e polegar envolvendo a empunhadura, tacape de peça única com fibra e desgaste, e um
monte de blocos partidos com tambor de coluna caído, com massa e profundidade reais. O GLB cru de cada
uma tem ~60 MB e fica fora do git; o task id acima reproduz o download.

## Descartes

**60 créditos, as operações 5 e 6, ambas da Uni.** As duas gerações foram avaliadas contra o critério do
#26 — "sem anatomia de cavalo adulto ou aparência de brinquedo" — e as duas reprovaram pelo mesmo
motivo: o Meshy leu a potranca como cavalo adulto, com pernas longas, pescoço comprido e cabeça pequena.
A segunda tentativa trocou a entrada por um perfil com os quatro cascos no chão, que é a pose certa para
o rig, e ainda assim manteve a proporção adulta, além de trazer furos na malha.

A terceira tentativa não foi disparada: duas falhas pelo mesmo motivo indicam limite da ferramenta para
este alvo, não má sorte, e gastar mais do teto compartilhado nisso tira orçamento dos outros tickets.

## Recursos reaproveitados sem consumo

| Recurso | Origem | Por que não foi refeito |
| --- | --- | --- |
| `public/models/cenotaph/statue.glb` | ticket 07 | A gárgula já tem volume, asas e relevo; entra na revisão por material e colocação, não por nova geração. |
| Saída luminosa, arco e vão de pedra | autoria própria | O defeito é o retângulo branco estourado, não a falta de um modelo: resolve-se com geometria e luz. |
| `public/models/cenotaph/column.glb` | ticket 07 | Coluna de tambores com base e capitel; o que faltava era escala de pedra e iluminação, resolvidos na integração. |
| `public/models/uni/uni-rigged.glb` | ticket 13 | Já tem esqueleto quadrúpede e três clipes. O ticket #26 manda avaliar antes de refazer. |
| Abóbada, arcos, nervuras, pilares e claristório da sala | autoria própria, `src/render/chapel.ts` | Geometria paramétrica no navegador; gerar no Meshy custaria créditos e daria menos controle sobre colisão e escala. |
| Pedra de paredes, piso e teto | autoria própria, `src/render/textures.ts` | Cor, relevo e rugosidade derivados do mesmo passe procedural, sem custo e sem download. |

## Pendências

Nada pendente por esgotamento do teto — sobram 320 créditos dos 500.

**A malha e a pelagem da Uni continuam abaixo do alvo cinematográfico** e são a pendência aberta desta
rodada. O que foi verificado e mantido, conforme o #26 manda avaliar antes de refazer:

- O esqueleto quadrúpede e os três clipes (`idle`, `walk`, `alert`) estão corretos e ficam.
- A passada continua dirigida pela distância percorrida, sem deslizamento.
- A identidade — filhote de corpo claro, crina laranja e chifre — está preservada na malha atual, que é
  justamente o que as duas gerações novas perderam.

O que falta é o acabamento: a crina tem aresta dura, o corpo é branco chapado e o material responde à
luz como plástico moldado. Duas rotas continuam abertas e nenhuma foi gasta:

1. **Retextura da malha atual** (10 créditos), que preservaria geometria e rig. Bloqueada hoje por um
   detalhe de rastreabilidade: a retextura exige o `input_task_id` da geração original ou uma URL
   pública do modelo, e o id da geração de 12/09 não ficou registrado. Registrar ids de tarefa passou a
   ser parte deste documento exatamente por isso.
2. **Correção de proporção no Blender** sobre a geração 5, que tem focinho, orelhas e crina bem melhores
   que a malha atual: encurtar membros, engrossar o tronco e aumentar a cabeça até a proporção de
   filhote. É trabalho de autoria, sem consumo, e precisa de uma rodada dedicada.

A decisão de qual rota seguir é do produtor. Não tratar a fase como aprovada enquanto a Uni estiver
neste estado.
