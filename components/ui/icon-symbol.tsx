import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolView, SymbolViewProps, type SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import {
  OpaqueColorValue,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

const MAPPING: Partial<Record<string, MaterialIconName>> = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "gearshape.fill": "settings",
  "person.fill": "person",
  "chart.bar.fill": "bar-chart",
  "target": "track-changes",
  "clock.fill": "access-time",
  "plus": "add",
  "trash": "delete",
  "pencil": "edit",
  "hourglass": "hourglass-empty",
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = "regular",
}: {
  name: SymbolViewProps["name"];
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle | ViewStyle>;
  weight?: SymbolWeight;
}) {
  const materialIconName =
    typeof name === "string" ? MAPPING[name] : undefined;

  if (materialIconName) {
    return (
      <MaterialIcons
        color={color}
        size={size}
        name={materialIconName}
        style={style as StyleProp<TextStyle>}
      />
    );
  }

  return (
    <SymbolView
      weight={weight}
      tintColor={color}
      resizeMode="scaleAspectFit"
      name={name}
      style={style as StyleProp<ViewStyle>}
    />
  );
}