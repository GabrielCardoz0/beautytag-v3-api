# GET /appointments/client

Busca o nome de um cliente já atendido anteriormente a partir do telefone, para **autopreenchimento** do campo "Nome do cliente" no formulário de novo agendamento.

> Não existe uma tabela de "clientes" no sistema — o cliente é identificado pelo par `client_name` / `client_phone` armazenado em cada agendamento (`appointments`). Este endpoint busca o **agendamento mais recente** criado com aquele telefone e devolve o nome salvo nele.

## Autenticação

Bearer Token (JWT) — obrigatório.

## Permissões

`admin` e `parceiro`.

- Como `parceiro`: a busca é restrita aos agendamentos do próprio parceiro autenticado (cada parceiro só "conhece" seus próprios clientes).
- Como `admin`: a busca considera agendamentos de todos os parceiros.

## Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `phone` | `string` | Sim | Telefone do cliente digitado no formulário. Aceita com ou sem formatação/DDI (ex.: `11994703386`, `(11) 99470-3386`, `+5511994703386`) — a busca normaliza o valor internamente e testa as variações comuns. |

**Exemplo:**
```
GET /appointments/client?phone=11994703386
```

## Resposta de sucesso — `200 OK`

Cliente encontrado:
```json
{
  "client": {
    "client_name": "Maria Silva"
  }
}
```

Cliente não encontrado (telefone novo, sem agendamentos anteriores):
```json
{
  "client": {
    "client_name": null
  }
}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `client.client_name` | `string \| null` | Nome do cliente salvo no agendamento mais recente com esse telefone, ou `null` se nenhum agendamento anterior existir para esse telefone (dentro do escopo de permissão do usuário autenticado). |

## Possíveis erros

| Status | Mensagem | Causa |
|---|---|---|
| `400` | `"O parâmetro 'phone' é obrigatório."` | A query string `phone` não foi enviada. |
| `401` | `"Você precisa estar logado para continuar."` | Token ausente ou inválido. |
| `401` | `"Você não tem autorização para continuar."` | Usuário autenticado não é `admin` nem `parceiro`. |

---

## Task — Frontend

No formulário de novo agendamento, ao final da digitação do campo "Telefone do cliente" (ex.: `onBlur`, ou debounce quando o número atingir tamanho válido), chamar:

```
GET /appointments/client?phone=<telefone digitado>
```

- Se `client.client_name` vier preenchido: preencher automaticamente o campo "Nome do cliente" (permitindo edição manual depois).
- Se `client.client_name` vier `null`: não preencher nada — tratar como cliente novo.
- Se a chamada falhar (erro de rede, `400`, `401`): não bloquear o formulário — apenas seguir sem autopreenchimento.
