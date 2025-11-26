import { Star, SkipForward, Trash2, ExternalLink } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { VideoItem } from '../types/electron'

function Evaluate() {
  const [items, setItems] = useState<VideoItem[]>([])
  const [currentItem, setCurrentItem] = useState<VideoItem | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const result = await window.electronAPI.loadMusic()
      if (result.success && result.data) {
        // 아직 평가하지 않은 항목만 필터링
        const unrated = result.data.items.filter(item => !item.rating)
        setItems(unrated)
        pickRandom(unrated)
      }
    } catch (error) {
      console.error('Failed to load music:', error)
    } finally {
      setLoading(false)
    }
  }

  const pickRandom = (list: VideoItem[]) => {
    if (list.length === 0) {
      setCurrentItem(null)
      return
    }
    const randomIndex = Math.floor(Math.random() * list.length)
    setCurrentItem(list[randomIndex])
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRating = async (rating: number) => {
    if (!currentItem) return

    const result = await window.electronAPI.updateRating(currentItem.youtubeId, rating)
    if (result.success) {
      const remaining = items.filter(item => item.youtubeId !== currentItem.youtubeId)
      setItems(remaining)
      pickRandom(remaining)
    }
  }

  const handleSkip = () => {
    pickRandom(items)
  }

  const handleDelete = async () => {
    if (!currentItem) return
    if (!confirm('이 항목을 삭제하시겠습니까?')) return

    const result = await window.electronAPI.deleteMusic(currentItem.youtubeId)
    if (result.success) {
      const remaining = items.filter(item => item.youtubeId !== currentItem.youtubeId)
      setItems(remaining)
      pickRandom(remaining)
    }
  }

  const openYoutube = () => {
    if (currentItem) {
      window.open(`https://www.youtube.com/watch?v=${currentItem.youtubeId}`, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>로딩 중...</p>
      </div>
    )
  }

  if (!currentItem) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl font-bold mb-8">음악 평가</h2>
        <div className="text-center text-gray-400">
          <p className="mb-4">평가할 음악이 없습니다</p>
          <p>모든 음악을 평가했거나, YouTube 동기화가 필요합니다</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">음악 평가</h2>
      <p className="text-gray-400 mb-8">남은 항목: {items.length}개</p>

      {/* 썸네일 */}
      <div className="relative mb-6 group">
        <img
          src={currentItem.thumbnailUrl || 'https://via.placeholder.com/480x360?text=No+Image'}
          alt={currentItem.title}
          className="w-96 h-72 object-cover rounded-lg cursor-pointer"
          onClick={openYoutube}
        />
        <div
          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg cursor-pointer"
          onClick={openYoutube}
        >
          <ExternalLink size={48} className="text-white" />
        </div>
      </div>

      {/* 제목 & 채널 */}
      <h3 className="text-xl font-medium text-center mb-2 px-4">{currentItem.title}</h3>
      <p className="text-gray-400 mb-8">{currentItem.channelTitle}</p>

      {/* 별점 */}
      <div className="flex items-center gap-4 mb-8">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRating(star)}
            className="focus:outline-none transform hover:scale-125 transition-transform"
          >
            <Star
              size={40}
              className="text-gray-600 hover:text-yellow-400 hover:fill-yellow-400 transition-colors"
            />
          </button>
        ))}
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSkip}
          className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          <SkipForward size={20} />
          건너뛰기
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-6 py-3 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors"
        >
          <Trash2 size={20} />
          삭제
        </button>
      </div>
    </div>
  )
}

export default Evaluate
