import { useState } from "react";
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
  const closeMenu = () => {
    setOpenMenuLabel(null);
  };
  return (
    <div className={styles.menuBarButtonContainer}>
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
