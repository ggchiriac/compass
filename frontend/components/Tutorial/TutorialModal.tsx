import { useState } from "react";
import { Button as JoyButton } from "@mui/joy";
import { createPortal } from "react-dom";
import Image from "next/image";
import { TutorialModal } from "../Modal";
import styles from "./Tutorial.module.css";

import dashboardContent from "../../public/dashboard.json";
import calendarContent from "../../public/calendar.json";

interface TutorialProps {
  isOpen: boolean;
  onClose: () => void;
  tutorialType: "dashboard" | "calendar";
}

interface TutorialContent {
  headers: string[];
  pages: string[];
  photos: string[];
}

const tutorialContents: Record<TutorialProps["tutorialType"], TutorialContent> =
  {
    dashboard: dashboardContent,
    calendar: calendarContent,
  };

const Tutorial: React.FC<TutorialProps> = ({
  isOpen,
  onClose,
  tutorialType,
}) => {
  const [currentPage, setCurrentPage] = useState(0);

  const content = tutorialContents[tutorialType];
  const { headers, pages, photos } = content;
  const totalPages = pages.length;

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const modalContent = (
    <TutorialModal>
      <div className={styles.modal}>
        <div className={styles.header}>{headers[currentPage]}</div>
        <div className={styles.pageContent}>{pages[currentPage]}</div>
        <div className={styles.pagePhoto}>
          <div
            style={{ position: "relative", width: "65%", aspectRatio: "16/9" }}
          >
            <Image
              src={photos[currentPage]}
              alt={`Step ${currentPage + 1}`}
              fill
              style={{ objectFit: "contain" }}
              priority={currentPage === 0}
              sizes="(max-width: 768px) 100vw, 65vw"
            />
          </div>
        </div>
        <div className={styles.footer}>
          <JoyButton
            variant="soft"
            color="neutral"
            onClick={onClose}
            sx={{ ml: 2 }}
            size="md"
          >
            Close
          </JoyButton>
          <div className={styles.pagination}>
            <JoyButton
              variant="solid"
              color="neutral"
              onClick={handlePrev}
              sx={{ ml: 2 }}
              size="md"
              disabled={currentPage === 0}
            >
              Prev
            </JoyButton>
            <span>
              Page {currentPage + 1} of {totalPages}
            </span>
            <JoyButton
              variant="solid"
              color="neutral"
              onClick={handleNext}
              sx={{ ml: 2 }}
              size="md"
            >
              {currentPage < totalPages - 1 ? "Next" : "Done"}
            </JoyButton>
          </div>
        </div>
      </div>
    </TutorialModal>
  );

  return isOpen ? createPortal(modalContent, document.body) : null;
};

export default Tutorial;
