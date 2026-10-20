# Relatório técnico do aplicativo Satura

## 1. Visão geral

O Satura é um aplicativo mobile para geração, visualização e armazenamento local de paletas de cores. O projeto utiliza:

- React Native para as telas.
- Expo para execução no Android, iOS e Web.
- Expo Router para navegação baseada em arquivos.
- TypeScript para tipagem estática.
- AsyncStorage para persistência local.
- Expo Image Picker para câmera e galeria.
- Expo Image Manipulator e `jpeg-js` para processamento de imagens.
- Expo Clipboard para copiar códigos HEX.

Não existe backend, API própria, banco remoto ou serviço externo de autenticação. Usuários, sessão, configurações e paletas são mantidos no dispositivo.

## 2. Estrutura do projeto

```text
satura-mobile/
├── assets/
├── src/
│   ├── app/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── cadastro.tsx
│   │   ├── home.tsx
│   │   ├── criar_paleta.tsx
│   │   ├── resultado_paleta.tsx
│   │   ├── paletas_salvas.tsx
│   │   └── perfil.tsx
│   ├── components/BarraNavegacao.tsx
│   ├── constants/
│   │   ├── palettes.ts
│   │   └── theme.ts
│   ├── contexts/AppSettingsContext.tsx
│   ├── services/storage.ts
│   └── utils/
│       ├── colorExtractor.ts
│       ├── colors.ts
│       ├── paletteGenerator.ts
│       └── paletteNavigation.ts
├── app.json
├── package.json
├── package-lock.json
├── README.md
└── tsconfig.json
```

No Expo Router, os arquivos de `src/app` representam as rotas:

| Arquivo | Rota | Responsabilidade |
|---|---|---|
| `src/app/index.tsx` | `/` | Login |
| `src/app/cadastro.tsx` | `/cadastro` | Cadastro |
| `src/app/home.tsx` | `/home` | Tela inicial |
| `src/app/criar_paleta.tsx` | `/criar_paleta` | Questionário e imagem |
| `src/app/resultado_paleta.tsx` | `/resultado_paleta` | Resultado e salvamento |
| `src/app/paletas_salvas.tsx` | `/paletas_salvas` | Lista e exclusão |
| `src/app/perfil.tsx` | `/perfil` | Perfil, acessibilidade e logout |

## 3. Inicialização e navegação

### `src/app/_layout.tsx` — `RootLayout`

`RootLayout` envolve a aplicação com `AppSettingsProvider`, define o fundo, configura `StatusBar` e cria a navegação Stack do Expo Router. O cabeçalho padrão das rotas é ocultado e a transição utilizada é `slide_from_right`.

As telas navegam principalmente com:

```tsx
router.push("/criar_paleta");
router.replace("/home");
router.back();
```

- `push` adiciona uma tela à pilha.
- `replace` substitui a tela atual.
- `back` retorna à tela anterior.

## 4. Tema visual

### `src/constants/theme.ts`

O objeto `Colors` centraliza as cores da identidade visual, como `primary`, `background`, `card`, `text`, `error`, `success` e os acentos roxo, rosa, laranja, verde e amarelo.

`Fonts` usa `Platform.select` para selecionar fontes no iOS, Android e Web. `Spacing` define uma escala de espaçamentos (`xs`, `sm`, `md`, `lg`, `xl` e `xxl`).

As telas aplicam `StyleSheet.create` localmente, usando as cores e fontes do tema. Não há biblioteca externa de componentes visuais.

## 5. Configurações de acessibilidade

### `src/contexts/AppSettingsContext.tsx`

`AppSettingsProvider` mantém o estado global `highContrast`, inicialmente verdadeiro:

```tsx
const [highContrast, setHighContrastState] = useState(true);
```

Ao iniciar, chama `getSettings()` e recupera a configuração do armazenamento. `setHighContrast` atualiza o estado e chama `saveSettings`.

O hook `useAppSettings` acessa o contexto e lança erro se usado fora do provider:

```tsx
if (!context) {
  throw new Error("useAppSettings must be used inside AppSettingsProvider");
}
```

As telas também utilizam `accessibilityRole`, `accessibilityLabel`, `accessibilityHint` e `accessibilityState`.

## 6. Cadastro, login e logout

### `src/services/storage.ts`

O serviço usa `@react-native-async-storage/async-storage`.

O tipo `StoredUser` contém:

```tsx
export interface StoredUser {
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}
```

Apesar do nome `passwordHash`, o código atualmente salva a senha diretamente em `passwordHash`. Não existe hash criptográfico real.

As chaves principais são:

