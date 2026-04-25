'use client';
import FormActionButton from '@/components/FormActionButton';

type Props = {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
  message: string;
};

export default function ConfirmSubmitButton({ children, className, pendingText, message }: Props) {
  return (
    <FormActionButton
      className={className}
      pendingText={pendingText}
      confirmMessage={message}
    >
      {children}
    </FormActionButton>
  );
}
