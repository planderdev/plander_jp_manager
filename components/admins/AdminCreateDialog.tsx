'use client';

import { useMemo, useState } from 'react';

import { createAdminAction } from '@/actions/admins';
import PhoneInput from '@/components/PhoneInput';
import SubmitButton from '@/components/SubmitButton';
import { useI18n } from '@/lib/i18n/provider';

type CheckState = 'idle' | 'checking' | 'available' | 'unavailable' | 'error';

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export default function AdminCreateDialog() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [checkedEmail, setCheckedEmail] = useState('');
  const [checkState, setCheckState] = useState<CheckState>('idle');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const normalizedEmail = useMemo(() => normalizeEmail(email), [email]);
  const passwordMatched = password.length > 0 && password === passwordConfirm;
  const isEmailVerified = checkState === 'available' && checkedEmail === normalizedEmail;

  const emailMessage =
    checkState === 'available'
      ? t('admin.emailAvailable')
      : checkState === 'unavailable'
        ? t('admin.emailUnavailable')
        : checkState === 'error'
          ? t('admin.emailCheckFailed')
          : '';

  async function handleCheckEmail() {
    if (!normalizedEmail) {
      alert(t('admin.emailCheckRequired'));
      return;
    }

    setCheckState('checking');

    try {
      const response = await fetch(`/api/admins/check-email?email=${encodeURIComponent(normalizedEmail)}`, {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        setCheckState('error');
        return;
      }

      const result = await response.json() as { available?: boolean; email?: string };
      setCheckedEmail(result.email ?? normalizedEmail);
      setCheckState(result.available ? 'available' : 'unavailable');
    } catch {
      setCheckState('error');
    }
  }

  function handleClose() {
    setOpen(false);
    setEmail('');
    setCheckedEmail('');
    setCheckState('idle');
    setPassword('');
    setPasswordConfirm('');
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
      >
        {t('admin.new')}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={handleClose}>
          <div
            className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h3 className="text-lg font-semibold">{t('admin.new')}</h3>
              <button type="button" onClick={handleClose} className="text-2xl leading-none text-gray-500 hover:text-black">
                ×
              </button>
            </div>

            <form
              action={createAdminAction}
              className="space-y-4 p-5"
              onSubmit={(event) => {
                if (!isEmailVerified) {
                  event.preventDefault();
                  alert(t('admin.emailCheckRequired'));
                  return;
                }

                if (!passwordMatched) {
                  event.preventDefault();
                  alert(t('admin.passwordMismatch'));
                }
              }}
            >
              <input type="hidden" name="duplicate_checked_email" value={isEmailVerified ? checkedEmail : ''} />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('admin.name')}</label>
                  <input name="name" required className="w-full rounded border border-gray-400 p-2" />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">{t('admin.company')}</label>
                  <input name="company" className="w-full rounded border border-gray-400 p-2" />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">{t('admin.jobTitle')}</label>
                  <input name="title" className="w-full rounded border border-gray-400 p-2" />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">{t('common.phone')}</label>
                  <PhoneInput name="phone" />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">{t('admin.emailLogin')}</label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setEmail(nextValue);
                        if (normalizeEmail(nextValue) !== checkedEmail) {
                          setCheckState('idle');
                        }
                      }}
                      className="w-full rounded border border-gray-400 p-2"
                    />
                    <button
                      type="button"
                      onClick={handleCheckEmail}
                      disabled={checkState === 'checking'}
                      className="rounded border border-gray-400 px-4 py-2 text-sm font-medium hover:bg-gray-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                    >
                      {checkState === 'checking' ? t('common.loading') : t('admin.emailCheck')}
                    </button>
                  </div>
                  {emailMessage && (
                    <p className={`mt-2 text-sm ${checkState === 'available' ? 'text-blue-600' : 'text-red-500'}`}>
                      {emailMessage}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">{t('admin.passwordMin')}</label>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded border border-gray-400 p-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">{t('admin.passwordConfirm')}</label>
                  <input
                    name="password_confirm"
                    type="password"
                    required
                    minLength={6}
                    value={passwordConfirm}
                    onChange={(event) => setPasswordConfirm(event.target.value)}
                    className="w-full rounded border border-gray-400 p-2"
                  />
                  {passwordConfirm.length > 0 && (
                    <p className={`mt-2 text-sm ${passwordMatched ? 'text-blue-600' : 'text-red-500'}`}>
                      {passwordMatched ? t('admin.passwordMatched') : t('admin.passwordMismatch')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
                <SubmitButton>{t('common.create')}</SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
