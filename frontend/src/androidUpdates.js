export const releasesUrl = 'https://api.github.com/repos/simeon6969/simeon-ai-technician/releases?per_page=100'

export function newestAndroidUpdate(releases, installedBuild) {
  if (!Array.isArray(releases) || !Number.isSafeInteger(installedBuild) || installedBuild < 0) {
    throw new Error('Invalid update information')
  }
  return releases.flatMap(release => {
    const match = /^android-test-(\d+)$/.exec(release.tag_name || '')
    if (release.draft || !match) return []
    const build = Number(match[1])
    const url = `https://github.com/simeon6969/simeon-ai-technician/releases/download/${release.tag_name}/Simeon-test.apk`
    const asset = release.assets?.find(item => item.name === 'Simeon-test.apk' && item.state === 'uploaded' && item.size > 0 && item.browser_download_url === url)
    return asset && Number.isSafeInteger(build) && build > installedBuild ? [{ build, url }] : []
  }).sort((a, b) => b.build - a.build)[0] || null
}
