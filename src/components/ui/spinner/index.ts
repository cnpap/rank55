import { cva, type VariantProps } from 'class-variance-authority';

export { default as Spinner } from './Spinner.vue';

export const spinnerVariants = cva(
  "inline-flex items-center justify-center",
  {
    variants: {
      variant: {
        default: "text-current",
        pulse: "text-current",
        dots: "text-current",
        wave: "text-current", 
        ring: "text-current",
        smooth: "text-current",
      },
      size: {
        xs: "h-3 w-3",
        sm: "h-4 w-4", 
        default: "h-5 w-5",
        lg: "h-6 w-6",
        xl: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export type SpinnerVariants = VariantProps<typeof spinnerVariants>;