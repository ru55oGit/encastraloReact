export type SupportedLanguage = "es" | "en" | "pt";

export interface Translation {
  // Layout / general
  appName: string;
  drawerHome: string;
  drawerPlay: string;
  language: string;
  privacyPolicyLabel: string;

  // Home
  tagline: string;
  greetingMorning: string;
  greetingAfternoon: string;
  greetingEvening: string;
  daysWithoutPlayingMessage: (days: number) => string;
  readyToPlay: string;
  playButton: string;
  recordTitle: string;
  recordEmptyBody: string;
  recordScoreCaption: (score: number) => string;
  recordWordsCaption: (n: number) => string;
  recordLongestWordCaption: (word: string) => string;
  removeAdsButton: string;
  removeAdsButtonBuying: string;
  whatIsTitle: string;
  whatIsBody: string;
  howToPlayTitle: string;
  howToPlayBody: string;
  faqTitle: string;
  faq: { q: string; a: string }[];

  // Game
  scoreLabel: string;
  levelLabel: string;
  levelGoalLabel: (current: number, total: number) => string;
  levelUpTitle: (level: number) => string;
  levelReachedLabel: (level: number) => string;
  wordsListTitle: string;
  wordsListEmpty: string;
  shareResultText: (level: number, score: number) => string;
  shareRepeatPenaltyLabel: (points: number) => string;
  shareRecordText: (score: number) => string;
  pauseButtonLabel: string;
  resumeButtonLabel: string;
  pausedOverlayTitle: string;
  errorNotInDictionary: string;
  errorAlreadyUsed: (word: string) => string;
  gameOverTitle: string;
  gameOverBody: (score: number) => string;
  playAgainButton: string;
  backToHomeButton: string;
  continueWithAdButton: string;
  rewardedAdConfirmButton: string;
  rewardedAdSkipButton: string;
  rewardedAdWaitLabel: (seconds: number) => string;
}

