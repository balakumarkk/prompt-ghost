import React, { useState, useEffect } from "react"
import { useStorage } from "@plasmohq/storage/hook"
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  InputAdornment,
  Paper,
  Divider
} from "@mui/material"
import { Visibility, VisibilityOff, Settings, Circle } from "@mui/icons-material"

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#90caf9"
    },
    background: {
      default: "#121212",
      paper: "#1e1e1e"
    }
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif'
  }
})

const DEFAULT_MODELS: Record<string, string[]> = {
  groq: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
  anthropic: ["claude-3-5-sonnet-latest", "claude-3-5-haiku-latest", "claude-3-opus-latest"],
  custom: []
}

const PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "groq", label: "Groq" },
  { value: "anthropic", label: "Anthropic" },
  { value: "custom", label: "Custom (OpenAI Compatible)" }
]

export default function Popup() {
  const [enabled, setEnabled] = useStorage<boolean>("pg_enabled", true)
  const [provider, setProvider] = useStorage<string>("pg_provider", "openai")
  const [apiKey, setApiKey] = useStorage<string>("pg_api_key", "")
  const [baseUrl, setBaseUrl] = useStorage<string>("pg_base_url", "")
  const [selectedModel, setSelectedModel] = useStorage<string>("pg_model", "gpt-4o-mini")
  const [customModel, setCustomModel] = useStorage<string>("pg_custom_model", "")

  const [showApiKey, setShowApiKey] = useState(false)

  // Ensure default model updates when provider changes
  useEffect(() => {
    if (provider && provider !== "custom") {
      const defaults = DEFAULT_MODELS[provider]
      if (defaults && defaults.length > 0 && !defaults.includes(selectedModel)) {
        setSelectedModel(defaults[0])
      }
    } else if (provider === "custom") {
      setSelectedModel("custom")
    }
  }, [provider])

  const handleToggleShowApiKey = () => {
    setShowApiKey(!showApiKey)
  }

  const getStatusTextAndColor = () => {
    if (!enabled) {
      return { text: "Disabled", color: "#f44336" }
    }
    if (!apiKey) {
      return { text: "API Key Required", color: "#ff9800" }
    }
    const modelToShow = selectedModel === "custom" ? customModel : selectedModel
    return { text: `Active (${modelToShow || "no model"})`, color: "#4caf50" }
  }

  const status = getStatusTextAndColor()

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Paper
        elevation={0}
        sx={{
          width: 360,
          p: 2.5,
          borderRadius: 0,
          background: "linear-gradient(135deg, #1e1e1e 0%, #121212 100%)",
          minHeight: 450,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Settings color="primary" sx={{ fontSize: 24 }} />
              <Typography variant="h6" sx={{ letterSpacing: 0.5, fontWeight: 700 }}>
                Prompt Ghost Settings
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={enabled ?? true}
                  onChange={(e) => setEnabled(e.target.checked)}
                  color="primary"
                />
              }
              label=""
              sx={{ mr: 0 }}
            />
          </Box>

          <Divider sx={{ mb: 2.5, opacity: 0.1 }} />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="provider-select-label">LLM Provider</InputLabel>
              <Select
                labelId="provider-select-label"
                value={provider || "openai"}
                label="LLM Provider"
                onChange={(e) => setProvider(e.target.value)}
              >
                {PROVIDERS.map((p) => (
                  <MenuItem key={p.value} value={p.value}>
                    {p.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              size="small"
              label="API Key"
              type={showApiKey ? "text" : "password"}
              value={apiKey || ""}
              onChange={(e) => setApiKey(e.target.value)}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleToggleShowApiKey} edge="end" size="small">
                        {showApiKey ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />

            {provider === "custom" && (
              <TextField
                fullWidth
                size="small"
                label="Custom Base URL"
                placeholder="https://api.example.com/v1"
                value={baseUrl || ""}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            )}

            {provider !== "custom" && (
              <FormControl fullWidth size="small">
                <InputLabel id="model-select-label">Model</InputLabel>
                <Select
                  labelId="model-select-label"
                  value={selectedModel || ""}
                  label="Model"
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  {(DEFAULT_MODELS[provider || "openai"] || []).map((m) => (
                    <MenuItem key={m} value={m}>
                      {m}
                    </MenuItem>
                  ))}
                  <MenuItem value="custom">Custom Override...</MenuItem>
                </Select>
              </FormControl>
            )}

            {(provider === "custom" || selectedModel === "custom") && (
              <TextField
                fullWidth
                size="small"
                label="Model Name"
                placeholder={provider === "custom" ? "e.g. llama3" : "e.g. gpt-4o-mini"}
                value={customModel || ""}
                onChange={(e) => setCustomModel(e.target.value)}
              />
            )}
          </Box>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 1.5, opacity: 0.1 }} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.5 }}>
            <Circle sx={{ fontSize: 10, color: status.color }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              Status: <span style={{ color: "#ffffff" }}>{status.text}</span>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </ThemeProvider>
  )
}
