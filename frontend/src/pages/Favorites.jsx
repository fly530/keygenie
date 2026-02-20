import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Nav,
  Panel,
  Button,
  IconButton,
  Modal,
  Input,
  InputGroup,
  TagPicker,
  Message,
  useToaster
} from 'rsuite';
import { CgAdd, CgPen } from 'react-icons/cg';
import { HiStar } from 'react-icons/hi';
import SearchIcon from '@rsuite/icons/Search';
import PagePrevious from '@rsuite/icons/PagePrevious';
import PageNext from '@rsuite/icons/PageNext';
import {
  getLocalData,
  createGroup,
  updateGroup,
  deleteGroup,
  updateFavorite,
  deleteFavorite,
  fetchFromCloud,
  syncToCloud,
  fullSync,
  checkLoginStatus,
  cleanupDeletedItems,
  backgroundSync,
  processPendingSyncQueue
} from '../services/syncService';
import { useLanguage } from '../hooks/useLanguage';
import { useConfirmModal } from '../hooks/useConfirmModal';
import RecordListItem from '../components/RecordListItem';
import PageHeader from '../components/PageHeader';
import FavoriteTabContent from '../components/FavoriteTabContent';
import './Favorites.css';

// 長按偵測組件
const LongPressTitle = ({ title, onLongPress }) => {
  const [timer, setTimer] = useState(null);

  const handleStart = () => {
    const t = setTimeout(() => {
      if (typeof navigator.vibrate === 'function') {
        navigator.vibrate(50); // 震動反饋
      }
      onLongPress();
      setTimer(null);
    }, 600);
    setTimer(t);
  };

  const handleEnd = () => {
    if (timer) {
      clearTimeout(timer);
      setTimer(null);
    }
  };

  return (
    <span
      className="long-press-title"
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onTouchMove={handleEnd}
      onContextMenu={(e) => {
        // 右鍵直接觸發編輯
        e.preventDefault();
        e.stopPropagation();
        onLongPress();
      }}
      style={{ userSelect: 'none' }}
    >
      {title}
    </span>
  );
};

