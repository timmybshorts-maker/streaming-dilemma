'use client'

export function VideoBackground() {
  return (
    <div
      className="fixed inset-0 w-full h-full min-w-full min-h-full overflow-hidden pointer-events-none"
      style={{ zIndex: -2 }}
    >
      <video
        id="video-background"
        className="absolute top-0 left-0 w-full h-full min-w-full min-h-full object-cover border-0 p-0 m-0"
        autoPlay
        loop
        muted
        playsInline
        title="Schanze Loop Background"
        style={{ display: 'block', objectFit: 'cover', border: 'none' }}
      >
        <source src="/schanze-loop.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  )
}
