import { useCallback, useEffect, useState, useRef } from "react";
import styles from "./MenuBar.module.css";
import cx from "classnames";

type Options = OptionGroup[];

type OptionGroup = {
  label: string;
  items: (Option | null)[];
};

type Option = {
  label: string;
  onClick: () => void;
};

export function MenuBar({ options }: { options: Options }) {
  const [openMenuLabel, setOpenMenuLabel] = useState<string | null>(null);
  if (!options.length) return null;

  return (
    <div className={styles.menuBar}>
      {options.map((optionGroup) => (
        <MenuBarButton
          key={optionGroup.label}
          optionGroup={optionGroup}
          openMenuLabel={openMenuLabel}
          setOpenMenuLabel={setOpenMenuLabel}
        />
      ))}
    </div>
  );
}

function MenuBarButton({
  optionGroup,
  openMenuLabel,
  setOpenMenuLabel,
}: {
  optionGroup: OptionGroup;
  openMenuLabel: string | null;
  setOpenMenuLabel: (label: string | null) => void;
}) {
  const closeMenu = useCallback(() => {
    setOpenMenuLabel(null);
  }, [setOpenMenuLabel]);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        closeMenu();
      }
    };

    const handleBlur = () => {
      closeMenu();
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("blur", handleBlur);
    };
  }, [closeMenu]);

  return (
    <div className={styles.menuBarButtonContainer} ref={ref}>
      <button
        className={cx(styles.menuBarButton, {
          [styles.isOpen]: openMenuLabel === optionGroup.label,
        })}
        onClick={() =>
          setOpenMenuLabel(
            openMenuLabel === optionGroup.label ? null : optionGroup.label
          )
        }
      >
        {optionGroup.label}
      </button>
      {openMenuLabel === optionGroup.label && (
        <MenuBarDropdown optionGroup={optionGroup} closeMenu={closeMenu} />
      )}
    </div>
  );
}

function MenuBarDropdown({
  optionGroup,
  closeMenu,
}: {
  optionGroup: OptionGroup;
  closeMenu: () => void;
}) {
  return (
    <div className={cx(styles.menuBarDropdown, "window")}>
      {optionGroup.items.map(
        (item) =>
          item && (
            <button
              key={item.label}
              onClick={() => {
                item.onClick();
                closeMenu();
              }}
            >
              {item.label}
            </button>
          )
      )}
    </div>
  );
}
