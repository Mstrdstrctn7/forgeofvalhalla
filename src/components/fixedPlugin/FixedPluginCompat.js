// Normalizes exports from FixedPlugin.js
import * as Mod from "./FixedPlugin.js";
const FixedPlugin = Mod.default || Mod.FixedPlugin || (() => null);
export default FixedPlugin;
export { FixedPlugin };
