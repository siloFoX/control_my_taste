function Trash() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">휴지통</h2>

      {/* 임시 메시지 */}
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>삭제된 항목이 없습니다</p>
      </div>
    </div>
  )
}

export default Trash
