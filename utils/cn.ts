import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge, twMerge } from 'tailwind-merge'

const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['xss', 'ssm'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(twMerge(clsx(inputs)))
}
