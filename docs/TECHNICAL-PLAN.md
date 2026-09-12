# Base técnica proposta

## Escolha a revisar

**Atualização de prioridade:** o usuário exige qualidade gráfica máxima. A recomendação abaixo é provisória; a [prova visual](VISUAL-TARGET.md) deve validar a escolha antes da produção da campanha. Não selecionar a engine apenas pela facilidade de programar.

Recomendação: **Babylon.js + TypeScript**, com aplicação web estática. A documentação do Babylon lista colisões, animações, áudio, navegação e importação de glTF; essa combinação fundamenta sua candidatura para este jogo. A adequação ao projeto é uma avaliação de engenharia, a validar no protótipo. [Especificações oficiais](https://www.babylonjs.com/specifications/), consultadas em 12/09/2026.

Alternativa: Godot, caso a montagem de cenas em editor visual seja prioritária. Sua exportação web depende de WebAssembly e WebGL 2.0; a documentação atual também registra restrições de exportação para C#. Escolher essa rota implica validar o jogo exportado no navegador desde o começo. [Documentação oficial de exportação web](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html), consultada em 12/09/2026.

Babylon favorece um fluxo de implementação em código com o Codex; exige que a organização das cenas seja construída de forma explícita. Godot oferece outra forma de autoria, mas acrescenta o fluxo de exportação. Não instalar ambos nem produzir dois protótipos sem uma dúvida concreta que justifique o custo.

## Componentes iniciais

| Parte | Responsabilidade |
| --- | --- |
| Aplicação | Carregar recursos, iniciar, pausar, reiniciar e concluir |
| Sala | Piso, paredes, iluminação, pontos de entrada e saída |
| Bobby | Movimento, câmera, alcance e golpes |
| Uni | Seguir, sinalizar interesse e depois testar resgate |
| Obstáculo | Estado intacto/quebrado e atualização de colisão |
| Interface | Controles, objetivo, pausa, carregamento e conclusão |

Começar com responsabilidades diretas. Não construir um framework de habilidades, editor próprio, sistema genérico de quests ou arquitetura de plugins para uma sala.

## Estrutura futura de código

Criar apenas quando a engine e a especificação do protótipo forem confirmadas:

```text
src/
  main.ts
  game.ts
  player.ts
  uni.ts
  prototype-room.ts
  ui.ts
tests/
  gameplay/
  browser/
public/
  assets/
    models/
    textures/
    audio/
art-source/
docs/
```

`art-source` guarda originais editáveis; `public/assets` recebe somente exportações destinadas ao jogo. Essas pastas de código e arte ainda não existem: evitar arquivos vazios que pareçam implementação.

Proposta de ferramentas de apoio: Vite para execução/build, Vitest para regras e Playwright para fluxo no navegador. Conferir versões compatíveis ao implementar e registrar lockfile. Nenhuma dependência foi instalada ou versão selecionada nesta etapa.

## Regras de integração

- Uma atualização central coordena movimento e ações usando tempo decorrido, sem atrelar velocidade à quantidade de quadros.
- Separar a malha visual da forma simplificada de colisão quando necessário.
- Reinício deve restaurar explicitamente todos os estados da sala.
- Começar com colisões simples; só adicionar um motor de física se o comportamento aprovado exigir.
- Estados do protótipo: carregando, pronto, jogando, pausado, concluído e falha de carregamento.
- Controles e áudio começam após interação do jogador; testar perda de foco e retorno ao jogo.
- Modelos e áudios são arquivos produzidos antes da partida. O navegador não chama Meshy, ElevenLabs ou Lyria durante o gameplay.
- Sem backend no protótipo: não há conta, pagamento ou progresso remoto que o exija. Chaves de serviços nunca entram nos arquivos enviados ao navegador.

## Testes e entrega

Antes de código de produção: teste comportamental falhando pela razão correta. Implementar o mínimo, executar suíte inteira e depois refatorar. Também executar lint, types, build e fluxo de navegador. Registrar comandos reais quando o projeto executável existir.

A publicação futura precisa servir os arquivos do build e seus recursos por HTTPS. Provedor e domínio ficam pendentes; não houve publicação. Validar recursos em caminhos reais de hospedagem, carregamento em cache frio, perda de foco e reinício no endereço publicado.

## Compatibilidade a definir

Equipamento de referência confirmado: MacBook M5 com 24 GB de RAM. O jogo continua web, com processamento gráfico no dispositivo do jogador. Definir navegador e resolução de teste antes de declarar compatibilidade e desempenho. Suporte móvel é decisão separada de produto.
