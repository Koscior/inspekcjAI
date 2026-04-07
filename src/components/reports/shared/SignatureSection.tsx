import { View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { COLORS } from './PDFStyles'

const ss = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  signatureBlock: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 8,
    fontWeight: 'bold',
    color: COLORS.gray500,
    textTransform: 'uppercase',
    marginBottom: 8,
    fontFamily: 'Roboto',
  },
  signatureImageContainer: {
    width: 200,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  signatureImage: {
    maxWidth: 200,
    maxHeight: 60,
    objectFit: 'contain',
  },
  signatureLine: {
    width: 180,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray300,
    marginBottom: 4,
    marginTop: 54, // align with image height when no signature
  },
  name: {
    fontSize: 8,
    color: COLORS.gray600,
    fontFamily: 'Roboto',
  },
})

interface SignatureSectionProps {
  inspectorName: string
  inspectorSignatureBase64: string | null
  clientSignatureUrl: string | null
  clientLabel?: string
}

export function SignatureSection({
  inspectorName,
  inspectorSignatureBase64,
  clientSignatureUrl,
  clientLabel = 'Właściciel / Zarządca',
}: SignatureSectionProps) {
  return (
    <View style={ss.container}>
      {/* Inspector */}
      <View style={ss.signatureBlock}>
        <Text style={ss.label}>Osoba przeprowadzająca kontrolę</Text>
        {inspectorSignatureBase64 ? (
          <View style={ss.signatureImageContainer}>
            <Image src={inspectorSignatureBase64} style={ss.signatureImage} />
          </View>
        ) : (
          <View style={ss.signatureLine} />
        )}
        <Text style={ss.name}>{inspectorName}</Text>
      </View>

      {/* Client */}
      <View style={ss.signatureBlock}>
        <Text style={ss.label}>{clientLabel}</Text>
        {clientSignatureUrl ? (
          <View style={ss.signatureImageContainer}>
            <Image src={clientSignatureUrl} style={ss.signatureImage} />
          </View>
        ) : (
          <View style={ss.signatureLine} />
        )}
        <Text style={ss.name}>&nbsp;</Text>
      </View>
    </View>
  )
}
