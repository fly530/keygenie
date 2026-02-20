import React from 'react';
import { Panel } from 'rsuite';
import { CgShield, CgLock, CgBookmark, CgCloud } from 'react-icons/cg';
import PageHeader from '../components/PageHeader';
import InfoSection from '../components/InfoSection';
import './Tutorial.css';

function Tutorial() {
  return (
    <div className="tutorial-page">
      <PageHeader
        icon={<CgShield />}
        title="KeyGenie 密碼精靈"
        subtitle=""
      />

      {/* 重要安全提醒 */}
      <InfoSection
        icon={<CgShield />}
        title="⚠️ 重要安全提醒"
        isWarning={true}
        warningMessage={{
          title: '主密碼（Master Password）是生成密碼的唯一憑據。',
          content: '本工具不會儲存您的主密碼，一旦遺忘將無法復原，也無法再次生成相同的密碼。請務必妥善保管。'
        }}
        items={[]}
      />

      {/* 為什麼選擇 KeyGenie？ */}
      <Panel className="glass-card" style={{ marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CgShield style={{ color: 'var(--text-primary)' }} />
          為什麼選擇 KeyGenie？
        </h2>
        <div style={{ color: 'var(--text-primary)' }}>
          <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
            <h3 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              🛡️ 極致安全：零儲存、即時生成
            </h3>
            <p style={{ margin: 0, lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              不同於傳統密碼管理員，KeyGenie 不儲存您的密碼。
            </p>
          </div>
          <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
            <h3 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              端點運算
            </h3>
            <p style={{ margin: 0, lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              所有密碼皆在您的裝置上即時計算生成。
            </p>
          </div>
          <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
            <h3 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              物理隔離
            </h3>
            <p style={{ margin: 0, lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              密碼不存在於任何伺服器，從源頭杜絕洩漏風險。
            </p>
          </div>
          <div style={{ marginBottom: '0' }}>
            <h3 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              加密演算法
            </h3>
            <p style={{ margin: 0, lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              採用軍規級 SHA-256 哈希演算法，確保結果唯一且不可逆。
            </p>
          </div>
        </div>
      </Panel>

      {/* 核心功能 */}
      <h2 style={{ marginBottom: '15px', marginTop: '10px', color: 'var(--text-primary)' }}>
        核心功能
      </h2>

      {/* 1. 智慧密碼生成 */}
      <InfoSection
        icon={<CgLock />}
        title="1. 智慧密碼生成"
        items={[
          { label: '一致性', content: '相同輸入（網站+主密碼）永遠得到相同結果，無需死記硬背。' },
          { label: '高強度', content: '自動產生 12-18 位含大小寫、數字及特殊符號的安全密碼。' }
        ]}
      />

      {/* 2. 收藏與群組管理 */}
      <InfoSection
        icon={<CgBookmark />}
        title="2. 收藏與群組管理"
        items={[
          { label: '快速填入', content: '收藏常用網站資訊，點擊即自動載入（僅紀錄標籤，不紀錄密碼）。' },
          { label: '分類管理', content: '自定義群組，讓您的帳號清單井然有序。' }
        ]}
      />

      {/* 3. 雲端同步與備份 */}
      <InfoSection
        icon={<CgCloud />}
        title="3. 雲端同步與備份"
        items={[
          { label: 'Google 備份', content: '登入 Google 帳號，即可同步您的收藏標籤至 Google Drive，更換裝置也能無縫銜接。' }
        ]}
      />

      {/* 關於隱私 */}
      <Panel className="glass-card" style={{ marginTop: '20px' }}>
        <h2 style={{ marginBottom: '15px', color: 'var(--text-primary)' }}>
          關於隱私
        </h2>
        <p style={{ margin: 0, lineHeight: '1.8', color: 'var(--text-primary)' }}>
          您的數據屬於您。我們僅在您主動選擇登入時，將非敏感的「網站標籤與帳號名稱」備份至您的私有 Google Drive，任何時候都不會觸碰您的主密碼與最終生成的密碼。
        </p>
      </Panel>
    </div>
  );
}

export default Tutorial;

