module.exports = {
  extends: ["next/core-web-vitals", "next/typescript"],
  rules: {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": "warn", 
    "prefer-const": "warn",
    "react/no-unescaped-entities": "warn",
    "@typescript-eslint/no-empty-object-type": "warn"
  }
}