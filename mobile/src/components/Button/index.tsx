
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { ElementType } from "react";

interface ButtonFatecProps {
  text: string;
  action : () => void;
  icon: ElementType;
  iconName: string;
  
}

export function ButtonFatec({
  text, action, icon:Icon, iconName}:ButtonFatecProps) {
  return (
    <TouchableOpacity 
      onPress={action} 
      style={[estilos.container]}
    >
      <Icon name={iconName} size={24} color="#fff" />
      <Text 
        style={estilos.title}
        > {text} </Text>
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 52,
    backgroundColor: "green",
    borderRadius: 10,
    flexDirection: "row",
    gap: 15,
  },
  title: {
    color: "#fff",
  },
});
