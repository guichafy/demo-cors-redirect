#!/bin/sh
printf 'Content-Type: text/plain; charset=utf-8\r\n\r\n'
printf 'Método: %s\nX-Demo-Token: %s\nCorpo: ' "$REQUEST_METHOD" "${HTTP_X_DEMO_TOKEN:-(ausente)}"
cat
printf '\n'
