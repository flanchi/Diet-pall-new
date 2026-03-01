/**
 * Detects device type based on user agent and screen size
 * @returns {object} { isMobile: boolean, isAndroid: boolean, isIOS: boolean, deviceType: 'phone'|'tablet'|'desktop' }
 */
export function detectDevice() {
  const userAgent = navigator.userAgent.toLowerCase()

  const isAndroid = /android/.test(userAgent)
  const isIOS = /iphone|ipad|ipod/.test(userAgent)
  const isMobile = isAndroid || isIOS
  
  // Also check for common mobile indicators
  const mobileIndicators = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini|webos|kindle/i
  const isMobileByUserAgent = mobileIndicators.test(userAgent)
  
  // Check for touch support as additional indicator
  const isTouchDevice = () => {
    return (
      (typeof window !== 'undefined' &&
        ('ontouchstart' in window ||
          navigator.maxTouchPoints > 0 ||
          navigator.msMaxTouchPoints > 0))
    )
  }
  
  // Detect tablet vs phone
  let deviceType = 'desktop'
  if (isMobile || isMobileByUserAgent) {
    if (/tablet|ipad|playbook|silk|sm-t|gt-p/.test(userAgent)) {
      deviceType = 'tablet'
    } else {
      // If it has touch support and small viewport, likely a phone
      deviceType = 'phone'
    }
  } else if (isTouchDevice() && window.innerWidth < 768) {
    // Fallback: small touch device without mobile user agent
    deviceType = 'phone'
  }

  console.log('Device Detection:', {
    deviceType,
    userAgent: userAgent.substring(0, 50),
    isAndroid,
    isIOS,
    isMobileByUserAgent,
    isTouchDevice: isTouchDevice(),
    viewportWidth: window.innerWidth
  })

  return {
    isMobile: isMobile || isMobileByUserAgent,
    isAndroid,
    isIOS,
    deviceType,
    userAgent,
    isTouchDevice: isTouchDevice()
  }
}

/**
 * Check if user is on a mobile phone (not tablet, not desktop)
 */
export function isPhoneUser() {
  try {
    const { deviceType } = detectDevice()
    return deviceType === 'phone'
  } catch (error) {
    console.error('Error detecting phone user:', error)
    return false
  }
}

/**
 * Check if user is on Android
 */
export function isAndroidUser() {
  try {
    const { isAndroid, isMobileByUserAgent } = detectDevice()
    return isAndroid || /android/i.test(navigator.userAgent)
  } catch (error) {
    console.error('Error detecting Android user:', error)
    return false
  }
}
