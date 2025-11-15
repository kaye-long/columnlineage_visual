import React, { useState } from 'react'
import FileUploader from './components/FileUploader'
import LineageGraph from './components/LineageGraph'
import './App.css'

function App() {
  const [lineageData, setLineageData] = useState(null)
  const [selectedTable, setSelectedTable] = useState('')
  const [availableTables, setAvailableTables] = useState([])

  const handleDataLoaded = (data, tables) => {
    setLineageData(data)
    setAvailableTables(tables)
    if (tables.length > 0) {
      setSelectedTable(tables[0])
    }
  }

  return (
    <div className="app">
      <div className="header">
        <h1>字段血缘可视化工具</h1>
        <FileUploader onDataLoaded={handleDataLoaded} />
      </div>

      {lineageData && (
        <div className="controls">
          <label>
            选择表:
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
            >
              {availableTables.map(table => (
                <option key={table} value={table}>{table}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="graph-container">
        {lineageData && selectedTable ? (
          <LineageGraph
            lineageData={lineageData}
            initialTable={selectedTable}
          />
        ) : (
          <div className="placeholder">
            <p>请上传Excel文件以开始</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
