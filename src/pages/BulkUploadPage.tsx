import React, { useState } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'

export const BulkUploadPage: React.FC = () => {
  const { t } = useTranslation(['bulkUpload', 'common'])
  const [dragOver, setDragOver] = useState(false)

  const batches = [
    { code: "LO-2608-04", label: "VinFast bổ sung năm 2026 — ngoại thất", count: "412", errors: "0", errColor: "#2E7D5B", progress: "100%", status: t('batches.completed'), stBg: "#E6F1EB", stColor: "#2E7D5B" },
    { code: "LO-2608-03", label: "Hyundai Santa Fe / Tucson — nội thất", count: "186", errors: "4", errColor: "#B4741E", progress: "100%", status: t('batches.warning'), stBg: "#FBF0DF", stColor: "#8A5A12" },
    { code: "LO-2608-02", label: "Mazda 2024 — window film", count: "94", errors: "0", errColor: "#2E7D5B", progress: "100%", status: t('batches.completed'), stBg: "#E6F1EB", stColor: "#2E7D5B" },
    { code: "LO-2608-01", label: "Ford Ranger biến thể độ — ngoại thất", count: "1 240", errors: "0", errColor: "#8A8983", progress: "62%", status: t('batches.running'), stBg: "#F1EDFC", stColor: "#5B2BB0" },
    { code: "LO-2607-11", label: "Kia dòng cũ 2018–2021", count: "608", errors: "37", errColor: "#C2452D", progress: "100%", status: t('batches.needsReview'), stBg: "#FAE7E3", stColor: "#A93823" }
  ]

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    message.info(t('messages.dropRecognized'))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
      />
      <div style={{ padding: '16px 24px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 296px', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ padding: 18, background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6 }}>
            <div style={{ font: "600 12.5px 'IBM Plex Sans', sans-serif" }}>{t('newBatch.title')}</div>
            <div style={{ marginTop: 4, font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#8A8983' }}>
              {t('newBatch.desc')}
            </div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                marginTop: 14,
                height: 128,
                border: dragOver ? '1.5px dashed #7C3AED' : '1.5px dashed #C9BCF0',
                borderRadius: 6,
                background: dragOver ? '#F1EDFC' : '#FBFAFF',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                cursor: 'pointer',
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 16V5" />
                <path d="M7.5 9.5 12 5l4.5 4.5" />
                <path d="M4.5 19.5h15" />
              </svg>
              <span style={{ font: "500 12px 'IBM Plex Sans', sans-serif", color: '#5B2BB0' }}>
                {t('newBatch.dropTitle')}
              </span>
              <span style={{ font: "400 11px 'IBM Plex Sans', sans-serif", color: '#8A8983' }}>
                {t('newBatch.maxPatterns')}
              </span>
            </div>
            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ font: "500 11px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>{t('newBatch.appGroup')}</span>
                <input defaultValue={t('newBatch.defaultExterior')} style={{ padding: '7px 9px', border: '1px solid #D8D7D2', borderRadius: 4, background: '#FFF', outline: 'none', font: "400 12px 'IBM Plex Sans', sans-serif", color: '#1B1B19', width: '100%' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ font: "500 11px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>{t('newBatch.scope')}</span>
                <input defaultValue={t('newBatch.defaultSystem')} style={{ padding: '7px 9px', border: '1px solid #D8D7D2', borderRadius: 4, background: '#FFF', outline: 'none', font: "400 12px 'IBM Plex Sans', sans-serif", color: '#1B1B19', width: '100%' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ font: "500 11px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>{t('newBatch.statusAfter')}</span>
                <input defaultValue={t('newBatch.defaultPending')} style={{ padding: '7px 9px', border: '1px solid #D8D7D2', borderRadius: 4, background: '#FFF', outline: 'none', font: "400 12px 'IBM Plex Sans', sans-serif", color: '#1B1B19', width: '100%' }} />
              </label>
            </div>
          </div>

          <div style={{ background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #E4E3DE', font: "600 12.5px 'IBM Plex Sans', sans-serif" }}>
              {t('table.title')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '104px 1fr 84px 76px 84px 112px', padding: '9px 16px', background: '#F1F0EC', borderBottom: '1px solid #E4E3DE', font: "600 10.5px 'IBM Plex Sans', sans-serif", letterSpacing: '0.04em', color: '#6E6D68' }}>
              <span>{t('table.code')}</span>
              <span>{t('table.content')}</span>
              <span style={{ textAlign: 'right' }}>{t('table.patterns')}</span>
              <span style={{ textAlign: 'right' }}>{t('table.errors')}</span>
              <span style={{ textAlign: 'right' }}>{t('table.progress')}</span>
              <span style={{ textAlign: 'right' }}>{t('table.status')}</span>
            </div>
            {batches.map((b) => (
              <div key={b.code} className="pcut-table-row" style={{ display: 'grid', gridTemplateColumns: '104px 1fr 84px 76px 84px 112px', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #EFEEEA', font: "400 12px 'IBM Plex Sans', sans-serif" }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6E6D68' }}>{b.code}</span>
                <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.label}</span>
                <span style={{ textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace" }}>{b.count}</span>
                <span style={{ textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace", color: b.errColor }}>{b.errors}</span>
                <span style={{ textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace", color: '#6E6D68' }}>{b.progress}</span>
                <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <span style={{ padding: '3px 9px', borderRadius: 11, background: b.stBg, font: "500 10.5px 'IBM Plex Sans', sans-serif", color: b.stColor }}>
                    {b.status}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '16px 18px', background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6 }}>
          <div style={{ font: "600 12.5px 'IBM Plex Sans', sans-serif" }}>{t('bulkTag.title')}</div>
          <div style={{ marginTop: 4, font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#8A8983' }}>
            {t('bulkTag.desc')}
          </div>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ font: "500 11px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>{t('bulkTag.selectByFilter')}</span>
              <input defaultValue={t('bulkTag.defaultFilter')} style={{ padding: '7px 9px', border: '1px solid #D8D7D2', borderRadius: 4, background: '#FFF', outline: 'none', font: "400 12px 'IBM Plex Sans', sans-serif", color: '#1B1B19', width: '100%' }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ font: "500 11px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>{t('bulkTag.fieldToEdit')}</span>
              <input defaultValue={t('bulkTag.defaultField')} style={{ padding: '7px 9px', border: '1px solid #D8D7D2', borderRadius: 4, background: '#FFF', outline: 'none', font: "400 12px 'IBM Plex Sans', sans-serif", color: '#1B1B19', width: '100%' }} />
            </label>
          </div>
          <div style={{ marginTop: 14, padding: '10px 12px', background: '#F1F0EC', borderRadius: 5, font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#35342F' }}>
            {t('bulkTag.willApply')} <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>218</span> {t('bulkTag.patternsUnit')}
          </div>
          <button style={{ marginTop: 12, width: '100%', padding: 8, border: 0, borderRadius: 5, background: '#7C3AED', cursor: 'pointer', font: "500 12px 'IBM Plex Sans', sans-serif", color: '#FFF' }}>
            {t('bulkTag.submit')}
          </button>
        </div>
      </div>
    </div>
  )
}
