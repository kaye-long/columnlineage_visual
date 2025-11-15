/**
 * 解析Excel数据,构建字段血缘关系数据结构
 */
export function parseLineageData(rows) {
  const lineageMap = new Map()
  const tablesSet = new Set()

  rows.forEach(row => {
    const targetTableKey = `${row.target_table_db}.${row.target_table_name}`
    const sourceTableKey = `${row.source_db}.${row.source_table_name}`

    tablesSet.add(targetTableKey)
    tablesSet.add(sourceTableKey)

    // 构建字段血缘关系
    const fieldKey = `${targetTableKey}.${row.target_column}`

    if (!lineageMap.has(fieldKey)) {
      lineageMap.set(fieldKey, {
        database: row.target_table_db,
        table: row.target_table_name,
        column: row.target_column,
        tableKey: targetTableKey,
        upstreams: []
      })
    }

    lineageMap.get(fieldKey).upstreams.push({
      database: row.source_db,
      table: row.source_table_name,
      column: row.source_column,
      tableKey: sourceTableKey,
      fieldKey: `${sourceTableKey}.${row.source_column}`,
      unionBranch: row.union_branch,
      sqlFile: row.sql_file
    })
  })

  return {
    lineageMap,
    tables: Array.from(tablesSet).sort()
  }
}

/**
 * 获取指定表的所有字段
 */
export function getTableFields(lineageMap, tableKey) {
  const fields = []

  for (const [fieldKey, fieldData] of lineageMap.entries()) {
    if (fieldData.tableKey === tableKey) {
      fields.push({
        key: fieldKey,
        column: fieldData.column,
        ...fieldData
      })
    }
  }

  return fields.sort((a, b) => a.column.localeCompare(b.column))
}

/**
 * 获取字段的上游依赖
 */
export function getFieldUpstreams(lineageMap, fieldKey) {
  const fieldData = lineageMap.get(fieldKey)
  return fieldData ? fieldData.upstreams : []
}
