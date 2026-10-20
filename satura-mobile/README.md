# SATURA — Aplicativo Mobile para Criação de Paletas de Cores

> **Atividade Acadêmica:** Tecnologia Web para Negócios  
> **Tecnologias:** React Native, Expo (SDK 52), Expo Router, TypeScript, AsyncStorage  
> **Compatibilidade:** iPhone (iOS) e Android via **Expo Go**  
> **Arquitetura:** Frontend 100% Local / Offline (Sem backend, sem banco de dados remoto)

---

## 1. Visão Geral

O **Satura** é um aplicativo mobile focado em descoberta, harmonia cromática e criação personalizada de paletas de cores para designers, estudantes, artistas, decoradores e entusiastas visuais.

O aplicativo opera de duas maneiras principais:
1. **Por Preferências:** Um questionário intuitivo de 4 etapas que personaliza paletas com base no propósito de uso (Design, Estilo, Decoração, Arte), clima emocional desejado e luminosidade.
2. **A partir de Imagem:** Captura de fotos com a câmera do celular ou seleção na galeria do dispositivo, com extração e amostragem real de cores locais.

---

## 2. Instruções de Execução

### Pré-requisitos
- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn**
- **Dispositivo Móvel:** iPhone ou celular Android com o aplicativo gratuito **Expo Go** instalado (disponível na App Store ou Google Play).

### Passo a Passo

1. **Abrir no VS Code:**
   Abra a pasta `satura-mobile` no VS Code ou em seu editor preferido:
   ```bash
   code satura-mobile
   ```

2. **Instalar as Dependências:**
   ```bash
   npm install
   ```

3. **Iniciar o Servidor Expo:**
   ```bash
   npx expo start
   ```

4. **Testar no iPhone:**
   - Certifique-se de que o computador e o iPhone estejam conectados à **mesma rede Wi-Fi**.
   - No iPhone, abra o aplicativo **Câmera** nativo e aponte para o **QR Code** exibido no terminal.
   - Toque no banner amarelo do Expo Go para abrir o aplicativo.
   - Alternativamente, pressione a tecla `w` no terminal para abrir a pré-visualização web do Expo.

---

## 3. Telas Implementadas

| Tela | Rota | Descrição |
| :--- | :--- | :--- |
| **Login** | `/` (`index.tsx`) | Autenticação local simulada com validação de campos (e-mail, senha), mensagens em português e atalho para dados de teste. |
| **Cadastro** | `/cadastro` | Criação de perfil com validação de nome, e-mail, senha e confirmação de senha, gravado no `AsyncStorage`. |
| **Início (Home)** | `/home` | Saudação personalizada ("Olá, {nome}! ✨"), destaques visuais, acesso às duas modalidades de criação e lista de paletas recentes. |
| **Criar Paleta** | `/criar_paleta` | Abas com questionário guiado de 4 etapas e modo câmera/galeria com extração cromática real. |
| **Resultado** | `/resultado_paleta` | Faixa cromática, lista com HEX/RGB, contraste, cópia para área de transferência e modal para salvar com nome personalizado. |
| **Paletas Salvas** | `/paletas_salvas` | Coleção persistida, busca dinâmica, visualização detalhada de códigos e exclusão com diálogo de confirmação. |
| **Perfil** | `/perfil` | Identificação do usuário, estatísticas locais, preferências de acessibilidade e encerramento de sessão. |

---

## 4. Auditoria de Acessibilidade — Diretrizes WCAG 2.2 (Nível AA)

O desenvolvimento do Satura adotou as recomendações da WCAG 2.2 AA desde o início:

1. **Contraste de Cores (Critério 1.4.3):**
   - Fundo principal `#EEECDE` com texto `#16645F` atinge proporção de **6.8:1** (supera o mínimo de 4.5:1).
   - Textos sobre botões principais (`#FFFFFF` sobre `#16645F`) atingem **9.2:1** (nível AAA).
   - Cores de paletas possuem cálculo dinâmico de luminância relativa (`getBestContrastTextColor`) para garantir legibilidade dos códigos sobre qualquer tom.

2. **Uso de Cores (Critério 1.4.1):**
   - Nenhuma informação crítica depende exclusivamente de cor.
   - Todas as cores são acompanhadas por seus nomes em português (ex.: *Verde Satura*, *Dourado Pôr do Sol*), códigos hexadecimais e valores RGB.

3. **Áreas de Toque (Critério 2.5.8):**
   - Todos os botões, links e campos interativos possuem altura mínima de **48 a 52 pontos**, ultrapassando o mínimo de 44x44 pontos.

4. **Leitores de Tela:**
   - Componentes utilizam `accessibilityRole`, `accessibilityLabel`, `accessibilityHint` e `accessibilityState`.

5. **Formulários e Erros:**
   - Mensagens de validação claras em português, alertas visuais acessíveis e preservação dos dados preenchidos.

---

## 5. Estrutura de Arquivos

```text
satura-mobile/
├── assets/                  # Ícones e imagens do aplicativo
├── src/
│   ├── app/                 # Rotas do Expo Router
│   │   ├── _layout.tsx      # Navegação Stack principal
│   │   ├── index.tsx        # Tela de Login com validação
│   │   ├── cadastro.tsx     # Tela de Cadastro local
│   │   ├── home.tsx         # Tela Inicial
│   │   ├── criar_paleta.tsx # Criação (Questionário + Câmera/Galeria)
│   │   ├── resultado_paleta.tsx # Tela de Resultado da Paleta
│   │   ├── paletas_salvas.tsx   # Tela de Paletas Salvas
│   │   └── perfil.tsx       # Perfil e configurações
│   ├── constants/
│   │   ├── theme.ts         # Identidade visual Satura e temas
│   │   └── palettes.ts      # Dados harmônicos e persistência
│   ├── services/
│   │   └── storage.ts       # Gerenciamento de sessão e usuários
│   └── utils/
│       └── colors.ts        # Conversão HEX/RGB, luminância e WCAG
├── app.json                 # Configurações do Expo
├── package.json             # Dependências compatíveis com Expo Go
├── tsconfig.json            # Configuração do TypeScript
└── README.md                # Instruções e documentação
```
