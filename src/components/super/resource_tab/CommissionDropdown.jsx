import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const CommissionDropdown = ({
  commissions,
  setSelectedCommission,
  commissionDropdownOptions,
  handleCommissionOptionClick,
  scheme,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [dropUp, setDropUp] = useState(false);

  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  // Calculate position on open with better viewport awareness
  useEffect(() => {
    if (isDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 280; // Approximate height for 6 items

      // Check if there's enough space below
      const spaceBelow = viewportHeight - rect.bottom;
      const shouldDropUp =
        spaceBelow < dropdownHeight && rect.top > dropdownHeight;

      setDropUp(shouldDropUp);

      if (shouldDropUp) {
        // Position above the button
        setPosition({
          top: rect.top - dropdownHeight - 6,
          left: rect.left,
        });
      } else {
        // Position below the button
        setPosition({
          top: rect.bottom + 6,
          left: rect.left,
        });
      }
    }
  }, [isDropdownOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div className="relative inline-block">
        <button
          ref={buttonRef}
          type="button"
          className="btn-secondary whitespace-nowrap text-xs sm:text-sm"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
        >
          Commission/Charge
        </button>
      </div>

      {isDropdownOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] w-56 bg-darkBlue border border-gray-600 rounded-lg shadow-2xl"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
          >
            <div className="bg-darkBlue border-b border-gray-600 px-4 py-2.5 text-sm text-gray-300 font-medium rounded-t-lg">
              Select Commission Type
            </div>
            <div className="max-h-64 overflow-y-auto">
              {commissionDropdownOptions.map((option) => (
                <div
                  key={option.modalKey}
                  onClick={() => {
                    handleCommissionOptionClick(option.modalKey, scheme);
                    setSelectedCommission(commissions?.[option.label] || {});
                    setIsDropdownOpen(false);
                  }}
                  className="px-4 py-2.5 hover:bg-primaryBlue cursor-pointer text-white transition-colors text-sm border-b border-gray-700 last:border-b-0"
                >
                  {option.label}
                </div>
              ))}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default CommissionDropdown;
