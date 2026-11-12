import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import Layout from "../components/Layout";
import Board from "../components/Board";
import Tray from "../components/Tray";
import DragLayer from "../components/DragLayer";
import PathBadge from "../components/PathBadge";
import FoundWordsList, { FoundWordEntry } from "../components/FoundWordsList";
import GoalsCard from "../components/GoalsCard";
import HowToPlayCollapse from "../components/HowToPlayCollapse";
import HouseAdBanner from "../ads/HouseAdBanner";
import RewardedAdModal from "../ads/RewardedAdModal";
import { useRewardedAd } from "../ads/useRewardedAd";
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
  NUMBER_GOAL_BONUS_SECONDS,
  FRUIT_GOAL_THRESHOLDS,
  FRUIT_GOAL_BONUS_PER_FRUIT,
  FRUIT_GOAL_BONUS_SECONDS,
  MIN_TARGET_SUM,
  GAME_DURATION_MS,
  REWARDED_TIME_BONUS_MS,
  DUPLICATE_WORD_PENALTY_MS,
  rollingGoalWindow,
  crossedThresholds,
  wordGoalBonusSeconds,
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

function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
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

  // "+Xs" centrado cuando se cumple una meta — sin esto el bonus de tiempo
  // pasaba desapercibido (solo se notaba mirando fijo el reloj).
  const [timeBonusMsg, setTimeBonusMsg] = useState<string | null>(null);
  const timeBonusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Solo la variante "words" acumula este historial (ver FoundWordsList) —
  // también es la base del chequeo anti-duplicados.
  const [foundWords, setFoundWords] = useState<FoundWordEntry[]>(() => savedGame?.foundWords ?? []);
  // "numbers" arranca pidiendo sumar 10. Cada vez que se borra algo (sea
  // la suma "piso" actual o ya la siguiente), el piso sube en 1 — nunca
  // salta más de un paso, a diferencia de las metas de palabras/frutas.
  // La ventana habilitada en cada momento es siempre {piso, piso+1} (ver
  // withAllowedSums en game/variants/numbers.ts). Sin techo: a diferencia
  // de antes, el piso nunca para de subir (ver rollingGoalWindow más abajo
  // para cómo se ve esto en la card de Metas).
  const [numberFloor, setNumberFloor] = useState(() => savedGame?.numberFloor ?? MIN_TARGET_SUM);
  const numberWindow = [numberFloor, numberFloor + 1];

  // A diferencia de números, en frutas cualquier cantidad conectada (>=3)
  // se puede borrar siempre — mismo criterio que palabras ("al menos N").
  // Tampoco tiene techo.
  const [fruitFloor, setFruitFloor] = useState(() => savedGame?.fruitFloor ?? 0);

  const activeEngine = useMemo(() => {
    if (variant === "numbers") return withAllowedSums(numberWindow);
    return engine;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, engine, numberFloor]);

  const { state, placePiece, rotateTrayPiece, clearPath, restart } = useGame(variant, activeEngine, savedGame ?? undefined);

  // --- Reloj ---
  // Perder ya no es "no entra ninguna pieza" (eso en la práctica casi no
  // pasa) — ahora es contrarreloj. Se guarda el tiempo restante en ms, no
  // una marca de tiempo absoluta: así, si el jugador se va y vuelve, el
  // reloj queda pausado mientras tanto en vez de descontarle ese rato.
  const [remainingMs, setRemainingMs] = useState(() => savedGame?.remainingMs ?? GAME_DURATION_MS);
  const [paused, setPaused] = useState(false);
  const lastTickRef = useRef(Date.now());
  const timeIsUp = remainingMs <= 0;
  const isOver = state.phase === "gameover" || timeIsUp;
  // Últimos 30s: el reloj pasa a rojo y "late" — sin esto el jugador no
  // registra que está jugando contrarreloj hasta que ya perdió.
  const timeCritical = remainingMs > 0 && remainingMs <= 30_000;
  const timeProgress = Math.max(0, Math.min(1, remainingMs / GAME_DURATION_MS));

  useEffect(() => {
    if (paused || isOver) return;
    lastTickRef.current = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTickRef.current;
      lastTickRef.current = now;
      setRemainingMs((prev) => Math.max(0, prev - elapsed));
    }, 1000);
    return () => clearInterval(id);
  }, [paused, isOver]);

  // Guarda la partida en curso después de cualquier cambio relevante, para
  // poder retomarla si el jugador se va y vuelve — y la borra apenas
  // termina (no tiene sentido "retomar" una partida ya perdida).
  useEffect(() => {
    if (isOver) {
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
      remainingMs,
    });
  }, [
    isOver,
    state.variant,
    state.grid,
    state.colorGrid,
    state.tray,
    state.score,
    foundWords,
    numberFloor,
    fruitFloor,
    remainingMs,
    currentLanguage,
  ]);

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
    if (isOver && !trackedGameOverRef.current) {
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
  }, [isOver, state.variant, state.score]);

  function showError(message: string) {
    setErrorMsg(message);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => setErrorMsg(null), 1300);
  }

  function showTimeBonus(seconds: number) {
    setTimeBonusMsg(`+${seconds}s`);
    if (timeBonusTimeoutRef.current) clearTimeout(timeBonusTimeoutRef.current);
    timeBonusTimeoutRef.current = setTimeout(() => setTimeBonusMsg(null), 1100);
  }

  const handleResolved = useCallback(
    (path: Path, valid: boolean, points: number, reason?: string) => {
      if (!valid) {
        playErrorSound();
        if (reason) showError(reason);
        return;
      }

      if (state.variant === "words") {
        const result = activeEngine.resolvePath(state.grid, path);
        const word = result.successLabel;
        if (word) {
          // Anti-duplicados: una palabra ya usada en esta partida no se
          // puede volver a cobrar — mensaje + penalidad de tiempo, el
          // camino queda sin borrar (igual que cualquier otro intento
          // inválido).
          if (foundWords.some((entry) => entry.word === word)) {
            playErrorSound();
            showError(t.duplicateWordMessage(word));
            setRemainingMs((prev) => Math.max(0, prev - DUPLICATE_WORD_PENALTY_MS));
            return;
          }

          playSuccessSound();
          setFoundWords((prev) => [...prev, { word, points }]);

          // Bonus de metas: cada umbral de WORD_GOAL_THRESHOLDS que esta
          // palabra cruza por primera vez (ver game/constants.ts — "N
          // letras o más", no "exactamente N") suma puntos Y segundos
          // extra. Si la primera palabra ya tiene 6 letras, cruza las
          // metas de 3, 4, 5 y 6 de una sola vez.
          const prevLongest = foundWords.reduce((max, entry) => Math.max(max, entry.word.length), 0);
          const newlyCrossed = WORD_GOAL_THRESHOLDS.filter((th) => prevLongest < th && word.length >= th);
          const pointBonus = newlyCrossed.reduce((sum, th) => sum + th * WORD_GOAL_BONUS_PER_LETTER, 0);
          const timeBonusSec = newlyCrossed.reduce((sum, th) => sum + wordGoalBonusSeconds(th), 0);
          if (timeBonusSec > 0) {
            setRemainingMs((prev) => prev + timeBonusSec * 1000);
            showTimeBonus(timeBonusSec);
          }
          clearPath(path, points + pointBonus);
          return;
        }
        playSuccessSound();
        clearPath(path, points);
        return;
      }

      playSuccessSound();

      if (state.variant === "numbers") {
        const result = activeEngine.resolvePath(state.grid, path);
        const sum = result.successLabel ? Number(result.successLabel) : null;
        if (sum !== null) {
          // Como la ventana activa es siempre {piso, piso+1}, esta suma
          // solo puede cruzar como mucho UN umbral nuevo.
          const newlyCrossed = crossedThresholds(numberFloor, sum, NUMBER_GOAL_THRESHOLDS[0]);
          const pointBonus = newlyCrossed.reduce((acc, v) => acc + v * NUMBER_GOAL_BONUS_PER_SUM, 0);
          const timeBonusSec = newlyCrossed.length * NUMBER_GOAL_BONUS_SECONDS;
          if (timeBonusSec > 0) {
            setRemainingMs((prev) => prev + timeBonusSec * 1000);
            showTimeBonus(timeBonusSec);
          }
          setNumberFloor((prev) => prev + 1);
          clearPath(path, points + pointBonus);
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
          const newlyCrossed = crossedThresholds(fruitFloor, count, FRUIT_GOAL_THRESHOLDS[0]);
          const pointBonus = newlyCrossed.reduce((acc, v) => acc + v * FRUIT_GOAL_BONUS_PER_FRUIT, 0);
          const timeBonusSec = newlyCrossed.length * FRUIT_GOAL_BONUS_SECONDS;
          if (timeBonusSec > 0) {
            setRemainingMs((prev) => prev + timeBonusSec * 1000);
            showTimeBonus(timeBonusSec);
          }
          setFruitFloor((prev) => Math.max(prev, count));
          clearPath(path, points + pointBonus);
          return;
        }
      }

      clearPath(path, points);
    },
    [clearPath, activeEngine, state.grid, state.variant, foundWords, numberFloor, fruitFloor, t],
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

  // +2:00 al reclamar el rewarded de game over — como isOver se deriva de
  // remainingMs, apenas suma tiempo el juego "revive" solo (no hace falta
  // tocar el reducer ni el tablero).
  const grantTimeReward = useCallback(() => {
    setRemainingMs((prev) => prev + REWARDED_TIME_BONUS_MS);
    trackedGameOverRef.current = false;
  }, []);

  const {
    adCreative,
    showingAd,
    canShowAd,
    loadingAd,
    canConfirmReward,
    secondsUntilCanConfirm,
    requestAd,
    handleAdWatched,
    handleAdSkipped,
    handleImageClick,
  } = useRewardedAd("encastralo-gameover-rewarded", "encastralo", currentLanguage, grantTimeReward, "extra_time");

  function handleRestart() {
    trackedGameOverRef.current = false;
    gameStartedAtRef.current = Date.now();
    initialBestRef.current = state.best;
    setFoundWords([]);
    setNumberFloor(MIN_TARGET_SUM);
    setFruitFloor(0);
    setRemainingMs(GAME_DURATION_MS);
    setPaused(false);
    restart();
    track("game_start", { variant: state.variant });
  }

  if (isOver) {
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

          <Button
            onClick={requestAd}
            disabled={!canShowAd}
            variant="contained"
            size="large"
            sx={{
              backgroundColor: "#f0b429", color: "#1a1a1a", fontWeight: 800, fontSize: 16,
              py: 1.4, borderRadius: 999, textTransform: "none",
              "&:hover": { backgroundColor: "#d99f1a" },
              "&.Mui-disabled": { backgroundColor: "rgba(240,180,41,0.35)", color: "rgba(26,26,26,0.5)" },
            }}
          >
            {loadingAd ? "..." : t.continueWithAdButton}
          </Button>

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

        <RewardedAdModal
          locale={currentLanguage}
          open={showingAd}
          adCreative={adCreative}
          canConfirmReward={canConfirmReward}
          secondsUntilCanConfirm={secondsUntilCanConfirm}
          onConfirm={handleAdWatched}
          onSkip={handleAdSkipped}
          onImageClick={handleImageClick}
          confirmLabel={t.rewardedAdConfirmButton}
          skipLabel={t.rewardedAdSkipButton}
          waitLabel={t.rewardedAdWaitLabel}
        />
      </Layout>
    );
  }

  return (
    <Layout onBack={() => navigate("/")}>
      <Box sx={{ width: "100%", px: { xs: 1.5, md: 2 }, pb: 2, display: "flex", flexDirection: "column" }}>
        <Box sx={{
          display: "flex", alignItems: "center", gap: 1,
          backgroundColor: "rgba(0,0,0,0.18)", borderRadius: "16px", px: 2, py: 1.25, mb: 1,
        }}>
          <Typography sx={{ color: "rgba(255,255,255,0.85)", fontWeight: 700, fontSize: 14 }}>
            {t.scoreLabel}: {state.score}
          </Typography>
          <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{
              display: "flex", alignItems: "center", gap: 0.5,
              backgroundColor: timeCritical ? ACCENT : "#fff",
              color: timeCritical ? "#fff" : ACCENT,
              borderRadius: 999, px: 1.5, py: 0.5,
              boxShadow: timeCritical ? "0 0 0 3px rgba(231,76,60,0.35)" : "0 2px 6px rgba(0,0,0,0.25)",
              animation: timeCritical ? "encastralo-clock-pulse 1s ease-in-out infinite" : "none",
              "@keyframes encastralo-clock-pulse": {
                "0%, 100%": { transform: "scale(1)" },
                "50%": { transform: "scale(1.08)" },
              },
              "@media (prefers-reduced-motion: reduce)": { animation: "none" },
            }}>
              <Typography component="span" sx={{ fontSize: 18 }}>⏱</Typography>
              <Typography sx={{ fontWeight: 800, fontSize: 20, fontFamily: "monospace", lineHeight: 1 }}>
                {formatClock(remainingMs)}
              </Typography>
            </Box>
            <IconButton
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? t.resumeButtonLabel : t.pauseButtonLabel}
              sx={{
                width: 36, height: 36, color: "#fff", backgroundColor: "rgba(255,255,255,0.15)",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.25)" },
              }}
            >
              {paused ? <PlayArrowRoundedIcon sx={{ fontSize: 20 }} /> : <PauseRoundedIcon sx={{ fontSize: 20 }} />}
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ height: 6, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.18)", overflow: "hidden", mb: 2 }}>
          <Box sx={{
            height: "100%",
            width: `${timeProgress * 100}%`,
            backgroundColor: timeCritical ? ACCENT : "#fff",
            transition: "width 1s linear, background-color 0.3s ease",
          }} />
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
            onPointerDown={(e) => {
              if (!paused) handlePointerDown(e);
            }}
            flatPalette={state.variant === "words"}
          />

          {errorMsg && (
            <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, px: 2 }}>
              <Typography
                sx={{ color: "#fff", backgroundColor: "rgba(0,0,0,0.8)", px: 2, py: 1, borderRadius: 999, fontSize: 14, fontWeight: 700, textAlign: "center" }}
                // errorMsg puede traer <b> (ver reasonIfInvalid en los
                // VariantEngine, o duplicateWordMessage) — contenido
                // propio, no de usuarios.
                dangerouslySetInnerHTML={{ __html: errorMsg }}
              />
            </Box>
          )}

          {timeBonusMsg && (
            <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, px: 2, pointerEvents: "none" }}>
              <Typography sx={{
                color: "#fff", backgroundColor: "#2ecc71", px: 2.5, py: 1.2, borderRadius: 999,
                fontSize: 28, fontWeight: 800, fontFamily: "monospace", textAlign: "center",
                boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
                animation: "encastralo-bonus-pop 1.1s ease-out forwards",
                "@keyframes encastralo-bonus-pop": {
                  "0%": { transform: "scale(0.6) translateY(10px)", opacity: 0 },
                  "15%": { transform: "scale(1.15) translateY(0)", opacity: 1 },
                  "30%": { transform: "scale(1) translateY(0)", opacity: 1 },
                  "80%": { transform: "scale(1) translateY(-6px)", opacity: 1 },
                  "100%": { transform: "scale(1) translateY(-18px)", opacity: 0 },
                },
                "@media (prefers-reduced-motion: reduce)": { animation: "none" },
              }}>
                {timeBonusMsg}
              </Typography>
            </Box>
          )}

          {paused && (
            <Box sx={{
              position: "absolute", inset: 0, zIndex: 3,
              display: "flex", alignItems: "center", justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.96)",
            }}>
              <Typography sx={{ fontFamily: "Lobster, cursive", fontSize: 32, color: ACCENT }}>
                {t.pausedOverlayTitle}
              </Typography>
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
            thresholds={rollingGoalWindow(numberFloor, NUMBER_GOAL_THRESHOLDS[0], NUMBER_GOAL_THRESHOLDS.length)}
            achieved={numberFloor}
            nextGoalLabel={t.numberGoalNext}
            completeLabel={t.numberGoalsComplete}
          />
        )}

        {state.variant === "fruits" && (
          <GoalsCard
            title={t.goalsTitle}
            thresholds={rollingGoalWindow(fruitFloor, FRUIT_GOAL_THRESHOLDS[0], FRUIT_GOAL_THRESHOLDS.length)}
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
            onPieceDown={(e, index, piece) => {
              if (!paused) startDrag(e, index, piece);
            }}
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
