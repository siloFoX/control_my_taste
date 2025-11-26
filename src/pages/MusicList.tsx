import { Search, Star, Trash2, ExternalLink } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { VideoItem } from '../types/electron'

function MusicList() {
  const [items, setItems] = useState<VideoItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const result = await window.electronAPI.loadMusic()
      if (result.success && result.data) {
        setItems(result.data.items)
      }
    } catch (error) {
      console.error('Failed to load music:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async (youtubeId: string) => {
    if (!confirm('이 항목을 삭제하시겠습니까?')) return

    const result = await window.electronAPI.deleteMusic(youtubeId)
    if (result.success) {
      setItems(items.filter(item => item.youtubeId !== youtubeId))
    }
  }

  const handleRating = async (youtubeId: string, rating: number) => {
    const result = await window.electronAPI.updateRating(youtubeId, rating)
    if (result.success) {
      setItems(items.map(item =>
        item.youtubeId === youtubeId ? { ...item, rating } : item
      ))
    }
  }

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.channelTitle.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openYoutube = (youtubeId: string) => {
    window.open(`https://www.youtube.com/watch?v=${youtubeId}`, '_blank')
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">음악 목록 ({filteredItems.length})</h2>

        {/* 검색 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 w-64"
          />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-400">
          <p>YouTube 동기화를 눌러 음악을 가져오세요</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.youtubeId}
              className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
            >
              {/* 썸네일 */}
              <img
                src={item.thumbnailUrl || 'https://via.placeholder.com/120x90?text=No+Image'}
                alt={item.title}
                className="w-30 h-20 object-cover rounded cursor-pointer"
                onClick={() => openYoutube(item.youtubeId)}
              />

              {/* 정보 */}
              <div className="flex-1 min-w-0">
                <h3
                  className="font-medium truncate cursor-pointer hover:text-blue-400"
                  onClick={() => openYoutube(item.youtubeId)}
                >
                  {item.title}
                </h3>
                <p className="text-sm text-gray-400 truncate">{item.channelTitle}</p>

                {/* 별점 */}
                <div className="flex items-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating(item.youtubeId, star)}
                      className="focus:outline-none"
                    >
                      <Star
                        size={18}
                        className={`${
                          item.rating && item.rating >= star
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-600 hover:text-yellow-400'
                        } transition-colors`}
                      />
                    </button>
                  ))}
                  {item.rating && (
                    <span className="ml-2 text-sm text-gray-400">{item.rating}/5</span>
                  )}
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openYoutube(item.youtubeId)}
                  className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                  title="YouTube에서 열기"
                >
                  <ExternalLink size={20} />
                </button>
                <button
                  onClick={() => handleDelete(item.youtubeId)}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  title="삭제"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MusicList