```tsx
USER_PROFILE_STORAGE_KEY = "satura:user-profile";
SESSION_STORAGE_KEY = "satura:user-session";
```

#### `getStoredUser`

Lê o usuário do `AsyncStorage`, converte o JSON, valida a estrutura com `isStoredUser` e normaliza o e-mail. Retorna `null` se não houver usuário ou se o conteúdo estiver inválido.

#### `saveNewUser`

Cria um usuário com nome e e-mail normalizados, data de criação e senha. Salva o usuário e chama `saveSession`, fazendo com que o cadastro já deixe o usuário autenticado.

#### `checkSession`

Lê `satura:user-session`, valida o objeto e retorna `email` e `name`. É usada para manter a sessão após reabrir o aplicativo.

#### `login`

Executa:

1. Recuperação do usuário.
2. Normalização do e-mail digitado.
3. Comparação de e-mail.
4. Comparação da senha.
5. Criação de uma nova sessão.

#### `logout`

Remove somente `SESSION_STORAGE_KEY`. O usuário e as paletas permanecem no dispositivo.

#### Funções internas

- `normalizeEmail`: remove espaços e converte para minúsculas.
- `isStoredUser`: valida os campos obrigatórios de usuário.
- `isStoredSession`: valida os campos da sessão.
- `saveSession`: centraliza a gravação da sessão.
- `getSettings` e `saveSettings`: persistem a preferência de alto contraste.

### `src/app/index.tsx` — `LoginScreen`

Mantém estados para e-mail, senha, mensagem de erro e carregamento.

`useEffect` chama `checkSession`; caso exista sessão, executa `router.replace("/home")`.

`handleLogin` valida:

- E-mail obrigatório.
- Formato do e-mail.
- Senha obrigatória.

Depois chama `login(email, password)`. Em caso de sucesso, navega para `/home`; em caso de erro, mostra a mensagem do serviço.

O link de cadastro chama `router.push("/cadastro")`.

### `src/app/cadastro.tsx` — `CadastroScreen`

Mantém nome, e-mail, senha, confirmação, erro e carregamento.

`handleRegister` valida:

- Nome preenchido.
- Nome com pelo menos dois caracteres.
- E-mail preenchido e válido.
- Senha preenchida.
- Senha com pelo menos quatro caracteres.
- Confirmação igual à senha.

Após `saveNewUser`, mostra um `Alert` e executa `router.replace("/home")`.

### Limitação da autenticação

O sistema salva apenas um usuário na chave `satura:user-profile`. Portanto, um novo cadastro substitui o usuário anterior. Não há uma coleção de contas, recuperação de senha ou autenticação remota.

## 7. Tela inicial

### `src/app/home.tsx` — `HomeScreen`

Mantém:

```tsx
const [userName, setUserName] = useState("Gabriela");
const [palettes, setPalettes] = useState<SavedPalette[]>([]);
```

`useFocusEffect` recarrega a sessão e as paletas cada vez que a Home recebe foco. Isso atualiza a tela após criar ou excluir uma paleta em outra rota.

Principais ações:

- Perfil: `router.push("/perfil")`.
- Criar por preferências: `router.push("/criar_paleta?mode=preferences")`.
- Criar por imagem: `router.push("/criar_paleta?mode=image")`.
- Ver paletas: `router.push("/paletas_salvas")`.
- Abrir paleta: navega para `/resultado_paleta` com `getPaletteResultParams`.

`confirmDelete` pede confirmação em um `Alert`, chama `removeSavedPalette` e atualiza o estado local.

A Home exibe no máximo três paletas com `palettes.slice(0, 3)`.

## 8. Criação por preferências

### `src/app/criar_paleta.tsx` — `CriarPaletaScreen`

A tela possui duas abas:

1. `preferencias`
2. `imagem`

O questionário contém oito etapas:

1. Propósito.
2. Sensação.
3. Temperatura.
4. Luminosidade.
5. Saturação.
6. Neutros.
7. Harmonia.
8. Quantidade de cores.

As opções são organizadas nos arrays `purposes`, `moods`, `temperatures`, `tones`, `saturations`, `neutralsList`, `harmonies` e `counts`.

`selectOption` atualiza o estado correspondente à etapa atual. `handleContinuePreferences` avança entre as etapas e, na etapa oito, navega para `/resultado_paleta`, enviando as respostas como parâmetros.

`handleBack` volta uma etapa quando `step > 1`; na primeira etapa, substitui a rota por `/home`.

Os estados iniciais já possuem respostas padrão, como `"Projeto de design"` e `"Calma e serenidade"`. Isso significa que o usuário consegue avançar sem necessariamente alterar todas as opções.

## 9. Criação a partir de imagem

