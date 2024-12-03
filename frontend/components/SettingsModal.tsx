import { useState } from "react";
import SettingsModal from "./Modal";
import UserSettings from "./UserSettings";
import useUserSlice from "../store/userSlice";

/**
 * Opens the settings modal and manages its state.
 *
 * @returns An object containing a function to open the modal and the modal itself.
 */
export function useSettingsModal() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const userProfile = useUserSlice((state) => state.profile);

  const openSettingsModal = () => setIsModalOpen(true);

  const settingsModal = isModalOpen ? (
    <SettingsModal>
      <UserSettings
        profile={userProfile}
        onClose={() => setIsModalOpen(false)}
        onSave={() => {
          window.location.reload(); // Refresh page on save
        }}
      />
    </SettingsModal>
  ) : null;

  return { openSettingsModal, settingsModal };
}
