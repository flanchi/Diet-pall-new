import React from 'react'
import MaterialIcon from '../utils/MaterialIcon'

export default function Contact() {
  return (
    <div className="space-y-6">
      {/* Consultation Booking Card */}
      <div className="glass rounded-2.5xl p-6 border border-white/20 shadow-lg backdrop-blur-sm bg-white/40">
        <div className="flex items-start gap-4">
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-4 flex-shrink-0">
            <MaterialIcon name="person" size="32px" filled={true} />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">One-on-One Consultation</h3>
            <p className="text-slate-600 mb-4">Book a personalized consultation with our nutrition specialist to discuss your health goals and dietary needs.</p>
            
            <div className="space-y-3 bg-white/60 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary-100 rounded-full p-2">
                  <MaterialIcon name="phone" size="20px" className="text-primary-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-semibold">PHONE</p>
                  <p className="text-lg font-bold text-slate-900">+1 868 1234567</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-primary-100 rounded-full p-2">
                  <MaterialIcon name="mail" size="20px" className="text-primary-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-semibold">EMAIL</p>
                  <p className="text-sm font-semibold text-slate-900 break-all">consultations.dietpal@outlook.com</p>
                </div>
              </div>
            </div>

            <button className="mt-4 w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold py-3 px-4 rounded-lg transition shadow-md flex items-center justify-center gap-2">
              <MaterialIcon name="calendar_month" size="20px" />
              Schedule Now
            </button>
          </div>
        </div>
      </div>

      {/* Technical Support Card */}
      <div className="glass rounded-2.5xl p-6 border border-white/20 shadow-lg backdrop-blur-sm bg-white/40">
        <div className="flex items-start gap-4">
          <div className="bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-2xl p-4 flex-shrink-0">
            <MaterialIcon name="support_agent" size="32px" filled={true} />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Technical Support</h3>
            <p className="text-slate-600 mb-4">Need help with the app? Our technical support team is here to assist you with any issues or questions.</p>
            
            <div className="space-y-3 bg-white/60 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-secondary-100 rounded-full p-2">
                  <MaterialIcon name="phone" size="20px" className="text-secondary-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-semibold">PHONE</p>
                  <p className="text-lg font-bold text-slate-900">+1 868 7654321</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-secondary-100 rounded-full p-2">
                  <MaterialIcon name="mail" size="20px" className="text-secondary-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-semibold">EMAIL</p>
                  <p className="text-sm font-semibold text-slate-900 break-all">tech.support@diet-pal.io</p>
                </div>
              </div>
            </div>

            <button className="mt-4 w-full bg-gradient-to-r from-secondary-600 to-secondary-700 hover:from-secondary-700 hover:to-secondary-800 text-white font-bold py-3 px-4 rounded-lg transition shadow-md flex items-center justify-center gap-2">
              <MaterialIcon name="help_center" size="20px" />
              Get Help
            </button>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="glass rounded-2.5xl p-6 border border-white/20 shadow-lg backdrop-blur-sm bg-white/40">
        <h4 className="text-lg font-bold text-slate-900 mb-4">Other Ways to Reach Us</h4>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <MaterialIcon name="schedule" size="24px" className="text-primary-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-slate-900">Response Time</p>
              <p className="text-sm text-slate-600">We typically respond within 24 hours</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MaterialIcon name="language" size="24px" className="text-primary-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-slate-900">Location</p>
              <p className="text-sm text-slate-600">Trinidad & Tobago</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MaterialIcon name="access_time" size="24px" className="text-primary-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-slate-900">Hours</p>
              <p className="text-sm text-slate-600">Monday - Friday: 9:00 AM - 6:00 PM</p>
              <p className="text-sm text-slate-600">Saturday: 10:00 AM - 4:00 PM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
