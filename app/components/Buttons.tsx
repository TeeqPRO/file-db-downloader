import React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';

type ButtonsProps = {
    type?: ButtonVariant;
    id?: string;
    text?: string;
    children?: React.ReactNode;
    onClick?: () => void;
    onMouseDown?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    className?: string;
    htmlType?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    ariaLabel?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
    primary: 'px-4 py-2 border border-(--ui-border) rounded-lg bg-(--glass-bg) backdrop-blur-md text-(--text-primary) font-medium hover:bg-(--glass-bg-hover) focus:bg-(--glass-bg-hover) transition-all hover:brightness-90',
    secondary: 'bg-(--component-bg) px-4 py-2 rounded-lg text-md font-medium text-(--text-primary) border border-(--component-border) transition-all hover:brightness-90',
    tertiary: 'font-medium text-(--text-primary) hover:text-(--text-primary) bg-transparent border-none transition-all hover:opacity-70',
    danger: 'px-3 py-2 rounded-lg border border-red-700 text-red-500 hover:bg-red-900/20 transition-all',
    ghost: 'bg-transparent border-none transition-all',
};

const Buttons = ({
    type = 'primary',
    id,
    text,
    children,
    onClick,
    onMouseDown,
    className = '',
    htmlType = 'button',
    disabled = false,
    ariaLabel,
}: ButtonsProps) => {
    const content = children ?? text;

    return (
        <button
            id={id}
            type={htmlType}
            onClick={onClick}
            onMouseDown={onMouseDown}
            disabled={disabled}
            aria-label={ariaLabel}
            className={`${variantClasses[type]} cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
            {content}
        </button>
    )
}

export default Buttons