Ainda em `src/app/criar_paleta.tsx`, os estados principais são:

```tsx
const [selectedImageUri, setSelectedImageUri] = useState<string | null>(...);
const [extractedColors, setExtractedColors] = useState<string[]>(...);
const [isExtracting, setIsExtracting] = useState(false);
```

`DEMO_IMAGE_PRESETS` contém imagens remotas do Unsplash e cores predefinidas.

### `pickImageFromGallery`

Solicita permissão para a galeria, abre `launchImageLibraryAsync` e encaminha a URI para `processSelectedImage`.

### `takePhotoWithCamera`

Solicita permissão para a câmera, abre `launchCameraAsync` e encaminha a URI para `processSelectedImage`.

### `processSelectedImage`

Ativa o indicador, chama `extractPaletteFromImage(uri)`, atualiza `extractedColors` e desativa o indicador.

### `handleSelectPreset`

Seleciona a URI e as cores do preset diretamente. Nesse caminho, a imagem não é analisada pixel a pixel; as cores vêm do objeto preset.

### `handleUseExtractedPalette`

Navega para `/resultado_paleta` com `customColors` serializado em JSON e `source: "imagem"`.

## 10. Geração de paletas

### `src/utils/paletteGenerator.ts`

`QuestionnaireAnswers` representa as respostas do questionário. `PaletteBlueprint` organiza seis papéis de cor:

- `primary`
- `secondary`
- `support`
- `neutral`
- `accent`
- `extra`

### `generateHarmonicPalette`

A função aplica regras em sequência:

1. Escolhe um conjunto inicial pela temperatura e pelo humor.
2. Substitui cores para saturação suave ou terrosa.
3. Substitui cores para tons escuros ou alto contraste.
4. Ajusta o neutro.
5. Ajusta harmonia análoga ou monocromática.
6. Escolhe rótulos conforme o propósito.
7. Retorna três, cinco ou seis cores.

Exemplo da seleção por quantidade:

```tsx
if (count === 3) {
  hexList = [base.primary, base.accent, base.neutral];
} else if (count === 6) {
  hexList = [
    base.primary,
    base.secondary,
    base.support,
    base.neutral,
    base.accent,
    base.extra,
  ];
} else {
  hexList = [
    base.primary,
    base.secondary,
    base.support,
    base.neutral,
    base.accent,
  ];
}
```

Ao final, `getClosestColorName` fornece nomes descritivos para cada cor.

## 11. Tela de resultado

### `src/app/resultado_paleta.tsx` — `ResultadoPaletaScreen`

A tela recebe parâmetros de rota usando `useLocalSearchParams`.

O `useMemo` monta a paleta em três caminhos:

1. `paletteColors` ou `customColors`: recupera cores salvas ou extraídas.
2. Respostas do questionário: chama `generateHarmonicPalette`.
3. Parâmetros incompletos: usa `PALETTE_SETS` como fallback.

### `copyColor`

Usa `Clipboard.setStringAsync(hex)`, atualiza `copiedHex`, mostra um alerta e retorna o botão ao estado normal depois de 2,5 segundos.

### `handleSavePalette`

Valida o nome, cria um objeto `SavedPalette` com `Date.now()` como id e chama `addSavedPalette`.

Após salvar, exibe um `Alert` com as opções de abrir `/paletas_salvas` ou continuar na tela.

Cada cor é apresentada com:

- Faixa visual.
- Nome.
- HEX.
- RGB.
- Contraste WCAG no modo de alto contraste.
- Botão de cópia.

## 12. Modelo e armazenamento de paletas

### `src/constants/palettes.ts`

`PaletteColor` possui `name` e `hex`.

`SavedPalette` possui:

- `id`
- `name`
- `purpose`
- `mood`
- `tone`
- `colors`
- `savedAt`
- `source`
- `imageUrl`
- `explanation`

`PALETTE_SETS` contém conjuntos base para combinações como `"Calma e natural|Tons claros"` e `"Minimalista e neutra|Tons escuros"`.

### `buildPaletteColors`

Converte uma lista de HEX em objetos `PaletteColor`, atribuindo papéis e nomes aproximados.

### `loadSavedPalettes`

Lê a sessão ativa, calcula a chave da conta e retorna a lista persistida. Se não houver dados, retorna `[]`; não recria paletas fictícias.

### `saveSavedPalettes`

Serializa a lista e salva na chave da conta ativa. Sem sessão, lança erro.

### `addSavedPalette`

Carrega a lista, coloca a nova paleta no início, remove eventual item com o mesmo id e salva.

### `removeSavedPalette`

Filtra a paleta pelo id, salva a lista restante e a retorna para a tela.

