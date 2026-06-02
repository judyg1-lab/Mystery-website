import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

const COLORS = {
    gold: '#d4af37',
    accentBlue: '#4fb8d6',
    textGray: '#b0b0b0',
    border: 'rgba(255, 255, 255, 0.2)'
};
export default function BackBtn({ onClick }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            whileHover={{scale: 1.1, boxShadow: `0 0 20px ${COLORS.gold}40`}}
            onClick={onClick}
            style={{display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                    padding: '12px 25px',borderRadius: '40px',background: 'rgba(255, 255, 255, 0.02)',
                    backdropFilter: 'blur(10px)',border: `1px solid ${COLORS.gold}40`,transition: '0.3s ease'}}>
            <ChevronLeft size={20} color={COLORS.gold} />
            <span style={{fontFamily: 'Cinzel',fontSize: '0.7rem',letterSpacing: '4px',color: COLORS.gold}}>BACK</span>
        </motion.div>
    );
}