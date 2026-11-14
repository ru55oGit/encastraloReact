import { Children, PointerEvent, ReactNode, useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";

const ACCENT = "#e74c3c";
// Umbral de arrastre horizontal (px) para contar como swipe y no como un
// tap/scroll vertical accidental.
const SWIPE_THRESHOLD_PX = 40;

interface CarouselProps {
  children: ReactNode[];
  ariaLabel?: string;
}

// Carrusel chico de un solo uso por ahora (récord de cada modalidad en
// Home) pero genérico — nada de swiper/slick: con 3 slides no justifica
// una dependencia nueva. La altura del contenedor sigue a la del slide
// activo (las 3 cards de récord tienen contenido de largo muy distinto).
export default function Carousel({ children, ariaLabel }: CarouselProps) {
  const slides = Children.toArray(children);
  const [index, setIndex] = useState(0);
  const [height, setHeight] = useState<number>();
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dragStartX = useRef<number | null>(null);

  useEffect(() => {
    const el = slideRefs.current[index];
    if (el && el.offsetHeight !== height) setHeight(el.offsetHeight);
  });

  function goTo(next: number) {
    setIndex((next + slides.length) % slides.length);
  }

  function handlePointerDown(e: PointerEvent) {
    dragStartX.current = e.clientX;
  }

  function handlePointerUp(e: PointerEvent) {
    if (dragStartX.current === null) return;
    const delta = e.clientX - dragStartX.current;
    dragStartX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    goTo(index + (delta < 0 ? 1 : -1));
  }

  return (
    <Box aria-label={ariaLabel}>
      <Box
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        sx={{ overflow: "hidden", height, transition: "height 0.25s ease", touchAction: "pan-y" }}
      >
        <Box sx={{
          display: "flex",
          alignItems: "flex-start",
          width: `${slides.length * 100}%`,
          transform: `translateX(-${index * (100 / slides.length)}%)`,
          transition: "transform 0.3s ease",
        }}>
          {slides.map((slide, i) => (
            <Box
              key={i}
              ref={(el: HTMLDivElement | null) => {
                slideRefs.current[i] = el;
              }}
              sx={{ flex: `0 0 ${100 / slides.length}%`, minWidth: 0 }}
            >
              {slide}
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "center", gap: 0.75, mt: 1.5 }}>
        {slides.map((_, i) => (
          <Box
            key={i}
            component="button"
            onClick={() => goTo(i)}
            aria-label={`${i + 1}/${slides.length}`}
            sx={{
              width: i === index ? 18 : 8, height: 8, borderRadius: 999, p: 0,
              border: "none", cursor: "pointer",
              backgroundColor: i === index ? ACCENT : "#ddd",
              transition: "width 0.2s ease, background-color 0.2s ease",
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
