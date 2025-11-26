import { RotateCcw, ExternalLink } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { BlacklistItem } from '../types/electron'

function Trash() {
  const [items, setItems] = useState<BlacklistItem[]>([])
  const [loading, setLoading] = useState(true)

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

  const handleRestore = async (youtubeId: string) => {
    const result = await window.electronAPI.restoreFromBlacklist(youtubeId)
    if (result.success) {
      setItems(items.filter(item => item.youtubeId !== youtubeId))
      alert('복구되었습니다. 다음 동기화 시 목록에 추가됩니다.')
    }
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
                className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm text-gray-300 truncate">
                    {item.youtubeId}
                  </p>
                  <p className="text-xs text-gray-500">
                    삭제일: {formatDate(item.deletedAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openYoutube(item.youtubeId)}
                    className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                    title="YouTube에서 확인"
                  >
                    <ExternalLink size={18} />
                  </button>
                  <button
                    onClick={() => handleRestore(item.youtubeId)}
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
    </div>
  )
}

export default Trash
