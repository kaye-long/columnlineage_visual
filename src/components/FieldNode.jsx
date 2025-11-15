import React from 'react'
import { Handle, Position } from 'reactflow'
import './FieldNode.css'

function FieldNode({ data }) {
  const { label, onExpand, isExpanded, hasUpstream, sqlFile, unionBranch } = data

  return (
    <div className={`field-node ${isExpanded ? 'expanded' : ''}`}>
      <Handle type="target" position={Position.Right} />

      <div className="field-content">
        <div className="field-header">
          <span className="field-icon">📄</span>
          <span className="field-label">{label}</span>
        </div>

        {(sqlFile || unionBranch) && (
          <div className="field-meta">
            {sqlFile && (
              <div className="meta-item" title={sqlFile}>
                <span className="meta-label">SQL:</span>
                <span className="meta-value">{sqlFile}</span>
              </div>
            )}
            {unionBranch && (
              <div className="meta-item">
                <span className="meta-label">分支:</span>
                <span className="meta-value">{unionBranch}</span>
              </div>
            )}
          </div>
        )}

        {hasUpstream && (
          <button
            className="expand-button"
            onClick={(e) => {
              e.stopPropagation()
              onExpand()
            }}
          >
            {isExpanded ? '收起上游 ▲' : '展开上游 ▼'}
          </button>
        )}
      </div>

      <Handle type="source" position={Position.Left} />
    </div>
  )
}

export default FieldNode
