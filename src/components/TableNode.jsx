import React from 'react'
import { Handle, Position } from 'reactflow'
import './TableNode.css'

function TableNode({ data }) {
  const { label, tableKey } = data

  // 解析数据库和表名
  const parts = tableKey.split('.')
  const database = parts[0] || ''
  const tableName = parts[1] || tableKey

  return (
    <div className="table-node">
      <Handle type="target" position={Position.Right} style={{ opacity: 0 }} />

      <div className="table-content">
        <div className="table-icon">🗂️</div>
        <div className="table-info">
          <div className="table-database">{database}</div>
          <div className="table-name">{tableName}</div>
        </div>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export default TableNode
