import React, { useState, useEffect, createContext, useContext } from "react";
import hotkeys from "hotkeys-js";
import uuid from "uuid/v4";
import { Badge } from "@material-ui/core";
import { detect } from "detect-browser";
const browser = detect();
const isWindows = browser && browser.os === "windows";
const context = createContext({});
const { Provider } = context;
const reduceScopes = (oldValue, { scope, value, action }) => {
  switch (action) {
    case "remove":
      delete oldValue[scope];
      return { ...oldValue };
    case "disableOthers":
      return Object.entries(scopes).reduce(
        (o, [thisScope, oldStatus]) => {
          if (thisScope !== scope)
            return { ...o, [thisScope]: "disabled_" + oldStatus };
          return o;
        },
        { base: "disabled_enabled" }
      );
    case "enableOthers":
      return Object.entries(scopes).reduce(
        (o, [thisScope, oldStatus]) => {
          if (thisScope !== scope) {
            if (oldStatus.startsWith("disabled_"))
              return {
                ...o,
                [thisScope]: oldStatus.substring("disabled_".length)
              };
          }
          return o;
        },
        { base: "enabled" }
      );
    default:
      return { ...oldValue, [scope]: value };
  }
};
const KeyboardScopeProvider = ({ children }) => {
  const value = useReducer(reduceScopes, {});
  return <Provider value={value}>{children}</Provider>;
};
const useKeyboardScopes = () => {
  const [scopes, updateScopes] = useContext(context);
  const enable = scope => updateScopes({ scope, value: "enabled" });
  const disable = scope => updateScopes({ scope, value: "disabled" });
  const enableOthers = scope => updateScopes({ action: "enableOthers", scope });
  const disableOthers = scope =>
    updateScopes({ action: "disableOthers", scope });
  return { scopes, enable, disable, disableOthers, enableOthers };
};
const KeyboardBadge = ({
  scope = "base",
  enabled = true,
  action,
  keyMap,
  windowsKeyMap,
  macKeyMap,
  children,
  color = "primary",
  anchorOrigin = {
    vertical: "top",
    horizontal: "left"
  },
  style = { width: "100%" },
  ...props
}) => {
  const { scopes } = useKeyboardScopes();
  const [id, setId] = useState();
  useEffect(() => {
    setId(uuid());
  }, []);
  //switch up the keymap
  if (windowsKeyMap && isWindows) keyMap = windowsKeyMap;
  if (macKeyMap && !isWindows) keyMap = macKeyMap;
  if (enabled && scope && scopes[scope] && scopes[scope].startsWith("disabled"))
    enabled = false;
  useEffect(() => {
    if (!id) return;
    hotkeys.deleteScope(id);
    if (enabled) hotkeys(keyMap, action);
    return () => {
      hotkeys.deleteScope(id);
    };
  }, [action, keyMap, enabled]);
  const badgeContent = keyMap
    .replace("command", "⌘")
    .replace("option", "⌥")
    .replace("shift", "⇧");
  return (
    <Badge
      {...{ color, anchorOrigin, style, badgeContent }}
      invisible={!enabled}
      {...props}
    >
      {typeof children === "function"
        ? children({ action, enabled })
        : children}
    </Badge>
  );
};
const withKeyboardBadge = C => ({ enabled, action, keyMap, ...props }) => (
  <KeyboardBadge>
    <C onClick={action} {...props} />
  </KeyboardBadge>
);
export default KeyboardBadge;
export {
  withKeyboardBadge,
  KeyboardScopeProvider,
  useKeyboardScopes,
  KeyboardBadge
};
