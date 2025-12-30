import React from 'react';
import { Modal, View, StyleSheet, Pressable } from 'react-native';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface BottomModalProps{
   visible: boolean;
    onClose: any, 
    children?: any,
}

export default function BottomModal({ visible, onClose, children }:BottomModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className='flex-1' onPress={onClose} />

      <View className='overflow-y-auto h-[60%] bg-[#DBEDF8] pt-3 px-4 pb-6 rounded-t-[30px]'>
        {/* Handle */}
        <View className='w-10 h-1 rounded-2 bg-[#C7C7C7] self-center mb-4' />
        <SafeAreaView  className="flex-1 bg-DBEDF8">
          <ScrollView>
            {children}
          </ScrollView>
        </SafeAreaView>


      </View>
    </Modal>
  );
}
