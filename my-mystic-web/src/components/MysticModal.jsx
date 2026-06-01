import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';

export default function MysticModal({
    isOpen,
    onClose,
    onConfirm,
    title = "CONFIRMATION",
    message,
    confirmText = "確認",
    cancelText = "取消",
    type = "info" // danger 紅邊微光, info 紫邊微光
}) {

    const isDanger = type === "danger";
    const glowColor = isDanger ? 'rgba(255, 68, 68, 0.15)' : 'rgba(188, 19, 254, 0.15)';
    const borderColor = isDanger ? 'rgba(255, 68, 68, 0.3)' : 'rgba(188, 19, 254, 0.3)';
    const titleColor = isDanger ? '#ff4444' : '#bc13fe';

    return (
    <AnimatePresence>
        {isOpen && (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={modalStyles.modalOverlay}
            onClick={onClose}
        >
            {/* 阻止點擊卡片本體時也觸發關閉 */}
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                style={{...modalStyles.modalContentCard, borderColor: borderColor,boxShadow: `0 0 40px ${glowColor}`}}
                onClick={(e) => e.stopPropagation()}>
            <div style={modalStyles.modalHeader}>
                {isDanger ? <AlertTriangle size={24} color="#ff4444" /> : <ShieldAlert size={24} color="#bc13fe" />}
                <h3 style={{ ...modalStyles.modalTitle, color: titleColor }}>{title}</h3>
            </div>
            <p style={modalStyles.modalBodyText}>{message}</p>
            <div style={modalStyles.modalActionRow}>
                {cancelText && (
                <motion.button
                    whileHover={{ scale: 1.03, backgroundColor: 'rgba(255, 255, 255, 0.08)', boxShadow: '0 0 15px rgba(255,255,255,0.1)' }}
                    whileTap={{ scale: 0.98 }}
                    style={modalStyles.modalCancelBtn}
                    onClick={onClose}>{cancelText}
                </motion.button>)}
                <motion.button
                    whileHover={{scale: 1.03,backgroundColor: titleColor,color: '#000',boxShadow: `0 0 25px ${titleColor}`}}
                    whileTap={{ scale: 0.98 }} //when tap, slightly shrink for feedback
                    style={{...modalStyles.modalConfirmBtn,color: titleColor,borderColor: titleColor,}}
                    onClick={onConfirm}>{confirmText}
                </motion.button>
            </div>
            </motion.div>
        </motion.div>
        )}
    </AnimatePresence>
    );
}

const modalStyles = {
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(5, 2, 8, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
    modalContentCard: { width: '420px', background: 'rgba(15, 10, 20, 0.95)', border: '1px solid', borderRadius: '8px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' },
    modalHeader: { display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '12px' },
    modalTitle: { fontFamily: 'Cinzel, serif', letterSpacing: '3px', fontSize: '1.1rem', margin: 0 },
    modalBodyText: { color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', lineHeight: '1.6', letterSpacing: '1px', margin: 0 },
    modalActionRow: { display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '10px' },
    modalCancelBtn: { background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#aaa', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', letterSpacing: '1px', transition: '0.3s' },
    modalConfirmBtn: { background: 'none', border: '1px solid', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', letterSpacing: '1px', fontWeight: 'bold', transition: '0.3s' }
};