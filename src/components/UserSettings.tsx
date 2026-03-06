import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, User, Camera, Lock, LogOut } from 'lucide-react';
import {
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User as FirebaseUser,
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

const inputCls =
  'w-full bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors';

interface UserSettingsProps {
  user: FirebaseUser;
  onClose: () => void;
  onSignOut: () => void;
}

export default function UserSettings({ user, onClose, onSignOut }: UserSettingsProps) {
  const [displayName, setDisplayName] = useState(user.displayName ?? '');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameSuccess, setNameSuccess] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveName = async () => {
    const name = displayName.trim();
    if (!name) {
      setNameError('Name cannot be empty');
      return;
    }
    setSavingName(true);
    setNameError('');
    setNameSuccess(false);
    try {
      await updateProfile(user, { displayName: name });
      setNameSuccess(true);
    } catch (e) {
      setNameError(e instanceof Error ? e.message : 'Failed to update name');
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    const email = user.email;
    if (!email) {
      setPasswordError('No email linked to this account');
      return;
    }
    setSavingPassword(true);
    setPasswordError('');
    setPasswordSuccess(false);
    try {
      const credential = EmailAuthProvider.credential(email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      setPasswordError(e instanceof Error ? e.message : 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) {
      setPhotoError('Please select an image file');
      return;
    }
    setUploadingPhoto(true);
    setPhotoError('');
    try {
      const storageRef = ref(storage, `users/${user.uid}/avatar`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      await updateProfile(user, { photoURL: downloadURL });
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const panelContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex justify-end"
        style={{ zIndex: 9999 }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'tween', duration: 0.25 }}
          className="relative w-full max-w-md bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-settings-title"
        >
          <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
            <h2 id="user-settings-title" className="text-lg font-bold text-gray-900 dark:text-white">
              User settings
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            {/* Profile photo */}
            <section>
              <h3 className="text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <User size={14} />
                Profile picture
              </h3>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 shrink-0 group"
                >
                  {uploadingPhoto ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Loader2 size={24} className="animate-spin text-white" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera size={24} className="text-white" />
                    </div>
                  )}
                  <img
                    src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.displayName || user.email || 'U')}`}
                    alt="Profile"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
                <div>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">Click the photo to upload or change your profile picture.</p>
                  {photoError && <p className="text-sm text-red-500 dark:text-red-400 mt-1">{photoError}</p>}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
            </section>

            {/* Display name */}
            <section>
              <h3 className="text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-3">
                Display name
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  disabled={savingName}
                  className="px-4 py-2.5 bg-accent text-white dark:text-black font-bold rounded-lg text-sm hover:bg-accent/90 disabled:opacity-50 shrink-0 flex items-center gap-2"
                >
                  {savingName ? <Loader2 size={16} className="animate-spin" /> : null}
                  Save
                </button>
              </div>
              {nameError && <p className="text-sm text-red-500 dark:text-red-400 mt-1">{nameError}</p>}
              {nameSuccess && <p className="text-sm text-green-600 dark:text-green-400 mt-1">Name updated.</p>}
            </section>

            {/* Change password */}
            <section>
              <h3 className="text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Lock size={14} />
                Change password
              </h3>
              <div className="space-y-2">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  className={inputCls}
                  autoComplete="current-password"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className={inputCls}
                  autoComplete="new-password"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className={inputCls}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={savingPassword}
                  className="w-full px-4 py-2.5 bg-accent text-white dark:text-black font-bold rounded-lg text-sm hover:bg-accent/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingPassword ? <Loader2 size={16} className="animate-spin" /> : null}
                  Update password
                </button>
              </div>
              {passwordError && <p className="text-sm text-red-500 dark:text-red-400 mt-1">{passwordError}</p>}
              {passwordSuccess && <p className="text-sm text-green-600 dark:text-green-400 mt-1">Password updated.</p>}
            </section>

            {/* Sign out */}
            <section className="pt-4 border-t border-gray-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => { onSignOut(); onClose(); }}
                className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-left text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </section>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(panelContent, document.body);
}
