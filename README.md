# Eu Quero Dramas

Plataforma de venda de novelas de drama com sistema de autenticação, pagamento via Pix (Mercado Pago) e painel administrativo.

## 🚀 Funcionalidades

- **Autenticação**: Login e registro com email/senha
- **Catálogo de Novelas**: Exibição com capa, preço, desconto e quantidade de episódios
- **Carrinho de Compras**: Adicionar múltiplas novelas antes de pagar
- **Pagamento Pix**: Integração com Mercado Pago (QR Code + Cópia e Cola)
- **Confirmação Automática**: Webhook que confirma pagamento automaticamente
- **Biblioteca Pessoal**: Downloads de episódios após compra
- **Painel Admin**: Dashboard de vendas, gerenciamento de novelas e configurações

## 🛠️ Stack Técnico

- **Frontend**: React 19 + Tailwind CSS 4 + TypeScript
- **Backend**: Express 4 + tRPC 11 + Node.js
- **Banco de Dados**: MySQL (Drizzle ORM)
- **Pagamentos**: Mercado Pago API
- **Autenticação**: JWT + Cookies

## 📋 Pré-requisitos

- Node.js 18+
- pnpm (ou npm/yarn)
- Banco de dados MySQL
- Chave de API do Mercado Pago

## 🔧 Instalação Local

```bash
# Clonar repositório
git clone https://github.com/codethemesx/eu-quero-dramas.git
cd eu-quero-dramas

# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env.local

# Rodar migrações do banco
pnpm db:push

# Iniciar servidor de desenvolvimento
pnpm dev
```

## 🌍 Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Banco de dados
DATABASE_URL=mysql://usuario:senha@localhost:3306/eu-quero-dramas

# Mercado Pago
VITE_MERCADO_PAGO_PUBLIC_KEY=seu_public_key_aqui
MERCADO_PAGO_ACCESS_TOKEN=seu_access_token_aqui

# JWT
JWT_SECRET=sua_chave_secreta_aqui

# Servidor
PORT=3000
NODE_ENV=development
```

## 🚀 Deploy no Vercel

### Passo 1: Conectar Repositório

1. Acesse [vercel.com](https://vercel.com)
2. Clique em "New Project"
3. Selecione seu repositório `eu-quero-dramas` do GitHub
4. Clique em "Import"

### Passo 2: Configurar Variáveis de Ambiente

No painel do Vercel, vá para **Settings → Environment Variables** e adicione:

```
DATABASE_URL=sua_url_mysql
VITE_MERCADO_PAGO_PUBLIC_KEY=sua_chave_publica
MERCADO_PAGO_ACCESS_TOKEN=seu_token_acesso
JWT_SECRET=sua_chave_secreta
```

### Passo 3: Configurar Build

O projeto já está configurado para Vercel. Certifique-se que:

- **Framework**: Node.js
- **Build Command**: `pnpm build`
- **Start Command**: `pnpm start`
- **Output Directory**: `dist`

### Passo 4: Deploy

Clique em "Deploy" e aguarde a conclusão. O Vercel fará o build e deploy automaticamente.

## ⚙️ Configuração do Mercado Pago

### 1. Obter Credenciais

1. Acesse [mercadopago.com.br/developers](https://www.mercadopago.com.br/developers)
2. Faça login ou crie uma conta
3. Vá para "Credenciais" e copie:
   - **Public Key** (chave pública)
   - **Access Token** (token de acesso)

### 2. Configurar Webhook

1. No painel do Mercado Pago, vá para "Webhooks"
2. Adicione uma nova URL de notificação:
   ```
   https://seu-dominio.vercel.app/api/webhook/mercadopago
   ```
3. Selecione os eventos:
   - `payment.created`
   - `payment.updated`

### 3. Adicionar Chave no Admin

1. Acesse `/admin` com a conta admin
2. Vá para "Configurações"
3. Cole a chave de acesso do Mercado Pago
4. Salve as configurações

## 🔐 Segurança

- **Credenciais do MP**: Nunca são expostas ao cliente, apenas no servidor
- **Senhas**: Hash com bcrypt
- **Tokens JWT**: Armazenados em cookies HttpOnly
- **CORS**: Configurado apenas para origens autorizadas

## 📊 Estrutura do Banco de Dados

- **users**: Usuários do sistema
- **dramas**: Novelas disponíveis
- **episodes**: Episódios das novelas
- **orders**: Pedidos/carrinho
- **order_items**: Itens de cada pedido
- **purchases**: Compras confirmadas
- **system_settings**: Configurações do sistema

## 🧪 Testes

```bash
# Rodar testes
pnpm test

# Rodar testes com coverage
pnpm test -- --coverage
```

## 📝 Usuário Admin Padrão

- **Email**: `codethemesx@gmail.com`
- **Senha**: `#Tatarav0`

## 🐛 Troubleshooting

### Erro de conexão com banco de dados

Verifique se a `DATABASE_URL` está correta e o banco está acessível.

### QR Code não aparece

Certifique-se que a chave do Mercado Pago está configurada no admin.

### Webhook não funciona

1. Verifique se a URL do webhook está correta no painel do MP
2. Verifique os logs do Vercel em "Functions"

## 📞 Suporte

Para dúvidas ou problemas, abra uma issue no repositório.

## 📄 Licença

MIT
