export default function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="animate-pulse">
      <div className="space-y-3">
        {/* Header */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          {Array.from({ length: columns }).map((_, index) => (
            <div key={index} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
        
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-4 gap-4 py-3">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div 
                key={colIndex} 
                className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
                style={{ 
                  width: colIndex === 0 ? '70%' : 
                         colIndex === columns - 1 ? '40%' : '60%'
                }}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}