const es: Translation = {
  appName: "Encastralo",
  drawerHome: "Inicio",
  drawerPlay: "Jugar",
  privacyPolicyLabel: "Política de Privacidad",
  language: "Idioma",

  tagline: "encastrá · formá · sumá",
  greetingMorning: "Buenos días ☀️",
  greetingAfternoon: "Buenas tardes 🌤️",
  greetingEvening: "Buenas noches 🌙",
  daysWithoutPlayingMessage: (days) => `hace ${days} días que no jugás`,
  readyToPlay: "¿Listo para jugar Encastralo?",
  playButton: "JUGAR",
  recordTitle: "Récord",
  recordEmptyBody: "Todavía no jugaste ninguna partida.",
  recordScoreCaption: (score) => `${score} puntos`,
  recordWordsCaption: (n) => `Más palabras en una partida: ${n}`,
  recordLongestWordCaption: (word) => `Palabra más larga: ${word} (${word.length} letras)`,
  removeAdsButton: "Sacar los anuncios",
  removeAdsButtonBuying: "Redirigiendo a MercadoPago...",
  whatIsTitle: "¿Qué es Encastralo?",
  whatIsBody: "Encastralo es un Tetris de letras. Cada pieza cae con una letra por cuadro, y al encastrar arriba de las demás va formando una sopa de letras. A diferencia del Tetris clásico, las líneas completas no se borran solas: tenés que encontrar palabras deslizando el dedo sobre la grilla para eliminarlas.",
  howToPlayTitle: "¿Cómo jugar?",
  howToPlayBody: "Movés y girás las piezas con los botones de abajo para acomodar las letras. Cuando veas una palabra formada en la grilla, deslizá el dedo pasando por sus letras: no hace falta que estén en línea recta, podés doblar en cualquier dirección mientras cada letra toque a la anterior. Si existe en el diccionario, se elimina y sumás puntos; las letras de arriba caen para ocupar su lugar. Repetir una palabra ya usada te resta 1 punto. Cada 5 palabras se completa un nivel: se vacía la grilla y arranca el siguiente. Perdés si las piezas llegan arriba de todo.",
  faqTitle: "Preguntas frecuentes",
  faq: [
    { q: "¿Encastralo es gratis?", a: "Sí, jugar a Encastralo es completamente gratis. La app se sostiene con publicidad, nunca vas a tener que pagar para jugar." },
    { q: "¿Necesito crear una cuenta?", a: "No. Tu récord y tu progreso se guardan en este dispositivo automáticamente, no hace falta registrarse ni iniciar sesión." },
    { q: "¿Cómo subo de nivel?", a: "Cada 5 palabras que encontrás se completa un nivel: la grilla se vacía y arranca el siguiente, con piezas que caen cada vez más rápido." },
    { q: "¿Qué pasa si repito una palabra ya usada?", a: "Restás 1 punto. Cada palabra solo suma puntos la primera vez que la encontrás en esa partida." },
    { q: "¿Cuándo termina la partida?", a: "Perdés cuando las piezas se apilan hasta arriba de todo. Podés jugar de nuevo las veces que quieras." },
    { q: "¿En qué idiomas puedo jugar?", a: "Encastralo está disponible en español, inglés y portugués. Podés cambiar el idioma desde el selector de la parte de abajo de esta pantalla." },
  ],

  scoreLabel: "Puntos",
  levelLabel: "Nivel",
  levelGoalLabel: (current, total) => `Objetivo: ${current}/${total} palabras`,
  levelUpTitle: (level) => `¡Nivel ${level}!`,
  levelReachedLabel: (level) => `Nivel alcanzado: ${level}`,
  wordsListTitle: "Palabras encontradas",
  wordsListEmpty: "Formá una palabra en la grilla y seleccionala",
  shareResultText: (level, score) => `¡Completé Encastralo! Llegué al nivel ${level} con ${score} puntos 🧩`,
  shareRepeatPenaltyLabel: (points) => `-${points} puntos por palabras repetidas`,
  shareRecordText: (score) => `¡Mi récord en Encastralo es de ${score} puntos! ¿Podés superarlo? 🧩`,
  pauseButtonLabel: "Pausar",
  resumeButtonLabel: "Reanudar",
  pausedOverlayTitle: "⏸ Pausado",
  errorNotInDictionary: "Esa palabra no se encuentra en mi diccionario.",
  errorAlreadyUsed: (word) => `Ya usaste "${word}" (-1 punto).`,
  gameOverTitle: "¡Se llenó la grilla!",
  gameOverBody: (score) => `Terminaste con ${score} puntos.`,
  playAgainButton: "Jugar de nuevo",
  backToHomeButton: "Volver al inicio",
  continueWithAdButton: "Mirá un anuncio y seguí jugando",
  rewardedAdConfirmButton: "Reclamar recompensa",
  rewardedAdSkipButton: "Cerrar",
  rewardedAdWaitLabel: (seconds) => `Esperá ${seconds}s...`,
};

