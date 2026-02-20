import React from 'react';
import { Panel } from 'rsuite';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import RecordListItem from './RecordListItem';

function SortableItem({
    favorite,
    onEdit,
    onDelete,
    onClick,
    canSort,
    formatDate
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: favorite.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        marginBottom: '10px',
        opacity: isDragging ? 0.5 : 1,
        position: 'relative',
        zIndex: isDragging ? 999 : 'auto'
    };

    return (
        <div ref={setNodeRef} style={style}>
            <RecordListItem
                siteName={favorite.siteName}
                account={favorite.account}
                date={formatDate(favorite.createdAt)}
                isFavorite={true}
                onEditClick={() => onEdit(favorite)}
                onDeleteClick={() => onDelete(favorite.id)}
                onItemClick={() => onClick(favorite)}
                showFavorite={false}
                showEdit={true}
                showDelete={false}
                showDragHandle={canSort}
                dragAttributes={attributes}
                dragListeners={listeners}
            />
        </div>
    );
}

function FavoriteTabContent({
    favorites,
    onEdit,
    onDelete,
    onClick,
    onSortEnd,
    emptyMessage,
    formatDate
}) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            // 要求移動 5px 才觸發拖曳，避免誤觸點擊
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    if (favorites.length === 0) {
        return (
            <Panel style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ color: 'var(--text-secondary)' }}>{emptyMessage}</p>
            </Panel>
        );
    }

    // 只有一個項目時不啟用排序
    const canSort = favorites.length > 1;

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const oldIndex = favorites.findIndex((item) => item.id === active.id);
            const newIndex = favorites.findIndex((item) => item.id === over.id);

            if (onSortEnd) {
                onSortEnd({ oldIndex, newIndex });
            }
        }
    };

    if (!canSort) {
        return (
            <div>
                {favorites.map((favorite) => (
                    <div key={favorite.id} style={{ marginBottom: '10px' }}>
                        <RecordListItem
                            siteName={favorite.siteName}
                            account={favorite.account}
                            date={formatDate(favorite.createdAt)}
                            isFavorite={true}
                            onEditClick={() => onEdit(favorite)}
                            onDeleteClick={() => onDelete(favorite.id)}
                            onItemClick={() => onClick(favorite)}
                            showFavorite={false}
                            showEdit={true}
                            showDelete={false}
                            showDragHandle={false}
                        />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={favorites.map(f => f.id)}
                strategy={verticalListSortingStrategy}
            >
                <div>
                    {favorites.map((favorite) => (
                        <SortableItem
                            key={favorite.id}
                            favorite={favorite}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onClick={onClick}
                            canSort={canSort}
                            formatDate={formatDate}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}

export default FavoriteTabContent;
