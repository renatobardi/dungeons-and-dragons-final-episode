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
- Consumido nesta rodada: **60**
- Restante do teto: **440**

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

As duas saídas foram aceitas na primeira tentativa: antebraço contínuo até a mão, bracelete com
rebites, dedos e polegar envolvendo a empunhadura e tacape de peça única com fibra e desgaste. O GLB
cru de cada uma tem ~60 MB e fica fora do git; o task id acima reproduz o download.

## Descartes

Nenhum até agora. Cada descarte entra na tabela acima com o custo efetivo cobrado e o motivo.

## Recursos reaproveitados sem consumo

| Recurso | Origem | Por que não foi refeito |
| --- | --- | --- |
| `public/models/cenotaph/statue.glb` | ticket 07 | A gárgula já tem volume, asas e relevo; entra na revisão por material e colocação, não por nova geração. |
| `public/models/cenotaph/column.glb` | ticket 07 | Coluna de tambores com base e capitel; o que faltava era escala de pedra e iluminação, resolvidos na integração. |
| `public/models/uni/uni-rigged.glb` | ticket 13 | Já tem esqueleto quadrúpede e três clipes. O ticket #26 manda avaliar antes de refazer. |
| Abóbada, arcos, nervuras, pilares e claristório da sala | autoria própria, `src/render/chapel.ts` | Geometria paramétrica no navegador; gerar no Meshy custaria créditos e daria menos controle sobre colisão e escala. |
| Pedra de paredes, piso e teto | autoria própria, `src/render/textures.ts` | Cor, relevo e rugosidade derivados do mesmo passe procedural, sem custo e sem download. |

## Pendências ao atingir o teto

Nada pendente por esgotamento até agora.
