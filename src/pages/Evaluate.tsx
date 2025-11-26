import { Star, ArrowRight, Trash2, ExternalLink, Plus, X, ThumbsUp, ThumbsDown, Pencil, Check } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { VideoItem } from '../types/electron'
import ConfirmModal from '../components/ConfirmModal'

function Evaluate() {
  const [items, setItems] = useState<VideoItem[]>([])
  const [currentItem, setCurrentItem] = useState<VideoItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [editingComment, setEditingComment] = useState<{ index: number; text: string } | null>(null)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const loadData = async () => {
    try {
      const result = await window.electronAPI.loadMusic()
      if (result.success && result.data) {
        // 아직 평가하지 않은 항목만 필터링
        const unrated = result.data.items.filter(item => !item.rating)
        setItems(unrated)

        // localStorage에 저장된 ID가 있으면 해당 항목 선택
        const savedId = localStorage.getItem('evaluateCurrentId')
        if (savedId) {
          const savedItem = unrated.find(item => item.youtubeId === savedId)
          if (savedItem) {
            setCurrentItem(savedItem)
            setSelectedRating(null)
            setNewComment('')
            return
          }
        }
        // 없으면 랜덤 선택
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
      localStorage.removeItem('evaluateCurrentId')
      return
    }
    const randomIndex = Math.floor(Math.random() * list.length)
    const selected = list[randomIndex]
    setCurrentItem(selected)
    localStorage.setItem('evaluateCurrentId', selected.youtubeId)
    setNewComment('')
    setSelectedRating(null)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRating = (rating: number) => {
    setSelectedRating(rating)
  }

  const handleNext = async () => {
    if (!currentItem) return

    // 별점이 선택되었으면 저장
    if (selectedRating) {
      await window.electronAPI.updateRating(currentItem.youtubeId, selectedRating)
      const remaining = items.filter(item => item.youtubeId !== currentItem.youtubeId)
      setItems(remaining)
      pickRandom(remaining)
    } else {
      // 별점 없이 다음으로 (건너뛰기)
      pickRandom(items)
    }
  }

  const handleAddComment = async () => {
    if (!currentItem || !newComment.trim()) return

    const result = await window.electronAPI.addComment(currentItem.youtubeId, newComment.trim())
    if (result.success) {
      setCurrentItem({
        ...currentItem,
        comments: [...currentItem.comments, newComment.trim()]
      })
      setNewComment('')
    }
  }

  const handleUpdateComment = async (commentIndex: number, newText: string) => {
    if (!currentItem || !newText.trim()) return

    const result = await window.electronAPI.updateComment(currentItem.youtubeId, commentIndex, newText.trim())
    if (result.success) {
      setCurrentItem({
        ...currentItem,
        comments: currentItem.comments.map((c, i) => i === commentIndex ? newText.trim() : c)
      })
      setEditingComment(null)
    }
  }

  const handleDeleteComment = async (commentIndex: number) => {
    if (!currentItem) return

    const result = await window.electronAPI.deleteComment(currentItem.youtubeId, commentIndex)
    if (result.success) {
      setCurrentItem({
        ...currentItem,
        comments: currentItem.comments.filter((_, i) => i !== commentIndex)
      })
    }
  }

  const handleDelete = async () => {
    if (!currentItem) return

    const result = await window.electronAPI.deleteMusic(currentItem.youtubeId)
    if (result.success) {
      const remaining = items.filter(item => item.youtubeId !== currentItem.youtubeId)
      setItems(remaining)
      pickRandom(remaining)
    }
    setShowDeleteConfirm(false)
  }

  const openYoutube = () => {
    if (currentItem) {
      window.open(`https://www.youtube.com/watch?v=${currentItem.youtubeId}`, '_blank')
    }
  }

  const handleHype = async (type: 'up' | 'down') => {
    if (!currentItem) return

    const result = await window.electronAPI.updateHype(currentItem.youtubeId, type)
    if (result.success) {
      setCurrentItem({
        ...currentItem,
        hypeUp: type === 'up' ? (currentItem.hypeUp || 0) + 1 : currentItem.hypeUp,
        hypeDown: type === 'down' ? (currentItem.hypeDown || 0) + 1 : currentItem.hypeDown,
      })
      // items 배열도 업데이트
      setItems(items.map(item =>
        item.youtubeId === currentItem.youtubeId
          ? {
              ...item,
              hypeUp: type === 'up' ? (item.hypeUp || 0) + 1 : item.hypeUp,
              hypeDown: type === 'down' ? (item.hypeDown || 0) + 1 : item.hypeDown,
            }
          : item
      ))
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
      <p className="text-gray-400 mb-4">{currentItem.channelTitle}</p>

      {/* Hype 버튼 */}
      <div className="flex items-center gap-6 mb-6">
        <button
          onClick={() => handleHype('up')}
          className="flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-lg transition-colors"
        >
          <ThumbsUp size={24} />
          <span className="text-lg font-medium">{currentItem.hypeUp || 0}</span>
        </button>
        <button
          onClick={() => handleHype('down')}
          className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors"
        >
          <ThumbsDown size={24} />
          <span className="text-lg font-medium">{currentItem.hypeDown || 0}</span>
        </button>
      </div>

      {/* 별점 */}
      <div
        className="flex items-center gap-4 mb-6"
        onMouseLeave={() => setHoverRating(null)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isSelected = selectedRating && selectedRating >= star
          const isHovered = hoverRating && hoverRating >= star
          return (
            <button
              key={star}
              onClick={() => handleRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              className="focus:outline-none transform hover:scale-125 transition-transform"
            >
              <Star
                size={40}
                className={`transition-colors ${
                  isSelected
                    ? 'fill-yellow-400 text-yellow-400'
                    : isHovered
                      ? 'text-yellow-400'
                      : 'text-gray-600'
                }`}
              />
            </button>
          )
        })}
      </div>

      {/* 코멘트 섹션 */}
      <div className="w-full max-w-md mb-6">
        {/* 코멘트 목록 */}
        {currentItem.comments.length > 0 && (
          <div className="space-y-2 mb-3">
            {currentItem.comments.map((comment, index) => (
              <div
                key={index}
                className="flex items-start justify-between gap-2 p-2 bg-gray-700/50 rounded"
              >
                {editingComment?.index === index ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={editingComment.text}
                      onChange={(e) => setEditingComment({ ...editingComment, text: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateComment(index, editingComment.text)
                        if (e.key === 'Escape') setEditingComment(null)
                      }}
                      className="flex-1 px-2 py-1 bg-gray-600 border border-gray-500 rounded focus:outline-none focus:border-blue-500 text-sm"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdateComment(index, editingComment.text)}
                      className="p-1 text-green-400 hover:text-green-300 transition-colors"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => setEditingComment(null)}
                      className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-300 flex-1">{comment}</p>
                    <button
                      onClick={() => setEditingComment({ index, text: comment })}
                      className="p-1 text-gray-500 hover:text-blue-400 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteComment(index)}
                      className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 코멘트 입력 */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="코멘트 추가..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500 text-sm"
          />
          <button
            onClick={handleAddComment}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* 액션 버튼 (스택 형태) */}
      <div className="flex flex-col gap-3 w-full max-w-md">
        <button
          onClick={handleNext}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <ArrowRight size={20} />
          다음
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors"
        >
          <Trash2 size={20} />
          삭제
        </button>
      </div>

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="항목 삭제"
        message="이 항목을 삭제하시겠습니까?"
        confirmText="삭제"
        cancelText="취소"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        danger
      />
    </div>
  )
}

export default Evaluate
