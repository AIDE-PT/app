import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import CalendarIcon from '../svg/CalendarIcon';
import AddIcon from '../svg/AddIcon';
import ProfileIcon from '../svg/ProfileIcon';
import HomeIcon from '../svg/HomeIcon';

interface navBarProps {
  dark?: boolean
}
const Navbar = ({ dark }: navBarProps) => {

  const styleBall = "items-center bg-white  w-[56px] h-[56px] rounded-[100px] justify-center"

  return (
    <>
    <View className='w-200' />
      <View className="absolute bottom-6 left-6 right-6">
        <View style={{ boxShadow: '0 4px 24.1px 0 rgba(0, 0, 0, 0.25)', backgroundColor: dark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(219, 237, 248, 0.90)' }} className="flex-row justify-between items-center p-2 rounded-[100px] border border-white/10">
          <TouchableOpacity className={styleBall}>

            <AddIcon />
          </TouchableOpacity>

          <TouchableOpacity className={styleBall}>
            <CalendarIcon />
          </TouchableOpacity>

          <TouchableOpacity className={styleBall}>
            <HomeIcon />
          </TouchableOpacity>

          <TouchableOpacity className={styleBall}>
            <ProfileIcon />
          </TouchableOpacity>

        </View>
      </View>
    </>

  );
};

export default Navbar;