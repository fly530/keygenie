import React, { useState } from 'react';
import { Modal, Button } from 'rsuite';

export function useConfirmModal(t) {
    const [config, setConfig] = useState({
        open: false,
        title: '',
        description: '',
        onConfirm: null,
        isLoading: false
    });

    const confirmDelete = (onConfirm, title, description) => {
        setConfig({
            open: true,
            title: title || t('confirm'),
            description: description || t('deleteConfirm'),
            onConfirm,
            isLoading: false
        });
    };

    const close = () => {
        if (!config.isLoading) {
            setConfig(prev => ({ ...prev, open: false }));
        }
    };

    const handleConfirm = async () => {
        if (config.onConfirm) {
            setConfig(prev => ({ ...prev, isLoading: true }));
            try {
                await config.onConfirm();
                close();
            } catch (error) {
                console.error('Action failed:', error);
                setConfig(prev => ({ ...prev, isLoading: false }));
            }
        } else {
            close();
        }
    };

    const ConfirmModal = (
        <Modal open={config.open} onClose={close} size="xs" backdrop={config.isLoading ? 'static' : true}>
            <Modal.Header>
                <Modal.Title>{config.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {config.description}
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={close} appearance="subtle" disabled={config.isLoading}>
                    {t('cancel')}
                </Button>
                <Button onClick={handleConfirm} appearance="primary" color="red" loading={config.isLoading}>
                    {config.isLoading ? t('deleting') : t('confirm')}
                </Button>
            </Modal.Footer>
        </Modal>
    );

    return { confirmDelete, ConfirmModal };
}
