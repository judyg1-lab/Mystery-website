
export default function ProfileIcon({ color }) {
    return (
        <svg width="36" height="36" viewBox="0 0 100 100" style={{ filter: `drop-shadow(0 0 5px ${color})` }}>
        <circle cx="50" cy="50" r="45" stroke={color} strokeWidth="3" fill="none" strokeDasharray="15 5" />
        <circle cx="50" cy="50" r="30" stroke={color} strokeWidth="1" fill="none" />
        <circle cx="50" cy="50" r="15" fill={color} />
        </svg>
    );
}