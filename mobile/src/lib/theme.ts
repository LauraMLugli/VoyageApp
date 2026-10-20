// Paleta Voyage (baseada em cores.css e logo.css)
export const colors = {
  navy: "#192440",
  navyDeep: "#0A1F3D",
  blueDark: "#0F2C59",
  blue: "#0951A0",
  blueMedium: "#327BA5",
  teal: "#419CA6",
  green: "#3EB497",
  accent: "#00C9A7",
  greenLight: "#E0F2F1",
  greenMedium: "#C8E6C9",
  background: "#F0FAF9",
  surface: "#FFFFFF",
  text: "#192440",
  textMedium: "#555555",
  textMuted: "#666666",
  textLight: "#999999",
  border: "#E1EEEC",
  gray: "#CCCCCC",
  grayLight: "#F0F0F0",
  danger: "#D64545",
  dangerLight: "#FDECEC",
  warning: "#E8A317",
  warningLight: "#FFF4DB",
  success: "#00A887",
  purple: "#7B2CFF",
};

export const gradients = {
  // gradiente da marca: verde-água -> azul escuro
  voyage: ["#00C9A7", "#0F2C59"] as const,
  card: ["#192440", "#0951A0"] as const,
  button: ["#0951A0", "#327BA5"] as const,
};

export const radius = { sm: 10, md: 14, lg: 20, xl: 28 };

export const shadow = {
  shadowColor: "#0F2C59",
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};
