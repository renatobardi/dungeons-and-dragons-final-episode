# Primeiro protótipo — Sala do Cenotáfio

**Proposta para revisão com o Fable.** É uma sala de teste inspirada no Cenotáfio, não uma cena declarada oficial. Objetivo: descobrir se caminhar como Bobby, usar o tacape e acompanhar Uni forma uma experiência compreensível.

## O que o jogador faz

1. Abre a página, vê os controles e clica em “Jogar”.
2. Caminha por uma sala simples e encontra uma passagem bloqueada.
3. Uni olha para o bloqueio e emite um alerta com indicação visual equivalente.
4. Bobby usa o golpe pesado no ponto destacado; o obstáculo muda para sua versão quebrada e libera a passagem.
5. O jogador atravessa e interage com a saída. A tela confirma a conclusão e oferece reinício.

## Layout mínimo

Entrada segura → corredor com uma curva → sala com obstáculo quebrável → passagem liberada → saída.

A curva testa se Uni acompanha Bobby sem atravessar paredes. A sala testa se o jogador entende a força do tacape. Não há abismo obrigatório nem inimigo nesta primeira versão.

## Controles propostos

| Entrada | Ação |
| --- | --- |
| WASD | Caminhar |
| Mouse | Olhar |
| Clique esquerdo | Golpe simples |
| Segurar e soltar clique esquerdo | Golpe pesado; indicação visível de carga pronta |
| E | Interagir quando houver uma ação disponível |
| Esc | Pausar e liberar o cursor |

Pulo, corrida e esquiva só entram quando uma cena exigir. Ajuste de sensibilidade e opção de reduzir tremor de câmera fazem parte da primeira avaliação. Não depender exclusivamente de som ou cor para ensinar uma ação.

## Regras observáveis

- Golpes só atingem alvos ao alcance e sem parede entre Bobby e o alvo.
- Golpe simples não quebra o bloqueio; o pesado carregado quebra uma única vez.
- O obstáculo usa estados intacto/quebrado definidos, sem simulação de fratura livre.
- Uni acompanha por uma rota navegável; não empurra Bobby nem ocupa permanentemente uma porta.
- O alerta ocorre ao descobrir o bloqueio, sem repetir a cada quadro ou tocar continuamente.
- Pausa, perda de foco e saída do controle do mouse suspendem ações do personagem.
- Reiniciar restaura posição, obstáculo, alertas e objetivo; não duplica Uni ou sons.

## Critérios de aceite

| ID | Verificação |
| --- | --- |
| P01 | Abrir a página e iniciar por ação explícita; carregamento tem estado visível |
| P02 | Percorrer a sala sem atravessar paredes ou cair através do piso |
| P03 | Golpe fora de alcance ou através de parede não altera o obstáculo |
| P04 | Golpe simples preserva o bloqueio; pesado o remove e permite passar |
| P05 | Uni completa a curva e volta a acompanhar após Bobby ir e voltar pelo corredor |
| P06 | Alerta sonoro possui pista visual; objetivo é compreensível com som desligado |
| P07 | Esc e troca de aba não deixam Bobby atacando ou andando sozinho |
| P08 | Concluir e reiniciar três vezes restaura a sala sem duplicações ou erros não tratados |
| P09 | Uma pessoa sem explicação verbal chega à saída; registrar onde hesitou |

## Experimento seguinte: resgate de Uni

Só depois de P01–P09: adicionar um desvio opcional com queda. Hipótese proposta: uma carga por tentativa, resgate automático quando a queda é confirmada e retorno a um ponto seguro marcado pelo nível. Não é recarga diária nem decisão para o jogo inteiro.

Verificar: primeiro resgate consome a carga; permanecer em segurança não consome; segunda queda reinicia a tentativa; reinício restaura a carga. Evitar usar “última posição” sem validar piso e espaço livre. O caminho principal continua possível sem gastar resgate.

## Como testar

Automatizar regras de alcance, carga do golpe, transição do obstáculo e reinício, com RED/GREEN/REFACTOR. Testar no navegador a sequência completa. Avaliar manualmente sensação do tacape, conforto da câmera e legibilidade de Uni; testes automatizados não demonstram diversão.

Registrar navegador, resolução, equipamento, duração e observações. Só fixar orçamento de quadros e download após essa primeira medição. A ambição inicial é movimento fluido; números futuros devem ser metas medidas, não alegações de desempenho já alcançado.
