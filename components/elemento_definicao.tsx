import React from 'react';
import { View } from 'react-native';
import { Button } from './buttons/button'; // Teu componente BUTTON - LIST

interface Props {
  title: string;
  onPress: () => void;
}

const ElementoDefinicao = ({ title, onPress }: Props) => {
  return (
    <View className="mb-4 w-full px-6">
      <Button 
        title={title} 
        onPress={onPress} 
        variant="list" 
      />
    </View>
  );
};

export default ElementoDefinicao;