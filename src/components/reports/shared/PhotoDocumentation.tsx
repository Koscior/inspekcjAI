import { Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { COLORS, styles as s } from './PDFStyles'
import { PageFooter } from './PageFooter'
import type { Photo } from '@/types/database.types'

const ps = StyleSheet.create({
  header: {
    backgroundColor: COLORS.gray600,
    color: COLORS.white,
    padding: 8,
    paddingHorizontal: 12,
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 12,
    borderRadius: 2,
    fontFamily: 'Roboto',
  },
  photoBlock: {
    marginBottom: 12,
    alignItems: 'center',
  },
  image: {
    maxWidth: '100%',
    maxHeight: 320,
    objectFit: 'contain',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  imageSmall: {
    maxWidth: '100%',
    maxHeight: 210,
    objectFit: 'contain',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  caption: {
    fontSize: 8,
    color: COLORS.gray600,
    textAlign: 'center',
    marginTop: 4,
    fontFamily: 'Roboto',
  },
  grid2: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  gridCol: {
    flex: 1,
    alignItems: 'center',
  },
})

interface PhotoDocumentationProps {
  photos: Photo[]
  photoImages: Record<string, string>
  photoNumberMap?: Record<string, number>  // photoId → PDF sequential number
  reportTitle: string
  reportNumber: string
  photosPerPage?: number  // 1, 2, 4, or 6
}

export function renderPhotoDocumentation({
  photos,
  photoImages,
  photoNumberMap,
  reportTitle,
  reportNumber,
  photosPerPage = 2,
}: PhotoDocumentationProps) {
  const photosWithImages = photos.filter((p) => photoImages[p.id])
  if (photosWithImages.length === 0) return null

  // Group photos into pages
  const pages: Photo[][] = []
  for (let i = 0; i < photosWithImages.length; i += photosPerPage) {
    pages.push(photosWithImages.slice(i, i + photosPerPage))
  }

  return (
    <>
      {pages.map((pagePhotos, pageIdx) => (
        <Page key={`photo-doc-${pageIdx}`} size="A4" style={s.page}>
          {/* Section header on first page only */}
          {pageIdx === 0 && (
            <Text style={ps.header}>
              DOKUMENTACJA FOTOGRAFICZNA — LICZBA ZDJĘĆ: {photosWithImages.length}
            </Text>
          )}

          {photosPerPage <= 2 ? (
            // 1-2 photos per page: large view
            pagePhotos.map((photo) => (
              <View key={photo.id} style={ps.photoBlock}>
                <Image src={photoImages[photo.id]} style={ps.image} />
                <Text style={ps.caption}>
                  Fot. {photoNumberMap?.[photo.id] ?? photo.photo_number}
                  {photo.caption ? ` — ${photo.caption}` : ''}
                </Text>
              </View>
            ))
          ) : (
            // 4-6 photos: grid 2 columns
            <View>
              {chunkArray(pagePhotos, 2).map((row, rowIdx) => (
                <View key={rowIdx} style={ps.grid2}>
                  {row.map((photo) => (
                    <View key={photo.id} style={ps.gridCol}>
                      <Image src={photoImages[photo.id]} style={ps.imageSmall} />
                      <Text style={ps.caption}>
                        Fot. {photo.photo_number}
                        {photo.caption ? ` — ${photo.caption}` : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          <PageFooter reportType={reportTitle} reportNumber={reportNumber} />
        </Page>
      ))}
    </>
  )
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}
