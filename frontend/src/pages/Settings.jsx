import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Panel, SelectPicker, Button, Input, Message, useToaster, Toggle, Modal } from 'rsuite';
import { CgShield, CgLock, CgBookmark, CgCopy, CgOptions, CgExport, CgImport, CgCloud, CgTrash } from 'react-icons/cg';
import { useLanguage } from '../hooks/useLanguage';
import { getAvailableLanguages } from '../utils/i18n';
import { exportAllData, importData, getLastSyncedAt, clearLocalDataAndResync } from '../services/syncService';
import { useSync } from '../contexts/SyncContext';
import { Capacitor } from '@capacitor/core';
import biometricAuth from '../utils/biometric';
import PageHeader from '../components/PageHeader';
import InfoSection from '../components/InfoSection';
import { supabase } from '../lib/supabaseClient';
import './Settings.css';

function Settings() {
  const { language, changeLanguage, t } = useLanguage();
  const { isSyncing, lastSyncedAt } = useSync();
  const toaster = useToaster();
  const [reportText, setReportText] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const fileInputRef = useRef(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState(null);
  const [isLoadingBiometric, setIsLoadingBiometric] = useState(true);

  // 自訂確認對話框狀態
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    description: '',
    onConfirm: null
  });

  const showConfirm = (title, description, onConfirm) => {
    setConfirmModal({ open: true, title, description, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmModal(prev => ({ ...prev, open: false }));
  };

  const languages = getAvailableLanguages();
  const isNative = Capacitor.isNativePlatform();

  // 检查生物识别可用性和状态
  useEffect(() => {
    const checkBiometric = async () => {
      if (!isNative) {
        setIsLoadingBiometric(false);
        return;
      }

      try {
        const available = await biometricAuth.isAvailable();
        setBiometricAvailable(available);
        
        if (available) {
          const type = await biometricAuth.getBiometryType();
          setBiometryType(type);
          const enabled = await biometricAuth.isEnabled();
          setBiometricEnabled(enabled);
        }
      } catch (error) {
        console.error('检查生物识别失败:', error);
      } finally {
        setIsLoadingBiometric(false);
      }
    };

    checkBiometric();
  }, [isNative]);

  // 切换生物识别
  const handleToggleBiometric = async (checked) => {
    if (checked) {
      // 启用生物识别，需要先验证
      const verified = await biometricAuth.verify('请验证身份以启用生物识别登录');
      if (verified) {
        const enabled = await biometricAuth.enable();
        if (enabled) {
          setBiometricEnabled(true);
          toaster.push(
            <Message type="success" duration={3000}>
              生物识别已启用
            </Message>,
            { placement: 'topCenter' }
          );
        } else {
          toaster.push(
            <Message type="error" duration={3000}>
              启用失败，请重试
            </Message>,
            { placement: 'topCenter' }
          );
        }
      } else {
        // 验证失败，保持关闭状态
        setBiometricEnabled(false);
      }
    } else {
      // 禁用生物识别
      await biometricAuth.disable();
      setBiometricEnabled(false);
      toaster.push(
        <Message type="success" duration={3000}>
          生物识别已禁用
        </Message>,
        { placement: 'topCenter' }
      );
    }
  };

  useEffect(() => {
    // 获取最后同步时间并隨 lastSyncedAt 狀態更新
    setLastSyncTime(lastSyncedAt || getLastSyncedAt());
  }, [lastSyncedAt]);

  const formatSyncTime = (timestamp) => {
    if (!timestamp) return '--';
    try {
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      return '--';
    }
  };

  // 問題回報改寫入 Supabase reports 表（已移除後端 /api/reports）
  const handleSubmitReport = async () => {
    if (!reportText.trim()) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.from('reports').insert({
        report: reportText.trim(),
        user_id: session?.user?.id ?? null
      });

      if (error) throw error;
      toaster.push(
        <Message type="success" duration={3000}>
          {t('reportSuccess') || 'Report submitted successfully'}
        </Message>,
        { placement: 'topCenter' }
      );
      setReportText('');
    } catch (error) {
      console.error('Report error:', error);
      toaster.push(
        <Message type="error" duration={3000}>
          {t('reportFailed') || 'Failed to submit report'}
        </Message>,
        { placement: 'topCenter' }
      );
    }
  };

  // 清除本地數據並從 Supabase 重新同步，執行前須確認
  const handleClearLocalData = () => {
    showConfirm(
      t('confirm') || '確認',
      t('clearLocalDataConfirm') || '確定要清除所有本地緩存的數據並重新從雲端同步嗎？',
      async () => {
        try {
          const result = await clearLocalDataAndResync();
          if (result.success) {
            toaster.push(
              <Message type="success" duration={3000}>
                {t('clearLocalDataSuccess')}
              </Message>,
              { placement: 'topCenter' }
            );
            setLastSyncTime(getLastSyncedAt());
          } else {
            throw new Error(result.message);
          }
        } catch (error) {
          console.error('Clear local data error:', error);
          toaster.push(
            <Message type="error" duration={3000}>
              {t('clearLocalDataFailed')}
            </Message>,
            { placement: 'topCenter' }
          );
        }
      }
    );
  };

  const handleExportData = () => {
    const result = exportAllData();
    if (result.success) {
      // 创建下载链接
      const blob = new Blob([result.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toaster.push(
        <Message type="success" duration={3000}>
          {t('exportSuccess')}
        </Message>,
        { placement: 'topCenter' }
      );
    } else {
      toaster.push(
        <Message type="error" duration={3000}>
          {t('exportFailed')}: {result.message}
        </Message>,
        { placement: 'topCenter' }
      );
    }
  };

  // 导入数据
  const handleImportData = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target.result;
        showConfirm(
          t('confirm') || '確認',
          t('importConfirm') || '導入數據將會覆蓋當前所有數據，確定要繼續嗎？',
          () => {
            const result = importData(jsonString);
            if (result.success) {
              toaster.push(
                <Message type="success" duration={3000}>
                  {t('importSuccess')}
                </Message>,
                { placement: 'topCenter' }
              );
              // 重新加载页面以应用导入的数据
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            } else {
              toaster.push(
                <Message type="error" duration={3000}>
                  {t('importFailed')}: {result.message}
                </Message>,
                { placement: 'topCenter' }
              );
            }
          }
        );
      } catch (error) {
        toaster.push(
          <Message type="error" duration={3000}>
            {t('importFailed')}: {error.message}
          </Message>,
          { placement: 'topCenter' }
        );
      }
    };
    reader.readAsText(file);
    // 重置 input，允许重复选择同一文件
    event.target.value = '';
  };

  return (
    <div className="settings-page">
      <PageHeader
        icon={<CgOptions />}
        title={t('settingsTitle')}
        subtitle={t('tutorialSubtitle')}
      />

      {/* 重要安全提醒 */}
      <InfoSection
        title={t('securityTitle')}
        isWarning={true}
        warningMessage={{
          title: t('securityWarningTitle'),
          content: t('securityWarningContent')
        }}
        items={[]}
      />

      {/* 同步状态 */}
      <Panel className="glass-card" style={{ marginBottom: '20px' }}>
        <div style={{ color: 'var(--text-primary)', fontSize: '14px' }}>
          {t('syncTime')}: {formatSyncTime(lastSyncTime)}
        </div>
      </Panel>

      {/* 语言设置 */}
      <Panel className="glass-card" style={{ marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '15px', color: 'var(--text-primary)', fontSize: '18px', fontWeight: 'bold' }}>
          {t('languageLabel')}
        </h2>
        <SelectPicker
          data={languages.map(lang => ({ label: lang.name, value: lang.code }))}
          value={language}
          onChange={changeLanguage}
          style={{ width: '100%' }}
          searchable={false}
          cleanable={false}
          className="language-select-picker"
        />
      </Panel>

      {/* 生物识别设置（仅移动端） */}
      {isNative && (
        <Panel className="glass-card" style={{ marginBottom: '20px' }}>
          <h2 style={{ marginBottom: '15px', color: 'var(--text-primary)', fontSize: '18px', fontWeight: 'bold' }}>
            生物识别登录
          </h2>
          {isLoadingBiometric ? (
            <div style={{ color: 'var(--text-secondary)' }}>检查中...</div>
          ) : biometricAvailable ? (
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '10px'
              }}>
                <div>
                  <div style={{ color: 'var(--text-primary)', marginBottom: '5px' }}>
                    启用生物识别登录
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {biometryType === 'fingerprint' && '使用指纹验证身份'}
                    {biometryType === 'face' && '使用面部识别验证身份'}
                    {biometryType === 'iris' && '使用虹膜识别验证身份'}
                    {!biometryType && '使用生物识别验证身份'}
                  </div>
                </div>
                <Toggle
                  checked={biometricEnabled}
                  onChange={handleToggleBiometric}
                />
              </div>
              <div style={{
                padding: '10px 15px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                marginTop: '10px'
              }}>
                启用后，应用启动或从后台恢复时将要求生物识别验证
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-secondary)' }}>
              您的设备不支持生物识别功能
            </div>
          )}
        </Panel>
      )}

      {/* 数据管理 */}
      <Panel className="glass-card" style={{ marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '15px', color: 'var(--text-primary)', fontSize: '18px', fontWeight: 'bold' }}>
          {t('dataManagement')}
        </h2>
        <div style={{
          padding: '10px 15px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '8px',
          marginBottom: '15px',
          fontSize: '14px',
          color: 'var(--text-secondary)'
        }}>
          {t('dataBackupWarning')}
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button
            appearance="primary"
            icon={<CgExport />}
            onClick={handleExportData}
          >
            {t('exportData')}
          </Button>
          <Button
            appearance="default"
            icon={<CgImport />}
            onClick={handleImportData}
          >
            {t('importData')}
          </Button>
          <Button
            appearance="default"
            icon={<CgTrash />}
            onClick={handleClearLocalData}
          >
            {t('clearLocalData')}
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </Panel>

      {/* 為什麼選擇 KeyGenie？ */}
      <Panel className="glass-card" style={{ marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '20px', color: 'var(--text-primary)', fontSize: '18px', fontWeight: 'bold' }}>
          {t('whyChooseTitle')}
        </h2>
        <div style={{ color: 'var(--text-primary)' }}>
          <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
            <h3 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {t('whyChooseItems.ultimateSecurity.title')}
            </h3>
            <p style={{ margin: 0, lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              {t('whyChooseItems.ultimateSecurity.desc')}
            </p>
          </div>
          <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
            <h3 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {t('whyChooseItems.edgeComputing.title')}
            </h3>
            <p style={{ margin: 0, lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              {t('whyChooseItems.edgeComputing.desc')}
            </p>
          </div>
          <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
            <h3 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {t('whyChooseItems.physicalIsolation.title')}
            </h3>
            <p style={{ margin: 0, lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              {t('whyChooseItems.physicalIsolation.desc')}
            </p>
          </div>
          <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
            <h3 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {t('whyChooseItems.encryption.title')}
            </h3>
            <p style={{ margin: 0, lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              {t('whyChooseItems.encryption.desc')}
            </p>
          </div>
          <div style={{ marginBottom: '0' }}>
            <h3 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {t('whyChooseItems.uniquePassword.title')}
            </h3>
            <p style={{ margin: 0, lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              {t('whyChooseItems.uniquePassword.desc')}
            </p>
          </div>
        </div>
      </Panel>

      {/* 關於隱私 */}
      <Panel className="glass-card" style={{ marginTop: '20px', marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '15px', color: 'var(--text-primary)', fontSize: '18px', fontWeight: 'bold' }}>
          {t('privacyTitle')}
        </h2>
        <p style={{ margin: 0, lineHeight: '1.8', color: 'var(--text-primary)' }}>
          {t('privacyContent')}
        </p>
        <p style={{ marginTop: '12px', marginBottom: 0 }}>
          <Link to="/privacy" style={{ color: 'var(--accent-safe)', textDecoration: 'none', fontWeight: 500 }}>
            {t('privacyPolicyLinkText')} →
          </Link>
        </p>
      </Panel>

      {/* 開源專案 */}
      <Panel className="glass-card" style={{ marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '15px', color: 'var(--text-primary)', fontSize: '18px', fontWeight: 'bold' }}>
          {t('openSourceTitle')}
        </h2>
        <p style={{ margin: 0, lineHeight: '1.8', color: 'var(--text-primary)' }}>
          <a
            href="https://github.com/fly530/keygenie"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent-safe)', textDecoration: 'none', fontWeight: 500 }}
          >
            {t('openSourceLinkText')} →
          </a>
        </p>
      </Panel>

      {/* 回报问题 */}
      <Panel className="glass-card">
        <h2 style={{ marginBottom: '15px', color: 'var(--text-primary)', fontSize: '18px', fontWeight: 'bold' }}>
          {t('reportIssue')}
        </h2>
        <Input
          as="textarea"
          rows={5}
          value={reportText}
          onChange={setReportText}
          placeholder={t('reportIssuePlaceholder')}
          style={{ marginBottom: '15px' }}
        />
        <Button
          appearance="primary"
          onClick={handleSubmitReport}
          disabled={!reportText.trim()}
        >
          {t('submitReport')}
        </Button>
      </Panel>

      {/* 統一的確認對話框 */}
      <Modal open={confirmModal.open} onClose={closeConfirm} size="xs" className="favorites-modal" backdrop="static">
        <Modal.Header>
          <Modal.Title>{confirmModal.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ color: 'var(--text-primary)' }}>
          {confirmModal.description}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={closeConfirm} appearance="subtle" style={{ backgroundColor: '#475569', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
            {t('cancel')}
          </Button>
          <Button
            onClick={() => {
              if (confirmModal.onConfirm) confirmModal.onConfirm();
              closeConfirm();
            }}
            appearance="primary"
          >
            {t('confirm')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 版本資訊 */}
      <div style={{
        textAlign: 'center',
        padding: '20px',
        color: 'var(--text-secondary)',
        fontSize: '14px'
      }}>
        <p>KeyGenie v{document.querySelector('meta[name="app-version"]')?.content || '1.0.0'}</p>
        <p style={{ fontSize: '12px', marginTop: '5px', opacity: 0.7 }}>
          © 2025 BryanSoft. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default Settings;

