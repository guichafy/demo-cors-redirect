# Prova de conceito de CORS com HTTP 307

## Reproduzir no navegador

Com o Docker em execução, suba os três Apaches na pasta do projeto.

```sh
docker compose up -d
```

O Apache de origem usa o loopback IPv6 (`::1`) na `8080`. Abra a página com `localhost`. O endereço `127.0.0.1:8080` usa IPv4 e pode apontar para outro serviço.

Se o IPv6 estiver indisponível ou a porta `8080` também estiver ocupada no IPv6, execute `IP_ORIGEM=127.0.0.1 PORTA_ORIGEM=8081 docker compose up -d` e abra [http://localhost:8081](http://localhost:8081).

1. Abra [http://localhost:8080](http://localhost:8080) ou a porta escolhida acima.
2. Abra o DevTools, marque **Preserve log** em **Network** e clique em **Testar redirecionamento**.
3. Em **Network**, confira o `GET /redirecionar` com `307`. A barra de endereço muda para [http://localhost:8090](http://localhost:8090).
4. Ao carregar, a página na `8090` faz um `fetch` com `POST /redirecionar-api`. A rota responde com outro `307` e `Location: http://localhost:8070/receber.cgi`.
5. Antes de enviar o POST à API, o Chrome faz `OPTIONS /receber.cgi` com `Origin: http://localhost:8090` e `Access-Control-Request-Headers: content-type,x-demo-token`. A API responde `204` com `Access-Control-Allow-Headers: Content-Type`.
6. O **Console** mostra `(redirected from 'http://localhost:8090/redirecionar-api')` e indica que `x-demo-token` foi bloqueado pelo preflight na `8070`.

Na página da `8090`, **Testar sem X-Demo-Token** envia o mesmo JSON à API usando apenas `Content-Type`. Esse POST retorna `200` desde o início.

## Ativar a correção

Em [apache/api.conf](apache/api.conf), remova o `#` da última diretiva.

```apache
Header always merge Access-Control-Allow-Headers "X-Demo-Token"
```

Reinicie o Apache da API e recarregue a página na `8090`.

```sh
docker compose restart api
```

O preflight passa a permitir `Content-Type` e `X-Demo-Token`. A página mostra `HTTP 200` e a API devolve o método `POST`, o valor do cabeçalho e o corpo JSON que recebeu.

Para repetir o erro, comente a diretiva novamente e reinicie a API. Para encerrar os três serviços, execute `docker compose down`.
