import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Panel, Input, InputGroup, Button, Message, useToaster } from 'rsuite';
import { CgLock, CgCopy, CgCheck } from 'react-icons/cg';
import { generatePassword, DeviceIncompatibleError } from '../utils/passwordGenerator';
import { createFavorite, deleteFavorite, getLocalData } from '../services/syncService';
import { useLanguage } from '../hooks/useLanguage';
import RecordListItem from '../components/RecordListItem';
import PageHeader from '../components/PageHeader';
import './GeneratePassword.css';

const HISTORY_KEY = 'keygenie_history';

function GeneratePassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const toaster = useToaster();
  const [siteName, setSiteName] = useState('');
  const [account, setAccount] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [processingItems, setProcessingItems] = useState(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [copyFeedbackActive, setCopyFeedbackActive] = useState(false);

  useEffect(() => {
    // 从路由参数获取数据（从我的最爱页面跳转过来）
    if (location.state) {
      setSiteName(location.state.siteName || '');
      setAccount(location.state.account || '');
      // 聚焦到主密码输入框
      setTimeout(() => {
        document.getElementById('masterPassword')?.focus();
      }, 100);
    }
    loadHistory();
    loadFavorites();
  }, [location]);

  const loadHistory = () => {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        setHistory((parsed.records || []).slice(0, 10)); // 最近10笔
      }
    } catch (error) {
      console.error('加载历史记录失败:', error);
    }
  };

  const loadFavorites = () => {
    const data = getLocalData();
    setFavorites((data.favorites || []).filter(f => !f.isDeleted));
  };

  const saveHistory = (siteName, account) => {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      const records = data ? JSON.parse(data).records || [] : [];
      const now = new Date();
      const formattedDate = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;

      const newRecord = {
        siteName,
        account: account || '',
        createdDate: formattedDate,
        timestamp: now.getTime()
      };

      // 避免重复
      const existingIndex = records.findIndex(
        r => r.siteName === siteName && r.account === (account || '')
      );
      if (existingIndex !== -1) {
        records.splice(existingIndex, 1);
      }

      records.unshift(newRecord);
      localStorage.setItem(HISTORY_KEY, JSON.stringify({ records: records.slice(0, 50) }));
      loadHistory();
    } catch (error) {
      console.error('保存历史记录失败:', error);
    }
  };

  const handleGenerate = async () => {
    if (!siteName || !masterPassword) {
      toaster.push(<Message showIcon type="warning">{t('warning.enterRequired')}</Message>, { placement: 'topCenter' });
      return;
    }

    setIsGenerating(true);
    try {
      const password = await generatePassword(siteName, account, masterPassword);
      setGeneratedPassword(password);
      saveHistory(siteName, account);
    } catch (error) {
      console.error('生成密碼失敗:', error);
      if (error instanceof DeviceIncompatibleError) {
        toaster.push(<Message showIcon type="error">{t('error.deviceIncompatible')}</Message>, { placement: 'topCenter' });
      } else {
        toaster.push(<Message showIcon type="error">{t('error.generateFailed')}</Message>, { placement: 'topCenter' });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedPassword) {
      toaster.push(<Message showIcon type="warning">{t('warning.noPassword')}</Message>, { placement: 'topCenter' });
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopyFeedbackActive(true);
      setTimeout(() => setCopyFeedbackActive(false), 1000);
      toaster.push(<Message showIcon type="success">{t('success.passwordCopied')}</Message>, { placement: 'topCenter' });
    } catch (error) {
      console.error('複製失敗:', error);
      toaster.push(<Message showIcon type="error">{t('error.copyFailed')}</Message>, { placement: 'topCenter' });
    }
  };

  const handleDeleteHistory = (index) => {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      const records = data ? JSON.parse(data).records || [] : [];
      records.splice(index, 1);
      localStorage.setItem(HISTORY_KEY, JSON.stringify({ records }));
      loadHistory();
    } catch (error) {
      console.error('删除历史记录失败:', error);
    }
  };

  const handleToggleFavorite = async (record) => {
    const key = `${record.siteName}-${record.account || ''}`;

    // 防止重複點擊：如果正在處理中，直接忽略
    if (processingItems.has(key)) return;

    // 標記為處理中
    setProcessingItems(prev => {
      const newSet = new Set(prev);
      newSet.add(key);
      return newSet;
    });

    const isFav = isFavorite(record);
    const originalFavorites = [...favorites];

    // 樂觀更新 (Optimistic UI)：立即更新畫面，不等待後端
    if (isFav) {
      setFavorites(current => current.filter(
        f => !(f.siteName === record.siteName && f.account === (record.account || ''))
      ));
    } else {
      const tempFav = {
        id: 'temp-' + Date.now(),
        siteName: record.siteName,
        account: record.account || '',
        groupId: 'default',
        createdAt: new Date().toISOString()
      };
      setFavorites(current => [...current, tempFav]);
    }

    try {
      if (isFav) {
        // 移除我的最愛 (Soft Delete via service)
        const data = getLocalData();
        const target = data.favorites.find(
          f => f.siteName === record.siteName &&
            f.account === (record.account || '') &&
            !f.isDeleted
        );

        if (target) {
          await deleteFavorite(target.id);
        }
        // 不需要 loadFavorites，因為 deleteFavorite 會觸發 sync，且 UI 已經樂觀更新
      } else {
        // 添加到我的最愛 (異步操作)
        await createFavorite({
          siteName: record.siteName,
          account: record.account || '',
          groupId: 'default'
        });
        // 重新載入以獲取正確 ID (取代 temp ID)
        loadFavorites();
      }
    } catch (error) {
      console.error('操作失敗:', error);
      // 發生錯誤，回滾狀態
      setFavorites(originalFavorites);
      toaster.push(<Message showIcon type="error">{t('error.operationFailed')}</Message>, { placement: 'topCenter' });
    } finally {
      // 移除處理中狀態
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  const isFavorite = (record) => {
    return favorites.some(
      f => f.siteName === record.siteName && f.account === (record.account || '')
    );
  };

  return (
    <div className="generate-password-page">
      <PageHeader
        icon={<CgLock />}
        title={t('pageTitle')}
        subtitle={t('pageSubtitle')}
      />


      {/* 表单 */}
      <Panel className="glass-card main-form-panel">
        <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}>
          <div className="form-stack">
            <InputGroup className="custom-input-group">
              <Input
                placeholder={t('siteNamePlaceholder')}
                value={siteName}
                onChange={(value) => setSiteName(value)}
                onPressEnter={handleGenerate}
                autoComplete="off"
              />
            </InputGroup>
            <InputGroup className="custom-input-group">
              <Input
                placeholder={t('accountPlaceholder')}
                value={account}
                onChange={(value) => setAccount(value)}
                onPressEnter={handleGenerate}
                autoComplete="off"
              />
            </InputGroup>
            <InputGroup className="custom-input-group">
              <Input
                id="masterPassword"
                type="password"
                placeholder={t('masterPasswordPlaceholder')}
                value={masterPassword}
                onChange={(value) => setMasterPassword(value)}
                onPressEnter={handleGenerate}
                autoComplete="new-password"
              />
            </InputGroup>
          </div>

          <Button
            appearance="primary"
            block
            size="lg"
            className="generate-btn"
            onClick={handleGenerate}
            loading={isGenerating}
            disabled={isGenerating}
            type="submit"
          >
            <CgLock style={{ marginRight: '8px', fontSize: '1.2em' }} />
            {isGenerating ? t('generating') || '生成中...' : t('generateButton')}
          </Button>
        </form>

        {/* 生成的密码 */}
        {generatedPassword && (
          <div className="generated-password-container">
            <input
              type="text"
              value={generatedPassword}
              readOnly
              className="generated-password-input"
              autoComplete="off"
            />
            <Button
              appearance="primary"
              className={`copy-btn ${copyFeedbackActive ? 'copy-btn-success' : ''}`}
              onClick={handleCopy}
            >
              {copyFeedbackActive ? (
                <CgCheck style={{ fontSize: '22px', color: '#fff' }} />
              ) : (
                <CgCopy style={{ fontSize: '20px' }} />
              )}
            </Button>
          </div>
        )}
      </Panel>

      {/* 历史记录 */}
      {history.length > 0 && (
        <div className="history-list">
          {history.map((record, index) => (
            <RecordListItem
              key={index}
              siteName={record.siteName}
              account={record.account}
              date={record.createdDate}
              isFavorite={isFavorite(record)}
              onFavoriteClick={() => handleToggleFavorite(record)}
              onDeleteClick={() => {
                if (window.confirm(t('deleteHistoryConfirm'))) {
                  handleDeleteHistory(index);
                }
              }}
              onItemClick={() => {
                setSiteName(record.siteName);
                setAccount(record.account || '');
                setMasterPassword('');
                document.getElementById('masterPassword')?.focus();
              }}
              showDelete={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default GeneratePassword;
