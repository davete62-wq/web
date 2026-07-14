import { ReactNode } from 'react';
import { Pressable, PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = PressableProps & {
  children: ReactNode;
  className?: string;
};

export default function ScaleButton({ children, className = '', onPressIn, onPressOut, ...props }: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      {...props}
      className={className}
      style={animatedStyle}
      onPressIn={(event) => {
        scale.value = withSpring(0.96, { damping: 14, stiffness: 280 });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withSpring(1, { damping: 14, stiffness: 280 });
        onPressOut?.(event);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}
