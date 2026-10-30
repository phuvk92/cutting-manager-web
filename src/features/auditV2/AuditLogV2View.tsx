import React, { useState, useEffect, useCallback } from 'react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { extractErrorMessage } from '@/utils/error'
import { AuditLogV2Dashboard } from './AuditLogV2Dashboard'
import { AuditLogV2FilterBar } from './AuditLogV2FilterBar'
import { AuditLogV2Table } from './AuditLogV2Table'
import { AuditLogV2DetailDrawer } from './AuditLogV2DetailDrawer'
import { auditV2Service } from '@/services/audit/auditV2Service'
import { AuditLogV2Filter, AuditLogV2Record, AuditLogV2Stats } from '@/types/auditV2'

export const AuditLogV2View: React.FC = () => {
  const { t } = useTranslation(['audit', 'common'])
  const [loading, setLoading] = useState<boolean>(false)
  const [statsLoading, setStatsLoading] = useState<boolean>(false)
  const [exporting, setExporting] = useState<boolean>(false)

  const [logs, setLogs] = useState<AuditLogV2Record[]>([])
  const [stats, setStats] = useState<AuditLogV2Stats | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<AuditLogV2Record | null>(null)
  const [drawerVisible, setDrawerVisible] = useState<boolean>(false)

  const [filter, setFilter] = useState<AuditLogV2Filter>({})
  const [pagination, setPagination] = useState<{ current: number; pageSize: number; total: number }>({
    current: 1,
    pageSize: 20,
    total: 0,
  })

  // Tải danh sách Audit Logs
  const fetchLogs = useCallback(
    async (currentPage: number, pageSize: number, currentFilter: AuditLogV2Filter) => {
      setLoading(true)
      try {
        const response = await auditV2Service.getLogs({
          ...currentFilter,
          page: currentPage - 1, // Spring Data 0-indexed
          size: pageSize,
        })
        setLogs(response.content || [])
        setPagination({
          current: currentPage,
          pageSize,
          total: response.totalElements || 0,
        })
      } catch (err: any) {
        console.error('Failed to load audit logs v2:', err)
        message.error(extractErrorMessage(err, t('messages.loadError', { ns: 'audit' })))
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Tải thống kê
  const fetchStats = useCallback(async (currentFilter: AuditLogV2Filter) => {
    setStatsLoading(true)
    try {
      const statsRes = await auditV2Service.getStats({
        from: currentFilter.from,
        to: currentFilter.to,
        clientId: currentFilter.clientId,
        dealerId: currentFilter.dealerId,
      })
      setStats(statsRes)
    } catch (err: any) {
      console.warn('Failed to load audit stats v2:', err)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  // Khởi tạo
  useEffect(() => {
    fetchLogs(1, pagination.pageSize, filter)
    fetchStats(filter)
  }, [fetchLogs, fetchStats])

  const handleFilterChange = (newFilter: AuditLogV2Filter) => {
    setFilter(newFilter)
    fetchLogs(1, pagination.pageSize, newFilter)
    fetchStats(newFilter)
  }

  const handleReset = () => {
    setFilter({})
    fetchLogs(1, pagination.pageSize, {})
    fetchStats({})
  }

  const handlePageChange = (page: number, pageSize: number) => {
    fetchLogs(page, pageSize, filter)
  }

  const handleRefresh = () => {
    fetchLogs(pagination.current, pagination.pageSize, filter)
    fetchStats(filter)
  }

  const handleExportCsv = async () => {
    setExporting(true)
    try {
      await auditV2Service.exportCsv(filter)
      message.success(t('messages.exportSuccess', { ns: 'audit' }))
    } catch (err: any) {
      console.error('Export CSV error:', err)
      message.error(extractErrorMessage(err, t('messages.exportError', { ns: 'audit' })))
    } finally {
      setExporting(false)
    }
  }

  const handleSelectRecord = (record: AuditLogV2Record) => {
    setSelectedRecord(record)
    setDrawerVisible(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Dashboard tổng quan thống kê */}
      <AuditLogV2Dashboard
        stats={stats}
        loading={statsLoading}
        onSelectEndpoint={(endpoint, method) => {
          const newFilter = { ...filter, endpoint, httpMethod: method }
          setFilter(newFilter)
          fetchLogs(1, pagination.pageSize, newFilter)
        }}
        onSelectClient={(clientId) => {
          const newFilter = { ...filter, clientId }
          setFilter(newFilter)
          fetchLogs(1, pagination.pageSize, newFilter)
        }}
        onSelectUser={(username) => {
          const newFilter = { ...filter, username }
          setFilter(newFilter)
          fetchLogs(1, pagination.pageSize, newFilter)
        }}
      />

      {/* 2. Bộ lọc tra cứu đa tiêu chí & Nút thao tác */}
      <AuditLogV2FilterBar
        filter={filter}
        loading={loading}
        exporting={exporting}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        onRefresh={handleRefresh}
        onExportCsv={handleExportCsv}
      />

      {/* 3. Bảng dữ liệu Audit Logs */}
      <AuditLogV2Table
        data={logs}
        loading={loading}
        pagination={pagination}
        onChange={handlePageChange}
        onSelectRecord={handleSelectRecord}
      />

      {/* 4. Drawer chi tiết bản ghi audit */}
      <AuditLogV2DetailDrawer
        record={selectedRecord}
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />
    </div>
  )
}
