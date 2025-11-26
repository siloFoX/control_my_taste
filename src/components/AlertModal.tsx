interface AlertModalProps {
  isOpen: boolean
  title: string
  message: string
  buttonText?: string
  onClose: () => void
  type?: 'info' | 'success' | 'error'
}

function AlertModal({
  isOpen,
  title,
  message,
  buttonText = '확인',
  onClose,
  type = 'info'
}: AlertModalProps) {
  if (!isOpen) return null

  const buttonColors = {
    info: 'bg-blue-600 hover:bg-blue-700',
    success: 'bg-green-600 hover:bg-green-700',
    error: 'bg-red-600 hover:bg-red-700'
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl max-w-sm w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-gray-400 mb-6">{message}</p>

        <button
          onClick={onClose}
          className={`w-full px-4 py-2 rounded-lg transition-colors ${buttonColors[type]}`}
        >
          {buttonText}
        </button>
      </div>
    </div>
  )
}

export default AlertModal
