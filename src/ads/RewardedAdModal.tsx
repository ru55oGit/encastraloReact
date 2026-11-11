// Copiado de boludeando-ads/sdk/boludeando-ads-client/src/RewardedAdModal.tsx el 2026-10-09.
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import RewardedFallbackCreative from "./RewardedFallbackCreative";
import type { AdCreative } from "./types";

interface RewardedAdModalProps {
  open: boolean;
  adCreative: AdCreative | null;
  canConfirmReward: boolean;
  secondsUntilCanConfirm: number;
  onConfirm: () => void;
  onSkip: () => void;
  onImageClick: () => void;
  confirmLabel: string;
  skipLabel: string;
  waitLabel: (seconds: number) => string;
  // es/en/pt — fr/de caen a español por ahora (ver adFallbackCopy.ts).
  // Solo lo usa el fallback (RewardedFallbackCreative), el creative real
  // no tiene texto propio que traducir acá.
  locale?: string;
}

export default function RewardedAdModal({
  open,
  adCreative,
  canConfirmReward,
  secondsUntilCanConfirm,
  onConfirm,
  onSkip,
  onImageClick,
  confirmLabel,
  skipLabel,
  waitLabel,
  locale,
}: RewardedAdModalProps) {
  // "rewarded full screen" es el único producto que se vende para este
  // slot (ver migrations/0003_ad_format.sql) — cualquier creative real
  // (adCreative no null) ocupa toda la pantalla. El fallback gratuito
  // "anunciá acá" (adCreative null) se queda en la card chica de siempre.
  const fullScreen = Boolean(adCreative);

  const actions = (
    <>
      <Button
        variant="contained"
        fullWidth
        disabled={!canConfirmReward}
        onClick={onConfirm}
        sx={{ mt: fullScreen ? 0 : 2, mb: 1, backgroundColor: "#4a7c59", "&:hover": { backgroundColor: "#3b6448" } }}
      >
        {canConfirmReward ? confirmLabel : waitLabel(secondsUntilCanConfirm)}
      </Button>

      <Typography
        component="button"
        onClick={onSkip}
        sx={{
          color: "#999",
          fontSize: 13,
          background: "none",
          border: "none",
          cursor: "pointer",
          textDecoration: "underline",
        }}
      >
        {skipLabel}
      </Typography>
    </>
  );

  if (fullScreen) {
    return (
      <Modal open={open} onClose={onSkip} aria-labelledby="rewarded-ad-title">
        {/* position:fixed + inset:0 solo (sin width/height en vh) sigue el viewport
            visual real del navegador — con height:100vh explícito, en mobile (barra
            de direcciones que aparece/desaparece) el botón de abajo quedaba tapado. */}
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            backgroundColor: "#000",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Las creatividades rewarded se piden en formato vertical, estilo
              celular (ver adFormats.ts, 1080×1920 9:16). En desktop, forzarlas a
              cubrir todo el ancho de una ventana apaisada las recorta muchísimo
              (object-fit:cover escala hasta tapar el ancho y se come casi todo el
              alto) — se las limita a un ancho de celular centrado, con el resto
              de la pantalla en negro a los costados, como un interstitial real. */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              maxWidth: { xs: "100%", sm: 480 },
              height: "100%",
              mx: "auto",
            }}
          >
            {/* El creative también es clickeable (va al clickUrl del anunciante,
                como cualquier banner) — antes no tenía ni href ni onClick. */}
            <Box
              component="a"
              href={adCreative!.clickUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onImageClick}
              sx={{ display: "block", flex: 1, minHeight: 0 }}
            >
              <Box
                component="img"
                src={adCreative!.assetUrl}
                alt={adCreative!.headline ?? "Publicidad"}
                sx={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Box>
            <Box
              sx={{
                backgroundColor: "#fff",
                p: 2,
                pb: "calc(16px + env(safe-area-inset-bottom))",
                textAlign: "center",
                flexShrink: 0,
              }}
            >
              {actions}
            </Box>
          </Box>
        </Box>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onSkip} aria-labelledby="rewarded-ad-title">
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90vw",
          maxWidth: 360,
          boxSizing: "border-box",
          backgroundColor: "#fff",
          borderRadius: 3,
          p: 2,
          textAlign: "center",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}
      >
        <RewardedFallbackCreative locale={locale} />
        {actions}
      </Box>
    </Modal>
  );
}
