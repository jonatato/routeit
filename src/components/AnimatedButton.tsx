import { motion } from 'framer-motion';
import { Button, type ButtonProps } from './ui/button';

type AnimatedButtonProps = ButtonProps & {
  children: React.ReactNode;
};

export function AnimatedButton({ children, ...props }: AnimatedButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <Button {...props}>{children}</Button>
    </motion.div>
  );
}
