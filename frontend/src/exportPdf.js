import { Capacitor } from '@capacitor/core'

export async function exportPdf(pdf, filename) {
  if (!Capacitor.isNativePlatform()) {
    pdf.save(filename)
    return
  }
  const { Filesystem, Directory } = await import('@capacitor/filesystem')
  const { Share } = await import('@capacitor/share')
  const file = await Filesystem.writeFile({
    path: filename,
    data: pdf.output('datauristring').split(',')[1],
    directory: Directory.Cache,
  })
  // Sharing the app's private cache avoids requesting broad storage access.
  try {
    await Share.share({ title: filename, files: [file.uri] })
  } finally {
    await Filesystem.deleteFile({ path: filename, directory: Directory.Cache }).catch(() => {})
  }
}
