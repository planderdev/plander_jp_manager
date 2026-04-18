'use client';

type Props = {
  children: React.ReactNode;
  className?: string;
  message: string;
};

export default function ConfirmSubmitButton({ children, className, message }: Props) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
