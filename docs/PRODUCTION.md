# Produção do jogo

## Etapas e portas de saída

| Etapa | Entrega | Só avançar quando |
| --- | --- | --- |
| Pré-produção | Este pacote revisado, engine e protótipo especificados | Dúvidas que bloqueiam a primeira sala resolvidas |
| Protótipo | Sala com formas simples | Critérios P01–P09 atendidos |
| Prova visual antecipada | Pequeno cenário com Uni animada, mãos/tacape e magia | Direção visual aprovada e custo medido no equipamento alvo; engine reavaliada |
| Demonstração representativa | Um trecho com arte, áudio, ameaça e cooperação | Jogador compreende, visual é aprovado e desempenho é medido |
| Capítulo em formas simples | Quatro fases conectadas e epílogo provisório | Jornada inteira pode ser concluída e reiniciada |
| Produção final | Substituição progressiva de recursos provisórios | Cada troca mantém o jogo funcional e dentro do orçamento medido |
| Preparação para compartilhar | Build publicado para teste e revisão completa | Roteiro, funcionamento e recursos finais revisados |

Não há estimativa honesta de calendário ainda. Medir o esforço para uma sala, um personagem animado e uma interação completa antes de projetar o restante.

A [qualidade gráfica máxima](VISUAL-TARGET.md) é prioridade confirmada. A prova visual deve ocorrer cedo, antes de expandir conteúdo; o protótipo simples valida interação, não o acabamento final.

## Arte e áudio: do arquivo ao jogo

1. **Referência:** reunir imagens e cenas identificadas; aprovar proporções, paleta e silhueta.
2. **Modelo base:** usar Meshy conforme a stack desejada; revisar a qualidade do resultado antes de gerar o elenco inteiro.
3. **Preparação no Blender:** corrigir malha, escala, materiais e pivôs. Preparar esqueleto e animações quando necessários.
4. **Exportação:** propor GLB como formato de intercâmbio, validando um modelo na engine escolhida antes de padronizar todos.
5. **Integração:** conferir escala, orientação, material, animação e colisão dentro da cena real.
6. **Áudio:** começar com sons provisórios; após aprovar cenas, produzir músicas com a ferramenta Lyria indicada e vozes/efeitos com ElevenLabs. Confirmar ferramentas e formatos disponíveis nessa etapa.
7. **Validação:** testar legibilidade, volume, carregamento e fluidez no navegador alvo.

Uma imagem ou modelo gerado não é automaticamente um personagem pronto para jogar. Movimento, esqueleto, colisão, animações e otimização ainda precisam ser preparados e testados.

## Recursos por entrega

| Recurso | Protótipo | Demonstração representativa |
| --- | --- | --- |
| Bobby | Câmera e tacape provisório | Mãos/tacape com animações de golpe; corpo completo só se uma cena precisar |
| Uni | Forma simples reconhecível | Modelo com repouso, caminhada e alerta |
| Cenotáfio | Piso, paredes, curva e bloqueio | Pequeno conjunto modular com materiais e iluminação aprovados |
| Obstáculo | Duas formas: intacta e quebrada | Versões visuais, impacto e poeira discretos |
| Aliado | Ausente | Um aliado escolhido pela interação testada |
| Ameaça | Ausente | Uma ameaça necessária ao trecho, ainda a especificar |
| Áudio | Golpe, alerta e confirmação provisórios | Ambiente, efeitos, pequeno tema e falas aprovadas |
| Interface | Iniciar, pausar, objetivo, concluir | Mesmas funções com acabamento visual e legendas |

Não produzir todos os modelos antes de validar o primeiro no jogo. O cenário pode ser modular: peças reutilizáveis de parede, piso e coluna, sem exigir uma ferramenta própria de montagem.

## Registro de recursos

Ao receber cada arquivo, registrar em uma tabela: identificador em inglês, finalidade, origem, versão, responsável pela revisão, formato, tamanho e situação de uso. Guardar também a informação de licença/permissão correspondente ao recurso final. O registro começa quando houver recursos reais; não há catálogo fictício de assets entregues.

Separar três revisões: fidelidade visual, qualidade técnica e condição de uso/publicação. Uma aprovação visual não responde às outras duas. Não presumir autorização para distribuir material original da série ou vozes de atores a partir da existência de uma referência.

## Conferência narrativa

O material atual contém referências numeradas sem bibliografia. Criar, ao localizar as fontes, uma matriz: afirmação → fonte e trecho → confirmado/adaptação/divergência → decisão. Priorizar uso da chave, papel de Eric, retorno da geleia, resgate de Hank e poderes de Uni.

O protótipo pode avançar com formas simples sem resolver todo o cânone. Falas e cenas finais dependem dessa conferência para sustentar a fidelidade desejada.

## Sessão de teste com uma pessoa

Entregar o link e pedir que tente concluir sem explicação. Observar onde hesita, se entende Uni, se distingue os golpes e se sente desconforto. Depois perguntar o que achou que deveria fazer. Registrar comportamento observado separadamente de sugestões.

Problemas que impedem terminar vêm primeiro; depois compreensão, conforto e desempenho; acabamento vem em seguida. Registrar cada problema com passo a passo, resultado esperado e resultado ocorrido.
