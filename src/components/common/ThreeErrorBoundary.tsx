'use client'

import { Component, type ReactNode, type ErrorInfo } from 'react'

interface ThreeErrorBoundaryProps {
  children: ReactNode
  height?: string
}

interface ThreeErrorBoundaryState {
  hasError: boolean
  error: Error | null
  isWebGLError: boolean
}

function isWebGLRelatedError(error: Error): boolean {
  const msg = error.message.toLowerCase()
  return (
    msg.includes('webgl') ||
    msg.includes('context lost') ||
    msg.includes('gl_') ||
    msg.includes('three') ||
    msg.includes('renderer') ||
    msg.includes('canvas') ||
    msg.includes('shader')
  )
}

export default class ThreeErrorBoundary extends Component<
  ThreeErrorBoundaryProps,
  ThreeErrorBoundaryState
> {
  constructor(props: ThreeErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, isWebGLError: false }
  }

  static getDerivedStateFromError(error: Error): ThreeErrorBoundaryState {
    return {
      hasError: true,
      error,
      isWebGLError: isWebGLRelatedError(error),
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ThreeErrorBoundary] 3D rendering error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, isWebGLError: false })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      const { isWebGLError, error } = this.state
      const height = this.props.height || '400px'
      const isFluid = height === '100%'

      return (
        <div
          className={`border border-gray-200 bg-gray-50 flex flex-col items-center justify-center ${
            isFluid ? 'w-full h-full' : ''
          }`}
          style={isFluid ? undefined : { height }}
        >
          <div className="text-center max-w-sm px-4">
            {isWebGLError ? (
              <>
                <div className="w-10 h-10 mx-auto mb-3 border-2 border-gray-300 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-lg font-light">3D</span>
                </div>
                <p className="text-sm font-medium text-gray-800 mb-1">
                  3D viewer failed to load
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  WebGL context was lost or is unavailable. This can happen
                  when GPU resources are exhausted.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={this.handleRetry}
                    className="border border-gray-200 hover:border-gray-400 px-4 py-2
                      text-sm text-gray-700 hover:text-gray-900 transition-all duration-300"
                  >
                    Retry
                  </button>
                  <button
                    onClick={this.handleReload}
                    className="border border-gray-200 hover:border-red-600/30 px-4 py-2
                      text-sm text-gray-700 hover:text-red-600 transition-all duration-300"
                  >
                    Reload Page
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-800 mb-1">
                  3D rendering error
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  {error?.message || 'An unexpected error occurred in the 3D viewer.'}
                </p>
                <button
                  onClick={this.handleRetry}
                  className="border border-gray-200 hover:border-gray-400 px-4 py-2
                    text-sm text-gray-700 hover:text-gray-900 transition-all duration-300"
                >
                  Retry
                </button>
              </>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
