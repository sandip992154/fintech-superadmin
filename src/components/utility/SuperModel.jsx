// components/Modal.js
import ReactDOM from "react-dom";

const modalRoot = document.getElementById("portal");

export const SuperModal = ({ children, onClose }) => {
  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-slate-50/70  flex items-center justify-center z-50  "
      onClick={onClose}
    >
      <div className="relative max-w-[80vw] max-h-[90vh]">
        {/* Close button - outside the scrollable container */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 text-white bg-secondary cursor-pointer py-2 px-3 rounded z-10"
        >
          ✕
        </button>

        {/* Scrollable content container */}
        <div
          className="max-h-[90vh] overflow-y-scroll hide-scrollbar bg-slate-100 dark:bg-darkBlue text-black dark:text-adminOffWhite p-6 rounded-lg shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>,
    modalRoot
  );
};
