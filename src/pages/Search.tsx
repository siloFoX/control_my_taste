import { useState, useEffect } from 'react'
import { Plus, X, Save, FolderOpen, Trash2, Play, Star, ThumbsUp, ThumbsDown, ExternalLink, Copy, Check } from 'lucide-react'
import type { VideoItem, SearchCondition, SearchTemplate, ConditionType } from '../types/electron'
import ConfirmModal from '../components/ConfirmModal'

const CONDITION_TYPES: { value: ConditionType; label: string }[] = [
  { value: 'rating', label: '별점' },
  { value: 'channel', label: '채널명' },
  { value: 'keyword', label: '키워드 (코멘트+태그)' },
  { value: 'comment', label: '코멘트 내용' },
  { value: 'tag', label: '태그' },
  { value: 'hasComment', label: '코멘트 유무' },
  { value: 'hypeUp', label: 'Hype Up' },
  { value: 'hypeDown', label: 'Hype Down' },
]

function Search() {
  const [items, setItems] = useState<VideoItem[]>([])
  const [filteredItems, setFilteredItems] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)

  // 조건 (localStorage에서 복원)
  const [includeConditions, setIncludeConditions] = useState<SearchCondition[]>(() => {
    const saved = localStorage.getItem('searchIncludeConditions')
    return saved ? JSON.parse(saved) : []
  })
  const [excludeConditions, setExcludeConditions] = useState<SearchCondition[]>(() => {
    const saved = localStorage.getItem('searchExcludeConditions')
    return saved ? JSON.parse(saved) : []
  })

  // 템플릿
  const [templates, setTemplates] = useState<SearchTemplate[]>([])
  const [templateName, setTemplateName] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showTemplateList, setShowTemplateList] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // 상세 모달
  const [detailModal, setDetailModal] = useState<VideoItem | null>(null)
  const [copied, setCopied] = useState(false)

  // 검색 실행 여부
  const [searched, setSearched] = useState(() => {
    return localStorage.getItem('searchExecuted') === 'true'
  })

  // 조건 변경 시 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('searchIncludeConditions', JSON.stringify(includeConditions))
  }, [includeConditions])

  useEffect(() => {
    localStorage.setItem('searchExcludeConditions', JSON.stringify(excludeConditions))
  }, [excludeConditions])

  useEffect(() => {
    loadData()
    loadTemplates()
  }, [])

  // 데이터 로드 후 검색이 실행된 상태면 자동으로 다시 검색
  useEffect(() => {
    if (!loading && searched && items.length > 0) {
      executeSearchWithoutSave()
    }
  }, [loading, items])

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

  const loadTemplates = async () => {
    try {
      const result = await window.electronAPI.loadTemplates()
      if (result.success && result.data) {
        setTemplates(result.data)
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }

  const addCondition = (isInclude: boolean) => {
    const newCondition: SearchCondition = { type: 'rating', value: '' }
    if (isInclude) {
      setIncludeConditions([...includeConditions, newCondition])
    } else {
      setExcludeConditions([...excludeConditions, newCondition])
    }
  }

  const updateCondition = (isInclude: boolean, index: number, field: 'type' | 'value', value: string) => {
    const conditions = isInclude ? [...includeConditions] : [...excludeConditions]
    conditions[index] = { ...conditions[index], [field]: value }
    if (isInclude) {
      setIncludeConditions(conditions)
    } else {
      setExcludeConditions(conditions)
    }
  }

  const removeCondition = (isInclude: boolean, index: number) => {
    if (isInclude) {
      setIncludeConditions(includeConditions.filter((_, i) => i !== index))
    } else {
      setExcludeConditions(excludeConditions.filter((_, i) => i !== index))
    }
  }

  const checkCondition = (item: VideoItem, condition: SearchCondition): boolean => {
    const { type, value } = condition
    if (!value) return true // 빈 값은 조건 무시

    switch (type) {
      case 'rating': {
        if (value === 'unrated') {
          return !item.rating
        }
        const num = parseInt(value.replace(/[>=<]/g, ''))
        if (value.startsWith('>=')) return (item.rating || 0) >= num
        if (value.startsWith('>')) return (item.rating || 0) > num
        if (value.startsWith('<=')) return (item.rating || 0) <= num
        if (value.startsWith('<')) return (item.rating || 0) < num
        return item.rating === num
      }
      case 'channel':
        return item.channelTitle.toLowerCase().includes(value.toLowerCase())
      case 'keyword': {
        const lowerValue = value.toLowerCase()
        const inComments = item.comments.some(c => c.toLowerCase().includes(lowerValue))
        const inTags = item.tags?.some(t => t.toLowerCase().includes(lowerValue)) || false
        return inComments || inTags
      }
      case 'comment':
        return item.comments.some(c => c.toLowerCase().includes(value.toLowerCase()))
      case 'tag':
        return item.tags?.some(t => t.toLowerCase().includes(value.toLowerCase())) || false
      case 'hasComment':
        return value === 'true' ? item.comments.length > 0 : item.comments.length === 0
      case 'hypeUp': {
        const num = parseInt(value.replace(/[>=<]/g, ''))
        if (value.startsWith('>=')) return (item.hypeUp || 0) >= num
        if (value.startsWith('>')) return (item.hypeUp || 0) > num
        if (value.startsWith('<=')) return (item.hypeUp || 0) <= num
        if (value.startsWith('<')) return (item.hypeUp || 0) < num
        return (item.hypeUp || 0) === num
      }
      case 'hypeDown': {
        const num = parseInt(value.replace(/[>=<]/g, ''))
        if (value.startsWith('>=')) return (item.hypeDown || 0) >= num
        if (value.startsWith('>')) return (item.hypeDown || 0) > num
        if (value.startsWith('<=')) return (item.hypeDown || 0) <= num
        if (value.startsWith('<')) return (item.hypeDown || 0) < num
        return (item.hypeDown || 0) === num
      }
      default:
        return true
    }
  }

  const executeSearchWithoutSave = () => {
    let results = [...items]

    // 포함 조건 (AND)
    for (const condition of includeConditions) {
      results = results.filter(item => checkCondition(item, condition))
    }

    // 미포함 조건 (OR - 하나라도 해당하면 제외)
    for (const condition of excludeConditions) {
      results = results.filter(item => !checkCondition(item, condition))
    }

    setFilteredItems(results)
  }

  const executeSearch = () => {
    executeSearchWithoutSave()
    setSearched(true)
    localStorage.setItem('searchExecuted', 'true')
  }

  const saveAsTemplate = async () => {
    if (!templateName.trim()) return

    const template: SearchTemplate = {
      id: Date.now().toString(),
      name: templateName.trim(),
      includeConditions,
      excludeConditions,
      createdAt: new Date().toISOString(),
    }

    const result = await window.electronAPI.saveTemplate(template)
    if (result.success) {
      setTemplates([...templates, template])
      setTemplateName('')
      setShowSaveModal(false)
    }
  }

  const loadTemplate = (template: SearchTemplate) => {
    setIncludeConditions(template.includeConditions)
    setExcludeConditions(template.excludeConditions)
    setShowTemplateList(false)
    setSearched(false)
  }

  const handleDeleteTemplate = async () => {
    if (!deleteConfirm) return

    const result = await window.electronAPI.deleteTemplate(deleteConfirm)
    if (result.success) {
      setTemplates(templates.filter(t => t.id !== deleteConfirm))
    }
    setDeleteConfirm(null)
  }

  const clearConditions = () => {
    setIncludeConditions([])
    setExcludeConditions([])
    setSearched(false)
    setFilteredItems([])
    localStorage.removeItem('searchIncludeConditions')
    localStorage.removeItem('searchExcludeConditions')
    localStorage.removeItem('searchExecuted')
  }

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

  const renderConditionInput = (condition: SearchCondition, isInclude: boolean, index: number) => {
    const { type, value } = condition

    return (
      <div key={index} className="flex items-center gap-2 mb-2">
        <select
          value={type}
          onChange={(e) => updateCondition(isInclude, index, 'type', e.target.value)}
          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
        >
          {CONDITION_TYPES.map(ct => (
            <option key={ct.value} value={ct.value}>{ct.label}</option>
          ))}
        </select>

        {type === 'rating' && (
          <input
            type="text"
            value={value}
            onChange={(e) => updateCondition(isInclude, index, 'value', e.target.value)}
            placeholder="예: >=3, >4, 5, unrated"
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
          />
        )}

        {type === 'hasComment' && (
          <select
            value={value}
            onChange={(e) => updateCondition(isInclude, index, 'value', e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
          >
            <option value="">선택...</option>
            <option value="true">코멘트 있음</option>
            <option value="false">코멘트 없음</option>
          </select>
        )}

        {(type === 'channel' || type === 'comment' || type === 'tag' || type === 'keyword') && (
          <input
            type="text"
            value={value}
            onChange={(e) => updateCondition(isInclude, index, 'value', e.target.value)}
            placeholder={
              type === 'channel' ? '채널명 검색...' :
              type === 'comment' ? '코멘트 내용 검색...' :
              type === 'tag' ? '태그 검색...' :
              '코멘트/태그 검색...'
            }
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
          />
        )}

        {(type === 'hypeUp' || type === 'hypeDown') && (
          <input
            type="text"
            value={value}
            onChange={(e) => updateCondition(isInclude, index, 'value', e.target.value)}
            placeholder="예: >=10, >5, 0"
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
          />
        )}

        <button
          onClick={() => removeCondition(isInclude, index)}
          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* 상단 조건 설정 영역 */}
      <div className="flex-shrink-0 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">조건 검색</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTemplateList(true)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <FolderOpen size={18} />
              템플릿
            </button>
            <button
              onClick={() => setShowSaveModal(true)}
              disabled={includeConditions.length === 0 && excludeConditions.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              저장
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* 포함 조건 */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-green-400">포함 조건</h3>
              <button
                onClick={() => addCondition(true)}
                className="flex items-center gap-1 px-2 py-1 text-sm bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded transition-colors"
              >
                <Plus size={16} />
                추가
              </button>
            </div>
            {includeConditions.length === 0 ? (
              <p className="text-gray-500 text-sm">조건을 추가하세요</p>
            ) : (
              includeConditions.map((c, i) => renderConditionInput(c, true, i))
            )}
          </div>

          {/* 미포함 조건 */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-red-400">미포함 조건</h3>
              <button
                onClick={() => addCondition(false)}
                className="flex items-center gap-1 px-2 py-1 text-sm bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded transition-colors"
              >
                <Plus size={16} />
                추가
              </button>
            </div>
            {excludeConditions.length === 0 ? (
              <p className="text-gray-500 text-sm">조건을 추가하세요</p>
            ) : (
              excludeConditions.map((c, i) => renderConditionInput(c, false, i))
            )}
          </div>
        </div>

        {/* 검색 버튼 */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={executeSearch}
            disabled={includeConditions.length === 0 && excludeConditions.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play size={20} />
            검색 실행
          </button>
          <button
            onClick={clearConditions}
            className="px-4 py-3 text-gray-400 hover:text-white transition-colors"
          >
            초기화
          </button>
          {searched && (
            <span className="text-gray-400">
              검색 결과: {filteredItems.length}개
            </span>
          )}
        </div>
      </div>

      {/* 검색 결과 */}
      {searched && (
        <div className="flex-1 overflow-auto">
          {filteredItems.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <p>조건에 맞는 항목이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <div
                  key={item.youtubeId}
                  className="flex items-center gap-4 p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
                >
                  <img
                    src={item.thumbnailUrl || 'https://via.placeholder.com/120x90?text=No+Image'}
                    alt={item.title}
                    className="w-20 h-14 object-cover rounded cursor-pointer flex-shrink-0"
                    onClick={() => openYoutube(item.youtubeId)}
                  />
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-medium truncate cursor-pointer hover:text-blue-400"
                      onClick={() => setDetailModal(item)}
                    >
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-400 truncate">{item.channelTitle}</p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    {/* 별점 */}
                    <div className="flex items-center gap-1">
                      {item.rating ? (
                        <>
                          <Star size={16} className="fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{item.rating}</span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500">미평가</span>
                      )}
                    </div>
                    {/* Hype */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="flex items-center gap-1 text-green-400">
                        <ThumbsUp size={14} />
                        {item.hypeUp || 0}
                      </span>
                      <span className="flex items-center gap-1 text-red-400">
                        <ThumbsDown size={14} />
                        {item.hypeDown || 0}
                      </span>
                    </div>
                    {/* YouTube 링크 */}
                    <button
                      onClick={() => openYoutube(item.youtubeId)}
                      className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      <ExternalLink size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 템플릿 저장 모달 */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-4">템플릿 저장</h3>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="템플릿 이름"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500 mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                취소
              </button>
              <button
                onClick={saveAsTemplate}
                disabled={!templateName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 템플릿 목록 모달 */}
      {showTemplateList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-[500px] max-h-[70vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">저장된 템플릿</h3>
              <button
                onClick={() => setShowTemplateList(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            {templates.length === 0 ? (
              <p className="text-gray-500 text-center py-8">저장된 템플릿이 없습니다</p>
            ) : (
              <div className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                  >
                    <div
                      className="flex-1 cursor-pointer hover:text-blue-400"
                      onClick={() => loadTemplate(template)}
                    >
                      <p className="font-medium">{template.name}</p>
                      <p className="text-sm text-gray-400">
                        포함 {template.includeConditions.length}개, 미포함 {template.excludeConditions.length}개
                      </p>
                    </div>
                    <button
                      onClick={() => setDeleteConfirm(template.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 템플릿 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={deleteConfirm !== null}
        title="템플릿 삭제"
        message="이 템플릿을 삭제하시겠습니까?"
        confirmText="삭제"
        cancelText="취소"
        onConfirm={handleDeleteTemplate}
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
              <p className="text-gray-400 mb-2">{detailModal.channelTitle}</p>

              {/* 별점 & Hype */}
              <div className="flex items-center gap-4 mb-4">
                {detailModal.rating && (
                  <div className="flex items-center gap-1">
                    <Star size={18} className="fill-yellow-400 text-yellow-400" />
                    <span>{detailModal.rating}/5</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-green-400">
                    <ThumbsUp size={16} />
                    {detailModal.hypeUp || 0}
                  </span>
                  <span className="flex items-center gap-1 text-red-400">
                    <ThumbsDown size={16} />
                    {detailModal.hypeDown || 0}
                  </span>
                </div>
              </div>

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

              {/* 코멘트 */}
              {detailModal.comments.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">코멘트</h4>
                  <div className="space-y-2">
                    {detailModal.comments.map((comment, index) => (
                      <p key={index} className="text-sm text-gray-300 p-2 bg-gray-700/50 rounded">
                        {comment}
                      </p>
                    ))}
                  </div>
                </div>
              )}

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
              {!detailModal.comments.length && !detailModal.topics?.length && !detailModal.tags?.length && (
                <p className="text-gray-500 text-sm">추가 정보 없음</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Search
