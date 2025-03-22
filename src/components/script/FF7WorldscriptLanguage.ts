import { LRLanguage, LanguageSupport } from "@codemirror/language";
import { parser } from "../../lib/worldscript-parser.js"; // Generated parser
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";

// Define the language
const ff7scriptLanguage = LRLanguage.define({
  parser: parser,
  languageData: {
    // Optional: Add if you need autocomplete, indentation, etc.
  },
});

// Custom highlight style
const ff7scriptHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: "purple" },
  { tag: tags.operator, color: "blue" },
  { tag: tags.number, color: "green" },
  { tag: tags.name, color: "orange" }, // Namespaces
  { tag: tags.function, color: "blue" }, // Functions
  { tag: tags.constant, color: "red" }, // Constants
  { tag: tags.propertyName, color: "brown" }, // Properties
  { tag: tags.labelName, color: "pink" }, // Labels
  { tag: tags.punctuation, color: "gray" },
]);

// Export LanguageSupport function
export function ff7WorldscriptLanguage() {
  return new LanguageSupport(ff7scriptLanguage, [
    syntaxHighlighting(ff7scriptHighlightStyle),
  ]);
}