### `getCurrentUserPalettesKey`

Lê o e-mail da sessão e produz uma chave como:

```text
satura:saved-palettes:ana%40example.com
```

Isso impede que contas diferentes compartilhem a mesma lista de paletas.

## 13. Tela de paletas salvas

### `src/app/paletas_salvas.tsx` — `PaletasSalvasScreen`

Estados:

```tsx
const [palettes, setPalettes] = useState<SavedPalette[]>([]);
const [searchQuery, setSearchQuery] = useState("");
const [expandedId, setExpandedId] = useState<string | null>(null);
const [paletteToDelete, setPaletteToDelete] = useState<SavedPalette | null>(null);
```

`useFocusEffect` chama `loadSavedPalettes` sempre que a tela recebe foco.

A busca filtra por nome, propósito e humor.

Cada paleta pode ser:

- Aberta na tela de resultado.
- Expandida para mostrar detalhes.
- Copiada por código HEX.
- Excluída por modal de confirmação.

Após excluir:

```tsx
const remaining = await removeSavedPalette(id);
setPalettes(remaining);
setPaletteToDelete(null);
```

## 14. Tela de perfil

### `src/app/perfil.tsx` — `PerfilScreen`

Busca a sessão, o usuário salvo e o número de paletas no `useEffect`.

Exibe:

- Avatar com a inicial.
- Nome e e-mail.
- Quantidade de paletas.
- Preferência de alto contraste.
- Informações do projeto.
- Atalho para paletas.
- Logout.

`handleToggleContrast` delega a alteração ao contexto.

`handleLogout` confirma a ação, chama `logout()` e executa `router.replace("/")`.

Há valores visuais de fallback:

```tsx
user?.name ?? "Gabriela"
user?.email ?? "gabriela@satura.com"
```

Esses valores são apenas exibidos quando nenhum usuário foi carregado.

## 15. Barra de navegação

### `src/components/BarraNavegacao.tsx` — `BarraNavegacao`

Apresenta as abas Início, Criar, Salvas e Perfil.

`usePathname` identifica a aba ativa. A rota `/resultado_paleta` é tratada visualmente como parte da aba Criar.

O contador de paletas aparece como badge somente quando `savedCount > 0`.

O clique usa `router.replace(tab.route)`.

## 16. Utilitários de cores

### `src/utils/colors.ts`

#### `hexToRgb`

Converte uma cor HEX em texto RGB.

#### `rgbToHex`

Converte valores RGB para HEX e limita cada componente entre 0 e 255.

#### `getRelativeLuminance`

Calcula a luminância relativa conforme a fórmula usada pela WCAG.

#### `getContrastRatio`

Calcula a proporção de contraste entre duas cores.

#### `getBestContrastTextColor`

Compara texto branco e escuro e retorna o que possui melhor contraste sobre o fundo.

#### `getClosestColorName`

Compara a cor recebida com `COLOR_NAMES_MAP` usando distância euclidiana ponderada. O resultado é um nome em português como `"Verde Satura"` ou `"Tom Harmônico"`.

#### `getHarmonyExplanation`

Produz uma explicação textual usando propósito, humor e luminosidade.

## 17. Extração de imagem

### `src/utils/colorExtractor.ts`

`extractPaletteFromImage`:

1. Redimensiona a imagem para `120 x 120`.
2. Solicita JPEG em Base64.
3. Decodifica com `jpeg-js`.
4. Percorre os pixels.
5. Agrupa cores quantizadas em blocos de 32.
6. Ordena grupos pela frequência.
7. Remove cores muito semelhantes.
8. Completa a quantidade com uma paleta de fallback.

Funções internas:

- `decodeBase64`: converte Base64 em bytes.
- `rgbToHex`: converte um pixel médio para HEX.
- `fallbackPalette`: repete cores conhecidas quando necessário.

Se a imagem não puder ser processada, o código retorna:

```tsx
["#16645F", "#72D6B0", "#EEECDE", "#B8D8BA", "#FFB35C"]
```

Isso evita que a tela fique sem resultado, mas significa que o fallback pode não representar a imagem original.

## 18. Navegação de paletas

### `src/utils/paletteNavigation.ts`

`getPaletteResultParams` transforma uma `SavedPalette` em parâmetros de rota. As cores são serializadas com `JSON.stringify` para que `resultado_paleta.tsx` consiga reconstruí-las.

São enviados:

- Propósito.
- Humor.
- Tom.
- Origem.
- Nome.
- Explicação.
- Cores completas.
- Lista de HEX.

## 19. Fluxos ponta a ponta

### Cadastro

