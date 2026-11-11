import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import Layout from "../components/Layout";
import AdsenseScript from "../components/AdsenseScript";
import LanguageSelector from "../components/LanguageSelector";
import HowToPlayDemo from "../components/HowToPlayDemo";
import { isAdFree, purchaseAdFree, syncAdFreeAfterReturn } from "../ads/adFreeEntitlement";
import HouseAdBanner from "../ads/HouseAdBanner";
import HubAdPromoBanner from "../ads/HubAdPromoBanner";
import ShareButtons from "../ads/ShareButtons";
import { useLanguage } from "../i18n/LanguageContext";
import { track } from "../lib/analytics";
import { getRecord, EncastraloRecord } from "../utils/encastraloRecordState";
import { getDaysSinceLastPlayed } from "../utils/lastPlayedState";
import { buildEncastraloRecordPngFile } from "../utils/shareImage";

const ACCENT = "#e74c3c";
const CARD_BG = "#eb6f62";

// UTM: distingue en GA4 del hub cuánto tráfico de "volver" viene
// específicamente del header de este juego.
const HUB_URL = "https://www.boludeando.com/?utm_source=encastralo&utm_medium=cross_game&utm_campaign=header_back";

function handleHubLinkClick() {
  track("select_content", { content_type: "cross_game", item_id: "boludeando_hub" });
}

