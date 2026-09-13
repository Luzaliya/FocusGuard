import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme();

  const colorFromProps = props[theme === "dark" ? "dark" : "light"];

  if (colorFromProps) {
    return colorFromProps;
  }

  return Colors[theme === "dark" ? "dark" : "light"][colorName];
}