import { RotateCcw, ExternalLink } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { BlacklistItem } from '../types/electron'
import ConfirmModal from '../components/ConfirmModal'

function Trash() {
  const [items, setItems] = useState<BlacklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [restoreConfirm, setRestoreConfirm] = useState<string | null>(null)

  const loadData = async () => {
    try {
      const result = await window.electronAPI.loadBlacklist()
      if (result.success && result.data) {
        setItems(result.data)
      }
    } catch (error) {
      console.error('Failed to load blacklist:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRestore = async () => {
    if (!restoreConfirm) return
    const result = await window.electronAPI.restoreFromBlacklist(restoreConfirm)
    if (result.success) {
      setItems(items.filter(item => item.youtubeId !== restoreConfirm))
    }
    setRestoreConfirm(null)
  }

  const openYoutube = (youtubeId: string) => {
    window.open(`https://www.youtube.com/watch?v=${youtubeId}`, '_blank')
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>로딩 중...</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">휴지통 ({items.length})</h2>

      {items.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-400">
          <p>삭제된 항목이 없습니다</p>
        </div>
      ) : (
        <>
          <p className="text-gray-400 mb-4">
            삭제된 항목은 YouTube 동기화 시 제외됩니다. 복구하면 다음 동기화 시 다시 추가됩니다.
          </p>
          <div className="grid gap-3">
            {items.map((item) => (
              <div
                key={item.youtubeId}
                className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg"
              >
                {/* 썸네일 */}
                <img
                  src={item.thumbnailUrl || 'https://via.placeholder.com/120x90?text=No+Image'}
                  alt={item.title}
                  className="w-24 h-16 object-cover rounded cursor-pointer flex-shrink-0"
                  onClick={() => openYoutube(item.youtubeId)}
                />

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-medium truncate cursor-pointer hover:text-blue-400"
                    onClick={() => openYoutube(item.youtubeId)}
                  >
                    {item.title || item.youtubeId}
                  </h3>
                  <p className="text-sm text-gray-400 truncate">{item.channelTitle}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    삭제일: {formatDate(item.deletedAt)}
                  </p>
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => openYoutube(item.youtubeId)}
                    className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                    title="YouTube에서 확인"
                  >
                    <ExternalLink size={18} />
                  </button>
                  <button
                    onClick={() => setRestoreConfirm(item.youtubeId)}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-lg transition-colors"
                  >
                    <RotateCcw size={16} />
                    복구
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 복구 확인 모달 */}
      <ConfirmModal
        isOpen={restoreConfirm !== null}
        title="항목 복구"
        message="이 항목을 복구하시겠습니까? 다음 동기화 시 목록에 추가됩니다."
        confirmText="복구"
        cancelText="취소"
        onConfirm={handleRestore}
        onCancel={() => setRestoreConfirm(null)}
      />
    </div>
  )
}

export default Trash
