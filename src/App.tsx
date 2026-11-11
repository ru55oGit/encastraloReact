import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import Home from "./pages/Home";
import Game from "./pages/game";
import PrivacyPolicy from "./pages/PrivacyPolicy";

const theme = createTheme({
  palette: {
    primary: { main: "#e74c3c" },
    background: { default: "#a34747" },
  },
  typography: {
    fontFamily: "'Nunito', 'Roboto', sans-serif",
  },
  shape: { borderRadius: 8 },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game" element={<Game />} />
          <Route path="/privacidad" element={<PrivacyPolicy />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
