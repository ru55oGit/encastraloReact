import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Layout from "../components/Layout";
import Board from "../components/Board";
import Tray from "../components/Tray";
import DragLayer from "../components/DragLayer";
import PathBadge from "../components/PathBadge";
import FoundWordsList, { FoundWordEntry } from "../components/FoundWordsList";
import GoalsCard from "../components/GoalsCard";
import HowToPlayCollapse from "../components/HowToPlayCollapse";
import HouseAdBanner from "../ads/HouseAdBanner";
import { useGame } from "../hooks/useGame";
import { usePieceDrag } from "../hooks/usePieceDrag";
import { usePathSelection } from "../hooks/usePathSelection";
import { resolveVariantEngine } from "../game/variants";
import { withAllowedSums } from "../game/variants/numbers";
import {
  WORD_GOAL_THRESHOLDS,
  WORD_GOAL_BONUS_PER_LETTER,
  NUMBER_GOAL_THRESHOLDS,
  NUMBER_GOAL_BONUS_PER_SUM,
  MIN_TARGET_SUM,
  MAX_TARGET_SUM,
  FRUIT_GOAL_THRESHOLDS,
  FRUIT_GOAL_BONUS_PER_FRUIT,
} from "../game/constants";
import { Path, Variant, VariantEngine } from "../game/types";
import { useLanguage } from "../i18n/LanguageContext";
import { track } from "../lib/analytics";
import { recordLastPlayed } from "../utils/lastPlayedState";
import { maybeSaveWordsRecord } from "../utils/wordsRecordState";
import { playErrorSound, playSuccessSound } from "../utils/sound";
import { clearInProgressGame, InProgressGame, loadInProgressGame, saveInProgressGame } from "../utils/inProgressGameState";

const ACCENT = "#e74c3c";

const VARIANT_EMOJI: Record<Variant, string> = {
  numbers: "🔢",
  words: "🔤",
  fruits: "🍎",
};

// "words" es el juego principal — el botón Jugar del Home no manda
// ?variant, así que cualquier entrada sin variante reconocible cae acá.
function parseVariant(value: string | null): Variant {
  return value === "numbers" || value === "fruits" ? value : "words";
}

