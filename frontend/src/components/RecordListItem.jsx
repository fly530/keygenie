import React from 'react';
import { IconButton } from 'rsuite';
import { CgTrash, CgPen } from 'react-icons/cg';
import { HiStar, HiOutlineStar } from 'react-icons/hi';
import { MdDragIndicator } from 'react-icons/md';

function RecordListItem({
  siteName,
  account,
  date,
  isFavorite = false,
  onFavoriteClick,
  onDeleteClick,
  onEditClick,
  onItemClick,
  showFavorite = true,
  showDelete = true,
  showEdit = false,
  showDragHandle = false,
  dragAttributes,
  dragListeners
}) {
  return (
    <div
      className="history-item"
      onClick={onItemClick}
      style={{ cursor: onItemClick ? 'pointer' : 'default' }}
    >
      <div className="history-item-left">
        <div className="history-site-icon">
          {siteName ? siteName.charAt(0).toUpperCase() : '?'}
        </div>
      </div>

      <div className="history-item-mid">
        <div className="history-item-title">
          {siteName}
        </div>
        <div className="history-item-subtitle">
          {account && <span className="history-account">{account}</span>}
          {account && date && <span className="history-dot">•</span>}
          {date && <span className="history-date">{date}</span>}
        </div>
      </div>

      <div className="history-item-right" onClick={(e) => e.stopPropagation()}>
        {showFavorite && (
          <IconButton
            circle
            appearance="subtle"
            className="action-btn"
            icon={
              isFavorite ? (
                <HiStar style={{ color: '#FFD700', fontSize: '22px' }} />
              ) : (
                <HiOutlineStar style={{ color: 'var(--text-secondary)', fontSize: '22px' }} />
              )
            }
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteClick?.();
            }}
          />
        )}
        {showDelete && (
          <IconButton
            circle
            appearance="subtle"
            className="action-btn delete-btn"
            icon={<CgTrash style={{ fontSize: '20px' }} />}
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick?.();
            }}
          />
        )}
        {showEdit && (
          <IconButton
            circle
            appearance="subtle"
            className="action-btn"
            icon={<CgPen style={{ color: 'var(--text-primary)', fontSize: '20px' }} />}
            onClick={(e) => {
              e.stopPropagation();
              onEditClick?.();
            }}
          />
        )}
        {showDragHandle && (
          <div
            className="drag-handle"
            {...dragAttributes}
            {...dragListeners}
            style={{
              cursor: 'grab',
              padding: '8px',
              marginLeft: '4px',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-secondary)',
              transition: 'color 0.2s',
              touchAction: 'none' // 防止觸控時捲動頁面
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            <MdDragIndicator style={{ fontSize: '24px' }} />
          </div>
        )}
      </div>
    </div>
  );
}

export default RecordListItem;

