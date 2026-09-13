# Deploy

Produção: **https://bobby.oute.pro** — container LXC `bobby-prd` (`10.173.117.37:3750`)
no `oute-server`. Ainda não existe ambiente de desenvolvimento remoto.

## Esteira

| Gatilho | O que roda |
| --- | --- |
| PR para `main` | `ci` — lint, types, vitest, build, Playwright (SwiftShader) |
| Push em `main` com `ci` verde | `cd` — rebuild e restart do container |
| `workflow_dispatch` em `cd` | redeploy manual do que está na `main` |

O `cd` entra no tailnet pela Tailscale Action, faz ssh no host e conduz o
container por `lxc exec` (a delegação LXD do usuário `ubuntu`). O container não
roda Tailscale — é a regra da skill `install-app` do `renatobardi/lab`.

Medição de desempenho (`pnpm measure`) continua local: FPS em runner
compartilhado sem GPU não diz nada sobre o jogo.

## Imagem

`Dockerfile` em dois estágios: `node:24-alpine` builda o bundle do Vite,
`nginx:1.29-alpine` serve `dist/`. Sem Node em runtime. `docker-compose.yml`
publica a porta 3750 do inventário.

Rodar a imagem de produção localmente:

```bash
docker compose up --build
# http://localhost:3750
```

## Segredos (environment `prd` no GitHub)

| Secret | Conteúdo |
| --- | --- |
| `TS_AUTHKEY_PRD` | auth key Tailscale reusable + ephemeral + pre-approved, tag `tag:cd-prd` |
| `OUTE_SSH_HOST` | `ubuntu@<IP tailscale do oute-server>` |
| `DEPLOY_SSH_KEY` | chave privada cuja pública está no `authorized_keys` do host |

## Host

O vhost Nginx e o certificado de `bobby.oute.pro` são configuração de host, fora
do alcance do CD — ver `scripts/ops/` e a
[referência do oute-server](https://github.com/renatobardi/lab/blob/main/docs/oute-server-app-setup.md).
