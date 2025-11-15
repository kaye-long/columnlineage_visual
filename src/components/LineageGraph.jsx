import React, { useState, useEffect, useCallback } from 'react'
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType
} from 'reactflow'
import 'reactflow/dist/style.css'
import { getTableFields, getFieldUpstreams } from '../utils/dataParser'
import FieldNode from './FieldNode'
import TableNode from './TableNode'
import './LineageGraph.css'

const nodeTypes = {
  fieldNode: FieldNode,
  tableNode: TableNode
}

function LineageGraph({ lineageData, initialTable }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [expandedFields, setExpandedFields] = useState(new Set())

  // 初始化显示选中的表
  useEffect(() => {
    if (!initialTable) return

    setExpandedFields(new Set())
    buildInitialGraph(initialTable)
  }, [initialTable, lineageData])

  // 构建初始图:显示表和它的所有字段
  const buildInitialGraph = (tableKey) => {
    const fields = getTableFields(lineageData, tableKey)
    const newNodes = []
    const newEdges = []

    // 添加表节点
    const tableNode = {
      id: `table-${tableKey}`,
      type: 'tableNode',
      data: {
        label: tableKey,
        tableKey: tableKey
      },
      position: { x: 50, y: 50 },
      style: {
        width: 300
      }
    }
    newNodes.push(tableNode)

    // 添加字段节点
    fields.forEach((field, index) => {
      const fieldNode = {
        id: field.key,
        type: 'fieldNode',
        data: {
          label: field.column,
          fieldKey: field.key,
          onExpand: () => handleFieldExpand(field.key),
          isExpanded: false,
          hasUpstream: field.upstreams && field.upstreams.length > 0
        },
        position: { x: 400, y: 50 + index * 80 },
        style: {
          width: 250
        }
      }
      newNodes.push(fieldNode)

      // 连接表到字段
      newEdges.push({
        id: `edge-${tableNode.id}-${field.key}`,
        source: tableNode.id,
        target: field.key,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#b1b1b7' }
      })
    })

    setNodes(newNodes)
    setEdges(newEdges)
  }

  // 处理字段展开
  const handleFieldExpand = useCallback((fieldKey) => {
    const upstreams = getFieldUpstreams(lineageData, fieldKey)

    if (!upstreams || upstreams.length === 0) {
      return
    }

    setExpandedFields(prev => {
      const newExpanded = new Set(prev)

      if (newExpanded.has(fieldKey)) {
        // 收起:移除该字段的所有上游节点和边
        newExpanded.delete(fieldKey)
        removeUpstreamNodes(fieldKey)
      } else {
        // 展开:添加上游节点和边
        newExpanded.add(fieldKey)
        addUpstreamNodes(fieldKey, upstreams)
      }

      return newExpanded
    })
  }, [lineageData, nodes, edges])

  // 添加上游节点
  const addUpstreamNodes = (fieldKey, upstreams) => {
    const sourceNode = nodes.find(n => n.id === fieldKey)
    if (!sourceNode) return

    const newNodes = []
    const newEdges = []
    const tableGroups = new Map()

    // 按表分组上游字段
    upstreams.forEach(upstream => {
      if (!tableGroups.has(upstream.tableKey)) {
        tableGroups.set(upstream.tableKey, [])
      }
      tableGroups.get(upstream.tableKey).push(upstream)
    })

    let tableIndex = 0
    const sourceX = sourceNode.position.x
    const sourceY = sourceNode.position.y

    tableGroups.forEach((fields, tableKey) => {
      const tableNodeId = `table-${tableKey}-${fieldKey}`

      // 检查表节点是否已存在
      if (!nodes.find(n => n.id === tableNodeId)) {
        // 添加表节点
        const tableNode = {
          id: tableNodeId,
          type: 'tableNode',
          data: {
            label: tableKey,
            tableKey: tableKey
          },
          position: {
            x: sourceX - 400,
            y: sourceY + tableIndex * 200
          },
          style: {
            width: 300
          }
        }
        newNodes.push(tableNode)
      }

      // 添加字段节点
      fields.forEach((field, index) => {
        const upstreamFieldId = `${field.fieldKey}-from-${fieldKey}`

        // 检查字段节点是否已存在
        if (!nodes.find(n => n.id === upstreamFieldId)) {
          const fieldNode = {
            id: upstreamFieldId,
            type: 'fieldNode',
            data: {
              label: field.column,
              fieldKey: field.fieldKey,
              onExpand: () => handleFieldExpand(field.fieldKey),
              isExpanded: expandedFields.has(field.fieldKey),
              hasUpstream: lineageData.has(field.fieldKey) &&
                          lineageData.get(field.fieldKey).upstreams.length > 0,
              sqlFile: field.sqlFile,
              unionBranch: field.unionBranch
            },
            position: {
              x: sourceX - 700,
              y: sourceY + tableIndex * 200 + index * 80
            },
            style: {
              width: 250
            }
          }
          newNodes.push(fieldNode)

          // 连接表到字段
          newEdges.push({
            id: `edge-${tableNodeId}-${upstreamFieldId}`,
            source: tableNodeId,
            target: upstreamFieldId,
            type: 'smoothstep',
            animated: false,
            style: { stroke: '#b1b1b7' }
          })
        }

        // 连接上游字段到当前字段
        newEdges.push({
          id: `edge-${upstreamFieldId}-${fieldKey}`,
          source: upstreamFieldId,
          target: fieldKey,
          type: 'smoothstep',
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20
          },
          style: { stroke: '#1890ff', strokeWidth: 2 }
        })
      })

      tableIndex++
    })

    setNodes(prev => [...prev, ...newNodes])
    setEdges(prev => [...prev, ...newEdges])

    // 更新源节点的展开状态
    setNodes(prev => prev.map(node => {
      if (node.id === fieldKey) {
        return {
          ...node,
          data: {
            ...node.data,
            isExpanded: true
          }
        }
      }
      return node
    }))
  }

  // 移除上游节点
  const removeUpstreamNodes = (fieldKey) => {
    const nodesToRemove = new Set()
    const edgesToRemove = new Set()

    // 查找所有需要移除的边
    edges.forEach(edge => {
      if (edge.target === fieldKey && edge.source.includes('-from-')) {
        const upstreamFieldId = edge.source
        nodesToRemove.add(upstreamFieldId)
        edgesToRemove.add(edge.id)

        // 查找表节点的边
        edges.forEach(e => {
          if (e.target === upstreamFieldId) {
            edgesToRemove.add(e.id)

            // 检查表节点是否还有其他字段使用
            const tableNodeId = e.source
            const hasOtherFields = edges.some(
              edge2 => edge2.source === tableNodeId &&
                      edge2.id !== e.id &&
                      !edgesToRemove.has(edge2.id)
            )

            if (!hasOtherFields) {
              nodesToRemove.add(tableNodeId)
            }
          }
        })
      }
    })

    setNodes(prev => prev.filter(node => !nodesToRemove.has(node.id)))
    setEdges(prev => prev.filter(edge => !edgesToRemove.has(edge.id)))

    // 更新源节点的展开状态
    setNodes(prev => prev.map(node => {
      if (node.id === fieldKey) {
        return {
          ...node,
          data: {
            ...node.data,
            isExpanded: false
          }
        }
      }
      return node
    }))
  }

  return (
    <div className="lineage-graph">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'tableNode') return '#1890ff'
            return '#52c41a'
          }}
        />
      </ReactFlow>
    </div>
  )
}

export default LineageGraph
