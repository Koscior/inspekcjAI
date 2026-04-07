import { Text, View, StyleSheet } from '@react-pdf/renderer'
import { COLORS } from './PDFStyles'

const s = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    paddingTop: 6,
  },
  text: {
    fontSize: 7,
    color: COLORS.gray400,
    fontFamily: 'Roboto',
  },
})

interface PageFooterProps {
  reportType: string
  reportNumber: string
}

export function PageFooter({ reportType, reportNumber }: PageFooterProps) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.text}>{reportType} — {reportNumber}</Text>
      <Text style={s.text} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  )
}