const en: Translation = {
  appName: "Encastralo",
  drawerHome: "Home",
  drawerPlay: "Play",
  privacyPolicyLabel: "Privacy Policy",
  language: "Language",

  tagline: "stack · spell · score",
  greetingMorning: "Good morning ☀️",
  greetingAfternoon: "Good afternoon 🌤️",
  greetingEvening: "Good evening 🌙",
  daysWithoutPlayingMessage: (days) => `it's been ${days} days since you last played`,
  readyToPlay: "Ready to play Encastralo?",
  playButton: "PLAY",
  recordTitle: "Best score",
  recordEmptyBody: "You haven't played a game yet.",
  recordScoreCaption: (score) => `${score} points`,
  recordWordsCaption: (n) => `Most words in one game: ${n}`,
  recordLongestWordCaption: (word) => `Longest word: ${word} (${word.length} letters)`,
  removeAdsButton: "Remove ads",
  removeAdsButtonBuying: "Redirecting to MercadoPago...",
  whatIsTitle: "What is Encastralo?",
  whatIsBody: "Encastralo is a letter Tetris. Each piece falls with one letter per block, and as pieces stack up they form a word search grid. Unlike classic Tetris, full lines don't clear on their own: you have to find words by swiping across the grid to remove them.",
  howToPlayTitle: "How to play?",
  howToPlayBody: "Move and rotate pieces with the buttons below to arrange the letters. When you spot a word in the grid, swipe across its letters: they don't need to be in a straight line, you can turn in any direction as long as each letter touches the previous one. If it's in the dictionary, it's removed and you score points; the letters above fall down to fill the gap. Repeating an already-used word costs you 1 point. Every 5 words completes a level: the grid clears and the next one starts. You lose when the pieces stack up to the top.",
  faqTitle: "Frequently asked questions",
  faq: [
    { q: "Is Encastralo free?", a: "Yes, playing Encastralo is completely free. The app runs on ads, so you'll never have to pay to play." },
    { q: "Do I need to create an account?", a: "No. Your record and progress are saved automatically on this device — no sign-up or login required." },
    { q: "How do I level up?", a: "Every 5 words you find completes a level: the grid clears and the next one starts, with pieces falling faster each time." },
    { q: "What happens if I repeat an already-used word?", a: "You lose 1 point. Each word only scores points the first time you find it in that game." },
    { q: "When does the game end?", a: "You lose when the pieces stack up all the way to the top. You can start a new game as many times as you want." },
    { q: "What languages can I play in?", a: "Encastralo is available in Spanish, English and Portuguese. You can switch languages from the selector at the bottom of this screen." },
  ],

  scoreLabel: "Score",
  levelLabel: "Level",
  levelGoalLabel: (current, total) => `Goal: ${current}/${total} words`,
  levelUpTitle: (level) => `Level ${level}!`,
  levelReachedLabel: (level) => `Level reached: ${level}`,
  wordsListTitle: "Words found",
  wordsListEmpty: "Spell a word in the grid and select it",
  shareResultText: (level, score) => `I played Encastralo! Reached level ${level} with ${score} points 🧩`,
  shareRepeatPenaltyLabel: (points) => `-${points} points for repeated words`,
  shareRecordText: (score) => `My Encastralo record is ${score} points! Can you beat it? 🧩`,
  pauseButtonLabel: "Pause",
  resumeButtonLabel: "Resume",
  pausedOverlayTitle: "⏸ Paused",
  errorNotInDictionary: "That word isn't in my dictionary.",
  errorAlreadyUsed: (word) => `You already used "${word}" (-1 point).`,
  gameOverTitle: "The grid filled up!",
  gameOverBody: (score) => `You finished with ${score} points.`,
  playAgainButton: "Play again",
  backToHomeButton: "Back to home",
  continueWithAdButton: "Watch an ad and keep playing",
  rewardedAdConfirmButton: "Claim reward",
  rewardedAdSkipButton: "Close",
  rewardedAdWaitLabel: (seconds) => `Wait ${seconds}s...`,
};

