import { Search } from 'lucide-react'

function MusicList() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">음악 목록</h2>

        {/* 검색 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="검색..."
            className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 w-64"
          />
        </div>
      </div>

      {/* 임시 메시지 */}
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>YouTube 동기화를 눌러 음악을 가져오세요</p>
      </div>
    </div>
  )
}

export default MusicList
