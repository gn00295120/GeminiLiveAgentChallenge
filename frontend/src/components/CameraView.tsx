import { RefObject } from 'react'

interface CameraViewProps {
  videoRef: RefObject<HTMLVideoElement | null>
  isActive: boolean
  label?: string
}

export default function CameraView({ videoRef, isActive, label }: CameraViewProps) {
  return (
    <div className="relative w-full max-w-2xl aspect-video rounded-2xl overflow-hidden bg-slate-800 border border-slate-700">
      <video
        ref={videoRef as React.RefObject<HTMLVideoElement>}
        className={`w-full h-full object-contain ${isActive ? '' : 'hidden'}`}
        playsInline
        muted
      />
      {!isActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
          <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">Share your screen, camera, or upload an image</p>
        </div>
      )}
      {isActive && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded-full">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-white font-medium">{label || 'AI watching'}</span>
        </div>
      )}
    </div>
  )
}