const pt: Translation = {
  appName: "Encastralo",
  drawerHome: "Início",
  drawerPlay: "Jogar",
  privacyPolicyLabel: "Política de Privacidade",
  language: "Idioma",

  tagline: "encaixe · forme · pontue",
  greetingMorning: "Bom dia ☀️",
  greetingAfternoon: "Boa tarde 🌤️",
  greetingEvening: "Boa noite 🌙",
  daysWithoutPlayingMessage: (days) => `faz ${days} dias que você não joga`,
  readyToPlay: "Pronto para jogar Encastralo?",
  playButton: "JOGAR",
  recordTitle: "Recorde",
  recordEmptyBody: "Você ainda não jogou nenhuma partida.",
  recordScoreCaption: (score) => `${score} pontos`,
  recordWordsCaption: (n) => `Mais palavras em uma partida: ${n}`,
  recordLongestWordCaption: (word) => `Palavra mais longa: ${word} (${word.length} letras)`,
  removeAdsButton: "Remover anúncios",
  removeAdsButtonBuying: "Redirecionando para o MercadoPago...",
  whatIsTitle: "O que é o Encastralo?",
  whatIsBody: "Encastralo é um Tetris de letras. Cada peça cai com uma letra por quadrado, e ao se encaixar sobre as outras vai formando um caça-palavras. Diferente do Tetris clássico, as linhas completas não somem sozinhas: você precisa encontrar palavras deslizando o dedo pela grade para eliminá-las.",
  howToPlayTitle: "Como jogar?",
  howToPlayBody: "Mova e gire as peças com os botões abaixo para organizar as letras. Quando ver uma palavra formada na grade, deslize passando pelas letras: elas não precisam estar em linha reta, você pode virar em qualquer direção contanto que cada letra toque a anterior. Se existir no dicionário, ela é removida e você ganha pontos; as letras de cima caem para ocupar o lugar. Repetir uma palavra já usada tira 1 ponto. A cada 5 palavras se completa um nível: a grade esvazia e começa o próximo. Você perde quando as peças chegam até o topo.",
  faqTitle: "Perguntas frequentes",
  faq: [
    { q: "O Encastralo é grátis?", a: "Sim, jogar Encastralo é totalmente grátis. O app se sustenta com publicidade, você nunca vai precisar pagar para jogar." },
    { q: "Preciso criar uma conta?", a: "Não. Seu recorde e seu progresso são salvos automaticamente neste dispositivo, não precisa se cadastrar nem fazer login." },
    { q: "Como eu subo de nível?", a: "A cada 5 palavras que você encontra, completa um nível: a grade esvazia e começa o próximo, com as peças caindo cada vez mais rápido." },
    { q: "O que acontece se eu repetir uma palavra já usada?", a: "Você perde 1 ponto. Cada palavra só soma pontos na primeira vez que você a encontra naquela partida." },
    { q: "Quando a partida termina?", a: "Você perde quando as peças se empilham até o topo. Pode jogar de novo quantas vezes quiser." },
    { q: "Em quais idiomas posso jogar?", a: "O Encastralo está disponível em espanhol, inglês e português. Você pode trocar o idioma no seletor na parte de baixo desta tela." },
  ],

  scoreLabel: "Pontos",
  levelLabel: "Nível",
  levelGoalLabel: (current, total) => `Objetivo: ${current}/${total} palavras`,
  levelUpTitle: (level) => `Nível ${level}!`,
  levelReachedLabel: (level) => `Nível alcançado: ${level}`,
  wordsListTitle: "Palavras encontradas",
  wordsListEmpty: "Forme uma palavra na grade e selecione",
  shareResultText: (level, score) => `Joguei Encastralo! Cheguei ao nível ${level} com ${score} pontos 🧩`,
  shareRepeatPenaltyLabel: (points) => `-${points} pontos por palavras repetidas`,
  shareRecordText: (score) => `Meu recorde no Encastralo é de ${score} pontos! Consegue superar? 🧩`,
  pauseButtonLabel: "Pausar",
  resumeButtonLabel: "Retomar",
  pausedOverlayTitle: "⏸ Pausado",
  errorNotInDictionary: "Essa palavra não está no meu dicionário.",
  errorAlreadyUsed: (word) => `Você já usou "${word}" (-1 ponto).`,
  gameOverTitle: "A grade encheu!",
  gameOverBody: (score) => `Você terminou com ${score} pontos.`,
  playAgainButton: "Jogar de novo",
  backToHomeButton: "Voltar ao início",
  continueWithAdButton: "Assista a um anúncio e continue jogando",
  rewardedAdConfirmButton: "Resgatar recompensa",
  rewardedAdSkipButton: "Fechar",
  rewardedAdWaitLabel: (seconds) => `Espere ${seconds}s...`,
};

export const translations: Record<SupportedLanguage, Translation> = { es, en, pt };

export const availableLanguages: Array<{ code: SupportedLanguage; name: string; flag: string }> = [
  { code: "es", name: "Español", flag: "🇦🇷" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
];
