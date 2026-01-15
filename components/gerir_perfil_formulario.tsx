import React from "react";
import { View } from "react-native";
import ElementoFormulario from "./elemento_formulario";

interface Props {
  formData: any;
  setFormData: (data: any) => void;
  isEditing: boolean;
}

const GerirPerfilFormulario = ({ formData, setFormData, isEditing }: Props) => {
  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <View className="w-full px-4">
      <ElementoFormulario
        label="Nome"
        value={formData.nome}
        onChangeText={(t) => updateField("nome", t)}
        editable={isEditing}
      />
      <ElementoFormulario
        label="Email"
        type="email"
        value={formData.email}
        onChangeText={(t) => updateField("email", t)}
        editable={isEditing}
      />
      <ElementoFormulario
        label="Contacto"
        value={formData.contacto}
        onChangeText={(t) => updateField("contacto", t)}
        editable={isEditing}
      />
      <ElementoFormulario
        label="NIF"
        value={formData.nif}
        onChangeText={(t) => updateField("nif", t)}
        editable={isEditing}
      />
      <ElementoFormulario
        label="Passord"
        type="password"
        value={formData.password}
        onChangeText={(t) => updateField("password", t)}
        editable={isEditing}
      />
    </View>
  );
};

export default GerirPerfilFormulario;