function Favorites() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const toaster = useToaster();
  const { confirmDelete, ConfirmModal } = useConfirmModal(t);
  const [favorites, setFavorites] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState(() => {
    // 從 localStorage 讀取上次選擇的群組
    return localStorage.getItem('keygenie_active_tab') || 'ALL';
  });
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingFavorite, setEditingFavorite] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSiteName, setEditSiteName] = useState('');
  const [editAccount, setEditAccount] = useState('');
  const [editGroupId, setEditGroupId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [tabBeforeSearch, setTabBeforeSearch] = useState(null); // 記錄搜尋前的 Tab

  // 群組操作 Modal
  const [showGroupActionModal, setShowGroupActionModal] = useState(false);
  const [selectedActionGroup, setSelectedActionGroup] = useState(null);
  const [actionGroupName, setActionGroupName] = useState('');

  // 當選中群組時，同步名稱到輸入框
  useEffect(() => {
    if (selectedActionGroup) {
      setActionGroupName(selectedActionGroup.name);
    }
  }, [selectedActionGroup]);

  // 搜尋時自動切換到 ALL Tab
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    if (value.trim() && activeTab !== 'ALL') {
      // 開始搜尋時，記錄當前 Tab 並切換到 ALL
      setTabBeforeSearch(activeTab);
      setActiveTab('ALL');
      localStorage.setItem('keygenie_active_tab', 'ALL');
    } else if (!value.trim() && tabBeforeSearch) {
      // 清空搜尋時，恢復到之前的 Tab
      setActiveTab(tabBeforeSearch);
      localStorage.setItem('keygenie_active_tab', tabBeforeSearch);
      setTabBeforeSearch(null);
    }
  };

  const navWrapperRef = useRef(null);

  const handleScroll = (direction) => {
    if (navWrapperRef.current) {
      const scrollAmount = 200;
      navWrapperRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    // 页面加载时清理已删除超过7天的记录
    cleanupDeletedItems();
    loadData();
    loadCollapsedState();
  }, []);

  const loadData = async () => {
    const data = getLocalData();
    let favoritesData = data.favorites || [];

    // 确保有默认群组
    let groupsData = data.groups || [];
    if (!groupsData.find(g => g.id === 'default')) {
      groupsData = [
        { id: 'default', name: t('defaultGroup'), createdAt: new Date().toISOString() },
        ...groupsData
      ];

      // 儲存默認群組到 localStorage
      localStorage.setItem('keygenie_data', JSON.stringify({
        favorites: favoritesData,
        groups: groupsData
      }));
    }

    setFavorites(favoritesData.filter(f => !f.isDeleted));
    setGroups(groupsData.filter(g => !g.isDeleted));

    // 如果已登录，从云端同步（后台执行）
    const isLoggedIn = await checkLoginStatus();
    if (isLoggedIn) {
      // 后台同步，不阻塞UI
      backgroundSync(async () => {
        const result = await fullSync();
        if (result.success) {
          // 更新本地状态
          const updatedData = getLocalData();
          setFavorites((updatedData.favorites || []).filter(f => !f.isDeleted));
          setGroups((updatedData.groups || []).filter(g => !g.isDeleted));
        }
        // 处理待同步队列
        await processPendingSyncQueue();
      });
    }
  };

  const loadCollapsedState = () => {
    try {
      const state = localStorage.getItem('collapsedGroups');
      if (state) {
        setCollapsedGroups(JSON.parse(state));
      }
    } catch (error) {
      console.error('加载折叠状态失败:', error);
    }
  };

  const saveCollapsedState = (state) => {
    try {
      localStorage.setItem('collapsedGroups', JSON.stringify(state));
    } catch (error) {
      console.error('保存折叠状态失败:', error);
    }
  };

  const toggleCollapse = (groupId) => {
    const newState = {
      ...collapsedGroups,
      [groupId]: !collapsedGroups[groupId]
    };
    setCollapsedGroups(newState);
    saveCollapsedState(newState);
  };

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) {
      toaster.push(<Message showIcon type="warning">{t('warning.enterGroupName')}</Message>, { placement: 'topCenter' });
      return;
    }

    const newGroup = await createGroup({ name: newGroupName.trim() });
    setGroups([...groups, newGroup]);
    setNewGroupName('');
    setShowAddGroupModal(false);
    toaster.push(<Message showIcon type="success">{t('success.groupCreated')}</Message>, { placement: 'topCenter' });
  };

  const handleEditGroup = async (groupId, newName) => {
    if (!newName.trim()) {
      toaster.push(<Message showIcon type="warning">{t('warning.enterGroupName')}</Message>, { placement: 'topCenter' });
      return;
    }

    await updateGroup(groupId, { name: newName.trim() });
    setGroups(groups.map(g => g.id === groupId ? { ...g, name: newName.trim() } : g));
    toaster.push(<Message showIcon type="success">{t('success.groupUpdated')}</Message>, { placement: 'topCenter' });
  };

  const handleDeleteGroup = async (groupId) => {
    if (groupId === 'default') {
      toaster.push(<Message showIcon type="warning">{t('warning.cannotDeleteDefault')}</Message>, { placement: 'topCenter' });
      return;
    }

    confirmDelete(async () => {
      try {
        await deleteGroup(groupId);
        // 重新加载数据以确保状态一致（包括从云端同步）
        await loadData();
        toaster.push(<Message showIcon type="success">{t('success.groupDeleted')}</Message>, { placement: 'topCenter' });
      } catch (error) {
        console.error('删除群组失败:', error);
        toaster.push(<Message showIcon type="error">{error.message || t('error.deleteFailed')}</Message>, { placement: 'topCenter' });
      }
    }, t('confirm'), t('deleteGroupConfirm'));
  };

  const handleEditFavorite = (favorite) => {
    setEditingFavorite(favorite);
    setEditSiteName(favorite.siteName);
    setEditAccount(favorite.account || '');
    setEditGroupId(favorite.groupId || 'default');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editSiteName.trim()) {
      toaster.push(<Message showIcon type="warning">{t('warning.enterSiteName')}</Message>, { placement: 'topCenter' });
      return;
    }

    await updateFavorite(editingFavorite.id, {
      siteName: editSiteName.trim(),
      account: editAccount.trim(),
      groupId: editGroupId
    });
    loadData();
    setShowEditModal(false);
    setEditingFavorite(null);
    toaster.push(<Message showIcon type="success">{t('success.updated')}</Message>, { placement: 'topCenter' });
  };

  const handleDeleteFavorite = (favoriteId) => {
    confirmDelete(() => {
      // 樂觀更新 (Optimistic UI)：立即更新畫面，不等待後端回應
      setFavorites(current => current.filter(f => f.id !== favoriteId));
      toaster.push(<Message showIcon type="success">{t('success.deleted')}</Message>, { placement: 'topCenter' });

      // 背景執行刪除與同步
      deleteFavorite(favoriteId).catch(err => {
        console.error('背景刪除失敗:', err);
        // 如果失敗，可能需要提示用戶，但為保持體驗流暢，暫時只記錄錯誤
        // 嚴重錯誤時，下一次同步會修正（或者復活該項目）
      });
    });
  };

  const handleCardClick = (favorite) => {
    navigate('/generate', {
      state: {
        siteName: favorite.siteName,
        account: favorite.account || ''
      }
    });
  };

  const getFavoritesByGroup = (groupId) => {
    const filtered = favorites.filter(f => f.groupId === groupId);
    // 按 sortOrder 排序
    return filtered.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  };

  // 取得所有最愛並排序
  const getAllFavoritesSorted = () => {
    return [...favorites].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  };

  // 搜尋過濾邏輯
  const getFilteredFavorites = (favs) => {
    if (!searchQuery.trim()) return favs;
    const query = searchQuery.toLowerCase();
    return favs.filter(f =>
      f.siteName.toLowerCase().includes(query) ||
      (f.account && f.account.toLowerCase().includes(query))
    );
  };

  // 處理排序結束事件
  const handleSortEnd = async ({ oldIndex, newIndex }, currentFavorites) => {
    // 建立新的陣列並移動項目
    const newFavorites = [...currentFavorites];
    const [movedItem] = newFavorites.splice(oldIndex, 1);
    newFavorites.splice(newIndex, 0, movedItem);

    // 重新計算 sortOrder
    const updatedFavorites = newFavorites.map((fav, index) => ({
      ...fav,
      sortOrder: index + 1
    }));

    // 更新本地狀態
    const allFavorites = favorites.map(f => {
      const updated = updatedFavorites.find(uf => uf.id === f.id);
      return updated || f;
    });
    setFavorites(allFavorites);

    // 批次更新到後端
    try {
      for (const fav of updatedFavorites) {
        await updateFavorite(fav.id, { sortOrder: fav.sortOrder });
      }
      toaster.push(<Message showIcon type="success">排序已儲存</Message>, { placement: 'topCenter' });
    } catch (error) {
      console.error('儲存排序失敗:', error);
      toaster.push(<Message showIcon type="error">排序儲存失敗</Message>, { placement: 'topCenter' });
      // 失敗時重新載入資料
      loadData();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    } catch (error) {
      return '';
    }
  };

  return (
    <div className="favorites-page">
      <PageHeader
        icon={<HiStar />}
        title={t('favoritesTitle')}
        subtitle={t('favoritesSubtitle')}
      />

      {/* 搜尋框 */}
      <div style={{ marginBottom: '20px' }}>
        <InputGroup inside size="lg">
          <InputGroup.Addon>
            <SearchIcon />
          </InputGroup.Addon>
          <Input
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </InputGroup>
      </div>

      <div className="nav-scroll-container" style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <IconButton
          icon={<PagePrevious />}
          appearance="subtle"
          onClick={() => handleScroll('left')}
          className="scroll-btn"
          style={{ marginRight: '5px' }}
        />

        <div
          className="nav-wrapper"
          ref={navWrapperRef}
          style={{
            overflowX: 'auto',
            flex: 1,
            whiteSpace: 'nowrap',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Nav
            className="favorites-tabs-nav"
            activeKey={activeTab}
            onSelect={(key) => {
              if (key !== 'add-btn-placeholder') {
                setActiveTab(key);
                localStorage.setItem('keygenie_active_tab', key);
              }
            }}
            appearance="subtle"
            style={{ display: 'flex', flexWrap: 'nowrap', width: '100%' }}
          >
            <Nav.Item eventKey="ALL"><span className="tab-label">ALL</span></Nav.Item>

            {/* 自定義群組 */}
            {groups.filter(g => g.id !== 'default').map((group) => (
              <Nav.Item key={group.id} eventKey={group.id}>
                <LongPressTitle
                  title={group.name}
                  onLongPress={() => {
                    setSelectedActionGroup(group);
                    setShowGroupActionModal(true);
                  }}
                />
              </Nav.Item>
            ))}

            {/* 未分組 (Default) */}
            {groups.filter(g => g.id === 'default').map((group) => (
              <Nav.Item key={group.id} eventKey={group.id}>
                <LongPressTitle
                  title={group.name}
                  onLongPress={() => {
                    setSelectedActionGroup(group);
                    setShowGroupActionModal(true);
                  }}
                />
              </Nav.Item>
            ))}

            {/* 新增按鈕 */}
            <Nav.Item
              eventKey="add-btn-placeholder"
              style={{ flexShrink: 0 }}
              onClick={(e) => {
                setEditingGroup(null);
                setNewGroupName('');
                setShowAddGroupModal(true);
              }}
            >
              <div className="add-tab-btn-wrapper"><CgAdd /></div>
            </Nav.Item>
          </Nav>
        </div>

        <IconButton
          icon={<PageNext />}
          appearance="subtle"
          onClick={() => handleScroll('right')}
          className="scroll-btn"
          style={{ marginLeft: '5px' }}
        />
      </div>

      {/* 內容區域 */}
      <div style={{ marginTop: '20px' }}>
        {activeTab === 'ALL' && (
          <FavoriteTabContent
            favorites={getFilteredFavorites(getAllFavoritesSorted())}
            onEdit={handleEditFavorite}
            onDelete={handleDeleteFavorite}
            onClick={handleCardClick}
            onSortEnd={(params) => handleSortEnd(params, getAllFavoritesSorted())}
            emptyMessage={searchQuery ? '沒有找到符合的結果' : t('noFavorites')}
            formatDate={formatDate}
          />
        )}

        {groups.map(group => {
          if (activeTab === group.id) {
            return (
              <FavoriteTabContent
                key={group.id}
                favorites={getFilteredFavorites(getFavoritesByGroup(group.id))}
                onEdit={handleEditFavorite}
                onDelete={handleDeleteFavorite}
                onClick={handleCardClick}
                onSortEnd={(params) => handleSortEnd(params, getFavoritesByGroup(group.id))}
                emptyMessage={searchQuery ? '沒有找到符合的結果' : t('noFavorites')}
                formatDate={formatDate}
              />
            );
          }
          return null;
        })}
      </div>

      {/* 新增群组模态框 */}
      <Modal open={showAddGroupModal} onClose={() => setShowAddGroupModal(false)} className="favorites-modal" backdrop="static">
        <Modal.Header>
          <Modal.Title>{t('addGroup')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Input
            value={newGroupName}
            onChange={setNewGroupName}
            onPressEnter={handleAddGroup}
            autoFocus
            placeholder={t('enterGroupName')}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            onClick={() => setShowAddGroupModal(false)}
            appearance="subtle"
            style={{ backgroundColor: '#475569', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            {t('cancel')}
          </Button>
          <Button onClick={handleAddGroup} appearance="primary">
            {t('confirm')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 编辑我的最爱模态框 */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} className="favorites-modal" backdrop="static">
        <Modal.Body>
          <div style={{ marginBottom: '15px' }}>
            <label className="modal-label">{t('siteNamePlaceholder')}</label>
            <InputGroup>
              <Input
                placeholder={t('siteNamePlaceholder')}
                value={editSiteName}
                onChange={setEditSiteName}
              />
            </InputGroup>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label className="modal-label">{t('accountPlaceholder')}</label>
            <InputGroup>
              <Input
                placeholder={t('accountPlaceholder')}
                value={editAccount}
                onChange={setEditAccount}
              />
            </InputGroup>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label className="modal-label">{t('selectGroup')}</label>
            <TagPicker
              data={groups.map(g => ({ label: g.name, value: g.id }))}
              value={editGroupId ? [editGroupId] : []}
              onChange={(value) => {
                // 單選邏輯：如果選了新的，就只保留新的 (最後一個)
                if (value.length > 0) {
                  setEditGroupId(value[value.length - 1]);
                } else {
                  // 如果清空了，可以設為 default 或是空字串，視需求而定。
                  // 這裡設為預設群組 'default' 防止完全為空, 或者允許為空。
                  // 原本 SelectPicker 有 cleanable={false}，這裡我們維持至少一個比較安全
                  setEditGroupId('default');
                }
              }}
              placeholder={t('selectGroup')}
              style={{ width: '100%' }}
              cleanable={false}
              searchable={false}
              popupClassName="dark-picker-popup"
              tagProps={{
                // 自訂 Tag 樣式，使其融入黑色主題
                color: 'green',
                style: { borderRadius: '12px', fontWeight: 'bold' }
              }}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Button
              color="red"
              appearance="ghost"
              onClick={() => {
                setShowEditModal(false);
                handleDeleteFavorite(editingFavorite.id);
              }}
              style={{ color: '#ff4d4f', borderColor: '#ff4d4f' }}
            >
              {t('delete')}
            </Button>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button
                onClick={() => setShowEditModal(false)}
                appearance="subtle"
                style={{ backgroundColor: '#475569', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                {t('cancel')}
              </Button>
              <Button onClick={handleSaveEdit} appearance="primary">
                {t('save')}
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </Modal>
      <Modal open={showGroupActionModal} onClose={() => setShowGroupActionModal(false)} className="favorites-modal" backdrop="static" size="xs">
        <Modal.Header>
          <Modal.Title>{t('editGroup') || '編輯群組'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ padding: '10px 0' }}>
            <Input
              value={actionGroupName}
              onChange={setActionGroupName}
              placeholder={t('enterGroupName') || '輸入群組名稱'}
              autoFocus
              onPressEnter={() => {
                if (!actionGroupName.trim()) {
                  toaster.push(<Message showIcon type="warning">{t('warning.enterGroupName')}</Message>, { placement: 'topCenter' });
                  return;
                }
                if (selectedActionGroup) {
                  handleEditGroup(selectedActionGroup.id, actionGroupName);
                  setShowGroupActionModal(false);
                }
              }}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            {/* Left: Delete (if not default) */}
            <div>
              {selectedActionGroup?.id !== 'default' && (
                <Button onClick={() => {
                  setShowGroupActionModal(false);
                  confirmDelete(
                    async () => {
                      if (selectedActionGroup?.id) {
                        try {
                          await deleteGroup(selectedActionGroup.id);
                          // 重新加载数据以确保状态一致（包括从云端同步）
                          await loadData();
                          toaster.push(<Message type="success">{t('deleteSuccess')}</Message>);
                        } catch (error) {
                          console.error('删除群组失败:', error);
                          toaster.push(<Message type="error">{error.message || t('error.deleteFailed')}</Message>);
                        }
                      }
                    },
                    t('deleteGroup') || '刪除群組',
                    t('deleteGroupConfirm') || '確定要刪除此群組嗎？群組內的項目將會移動到「未分組」。'
                  );
                }} appearance="ghost" color="red" style={{ color: '#ff4d4f', borderColor: '#ff4d4f' }}>
                  {t('delete') || '刪除'}
                </Button>
              )}
            </div>

            {/* Right: Save & Cancel */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button
                onClick={() => setShowGroupActionModal(false)}
                appearance="subtle"
                style={{ backgroundColor: '#475569', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                {t('cancel')}
              </Button>
              <Button onClick={() => {
                if (!actionGroupName.trim()) {
                  toaster.push(<Message showIcon type="warning">{t('warning.enterGroupName')}</Message>, { placement: 'topCenter' });
                  return;
                }
                if (selectedActionGroup) {
                  handleEditGroup(selectedActionGroup.id, actionGroupName);
                  setShowGroupActionModal(false);
                }
              }} appearance="primary">
                {t('save') || '儲存'}
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </Modal>

      {/* 刪除確認對話框 */}
      {ConfirmModal}
    </div >
  );
}

export default Favorites;
