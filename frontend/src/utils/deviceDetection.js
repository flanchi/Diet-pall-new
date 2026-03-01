/**
 * Detects device type based on user agent
 * @returns {object} { isMobile: boolean, isAndroid: boolean, isIOS: boolean, deviceType: 'phone'|'tablet'|'desktop' }
 */
export function detectDevice() {
  const userAgent = navigator.userAgent.toLowerCase()

  const isAndroid = /android/.test(userAgent)
  const isIOS = /iphone|ipad|ipod/.test(userAgent)
  const isMobile = isAndroid || isIOS
  
  // Detect tablet vs phone
  let deviceType = 'desktop'
  if (isMobile) {
    if (/tablet|ipad|playbook|silk/.test(userAgent)) {
      deviceType = 'tablet'
    } else {
      deviceType = 'phone'
    }
  }

  return {
    isMobile,
    isAndroid,
    isIOS,
    deviceType,
    userAgent
  }
}

/**
 * Check if user is on a mobile phone (not tablet, not desktop)
 */
export function isPhoneUser() {
  const { deviceType } = detectDevice()
  return deviceType === 'phone'
}

/**
 * Check if user is on Android
 */
export function isAndroidUser() {
  const { isAndroid } = detectDevice()
  return isAndroid
}
