import React, { useRef } from 'react'
import * as XLSX from 'xlsx'
import { parseLineageData } from '../utils/dataParser'
import './FileUploader.css'

function FileUploader({ onDataLoaded }) {
  const fileInputRef = useRef(null)

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result)
        const workbook = XLSX.read(data, { type: 'array' })

        // 读取第一个sheet
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(firstSheet)

        if (rows.length === 0) {
          alert('Excel文件为空')
          return
        }

        // 验证必需的列
        const requiredColumns = [
          'target_table_db',
          'target_table_name',
          'target_column',
          'source_db',
          'source_table_name',
          'source_column'
        ]

        const firstRow = rows[0]
        const missingColumns = requiredColumns.filter(col => !(col in firstRow))

        if (missingColumns.length > 0) {
          alert(`Excel文件缺少必需的列: ${missingColumns.join(', ')}`)
          return
        }

        // 解析数据
        const { lineageMap, tables } = parseLineageData(rows)
        onDataLoaded(lineageMap, tables)

      } catch (error) {
        console.error('解析文件失败:', error)
        alert('解析文件失败,请检查文件格式')
      }
    }

    reader.readAsArrayBuffer(file)
  }

  return (
    <div className="file-uploader">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
      <button
        className="upload-button"
        onClick={() => fileInputRef.current?.click()}
      >
        上传Excel文件
      </button>
    </div>
  )
}

export default FileUploader
