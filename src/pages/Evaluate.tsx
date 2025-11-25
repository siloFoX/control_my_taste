import { Star, SkipForward, Trash2 } from 'lucide-react'

function Evaluate() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-2xl font-bold mb-8">음악 평가</h2>

      {/* 임시 메시지 */}
      <div className="text-center text-gray-400">
        <p className="mb-4">평가할 음악이 없습니다</p>
        <p>먼저 YouTube 동기화를 해주세요</p>
      </div>
    </div>
  )
}

export default Evaluate
