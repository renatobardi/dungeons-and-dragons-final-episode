# Direção de qualidade gráfica

## Prioridade confirmada

O usuário quer **qualidade máxima de gráficos**. Permanecem navegador por link e fidelidade visual ao desenho dos anos 80. A interpretação de trabalho é acabamento visual de alto nível em 3D estilizado, preservando personagens e linguagem do desenho. Não foi solicitado mudar para fotorrealismo.

“Máxima” é uma prioridade de produto, não uma especificação mensurável isoladamente. O equipamento de referência informado pelo usuário é **MacBook com chip M5 e 24 GB de RAM**, executando o jogo no navegador. Navegador, resolução de renderização e fluidez alvo ainda precisam ser definidos. Não presumir variante do chip, quantidade de núcleos de GPU ou resolução da tela. Não há aprovação de orçamento ilimitado, compra de hardware ou mudança de plataforma.

O link entrega o jogo; o navegador usa o hardware de quem joga para processar os gráficos. Validar nesse MacBook não garante a mesma qualidade em computadores menos potentes.

## O que perseguir

- **Personagens:** silhuetas e proporções fiéis, rostos expressivos, deformação limpa nas articulações e animações cuidadas.
- **Bobby em primeira pessoa:** mãos e tacape bem acabados, movimento com peso e transições de animação consistentes.
- **Uni:** boa leitura facial e corporal, caminhada sem deslizar e presença convincente ao lado do jogador.
- **Cenotáfio:** composição monumental, materiais com aparência pintada, iluminação dirigida e sombras coerentes com a estética.
- **Magia:** energia, partículas e luz com identidade visual, mantendo inimigos, caminhos e ações legíveis.
- **Imagem em movimento:** contornos estáveis, ausência de cintilação incômoda e fluidez compatível com câmera em primeira pessoa.

Resolução de textura, quantidade de polígonos e efeitos serão escolhidos pelo resultado visível e pelo custo medido. Não fixar “4K”, ray tracing ou uma tecnologia específica como sinônimo de qualidade.

## Prova visual antecipada

Antes de comprometer a produção da campanha e consolidar a engine, construir um pequeno trecho representativo do Cenotáfio com Uni animada, mãos/tacape e um efeito de magia. A engine candidata pode ser usada no experimento sem ser considerada escolha definitiva.

Esse teste complementa o protótipo de formas simples, que continua útil para controles e regras. Formas simples não representam a qualidade final desejada.

| Critério | Evidência necessária |
| --- | --- |
| Fidelidade e acabamento | Comparação com referências identificadas e aprovação visual do usuário |
| Qualidade em movimento | Vídeo capturado no navegador, com câmera próxima e deslocamento |
| Desempenho | Máquina/GPU, navegador, resolução real de renderização, tempos de quadro e quedas registradas |
| Carregamento | Tamanho transferido e tempo de entrada medidos com cache frio e conexão registrada |
| Representatividade | Quantidades de personagens, luzes e efeitos do teste registradas; uma sala vazia não prova o custo do confronto final |

O Fable deve propor metas numéricas para o MacBook M5 com 24 GB, confirmando navegador e resolução de teste. Se a cena não atingir qualidade e fluidez juntas, registrar a limitação e avaliar otimizações ou outra engine. Não reduzir silenciosamente a direção visual nem mudar o requisito de navegador.

## Trade-offs a apresentar

Maior acabamento exige mais trabalho de modelagem, animação, iluminação e revisão. Recursos maiores podem elevar download e memória; efeitos mais caros podem limitar os computadores atendidos. Essas concessões precisam ser medidas e discutidas, sem prometer desempenho antes do teste.

A escolha técnica anterior fica provisória. O critério passa a ser atingir esta direção visual no dispositivo alvo, além de permitir desenvolver e manter o jogo.
