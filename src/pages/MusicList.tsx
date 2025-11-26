import { Search, Star, Trash2, Info, MessageSquare, X, Plus, RefreshCw, Unlink, Check, Copy, ExternalLink } from 'lucide-react'
import { useState, useEffect, useCallback, useRef } from 'react'
import type { VideoItem } from '../types/electron'
import ConfirmModal from '../components/ConfirmModal'

// 아이템 카드 높이 (p-4 패딩 + h-20 썸네일 + gap-4)
const ITEM_HEIGHT = 112
// 헤더(56) + 페이지네이션(56) + 여백 + 여유분
const FIXED_HEIGHT = 260

function MusicList() {
  const [items, setItems] = useState<VideoItem[]>([])
  const [searchTerm, setSearchTermState] = useState(() => {
    return localStorage.getItem('musicListSearch') || ''
  })

  const setSearchTerm = (value: string) => {
    setSearchTermState(value)
    localStorage.setItem('musicListSearch', value)
  }
  const [loading, setLoading] = useState(true)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [hoverRating, setHoverRating] = useState<{ id: string; rating: number } | null>(null)
  const [syncActionMenu, setSyncActionMenu] = useState<string | null>(null)
  const [detailModal, setDetailModal] = useState<VideoItem | null>(null)
  const [copied, setCopied] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPageState] = useState(() => {
    const saved = localStorage.getItem('musicListPage')
    return saved ? parseInt(saved, 10) : 1
  })

  const setCurrentPage = (page: number | ((prev: number) => number)) => {
    setCurrentPageState(prev => {
      const newPage = typeof page === 'function' ? page(prev) : page
      localStorage.setItem('musicListPage', String(newPage))
      return newPage
    })
  }

  // 창 크기에 맞춰 페이지당 아이템 수 계산
  const calculateItemsPerPage = useCallback(() => {
    const availableHeight = window.innerHeight - FIXED_HEIGHT
    const count = Math.max(1, Math.floor(availableHeight / ITEM_HEIGHT))
    setItemsPerPage(count)
  }, [])

  useEffect(() => {
    calculateItemsPerPage()
    window.addEventListener('resize', calculateItemsPerPage)
    return () => window.removeEventListener('resize', calculateItemsPerPage)
  }, [calculateItemsPerPage])

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

  // 메뉴 바깥 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = () => setSyncActionMenu(null)
    if (syncActionMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [syncActionMenu])

  const handleDelete = async (youtubeId: string) => {
    const result = await window.electronAPI.deleteMusic(youtubeId)
    if (result.success) {
      setItems(items.filter(item => item.youtubeId !== youtubeId))
    }
    setSyncActionMenu(null)
  }

  const handleKeep = async (youtubeId: string) => {
    const result = await window.electronAPI.keepMusic(youtubeId)
    if (result.success) {
      setItems(items.map(item =>
        item.youtubeId === youtubeId ? { ...item, synced: true } : item
      ))
    }
    setSyncActionMenu(null)
  }

  const handleDeleteWithConfirm = (youtubeId: string) => {
    setDeleteConfirm(youtubeId)
  }

  const confirmDelete = async () => {
    if (deleteConfirm) {
      await handleDelete(deleteConfirm)
      setDeleteConfirm(null)
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

  const handleAddComment = async (youtubeId: string) => {
    if (!newComment.trim()) return

    const result = await window.electronAPI.addComment(youtubeId, newComment.trim())
    if (result.success) {
      setItems(items.map(item =>
        item.youtubeId === youtubeId
          ? { ...item, comments: [...item.comments, newComment.trim()] }
          : item
      ))
      setNewComment('')
    }
  }

  const handleDeleteComment = async (youtubeId: string, commentIndex: number) => {
    const result = await window.electronAPI.deleteComment(youtubeId, commentIndex)
    if (result.success) {
      setItems(items.map(item =>
        item.youtubeId === youtubeId
          ? { ...item, comments: item.comments.filter((_, i) => i !== commentIndex) }
          : item
      ))
    }
  }

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.channelTitle.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 페이징 계산
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage)

  // 검색어 변경 시 첫 페이지로 (이전 값과 비교)
  const prevSearchTerm = useRef(searchTerm)
  useEffect(() => {
    if (prevSearchTerm.current !== searchTerm) {
      prevSearchTerm.current = searchTerm
      setCurrentPage(1)
    }
  }, [searchTerm])

  // 페이지 수가 변경되어 현재 페이지가 범위를 벗어나면 조정
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalPages])

  const openYoutube = (youtubeId: string) => {
    window.open(`https://www.youtube.com/watch?v=${youtubeId}`, '_blank')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ISO 8601 duration을 읽기 쉬운 형식으로 변환 (PT5M47S -> 5:47)
  const formatDuration = (duration?: string) => {
    if (!duration) return null
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return duration
    const hours = match[1] ? parseInt(match[1]) : 0
    const minutes = match[2] ? parseInt(match[2]) : 0
    const seconds = match[3] ? parseInt(match[3]) : 0
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Wikipedia URL에서 토픽 이름 추출
  const formatTopic = (url: string) => {
    const match = url.match(/\/wiki\/(.+)$/)
    if (match) {
      return decodeURIComponent(match[1].replace(/_/g, ' '))
    }
    return url
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
          {paginatedItems.map((item) => (
            <div
              key={item.youtubeId}
              className="bg-gray-800 rounded-lg overflow-hidden"
            >
              <div className="flex items-center gap-4 p-4">
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
                  <div
                    className="flex items-center gap-1 mt-2"
                    onMouseLeave={() => setHoverRating(null)}
                  >
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isHovered = hoverRating?.id === item.youtubeId && hoverRating.rating >= star
                      const isRated = item.rating && item.rating >= star
                      return (
                        <button
                          key={star}
                          onClick={() => handleRating(item.youtubeId, star)}
                          onMouseEnter={() => setHoverRating({ id: item.youtubeId, rating: star })}
                          className="focus:outline-none"
                        >
                          <Star
                            size={18}
                            className={`transition-colors ${
                              isRated
                                ? 'fill-yellow-400 text-yellow-400'
                                : isHovered
                                  ? 'text-yellow-400'
                                  : 'text-gray-600'
                            }`}
                          />
                        </button>
                      )
                    })}
                    {item.rating && (
                      <span className="ml-2 text-sm text-gray-400">{item.rating}/5</span>
                    )}
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center gap-2">
                  {/* 동기화 상태 아이콘 */}
                  <div className="relative">
                    <button
                      onClick={() => setSyncActionMenu(syncActionMenu === item.youtubeId ? null : item.youtubeId)}
                      className={`p-2 transition-colors ${
                        item.synced === false
                          ? 'text-orange-400 hover:text-orange-300'
                          : 'text-green-400'
                      }`}
                      title={item.synced === false ? '동기화 안됨 (클릭하여 처리)' : '동기화됨'}
                    >
                      {item.synced === false ? <Unlink size={20} /> : <RefreshCw size={20} />}
                    </button>

                    {/* 동기화 안됨 항목 액션 메뉴 */}
                    {syncActionMenu === item.youtubeId && item.synced === false && (
                      <div className="absolute right-0 top-full mt-1 bg-gray-700 rounded-lg shadow-lg z-10 min-w-[160px]">
                        <button
                          onClick={() => handleKeep(item.youtubeId)}
                          className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-gray-600 rounded-t-lg transition-colors"
                        >
                          <Check size={16} className="text-green-400" />
                          남기기
                        </button>
                        <button
                          onClick={() => handleDelete(item.youtubeId)}
                          className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-gray-600 rounded-b-lg transition-colors"
                        >
                          <Trash2 size={16} className="text-red-400" />
                          휴지통으로
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setExpandedItem(expandedItem === item.youtubeId ? null : item.youtubeId)}
                    className={`p-2 transition-colors ${
                      expandedItem === item.youtubeId || item.comments.length > 0
                        ? 'text-blue-400'
                        : 'text-gray-400 hover:text-blue-400'
                    }`}
                    title="코멘트"
                  >
                    <MessageSquare size={20} />
                    {item.comments.length > 0 && (
                      <span className="ml-1 text-xs">{item.comments.length}</span>
                    )}
                  </button>
                  <button
                    onClick={() => setDetailModal(item)}
                    className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                    title="상세 정보"
                  >
                    <Info size={20} />
                  </button>
                  <button
                    onClick={() => handleDeleteWithConfirm(item.youtubeId)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    title="삭제"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              {/* 코멘트 섹션 */}
              {expandedItem === item.youtubeId && (
                <div className="px-4 pb-4 border-t border-gray-700">
                  <div className="pt-4">
                    {/* 코멘트 목록 */}
                    {item.comments.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {item.comments.map((comment, index) => (
                          <div
                            key={index}
                            className="flex items-start justify-between gap-2 p-2 bg-gray-700/50 rounded"
                          >
                            <p className="text-sm text-gray-300 flex-1">{comment}</p>
                            <button
                              onClick={() => handleDeleteComment(item.youtubeId, index)}
                              className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                            >
                              <X size={14} />
                            </button>
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
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(item.youtubeId)}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500 text-sm"
                      />
                      <button
                        onClick={() => handleAddComment(item.youtubeId)}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* 페이지 네비게이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                이전
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // 현재 페이지 주변 2개씩 + 첫/끝 페이지 표시
                    if (page === 1 || page === totalPages) return true
                    if (Math.abs(page - currentPage) <= 2) return true
                    return false
                  })
                  .map((page, index, arr) => (
                    <span key={page} className="flex items-center">
                      {/* 생략 표시 */}
                      {index > 0 && arr[index - 1] !== page - 1 && (
                        <span className="px-2 text-gray-500">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        {page}
                      </button>
                    </span>
                  ))}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                다음
              </button>
            </div>
          )}
        </div>
      )}

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={deleteConfirm !== null}
        title="항목 삭제"
        message="이 항목을 삭제하시겠습니까?"
        confirmText="삭제"
        cancelText="취소"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
        danger
      />

      {/* 상세 정보 모달 */}
      {detailModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setDetailModal(null)}
        >
          <div
            className="bg-gray-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 썸네일 헤더 */}
            <div className="relative">
              <img
                src={detailModal.thumbnailUrl || 'https://via.placeholder.com/480x360?text=No+Image'}
                alt={detailModal.title}
                className="w-full aspect-video object-cover rounded-t-xl"
              />
              <button
                onClick={() => setDetailModal(null)}
                className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              {/* 재생 시간 뱃지 */}
              {detailModal.duration && (
                <span className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 rounded text-sm font-medium">
                  {formatDuration(detailModal.duration)}
                </span>
              )}
            </div>

            {/* 콘텐츠 */}
            <div className="p-5">
              {/* 제목 */}
              <h3 className="text-xl font-bold mb-1 leading-tight">{detailModal.title}</h3>
              {/* 채널명 */}
              <p className="text-gray-400 mb-4">{detailModal.channelTitle}</p>

              {/* YouTube 링크 */}
              <div className="flex items-center gap-2 mb-4 p-3 bg-gray-700/50 rounded-lg">
                <ExternalLink size={18} className="text-gray-400 flex-shrink-0" />
                <a
                  href={`https://www.youtube.com/watch?v=${detailModal.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 truncate flex-1 text-sm"
                >
                  https://www.youtube.com/watch?v={detailModal.youtubeId}
                </a>
                <button
                  onClick={() => copyToClipboard(`https://www.youtube.com/watch?v=${detailModal.youtubeId}`)}
                  className={`p-2 rounded transition-colors flex-shrink-0 ${
                    copied ? 'text-green-400' : 'text-gray-400 hover:text-white hover:bg-gray-600'
                  }`}
                  title="링크 복사"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>

              {/* 토픽 */}
              {detailModal.topics && detailModal.topics.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">토픽</h4>
                  <div className="flex flex-wrap gap-2">
                    {detailModal.topics.map((topic, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm"
                      >
                        {formatTopic(topic)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 태그 */}
              {detailModal.tags && detailModal.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">태그</h4>
                  <div className="flex flex-wrap gap-2">
                    {detailModal.tags.slice(0, 15).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                    {detailModal.tags.length > 15 && (
                      <span className="px-2 py-1 text-gray-500 text-sm">
                        +{detailModal.tags.length - 15}개
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 정보 없음 */}
              {!detailModal.topics?.length && !detailModal.tags?.length && (
                <p className="text-gray-500 text-sm">추가 정보 없음</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MusicList
