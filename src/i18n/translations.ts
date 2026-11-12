export type SupportedLanguage = "es" | "en" | "pt";

interface CategoryCopy {
  label: string;
  description: string;
}

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
  // La card de récord del Home es la de la variante "words" (el juego
  // principal) — estos dos solo se muestran cuando hay un récord guardado
  // con esos datos (ver utils/wordsRecordState.ts).
  recordWordsCaption: (n: number) => string;
  recordLongestWordCaption: (word: string) => string;
  shareRecordText: (score: number) => string;
  removeAdsButton: string;
  removeAdsButtonBuying: string;
  whatIsTitle: string;
  whatIsBody: string;
  howToPlayTitle: string;
  howToPlayBody: string;
  faqTitle: string;
  faq: { q: string; a: string }[];

  categoriesTitle: string;
  categories: {
    numbers: CategoryCopy;
    words: CategoryCopy;
    fruits: CategoryCopy;
  };
  bestScoreCaption: (score: number) => string;
  noScoreYetCaption: string;

  // Game
  // Solo se ve un instante al entrar a la variante "words" (ver game.tsx:
  // import() dinámico del diccionario) — números/frutas no la necesitan.
  loadingLabel: string;
  scoreLabel: string;
  bestLabel: string;
  trayTitle: string;
  // Solo la variante "words" muestra esta lista (ver FoundWordsList en
  // game.tsx) — números y frutas no acumulan un historial de la partida.
  wordsListTitle: string;
  wordsListEmpty: string;
  // Metas (ver GoalsCard) — por largo de palabra en "words", por suma
  // lograda en "numbers". Mismo título compartido entre las dos.
  goalsTitle: string;
  wordGoalNext: (letters: number) => string;
  wordGoalsComplete: string;
  numberGoalNext: (sum: number) => string;
  numberGoalsComplete: string;
  fruitGoalNext: (count: number) => string;
  fruitGoalsComplete: string;
  gameOverTitle: string;
  gameOverBody: (score: number) => string;
  newBestLabel: string;
  playAgainButton: string;
  backToHomeButton: string;
  // Reloj / pausa / anti-duplicados (ver game.tsx).
  pauseButtonLabel: string;
  resumeButtonLabel: string;
  pausedOverlayTitle: string;
  duplicateWordMessage: (word: string) => string;
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

  tagline: "encastrá · recorré · sumá puntos",
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
  shareRecordText: (score) => `¡Mi récord en Encastralo es de ${score} puntos! ¿Podés superarlo? 🧩`,
  removeAdsButton: "Sacar los anuncios",
  removeAdsButtonBuying: "Redirigiendo a MercadoPago...",
  whatIsTitle: "¿Qué es Encastralo?",
  whatIsBody: "Encastralo es un rompecabezas de piezas y recorridos: arrastrás piezas a una grilla de 8x8 y, cuando se forma un grupo de casillas que cumple la regla de la variante elegida, lo recorrés con el dedo para borrarlo y sumar puntos. Hay tres formas de jugar: sumá 10, formá palabras, o juntá 3 frutas iguales.",
  howToPlayTitle: "¿Cómo jugar?",
  howToPlayBody: "Arrastrá las piezas de la bandeja a la grilla (tocá una pieza para rotarla antes de soltarla). Para borrar casillas, apoyá el dedo sobre la grilla y recorré casillas vecinas —también en diagonal— sin soltar: en Sumar 10 tenés que juntar números que sumen exactamente 10, en Formar palabras tenés que armar una palabra válida, y en Frutas tenés que juntar 3 o más frutas iguales conectadas. Perdés cuando ninguna pieza de la bandeja entra en la grilla y no queda ningún recorrido posible para borrar.",
  faqTitle: "Preguntas frecuentes",
  faq: [
    { q: "¿Encastralo es gratis?", a: "Sí, jugar a Encastralo es completamente gratis. La app se sostiene con publicidad, nunca vas a tener que pagar para jugar." },
    { q: "¿Necesito crear una cuenta?", a: "No. Tu récord y tu progreso se guardan en este dispositivo automáticamente, no hace falta registrarse ni iniciar sesión." },
    { q: "¿Cuál es la diferencia entre las 3 formas de jugar?", a: "Sumar 10 pide números que sumen 10, Formar palabras pide armar una palabra válida, y Frutas pide juntar 3 o más frutas iguales conectadas. El resto de la mecánica (arrastrar piezas, recorrer casillas) es la misma en las tres." },
    { q: "¿Cómo sumo puntos?", a: "Sumás puntos cada vez que encastrás una pieza en la grilla, y otra vez cada vez que borrás un recorrido válido de casillas." },
    { q: "¿Cuándo termina la partida?", a: "Perdés cuando ninguna de las piezas de la bandeja entra en la grilla y, además, no queda ningún recorrido posible para borrar. Podés jugar de nuevo las veces que quieras." },
    { q: "¿En qué idiomas puedo jugar?", a: "Encastralo está disponible en español, inglés y portugués. Podés cambiar el idioma desde el selector de la parte de abajo de esta pantalla." },
  ],

  categoriesTitle: "Formas de jugar",
  categories: {
    numbers: { label: "Sumar 10", description: "Juntá números contiguos que sumen exactamente 10." },
    words: { label: "Formar palabras", description: "Recorré letras contiguas y armá una palabra válida." },
    fruits: { label: "Frutas", description: "Juntá 3 o más frutas iguales conectadas." },
  },
  bestScoreCaption: (score) => `Mejor: ${score}`,
  noScoreYetCaption: "Sin jugar",

  loadingLabel: "Cargando...",
  scoreLabel: "Puntos",
  bestLabel: "Récord",
  trayTitle: "Próximas piezas (tocala para rotarla)",
  wordsListTitle: "Palabras encontradas",
  wordsListEmpty: "Formá una palabra en la grilla y recorré sus letras",
  goalsTitle: "Metas",
  wordGoalNext: (letters) => `Meta: formá una palabra de ${letters} letras o más`,
  wordGoalsComplete: "¡Completaste todas las metas!",
  numberGoalNext: (sum) => `Meta: lográ una suma de ${sum} o más`,
  numberGoalsComplete: "¡Completaste todas las metas!",
  fruitGoalNext: (count) => `Meta: seleccioná ${count} frutas iguales`,
  fruitGoalsComplete: "¡Completaste todas las metas!",
  gameOverTitle: "¡Se acabó el tiempo!",
  gameOverBody: (score) => `Terminaste con ${score} puntos.`,
  newBestLabel: "¡Nuevo récord!",
  playAgainButton: "Jugar de nuevo",
  backToHomeButton: "Volver al inicio",
  pauseButtonLabel: "Pausar",
  resumeButtonLabel: "Reanudar",
  pausedOverlayTitle: "⏸ Pausado",
  duplicateWordMessage: (word) => `Ya usaste <b>${word}</b> (-5s)`,
  continueWithAdButton: "Mirá un anuncio y sumá 5:00",
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

  tagline: "fit · trace · score",
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
  shareRecordText: (score) => `My Encastralo record is ${score} points! Can you beat it? 🧩`,
  removeAdsButton: "Remove ads",
  removeAdsButtonBuying: "Redirecting to MercadoPago...",
  whatIsTitle: "What is Encastralo?",
  whatIsBody: "Encastralo is a puzzle about pieces and paths: you drag pieces onto an 8x8 grid, and whenever a group of cells matches the rule of the variant you picked, you trace it with your finger to clear it and score points. There are three ways to play: add up to 10, spell words, or match 3 of the same fruit.",
  howToPlayTitle: "How to play?",
  howToPlayBody: "Drag pieces from the tray onto the grid (tap a piece to rotate it before dropping it). To clear cells, press down on the grid and trace through neighboring cells — diagonals count too — without lifting your finger: in Sum to 10 you need numbers that add up to exactly 10, in Spell words you need to form a valid word, and in Fruits you need 3 or more connected cells of the same fruit. You lose when none of the tray pieces fit on the grid and there's no clearable path left.",
  faqTitle: "Frequently asked questions",
  faq: [
    { q: "Is Encastralo free?", a: "Yes, playing Encastralo is completely free. The app runs on ads, so you'll never have to pay to play." },
    { q: "Do I need to create an account?", a: "No. Your record and progress are saved automatically on this device — no sign-up or login required." },
    { q: "What's the difference between the 3 ways to play?", a: "Sum to 10 asks for numbers that add up to 10, Spell words asks you to form a valid word, and Fruits asks you to match 3 or more connected cells of the same fruit. The rest of the mechanic (dragging pieces, tracing cells) is the same across all three." },
    { q: "How do I score points?", a: "You score points every time you fit a piece onto the grid, and again every time you clear a valid path of cells." },
    { q: "When does the game end?", a: "You lose when none of the tray pieces fit on the grid and there's no clearable path left either. You can start a new game as many times as you want." },
    { q: "What languages can I play in?", a: "Encastralo is available in Spanish, English and Portuguese. You can switch languages from the selector at the bottom of this screen." },
  ],

  categoriesTitle: "Ways to play",
  categories: {
    numbers: { label: "Sum to 10", description: "Match connected numbers that add up to exactly 10." },
    words: { label: "Spell words", description: "Trace connected letters to spell a valid word." },
    fruits: { label: "Fruits", description: "Match 3 or more connected cells of the same fruit." },
  },
  bestScoreCaption: (score) => `Best: ${score}`,
  noScoreYetCaption: "Not played yet",

  loadingLabel: "Loading...",
  scoreLabel: "Score",
  bestLabel: "Best",
  trayTitle: "Next pieces (tap to rotate)",
  wordsListTitle: "Words found",
  wordsListEmpty: "Spell a word on the grid and trace its letters",
  goalsTitle: "Goals",
  wordGoalNext: (letters) => `Goal: spell a word of ${letters} letters or more`,
  wordGoalsComplete: "You completed all the goals!",
  numberGoalNext: (sum) => `Goal: reach a sum of ${sum} or more`,
  numberGoalsComplete: "You completed all the goals!",
  fruitGoalNext: (count) => `Goal: select ${count} matching fruits`,
  fruitGoalsComplete: "You completed all the goals!",
  gameOverTitle: "Time's up!",
  gameOverBody: (score) => `You finished with ${score} points.`,
  newBestLabel: "New best score!",
  playAgainButton: "Play again",
  backToHomeButton: "Back to home",
  pauseButtonLabel: "Pause",
  resumeButtonLabel: "Resume",
  pausedOverlayTitle: "⏸ Paused",
  duplicateWordMessage: (word) => `You already used <b>${word}</b> (-5s)`,
  continueWithAdButton: "Watch an ad and add 5:00",
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

  tagline: "encaixe · percorra · pontue",
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
  shareRecordText: (score) => `Meu recorde no Encastralo é de ${score} pontos! Consegue superar? 🧩`,
  removeAdsButton: "Remover anúncios",
  removeAdsButtonBuying: "Redirecionando para o MercadoPago...",
  whatIsTitle: "O que é o Encastralo?",
  whatIsBody: "Encastralo é um quebra-cabeça de peças e percursos: você arrasta peças para uma grade de 8x8 e, quando um grupo de casas cumpre a regra da variante escolhida, você o percorre com o dedo para apagá-lo e ganhar pontos. Há três formas de jogar: some até 10, forme palavras, ou junte 3 frutas iguais.",
  howToPlayTitle: "Como jogar?",
  howToPlayBody: "Arraste as peças da bandeja para a grade (toque em uma peça para girá-la antes de soltar). Para apagar casas, apoie o dedo na grade e percorra casas vizinhas —também na diagonal— sem soltar: em Somar 10 você precisa juntar números que somem exatamente 10, em Formar palavras você precisa formar uma palavra válida, e em Frutas você precisa juntar 3 ou mais frutas iguais conectadas. Você perde quando nenhuma peça da bandeja entra na grade e não há mais nenhum percurso possível para apagar.",
  faqTitle: "Perguntas frequentes",
  faq: [
    { q: "O Encastralo é grátis?", a: "Sim, jogar Encastralo é totalmente grátis. O app se sustenta com publicidade, você nunca vai precisar pagar para jogar." },
    { q: "Preciso criar uma conta?", a: "Não. Seu recorde e seu progresso são salvos automaticamente neste dispositivo, não precisa se cadastrar nem fazer login." },
    { q: "Qual é a diferença entre as 3 formas de jogar?", a: "Somar 10 pede números que somem 10, Formar palavras pede uma palavra válida, e Frutas pede 3 ou mais frutas iguais conectadas. O resto da mecânica (arrastar peças, percorrer casas) é igual nas três." },
    { q: "Como eu ganho pontos?", a: "Você ganha pontos a cada peça encaixada na grade, e de novo a cada percurso válido de casas apagado." },
    { q: "Quando a partida termina?", a: "Você perde quando nenhuma peça da bandeja entra na grade e também não há mais nenhum percurso possível para apagar. Pode jogar de novo quantas vezes quiser." },
    { q: "Em quais idiomas posso jogar?", a: "O Encastralo está disponível em espanhol, inglês e português. Você pode trocar o idioma no seletor na parte de baixo desta tela." },
  ],

  categoriesTitle: "Formas de jogar",
  categories: {
    numbers: { label: "Somar 10", description: "Junte números conectados que somem exatamente 10." },
    words: { label: "Formar palavras", description: "Percorra letras conectadas e forme uma palavra válida." },
    fruits: { label: "Frutas", description: "Junte 3 ou mais frutas iguais conectadas." },
  },
  bestScoreCaption: (score) => `Melhor: ${score}`,
  noScoreYetCaption: "Ainda não jogou",

  loadingLabel: "Carregando...",
  scoreLabel: "Pontos",
  bestLabel: "Recorde",
  trayTitle: "Próximas peças (toque para girar)",
  wordsListTitle: "Palavras encontradas",
  wordsListEmpty: "Forme uma palavra na grade e percorra suas letras",
  goalsTitle: "Metas",
  wordGoalNext: (letters) => `Meta: forme uma palavra de ${letters} letras ou mais`,
  wordGoalsComplete: "Você completou todas as metas!",
  numberGoalNext: (sum) => `Meta: alcance uma soma de ${sum} ou mais`,
  numberGoalsComplete: "Você completou todas as metas!",
  fruitGoalNext: (count) => `Meta: selecione ${count} frutas iguais`,
  fruitGoalsComplete: "Você completou todas as metas!",
  gameOverTitle: "O tempo acabou!",
  gameOverBody: (score) => `Você terminou com ${score} pontos.`,
  newBestLabel: "Novo recorde!",
  playAgainButton: "Jogar de novo",
  backToHomeButton: "Voltar ao início",
  pauseButtonLabel: "Pausar",
  resumeButtonLabel: "Retomar",
  pausedOverlayTitle: "⏸ Pausado",
  duplicateWordMessage: (word) => `Você já usou <b>${word}</b> (-5s)`,
  continueWithAdButton: "Assista a um anúncio e some 5:00",
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
