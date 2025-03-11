export const convertTTS = async (text: string) => {
  const myHeaders = new Headers()
  myHeaders.append('accept', '*/*')
  myHeaders.append('accept-language', 'en-US,en;q=0.9')
  myHeaders.append('authority', 'play.ht')
  myHeaders.append('content-type', 'application/x-www-form-urlencoded')
  myHeaders.append(
    'user-agent',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  )
  myHeaders.append('x-requested-with', 'XMLHttpRequest')
  myHeaders.append('origin', 'null')
  myHeaders.append('host', 'play.ht')
  myHeaders.append('Pragma', 'no-cache')
  myHeaders.append('Cache-Control', 'no-cache')

  const details: { [key: string]: string } = {
    globalSpeed: '120%',
    globalVolume: '0dB',
    narrationStyle: 'regular',
    platform: 'landing_demo',
    ssml: `<speak><p>${text}</p></speak>`,
    userId: '5pe8l4FrdbczcoHOBkUtp0W37Gh2',
    voice: 'vi-VN-Wavenet-A',
  }

  var formBody: string[] = []
  for (var property in details) {
    var encodedKey = encodeURIComponent(property)
    var encodedValue = encodeURIComponent(details[property])
    formBody.push(encodedKey + '=' + encodedValue)
  }
  const body = formBody.join('&')

  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: body,
    redirect: 'follow' as RequestRedirect,
  }

  try {
    await fetch('https://play.ht/api/transcribe', requestOptions)
    const response = await fetch('https://play.ht/api/transcribe', requestOptions)
    const result = await response.json()
    if (result.file) {
      return result.file
    }
    return null
  } catch (error) {
    console.error(error)
    return null
  }
}

export const splitContentToParagraph = (content: string) => {
  if (!content) return []

  const lines = content.split('\n').map((line) => line.trim()).filter((line) => line)
  const paragraphs: string[] = []
  let currentParagraph = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Skip empty lines
    if (!line) continue

    // Skip the first line
    if (i === 0) continue

    // If adding this line would make the paragraph exceed 1000 chars
    // and we already have some content, start a new paragraph
    if (currentParagraph.length >= 1000) {
      paragraphs.push(currentParagraph)
      currentParagraph = line
    } else {
      // Add a space between lines if the current paragraph is not empty
      if (currentParagraph) {
        currentParagraph += ' ' + line
      } else {
        currentParagraph = line
      }
    }
  }

  // Add the last paragraph if it has content
  if (currentParagraph) {
    paragraphs.push(currentParagraph)
  }

  return paragraphs
}
