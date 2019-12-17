import React, {
  useEffect,
  createContext,
  useContext,
  useReducer,
  useCallback
} from "react";
import hotkeys from "hotkeys-js";
import { Badge } from "@material-ui/core";
import { detect } from "detect-browser";
hotkeys.filter = event => {
  return true;
};
const browser = detect();
const isWindows = browser && browser.os === "windows";
const context = createContext([{}, () => {}]);
const { Provider } = context;
const reduceScopes = (scopes, { scope, value, action }) => {
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
            //if (oldStatus.startsWith("disabled_"))
            return {
              ...o,
              [thisScope]: "enabled" //oldStatus.substring("disabled_".length)
            };
          }
          return o;
        },
        { base: "enabled" }
      );
    default:
      return { ...scopes, [scope]: value };
  }
};
const KeyboardScopeProvider = ({ children }) => {
  const value = useReducer(reduceScopes, {});
  return <Provider value={value}>{children}</Provider>;
};
const useKeyboardScopes = () => {
  const [scopes, updateScopes] = useContext(context);
  const enable = useCallback(
    scope => updateScopes({ scope, value: "enabled" }),
    [updateScopes]
  );
  const disable = useCallback(
    scope => updateScopes({ scope, value: "disabled_" }),
    [updateScopes]
  );
  const enableOthers = useCallback(
    scope => updateScopes({ action: "enableOthers", scope }),
    [updateScopes]
  );
  const disableOthers = useCallback(
    scope => updateScopes({ action: "disableOthers", scope }),
    [updateScopes]
  );
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
  //switch up the keymap
  if (windowsKeyMap && isWindows) keyMap = windowsKeyMap;
  if (macKeyMap && !isWindows) keyMap = macKeyMap;
  if (
    enabled &&
    scope &&
    scopes[scope] &&
    scopes[scope].startsWith("disabled")
  ) {
    enabled = false;
  }
  useEffect(() => {
    if (keyMap === null) return;
    if (enabled) hotkeys(keyMap, { keyUp: true }, action);
    else hotkeys.unbind(keyMap);
    return () => {
      if (keyMap) hotkeys.unbind(keyMap);
    };
  }, [action, keyMap, enabled]);
  const badgeContent =
    keyMap &&
    keyMap
      .replace("command", "⌘")
      .replace("option", "⌥")
      .replace("shift", "⇧")
      .replace("enter", "↩︎")
      .replace("return", "↩︎");
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