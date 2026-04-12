import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:54321'

export const storageHandlers = [
  // Upload file
  http.post(`${BASE}/storage/v1/object/*`, () => {
    return HttpResponse.json({
      Key: 'test/uploaded-file.jpg',
      Id: 'storage-file-1',
    })
  }),

  // Get signed URL
  http.post(`${BASE}/storage/v1/object/sign/*`, () => {
    return HttpResponse.json({
      signedUrl: 'https://test.supabase.co/storage/v1/object/sign/test/file?token=abc',
    })
  }),

  // List files
  http.get(`${BASE}/storage/v1/object/list/*`, () => {
    return HttpResponse.json([])
  }),

  // Delete files
  http.delete(`${BASE}/storage/v1/object/*`, () => {
    return HttpResponse.json([])
  }),
]
