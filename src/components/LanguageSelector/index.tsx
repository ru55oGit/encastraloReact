import React, { useState } from "react";
import {
  Box,
  IconButton,
  Popover,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
} from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";
import { useLanguage } from "../../i18n/LanguageContext";
import { SupportedLanguage } from "../../i18n/translations";

const LanguageSelector: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { currentLanguage, setLanguage, availableLanguages } = useLanguage();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageSelect = (languageCode: SupportedLanguage) => {
    setLanguage(languageCode);
    handleClose();
  };

  const open = Boolean(anchorEl);
  const id = open ? "language-popover" : undefined;

  return (
    <>
      {/* Fixed language button in bottom right */}
      <Box
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <IconButton
          onClick={handleClick}
          sx={{
            backgroundColor: "#ececef",
            border: "2px solid #f2a39a",
            color: "#e74c3c",
            width: 48,
            height: 48,
            fontSize: "20px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.12)",
            "&:hover": {
              backgroundColor: "#f4f4f6",
            },
          }}
          aria-describedby={id}
        >
          <LanguageIcon sx={{ fontSize: 24 }} />
        </IconButton>
      </Box>

      {/* Language selection popover */}
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            backgroundColor: "#2c3e50",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: 3,
            mt: -1,
            minWidth: 200,
            overflow: "hidden",
          },
        }}
      >
        <Paper
          sx={{
            backgroundColor: "#2c3e50",
            color: "#fff",
            boxShadow: "none",
          }}
        >
          <List sx={{ py: 0 }}>
            {availableLanguages.map((language) => (
              <ListItem key={language.code} disablePadding>
                <ListItemButton
                  onClick={() => handleLanguageSelect(language.code)}
                  selected={currentLanguage === language.code}
                  sx={{
                    py: 1.5,
                    px: 2,
                    "&.Mui-selected": {
                      backgroundColor: "rgba(241, 196, 15, 0.2)",
                      borderLeft: "3px solid #f1c40f",
                      "&:hover": {
                        backgroundColor: "rgba(241, 196, 15, 0.3)",
                      },
                    },
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      fontSize: "24px",
                    }}
                  >
                    {language.flag}
                  </ListItemIcon>
                  <ListItemText>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        sx={{
                          color:
                            currentLanguage === language.code
                              ? "#f1c40f"
                              : "#bdc3c7",
                          fontWeight:
                            currentLanguage === language.code ? 600 : 400,
                          fontSize: 14,
                        }}
                      >
                        {language.code.toUpperCase()}
                      </Typography>
                      <Typography
                        sx={{
                          color: "#fff",
                          fontWeight:
                            currentLanguage === language.code ? 600 : 400,
                          fontSize: 14,
                        }}
                      >
                        {language.name}
                      </Typography>
                    </Box>
                  </ListItemText>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      </Popover>
    </>
  );
};

export default LanguageSelector;
