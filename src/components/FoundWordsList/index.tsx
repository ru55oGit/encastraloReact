import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const ACCENT = "#e74c3c";

export interface FoundWordEntry {
  word: string;
  points: number;
}

interface FoundWordsListProps {
  title: string;
  emptyLabel: string;
  words: FoundWordEntry[];
  scoreLabel?: string;
  score?: number;
}

export default function FoundWordsList({ title, emptyLabel, words, scoreLabel, score }: FoundWordsListProps) {
  return (
    <Box sx={{
      width: "100%", borderRadius: "12px", backgroundColor: "#f3f3f3",
      p: 1.5, minHeight: 88, display: "flex", flexDirection: "column", gap: 0.75,
    }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography sx={{ fontSize: 11, color: "#888", fontWeight: 700, textTransform: "uppercase" }}>
          {title} ({words.length})
        </Typography>
        {score !== undefined && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography sx={{ fontSize: 11, color: "#888", fontWeight: 700, textTransform: "uppercase" }}>
              {scoreLabel}
            </Typography>
            <Typography sx={{ color: ACCENT, fontWeight: 900, fontSize: 16, fontFamily: "monospace" }}>
              {score}
            </Typography>
          </Box>
        )}
      </Box>
      {words.length === 0 ? (
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Typography sx={{ fontSize: 13, color: "#aaa", textAlign: "center" }}>{emptyLabel}</Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          {words.map((entry, i) => (
            <Box key={`${entry.word}-${i}`} sx={{
              px: 1.25, py: 0.5, borderRadius: "6px",
              backgroundColor: `${ACCENT}18`, border: `1px solid ${ACCENT}55`,
              display: "flex", alignItems: "center", gap: 0.5,
            }}>
              <Typography sx={{ color: ACCENT, fontFamily: "monospace", fontSize: 13, fontWeight: 800 }}>
                {entry.word}
              </Typography>
              <Typography sx={{ color: "#999", fontSize: 10, fontWeight: 700 }}>
                +{entry.points}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
