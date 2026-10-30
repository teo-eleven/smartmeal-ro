import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { USE_NATIVE_DRIVER } from '../../styles/motion';

interface AnimatedMealSlotProps {
  children: React.ReactNode;
  isDessert?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const AnimatedMealSlot: React.FC<AnimatedMealSlotProps> = ({
  children,
  isDessert,
  style,
}) => {
  const spawnAnim = useRef(new Animated.Value(isDessert ? 0 : 1)).current;

  useEffect(() => {
    if (isDessert) {
      Animated.parallel([
        Animated.timing(spawnAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.spring(spawnAnim, {
          toValue: 1,
          tension: 48,
          friction: 7,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]).start();
    }
  }, [isDessert, spawnAnim]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: spawnAnim,
          transform: [
            {
              scale: spawnAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.82, 1],
              }),
            },
            {
              translateY: spawnAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [24, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};
