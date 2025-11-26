import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Music, Star, Trash2, RefreshCw, Settings, X } from 'lucide-react'
import { useState } from 'react'
import type { VideoItem } from '../types/electron'
import AlertModal from './AlertModal'

interface LayoutProps {
  onSync?: () => void
}

interface UnsyncedDialogState {
  show: boolean
  unsynced: VideoItem[]
  added: VideoItem[]
  totalFetched: number
}

function Layout({ onSync }: LayoutProps) {
  const navigate = useNavigate()
  const [syncing, setSyncing] = useState(false)
  const [unsyncedDialog, setUnsyncedDialog] = useState<UnsyncedDialogState>({
    show: false,
    unsynced: [],
    added: [],
    totalFetched: 0,
  })
  const [alertModal, setAlertModal] = useState<{
    show: boolean
    title: string
    message: string
    type: 'info' | 'success' | 'error'
  }>({ show: false, title: '', message: '', type: 'info' })

  const showAlert = (title: string, message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setAlertModal({ show: true, title, message, type })
  }

  const navItems = [
    { to: '/', icon: Music, label: '음악 목록' },
    { to: '/evaluate', icon: Star, label: '평가하기' },
    { to: '/trash', icon: Trash2, label: '휴지통' },
    { to: '/settings', icon: Settings, label: '설정' },
  ]

  const handleSync = async () => {
    if (syncing) return

    setSyncing(true)
    try {
      const result = await window.electronAPI.syncYoutube()
      if (result.success) {
        if (result.needsConfirmation && result.unsynced && result.unsynced.length > 0) {
          // 좋아요 해제 항목 발견 - 다이얼로그 표시
          setUnsyncedDialog({
            show: true,
            unsynced: result.unsynced,
            added: result.added || [],
            totalFetched: result.totalFetched || 0,
          })
        } else {
          onSync?.()
          const addedCount = result.added?.length || 0
          let message = `총 ${result.data?.items.length || 0}개 항목`
          if (addedCount > 0) message += ` (새로 추가: ${addedCount}개)`
          showAlert('동기화 완료', message, 'success')
        }
      } else {
        showAlert('동기화 실패', result.error || '알 수 없는 오류', 'error')
      }
    } catch (error) {
      showAlert('동기화 오류', String(error), 'error')
    } finally {
      setSyncing(false)
    }
  }

  const handleBatchChoice = async (action: 'keep_all' | 'delete_all' | 'individual') => {
    const unsyncedCount = unsyncedDialog.unsynced.length
    setUnsyncedDialog({ show: false, unsynced: [], added: [], totalFetched: 0 })

    if (action === 'individual') {
      // 개별 처리: 다이얼로그 닫고 목록으로 이동
      onSync?.()
      navigate('/')
      return
    }

    setSyncing(true)
    try {
      const result = await window.electronAPI.confirmSync(action)
      if (result.success) {
        onSync?.()
        const actionText = action === 'keep_all' ? '유지됨' : '삭제됨'
        showAlert('처리 완료', `좋아요 해제 항목 ${unsyncedCount}개 ${actionText}`, 'success')
      } else {
        showAlert('처리 실패', result.error || '알 수 없는 오류', 'error')
      }
    } catch (error) {
      showAlert('처리 오류', String(error), 'error')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* 사이드바 */}
      <aside className="w-64 bg-gray-800 p-4 flex flex-col">
        <h1 className="text-xl font-bold mb-8 px-2">Control My Taste</h1>

        <nav className="flex-1">
          <ul className="space-y-2">
            {navItems.map(({ to, icon: Icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`
                  }
                >
                  <Icon size={20} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* 동기화 버튼 */}
        <button
          onClick={handleSync}
          disabled={syncing}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors mt-4 ${
            syncing
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          <RefreshCw size={20} className={syncing ? 'animate-spin' : ''} />
          {syncing ? '동기화 중...' : 'YouTube 동기화'}
        </button>
      </aside>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>

      {/* 좋아요 해제 항목 처리 다이얼로그 */}
      {unsyncedDialog.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">좋아요 해제된 항목 발견</h2>
              <button
                onClick={() => setUnsyncedDialog({ show: false, unsynced: [], added: [], totalFetched: 0 })}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <p className="text-gray-300 mb-4">
              YouTube에서 좋아요를 해제한 {unsyncedDialog.unsynced.length}개 항목이 발견되었습니다.
              이 항목들을 어떻게 처리할까요?
            </p>

            {/* 해제된 항목 목록 (최대 5개) */}
            <div className="bg-gray-700 rounded-lg p-3 mb-4 max-h-40 overflow-auto">
              <p className="text-sm text-gray-400 mb-2">좋아요 해제된 항목:</p>
              {unsyncedDialog.unsynced.slice(0, 5).map((item) => (
                <div key={item.youtubeId} className="flex items-center gap-2 py-1">
                  <img
                    src={item.thumbnailUrl}
                    alt=""
                    className="w-10 h-10 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{item.title}</p>
                    <p className="text-xs text-gray-400 truncate">{item.channelTitle}</p>
                  </div>
                </div>
              ))}
              {unsyncedDialog.unsynced.length > 5 && (
                <p className="text-sm text-gray-400 mt-2">
                  ... 외 {unsyncedDialog.unsynced.length - 5}개
                </p>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-400 mb-2">일괄 처리</p>
              <button
                onClick={() => handleBatchChoice('keep_all')}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                전체 목록에 남기기
              </button>
              <button
                onClick={() => handleBatchChoice('delete_all')}
                className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                전체 목록에서 삭제
              </button>

              <div className="border-t border-gray-600 pt-3 mt-3">
                <p className="text-sm text-gray-400 mb-2">개별 처리</p>
                <button
                  onClick={() => handleBatchChoice('individual')}
                  className="w-full py-3 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  목록에서 개별 처리하기
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  음악 목록에서 각 항목의 동기화 아이콘을 클릭하여 개별 처리할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 알림 모달 */}
      <AlertModal
        isOpen={alertModal.show}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal({ ...alertModal, show: false })}
      />
    </div>
  )
}

export default Layout
