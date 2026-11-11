import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import RotateLeftRoundedIcon from "@mui/icons-material/RotateLeftRounded";
import RotateRightRoundedIcon from "@mui/icons-material/RotateRightRounded";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import Layout from "../components/Layout";
import EncastraloBoard from "../components/EncastraloBoard";
import FoundWordsList, { FoundWordEntry } from "../components/FoundWordsList";
import HowToPlayCollapse from "../components/HowToPlayCollapse";
import { useLanguage } from "../i18n/LanguageContext";
import { track } from "../lib/analytics";
import { recordLastPlayed } from "../utils/lastPlayedState";
import {
  Board,
  FallingPiece,
  createEmptyBoard,
  spawnPiece,
  hasCollision,
  tryMove,
  tryRotate,
  lockPiece,
  levelFromWordsFound,
  wordsIntoCurrentLevel,
  wordsRequiredForLevel,
  gravityIntervalMs,
  clearTopHalf,
} from "../utils/encastraloEngine";
import { evaluateSelection, columnsFromCells, GridCell } from "../utils/encastraloWords";
import { collapseColumns } from "../utils/encastraloEngine";
import { maybeSaveRecord } from "../utils/encastraloRecordState";
import { loadInProgressGame, saveInProgressGame, clearInProgressGame } from "../utils/encastraloInProgressState";
import { buildEncastraloResultPngFile } from "../utils/shareImage";
import { useRewardedAd } from "../ads/useRewardedAd";
import RewardedAdModal from "../ads/RewardedAdModal";
import HouseAdBanner from "../ads/HouseAdBanner";

const ACCENT = "#e74c3c";
const FEEDBACK_DURATION_MS = 1300;
const CLEAR_DELAY_MS = 260;
const LEVEL_UP_POPUP_MS = 1800;

type Phase = "playing" | "paused" | "levelup" | "gameover";

interface GameState {
  board: Board;
  fallingPiece: FallingPiece;
  phase: Phase;
}

function removeCellsAndCollapse(board: Board, cells: GridCell[]): Board {
  const cleared = board.map((row) => [...row]);
  for (const { row, col } of cells) cleared[row][col] = null;
  return collapseColumns(cleared, columnsFromCells(cells));
}

