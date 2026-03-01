import React, { useEffect, useState } from "react"
import MaterialIcon from "../utils/MaterialIcon"

export default function MobileAppRedirect() {
  const [isInstalling, setIsInstalling] = useState(false)

  const APK_DOWNLOAD_URL = "https://github.com/flanchi/Diet-pall-new/releases/download/v1.0.0-android/app-debug.apk"

  const handleDownload = () => {
    setIsInstalling(true)
    // Open download link
    window.location.href = APK_DOWNLOAD_URL
    
    // Analytics/logging
    console.log("User initiated APK download")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg">
            <MaterialIcon name="phone_android" size="48px" className="text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            Get Diet Pal
            <br />
            Mobile App
          </h1>
          <p className="text-lg text-slate-600">
            For the best experience on your phone, install our native Android app!
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <MaterialIcon name="check_circle" size="24px" className="text-green-500" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-900">Faster Performance</p>
              <p className="text-sm text-slate-600">Optimized for your device</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <MaterialIcon name="check_circle" size="24px" className="text-green-500" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-900">Offline Support</p>
              <p className="text-sm text-slate-600">Access features offline</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <MaterialIcon name="check_circle" size="24px" className="text-green-500" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-900">Push Notifications</p>
              <p className="text-sm text-slate-600">Stay updated on your health</p>
            </div>
          </div>
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={isInstalling}
          className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold py-4 px-6 rounded-full transition shadow-lg flex items-center justify-center gap-3 text-lg"
        >
          <MaterialIcon name="download" size="24px" />
          {isInstalling ? "Downloading..." : "Download APK"}
        </button>

        {/* System Requirements */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <MaterialIcon name="info" size="20px" className="text-blue-600" />
            Requirements
          </h3>
          <ul className="text-sm text-slate-700 space-y-1">
            <li>✓ Android 7.0 or higher</li>
            <li>✓ 50MB free storage space</li>
            <li>✓ Install from unknown sources enabled</li>
          </ul>
        </div>

        {/* Installation Guide */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <MaterialIcon name="help" size="20px" className="text-amber-600" />
            Installation Steps
          </h3>
          <ol className="text-sm text-slate-700 space-y-1 text-left">
            <li>1. Click "Download APK" button above</li>
            <li>2. Open Downloads folder after download completes</li>
            <li>3. Tap the APK file to install</li>
            <li>4. Allow unknown sources if prompted</li>
            <li>5. Follow on-screen installation steps</li>
          </ol>
        </div>

        {/* Continue to Web Version */}
        <div className="pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-600 mb-3">
            Prefer the web version?
          </p>
          <a
            href="/"
            onClick={(e) => {
              // This won't actually work since we're redirecting, 
              // but providing context for user
              e.preventDefault()
              alert("Please disable mobile detection or use a desktop browser to access the web version.")
            }}
            className="text-primary-600 hover:text-primary-700 font-semibold text-sm"
          >
            Continue to Web Version →
          </a>
        </div>

        {/* FAQ */}
        <div className="text-xs text-slate-500 space-y-1">
          <p>Questions? Contact us at support@dietpal.com</p>
          <p>Version: 1.0.0 • Last updated: Mar 1, 2026</p>
        </div>
      </div>
    </div>
  )
}
