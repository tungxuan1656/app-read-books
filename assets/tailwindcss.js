const FontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
}

const typoClasses = {
  '.typo-title': {
    fontSize: '48px',
    fontWeight: FontWeight.bold,
  },

  '.typo-h1-bold': { fontSize: '32px', fontWeight: FontWeight.bold },
  '.typo-h1-semibold': { fontSize: '32px', fontWeight: FontWeight.semibold },
  '.typo-h1-medium': { fontSize: '32px', fontWeight: FontWeight.medium },
  '.typo-h1-regular': { fontSize: '32px', fontWeight: FontWeight.regular },

  '.typo-h2-bold': { fontSize: '24px', fontWeight: FontWeight.bold },
  '.typo-h2-semibold': { fontSize: '24px', fontWeight: FontWeight.semibold },
  '.typo-h2-medium': { fontSize: '24px', fontWeight: FontWeight.medium },
  '.typo-h2-regular': { fontSize: '24px', fontWeight: FontWeight.regular },

  '.typo-h3-bold': { fontSize: '20px', fontWeight: FontWeight.bold },
  '.typo-h3-semibold': { fontSize: '20px', fontWeight: FontWeight.semibold },
  '.typo-h3-medium': { fontSize: '20px', fontWeight: FontWeight.medium },
  '.typo-h3-regular': { fontSize: '20px', fontWeight: FontWeight.regular },

  '.typo-h4-bold': { fontSize: '18px', fontWeight: FontWeight.bold },
  '.typo-h4-semibold': { fontSize: '18px', fontWeight: FontWeight.semibold },
  '.typo-h4-medium': { fontSize: '18px', fontWeight: FontWeight.medium },
  '.typo-h4-regular': { fontSize: '18px', fontWeight: FontWeight.regular },

  '.typo-headline-bold': { fontSize: '16px', fontWeight: FontWeight.bold },
  '.typo-headline-semibold': { fontSize: '16px', fontWeight: FontWeight.semibold },
  '.typo-headline-medium': { fontSize: '16px', fontWeight: FontWeight.medium },
  '.typo-headline-regular': { fontSize: '16px', fontWeight: FontWeight.regular },

  '.typo-body-bold': { fontSize: '14px', fontWeight: FontWeight.bold },
  '.typo-body-semibold': { fontSize: '14px', fontWeight: FontWeight.semibold },
  '.typo-body-medium': { fontSize: '14px', fontWeight: FontWeight.medium },
  '.typo-body-regular': { fontSize: '14px', fontWeight: FontWeight.regular },

  '.typo-footnote-bold': { fontSize: '13px', fontWeight: FontWeight.bold },
  '.typo-footnote-semibold': { fontSize: '13px', fontWeight: FontWeight.semibold },
  '.typo-footnote-medium': { fontSize: '13px', fontWeight: FontWeight.medium },
  '.typo-footnote-regular': { fontSize: '13px', fontWeight: FontWeight.regular },

  '.typo-caption-bold': { fontSize: '12px', fontWeight: FontWeight.bold },
  '.typo-caption-semibold': { fontSize: '12px', fontWeight: FontWeight.semibold },
  '.typo-caption-medium': { fontSize: '12px', fontWeight: FontWeight.medium },
  '.typo-caption-regular': { fontSize: '12px', fontWeight: FontWeight.regular },

  '.typo-mini-bold': { fontSize: '10px', fontWeight: FontWeight.bold },
  '.typo-mini-semibold': { fontSize: '10px', fontWeight: FontWeight.semibold },
  '.typo-mini-medium': { fontSize: '10px', fontWeight: FontWeight.medium },
  '.typo-mini-regular': { fontSize: '10px', fontWeight: FontWeight.regular },
}

const appColorsClasses = {
  white: '#ffffff',
  black: '#1a1e22ff',

  bgMain: '#ffffff',
  bgExtra: '#f6f8fa',
  bgBlur: '#eaeef2',
  bgDisabled: '#d0d7de',
  bgValidate: '#ffcecb',
  bgActivate: '#aceebb',
  bgFocus: '#b6e3ff',
  bgWarning: '#ffd8b5',
  bgGrayOpacity: '#57606aFA',

  strokeMain: '#eaeef2',
  strokeExtra: '#d0d7de',
  strokeBold: '#afb8c1',

  textMain: '#1a1e22ff',
  textExtra: '#424a53',
  textBlur: '#6e7781',
  textDisabled: '#8c959f',
  textFocus: '#0969da',
  textValidate: '#fa4549',
  textWarning: '#e16f24',
  textActivate: '#2da44e',

  buttonMain: '#1a1e22ff',
  buttonExtra: '#424a53',
  buttonBlur: '#6e7781',
  buttonFocus: '#218bff',
  buttonValidate: '#fa4549',
  buttonDisabled: '#8c959f',
  buttonActivate: '#2da44e',
  buttonWarning: '#e16f24',
  buttonHighlight: '#eac54f',

  switchThumb: '#ffffff',
  switchTrackTrue: '#218bff',
  switchTrackFalse: '#afb8c1',

  primary: '#0969da',
}

module.exports = {
  FontWeight,
  typoClasses,
  appColorsClasses,
}