export default function Home() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, currentLanguage } = useLanguage();
  // El idioma viaja hub→juego por query param al entrar; esto lo hace
  // viajar también juego→hub al volver, para que no se pierda si el
  // usuario lo cambió acá adentro.
  const hubUrlWithLang = `${HUB_URL}&lang=${currentLanguage}`;

  const [adFree, setAdFree] = useState(false);
  const [buyingAdFree, setBuyingAdFree] = useState(false);

  useEffect(() => {
    if (searchParams.get("adfree_return") === "1") {
      syncAdFreeAfterReturn().then((active) => {
        setAdFree(active);
        setSearchParams(
          (prev) => {
            prev.delete("adfree_return");
            return prev;
          },
          { replace: true },
        );
      });
    } else {
      isAdFree().then(setAdFree);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRemoveAds = async () => {
    setBuyingAdFree(true);
    const returnUrl = `${window.location.origin}${window.location.pathname}?adfree_return=1`;
    const checkoutUrl = await purchaseAdFree(returnUrl);
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    } else {
      setBuyingAdFree(false);
    }
  };
  const [record, setRecord] = useState<EncastraloRecord | null>(null);
  const [sharingRecord, setSharingRecord] = useState(false);
  const canShareRecord = typeof navigator !== "undefined" && typeof navigator.share === "function";

  useEffect(() => {
    setRecord(getRecord(currentLanguage));
  }, [currentLanguage]);

  useEffect(() => {
    const refresh = () => setRecord(getRecord(currentLanguage));
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [currentLanguage]);

  async function handleShareRecord(method: "whatsapp" | "facebook") {
    if (!record || !canShareRecord || sharingRecord) return;
    setSharingRecord(true);
    track("share", { method, context: "record" });
    try {
      const captions = [t.recordScoreCaption(record.score)];
      if (record.wordsFound > 0) captions.push(t.recordWordsCaption(record.wordsFound));
      if (record.longestWord) captions.push(t.recordLongestWordCaption(record.longestWord));

      const imageFile = await buildEncastraloRecordPngFile(
        {
          title: t.recordTitle,
          scoreValue: String(record.score),
          captions,
          wordsSectionLabel: record.words.length > 0 ? `${t.wordsListTitle.toUpperCase()} (${record.words.length})` : undefined,
          words: record.words,
        },
        "encastralo-record.png",
      );
      const shareUrl = "https://www.encastralo.com";
      const shareData: ShareData = {
        title: "Encastralo",
        text: `${t.shareRecordText(record.score)}\n${shareUrl}`,
      };
      if (imageFile && (!navigator.canShare || navigator.canShare({ files: [imageFile] }))) {
        shareData.files = [imageFile];
      }
      await navigator.share(shareData);
    } catch {
      // Canceló el panel de compartir sin elegir nada.
    } finally {
      setSharingRecord(false);
    }
  }

  const daysSincePlayed = getDaysSinceLastPlayed();
  const nowHour = new Date().getHours();
  const timeGreeting = nowHour < 12 ? t.greetingMorning : nowHour < 20 ? t.greetingAfternoon : t.greetingEvening;
  const greeting =
    daysSincePlayed != null && daysSincePlayed > 1
      ? `${timeGreeting}, ${t.daysWithoutPlayingMessage(daysSincePlayed)}.`
      : timeGreeting;

  return (
    <Layout showFooter>
      <AdsenseScript />
      {
        // Shell fijo a todo el ancho del viewport (sin estilo propio) que
        // centra con flexbox el header real de 480px adentro — más robusto
        // que left:50%+transform. boxSizing:border-box en el header es
        // necesario para que el px:2 (padding) no se sume por fuera del
        // width:480px (encontrado en emojinaloReact: sin esto el header
        // termina ~32px más ancho que la columna de contenido). Siempre
        // visible (no solo viniendo del hub): con los shares de resultado,
        // alguien puede entrar directo a este juego sin haber pasado por
        // boludeando.com antes, y necesita igual una forma de llegar ahí.
      }
      <Box sx={{ position: "fixed", top: 0, left: 0, width: "100%", zIndex: 10, display: "flex", justifyContent: "center" }}>
        <Box component="header" sx={{
          display: "flex", alignItems: "center",
          height: 80, px: 2,
          boxSizing: "border-box",
          borderBottom: `2px solid ${ACCENT}`,
          background: "#fff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          width: { xs: "100%", md: "480px" }, position: "relative",
        }}>
          <Box component="a" href={hubUrlWithLang} onClick={handleHubLinkClick} aria-label="Volver" sx={{ display: "flex", alignItems: "center", zIndex: 1 }}>
            <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
              <path d="M26 6L14 19L26 32" stroke={ACCENT} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Box>
          <Box
            component="a"
            href={hubUrlWithLang}
            onClick={handleHubLinkClick}
            sx={{
              position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
              fontFamily: "Lobster, cursive", fontSize: 28, color: ACCENT, textDecoration: "none",
            }}
          >
            Boludeando
          </Box>
        </Box>
      </Box>
      <Box sx={{ width: "100%", px: { xs: 1.5, md: 2 }, pt: "80px", pb: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography variant="h2" sx={{
            color: "#fff", fontWeight: 700, letterSpacing: "1px",
            fontFamily: "Lobster, cursive", textAlign: "center", width: "100%",
          }}>
            {t.appName}
          </Typography>

          <Typography variant="h6" sx={{
            color: "rgba(255,255,255,0.64)", fontStyle: "italic",
            letterSpacing: "2px", textAlign: "center", fontSize: { xs: 18, md: 22 },
          }}>
            {t.tagline}
          </Typography>
        </Box>

        <Typography sx={{ color: "#ffe6e6", fontSize: 18, fontWeight: 600 }}>{greeting}</Typography>
        <Typography sx={{ color: "#fff", fontSize: 24, fontWeight: 700, lineHeight: 1.4 }}>{t.readyToPlay}</Typography>

        {/* Card de juego: demo animada + botón Jugar */}
        <Box sx={{ width: "100%", borderRadius: "24px", backgroundColor: CARD_BG, p: 2, boxShadow: "0 12px 24px rgba(0,0,0,0.18)" }}>
          <Box sx={{
            width: "100%", borderRadius: "16px", backgroundColor: "#f3f3f3",
            p: 1.25, mb: 2,
          }}>
            <HowToPlayDemo />
          </Box>

          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Button
              variant="contained"
              onClick={() => navigate("/game")}
              startIcon={<PlayArrowRoundedIcon sx={{ fontSize: "28px !important" }} />}
              sx={{
                backgroundColor: "#fff", color: ACCENT, fontWeight: 800,
                borderRadius: 999, px: 3, py: 1.4, fontSize: 18,
                boxShadow: "0 0 0 4px rgba(255,255,255,0.35), 0 10px 24px rgba(0,0,0,0.4)",
                "&:hover": { backgroundColor: "#fff" },
              }}
            >
              {t.playButton}
            </Button>
          </Box>
        </Box>

        {!adFree && (
          <HouseAdBanner
            slot="encastralo-home-double-banner"
            gameSlug="encastralo"
            locale={currentLanguage}
            format="banner_double"
          />
        )}

        {!adFree && (
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Button
              size="small"
              onClick={handleRemoveAds}
              disabled={buyingAdFree}
              sx={{ color: "rgba(255,255,255,0.7)", textTransform: "none", fontSize: 13 }}
            >
              {buyingAdFree ? t.removeAdsButtonBuying : t.removeAdsButton}
            </Button>
          </Box>
        )}

        {/* Récord — box separado, como "Mejor Racha" en Enganchalo */}
        <Box sx={{ borderRadius: "16px", backgroundColor: "#fff", p: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <Typography sx={{ fontSize: 28, fontWeight: 800, color: "#222", mb: 0.5 }}>
            {t.recordTitle}
          </Typography>
          {record ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Typography sx={{ fontSize: 42, fontWeight: 900, color: ACCENT, fontFamily: "monospace" }}>
                {record.score}
              </Typography>
              <Typography sx={{ fontSize: 13, color: "#888" }}>
                {t.recordScoreCaption(record.score)}
              </Typography>
              {record.wordsFound > 0 && (
                <Typography sx={{ fontSize: 13, color: "#888" }}>
                  {t.recordWordsCaption(record.wordsFound)}
                </Typography>
              )}
              {record.longestWord && (
                <Typography sx={{ fontSize: 13, color: "#888" }}>
                  {t.recordLongestWordCaption(record.longestWord)}
                </Typography>
              )}
              {record.words.length > 0 && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1 }}>
                  {record.words.map((word, i) => (
                    <Box key={i} sx={{
                      px: 1.5, py: 0.5, borderRadius: "6px",
                      backgroundColor: `${ACCENT}18`, border: `1px solid ${ACCENT}55`,
                    }}>
                      <Typography sx={{ color: ACCENT, fontFamily: "monospace", fontSize: 13, fontWeight: 700 }}>
                        {word}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}

              {canShareRecord && (
                <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5, mt: 1.5 }}>
                  <Box
                    component="button"
                    onClick={() => handleShareRecord("whatsapp")}
                    disabled={sharingRecord}
                    aria-label="Compartir por WhatsApp"
                    sx={{
                      display: "grid", placeItems: "center", width: 44, height: 44, borderRadius: "50%",
                      backgroundColor: "#25D366", color: "#fff", border: "none", cursor: "pointer",
                      opacity: sharingRecord ? 0.6 : 1,
                    }}
                  >
                    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor">
                      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.74.46 3.43 1.32 4.92L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m0 1.67c2.2 0 4.26.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.24 8.24a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.14.82.84-3.06-.2-.31a8.17 8.17 0 0 1-1.25-4.36c0-4.54 3.7-8.24 8.25-8.24M8.53 7.33c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.09 0 1.23.9 2.42 1.02 2.58.12.17 1.75 2.67 4.3 3.74.6.26 1.07.41 1.44.52.6.19 1.15.17 1.58.1.48-.07 1.48-.6 1.69-1.19.21-.58.21-1.08.15-1.19-.06-.1-.23-.17-.48-.29-.25-.12-1.48-.73-1.71-.81-.23-.08-.4-.12-.56.13-.17.25-.65.81-.79.98-.15.17-.29.19-.54.06-.25-.12-1.04-.38-1.99-1.23-.73-.66-1.23-1.46-1.37-1.71-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.37-.78-1.87-.2-.49-.41-.42-.56-.43-.14-.01-.31-.01-.48-.01Z" />
                    </svg>
                  </Box>
                  <Box
                    component="button"
                    onClick={() => handleShareRecord("facebook")}
                    disabled={sharingRecord}
                    aria-label="Compartir por Facebook"
                    sx={{
                      display: "grid", placeItems: "center", width: 44, height: 44, borderRadius: "50%",
                      backgroundColor: "#1877F2", color: "#fff", border: "none", cursor: "pointer",
                      opacity: sharingRecord ? 0.6 : 1,
                    }}
                  >
                    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor">
                      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95Z" />
                    </svg>
                  </Box>
                </Box>
              )}
            </Box>
          ) : (
            <Typography sx={{ fontSize: 13, color: "#888" }}>{t.recordEmptyBody}</Typography>
          )}
        </Box>

        {!adFree && (
          <HouseAdBanner
            slot="encastralo-home-double-banner-2"
            gameSlug="encastralo"
            locale={currentLanguage}
            format="banner_double"
          />
        )}

        <Box component="section" sx={{ backgroundColor: "rgba(0,0,0,0.18)", borderRadius: "24px", px: 2, py: 2.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#fff", mb: 1 }}>{t.whatIsTitle}</Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.7 }}>{t.whatIsBody}</Typography>
        </Box>

        <Box component="section" sx={{ backgroundColor: "rgba(0,0,0,0.18)", borderRadius: "24px", px: 2, py: 2.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#fff", mb: 1 }}>{t.howToPlayTitle}</Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.7 }}>{t.howToPlayBody}</Typography>
        </Box>

        <Box component="section" sx={{ backgroundColor: "rgba(0,0,0,0.18)", borderRadius: "24px", px: 2, py: 2.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#fff", mb: 1.5 }}>{t.faqTitle}</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
            {t.faq.map((item, i) => (
              <Box key={i}>
                <Typography sx={{ color: "#fff", fontWeight: 700, mb: 0.25 }}>{item.q}</Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.6, fontSize: 15 }}>
                  {item.a}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Banner fijo "anunciá acá" — no es un ad_slot real, nunca se
            reemplaza por una campaña comprada. Siempre hay un lugar visible
            para que alguien descubra que puede anunciar, incluso si todos
            los slots de verdad ya están vendidos. Reemplazado por el banner
            doble del hub (3 precios + URLs rotando) el 2026-10-10. */}
        {!adFree && (
          <>
            <HubAdPromoBanner locale={currentLanguage} />
            <ShareButtons locale={currentLanguage} />
          </>
        )}
      </Box>

      <LanguageSelector />
    </Layout>
  );
}
