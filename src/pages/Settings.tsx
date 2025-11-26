import { useState, useEffect } from 'react'
import type { Settings } from '../types/electron'
import AlertModal from '../components/AlertModal'

function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({ keepUnlikedVideos: null })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [alertModal, setAlertModal] = useState<{
    show: boolean
    title: string
    message: string
    type: 'info' | 'success' | 'error'
  }>({ show: false, title: '', message: '', type: 'info' })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const result = await window.electronAPI.loadSettings()
      if (result.success && result.data) {
        setSettings(result.data)
      }
    } catch (error) {
      console.error('설정 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeepUnlikedChange = async (value: boolean | null) => {
    setSaving(true)
    const newSettings = { ...settings, keepUnlikedVideos: value }
    setSettings(newSettings)

    try {
      const result = await window.electronAPI.saveSettings(newSettings)
      if (!result.success) {
        setAlertModal({ show: true, title: '저장 실패', message: result.error || '알 수 없는 오류', type: 'error' })
      }
    } catch (error) {
      setAlertModal({ show: true, title: '저장 오류', message: String(error), type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">설정 로드 중...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">설정</h1>

      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">동기화 설정</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              좋아요 해제 항목 처리
            </label>
            <p className="text-sm text-gray-400 mb-3">
              YouTube에서 좋아요를 해제한 항목을 어떻게 처리할지 선택합니다.
            </p>

            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                <input
                  type="radio"
                  name="keepUnliked"
                  checked={settings.keepUnlikedVideos === null}
                  onChange={() => handleKeepUnlikedChange(null)}
                  disabled={saving}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <p className="font-medium">매번 확인하기</p>
                  <p className="text-sm text-gray-400">동기화 시 좋아요 해제 항목이 있으면 처리 방법을 물어봅니다.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                <input
                  type="radio"
                  name="keepUnliked"
                  checked={settings.keepUnlikedVideos === true}
                  onChange={() => handleKeepUnlikedChange(true)}
                  disabled={saving}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <p className="font-medium">항상 목록에 남기기</p>
                  <p className="text-sm text-gray-400">좋아요를 해제해도 앱 내 목록에서 삭제하지 않습니다.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                <input
                  type="radio"
                  name="keepUnliked"
                  checked={settings.keepUnlikedVideos === false}
                  onChange={() => handleKeepUnlikedChange(false)}
                  disabled={saving}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <p className="font-medium">항상 목록에서 삭제</p>
                  <p className="text-sm text-gray-400">좋아요를 해제하면 앱 내 목록에서도 자동으로 삭제합니다.</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {saving && (
          <p className="text-sm text-blue-400 mt-4">저장 중...</p>
        )}
      </div>

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

export default SettingsPage