```text
Login
  → Cadastro
  → handleRegister
  → saveNewUser
  → AsyncStorage
  → saveSession
  → Home
```

### Login

```text
Login
  → handleLogin
  → login
  → getStoredUser
  → comparação de e-mail e senha
  → saveSession
  → Home
```

### Logout

```text
Perfil
  → confirmação
  → logout
  → remoção da sessão
  → Login
```

### Criar por preferências

```text
Home
  → criar_paleta
  → oito etapas
  → resultado_paleta
  → generateHarmonicPalette
```

### Criar por imagem

```text
Home
  → criar_paleta?mode=image
  → câmera, galeria ou preset
  → extractPaletteFromImage
  → resultado_paleta
```

### Salvar

```text
Resultado
  → modal de nome
  → handleSavePalette
  → addSavedPalette
  → saveSavedPalettes
```

### Excluir

```text
Home ou Paletas Salvas
  → confirmação
  → removeSavedPalette
  → AsyncStorage
  → atualização da tela
```

## 20. Configuração do projeto

### `package.json`

Os scripts existentes são:

```json
{
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web"
}
```

As dependências principais são Expo, React Native, Expo Router, AsyncStorage, Image Picker, Image Manipulator, Clipboard, `jpeg-js` e TypeScript.

### `tsconfig.json`

O TypeScript usa modo estrito, resolução `bundler` e o alias:

```json
"paths": {
  "@/*": ["./src/*"]
}
```

### `app.json`

Define nome, slug, versão, orientação vertical, ícones, identificadores iOS/Android, permissões de câmera e galeria, plugin do Expo Router e splash screen.

## 21. Limitações e problemas encontrados

### Usuário único

O usuário é armazenado em `satura:user-profile`. Um novo cadastro substitui o anterior. As paletas são separadas por e-mail, mas o sistema não possui cadastro multiusuário completo.

### Senha sem hash

`passwordHash` armazena a senha em texto. Isso é inadequado para produção e serve apenas para a demonstração local.

### Sem sincronização

Não há backend, recuperação de senha, sincronização entre aparelhos ou conta remota.

### Presets dependem de URLs externas

Os presets usam imagens do Unsplash, portanto dependem de rede para carregar.

### Presets não são analisados

Ao escolher um preset, suas cores predefinidas são usadas diretamente; não há extração real de pixels nesse caminho.

### Fallback da extração

Falhas na análise da imagem retornam cores fixas, que podem não representar a foto.

### Parâmetros de rota

As cores são transportadas como JSON nos parâmetros da navegação. Paletas muito grandes podem tornar esse mecanismo pouco adequado.

### Tratamento assíncrono

Algumas telas chamam carregamentos com `.then` sem tratamento de erro diretamente na interface. O serviço retorna listas vazias ou registra erros, mas a tela pode simplesmente parecer vazia.

### Ausência de testes automatizados

O projeto não possui testes unitários ou de integração configurados e não possui scripts específicos de lint ou teste.

### Divergência da documentação

O README menciona Expo SDK 52, enquanto o `package.json` utiliza Expo 57. A documentação está desatualizada nesse ponto.

### Erros de tipagem já observados

Foram observados anteriormente dois erros não relacionados à documentação:

1. `backgroundColor` não reconhecido na tipagem atual de `StatusBar` em `src/app/_layout.tsx`.
2. `StyleSheet.absoluteFillObject` não reconhecido em `src/app/criar_paleta.tsx`.

Esses pontos não fazem parte da lógica funcional descrita neste relatório.

## 22. Resumo arquitetural

```text
RootLayout
  ├── AppSettingsProvider
  └── Expo Router Stack
      ├── Login ─────────────── storage.ts
      ├── Cadastro ───────────── storage.ts
      ├── Home ───────────────── storage.ts + palettes.ts
      ├── Criar Paleta ───────── paletteGenerator.ts + colorExtractor.ts
      ├── Resultado ───────────── colors.ts + paletteNavigation.ts
      ├── Paletas Salvas ──────── palettes.ts + AsyncStorage
      └── Perfil ──────────────── storage.ts + contexto de configurações
```

O sistema é uma aplicação local em camadas simples:

- As telas cuidam da interação e da navegação.
- `storage.ts` cuida de usuário, sessão e configurações.
- `palettes.ts` cuida do modelo e da persistência de paletas.
- `paletteGenerator.ts` gera paletas por regras.
- `colorExtractor.ts` analisa imagens.
- `colors.ts` calcula nomes, RGB, luminância e contraste.
- `paletteNavigation.ts` adapta dados para as rotas.

Nenhum arquivo de código foi alterado para produzir este relatório.
