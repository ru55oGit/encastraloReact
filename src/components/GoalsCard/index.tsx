import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const ACCENT = "#e74c3c";

interface GoalsCardProps {
  title: string;
  thresholds: number[];
  // Valor más alto logrado hasta ahora en esta partida (largo de palabra
  // en "words", suma lograda en "numbers") — cada umbral <= este valor
  // cuenta como cumplido.
  achieved: number;
  nextGoalLabel: (value: number) => string;
  completeLabel: string;
}

export default function GoalsCard({ title, thresholds, achieved, nextGoalLabel, completeLabel }: GoalsCardProps) {
  const nextGoal = thresholds.find((threshold) => achieved < threshold);

  return (
    <Box sx={{ borderRadius: "16px", backgroundColor: "#fff", p: 1.5, mb: 1 }}>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", mb: 0.75 }}>
        {title}
      </Typography>
      <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#222", mb: 1 }}>
        {nextGoal ? nextGoalLabel(nextGoal) : completeLabel}
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 0.75 }}>
        {thresholds.map((threshold) => {
          const done = achieved >= threshold;
          const isNext = threshold === nextGoal;
          return (
            <Box
              key={threshold}
              sx={{
                flexShrink: 0,
                width: 22,
                height: 22,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 10,
                backgroundColor: done ? "#22c55e" : isNext ? `${ACCENT}1a` : "#f3f3f3",
                color: done ? "#fff" : isNext ? ACCENT : "#bbb",
                border: isNext ? `2px solid ${ACCENT}` : "none",
              }}
            >
              {done ? "✓" : threshold}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
