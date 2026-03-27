import {
  type ClassNameValue,
  extendTailwindMerge,
  twMerge,
} from 'tailwind-merge'

const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['xss', 'ssm'] }],
    },
  },
})

export function cn(...inputs: ClassNameValue[]) {
  return customTwMerge(twMerge(...inputs))
}
