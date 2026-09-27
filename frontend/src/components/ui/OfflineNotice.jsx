import { WifiOff, RefreshCw, Clock } from 'lucide-react'
import { useT } from '../../i18n/useT.js'

export default function OfflineNotice({ timestamp, onRetry }) {
  const { isHindi } = useT()

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })
    : null

  return (
    <div
      role="status"
      aria-live="polite"
      className="p-3.5 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs"
    >
      <div className="flex items-start sm:items-center space-x-2.5">
        <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0">
          <WifiOff className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold flex items-center space-x-2">
            <span>{isHindi ? 'ऑफ़लाइन मोड (कैश किया गया डेटा)' : 'Offline Mode (Cached Record)'}</span>
            {formattedTime && (
              <span className="font-mono font-normal text-[11px] opacity-80 flex items-center space-x-1">
                <Clock className="w-3 h-3 inline mr-0.5" />
                <span>{formattedTime}</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 leading-snug">
            {isHindi
              ? 'इंटरनेट कनेक्शन उपलब्ध नहीं है। पहले से सुरक्षित की गई सिफारिश दिखाई जा रही है।'
              : 'Network connection unavailable. Displaying the last verified cached plan from your device.'}
          </p>
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="self-end sm:self-center px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-900 dark:text-amber-100 border border-amber-600/40 font-mono text-[11px] font-semibold transition-colors flex items-center space-x-1 min-h-[36px]"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          <span>{isHindi ? 'पुनः प्रयास' : 'Retry Connection'}</span>
        </button>
      )}
    </div>
  )
}