export default function Game() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, currentLanguage } = useLanguage();
  const [initialVariant] = useState(() => parseVariant(searchParams.get("variant")));
  const [engine, setEngine] = useState<VariantEngine | null>(null);
  // Lectura síncrona (localStorage) — si hay una partida sin terminar de
  // esta variante Y este idioma, se retoma en vez de arrancar una nueva.
  // Cambiar de idioma no debe resumir una partida vieja en otro idioma
  // (en "words" la grilla tendría letras de un diccionario distinto).
  const [savedGame] = useState(() => loadInProgressGame(initialVariant, currentLanguage));

  // La variante "words" carga su diccionario (ver game/variants/index.ts)
  // vía import() dinámico — las otras dos resuelven en el mismo tick, pero
  // igual pasan por acá para que el resto del componente no tenga que
  // distinguir casos. El gate evita llamar a los hooks de abajo (useGame,
  // usePieceDrag...) antes de tener un engine real.
  useEffect(() => {
    let cancelled = false;
    resolveVariantEngine(initialVariant, currentLanguage).then((loaded) => {
      if (!cancelled) setEngine(loaded);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!engine) {
    return (
      <Layout onBack={() => navigate("/")}>
        <Box sx={{ width: "100%", display: "flex", justifyContent: "center", py: 6 }}>
          <Typography sx={{ color: "#fff", fontWeight: 700 }}>{t.loadingLabel}</Typography>
        </Box>
      </Layout>
    );
  }

  return <GamePlaying variant={initialVariant} engine={engine} savedGame={savedGame} />;
}

interface GamePlayingProps {
  variant: Variant;
  engine: VariantEngine;
  savedGame: InProgressGame | null;
}

function GamePlaying({ variant, engine, savedGame }: GamePlayingProps) {
  const navigate = useNavigate();
  const { t, currentLanguage } = useLanguage();

  const boardRef = useRef<HTMLDivElement>(null);

  // Popup de error: mismo estilo que el resto de los juegos del hub (ver
  // game.tsx de letrisReact) — un pill negro semitransparente encima del
  // tablero, no el Toast con borde/paleta propios de la POC original.
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Solo la variante "words" acumula este historial (ver FoundWordsList) —
  // números y frutas quedan como estaban, sin esta lista.
  const [foundWords, setFoundWords] = useState<FoundWordEntry[]>(() => savedGame?.foundWords ?? []);
  // "numbers" arranca pidiendo sumar 10. Cada vez que se borra algo (sea
  // la suma "piso" actual o ya la siguiente), el piso sube en 1 — nunca
  // salta más de un paso, a diferencia de las metas de palabras. La
  // ventana habilitada en cada momento es siempre {piso, piso+1} (ver
  // withAllowedSums en game/variants/numbers.ts), salvo en el techo (25),
  // donde queda fija en {25}.
  const [numberFloor, setNumberFloor] = useState(() => savedGame?.numberFloor ?? MIN_TARGET_SUM);
  const numberWindowUpper = Math.min(numberFloor + 1, MAX_TARGET_SUM);
  const numberWindow = numberFloor === numberWindowUpper ? [numberFloor] : [numberFloor, numberWindowUpper];

  // A diferencia de números, en frutas cualquier cantidad conectada (>=3)
  // se puede borrar siempre — mismo criterio que palabras ("al menos N",
  // ver fruitFloor más abajo), no un candado sobre la mecánica.
  const [fruitFloor, setFruitFloor] = useState(() => savedGame?.fruitFloor ?? 0);

  const activeEngine = useMemo(() => {
    if (variant === "numbers") return withAllowedSums(numberWindow);
    return engine;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, engine, numberFloor]);

  const { state, placePiece, rotateTrayPiece, clearPath, restart } = useGame(variant, activeEngine, savedGame ?? undefined);

  // Guarda la partida en curso después de cualquier cambio relevante, para
  // poder retomarla si el jugador se va y vuelve — y la borra apenas
  // termina (no tiene sentido "retomar" una partida ya perdida).
  useEffect(() => {
    if (state.phase === "gameover") {
      clearInProgressGame(state.variant, currentLanguage);
      return;
    }
    saveInProgressGame(state.variant, currentLanguage, {
      grid: state.grid,
      colorGrid: state.colorGrid,
      tray: state.tray,
      score: state.score,
      foundWords,
      numberFloor,
      fruitFloor,
    });
  }, [state.phase, state.variant, state.grid, state.colorGrid, state.tray, state.score, foundWords, numberFloor, fruitFloor, currentLanguage]);

  const initialBestRef = useRef(state.best);
  const gameStartedAtRef = useRef(Date.now());
  const trackedGameOverRef = useRef(false);

  useEffect(() => {
    recordLastPlayed();
    // Retomar una partida guardada no es un "inicio" nuevo — no corresponde
    // trackearlo de nuevo (mismo criterio que el resto del hub).
    if (!savedGame) track("game_start", { variant });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state.phase === "gameover" && !trackedGameOverRef.current) {
      trackedGameOverRef.current = true;
      const durationSec = Math.round((Date.now() - gameStartedAtRef.current) / 1000);
      track("game_over", { variant: state.variant, score: state.score, duration_sec: durationSec });
      // La card de "Récord" del Home (ver Home.tsx) muestra la MEJOR
      // partida de palabras completa (puntaje + palabras encontradas +
      // más larga), no solo el número que ya guarda storage.ts.
      if (state.variant === "words") {
        maybeSaveWordsRecord(state.score, foundWords.map((entry) => entry.word));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.variant, state.score]);

  function showError(message: string) {
    setErrorMsg(message);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => setErrorMsg(null), 1300);
  }

  const handleResolved = useCallback(
    (path: Path, valid: boolean, points: number, reason?: string) => {
      if (!valid) {
        playErrorSound();
        if (reason) showError(reason);
        return;
      }
      playSuccessSound();
      if (state.variant === "words") {
        const result = activeEngine.resolvePath(state.grid, path);
        if (result.successLabel) {
          const word = result.successLabel;
          setFoundWords((prev) => [...prev, { word, points }]);

          // Bonus de metas: cada umbral de WORD_GOAL_THRESHOLDS que esta
          // palabra cruza por primera vez (ver game/constants.ts — "N
          // letras o más", no "exactamente N") suma 100*N puntos extra. Si
          // la primera palabra ya tiene 6 letras, cruza las metas de 3, 4,
          // 5 y 6 de una sola vez.
          const prevLongest = foundWords.reduce((max, entry) => Math.max(max, entry.word.length), 0);
          const newlyCrossed = WORD_GOAL_THRESHOLDS.filter((t) => prevLongest < t && word.length >= t);
          const bonus = newlyCrossed.reduce((sum, t) => sum + t * WORD_GOAL_BONUS_PER_LETTER, 0);
          clearPath(path, points + bonus);
          return;
        }
      }
      if (state.variant === "numbers") {
        const result = activeEngine.resolvePath(state.grid, path);
        const sum = result.successLabel ? Number(result.successLabel) : null;
        if (sum !== null) {
          // Como la ventana activa es siempre {piso, piso+1}, esta suma
          // solo puede cruzar como mucho UN umbral nuevo (el de piso+1,
          // si fue esa la opción elegida en vez de la fácil).
          const newlyCrossed = NUMBER_GOAL_THRESHOLDS.filter((t) => numberFloor < t && sum >= t);
          const bonus = newlyCrossed.reduce((acc, t) => acc + t * NUMBER_GOAL_BONUS_PER_SUM, 0);
          setNumberFloor((prev) => Math.min(prev + 1, MAX_TARGET_SUM));
          clearPath(path, points + bonus);
          return;
        }
      }
      if (state.variant === "fruits") {
        const result = activeEngine.resolvePath(state.grid, path);
        const count = result.successLabel ? Number(result.successLabel) : null;
        if (count !== null) {
          // Igual que palabras: "al menos N", no una ventana estricta — si
          // el primer grupo que formás ya tiene 6 frutas, cruza de una las
          // metas de 4, 5 y 6.
          const newlyCrossed = FRUIT_GOAL_THRESHOLDS.filter((t) => fruitFloor < t && count >= t);
          const bonus = newlyCrossed.reduce((acc, t) => acc + t * FRUIT_GOAL_BONUS_PER_FRUIT, 0);
          setFruitFloor((prev) => Math.max(prev, count));
          clearPath(path, points + bonus);
          return;
        }
      }
      clearPath(path, points);
    },
    [clearPath, activeEngine, state.grid, state.variant, foundWords, numberFloor, fruitFloor],
  );

  const { drag, ghost, draggingIndex, isDragging, startDrag } = usePieceDrag({
    boardRef,
    grid: state.grid,
    onRotate: rotateTrayPiece,
    onPlace: placePiece,
  });

  const { path, badge, handlePointerDown } = usePathSelection({
    boardRef,
    grid: state.grid,
    engine: activeEngine,
    isDraggingPiece: isDragging,
    onResolved: handleResolved,
  });

  function handleRestart() {
    trackedGameOverRef.current = false;
    gameStartedAtRef.current = Date.now();
    initialBestRef.current = state.best;
    setFoundWords([]);
    setNumberFloor(MIN_TARGET_SUM);
    setFruitFloor(0);
    restart();
    track("game_start", { variant: state.variant });
  }

  if (state.phase === "gameover") {
    const isNewBest = state.score > 0 && state.score >= initialBestRef.current;
    return (
      <Layout onBack={() => navigate("/")}>
        <Box sx={{ width: "100%", px: { xs: 1.5, md: 2 }, pb: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ borderRadius: "16px", backgroundColor: "#fff", p: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontSize: 52 }}>{VARIANT_EMOJI[state.variant]}</Typography>
            <Typography sx={{ fontFamily: "Lobster, cursive", fontSize: 26, color: "#222", textAlign: "center" }}>
              {t.gameOverTitle}
            </Typography>
            <Typography sx={{ color: "#666", fontSize: 16 }}>{t.gameOverBody(state.score)}</Typography>
            {isNewBest && (
              <Typography sx={{ color: ACCENT, fontWeight: 800, fontSize: 15 }}>{t.newBestLabel}</Typography>
            )}
          </Box>

          <Button onClick={handleRestart} variant="contained" size="large" sx={{
            backgroundColor: "#fff", color: ACCENT, fontWeight: 800, fontSize: 18,
            py: 1.6, borderRadius: 999, textTransform: "none",
            boxShadow: "0 0 0 4px rgba(255,255,255,0.35), 0 10px 24px rgba(0,0,0,0.4)",
          }}>
            {t.playAgainButton}
          </Button>
          <Button onClick={() => navigate("/")} sx={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>
            {t.backToHomeButton}
          </Button>

          <HouseAdBanner slot="encastralo-gameover-banner" gameSlug="encastralo" locale={currentLanguage} />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout onBack={() => navigate("/")}>
      <Box sx={{ width: "100%", px: { xs: 1.5, md: 2 }, pb: 2, display: "flex", flexDirection: "column" }}>
        <Box sx={{
          display: "flex", alignItems: "center", gap: 1,
          backgroundColor: "rgba(0,0,0,0.18)", borderRadius: "16px", px: 2, py: 1.25, mb: 2,
        }}>
          <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>
            {t.scoreLabel}: {state.score}
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.85)", fontWeight: 700, fontSize: 13, ml: "auto" }}>
            {t.bestLabel}: {state.best}
          </Typography>
        </Box>

        <Box sx={{ position: "relative", display: "flex", justifyContent: "center", borderRadius: "16px", overflow: "hidden", backgroundColor: "#fff", p: 1, mb: 1 }}>
          <Board
            boardRef={boardRef}
            grid={state.grid}
            colorGrid={state.colorGrid}
            engine={activeEngine}
            path={path}
            ghostCells={ghost}
            clearingCells={null}
            onPointerDown={handlePointerDown}
            flatPalette={state.variant === "words"}
          />

          {errorMsg && (
            <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, px: 2 }}>
              <Typography
                sx={{ color: "#fff", backgroundColor: "rgba(0,0,0,0.8)", px: 2, py: 1, borderRadius: 999, fontSize: 14, fontWeight: 700, textAlign: "center" }}
                // errorMsg puede traer <b> (ver reasonIfInvalid en los
                // VariantEngine) — contenido propio, no de usuarios.
                dangerouslySetInnerHTML={{ __html: errorMsg }}
              />
            </Box>
          )}
        </Box>

        {state.variant === "words" && (
          <GoalsCard
            title={t.goalsTitle}
            thresholds={WORD_GOAL_THRESHOLDS}
            achieved={foundWords.reduce((max, entry) => Math.max(max, entry.word.length), 0)}
            nextGoalLabel={t.wordGoalNext}
            completeLabel={t.wordGoalsComplete}
          />
        )}

        {state.variant === "numbers" && (
          <GoalsCard
            title={t.goalsTitle}
            thresholds={NUMBER_GOAL_THRESHOLDS}
            achieved={numberFloor}
            nextGoalLabel={t.numberGoalNext}
            completeLabel={t.numberGoalsComplete}
          />
        )}

        {state.variant === "fruits" && (
          <GoalsCard
            title={t.goalsTitle}
            thresholds={FRUIT_GOAL_THRESHOLDS}
            achieved={fruitFloor}
            nextGoalLabel={t.fruitGoalNext}
            completeLabel={t.fruitGoalsComplete}
          />
        )}

        <Box sx={{ borderRadius: "16px", overflow: "hidden", backgroundColor: "#fff", p: 1, mb: 1 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", px: 0.5, pt: 0.5 }}>
            {t.trayTitle}
          </Typography>
          <Tray
            tray={state.tray}
            grid={state.grid}
            engine={activeEngine}
            draggingIndex={draggingIndex}
            onPieceDown={startDrag}
          />
        </Box>

        {state.variant === "words" && (
          <Box sx={{ mb: 1 }}>
            <FoundWordsList title={t.wordsListTitle} emptyLabel={t.wordsListEmpty} words={foundWords} />
          </Box>
        )}

        <Box sx={{ display: "flex", justifyContent: "center", my: 1 }}>
          <HouseAdBanner slot="encastralo-game-banner" gameSlug="encastralo" locale={currentLanguage} />
        </Box>

        <HowToPlayCollapse title={t.howToPlayTitle} body={activeEngine.hint} />
      </Box>

      <DragLayer drag={drag} engine={activeEngine} />
      <PathBadge badge={badge} />
    </Layout>
  );
}
