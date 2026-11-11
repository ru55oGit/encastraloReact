import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Collapse from "@mui/material/Collapse";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";

interface HowToPlayCollapseProps {
  title: string;
  body: string;
}

// Colapsado por default para no estorbar en pantalla mientras se juega —
// suma contenido de texto real a la pantalla de juego (que si no es pura
// UI sin texto) sin ocupar espacio visual hasta que alguien lo abre.
export default function HowToPlayCollapse({ title, body }: HowToPlayCollapseProps) {
  const [open, setOpen] = useState(false);
  return (
    <Box sx={{ borderRadius: "16px", backgroundColor: "rgba(0,0,0,0.18)", mt: 2, overflow: "hidden" }}>
      <Box
        onClick={() => setOpen((o) => !o)}
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5, cursor: "pointer" }}
      >
        <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{title}</Typography>
        <ExpandMoreRoundedIcon sx={{ color: "#fff", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </Box>
      <Collapse in={open}>
        <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 1.6, px: 2, pb: 2 }}>
          {body}
        </Typography>
      </Collapse>
    </Box>
  );
}
