import React, {
  useEffect,
  createContext,
  useContext,
  useReducer,
  useCallback,
  useState
} from "react";
import hotkeys from "hotkeys-js";
import { Badge } from "@material-ui/core";
import { detect } from "detect-browser";
hotkeys.filter = event => true;
const browser = detect();
const isWindows = browser && browser.os.toLowerCase().startsWith("windows");
const context = createContext([{}, () => {}]);
const { Provider } = context;
const reduceScopes = (scopes, { scope, value, action }) => {
  switch (action) {
    case "remove":
      delete scopes[scope];
      return { ...scopes };
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
            const changeTo = oldStatus.startsWith("disabled_")
              ? oldStatus.substring("disabled_".length)
              : "enabled";
            return {
              ...o,
              [thisScope]: changeTo
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
  const [thisAction, setThisAction] = useState();
  useEffect(
    () =>
      setThisAction(() => (event, handler) => {
        action(event, handler);
        event.preventDefault();
        return false;
      }),
    [action]
  );
  useEffect(() => {
    if (keyMap === null) return;
    if (!thisAction) return;
    if (enabled) hotkeys(keyMap, thisAction);
    else hotkeys.unbind(keyMap, thisAction);
    return () => {
      if (keyMap) hotkeys.unbind(keyMap, thisAction);
    };
  }, [thisAction, keyMap, enabled]);
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
      {...{ color, anchorOrigin, badgeContent }}
      invisible={!enabled}
      {...props}
    >
      {typeof children === "function"
        ? children({ action, enabled, badgeContent, keyMap })
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