export default function Game() {
  const navigate = useNavigate();
  const { t, currentLanguage } = useLanguage();

  // Se lee una sola vez al montar (lazy initializer) — el resto del estado
  // inicial se deriva de esto mismo, para que todos arranquen consistentes
  // con la misma foto guardada (ver encastraloInProgressState.ts).
  const [initialSnapshot] = useState(() => loadInProgressGame());

  const [gameState, setGameState] = useState<GameState>(() => {
    if (initialSnapshot) {
      // Si había una partida guardada (jugando o ya en pausa), se restaura
      // siempre en pausa — así la pieza no sigue cayendo sola apenas carga
      // la página, y el jugador retoma cuando esté listo.
      return { board: initialSnapshot.board, fallingPiece: initialSnapshot.fallingPiece, phase: "paused" };
    }
    const board = createEmptyBoard();
    return { board, fallingPiece: spawnPiece(currentLanguage), phase: "playing" };
  });
  const [score, setScore] = useState(initialSnapshot?.score ?? 0);
  const [foundWords, setFoundWords] = useState<FoundWordEntry[]>(initialSnapshot?.foundWords ?? []);
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set(initialSnapshot?.usedWords ?? []));
  const [flash, setFlash] = useState<{ cells: GridCell[]; kind: "success" | "error" } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [levelUpNumber, setLevelUpNumber] = useState<number | null>(null);
  const [repeatPenalty, setRepeatPenalty] = useState(initialSnapshot?.repeatPenalty ?? 0);
  const [sharingResult, setSharingResult] = useState(false);
  const canShareResult = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const levelUpTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedRecordRef = useRef(false);
  // Marca de tiempo de la partida actual (se renueva en cada restart), para
  // calcular duration_sec al llegar a game_over. Si venimos de una partida
  // restaurada, se conserva la marca original en vez de reiniciarla.
  const gameStartedAtRef = useRef(initialSnapshot?.gameStartedAt ?? Date.now());

  useEffect(() => {
    recordLastPlayed();
    // Si veníamos de una partida restaurada, esto es un resume, no un
    // arranque nuevo — no corresponde trackear game_start de nuevo.
    if (!initialSnapshot) track("game_start", { level: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guarda una foto de la partida en curso después de cada cambio relevante
  // (ver encastraloInProgressState.ts) — "levelup" no se persiste porque es un
  // popup transitorio de 1.8s sobre "playing"; si el navegador mata la
  // pestaña justo en ese instante, se retoma desde el último "playing"
  // guardado un momento antes, que es indistinguible en la práctica.
  useEffect(() => {
    if (gameState.phase !== "playing" && gameState.phase !== "paused") return;
    saveInProgressGame({
      board: gameState.board,
      fallingPiece: gameState.fallingPiece,
      phase: gameState.phase,
      score,
      foundWords,
      usedWords: Array.from(usedWords),
      repeatPenalty,
      gameStartedAt: gameStartedAtRef.current,
    });
  }, [gameState, score, foundWords, usedWords, repeatPenalty]);

  const level = levelFromWordsFound(foundWords.length);
  const wordsInLevel = wordsIntoCurrentLevel(foundWords.length);
  const levelGoal = wordsRequiredForLevel(level);

  // Gravedad automática.
  useEffect(() => {
    if (gameState.phase !== "playing") return;
    const interval = setInterval(() => {
      setGameState((prev) => {
        if (prev.phase !== "playing") return prev;
        const moved = tryMove(prev.board, prev.fallingPiece, 1, 0);
        if (moved) return { ...prev, fallingPiece: moved };

        const { board: lockedBoard, gameOver } = lockPiece(prev.board, prev.fallingPiece);
        if (gameOver) return { ...prev, board: lockedBoard, phase: "gameover" };

        const nextPiece = spawnPiece(currentLanguage);
        if (hasCollision(lockedBoard, nextPiece.matrix, nextPiece.row, nextPiece.col)) {
          return { ...prev, board: lockedBoard, phase: "gameover" };
        }
        return { board: lockedBoard, fallingPiece: nextPiece, phase: "playing" };
      });
    }, gravityIntervalMs(level));
    return () => clearInterval(interval);
  }, [gameState.phase, level, currentLanguage]);

  // Guardar récord al terminar, solo si esta partida supera alguno.
  useEffect(() => {
    if (gameState.phase === "gameover" && !savedRecordRef.current) {
      savedRecordRef.current = true;
      clearInProgressGame();
      maybeSaveRecord(currentLanguage, score, foundWords.map((f) => f.word));
      // "stack_overflow" es la única causa real de game over acá: una
      // pieza nueva no entra porque el tablero llegó al tope.
      const durationSec = Math.round((Date.now() - gameStartedAtRef.current) / 1000);
      track("game_over", { level, score, duration_sec: durationSec, reason: "stack_overflow" });
    }
  }, [gameState.phase, currentLanguage, score, foundWords.length, level]);

  function pauseGame() {
    setGameState((prev) => (prev.phase === "playing" ? { ...prev, phase: "paused" } : prev));
  }

  function resumeGame() {
    setGameState((prev) => (prev.phase === "paused" ? { ...prev, phase: "playing" } : prev));
  }

  function scheduleFeedbackClear() {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => {
      setFlash(null);
      setErrorMsg("");
    }, FEEDBACK_DURATION_MS);
  }

  function handleMove(dCol: number) {
    setGameState((prev) => {
      if (prev.phase !== "playing") return prev;
      const moved = tryMove(prev.board, prev.fallingPiece, 0, dCol);
      return moved ? { ...prev, fallingPiece: moved } : prev;
    });
  }

  function handleSoftDrop() {
    setGameState((prev) => {
      if (prev.phase !== "playing") return prev;
      const moved = tryMove(prev.board, prev.fallingPiece, 1, 0);
      return moved ? { ...prev, fallingPiece: moved } : prev;
    });
  }

  function handleRotate(dir: "cw" | "ccw") {
    setGameState((prev) => {
      if (prev.phase !== "playing") return prev;
      const rotated = tryRotate(prev.board, prev.fallingPiece, dir);
      return rotated ? { ...prev, fallingPiece: rotated } : prev;
    });
  }

  // Controles de teclado (solo compu): flechas izq/der mueven, abajo baja,
  // arriba rota. preventDefault para que no scrollee la página.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          handleMove(-1);
          break;
        case "ArrowRight":
          e.preventDefault();
          handleMove(1);
          break;
        case "ArrowDown":
          e.preventDefault();
          handleSoftDrop();
          break;
        case "ArrowUp":
          e.preventDefault();
          handleRotate("cw");
          break;
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleSelectionEnd(cells: GridCell[]) {
    if (gameState.phase !== "playing" || cells.length < 3) return;

    const result = evaluateSelection(gameState.board, cells, currentLanguage, usedWords);

    if (result.status === "invalid") {
      setFlash({ cells, kind: "error" });
      setErrorMsg(t.errorNotInDictionary);
      scheduleFeedbackClear();
      return;
    }

    if (result.status === "repeat") {
      setScore((s) => Math.max(0, s + result.points));
      setRepeatPenalty((p) => p - result.points);
      setFlash({ cells, kind: "error" });
      setErrorMsg(t.errorAlreadyUsed(result.word));
      scheduleFeedbackClear();
      return;
    }

    setScore((s) => s + result.points);
    const newTotalWords = foundWords.length + 1;
    setFoundWords((prev) => [...prev, { word: result.word, points: result.points }]);
    setUsedWords((prev) => new Set(prev).add(result.word));
    setFlash({ cells, kind: "success" });

    const willLevelUp = wordsIntoCurrentLevel(newTotalWords) === 0;
    const newLevel = levelFromWordsFound(newTotalWords);

    if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
    clearTimeoutRef.current = setTimeout(() => {
      setGameState((prev) => ({ ...prev, board: removeCellsAndCollapse(prev.board, cells) }));
      setFlash(null);

      if (willLevelUp) {
        track("level_start", { level: newLevel });
        setLevelUpNumber(newLevel);
        setGameState((prev) => ({ ...prev, phase: "levelup" }));
        if (levelUpTimeoutRef.current) clearTimeout(levelUpTimeoutRef.current);
        levelUpTimeoutRef.current = setTimeout(() => {
          setLevelUpNumber(null);
          setGameState({ board: createEmptyBoard(), fallingPiece: spawnPiece(currentLanguage), phase: "playing" });
        }, LEVEL_UP_POPUP_MS);
      }
    }, CLEAR_DELAY_MS);
  }

  const {
    adCreative: continueAdCreative,
    showingAd: showingContinueAd,
    canShowAd: canShowContinueAd,
    loadingAd: loadingContinueAd,
    canConfirmReward: canConfirmContinue,
    secondsUntilCanConfirm: continueWaitSeconds,
    requestAd: requestContinueAd,
    handleAdWatched: handleContinueAdWatched,
    handleAdSkipped: handleContinueAdSkipped,
    handleImageClick: handleContinueImageClick,
  } = useRewardedAd(
    "encastralo-gameover-rewarded",
    "encastralo",
    currentLanguage,
    () => {
      savedRecordRef.current = false;
      setGameState((prev) => ({
        board: clearTopHalf(prev.board),
        fallingPiece: spawnPiece(currentLanguage),
        phase: "playing",
      }));
    },
    "continue_game",
  );

  function restartGame() {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
    if (levelUpTimeoutRef.current) clearTimeout(levelUpTimeoutRef.current);
    savedRecordRef.current = false;
    setScore(0);
    setFoundWords([]);
    setUsedWords(new Set());
    setRepeatPenalty(0);
    setFlash(null);
    setErrorMsg("");
    setLevelUpNumber(null);
    setGameState({ board: createEmptyBoard(), fallingPiece: spawnPiece(currentLanguage), phase: "playing" });
    gameStartedAtRef.current = Date.now();
    track("game_start", { level: 1 });
  }

  async function handleShareResult(method: "whatsapp" | "facebook") {
    if (!canShareResult || sharingResult) return;
    setSharingResult(true);
    track("share", { method });
    try {
      const levelReached = levelFromWordsFound(foundWords.length);
      const imageFile = await buildEncastraloResultPngFile(
        foundWords,
        {
          levelLabel: t.levelReachedLabel(levelReached),
          pointsLabel: `${t.scoreLabel.toUpperCase()} (${score})`,
          wordsSectionLabel: `${t.wordsListTitle.toUpperCase()} (${foundWords.length})`,
          repeatPenaltyLabel: repeatPenalty > 0 ? t.shareRepeatPenaltyLabel(repeatPenalty) : undefined,
        },
        "encastralo-resultado.png",
      );
      const shareUrl = "https://www.encastralo.com";
      const shareData: ShareData = {
        title: "Encastralo",
        text: `${t.shareResultText(levelReached, score)}\n${shareUrl}`,
      };
      if (imageFile && (!navigator.canShare || navigator.canShare({ files: [imageFile] }))) {
        shareData.files = [imageFile];
      }
      await navigator.share(shareData);
    } catch {
      // Canceló el panel de compartir sin elegir nada.
    } finally {
      setSharingResult(false);
    }
  }

  if (gameState.phase === "gameover") {
    const levelReached = levelFromWordsFound(foundWords.length);
    return (
      <Layout onBack={() => navigate("/")}>
        <Box sx={{ width: "100%", px: { xs: 1.5, md: 2 }, pb: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ borderRadius: "16px", backgroundColor: "#f3f3f3", p: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontSize: 52 }}>🧩</Typography>
            <Typography sx={{ fontFamily: "Lobster, cursive", fontSize: 26, color: "#222", textAlign: "center" }}>
              {t.gameOverTitle}
            </Typography>
            <Typography sx={{ color: "#666", fontSize: 16 }}>{t.gameOverBody(score)}</Typography>
          </Box>

          <Box sx={{ borderRadius: "16px", backgroundColor: "#fff", p: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <Typography sx={{ fontSize: 20, fontWeight: 900, color: ACCENT, textAlign: "center", mb: 1.5 }}>
              www.encastralo.com
            </Typography>
            <Typography sx={{ fontSize: 18, fontWeight: 800, color: "#222", mb: 1 }}>
              {t.levelReachedLabel(levelReached)}
            </Typography>
            <FoundWordsList title={t.wordsListTitle} emptyLabel={t.wordsListEmpty} words={foundWords} />

            {canShareResult && (
              <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5, mt: 2 }}>
                <Box
                  component="button"
                  onClick={() => handleShareResult("whatsapp")}
                  disabled={sharingResult}
                  aria-label="Compartir por WhatsApp"
                  sx={{
                    display: "grid", placeItems: "center", width: 48, height: 48, borderRadius: "50%",
                    backgroundColor: "#25D366", color: "#fff", border: "none", cursor: "pointer",
                    opacity: sharingResult ? 0.6 : 1,
                  }}
                >
                  <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor">
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.74.46 3.43 1.32 4.92L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m0 1.67c2.2 0 4.26.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.24 8.24a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.14.82.84-3.06-.2-.31a8.17 8.17 0 0 1-1.25-4.36c0-4.54 3.7-8.24 8.25-8.24M8.53 7.33c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.09 0 1.23.9 2.42 1.02 2.58.12.17 1.75 2.67 4.3 3.74.6.26 1.07.41 1.44.52.6.19 1.15.17 1.58.1.48-.07 1.48-.6 1.69-1.19.21-.58.21-1.08.15-1.19-.06-.1-.23-.17-.48-.29-.25-.12-1.48-.73-1.71-.81-.23-.08-.4-.12-.56.13-.17.25-.65.81-.79.98-.15.17-.29.19-.54.06-.25-.12-1.04-.38-1.99-1.23-.73-.66-1.23-1.46-1.37-1.71-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.37-.78-1.87-.2-.49-.41-.42-.56-.43-.14-.01-.31-.01-.48-.01Z" />
                  </svg>
                </Box>
                <Box
                  component="button"
                  onClick={() => handleShareResult("facebook")}
                  disabled={sharingResult}
                  aria-label="Compartir por Facebook"
                  sx={{
                    display: "grid", placeItems: "center", width: 48, height: 48, borderRadius: "50%",
                    backgroundColor: "#1877F2", color: "#fff", border: "none", cursor: "pointer",
                    opacity: sharingResult ? 0.6 : 1,
                  }}
                >
                  <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95Z" />
                  </svg>
                </Box>
              </Box>
            )}
          </Box>

          <Button
            onClick={requestContinueAd}
            disabled={!canShowContinueAd}
            variant="contained"
            size="large"
            sx={{
              backgroundColor: "#f0b429", color: "#1a1a1a", fontWeight: 800, fontSize: 16,
              py: 1.4, borderRadius: 999, textTransform: "none",
              "&:hover": { backgroundColor: "#d99f1a" },
              "&.Mui-disabled": { backgroundColor: "rgba(240,180,41,0.35)", color: "rgba(26,26,26,0.5)" },
            }}
          >
            {loadingContinueAd ? "..." : t.continueWithAdButton}
          </Button>

          <Button onClick={restartGame} variant="contained" size="large" sx={{
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
          open={showingContinueAd}
          adCreative={continueAdCreative}
          canConfirmReward={canConfirmContinue}
          secondsUntilCanConfirm={continueWaitSeconds}
          onConfirm={handleContinueAdWatched}
          onSkip={handleContinueAdSkipped}
          onImageClick={handleContinueImageClick}
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
          backgroundColor: "rgba(0,0,0,0.18)", borderRadius: "16px", px: 2, py: 1.25, mb: 2,
        }}>
          <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>
            {t.levelLabel} {level}
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.85)", fontWeight: 700, fontSize: 13, ml: "auto" }}>
            {t.levelGoalLabel(wordsInLevel, levelGoal)}
          </Typography>
          <Button
            onClick={gameState.phase === "paused" ? resumeGame : pauseGame}
            disabled={gameState.phase !== "playing" && gameState.phase !== "paused"}
            aria-label={gameState.phase === "paused" ? t.resumeButtonLabel : t.pauseButtonLabel}
            sx={{
              minWidth: 0, width: 32, height: 32, flexShrink: 0,
              backgroundColor: "rgba(255,255,255,0.15)", color: "#fff", borderRadius: "50%", p: 0,
              "&:hover": { backgroundColor: "rgba(255,255,255,0.25)" },
              "&.Mui-disabled": { backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)" },
            }}
          >
            {gameState.phase === "paused" ? (
              <PlayArrowRoundedIcon sx={{ fontSize: 18 }} />
            ) : (
              <PauseRoundedIcon sx={{ fontSize: 18 }} />
            )}
          </Button>
        </Box>

        <Box sx={{ position: "relative", borderRadius: "16px", overflow: "hidden", backgroundColor: "#fff", p: 1, mb: 1 }}>
          <EncastraloBoard
            board={gameState.board}
            fallingPiece={gameState.fallingPiece}
            onSelectionEnd={handleSelectionEnd}
            flashCells={flash}
          />

          {errorMsg && (
            <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, px: 2 }}>
              <Typography sx={{ color: "#fff", backgroundColor: "rgba(0,0,0,0.8)", px: 2, py: 1, borderRadius: 999, fontSize: 14, fontWeight: 700, textAlign: "center" }}>
                {errorMsg}
              </Typography>
            </Box>
          )}

          {gameState.phase === "levelup" && levelUpNumber !== null && (
            <Box sx={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1,
              backgroundColor: "rgba(255,255,255,0.96)", textAlign: "center", px: 2,
            }}>
              <Typography sx={{ fontSize: 44 }}>🎉</Typography>
              <Typography sx={{ fontFamily: "Lobster, cursive", fontSize: 32, color: ACCENT }}>
                {t.levelUpTitle(levelUpNumber)}
              </Typography>
            </Box>
          )}

          {gameState.phase === "paused" && (
            <Box sx={{
              position: "absolute", inset: 0, zIndex: 2,
              display: "flex", alignItems: "center", justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.96)", textAlign: "center", px: 2,
            }}>
              <Typography sx={{ fontFamily: "Lobster, cursive", fontSize: 32, color: ACCENT }}>
                {t.pausedOverlayTitle}
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ display: "flex", width: "100%", gap: "2px", mb: 1 }}>
          <Button onClick={() => handleMove(-1)} sx={controlButtonSx}>
            <ArrowBackIosNewRoundedIcon sx={{ fontSize: 24 }} />
          </Button>
          <Button onClick={() => handleRotate("ccw")} sx={controlButtonSx}>
            <RotateLeftRoundedIcon sx={{ fontSize: 28 }} />
          </Button>
          <Button onClick={handleSoftDrop} sx={controlButtonSx}>
            <ArrowDownwardRoundedIcon sx={{ fontSize: 24 }} />
          </Button>
          <Button onClick={() => handleRotate("cw")} sx={controlButtonSx}>
            <RotateRightRoundedIcon sx={{ fontSize: 28 }} />
          </Button>
          <Button onClick={() => handleMove(1)} sx={controlButtonSx}>
            <ArrowForwardIosRoundedIcon sx={{ fontSize: 24 }} />
          </Button>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
          <HouseAdBanner slot="encastralo-words-banner" gameSlug="encastralo" locale={currentLanguage} />
        </Box>

        <FoundWordsList
          title={t.wordsListTitle}
          emptyLabel={t.wordsListEmpty}
          words={foundWords}
          scoreLabel={t.scoreLabel}
          score={score}
        />

        <HowToPlayCollapse title={t.howToPlayTitle} body={t.howToPlayBody} />
      </Box>
    </Layout>
  );
}

const controlButtonSx = {
  flex: 1,
  minWidth: 0,
  aspectRatio: "1 / 1",
  padding: 0,
  borderRadius: "12px",
  backgroundColor: "#fff",
  color: ACCENT,
  "&:hover": { backgroundColor: "#f3f3f3" },
};
