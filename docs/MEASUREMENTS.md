# Medições de desempenho

Como reproduzir (Chrome instalado, GPU real, WebGPU):

```bash
pnpm build && (pnpm preview &) && sleep 2 && pnpm measure
```

O script abre o Chrome visível, carrega o build com cache frio em rede emulada no preset "Fast 4G" do Chrome (4 Mbps, 20 ms), clica "Jogar", percorre o trecho tirando 7 capturas, grava um vídeo e mede 10 s de caminhada com câmera girando em DPR 2 e 1,5. Saída em `docs/measurements/<data>/` (JSON, PNGs, `run.webm`).

## 12/09/2026 — MacBook Pro M5 Pro, 24 GB, tela 3024×1964, macOS 26.5.2

Chrome 153 · backend **WebGPU** · viewport 1512×945 CSS px (tela cheia menos a moldura do navegador).

| DPR | Resolução de renderização | Quadro médio | fps | p95 | Pior quadro | Quadros > 33 ms |
| --- | --- | --- | --- | --- | --- | --- |
| 2 | 3024×1890 | 8,4 ms | 120 | 9,1 ms | 13,7 ms | 0 |
| 1,5 | 2268×1417 | 8,3 ms | 120 | 9,1 ms | 13,6 ms | 0 |

Carregamento: pronto para jogar em **1,3 s** (segunda execução; 2,4 s na primeira, cache frio), **0,6 MB** transferidos.

**Leitura:** os 8,3 ms são o limite do monitor de 120 Hz (vsync), não o custo real da GPU; a cena tem folga, mas o quanto de folga só aparece quando a carga aumentar (Uni final, mais luzes com sombra). Metas de [ENGINE-REVIEW.md](ENGINE-REVIEW.md) §3 atingidas com margem em DPR 2.

**Representatividade da cena medida:** 1 luz direcional com sombra 2048 PCF, 8 luzes pontuais (7 tochas + saída), 1 personagem (Uni provisória, ~20 malhas), 12 colunas, 19 paredes, bloom, TAA, névoa, partículas ao quebrar. Não inclui aliados nem inimigos: não prova o custo do confronto final.

## 12/09/2026 — a mesma máquina, com a Uni rigada (ticket 13)

Refeita depois que a Uni passou a ser uma malha com esqueleto e três clipes. A mesma máquina e o mesmo script da tabela acima, mas os números **não são comparáveis** a ela: a tabela acima foi tirada com a janela de p95 de 4 s e um preset de rede que o script não usa mais, e ficou pendente de refazer desde então. Para saber o que o rig custa, a linha de base foi medida na mesma sessão trocando só o modelo.

| Modelo | DPR | Quadro médio | fps | p95 | Pior quadro | Quadros > 33 ms | Transferido a frio |
| --- | --- | --- | --- | --- | --- | --- | --- |
| sem rig (`uni.glb`) | 2 | 10,0 ms | 100 | 12,1 ms | 66,4 ms | 2 | 4,4 MB |
| com rig (`uni-rigged.glb`) | 2 | 10,2 ms | 98 | 12,0 ms | 67,9 ms | 2 | 4,9 MB |
| com rig (`uni-rigged.glb`) | 1,5 | 8,3 ms | 120 | 9,2 ms | 26,8 ms | 0 | — |

**Leitura:** o esqueleto custa cerca de **0,2 ms** por quadro, dentro do ruído entre execuções, e **0,5 MB** de transferência — os índices e pesos de osso dos 17.577 vértices. Em DPR 1,5 a cena continua no teto de 120 Hz. Os dois piores quadros acima de 33 ms aparecem igual na linha de base, então não são do rig.

**Pendências de medição:** Safari 26 (não automatizado; medir manualmente com o painel de depuração: tecla F3 ou crase), memória GPU (não exposta pelo Chrome via script; ler em `chrome://gpu` ou no Activity Monitor durante a partida).
