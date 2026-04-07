import { Font } from '@react-pdf/renderer'

// Register Roboto family — supports Polish characters (ą, ć, ę, ł, ń, ó, ś, ź, ż)
Font.register({
  family: 'Roboto',
  fonts: [
    { src: '/fonts/Roboto-Regular.ttf', fontWeight: 'normal', fontStyle: 'normal' },
    { src: '/fonts/Roboto-Bold.ttf', fontWeight: 'bold', fontStyle: 'normal' },
    { src: '/fonts/Roboto-Italic.ttf', fontWeight: 'normal', fontStyle: 'italic' },
  ],
})

// Disable hyphenation for Polish text
Font.registerHyphenationCallback((word) => [word])
