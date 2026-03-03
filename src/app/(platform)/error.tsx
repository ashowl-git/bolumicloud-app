'use client'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-md">
        <h2 className="text-lg font-medium text-gray-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {error.message || 'An unexpected error occurred while loading this page.'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="border border-gray-200 hover:border-red-600/30 px-6 py-3
              text-sm text-gray-900 hover:text-red-600 transition-all duration-300"
          >
            Try Again
          </button>
          <a
            href="/"
            className="border border-gray-200 hover:border-gray-400 px-6 py-3
              text-sm text-gray-700 hover:text-gray-900 transition-all duration-300
              inline-block"
          >
            Go Home
          </a>
        </div>
        {error.digest && (
          <p className="text-xs text-gray-400 mt-4">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
