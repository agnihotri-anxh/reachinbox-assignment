'use client'

import { EmailJob } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'

interface EmailDetailProps {
    email: EmailJob
    onBack: () => void
}

export function EmailDetail({ email, onBack }: EmailDetailProps) {
    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Header */}
            <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100">
                <button
                    onClick={onBack}
                    className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-gray-900 truncate">{email.subject}</h2>
                        <span className="text-sm text-gray-500 font-normal">|</span>
                        <span className="text-sm text-gray-500 font-normal">MJWYT44 BM#52W01</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                    </button>
                </div>
            </div>

            {/* Content Scrollable Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-8 max-w-4xl mx-auto">

                    {/* Sender Info */}
                    <div className="flex items-start justify-between mb-8">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-lg">
                                {email.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-900">Amanda Clark</span> {/* Mock Name */}
                                    <span className="text-gray-400 text-sm">&lt;{email.email}&gt;</span>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                    <span>to me</span>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>
                        <div className="text-sm text-gray-400">
                            {email.scheduledTime ? formatDateTime(email.scheduledTime) : formatDateTime(new Date().toISOString())}
                        </div>
                    </div>

                    {/* Email Body */}
                    <div className="space-y-6 text-gray-800 leading-relaxed">
                        <p>Hey Oliver,</p>
                        <p>You've just RECEIVED something</p>

                        {/* Highlight Box */}
                        <div className="relative my-8 group cursor-pointer">
                            <div className="absolute inset-0 bg-yellow-50 transform -skew-x-2 rounded-sm border-l-4 border-yellow-400"></div>
                            <div className="relative px-6 py-4">
                                <div className="flex items-start gap-2 mb-2">
                                    <span className="text-yellow-500">⚡</span>
                                    <span className="font-bold text-gray-900">Extremely Exclusive—Only 4 Spots Worldwide Per Year | $25,000 investment</span>
                                    <span className="text-yellow-500">⚡</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-yellow-500">⚡</span>
                                    <span className="text-gray-700">To explore securing your private transformation, simply reply right now with <span className="font-bold text-black">"FLY OUT FIX"</span> .</span>
                                </div>
                            </div>
                        </div>

                        <p>Your coach for world-class performance,</p>
                        <p>Grant</p>
                        <p className="italic text-gray-500 text-sm">P.S. Always remember that you can develop world class technique! 🚀</p>
                    </div>

                    {/* Attachments */}
                    <div className="mt-8 flex gap-4">
                        <div className="group cursor-pointer">
                            <div className="w-48 h-32 bg-blue-600 rounded-lg overflow-hidden relative shadow-sm hover:shadow-md transition-shadow">
                                {/* Mock Image Content */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <img src="https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?q=80&w=2070&auto=format&fit=crop" alt="Tennis" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                            <div className="mt-2">
                                <p className="text-sm font-medium text-gray-700 truncate w-48">Tennis_Coach_Profile.png</p>
                                <p className="text-xs text-gray-400">1.2 MB</p>
                            </div>
                        </div>
                        <div className="group cursor-pointer">
                            <div className="w-48 h-32 bg-blue-600 rounded-lg overflow-hidden relative shadow-sm hover:shadow-md transition-shadow">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <img src="https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=2070&auto=format&fit=crop" alt="Tennis" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                            <div className="mt-2">
                                <p className="text-sm font-medium text-gray-700 truncate w-48">Tennis_Coach_Profile2.png</p>
                                <p className="text-xs text-gray-400">1.2 MB</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reply Footer */}
            <div className="p-6 border-t border-gray-100 bg-white">
                <div className="max-w-4xl mx-auto space-y-4">
                    <div className="text-gray-400 text-sm">Type Your Reply...</div>
                    <div className="rounded-lg border border-gray-200 overflow-hidden focus-within:ring-1 focus-within:ring-gray-200 transition-shadow">
                        {/* Toolbar */}
                        <div className="flex items-center gap-4 bg-gray-50 px-3 py-2 border-b border-gray-100">
                            <button type="button" className="text-gray-400 hover:text-gray-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg></button>
                            <button type="button" className="text-gray-400 hover:text-gray-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg></button>
                            <span className="w-px h-4 bg-gray-300"></span>
                            <button type="button" className="font-serif font-bold text-gray-500 hover:text-gray-700">T</button>
                            <button type="button" className="font-bold text-gray-500 hover:text-gray-700">B</button>
                            <button type="button" className="italic text-gray-500 hover:text-gray-700">I</button>
                            <button type="button" className="underline text-gray-500 hover:text-gray-700">U</button>
                            <span className="w-px h-4 bg-gray-300"></span>
                            <button type="button" className="text-gray-400 hover:text-gray-600 transform rotate-90"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg></button>
                            <button type="button" className="text-gray-400 hover:text-gray-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" /></svg></button>
                        </div>
                        <textarea rows={3} className="w-full h-full p-4 outline-none text-sm resize-none" />
                    </div>
                    <div className="flex justify-start">
                        <button className="px-6 py-2 bg-gradient-to-r from-[#00B96B] to-[#00B96B] text-white font-medium rounded text-sm shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2">
                            Send Reply
                            <svg className="w-3 h-3 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
